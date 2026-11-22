import type {
  CropReferenceEntry,
  MandiPriceRecord,
  MandiPricesResult,
  SoilProfileResult,
  WeatherForecastResult,
} from "../src/types.ts";

interface GeoResult {
  name?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  error?: string;
}

const REGIONAL_SOIL_FALLBACK: Record<
  string,
  {
    soil_type: string;
    ph: number;
    organic_carbon_g_kg: number;
    texture: string;
    nitrogen_status: string;
  }
> = {
  maharashtra: {
    soil_type: "Black Cotton (Vertisol)",
    ph: 7.6,
    organic_carbon_g_kg: 6.2,
    texture: "High Clay (48%)",
    nitrogen_status: "Low-Medium",
  },
  punjab: {
    soil_type: "Alluvial (Indo-Gangetic)",
    ph: 7.4,
    organic_carbon_g_kg: 4.8,
    texture: "Sandy Loam",
    nitrogen_status: "Medium",
  },
  haryana: {
    soil_type: "Alluvial / Loamy",
    ph: 7.5,
    organic_carbon_g_kg: 4.5,
    texture: "Loam",
    nitrogen_status: "Low-Medium",
  },
  "uttar pradesh": {
    soil_type: "Fertile Alluvial",
    ph: 7.2,
    organic_carbon_g_kg: 5.5,
    texture: "Silt Loam",
    nitrogen_status: "Medium",
  },
  "madhya pradesh": {
    soil_type: "Deep Black / Medium Black",
    ph: 7.4,
    organic_carbon_g_kg: 5.8,
    texture: "Clay Loam",
    nitrogen_status: "Medium",
  },
  karnataka: {
    soil_type: "Red Loamy / Black",
    ph: 6.4,
    organic_carbon_g_kg: 6.5,
    texture: "Sandy Clay Loam",
    nitrogen_status: "Medium",
  },
  "tamil nadu": {
    soil_type: "Red Sandy Loam / Alluvial",
    ph: 6.8,
    organic_carbon_g_kg: 5.2,
    texture: "Sandy Loam",
    nitrogen_status: "Low-Medium",
  },
  telangana: {
    soil_type: "Red Chalkas / Black Soil",
    ph: 6.9,
    organic_carbon_g_kg: 5.0,
    texture: "Sandy Clay",
    nitrogen_status: "Low-Medium",
  },
  gujarat: {
    soil_type: "Medium Black / Alluvial",
    ph: 7.7,
    organic_carbon_g_kg: 5.1,
    texture: "Clay Loam",
    nitrogen_status: "Medium",
  },
  rajasthan: {
    soil_type: "Arid Sandy / Desert Soil",
    ph: 8.1,
    organic_carbon_g_kg: 2.8,
    texture: "Sandy",
    nitrogen_status: "Low",
  },
  "west bengal": {
    soil_type: "New Alluvial / Deltaic",
    ph: 6.2,
    organic_carbon_g_kg: 7.8,
    texture: "Silty Clay Loam",
    nitrogen_status: "Medium-High",
  },
};

export const FALLBACK_MANDI_PRICES: MandiPriceRecord[] = [
  {
    commodity: "Wheat",
    state: "Punjab",
    market: "Ludhiana",
    min_price: 2275,
    max_price: 2480,
    modal_price: 2380,
  },
  {
    commodity: "Wheat",
    state: "Madhya Pradesh",
    market: "Indore",
    min_price: 2300,
    max_price: 2650,
    modal_price: 2450,
  },
  {
    commodity: "Onion",
    state: "Maharashtra",
    market: "Lasalgaon (Nashik)",
    min_price: 1400,
    max_price: 2900,
    modal_price: 2250,
  },
  {
    commodity: "Soybean",
    state: "Maharashtra",
    market: "Latur",
    min_price: 4200,
    max_price: 4750,
    modal_price: 4520,
  },
  {
    commodity: "Soybean",
    state: "Madhya Pradesh",
    market: "Indore",
    min_price: 4320,
    max_price: 4860,
    modal_price: 4610,
  },
  {
    commodity: "Cotton",
    state: "Gujarat",
    market: "Rajkot",
    min_price: 6600,
    max_price: 7450,
    modal_price: 7100,
  },
  {
    commodity: "Paddy (Dhan)",
    state: "Telangana",
    market: "Warangal",
    min_price: 2183,
    max_price: 2350,
    modal_price: 2280,
  },
  {
    commodity: "Tomato",
    state: "Karnataka",
    market: "Kolar",
    min_price: 1100,
    max_price: 2100,
    modal_price: 1650,
  },
  {
    commodity: "Chickpea (Chana)",
    state: "Madhya Pradesh",
    market: "Bhopal",
    min_price: 5400,
    max_price: 6150,
    modal_price: 5800,
  },
  {
    commodity: "Mustard",
    state: "Rajasthan",
    market: "Alwar",
    min_price: 5300,
    max_price: 5950,
    modal_price: 5650,
  },
];

