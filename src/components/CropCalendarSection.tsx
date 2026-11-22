import React, { useState } from "react";
import type { CropReferenceEntry } from "../types";

interface CropCalendarSectionProps {
  crops: CropReferenceEntry[];
  onAskAboutCrop: (cropName: string) => void;
}

export const CropCalendarSection: React.FC<CropCalendarSectionProps> = ({
  crops,
  onAskAboutCrop,
}) => {
  const [selectedCrop, setSelectedCrop] = useState<string>(
    crops[0]?.crop ?? "Wheat"
  );

  const activeEntry =
    crops.find((c) => c.crop.toLowerCase() === selectedCrop.toLowerCase()) ??
    crops[0];

  if (crops.length === 0) {
    return null;
  }

  return (
    <section
      id="crops"
      className="pt-10 border-t border-slate-200 scroll-mt-20"
    >
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-semibold text-slate-900">
            Crop Calendar & IPM Protection Guide
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Sowing windows, critical irrigation stages, and low-chemical pest
            management practices
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg w-fit mb-6">
        {crops.map((item) => {
          const isActive =
            item.crop.toLowerCase() === (activeEntry?.crop ?? "").toLowerCase();
          return (
            <button
              key={item.crop}
              type="button"
              onClick={() => setSelectedCrop(item.crop)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {item.crop}
            </button>
          );
        })}
      </div>

      {activeEntry && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-display text-xl font-semibold text-slate-900">
                {activeEntry.crop}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ideal Soil pH:{" "}
                <span className="font-mono tabular-nums text-slate-800">
                  {activeEntry.ideal_ph}
                </span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => onAskAboutCrop(activeEntry.crop)}
              className="px-4 py-2 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Ask KisanMitra about {activeEntry.crop}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5">
            <div>
              <h4 className="text-xs font-medium text-slate-500 mb-1.5">
                Sowing & Harvest Window
              </h4>
              <p className="text-sm text-slate-800 leading-relaxed">
                {activeEntry.season}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-medium text-slate-500 mb-1.5">
                Water & Irrigation Schedule
              </h4>
              <p className="text-sm text-slate-800 leading-relaxed">
                {activeEntry.water_need}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-medium text-slate-500 mb-1.5">
                IPM & Disease Protection
              </h4>
              <p className="text-sm text-slate-800 leading-relaxed">
                {activeEntry.protection}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
