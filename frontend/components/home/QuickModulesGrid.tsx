import React from "react";
import { FileText, Calculator, BarChart2, Sparkles } from "lucide-react";

interface QuickModulesGridProps {
  onSelectPrompt: (code: string, prompt: string) => void;
  loading: boolean;
}

export function QuickModulesGrid({ onSelectPrompt, loading }: QuickModulesGridProps) {
  return (
    <div className="w-full space-y-2.5">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1F2328] pb-2">
        <span className="text-xs font-semibold text-slate-900 dark:text-white">Quick Research Modules</span>
        <span className="text-[11px] text-slate-500 dark:text-[#8B949E]">1-Click Copilot Inquiries</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
        <button
          onClick={() =>
            onSelectPrompt(
              "1155",
              "Please provide an executive summary and analysis of the latest financial report, highlighting revenue, profit margins, and key performance drivers."
            )
          }
          disabled={loading}
          className="bg-white dark:bg-[#121417] hover:bg-slate-50 dark:hover:bg-[#16191D] p-3 rounded-xl border border-slate-200 dark:border-[#1F2328] hover:border-blue-500/50 text-left transition group shadow-xs active:scale-98 disabled:opacity-40"
        >
          <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 mb-1">
            <FileText className="w-3.5 h-3.5" />
            <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
              Quarterly Results
            </span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-[#8B949E] line-clamp-2">
            Review revenue growth, EBITDA margin variance, and segment drivers.
          </p>
        </button>

        <button
          onClick={() =>
            onSelectPrompt(
              "5347",
              "What are the fair value estimates and 5-year discounted cash flow sensitivity assumptions?"
            )
          }
          disabled={loading}
          className="bg-white dark:bg-[#121417] hover:bg-slate-50 dark:hover:bg-[#16191D] p-3 rounded-xl border border-slate-200 dark:border-[#1F2328] hover:border-blue-500/50 text-left transition group shadow-xs active:scale-98 disabled:opacity-40"
        >
          <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 mb-1">
            <Calculator className="w-3.5 h-3.5" />
            <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
              DCF & Valuation
            </span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-[#8B949E] line-clamp-2">
            Conservative, base, and optimistic intrinsic valuation sensitivity.
          </p>
        </button>

        <button
          onClick={() =>
            onSelectPrompt(
              "1023",
              "What are the company's total borrowings, gearing ratio, and cash reserves?"
            )
          }
          disabled={loading}
          className="bg-white dark:bg-[#121417] hover:bg-slate-50 dark:hover:bg-[#16191D] p-3 rounded-xl border border-slate-200 dark:border-[#1F2328] hover:border-blue-500/50 text-left transition group shadow-xs active:scale-98 disabled:opacity-40"
        >
          <div className="flex items-center space-x-2 text-purple-600 dark:text-purple-400 mb-1">
            <BarChart2 className="w-3.5 h-3.5" />
            <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">
              Debt & Liquidity
            </span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-[#8B949E] line-clamp-2">
            Total borrowings, interest coverage, and net cash balances.
          </p>
        </button>

        <button
          onClick={() =>
            onSelectPrompt(
              "1155",
              "Assess dividend track record, dividend yield, and cash flow payout sustainability."
            )
          }
          disabled={loading}
          className="bg-white dark:bg-[#121417] hover:bg-slate-50 dark:hover:bg-[#16191D] p-3 rounded-xl border border-slate-200 dark:border-[#1F2328] hover:border-blue-500/50 text-left transition group shadow-xs active:scale-98 disabled:opacity-40"
        >
          <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400">
              Dividend Quality
            </span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-[#8B949E] line-clamp-2">
            Historical dividend yields, payout ratios, and free cash support.
          </p>
        </button>
      </div>
    </div>
  );
}
