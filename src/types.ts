export type LanguageOption = {
  label: string;
  nativeName: string;
  code: string;
};

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { label: "Hindi (हिन्दी)", nativeName: "हिन्दी", code: "hi" },
  { label: "Marathi (मराठी)", nativeName: "मराठी", code: "mr" },
  { label: "Tamil (தமிழ்)", nativeName: "தமிழ்", code: "ta" },
  { label: "Telugu (తెలుగు)", nativeName: "తెలుగు", code: "te" },
  { label: "Kannada (ಕನ್ನಡ)", nativeName: "ಕನ್ನಡ", code: "kn" },
  { label: "Bengali (বাংলা)", nativeName: "বাংলা", code: "bn" },
  { label: "Gujarati (ગુજરાતી)", nativeName: "ગુજરાતી", code: "gu" },
  { label: "Punjabi (ਪੰਜਾਬੀ)", nativeName: "ਪੰਜਾਬੀ", code: "pa" },
  { label: "Malayalam (മലയാളം)", nativeName: "മലയാളം", code: "ml" },
  { label: "English", nativeName: "English", code: "en" },
];

export interface ForecastDay {
  date: string;
  temp_min_c: number;
  temp_max_c: number;
  rain_mm: number;
  rain_probability_pct: number;
  max_wind_kmh: number;
  evapotranspiration_mm: number;
}

export interface WeatherForecastResult {
  status: "success" | "error";
  source?: string;
  location?: string;
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    precipitation?: number;
    wind_speed_10m?: number;
  };
  forecast_7_day?: ForecastDay[];
  message?: string;
}

export interface SoilProfileResult {
  status: "success" | "error";
  source: string;
  location: string;
  soil_data: {
    soil_type?: string;
    ph?: number;
    organic_carbon_g_kg?: number;
    clay_pct?: number;
    sand_pct?: number;
    silt_pct?: number;
    nitrogen_g_kg?: number;
    nitrogen_status?: string;
    texture?: string;
  };
  note?: string;
}

export interface MandiPriceRecord {
  commodity: string;
  state: string;
  district?: string;
  market: string;
  variety?: string;
  arrival_date?: string;
  min_price: number;
  max_price: number;
  modal_price: number;
}

export interface MandiPricesResult {
  status: "success" | "not_found";
  source: string;
  unit: string;
  prices: MandiPriceRecord[];
  message?: string;
}

export interface CropReferenceEntry {
  crop: string;
  season: string;
  ideal_ph: string;
  water_need: string;
  protection: string;
}

export interface ToolInvocationRecord {
  name: string;
  args: Record<string, unknown>;
  summary: string;
}

export interface AdvisorResponse {
  advisoryText: string;
  detectedIntent?: string;
  toolsUsed: ToolInvocationRecord[];
  weather?: WeatherForecastResult;
  soil?: SoilProfileResult;
  mandi?: MandiPricesResult;
  cropRef?: CropReferenceEntry;
}