export const CROP_KNOWLEDGE_BASE: Record<string, Omit<CropReferenceEntry, "crop">> = {
  wheat: {
    season: "Rabi (Sow: Nov - mid Dec; Harvest: Mar - Apr)",
    ideal_ph: "6.0 - 7.5",
    water_need:
      "4-6 irrigations (critical at Crown Root Initiation ~21 days after sowing)",
    protection:
      "Watch for Yellow Rust in humid cold weather and Aphids in Feb. Use Trichoderma seed treatment; spray Neem oil (3000 ppm) early before chemical sprays.",
  },
  onion: {
    season: "Kharif (Jun-Jul), Late Kharif (Aug-Sep), Rabi (Nov-Dec)",
    ideal_ph: "6.0 - 7.5",
    water_need:
      "Light frequent irrigation; stop 10-15 days before harvest to prevent rotting",
    protection:
      "High humidity triggers Purple Blotch and Stemphylium Blight; Thrips attack in dry spells. Use blue sticky traps and avoid excess nitrogen.",
  },
  cotton: {
    season: "Kharif (Sow: May - Jul; Harvest: Oct - Jan)",
    ideal_ph: "6.5 - 8.0 (Thrives in Black Cotton soil)",
    water_need:
      "Sensitive to waterlogging; drain excess rainwater immediately",
    protection:
      "Pink Bollworm & Whitefly risk. Install pheromone traps (4-5/acre); avoid spraying during flowering or heavy rain.",
  },
  soybean: {
    season: "Kharif (Sow: Jun - mid Jul with monsoon onset; Harvest: Sep - Oct)",
    ideal_ph: "6.0 - 7.5",
    water_need: "Mostly rainfed; critical moisture needed at pod filling",
    protection:
      "Girdle beetle and Yellow Mosaic Virus (spread by whitefly). Apply Rhizobium + PSB culture on seeds; rogue out infected yellow plants early.",
  },
  rice: {
    season: "Kharif (Jun - Nov) & Rabi/Summer in South/East India",
    ideal_ph: "5.5 - 7.0",
    water_need:
      "Maintain 2-5 cm standing water during vegetative phase; drain before harvest",
    protection:
      "Blast disease & Brown Planthopper (BPH). Leave alleys every 2 meters for airflow; avoid excessive urea which attracts BPH.",
  },
  mustard: {
    season: "Rabi (Sow: Oct - Nov; Harvest: Feb - Mar)",
    ideal_ph: "6.0 - 7.5",
    water_need: "Low water (1-2 irrigations at pre-flowering and pod formation)",
    protection:
      "Painted bug & Mustard Aphid (especially in cloudy weather). Sow timely in October to escape peak aphid infestation.",
  },
  chickpea: {
    season: "Rabi (Sow: Oct - Nov; Harvest: Feb - Mar)",
    ideal_ph: "6.0 - 8.0",
    water_need: "Drought tolerant; 1 light irrigation at pre-flowering if dry",
    protection:
      "Pod Borer (Helicoverpa) & Wilt. Install bird perches (10/acre) and pheromone traps; treat seeds with Trichoderma.",
  },
  tomato: {
    season: "Year-round (Kharif: Jun-Jul, Rabi: Oct-Nov, Summer: Jan-Feb)",
    ideal_ph: "6.0 - 7.0",
    water_need:
      "Consistent drip irrigation; irregular watering causes blossom end rot",
    protection:
      "Early/Late Blight in rain/fog; Fruit Borer & Leaf Curl Virus. Stake plants off the ground and use yellow sticky traps.",
  },
};

