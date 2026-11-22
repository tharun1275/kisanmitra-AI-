import { GoogleGenAI, Type } from "@google/genai";
import type { Content, FunctionDeclaration, Part } from "@google/genai";
import type {
  AdvisorResponse,
  CropReferenceEntry,
  MandiPricesResult,
  SoilProfileResult,
  ToolInvocationRecord,
  WeatherForecastResult,
} from "../src/types.ts";
import {
  getCropAdvisoryReference,
  getMandiPrices,
  getSoilProfile,
  getWeatherForecast,
} from "./tools.ts";

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is missing. Please configure it in Settings > Secrets."
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

const SYSTEM_INSTRUCTION = `
You are 'KisanMitra' (किसान मित्र), a warm, trustworthy agricultural advisor helping Indian farmers.
You MUST always:
1. Call the provided tools (get_weather_forecast, get_soil_profile, get_mandi_prices, get_crop_advisory_reference) whenever location, crop, soil, weather, sowing/harvest timing, or market prices are relevant. Never invent weather, soil, or mandi numbers.
2. Reply ONLY in the farmer's requested regional language (or the language they spoke/wrote in if not specified).
3. Use VERY SIMPLE, everyday spoken-style words that a farmer can understand easily when read aloud. Avoid technical jargon (explain soil pH simply in their language, e.g., slightly acidic or alkaline).
4. Structure your advice clearly with these exact 4 concise sections using bold headings (translated to the target language if needed, or clean natural headers):
   - Weather & Timing (best time to plant, irrigate, spray, or harvest based on the 7-day forecast—e.g. warn not to spray before rain)
   - Soil & Crop Suggestion (match crop to local soil & moisture)
   - Crop Protection (natural/IPM steps first, safe spraying rules)
   - Mandi Tip (current prices in INR/quintal and whether to sell or wait if prices/weather suggest)
5. Keep total response concise (around 120-200 words) so it sounds natural when read aloud as a voice note.
6. If the farmer sends an image of a diseased leaf or soil, diagnose visible symptoms carefully and give safe protection steps.
`;

const toolDeclarations: FunctionDeclaration[] = [
  {
    name: "get_weather_forecast",
    description:
      "Fetch real-time current weather and 7-day agricultural weather forecast for an Indian village, town, or district. Includes min/max temperatures, rainfall (mm), rain probability (%), wind speed, and evapotranspiration.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        location_name: {
          type: Type.STRING,
          description: "Village, city, district, or state name, e.g. 'Nashik, Maharashtra'",
        },
      },
      required: ["location_name"],
    },
  },
  {
    name: "get_soil_profile",
    description:
      "Fetch soil properties (pH, organic carbon, sand/silt/clay percentages, nitrogen) for a location using ISRIC SoilGrids or Indian agro-climatic baseline.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        location_name: {
          type: Type.STRING,
          description: "Village, district, or state name, e.g. 'Ludhiana, Punjab'",
        },
      },
      required: ["location_name"],
    },
  },
  {
    name: "get_mandi_prices",
    description:
      "Fetch wholesale Mandi prices (INR per Quintal = 100 kg) for a crop/commodity and optional Indian state.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        commodity: {
          type: Type.STRING,
          description: "Crop/commodity name in English, e.g. 'Onion', 'Wheat', 'Soybean', 'Tomato', 'Cotton'",
        },
        state: {
          type: Type.STRING,
          description: "Optional Indian state name, e.g. 'Maharashtra', 'Punjab'",
        },
      },
      required: ["commodity"],
    },
  },
  {
    name: "get_crop_advisory_reference",
    description:
      "Retrieve Indian crop calendar (sowing/harvesting windows), water requirements, ideal soil pH, and Integrated Pest Management (IPM) crop protection guidance.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        crop_name: {
          type: Type.STRING,
          description: "Crop name in English, e.g. 'wheat', 'onion', 'soybean', 'tomato', 'cotton', 'rice'",
        },
      },
      required: ["crop_name"],
    },
  },
];

export interface AdviseInput {
  location: string;
  languageLabel: string;
  textQuery?: string;
  audioBase64?: string;
  audioMimeType?: string;
  imageBase64?: string;
  imageMimeType?: string;
}

