import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { MandiPriceRecord, MandiPricesResult } from "../types";

interface MandiSectionProps {
  mandiData: MandiPricesResult | null;
  onSearchLiveMandi: (commodity: string, state: string) => Promise<void>;
  searching: boolean;
}

export const MandiSection: React.FC<MandiSectionProps> = ({
  mandiData,
  onSearchLiveMandi,
  searching,
}) => {
  const [filterText, setFilterText] = useState("");
  const [commodityQuery, setCommodityQuery] = useState("");
  const [stateQuery, setStateQuery] = useState("");

  const rows: MandiPriceRecord[] = useMemo(() => {
    const base = mandiData?.prices ?? [];
    const q = filterText.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (r) =>
        r.commodity.toLowerCase().includes(q) ||
        r.state.toLowerCase().includes(q) ||
        r.market.toLowerCase().includes(q)
    );
  }, [mandiData, filterText]);

  const handleLiveLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSearchLiveMandi(commodityQuery, stateQuery);
  };

  return (
    <section
      id="mandi"
      className="pt-10 border-t border-slate-200 scroll-mt-20"
    >
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-semibold text-slate-900">
            Mandi Wholesale Prices
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            {mandiData?.source || "Reference Mandi Dataset"} ·{" "}
            {mandiData?.unit || "INR per Quintal (100 kg)"}
          </p>
        </div>

        <form
          onSubmit={handleLiveLookup}
          className="flex flex-wrap items-center gap-2"
        >
          <input
            type="text"
            value={commodityQuery}
            onChange={(e) => setCommodityQuery(e.target.value)}
            placeholder="Commodity (e.g. Onion)"
            className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-700 w-44"
          />
          <input
            type="text"
            value={stateQuery}
            onChange={(e) => setStateQuery(e.target.value)}
            placeholder="State (optional)"
            className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-700 w-36"
          />
          <button
            type="submit"
            disabled={searching}
            className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {searching ? "Checking..." : "Check Agmarknet"}
          </button>
        </form>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filter table by crop, state, or mandi..."
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-emerald-700"
            />
          </div>
          <span className="text-xs text-slate-500 font-mono tabular-nums">
            {rows.length} market quotes
          </span>
        </div>

        {rows.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">
            {mandiData?.message ||
              "No matching mandi rates found for this filter. Clear the filter or search another commodity."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-medium text-slate-500 bg-slate-50/70">
                  <th className="py-2.5 px-4">Commodity</th>
                  <th className="py-2.5 px-4">Market (Mandi)</th>
                  <th className="py-2.5 px-4">State</th>
                  <th className="py-2.5 px-4 text-right">Min (₹/q)</th>
                  <th className="py-2.5 px-4 text-right">Max (₹/q)</th>
                  <th className="py-2.5 px-4 text-right">Modal (₹/q)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {rows.map((row, idx) => (
                  <tr
                    key={`${row.commodity}-${row.market}-${idx}`}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="py-2.5 px-4 font-medium text-slate-900">
                      {row.commodity}
                    </td>
                    <td className="py-2.5 px-4 text-slate-700">{row.market}</td>
                    <td className="py-2.5 px-4 text-slate-600">{row.state}</td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-600">
                      ₹{row.min_price.toLocaleString("en-IN")}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-600">
                      ₹{row.max_price.toLocaleString("en-IN")}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-emerald-800">
                      ₹{row.modal_price.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};
