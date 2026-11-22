import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  Loader2,
  MapPin,
  Mic,
  Square,
  Upload,
  X,
} from "lucide-react";
import { AdvisoryOutput } from "./components/AdvisoryOutput";
import { CropCalendarSection } from "./components/CropCalendarSection";
import { MandiSection } from "./components/MandiSection";
import { WeatherSoilSection } from "./components/WeatherSoilSection";
import {
  AdvisorResponse,
  CropReferenceEntry,
  MandiPricesResult,
  SoilProfileResult,
  SUPPORTED_LANGUAGES,
  WeatherForecastResult,
} from "./types";

const HERO_BANNER_SRC =
  "/src/assets/images/kisanmitra_field_banner_1794927440916.jpg";
const SAMPLE_TOMATO_SRC =
  "/src/assets/images/sample_tomato_blight_1794927441585.jpg";
const SAMPLE_ONION_SRC =
  "/src/assets/images/sample_onion_crop_1794927440953.jpg";

const SAMPLE_QUERIES = [
  {
    location: "Nashik, Maharashtra",
    language: "Marathi (मराठी)",
    query:
      "माझ्या कांदा पिकासाठी या आठवड्याचे हवामान, फवारणी आणि बाजारभाव सांगा.",
  },
  {
    location: "Ludhiana, Punjab",
    language: "Punjabi (ਪੰਜਾਬੀ)",
    query:
      "ਕਣਕ ਦੀ ਬਿਜਾਈ ਲਈ ਮਿੱਟੀ ਅਤੇ ਮੌਸਮ ਦੀ ਸਲਾਹ ਦਿਓ ਅਤੇ ਮੰਡੀ ਦਾ ਰੇਟ ਦੱਸੋ।",
  },
  {
    location: "Kolar, Karnataka",
    language: "Kannada (ಕನ್ನಡ)",
    query:
      "ಟೊಮೆಟೊ ಬೆಳೆಗೆ ಈ ವಾರದ ಹವಾಮಾನ, ರೋಗ ರಕ್ಷಣೆ ಮತ್ತು ಮಾರುಕಟ್ಟೆ ಬೆಲೆ ತಿಳಿಸಿ.",
  },
  {
    location: "Indore, Madhya Pradesh",
    language: "Hindi (हिन्दी)",
    query:
      "क्या मुझे अभी सोयाबीन बेचना चाहिए या रुकना चाहिए? मौसम और मंडी भाव देखकर बताएं।",
  },
];

const QUICK_LOCATIONS = [
  "Nashik, Maharashtra",
  "Ludhiana, Punjab",
  "Kolar, Karnataka",
  "Indore, Madhya Pradesh",
  "Warangal, Telangana",
];

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const commaIdx = result.indexOf(",");
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = () => reject(new Error("Failed to read file data."));
    reader.readAsDataURL(blob);
  });
}