export async function runKisanAdvisor(
  input: AdviseInput
): Promise<AdvisorResponse> {
  const ai = getClient();

  const userParts: Part[] = [];

  let contextPrompt =
    `Farmer's Location: ${input.location.trim() || "Not specified (ask politely if needed)"}\n` +
    `Preferred Reply Language: ${input.languageLabel}\n`;

  if (input.textQuery?.trim()) {
    contextPrompt += `Farmer's Question (text): ${input.textQuery.trim()}\n`;
  } else {
    contextPrompt +=
      "Farmer provided a voice note or crop photo. Listen/inspect carefully and answer directly in the preferred reply language.\n";
  }

  userParts.push({ text: contextPrompt });

  if (input.audioBase64 && input.audioMimeType) {
    userParts.push({
      inlineData: {
        mimeType: input.audioMimeType,
        data: input.audioBase64,
      },
    });
  }

  if (input.imageBase64 && input.imageMimeType) {
    userParts.push({
      inlineData: {
        mimeType: input.imageMimeType,
        data: input.imageBase64,
      },
    });
  }

  const contents: Content[] = [{ role: "user", parts: userParts }];

  const toolsUsed: ToolInvocationRecord[] = [];
  let weatherResult: WeatherForecastResult | undefined;
  let soilResult: SoilProfileResult | undefined;
  let mandiResult: MandiPricesResult | undefined;
  let cropRefResult: CropReferenceEntry | undefined;

  const maxSteps = 5;
  let finalResponseText = "";

  for (let step = 0; step < maxSteps; step++) {
    const response = await ai.models.generateContent({
      model: "gemini-4-hydrogen",
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ functionDeclarations: toolDeclarations }],
      },
    });

    const candidateContent = response.candidates?.[0]?.content;
    const functionCalls = response.functionCalls;

    if (!functionCalls || functionCalls.length === 0) {
      finalResponseText =
        response.text ??
        "Sorry, I could not generate advice right now. Please try again.";
      break;
    }

    if (candidateContent) {
      contents.push(candidateContent);
    }

    const functionResponseParts: Part[] = [];

    for (const fc of functionCalls) {
      const name = fc.name ?? "";
      const args = (fc.args ?? {}) as Record<string, unknown>;
      let result: unknown;
      let summary = "";

      if (name === "get_weather_forecast") {
        const loc = String(args.location_name || input.location || "Nashik");
        const w = await getWeatherForecast(loc);
        weatherResult = w;
        result = w;
        summary =
          w.status === "success"
            ? `7-day forecast for ${w.location}`
            : w.message ?? "Weather unavailable";
      } else if (name === "get_soil_profile") {
        const loc = String(args.location_name || input.location || "Nashik");
        const s = await getSoilProfile(loc);
        soilResult = s;
        result = s;
        summary = `${s.source} · pH ${s.soil_data.ph ?? "N/A"}`;
      } else if (name === "get_mandi_prices") {
        const commodity = String(args.commodity || "");
        const state = String(args.state || "");
        const m = await getMandiPrices(commodity, state);
        mandiResult = m;
        result = m;
        summary =
          m.prices.length > 0
            ? `${m.prices.length} market quotes (${m.source})`
            : m.message ?? "No mandi match";
      } else if (name === "get_crop_advisory_reference") {
        const crop = String(args.crop_name || "");
        const c = getCropAdvisoryReference(crop);
        if (c.season && c.ideal_ph && c.water_need && c.protection) {
          cropRefResult = {
            crop: c.crop,
            season: c.season,
            ideal_ph: c.ideal_ph,
            water_need: c.water_need,
            protection: c.protection,
          };
        }
        result = c;
        summary = `IPM & calendar for ${c.crop}`;
      } else {
        result = { error: `Unknown tool: ${name}` };
        summary = `Unknown tool ${name}`;
      }

      toolsUsed.push({
        name,
        args,
        summary,
      });

      functionResponseParts.push({
        functionResponse: {
          id: fc.id,
          name,
          response: { result },
        },
      });
    }

    contents.push({
      role: "user",
      parts: functionResponseParts,
    });
  }

  if (!finalResponseText) {
    const finalPass = await ai.models.generateContent({
      model: "gemini-4-hydrogen",
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });
    finalResponseText =
      finalPass.text ??
      "Sorry, I could not finalize the advisory. Please try again.";
  }

  return {
    advisoryText: finalResponseText,
    toolsUsed,
    weather: weatherResult,
    soil: soilResult,
    mandi: mandiResult,
    cropRef: cropRefResult,
  };
}

function cleanTextForSpeech(text: string): string {
  return text
    .replace(/[*_`#>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1800);
}

export async function synthesizeAdvisorySpeech(
  text: string,
  languageLabel: string
): Promise<{ audioBase64: string; mimeType: string }> {
  const ai = getClient();
  const cleanText = cleanTextForSpeech(text);
  if (!cleanText) {
    throw new Error("No advisory text provided for speech synthesis.");
  }

  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash-lite-tts",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: cleanText,
            speechMetadata: {
              style: `Warm, clear, reassuring agricultural advisor speaking naturally in ${languageLabel}`,
            },
          },
        ],
      },
    ],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: "Kore" },
        },
      },
    },
  });

  const base64Audio =
    response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

  if (!base64Audio) {
    throw new Error("TTS model did not return audio data.");
  }

  return {
    audioBase64: base64Audio,
    mimeType: "audio/wav",
  };
}