export async function geocodeLocation(locationName: string): Promise<GeoResult> {
  try {
    const query = locationName.split(",")[0].trim();
    if (!query) {
      return { error: "Please provide a village, town, or district name." };
    }
    const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
    url.searchParams.set("name", query);
    url.searchParams.set("count", "5");
    url.searchParams.set("language", "en");
    url.searchParams.set("format", "json");

    const resp = await fetch(url.toString(), {
      signal: AbortSignal.timeout(6000),
    });
    if (!resp.ok) {
      return { error: `Geocoding service returned ${resp.status}` };
    }
    const data = (await resp.json()) as {
      results?: Array<{
        name: string;
        admin1?: string;
        country?: string;
        country_code?: string;
        latitude: number;
        longitude: number;
      }>;
    };

    const results = data.results ?? [];
    if (results.length === 0) {
      return { error: `Location '${locationName}' not found.` };
    }

    const indiaMatch =
      results.find((r) => r.country_code === "IN") ?? results[0];
    return {
      name: indiaMatch.name,
      state: indiaMatch.admin1 ?? "",
      country: indiaMatch.country ?? "",
      latitude: indiaMatch.latitude,
      longitude: indiaMatch.longitude,
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to geocode location",
    };
  }
}

function estimateHargreavesEt0(
  tMin: number,
  tMax: number,
  latDeg: number,
  dateStr: string
): number {
  const date = new Date(`${dateStr}T00:00:00Z`);
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 0));
  const doy = Math.max(
    1,
    Math.min(365, Math.floor((date.getTime() - start.getTime()) / 86400000))
  );
  const latRad = (latDeg * Math.PI) / 180;
  const dr = 1 + 0.033 * Math.cos(((2 * Math.PI) / 365) * doy);
  const delta = 0.409 * Math.sin(((2 * Math.PI) / 365) * doy - 1.39);
  const cosWs = Math.max(
    -1,
    Math.min(1, -Math.tan(latRad) * Math.tan(delta))
  );
  const ws = Math.acos(cosWs);
  const raMj =
    ((24 * 60) / Math.PI) *
    0.082 *
    dr *
    (ws * Math.sin(latRad) * Math.sin(delta) +
      Math.cos(latRad) * Math.cos(delta) * Math.sin(ws));
  const raMm = raMj * 0.408;
  const tMean = (tMin + tMax) / 2;
  const diff = Math.max(0.5, tMax - tMin);
  const et0 = 0.0023 * (tMean + 17.8) * Math.sqrt(diff) * raMm;
  return Math.round(Math.max(0.5, et0) * 10) / 10;
}