export default function App() {
  const [location, setLocation] = useState("Nashik, Maharashtra");
  const [languageLabel, setLanguageLabel] = useState("Hindi (हिन्दी)");
  const [textQuery, setTextQuery] = useState("");

  // Voice recording & audio upload state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [audioMimeType, setAudioMimeType] = useState<string | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  // Crop photo state
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageLabel, setImageLabel] = useState<string | null>(null);

  // Advisory & TTS state
  const [advisory, setAdvisory] = useState<AdvisorResponse | null>(null);
  const [advising, setAdvising] = useState(false);
  const [adviseError, setAdviseError] = useState<string | null>(null);
  const [ttsAudioBase64, setTtsAudioBase64] = useState<string | null>(null);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);

  // Field snapshot, mandi & crop reference state
  const [weather, setWeather] = useState<WeatherForecastResult | null>(null);
  const [soil, setSoil] = useState<SoilProfileResult | null>(null);
  const [mandi, setMandi] = useState<MandiPricesResult | null>(null);
  const [crops, setCrops] = useState<CropReferenceEntry[]>([]);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [mandiSearching, setMandiSearching] = useState(false);
  const [bannerLoadFailed, setBannerLoadFailed] = useState(false);

  const queryInputRef = useRef<HTMLTextAreaElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const audioFileInputRef = useRef<HTMLInputElement | null>(null);

  const loadFieldSnapshot = useCallback(async (loc: string) => {
    setSnapshotLoading(true);
    try {
      const params = new URLSearchParams({ location: loc });
      const res = await fetch(`/api/field-snapshot?${params.toString()}`);
      if (res.ok) {
        const data = (await res.json()) as {
          weather?: WeatherForecastResult;
          soil?: SoilProfileResult;
          mandi?: MandiPricesResult;
        };
        if (data.weather) setWeather(data.weather);
        if (data.soil) setSoil(data.soil);
        if (data.mandi) setMandi(data.mandi);
      }
    } catch {
      // Keep existing state if snapshot refresh fails
    } finally {
      setSnapshotLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFieldSnapshot("Nashik, Maharashtra");
    fetch("/api/crops")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { crops?: CropReferenceEntry[] } | null) => {
        if (data?.crops) {
          setCrops(data.crops);
        }
      })
      .catch(() => {});
  }, [loadFieldSnapshot]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    };
  }, [audioPreviewUrl]);

  const generateVoiceReply = useCallback(
    async (text: string, lang: string) => {
      setTtsLoading(true);
      setTtsError(null);
      setTtsAudioBase64(null);
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, languageLabel: lang }),
        });
        const data = (await res.json()) as {
          audioBase64?: string;
          error?: string;
        };
        if (!res.ok || !data.audioBase64) {
          throw new Error(data.error || "Voice generation unavailable.");
        }
        setTtsAudioBase64(data.audioBase64);
      } catch (err) {
        setTtsError(
          err instanceof Error ? err.message : "Voice synthesis failed."
        );
      } finally {
        setTtsLoading(false);
      }
    },
    []
  );

  const submitQuery = useCallback(
    async (overrides?: {
      location?: string;
      language?: string;
      query?: string;
      audioB64?: string | null;
      audioMime?: string | null;
      imgB64?: string | null;
      imgMime?: string | null;
    }) => {
      const targetLocation = overrides?.location ?? location;
      const targetLang = overrides?.language ?? languageLabel;
      const targetQuery = overrides?.query ?? textQuery;
      const targetAudioB64 =
        overrides?.audioB64 !== undefined ? overrides.audioB64 : audioBase64;
      const targetAudioMime =
        overrides?.audioMime !== undefined
          ? overrides.audioMime
          : audioMimeType;
      const targetImgB64 =
        overrides?.imgB64 !== undefined ? overrides.imgB64 : imageBase64;
      const targetImgMime =
        overrides?.imgMime !== undefined ? overrides.imgMime : imageMimeType;

      if (!targetQuery.trim() && !targetAudioB64 && !targetImgB64) {
        setAdviseError(
          "Please type your question, record a voice note, or attach a crop photo."
        );
        return;
      }

      setAdvising(true);
      setAdviseError(null);
      setTtsAudioBase64(null);
      setTtsError(null);

      try {
        const res = await fetch("/api/advise", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: targetLocation,
            languageLabel: targetLang,
            textQuery: targetQuery,
            audioBase64: targetAudioB64 ?? undefined,
            audioMimeType: targetAudioMime ?? undefined,
            imageBase64: targetImgB64 ?? undefined,
            imageMimeType: targetImgMime ?? undefined,
          }),
        });

        const data = (await res.json()) as AdvisorResponse & { error?: string };
        if (!res.ok) {
          throw new Error(data.error || "Unable to get advisory response.");
        }

        setAdvisory(data);
        if (data.weather?.status === "success") setWeather(data.weather);
        if (data.soil?.status === "success") setSoil(data.soil);
        if (data.mandi?.prices?.length) setMandi(data.mandi);

        if (data.advisoryText) {
          void generateVoiceReply(data.advisoryText, targetLang);
        }
      } catch (err) {
        setAdviseError(
          err instanceof Error
            ? err.message
            : "Something went wrong while contacting the advisor."
        );
      } finally {
        setAdvising(false);
      }
    },
    [
      location,
      languageLabel,
      textQuery,
      audioBase64,
      audioMimeType,
      imageBase64,
      imageMimeType,
      generateVoiceReply,
    ]
  );

  const handleStartRecording = async () => {
    setMicError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicError(
        "Microphone recording is not supported in this browser. You can upload an audio file instead."
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredMime = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";
      const recorder = preferredMime
        ? new MediaRecorder(stream, { mimeType: preferredMime })
        : new MediaRecorder(stream);

      audioChunksRef.current = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) audioChunksRef.current.push(ev.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const b64 = await blobToBase64(blob);
        if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
        setAudioPreviewUrl(URL.createObjectURL(blob));
        setAudioBase64(b64);
        setAudioMimeType(mimeType.split(";")[0]);
        setIsRecording(false);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecordingSeconds(0);
      setIsRecording(true);
      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch {
      setMicError(
        "Microphone permission was denied. Allow mic access or upload an audio clip."
      );
    }
  };

  const handleStopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
  };

  const clearAudio = () => {
    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    setAudioPreviewUrl(null);
    setAudioBase64(null);
    setAudioMimeType(null);
    setRecordingSeconds(0);
    setMicError(null);
  };

  const handleAudioFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMicError(null);
    const b64 = await blobToBase64(file);
    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    setAudioPreviewUrl(URL.createObjectURL(file));
    setAudioBase64(b64);
    setAudioMimeType(file.type || "audio/mp3");
    e.target.value = "";
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await blobToBase64(file);
    setImageBase64(b64);
    setImageMimeType(file.type || "image/jpeg");
    setImagePreviewUrl(URL.createObjectURL(file));
    setImageLabel(file.name);
    e.target.value = "";
  };

  const handleUseSampleImage = async (
    src: string,
    label: string,
    suggestedQuery: string,
    suggestedLoc: string
  ) => {
    try {
      const resp = await fetch(src);
      const blob = await resp.blob();
      const b64 = await blobToBase64(blob);
      setImageBase64(b64);
      setImageMimeType(blob.type || "image/jpeg");
      setImagePreviewUrl(src);
      setImageLabel(label);
      setLocation(suggestedLoc);
      if (!textQuery.trim()) {
        setTextQuery(suggestedQuery);
      }
      void loadFieldSnapshot(suggestedLoc);
    } catch {
      setAdviseError("Could not load sample field photo.");
    }
  };

  const clearImage = () => {
    setImageBase64(null);
    setImageMimeType(null);
    setImagePreviewUrl(null);
    setImageLabel(null);
  };

  const handleRunSample = (index: number) => {
    const sample = SAMPLE_QUERIES[index];
    if (!sample) return;
    setLocation(sample.location);
    setLanguageLabel(sample.language);
    setTextQuery(sample.query);
    clearAudio();
    clearImage();
    void loadFieldSnapshot(sample.location);
    void submitQuery({
      location: sample.location,
      language: sample.language,
      query: sample.query,
      audioB64: null,
      audioMime: null,
      imgB64: null,
      imgMime: null,
    });
  };

  const handleResetConsultation = () => {
    setTextQuery("");
    clearAudio();
    clearImage();
    setAdvisory(null);
    setAdviseError(null);
    setTtsAudioBase64(null);
    setTtsError(null);
    queryInputRef.current?.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLiveMandiSearch = async (commodity: string, state: string) => {
    setMandiSearching(true);
    try {
      const params = new URLSearchParams();
      if (commodity.trim()) params.set("commodity", commodity.trim());
      if (state.trim()) params.set("state", state.trim());
      const res = await fetch(`/api/mandi?${params.toString()}`);
      if (res.ok) {
        const data = (await res.json()) as MandiPricesResult;
        setMandi(data);
      }
    } finally {
      setMandiSearching(false);
    }
  };

  const handleAskAboutCrop = (cropName: string) => {
    const prompt = `Tell me the best sowing/care advice, weather check, IPM protection, and current mandi rate for ${cropName} in ${location}.`;
    setTextQuery(prompt);
    window.scrollTo({ top: 0, behavior: "smooth" });
    queryInputRef.current?.focus();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          <a
            href="#advisor"
            className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            KisanMitra AI
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a
              href="#advisor"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Advisor
            </a>
            <a
              href="#weather-soil"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Weather & Soil
            </a>
            <a
              href="#mandi"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Mandi Rates
            </a>
            <a
              href="#crops"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Crop Guide
            </a>
          </nav>

          <button
            type="button"
            onClick={handleResetConsultation}
            className="px-4 py-2 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            New Consultation
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-12">
        <section id="advisor" className="space-y-6 scroll-mt-20">
          <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 min-h-[190px] flex items-end">
            {!bannerLoadFailed && (
              <img
                src={HERO_BANNER_SRC}
                alt="Green terraced agricultural fields in India at sunrise"
                referrerPolicy="no-referrer"
                onError={() => setBannerLoadFailed(true)}
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
            )}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/75 to-slate-900/40"
            />
            <div className="relative z-10 p-6 sm:p-8 max-w-3xl text-white">
              <p className="text-xs font-medium text-emerald-300 mb-1.5">
                Multilingual Agritech & Resource Advisory
              </p>
              <h1 className="font-display text-2xl sm:text-4xl font-semibold tracking-tight text-balance leading-tight">
                Crop, weather, soil, and mandi advice in your own language
              </h1>
              <p className="text-sm sm:text-base text-slate-200 mt-2 max-w-2xl leading-relaxed">
                Speak a voice note, type in any regional language, or share a
                leaf photo. Grounded with Open-Meteo forecasts, SoilGrids pH,
                and Agmarknet mandi rates.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="location-input"
                  className="block text-xs font-medium text-slate-700"
                >
                  Village / District / State
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="location-input"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onBlur={() => {
                      if (location.trim()) void loadFieldSnapshot(location);
                    }}
                    placeholder="e.g., Nashik, Maharashtra"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-emerald-700"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {QUICK_LOCATIONS.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => {
                        setLocation(loc);
                        void loadFieldSnapshot(loc);
                      }}
                      className={`px-2.5 py-1 text-xs rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        location === loc
                          ? "bg-emerald-50 border-emerald-600 text-emerald-800 font-medium"
                          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {loc.split(",")[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="language-select"
                  className="block text-xs font-medium text-slate-700"
                >
                  Preferred Reply Language
                </label>
                <select
                  id="language-select"
                  value={languageLabel}
                  onChange={(e) => setLanguageLabel(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-emerald-700"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.label}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700">
                    Speak Your Question (Voice Note)
                  </span>
                  {isRecording && (
                    <span className="text-xs font-mono tabular-nums font-medium text-red-700">
                      Recording {formatDuration(recordingSeconds)}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={handleStartRecording}
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Mic className="w-3.5 h-3.5 text-emerald-700" />
                      Record Voice
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStopRecording}
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Square className="w-3.5 h-3.5" />
                      Stop Recording
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => audioFileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload Audio
                  </button>
                  <input
                    ref={audioFileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleAudioFileUpload}
                    className="hidden"
                  />
                </div>

                {micError && (
                  <p className="text-xs text-red-700 leading-snug">
                    {micError}
                  </p>
                )}

                {audioPreviewUrl && (
                  <div className="flex items-center gap-2 pt-1">
                    <audio
                      controls
                      src={audioPreviewUrl}
                      className="h-9 flex-1 max-w-full"
                    />
                    <button
                      type="button"
                      onClick={clearAudio}
                      title="Remove voice note"
                      className="p-2 text-slate-500 hover:text-red-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="question-textarea"
                  className="block text-xs font-medium text-slate-700"
                >
                  Type Your Question (Optional if speaking or uploading photo)
                </label>
                <textarea
                  ref={queryInputRef}
                  id="question-textarea"
                  rows={3}
                  value={textQuery}
                  onChange={(e) => setTextQuery(e.target.value)}
                  placeholder="e.g., इस हफ्ते प्याज की बुवाई और खाद-दवाई की सलाह दें, और मंडी भाव भी बताएं।"
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-emerald-700 resize-y"
                />
              </div>

              <div className="space-y-2">
                <span className="block text-xs font-medium text-slate-700">
                  Crop / Leaf / Soil Photo (Optional)
                </span>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-emerald-700" />
                    Upload Photo
                  </button>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      void handleUseSampleImage(
                        SAMPLE_TOMATO_SRC,
                        "Tomato leaf spot sample",
                        "मेरे टमाटर के पत्तों पर गोल भूरे धब्बे हैं। यह कौन सा रोग है और मौसम देखकर सुरक्षित इलाज बताएं।",
                        "Kolar, Karnataka"
                      )
                    }
                    className="px-3 py-2 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 hover:border-emerald-600 hover:text-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Sample: Tomato Leaf
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void handleUseSampleImage(
                        SAMPLE_ONION_SRC,
                        "Onion thrips stress sample",
                        "माझ्या कांद्याच्या पानांवर पांढरट चट्टे आणि सुकलेली टोके दिसत आहेत. उपाय व फवारणी वेळ सांगा.",
                        "Nashik, Maharashtra"
                      )
                    }
                    className="px-3 py-2 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 hover:border-emerald-600 hover:text-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Sample: Onion Crop
                  </button>
                </div>

                {imagePreviewUrl && (
                  <div className="relative mt-2 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-between p-2 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={imagePreviewUrl}
                        alt={imageLabel || "Uploaded crop photo"}
                        referrerPolicy="no-referrer"
                        className="w-16 h-12 object-cover rounded border border-slate-200 shrink-0"
                      />
                      <span className="text-xs font-medium text-slate-700 truncate">
                        {imageLabel || "Attached crop photo"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={clearImage}
                      title="Remove photo"
                      className="p-1.5 text-slate-500 hover:text-red-700 rounded hover:bg-slate-200/70 transition-colors cursor-pointer shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled={advising}
                onClick={() => void submitQuery()}
                className="w-full py-2.5 px-4 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              >
                {advising ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Preparing Advisory...
                  </>
                ) : (
                  "Get Advice"
                )}
              </button>
            </div>

            <div className="lg:col-span-7">
              <AdvisoryOutput
                advisory={advisory}
                isLoading={advising}
                error={adviseError}
                ttsAudioBase64={ttsAudioBase64}
                ttsLoading={ttsLoading}
                ttsError={ttsError}
                languageLabel={languageLabel}
                onRetryTts={() => {
                  if (advisory?.advisoryText) {
                    void generateVoiceReply(
                      advisory.advisoryText,
                      languageLabel
                    );
                  }
                }}
                onRunSample={handleRunSample}
              />
            </div>
          </div>
        </section>

        <WeatherSoilSection
          location={location}
          weather={weather}
          soil={soil}
          loading={snapshotLoading}
          onRefresh={() => void loadFieldSnapshot(location)}
        />

        <MandiSection
          mandiData={mandi}
          onSearchLiveMandi={handleLiveMandiSearch}
          searching={mandiSearching}
        />

        <CropCalendarSection
          crops={crops}
          onAskAboutCrop={handleAskAboutCrop}
        />
      </main>

      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <span>KisanMitra AI · Multilingual Farmer Resource Advisory</span>
          <span>
            Weather via Open-Meteo · Soil via ISRIC SoilGrids · Mandi via
            Agmarknet
          </span>
        </div>
      </footer>
    </div>
  );
}
