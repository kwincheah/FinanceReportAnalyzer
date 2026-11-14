import React from "react";
import { BarChart2 } from "lucide-react";
import { SectorIndexItem } from "../../types/terminal";

interface SectorPerformanceGridProps {
  sectors: SectorIndexItem[];
}

export function SectorPerformanceGrid({ sectors }: SectorPerformanceGridProps) {
  return (
    <div className="w-full space-y-2.5">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1F2328] pb-2">
        <div className="flex items-center space-x-2">
          <BarChart2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <h2 className="text-xs font-bold text-slate-900 dark:text-white">Bursa Malaysia Sector Performance</h2>
          <span className="text-[10px] font-mono text-slate-500 dark:text-[#8B949E]">13 Tracked Sectors</span>
        </div>
        <span className="text-[10px] text-slate-500 dark:text-[#8B949E]">Macro Relative Strength</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
        {sectors.map((s) => {
          const isPos = s.change >= 0;
          return (
            <div
              key={s.code}
              className="bg-white dark:bg-[#121417] p-2.5 rounded-xl border border-slate-200 dark:border-[#1F2328] flex flex-col justify-between h-[84px] shadow-2xs hover:border-slate-300 dark:hover:border-[#30363D] transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 dark:text-[#8B949E] font-medium truncate max-w-[85px]">
                  {s.name}
                </span>
                <span
                  className={`text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded ${
                    isPos
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                      : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {isPos ? "+" : ""}
                  {s.change.toFixed(2)}%
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 dark:text-[#8B949E] block">Top Constituent:</span>
                <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate block">
                  {s.leader}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
