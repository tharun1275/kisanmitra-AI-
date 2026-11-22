import React, { useEffect, useRef, useState } from "react";
import {
  Download,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  Sprout,
  Volume2,
} from "lucide-react";
import type { AdvisorResponse } from "../types";

interface AdvisoryOutputProps {
  advisory: AdvisorResponse | null;
  isLoading: boolean;
  error: string | null;
  ttsAudioBase64: string | null;
  ttsLoading: boolean;
  ttsError: string | null;
  languageLabel: string;
  onRetryTts: () => void;
  onRunSample: (sampleIndex: number) => void;
}

function renderFormattedAdvisory(text: string): React.ReactNode {
  const lines = text.split("\n");
  return lines.map((rawLine, idx) => {
    const line = rawLine.trim();
    if (!line) {
      return <div key={idx} className="h-2.5" />;
    }

    const isBullet = /^[-*•]\s+/.test(line);
    const cleaned = line
      .replace(/^#{1,4}\s+/, "")
      .replace(/^[-*•]\s+/, "");

    const parts = cleaned.split(/(\*\*[^*]+\*\*)/g);
    const renderedParts = parts.map((part, pIdx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={pIdx} className="font-semibold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <React.Fragment key={pIdx}>{part}</React.Fragment>;
    });

    if (isBullet) {
      return (
        <div key={idx} className="flex items-start gap-2.5 pl-1 py-0.5">
          <span
            aria-hidden="true"
            className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-700 shrink-0"
          />
          <p className="text-[15px] leading-relaxed text-slate-700">
            {renderedParts}
          </p>
        </div>
      );
    }

    const isHeading =
      /^#{1,4}\s+/.test(line) ||
      (/^\*\*[^*]+\*\*:?$/.test(line) && line.length < 70);

    if (isHeading) {
      return (
        <h4
          key={idx}
          className="font-display text-base font-semibold text-slate-900 pt-2 first:pt-0"
        >
          {renderedParts}
        </h4>
      );
    }

    return (
      <p key={idx} className="text-[15px] leading-relaxed text-slate-700">
        {renderedParts}
      </p>
    );
  });
}

const TOOL_LABELS: Record<string, string> = {
  get_weather_forecast: "Open-Meteo 7-Day Forecast",
  get_soil_profile: "ISRIC SoilGrids / Soil Baseline",
  get_mandi_prices: "Agmarknet Mandi Rates",
  get_crop_advisory_reference: "Crop Calendar & IPM Guide",
};

export const AdvisoryOutput: React.FC<AdvisoryOutputProps> = ({
  advisory,
  isLoading,
  error,
  ttsAudioBase64,
  ttsLoading,
  ttsError,
  languageLabel,
  onRetryTts,
  onRunSample,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!ttsAudioBase64) {
      setAudioUrl(null);
      setIsPlaying(false);
      return;
    }

    const binary = atob(ttsAudioBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);
    setAudioUrl(url);
    setIsPlaying(false);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [ttsAudioBase64]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const replayAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-5 min-h-[460px]">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5 text-slate-900">
            <Loader2 className="w-5 h-5 text-emerald-700 animate-spin" />
            <span className="font-display font-semibold text-base">
              Checking weather, soil, and mandi data...
            </span>
          </div>
          <span className="text-xs text-slate-500 whitespace-nowrap">
            {languageLabel}
          </span>
        </div>
        <div className="space-y-3 animate-pulse">
          <div className="h-12 bg-slate-100 rounded-lg w-full" />
          <div className="h-4 bg-slate-100 rounded w-3/4 mt-4" />
          <div className="h-4 bg-slate-100 rounded w-full" />
          <div className="h-4 bg-slate-100 rounded w-5/6" />
          <div className="h-4 bg-slate-100 rounded w-2/3 mt-4" />
          <div className="h-4 bg-slate-100 rounded w-full" />
          <div className="h-4 bg-slate-100 rounded w-4/5" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-6 flex flex-col gap-4 min-h-[460px]">
        <div className="pb-3 border-b border-red-100">
          <h3 className="font-display text-lg font-semibold text-red-900">
            Advisory Unavailable
          </h3>
          <p className="text-sm text-red-700 mt-1">{error}</p>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          Verify your village or district name and ensure your server API key is
          configured in Settings &gt; Secrets, then try submitting again.
        </p>
      </div>
    );
  }

  if (!advisory) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between gap-6 min-h-[460px]">
        <div>
          <div className="flex items-center gap-2.5 text-emerald-800 mb-2">
            <Sprout className="w-5 h-5" />
            <h3 className="font-display text-lg font-semibold text-slate-900">
              Field Advisory Output
            </h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed max-w-prose">
            Ask a question by typing, recording a voice note in your regional
            language, or attaching a crop leaf photo. KisanMitra automatically
            fetches live local weather, soil pH, crop IPM steps, and wholesale
            mandi prices before replying in plain spoken language.
          </p>
        </div>

        <div className="border-t border-slate-100 pt-5">
          <p className="text-xs font-medium text-slate-500 mb-3">
            Try an instant regional consultation
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => onRunSample(0)}
              className="text-left p-3 rounded-lg border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/40 transition-colors cursor-pointer"
            >
              <div className="text-xs font-medium text-slate-500 mb-1">
                Nashik, Maharashtra · Marathi
              </div>
              <div className="text-sm font-medium text-slate-900 line-clamp-2">
                माझ्या कांदा पिकासाठी या आठवड्याचे हवामान, फवारणी आणि बाजारभाव सांगा.
              </div>
            </button>

            <button
              type="button"
              onClick={() => onRunSample(1)}
              className="text-left p-3 rounded-lg border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/40 transition-colors cursor-pointer"
            >
              <div className="text-xs font-medium text-slate-500 mb-1">
                Ludhiana, Punjab · Punjabi
              </div>
              <div className="text-sm font-medium text-slate-900 line-clamp-2">
                ਕਣਕ ਦੀ ਬਿਜਾਈ ਲਈ ਮਿੱਟੀ ਅਤੇ ਮੌਸਮ ਦੀ ਸਲਾਹ ਦਿਓ ਅਤੇ ਮੰਡੀ ਦਾ ਰੇਟ ਦੱਸੋ।
              </div>
            </button>

            <button
              type="button"
              onClick={() => onRunSample(2)}
              className="text-left p-3 rounded-lg border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/40 transition-colors cursor-pointer"
            >
              <div className="text-xs font-medium text-slate-500 mb-1">
                Kolar, Karnataka · Kannada
              </div>
              <div className="text-sm font-medium text-slate-900 line-clamp-2">
                ಟೊಮೆಟೊ ಬೆಳೆಗೆ ಈ ವಾರದ ಹವಾಮಾನ, ರೋಗ ರಕ್ಷಣೆ ಮತ್ತು ಮಾರುಕಟ್ಟೆ ಬೆಲೆ ತಿಳಿಸಿ.
              </div>
            </button>

            <button
              type="button"
              onClick={() => onRunSample(3)}
              className="text-left p-3 rounded-lg border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/40 transition-colors cursor-pointer"
            >
              <div className="text-xs font-medium text-slate-500 mb-1">
                Indore, Madhya Pradesh · Hindi
              </div>
              <div className="text-sm font-medium text-slate-900 line-clamp-2">
                क्या मुझे अभी सोयाबीन बेचना चाहिए या रुकना चाहिए? मौसम और मंडी भाव देखकर बताएं।
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-5 min-h-[460px]">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h3 className="font-display text-lg font-semibold text-slate-900">
            KisanMitra Advisory
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {languageLabel}
            {advisory.toolsUsed.length > 0 && (
              <>
                <span className="mx-1.5" aria-hidden="true">
                  ·
                </span>
                <span>{advisory.toolsUsed.length} live data tools checked</span>
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {ttsLoading && (
            <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg whitespace-nowrap">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
              Preparing voice note
            </div>
          )}

          {!ttsLoading && audioUrl && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1">
              <button
                type="button"
                onClick={togglePlay}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    Pause Voice
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    Listen to Advice
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={replayAudio}
                title="Replay from start"
                className="p-1.5 text-slate-600 hover:text-slate-900 rounded-md hover:bg-white transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setPlaybackRate((prev) => (prev === 1.0 ? 0.9 : 1.0))
                }
                className="px-2 py-1 text-xs font-mono tabular-nums text-slate-700 hover:text-slate-900 rounded-md hover:bg-white transition-colors whitespace-nowrap cursor-pointer"
              >
                {playbackRate.toFixed(1)}x
              </button>
              <a
                href={audioUrl}
                download="kisanmitra-advisory.wav"
                title="Download WAV audio"
                className="p-1.5 text-slate-600 hover:text-slate-900 rounded-md hover:bg-white transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
              </a>
              <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={() => setIsPlaying(false)}
                onPause={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
                className="hidden"
              />
            </div>
          )}

          {!ttsLoading && !audioUrl && ttsError && (
            <button
              type="button"
              onClick={onRetryTts}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" />
              Generate Voice
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2.5 flex-1">
        {renderFormattedAdvisory(advisory.advisoryText)}
      </div>

      {advisory.toolsUsed.length > 0 && (
        <div className="pt-4 border-t border-slate-100">
          <p className="text-xs font-medium text-slate-500 mb-2">
            Grounded Sources Consulted
          </p>
          <div className="space-y-1.5">
            {advisory.toolsUsed.map((tool, idx) => (
              <div
                key={`${tool.name}-${idx}`}
                className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-slate-600"
              >
                <span className="font-medium text-slate-800">
                  {TOOL_LABELS[tool.name] ?? tool.name}
                </span>
                <span className="text-slate-500 font-mono tabular-nums">
                  {tool.summary}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
