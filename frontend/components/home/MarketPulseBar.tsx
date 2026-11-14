import React from "react";

export function MarketPulseBar() {
  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="bg-white dark:bg-[#121417] p-3 rounded-xl border border-slate-200 dark:border-[#1F2328] shadow-xs flex flex-col justify-between">
          <span className="text-[10px] text-slate-500 dark:text-[#8B949E] font-medium uppercase tracking-wider block mb-0.5">FBM KLCI Index</span>
          <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">1,624.18</span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">+5.12 (+0.32%)</span>
        </div>
        <div className="bg-white dark:bg-[#121417] p-3 rounded-xl border border-slate-200 dark:border-[#1F2328] shadow-xs flex flex-col justify-between">
          <span className="text-[10px] text-slate-500 dark:text-[#8B949E] font-medium uppercase tracking-wider block mb-0.5">USD / MYR</span>
          <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">4.4125</span>
          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold mt-0.5">-0.0065 (-0.15%)</span>
        </div>
        <div className="bg-white dark:bg-[#121417] p-3 rounded-xl border border-slate-200 dark:border-[#1F2328] shadow-xs flex flex-col justify-between">
          <span className="text-[10px] text-slate-500 dark:text-[#8B949E] font-medium uppercase tracking-wider block mb-0.5">Brent Crude</span>
          <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">$73.87</span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">+$0.48 (+0.65%)</span>
        </div>
        <div className="bg-white dark:bg-[#121417] p-3 rounded-xl border border-slate-200 dark:border-[#1F2328] shadow-xs flex flex-col justify-between">
          <span className="text-[10px] text-slate-500 dark:text-[#8B949E] font-medium uppercase tracking-wider block mb-0.5">BNM OPR Rate</span>
          <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">3.00%</span>
          <span className="text-[10px] text-slate-500 dark:text-[#8B949E] font-medium mt-0.5">Neutral Stance</span>
        </div>
      </div>
    </div>
  );
}
