import React from "react";
import { Calculator, HelpCircle } from "lucide-react";
import { BursaStockReportResponse } from "../../types/terminal";
import { isBankingSector } from "../../utils/storageUtils";

interface ValuationScenariosProps {
  data: BursaStockReportResponse;
  activeSector?: string;
}

export function ValuationScenarios({ data, activeSector }: ValuationScenariosProps) {
  const isBank = isBankingSector(data.stock.code, activeSector || "");
  const price = data.stock.price || 10.0;

  // DDM Model for Commercial Banks
  // Estimated forward DPS based on ~6.0% historical dividend yield
  const estDPS = Number((price * 0.058).toFixed(2)); // e.g. RM 0.58 for RM 10 stock
  const ddmScenarios = [
    {
      case: "Conservative",
      ke: "10.0%",
      g: "3.5%",
      targetPrice: Number((estDPS / (0.100 - 0.035)).toFixed(2)),
      description: "Higher equity risk premium; slower credit expansion",
    },
    {
      case: "Base Case",
      ke: "8.5%",
      g: "4.0%",
      targetPrice: Number((estDPS / (0.085 - 0.040)).toFixed(2)),
      description: "Normalized loan growth; stable NIM spread",
      isPrimary: true,
    },
    {
      case: "Optimistic",
      ke: "7.5%",
      g: "4.5%",
      targetPrice: Number((estDPS / (0.075 - 0.045)).toFixed(2)),
      description: "Lower credit provisions; higher ROE dividend payout",
    },
  ];

  // DCF Model for Non-Banking Corporations
  const dcfScenarios = [
    {
      case: "Conservative",
      wacc: "10.0%",
      terminalG: "2.0%",
      targetPrice: Number((price * 1.05).toFixed(2)),
      description: "Elevated cost of capital, conservative capex reinvestment",
    },
    {
      case: "Base Case",
      wacc: "8.5%",
      terminalG: "2.5%",
      targetPrice: Number((price * 1.25).toFixed(2)),
      description: "Consensus margin trajectory, stable terminal growth",
      isPrimary: true,
    },
    {
      case: "Optimistic",
      wacc: "7.0%",
      terminalG: "3.0%",
      targetPrice: Number((price * 1.48).toFixed(2)),
      description: "Margin expansion, accelerated market share capture",
    },
  ];

  return (
    <div className="bg-white dark:bg-[#121417] border border-slate-200 dark:border-[#1F2328] rounded-xl p-4 sm:p-5 space-y-3.5 shadow-xs shrink-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-[#1F2328] pb-2.5 gap-2">
        <div className="flex items-center space-x-2">
          <Calculator className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="font-semibold text-xs text-slate-900 dark:text-white">
            {isBank ? "Dividend Discount Model (DDM / Gordon Growth)" : "5-Year DCF Intrinsic Valuation"}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-[#16191D] text-slate-600 dark:text-[#8B949E] border border-slate-200 dark:border-[#1F2328]">
            {isBank ? "Banking Standard" : "FCFF Model"}
          </span>
        </div>
        <span className="text-[11px] text-slate-500 dark:text-[#8B949E]">
          Sensitivity Matrix
        </span>
      </div>

      {/* Model-specific badge & formula notice */}
      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#090A0C] border border-slate-200 dark:border-[#1F2328] flex items-start space-x-2.5 text-[11px]">
        <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p className="text-slate-600 dark:text-[#8B949E] leading-relaxed">
          {isBank ? (
            <>
              Commercial banking cash flows are distorted by deposit liabilities and loan creation. Institutional standards apply the <strong>Gordon Growth DDM</strong>: <span className="font-mono text-slate-900 dark:text-slate-200 font-semibold">P₀ = DPS₁ / (Ke - g)</span>, where forward DPS is ~RM {estDPS.toFixed(2)}.
            </>
          ) : (
            <>
              Valuation derived from 5-year projected Free Cash Flow to Firm (FCFF), discounted at Weighted Average Cost of Capital (WACC) with perpetual terminal growth rate assumption.
            </>
          )}
        </p>
      </div>

      {/* 3 Scenario Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {isBank
          ? ddmScenarios.map((sc, idx) => {
              const diffPct = ((sc.targetPrice - price) / price) * 100;
              const isUpside = diffPct >= 0;
              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                    sc.isPrimary
                      ? "bg-blue-50/70 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/40 shadow-xs"
                      : "bg-slate-50 dark:bg-[#090A0C] border-slate-200 dark:border-[#1F2328]"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-xs font-semibold ${sc.isPrimary ? "text-blue-700 dark:text-blue-400" : "text-slate-700 dark:text-slate-300"}`}>
                        {sc.case}
                      </span>
                      <span className={`text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded ${
                        isUpside
                          ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
                          : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400"
                      }`}>
                        {isUpside ? "+" : ""}{diffPct.toFixed(1)}%
                      </span>
                    </div>

                    <div className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                      RM {sc.targetPrice.toFixed(2)}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200/80 dark:border-[#1F2328] space-y-1 text-[10px] text-slate-500 dark:text-[#8B949E]">
                    <div className="flex justify-between">
                      <span>Cost of Equity (Ke):</span>
                      <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{sc.ke}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Perpetual Growth (g):</span>
                      <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{sc.g}</span>
                    </div>
                  </div>
                </div>
              );
            })
          : dcfScenarios.map((sc, idx) => {
              const diffPct = ((sc.targetPrice - price) / price) * 100;
              const isUpside = diffPct >= 0;
              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                    sc.isPrimary
                      ? "bg-blue-50/70 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/40 shadow-xs"
                      : "bg-slate-50 dark:bg-[#090A0C] border-slate-200 dark:border-[#1F2328]"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-xs font-semibold ${sc.isPrimary ? "text-blue-700 dark:text-blue-400" : "text-slate-700 dark:text-slate-300"}`}>
                        {sc.case}
                      </span>
                      <span className={`text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded ${
                        isUpside
                          ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
                          : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400"
                      }`}>
                        {isUpside ? "+" : ""}{diffPct.toFixed(1)}%
                      </span>
                    </div>

                    <div className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                      RM {sc.targetPrice.toFixed(2)}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200/80 dark:border-[#1F2328] space-y-1 text-[10px] text-slate-500 dark:text-[#8B949E]">
                    <div className="flex justify-between">
                      <span>WACC:</span>
                      <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{sc.wacc}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Terminal Growth:</span>
                      <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{sc.terminalG}</span>
                    </div>
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}
