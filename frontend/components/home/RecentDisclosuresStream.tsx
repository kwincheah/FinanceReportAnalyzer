import React from "react";
import { FileText } from "lucide-react";
import { DisclosureFeedItem } from "../../types/terminal";

interface RecentDisclosuresStreamProps {
  disclosures: DisclosureFeedItem[];
  onSelectDisclosure: (code: string, prompt: string) => void;
  loading: boolean;
}

export function RecentDisclosuresStream({
  disclosures,
  onSelectDisclosure,
  loading,
}: RecentDisclosuresStreamProps) {
  return (
    <div className="bg-white dark:bg-[#121417] border border-slate-200 dark:border-[#1F2328] rounded-xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1F2328] pb-3">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-xs font-bold text-slate-900 dark:text-white">Recent Bursa Disclosures</h2>
          </div>
          <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-medium border border-emerald-200 dark:border-emerald-800/40 flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1"></span>
            Live Feed
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-[#1F2328]/70 mt-1">
          {disclosures.map((item) => (
            <div key={item.code} className="py-2.5 flex items-start justify-between gap-3 group">
              <div className="min-w-0 space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-[#1F2328] px-1.5 py-0.5 rounded">
                    {item.code}
                  </span>
                  <span className="font-semibold text-xs text-slate-900 dark:text-white">{item.name}</span>
                  <span className="text-[10px] text-slate-400 dark:text-[#8B949E] font-mono">{item.period}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-[#1F2328] text-slate-500 dark:text-[#8B949E] font-mono">
                    {item.is_audited ? "Audited" : "Unaudited"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-[#8B949E] line-clamp-1 leading-snug">
                  {item.title}
                </p>
                <div className="flex items-center space-x-2 text-[10px] text-slate-500 dark:text-[#8B949E]">
                  <span>
                    Rev: <strong className="text-slate-900 dark:text-white font-mono">RM {item.rev_m}M</strong>
                  </span>
                  <span>•</span>
                  <span>
                    PAT: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">RM {item.profit_m}M</strong>
                  </span>
                </div>
              </div>

              <button
                onClick={() =>
                  onSelectDisclosure(
                    item.code,
                    `Provide a concise breakdown of the ${item.period} financial disclosures, operating margins, and profit variance.`
                  )
                }
                disabled={loading}
                className="shrink-0 bg-slate-100 dark:bg-[#16191D] hover:bg-blue-600 hover:text-white text-slate-700 dark:text-[#8B949E] px-2 py-1 rounded text-[10px] font-medium border border-slate-200 dark:border-[#1F2328] transition active:scale-95 disabled:opacity-40"
              >
                Inspect
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-2 mt-2 border-t border-slate-100 dark:border-[#1F2328] text-[10px] text-slate-400 dark:text-[#8B949E] flex items-center justify-between">
        <span>Bursa Malaysia Para 9.22 (Unaudited Quarterly Reports)</span>
        <span>Official Regulatory Filings</span>
      </div>
    </div>
  );
}
