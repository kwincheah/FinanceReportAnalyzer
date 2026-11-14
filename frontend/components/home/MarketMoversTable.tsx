import React from "react";
import { TrendingUp } from "lucide-react";
import { MarketMoverItem } from "../../types/terminal";

interface MarketMoversTableProps {
  movers: { [key: string]: MarketMoverItem[] };
  moversTab: "active" | "gainers" | "value";
  setMoversTab: (tab: "active" | "gainers" | "value") => void;
  onSelectStock: (code: string) => void;
  loading: boolean;
}

export function MarketMoversTable({
  movers,
  moversTab,
  setMoversTab,
  onSelectStock,
  loading,
}: MarketMoversTableProps) {
  const currentList = movers[moversTab] || [];

  return (
    <div className="bg-white dark:bg-[#121417] border border-slate-200 dark:border-[#1F2328] rounded-xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-[#1F2328] pb-3 gap-2">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xs font-bold text-slate-900 dark:text-white">Bursa Market Movers</h2>
            <span className="text-[10px] text-slate-500 dark:text-[#8B949E] font-mono">Live Intraday</span>
          </div>

          {/* Sub-tabs: Most Active / Top Gainers / Top Turnover */}
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-[#090A0C] border border-slate-200 dark:border-[#1F2328] p-0.5 rounded-lg text-xs">
            {(["active", "gainers", "value"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setMoversTab(tab)}
                className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition capitalize ${
                  moversTab === tab
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "text-slate-600 dark:text-[#8B949E] hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {tab === "active" ? "Most Active" : tab === "gainers" ? "Top Gainers" : "Top Value"}
              </button>
            ))}
          </div>
        </div>

        {/* Movers Table */}
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-left text-xs table-zebra">
            <thead className="bg-slate-50 dark:bg-[#090A0C] text-slate-500 dark:text-[#8B949E] text-[10px] uppercase border-b border-slate-200 dark:border-[#1F2328]">
              <tr>
                <th className="py-2 px-3 font-semibold">Security</th>
                <th className="py-2 px-3 text-right font-semibold">Price (RM)</th>
                <th className="py-2 px-3 text-right font-semibold">Chg %</th>
                <th className="py-2 px-3 text-right font-semibold">Vol (M)</th>
                <th className="py-2 px-3 text-right font-semibold">Value (RM'M)</th>
                <th className="py-2 px-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1F2328]/70">
              {currentList.map((item) => (
                <tr key={item.code} className="hover:bg-slate-50 dark:hover:bg-[#16191D] transition-colors">
                  <td className="py-2.5 px-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#1F2328] text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-[#30363D]">
                        {item.code}
                      </span>
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white block text-xs truncate max-w-[150px]">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-[#8B949E]">{item.sector}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white tabular-nums">
                    {item.price.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold tabular-nums">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] ${
                        item.change >= 0
                          ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
                          : "text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40"
                      }`}
                    >
                      {item.change >= 0 ? "+" : ""}
                      {item.change.toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300 tabular-nums font-mono text-[11px]">
                    {item.volume_m.toFixed(1)}M
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300 tabular-nums font-mono text-[11px]">
                    {item.turnover_m.toFixed(1)}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => onSelectStock(item.code)}
                      disabled={loading}
                      className="text-[10px] bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-600 text-blue-600 dark:text-blue-400 hover:text-white px-2 py-1 rounded font-semibold border border-blue-200 dark:border-blue-900/50 transition active:scale-95"
                    >
                      Analyze →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="pt-2 mt-2 border-t border-slate-100 dark:border-[#1F2328] text-[10px] text-slate-400 dark:text-[#8B949E] flex items-center justify-between">
        <span>Updated in real-time with Bursa KLSE quote engine</span>
        <span className="font-mono">T+2 Settlement Standard</span>
      </div>
    </div>
  );
}
