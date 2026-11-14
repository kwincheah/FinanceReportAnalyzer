import React from "react";
import { FileText, Calendar, Sparkles, RefreshCw, CheckCircle2 } from "lucide-react";
import { FinancialFiling } from "../../types/terminal";

interface FilingsSidebarProps {
  filings: FinancialFiling[];
  selectedFiling: FinancialFiling | null;
  setSelectedFiling: (filing: FinancialFiling) => void;
  filingsFilter: "all" | "quarterly" | "annual";
  setFilingsFilter: (filter: "all" | "quarterly" | "annual") => void;
  onAskCopilot: (prompt: string) => void;
  chatLoading: boolean;
  activeTab: string;
}

export function FilingsSidebar({
  filings,
  selectedFiling,
  setSelectedFiling,
  filingsFilter,
  setFilingsFilter,
  onAskCopilot,
  chatLoading,
  activeTab,
}: FilingsSidebarProps) {
  const filtered = filings.filter((f) => {
    if (filingsFilter === "quarterly") return f.type.toLowerCase().includes("quarterly");
    if (filingsFilter === "annual") return f.type.toLowerCase().includes("annual");
    return true;
  });

  return (
    <div className={`lg:col-span-3 ${activeTab === "filings" ? "block" : "hidden lg:block"}`}>
      <div className="bg-white dark:bg-[#121417] border border-slate-200 dark:border-[#1F2328] rounded-xl p-3.5 shadow-xs flex flex-col h-auto lg:h-[620px]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1F2328] pb-2.5 shrink-0">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <div>
              <h3 className="font-semibold text-xs text-slate-900 dark:text-white">Financial Reports</h3>
              <p className="text-[10px] text-slate-500 dark:text-[#8B949E]">Official Bursa Filings</p>
            </div>
          </div>
          <span className="text-[10px] font-mono bg-slate-100 dark:bg-[#16191D] text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-[#1F2328]">
            {filings.length} Available
          </span>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-[#090A0C] border border-slate-200 dark:border-[#1F2328] p-0.5 rounded-lg text-[11px] my-2.5 shrink-0">
          {(["all", "quarterly", "annual"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setFilingsFilter(filter)}
              className={`flex-1 py-1 rounded-md font-medium transition text-center capitalize ${
                filingsFilter === filter
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "text-slate-600 dark:text-[#8B949E] hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {filter === "all" ? `All (${filings.length})` : filter}
            </button>
          ))}
        </div>

        {/* Reports List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 min-h-0">
          {filtered.map((f) => {
            const isSelected = selectedFiling?.id === f.id;
            const isAnnual = f.type.toLowerCase().includes("annual");
            return (
              <div
                key={f.id}
                onClick={() => setSelectedFiling(f)}
                className={`p-3 rounded-xl border transition cursor-pointer text-left ${
                  isSelected
                    ? "bg-blue-50/80 dark:bg-[#161d28] border-l-4 border-l-blue-600 dark:border-l-blue-400 border-t border-r border-b border-blue-200 dark:border-blue-900/60 shadow-xs"
                    : "bg-slate-50/70 dark:bg-[#090A0C] border-slate-200 dark:border-[#1F2328] hover:border-blue-400/50 hover:bg-slate-100/70 dark:hover:bg-[#12161f]"
                }`}
              >
                {/* Top Row: Period badge + Latest indicator + Legal Audit Status */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white font-mono bg-slate-200/80 dark:bg-[#16191D] px-2 py-0.5 rounded border border-slate-300 dark:border-[#1F2328]">
                      {f.period}
                    </span>
                    {f.is_latest && (
                      <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60 px-2 py-0.5 rounded-full font-semibold flex items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse mr-1"></span>
                        Latest
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-medium ${
                      isAnnual
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50"
                        : "bg-slate-100 dark:bg-[#1F2328] text-slate-500 dark:text-[#8B949E]"
                    }`}
                  >
                    {isAnnual ? "Audited (AFS)" : "Unaudited (P9.22)"}
                  </span>
                </div>

                {/* Filing Title */}
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 mb-1.5 leading-snug">
                  {f.title}
                </p>

                {/* Period Ended & Release Date */}
                <div className="text-[11px] text-slate-500 dark:text-[#8B949E] space-y-0.5 mb-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>Period Ended:</span>
                    </span>
                    <span className="text-slate-700 dark:text-slate-300 font-mono">{f.period_ended}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Released Date:</span>
                    <span className="text-slate-700 dark:text-slate-300 font-mono">{f.release_date}</span>
                  </div>
                </div>

                {/* Financial Metric Badges + Quick Action */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-[#1F2328] text-[11px]">
                  <div className="text-[11px] text-slate-500 dark:text-[#8B949E]">
                    <span>
                      Rev: <strong className="text-slate-900 dark:text-white font-mono">RM {f.revenue_m?.toLocaleString()}M</strong>
                    </span>
                    <span className="mx-1 text-slate-300 dark:text-[#484F58]">•</span>
                    <span>
                      PAT: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">RM {f.profit_m?.toLocaleString()}M</strong>
                    </span>
                  </div>
                  <button
                    disabled={chatLoading}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFiling(f);
                      onAskCopilot(
                        `Please provide a detailed financial breakdown of the ${f.period} (${f.title}): highlight revenue drivers, operating margins, and disclosures.`
                      );
                    }}
                    className="text-[10px] text-blue-600 dark:text-blue-400 hover:text-white bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-600 dark:hover:bg-blue-600 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-900/50 hover:border-blue-600 transition font-medium flex items-center space-x-1 disabled:opacity-50 active:scale-95 shadow-2xs"
                    title="Ask Copilot about this filing"
                  >
                    {chatLoading && selectedFiling?.id === f.id ? (
                      <RefreshCw className="w-3 h-3 animate-spin text-blue-500 dark:text-blue-400" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    <span>{chatLoading && selectedFiling?.id === f.id ? "Analyzing..." : "Ask"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer note in filings panel */}
        <div className="pt-2 border-t border-slate-200 dark:border-[#1F2328] text-[10px] text-slate-500 dark:text-[#8B949E] flex items-center space-x-1.5 shrink-0 mt-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Bursa Listing Requirements Para 9.22 Compliant</span>
        </div>
      </div>
    </div>
  );
}