async function fetchMetNoWeather(
  geo: Required<Pick<GeoResult, "name" | "state" | "country" | "latitude" | "longitude">>
): Promise<WeatherForecastResult> {
  const url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${geo.latitude.toFixed(
    4
  )}&lon=${geo.longitude.toFixed(4)}`;

  const resp = await fetch(url, {
    headers: { "User-Agent": "KisanMitraAI/1.0" },
    signal: AbortSignal.timeout(7000),
  });
  if (!resp.ok) {
    throw new Error(`MET Norway returned ${resp.status}`);
  }

  const json = (await resp.json()) as {
    properties?: {
      timeseries?: Array<{
        time: string;
        data: {
          instant: {
            details: {
              air_temperature?: number;
              relative_humidity?: number;
              wind_speed?: number;
            };
          };
          next_1_hours?: {
            summary?: { symbol_code?: string };
            details?: { precipitation_amount?: number };
          };
          next_6_hours?: {
            summary?: { symbol_code?: string };
            details?: { precipitation_amount?: number };
          };
        };
      }>;
    };
  };

  const series = json.properties?.timeseries ?? [];
  if (series.length === 0) {
    throw new Error("MET Norway returned empty forecast.");
  }

  const first = series[0];
  const current = {
    temperature_2m: first.data.instant.details.air_temperature,
    relative_humidity_2m: first.data.instant.details.relative_humidity,
    precipitation:
      first.data.next_1_hours?.details?.precipitation_amount ?? 0,
    wind_speed_10m:
      first.data.instant.details.wind_speed !== undefined
        ? Math.round(first.data.instant.details.wind_speed * 3.6 * 10) / 10
        : undefined,
  };

  const byDay = new Map<
    string,
    {
      temps: number[];
      winds: number[];
      rainSum: number;
      maxProb: number;
    }
  >();

  for (const entry of series) {
    const utcMs = Date.parse(entry.time);
    const istDate = new Date(utcMs + 5.5 * 3600 * 1000)
      .toISOString()
      .slice(0, 10);

    let bucket = byDay.get(istDate);
    if (!bucket) {
      bucket = { temps: [], winds: [], rainSum: 0, maxProb: 0 };
      byDay.set(istDate, bucket);
    }

    const temp = entry.data.instant.details.air_temperature;
    if (temp !== undefined) bucket.temps.push(temp);

    const windMs = entry.data.instant.details.wind_speed;
    if (windMs !== undefined) bucket.winds.push(windMs * 3.6);

    const precip1h = entry.data.next_1_hours?.details?.precipitation_amount;
    const precip6h = entry.data.next_6_hours?.details?.precipitation_amount;
    if (precip1h !== undefined) {
      bucket.rainSum += precip1h;
    } else if (precip6h !== undefined) {
      bucket.rainSum += precip6h / 6;
    }

    const sym =
      entry.data.next_1_hours?.summary?.symbol_code ??
      entry.data.next_6_hours?.summary?.symbol_code ??
      "";
    const rainAmt = precip1h ?? precip6h ?? 0;
    let prob = 5;
    if (rainAmt >= 2 || sym.includes("heavyrain")) prob = 85;
    else if (rainAmt >= 0.3 || sym.includes("rain")) prob = 65;
    else if (sym.includes("sleet") || sym.includes("shower")) prob = 55;
    else if (sym.includes("cloudy")) prob = 20;
    bucket.maxProb = Math.max(bucket.maxProb, prob);
  }

  const forecastDays = Array.from(byDay.entries())
    .slice(0, 7)
    .map(([date, agg]) => {
      const tMin =
        agg.temps.length > 0 ? Math.round(Math.min(...agg.temps) * 10) / 10 : 18;
      const tMax =
        agg.temps.length > 0 ? Math.round(Math.max(...agg.temps) * 10) / 10 : 30;
      const maxWind =
        agg.winds.length > 0 ? Math.round(Math.max(...agg.winds) * 10) / 10 : 10;
      const rainMm = Math.round(agg.rainSum * 10) / 10;
      return {
        date,
        temp_min_c: tMin,
        temp_max_c: tMax,
        rain_mm: rainMm,
        rain_probability_pct: agg.maxProb,
        max_wind_kmh: maxWind,
        evapotranspiration_mm: estimateHargreavesEt0(
          tMin,
          tMax,
          geo.latitude,
          date
        ),
      };
    });

  return {
    status: "success",
    source: "MET Norway Live Forecast",
    location: `${geo.name}${geo.state ? `, ${geo.state}` : ""} (${geo.country})`,
    current,
    forecast_7_day: forecastDays,
  };
}

export async function getWeatherForecast(
  locationName: string
): Promise<WeatherForecastResult> {
  const geo = await geocodeLocation(locationName);
  if (geo.error || geo.latitude === undefined || geo.longitude === undefined) {
    return {
      status: "error",
      message: geo.error ?? "Location lookup failed.",
    };
  }

  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(geo.latitude));
    url.searchParams.set("longitude", String(geo.longitude));
    url.searchParams.set(
      "current",
      "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m"
    );
    url.searchParams.set(
      "daily",
      "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,et0_fao_evapotranspiration"
    );
    url.searchParams.set("timezone", "Asia/Kolkata");
    url.searchParams.set("forecast_days", "7");

    const resp = await fetch(url.toString(), {
      signal: AbortSignal.timeout(3500),
    });
    if (!resp.ok) {
      throw new Error(`Open-Meteo returned ${resp.status}`);
    }

    const data = (await resp.json()) as {
      current?: WeatherForecastResult["current"];
      daily?: {
        time: string[];
        temperature_2m_min: number[];
        temperature_2m_max: number[];
        precipitation_sum: number[];
        precipitation_probability_max: number[];
        wind_speed_10m_max: number[];
        et0_fao_evapotranspiration: number[];
      };
    };

    const daily = data.daily;
    const forecastDays = (daily?.time ?? []).map((d, i) => ({
      date: d,
      temp_min_c: daily?.temperature_2m_min?.[i] ?? 0,
      temp_max_c: daily?.temperature_2m_max?.[i] ?? 0,
      rain_mm: daily?.precipitation_sum?.[i] ?? 0,
      rain_probability_pct: daily?.precipitation_probability_max?.[i] ?? 0,
      max_wind_kmh: daily?.wind_speed_10m_max?.[i] ?? 0,
      evapotranspiration_mm: daily?.et0_fao_evapotranspiration?.[i] ?? 0,
    }));

    return {
      status: "success",
      source: "Open-Meteo 7-Day Forecast",
      location: `${geo.name}${geo.state ? `, ${geo.state}` : ""} (${geo.country})`,
      current: data.current ?? {},
      forecast_7_day: forecastDays,
    };
  } catch {
    try {
      return await fetchMetNoWeather({
        name: geo.name ?? locationName,
        state: geo.state ?? "",
        country: geo.country ?? "",
        latitude: geo.latitude,
        longitude: geo.longitude,
      });
    } catch (fallbackErr) {
      return {
        status: "error",
        message: `Weather API failed: ${
          fallbackErr instanceof Error ? fallbackErr.message : "Network error"
        }`,
      };
    }
  }
}

export async function getSoilProfile(
  locationName: string
): Promise<SoilProfileResult> {
  const geo = await geocodeLocation(locationName);
  const stateKey = (geo.state || locationName).toLowerCase();

  if (!geo.error && geo.latitude !== undefined && geo.longitude !== undefined) {
    try {
      const url = new URL(
        "https://rest.isric.org/soilgrids/v2.0/properties/query"
      );
      url.searchParams.set("lon", String(geo.longitude));
      url.searchParams.set("lat", String(geo.latitude));
      for (const prop of ["phh2o", "soc", "clay", "sand", "silt", "nitrogen"]) {
        url.searchParams.append("property", prop);
      }
      url.searchParams.set("depth", "0-5cm");
      url.searchParams.set("value", "mean");

      const resp = await fetch(url.toString(), {
        signal: AbortSignal.timeout(5500),
      });
      if (resp.ok) {
        const json = (await resp.json()) as {
          properties?: {
            layers?: Array<{
              name: string;
              depths?: Array<{ values?: { mean?: number | null } }>;
            }>;
          };
        };

        const parsed: SoilProfileResult["soil_data"] = {};
        for (const layer of json.properties?.layers ?? []) {
          const val = layer.depths?.[0]?.values?.mean;
          if (val !== null && val !== undefined) {
            if (layer.name === "phh2o") {
              parsed.ph = Math.round((val / 10) * 100) / 100;
            } else if (
              layer.name === "clay" ||
              layer.name === "sand" ||
              layer.name === "silt"
            ) {
              parsed[`${layer.name}_pct`] = Math.round((val / 10) * 10) / 10;
            } else if (layer.name === "soc") {
              parsed.organic_carbon_g_kg =
                Math.round((val / 10) * 100) / 100;
            } else if (layer.name === "nitrogen") {
              parsed.nitrogen_g_kg = Math.round((val / 100) * 100) / 100;
            }
          }
        }

        if (parsed.ph !== undefined) {
          return {
            status: "success",
            source: "ISRIC SoilGrids v2.0 (0-5cm)",
            location: `${geo.name}${geo.state ? `, ${geo.state}` : ""}`,
            soil_data: parsed,
          };
        }
      }
    } catch {
      // Gracefully fall back to regional baseline below
    }
  }

  for (const [state, info] of Object.entries(REGIONAL_SOIL_FALLBACK)) {
    if (
      stateKey.includes(state) ||
      locationName.toLowerCase().includes(state)
    ) {
      return {
        status: "success",
        source: "Indian Agro-Climatic Regional Soil Baseline",
        location: geo.name
          ? `${geo.name}${geo.state ? `, ${geo.state}` : ""}`
          : locationName,
        soil_data: info,
        note: "Regional soil baseline used; verify exact plot values with local Soil Health Card.",
      };
    }
  }

  return {
    status: "success",
    source: "General Indian Loam Baseline",
    location: locationName,
    soil_data: {
      soil_type: "Medium Loam",
      ph: 7.0,
      organic_carbon_g_kg: 5.0,
      nitrogen_status: "Medium",
    },
    note: "Recommend checking local Soil Health Card for exact NPK levels.",
  };
}

export async function getMandiPrices(
  commodity: string,
  state = ""
): Promise<MandiPricesResult> {
  const apiKey = (process.env.DATA_GOV_API_KEY ?? "").trim();
  const cleanCommodity = commodity.trim();
  const cleanState = state.trim();

  if (apiKey && cleanCommodity) {
    try {
      const url = new URL(
        "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"
      );
      url.searchParams.set("api-key", apiKey);
      url.searchParams.set("format", "json");
      url.searchParams.set("limit", "10");
      url.searchParams.set("filters[commodity]", cleanCommodity);
      if (cleanState) {
        url.searchParams.set("filters[state]", cleanState);
      }

      const resp = await fetch(url.toString(), {
        signal: AbortSignal.timeout(7000),
      });
      if (resp.ok) {
        const json = (await resp.json()) as {
          records?: Array<Record<string, string>>;
        };
        const records = json.records ?? [];
        if (records.length > 0) {
          const cleaned: MandiPriceRecord[] = records.slice(0, 6).map((r) => ({
            state: r.state ?? "",
            district: r.district ?? "",
            market: r.market ?? "",
            commodity: r.commodity ?? cleanCommodity,
            variety: r.variety ?? "",
            arrival_date: r.arrival_date ?? "",
            min_price: Number(r.min_price) || 0,
            max_price: Number(r.max_price) || 0,
            modal_price: Number(r.modal_price) || 0,
          }));
          return {
            status: "success",
            source: "Agmarknet (data.gov.in Live)",
            unit: "INR per Quintal (100 kg)",
            prices: cleaned,
          };
        }
      }
    } catch {
      // Fall back to reference mandi dataset
    }
  }

  const cLower = cleanCommodity.toLowerCase();
  const sLower = cleanState.toLowerCase();

  let matches = FALLBACK_MANDI_PRICES.filter(
    (item) =>
      (!cLower || item.commodity.toLowerCase().includes(cLower)) &&
      (!sLower || item.state.toLowerCase().includes(sLower))
  );
  if (matches.length === 0 && cLower) {
    matches = FALLBACK_MANDI_PRICES.filter((item) =>
      item.commodity.toLowerCase().includes(cLower)
    );
  }

  if (matches.length > 0) {
    return {
      status: "success",
      source: "Reference Mandi Dataset",
      unit: "INR per Quintal (100 kg)",
      prices: matches,
    };
  }

  return {
    status: "not_found",
    source: "Reference Mandi Dataset",
    unit: "INR per Quintal (100 kg)",
    prices: [],
    message: `No exact mandi record found for '${commodity}'. Advise checking local e-NAM / Agmarknet mandi board.`,
  };
}

export function getCropAdvisoryReference(cropName: string): {
  status: string;
  crop: string;
  season?: string;
  ideal_ph?: string;
  water_need?: string;
  protection?: string;
  note?: string;
} {
  const key = cropName.trim().toLowerCase();
  for (const [name, info] of Object.entries(CROP_KNOWLEDGE_BASE)) {
    if (key.includes(name) || name.includes(key)) {
      return {
        status: "success",
        crop: name.charAt(0).toUpperCase() + name.slice(1),
        ...info,
      };
    }
  }
  return {
    status: "partial",
    crop: cropName,
    note: "No pre-cached entry; use general agronomic best practices tailored to local weather and soil pH.",
  };
}
