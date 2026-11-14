import React from "react";
import { Sparkles, X, Check, ArrowRight, Compass, AlertCircle } from "lucide-react";
import { PopularCompany } from "./PopularEquitiesGrid";
import { ParsedQueryIntent } from "../../constants/bursaData";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  parsedIntent: ParsedQueryIntent;
  confirmButtonRef: React.RefObject<HTMLButtonElement | null>;
  onConfirm: (code: string, instruction?: string) => void;
  popularCompanies?: PopularCompany[];
}

export function ConfirmationModal({
  isOpen,
  onClose,
  parsedIntent,
  confirmButtonRef,
  onConfirm,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const candidateList = parsedIntent.candidateCompanies || [];
  const isNoneCase = !parsedIntent.company && candidateList.length === 0;
  const isMultipleCase = !parsedIntent.company && candidateList.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Confirm target and query"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg bg-white dark:bg-[#12161f] border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-5 text-xs animate-in fade-in zoom-in-95 duration-150 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1F2328] pb-3">
          <div className="flex items-center space-x-2.5">
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                isNoneCase
                  ? "bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400"
                  : isMultipleCase
                  ? "bg-indigo-600/10 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400"
                  : "bg-blue-600/10 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400"
              }`}
            >
              {isNoneCase ? (
                <AlertCircle className="w-3.5 h-3.5" />
              ) : isMultipleCase ? (
                <Compass className="w-3.5 h-3.5" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-xs">
                {isNoneCase
                  ? "No Listed Security Found"
                  : isMultipleCase
                  ? (parsedIntent.categoryTitle || "Select Target Company")
                  : "Confirm Target & Query"}
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-[#8B949E]">
                {isNoneCase
                  ? "Unrecognized query or unlisted industry"
                  : isMultipleCase
                  ? "Choose a relevant constituent matching your query"
                  : "Review identified company or choose research options"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="hidden sm:inline text-[10px] text-slate-400 dark:text-slate-500">
              <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-[#16191D] border border-slate-200 dark:border-[#1F2328] rounded text-[10px] font-mono">
                Esc
              </kbd>
            </span>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-md hover:bg-slate-100 dark:hover:bg-[#1F2328] transition"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Intent / Category Banner (shown for EXACT and MULTIPLE cases) */}
        {parsedIntent.categoryTitle && !isNoneCase && (
          <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 p-3 rounded-xl space-y-1">
            <div className="flex items-center space-x-1.5 text-blue-700 dark:text-blue-300 font-bold text-xs">
              <Compass className="w-3.5 h-3.5 shrink-0" />
              <span>{parsedIntent.categoryTitle}</span>
            </div>
            {parsedIntent.categoryExplanation && (
              <p className="text-[11px] text-slate-600 dark:text-[#8B949E] leading-relaxed">
                {parsedIntent.categoryExplanation}
              </p>
            )}
          </div>
        )}

        {/* Case 1: Company Matched */}
        {parsedIntent.company ? (
          <div className="space-y-3.5">
            <div className="bg-slate-50 dark:bg-[#090c14] border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-[#8B949E]">
                <span>Target Bursa Equity:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center space-x-1">
                  <Check className="w-3 h-3" />
                  <span>Identified Match</span>
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-slate-900 dark:text-white font-bold text-sm block">
                    {parsedIntent.company.name}
                  </span>
                  <div className="flex items-center space-x-2 text-[10px] text-slate-500 dark:text-[#8B949E] mt-0.5">
                    <span className="font-mono font-semibold">{parsedIntent.company.ticker}</span>
                    <span>•</span>
                    <span>{parsedIntent.company.sector}</span>
                  </div>
                </div>
                <span className="text-blue-600 dark:text-blue-400 font-bold tabular-nums text-sm">
                  RM {parsedIntent.company.price.toFixed(2)}
                </span>
              </div>

              {parsedIntent.instruction ? (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px]">
                  <span className="text-slate-500 dark:text-[#8B949E] block mb-1">Your query intent:</span>
                  <div className="text-blue-900 dark:text-blue-300 bg-blue-50 dark:bg-[#141b28] p-2.5 rounded-lg border border-blue-200 dark:border-blue-900/40 font-medium leading-relaxed">
                    &quot;{parsedIntent.instruction}&quot;
                  </div>
                </div>
              ) : null}
            </div>

            {/* Primary Action Button */}
            <button
              ref={confirmButtonRef}
              onClick={() => {
                const comp = parsedIntent.company!;
                onConfirm(comp.code, parsedIntent.instruction);
              }}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 transition text-xs shadow-md focus:ring-2 focus:ring-blue-400 active:scale-[0.99]"
            >
              <span>
                {parsedIntent.instruction
                  ? `Run Analysis on ${parsedIntent.company.name}`
                  : `View ${parsedIntent.company.name} Financials`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Alternative Candidate Companies Matching the Query Intent (If user asked a category/superlative query) */}
            {candidateList.length > 1 && (
              <div className="pt-2 border-t border-slate-200 dark:border-[#1F2328] space-y-1.5">
                <span className="text-[10px] text-slate-500 dark:text-[#8B949E] block font-medium">
                  Other candidates matching your query:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {candidateList
                    .filter((c) => c.code !== parsedIntent.company?.code)
                    .slice(0, 4)
                    .map((alt) => (
                      <button
                        key={alt.code}
                        onClick={() => onConfirm(alt.code, parsedIntent.instruction)}
                        className="bg-slate-50 dark:bg-[#090c14] hover:bg-slate-100 dark:hover:bg-[#16191D] p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-left transition flex items-center justify-between group active:scale-95"
                      >
                        <div className="truncate">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 block text-[11px] group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                            {alt.name}
                          </span>
                          <span className="text-[9px] text-slate-400 dark:text-[#8B949E] font-mono">
                            {alt.code} • {alt.sector}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-slate-900 dark:text-white tabular-nums ml-2 shrink-0">
                          RM {alt.price.toFixed(2)}
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            )}

          </div>
        ) : candidateList.length > 0 ? (
          /* Case 2: Candidate Selection - Dynamically Filtered by Query */
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <p className="text-slate-600 dark:text-[#8B949E]">
                Select a candidate matching your inquiry:
              </p>
              {parsedIntent.raw && (
                <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded">
                  &quot;{parsedIntent.raw}&quot;
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {candidateList.slice(0, 4).map((c) => (
                <button
                  key={c.code}
                  onClick={() => onConfirm(c.code, parsedIntent.instruction || undefined)}
                  className="bg-slate-50 dark:bg-[#090c14] hover:bg-slate-100 dark:hover:bg-[#16191D] text-left p-3 border border-slate-200 dark:border-slate-800 hover:border-blue-500 rounded-xl transition flex items-center justify-between group active:scale-[0.98]"
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-bold text-slate-900 dark:text-white block text-xs group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                      {c.name}
                    </span>
                    <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 dark:text-[#8B949E] font-mono">
                      <span>{c.code}</span>
                      <span>•</span>
                      <span className="truncate">{c.sector}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block tabular-nums">
                      RM {c.price.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold group-hover:underline">
                      Analyze →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Case 3: No company or candidates found (NONE case) */
          <div className="space-y-3.5 py-2 text-center">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-slate-800 dark:text-slate-200 text-xs font-bold">
                No Bursa Malaysia listed company identified for &quot;{parsedIntent.raw}&quot;
              </p>
              {parsedIntent.categoryExplanation ? (
                <p className="text-[11px] text-slate-600 dark:text-[#8B949E] max-w-sm mx-auto leading-relaxed">
                  {parsedIntent.categoryExplanation}
                </p>
              ) : (
                <p className="text-[11px] text-slate-500 dark:text-[#8B949E]">
                  No listed Bursa Malaysia security, sector, or peer constituent matches this query.
                </p>
              )}
            </div>
            <div className="bg-slate-50 dark:bg-[#090c14] border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-[11px] text-slate-500 dark:text-[#8B949E] text-left space-y-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block">Suggested Searches:</span>
              <ul className="list-disc list-inside space-y-0.5 text-[10px]">
                <li>Enter a 4-digit stock code (e.g. <span className="font-mono font-semibold">1155</span>, <span className="font-mono font-semibold">5347</span>)</li>
                <li>Enter a company ticker or name (e.g. <span className="font-semibold">Maybank</span>, <span className="font-semibold">Tenaga</span>)</li>
                <li>Enter an industry category (e.g. <span className="font-semibold">Banks</span>, <span className="font-semibold">Semiconductors</span>, <span className="font-semibold">Healthcare</span>)</li>
              </ul>
            </div>
            <button
              onClick={onClose}
              className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 py-2.5 rounded-xl text-xs font-semibold transition active:scale-[0.99] shadow-sm"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
