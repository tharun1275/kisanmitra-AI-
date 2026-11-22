import React from "react";
import { CloudRain, Droplets, RefreshCw, Thermometer, Wind } from "lucide-react";
import type { SoilProfileResult, WeatherForecastResult } from "../types";

interface WeatherSoilSectionProps {
  location: string;
  weather: WeatherForecastResult | null;
  soil: SoilProfileResult | null;
  loading: boolean;
  onRefresh: () => void;
}

function getSprayGuidance(
  rainMm: number,
  rainProb: number,
  windKmh: number
): { label: string; toneClass: string } {
  if (rainProb >= 60 || rainMm >= 4) {
    return {
      label: "Avoid Spray (Rain Risk)",
      toneClass: "text-amber-700",
    };
  }
  if (windKmh >= 22) {
    return {
      label: "High Wind Drift",
      toneClass: "text-amber-700",
    };
  }
  return {
    label: "Suitable Window",
    toneClass: "text-emerald-700",
  };
}

export const WeatherSoilSection: React.FC<WeatherSoilSectionProps> = ({
  location,
  weather,
  soil,
  loading,
  onRefresh,
}) => {
  const forecast = weather?.forecast_7_day ?? [];
  const current = weather?.current;

  return (
    <section
      id="weather-soil"
      className="pt-10 border-t border-slate-200 scroll-mt-20"
    >
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-semibold text-slate-900">
            Local Weather & Soil Conditions
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            {weather?.source || "Live 7-Day Weather Forecast"} and ISRIC
            SoilGrids profile for{" "}
            <span className="font-medium text-slate-800">
              {weather?.location || location}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Local Data
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <h3 className="font-display text-base font-semibold text-slate-900">
              7-Day Agricultural Forecast
            </h3>

            {current && (
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 font-mono tabular-nums">
                <span className="inline-flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-slate-500" />
                  Now {current.temperature_2m ?? "--"}°C
                </span>
                <span className="inline-flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-slate-500" />
                  RH {current.relative_humidity_2m ?? "--"}%
                </span>
                <span className="inline-flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-slate-500" />
                  {current.wind_speed_10m ?? "--"} km/h
                </span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="p-5 space-y-2.5 animate-pulse">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-9 bg-slate-100 rounded w-full" />
              ))}
            </div>
          ) : forecast.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">
              {weather?.message ||
                "Enter a valid Indian village or district and click Refresh Local Data to view the 7-day agricultural forecast."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-medium text-slate-500 bg-slate-50/70">
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4 text-right">Min / Max</th>
                    <th className="py-2.5 px-4 text-right">Rain (mm)</th>
                    <th className="py-2.5 px-4 text-right">Prob.</th>
                    <th className="py-2.5 px-4 text-right">ET0 (mm)</th>
                    <th className="py-2.5 px-4 text-right">Wind</th>
                    <th className="py-2.5 px-4">Field Window</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {forecast.map((day) => {
                    const guidance = getSprayGuidance(
                      day.rain_mm,
                      day.rain_probability_pct,
                      day.max_wind_kmh
                    );
                    const formattedDate = new Date(
                      `${day.date}T00:00:00`
                    ).toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    });

                    return (
                      <tr
                        key={day.date}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="py-2.5 px-4 font-medium text-slate-900 whitespace-nowrap">
                          {formattedDate}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-700 whitespace-nowrap">
                          {day.temp_min_c.toFixed(0)}° /{" "}
                          {day.temp_max_c.toFixed(0)}°C
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-700 whitespace-nowrap">
                          {day.rain_mm.toFixed(1)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-700 whitespace-nowrap">
                          {day.rain_probability_pct}%
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-700 whitespace-nowrap">
                          {day.evapotranspiration_mm.toFixed(1)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-700 whitespace-nowrap">
                          {day.max_wind_kmh.toFixed(0)} km/h
                        </td>
                        <td
                          className={`py-2.5 px-4 text-xs font-medium whitespace-nowrap ${guidance.toneClass}`}
                        >
                          {guidance.label}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-display text-base font-semibold text-slate-900">
              Soil Health Profile
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {soil?.source || "Regional Soil Baseline"}
            </p>
          </div>

          {loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-6 bg-slate-100 rounded w-1/2" />
              <div className="h-6 bg-slate-100 rounded w-2/3" />
              <div className="h-6 bg-slate-100 rounded w-3/4" />
            </div>
          ) : soil ? (
            <dl className="space-y-3 text-sm">
              {soil.soil_data.soil_type && (
                <div className="flex items-baseline justify-between gap-4 py-1 border-b border-slate-100">
                  <dt className="text-slate-500">Soil Type</dt>
                  <dd className="font-medium text-slate-900 text-right">
                    {soil.soil_data.soil_type}
                  </dd>
                </div>
              )}

              <div className="flex items-baseline justify-between gap-4 py-1 border-b border-slate-100">
                <dt className="text-slate-500">Soil pH (0–5 cm)</dt>
                <dd className="font-mono tabular-nums font-medium text-slate-900">
                  {soil.soil_data.ph ?? "N/A"}
                </dd>
              </div>

              <div className="flex items-baseline justify-between gap-4 py-1 border-b border-slate-100">
                <dt className="text-slate-500">Organic Carbon</dt>
                <dd className="font-mono tabular-nums font-medium text-slate-900">
                  {soil.soil_data.organic_carbon_g_kg !== undefined
                    ? `${soil.soil_data.organic_carbon_g_kg} g/kg`
                    : "N/A"}
                </dd>
              </div>

              {soil.soil_data.texture && (
                <div className="flex items-baseline justify-between gap-4 py-1 border-b border-slate-100">
                  <dt className="text-slate-500">Texture</dt>
                  <dd className="font-medium text-slate-900 text-right">
                    {soil.soil_data.texture}
                  </dd>
                </div>
              )}

              {soil.soil_data.clay_pct !== undefined && (
                <div className="flex items-baseline justify-between gap-4 py-1 border-b border-slate-100">
                  <dt className="text-slate-500">Clay / Sand / Silt</dt>
                  <dd className="font-mono tabular-nums font-medium text-slate-900">
                    {soil.soil_data.clay_pct}% / {soil.soil_data.sand_pct ?? 0}% /{" "}
                    {soil.soil_data.silt_pct ?? 0}%
                  </dd>
                </div>
              )}

              <div className="flex items-baseline justify-between gap-4 py-1">
                <dt className="text-slate-500">Nitrogen</dt>
                <dd className="font-mono tabular-nums font-medium text-slate-900">
                  {soil.soil_data.nitrogen_g_kg !== undefined
                    ? `${soil.soil_data.nitrogen_g_kg} g/kg`
                    : soil.soil_data.nitrogen_status ?? "Medium"}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-slate-500">
              Soil data will appear here once location is resolved.
            </p>
          )}

          {soil?.note && (
            <p className="text-xs text-slate-500 leading-relaxed pt-2 border-t border-slate-100">
              {soil.note}
            </p>
          )}

          <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-600">
            <CloudRain className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span>
              ET0 measures daily crop water evaporation to plan drip or furrow
              irrigation.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
