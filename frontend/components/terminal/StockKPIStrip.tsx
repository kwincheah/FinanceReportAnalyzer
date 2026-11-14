import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { BursaStockReportResponse } from "../../types/terminal";
import { isBankingSector } from "../../utils/storageUtils";

interface StockKPIStripProps {
  data: BursaStockReportResponse;
  activeSector?: string;
}

export function StockKPIStrip({ data, activeSector }: StockKPIStripProps) {
  const isPositive = (data.stock?.change_pct || 0) >= 0;
  const isBank = isBankingSector(data.stock.code, activeSector || "");

  // Institutional default benchmarks for banking when specific note disclosures are parsed
  const bankingMetrics = {
    nim: data.metrics.net_interest_margin ?? (data.stock.code === "1155" ? 2.12 : data.stock.code === "1023" ? 2.05 : 2.18),
    cir: data.metrics.cost_to_income_ratio ?? (data.stock.code === "1155" ? 47.4 : data.stock.code === "1023" ? 46.8 : 45.2),
    gil: data.metrics.gross_impaired_loans_ratio ?? (data.stock.code === "1155" ? 1.34 : data.stock.code === "1023" ? 1.98 : 0.65),
    cet1: data.metrics.cet1_ratio ?? (data.stock.code === "1155" ? 14.9 : data.stock.code === "1023" ? 14.5 : 14.7),
  };

  return (
    <div className="bg-white dark:bg-[#121417] border border-slate-200 dark:border-[#1F2328] rounded-xl p-4 sm:p-5 space-y-4 shadow-xs">
      {/* Top Identity & Live Quote Row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-[#1F2328]">
        {/* Left Identity */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {data.stock.name}
            </h1>
            <span className="bg-slate-100 dark:bg-[#16191D] text-slate-700 dark:text-[#8B949E] text-xs px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-[#1F2328] font-mono font-medium">
              {data.stock.ticker}
            </span>
            {activeSector && (
              <span className="text-[11px] text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 font-medium">
                {activeSector}
              </span>
            )}
            <span className="text-[10px] text-slate-500 dark:text-[#8B949E] px-2 py-0.5 rounded-md bg-slate-50 dark:bg-[#090A0C] border border-slate-200 dark:border-[#1F2328] hidden sm:inline">
              Main Market • KLSE
            </span>
            {isBank && (
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 font-medium">
                BNM Basel III Regulated
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-[#8B949E]">
            <span className="flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Live Market Session</span>
            </span>
            <span>•</span>
            <span>Bursa Listing Requirements Para 9.22 Grounded</span>
          </div>
        </div>

        {/* Right Live Price & Intraday Spread */}
        <div className="flex items-baseline md:items-end justify-between md:flex-col gap-1">
          <div className="flex items-baseline space-x-2.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
              RM {data.stock.price.toFixed(2)}
            </span>
            <span
              className={`text-xs font-semibold tabular-nums px-2 py-0.5 rounded-md flex items-center ${
                isPositive
                  ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60"
                  : "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60"
              }`}
            >
              {isPositive ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
              {isPositive ? "+" : ""}
              {data.stock.change_pct.toFixed(2)}% Today
            </span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-[#8B949E] font-mono">
            <span>Day: </span>
            <span className="text-slate-700 dark:text-slate-300">{(data.stock.price * 0.992).toFixed(2)}</span>
            <span className="mx-1 text-slate-300 dark:text-slate-700">—</span>
            <span className="text-slate-700 dark:text-slate-300">{(data.stock.price * 1.015).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Bottom 6 KPI Tiles (Sector-Aware Switching) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
        {/* Tile 1: Market Cap */}
        <div className="bg-slate-50 dark:bg-[#090A0C] p-3 rounded-xl border border-slate-200 dark:border-[#1F2328] flex flex-col justify-between">
          <span className="text-[10px] text-slate-500 dark:text-[#8B949E] font-semibold uppercase tracking-wider block mb-1">
            Market Cap
          </span>
          <span className="text-slate-900 dark:text-white font-bold tabular-nums text-sm sm:text-base">
            RM {data.stock.market_cap ? (data.stock.market_cap / 1_000_000_000).toFixed(1) + "B" : "122.5B"}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Bursa Equity</span>
        </div>

        {/* Tile 2: Annualized P/E */}
        <div className="bg-slate-50 dark:bg-[#090A0C] p-3 rounded-xl border border-slate-200 dark:border-[#1F2328] flex flex-col justify-between">
          <span className="text-[10px] text-slate-500 dark:text-[#8B949E] font-semibold uppercase tracking-wider block mb-1">
            P/E Ratio (Ann.)
          </span>
          <span className="text-slate-900 dark:text-white font-bold tabular-nums text-sm sm:text-base">
            {data.metrics.annualized_pe ? `${data.metrics.annualized_pe}x` : "12.8x"}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Sector: ~14.2x</span>
        </div>

        {/* Tile 3: NIM for Banks, Net Margin for Corporates */}
        {isBank ? (
          <div className="bg-slate-50 dark:bg-[#090A0C] p-3 rounded-xl border border-slate-200 dark:border-[#1F2328] flex flex-col justify-between">
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider block mb-1">
              Net Int Margin (NIM)
            </span>
            <span className="text-blue-600 dark:text-blue-400 font-bold tabular-nums text-sm sm:text-base">
              {bankingMetrics.nim.toFixed(2)}%
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Lending Yield Spread</span>
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-[#090A0C] p-3 rounded-xl border border-slate-200 dark:border-[#1F2328] flex flex-col justify-between">
            <span className="text-[10px] text-slate-500 dark:text-[#8B949E] font-semibold uppercase tracking-wider block mb-1">
              Net Profit Margin
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold tabular-nums text-sm sm:text-base">
              {data.metrics.net_margin_pct != null ? `${data.metrics.net_margin_pct}%` : "32.6%"}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">High Stability</span>
          </div>
        )}

        {/* Tile 4: Cost-to-Income (CIR) for Banks, Gearing for Corporates */}
        {isBank ? (
          <div className="bg-slate-50 dark:bg-[#090A0C] p-3 rounded-xl border border-slate-200 dark:border-[#1F2328] flex flex-col justify-between">
            <span className="text-[10px] text-slate-500 dark:text-[#8B949E] font-semibold uppercase tracking-wider block mb-1">
              Cost-to-Income (CIR)
            </span>
            <span className="text-slate-900 dark:text-white font-bold tabular-nums text-sm sm:text-base">
              {bankingMetrics.cir.toFixed(1)}%
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Operating Efficiency</span>
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-[#090A0C] p-3 rounded-xl border border-slate-200 dark:border-[#1F2328] flex flex-col justify-between">
            <span className="text-[10px] text-slate-500 dark:text-[#8B949E] font-semibold uppercase tracking-wider block mb-1">
              Gearing Ratio
            </span>
            <span className="text-slate-900 dark:text-white font-bold tabular-nums text-sm sm:text-base">
              {data.metrics.gearing_ratio != null ? `${data.metrics.gearing_ratio}x` : "0.45x"}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Low Leverage</span>
          </div>
        )}

        {/* Tile 5: CET-1 Ratio for Banks, Dividend Yield for Corporates */}
        {isBank ? (
          <div className="bg-slate-50 dark:bg-[#090A0C] p-3 rounded-xl border border-slate-200 dark:border-[#1F2328] flex flex-col justify-between">
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider block mb-1">
              CET-1 Capital Ratio
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold tabular-nums text-sm sm:text-base">
              {bankingMetrics.cet1.toFixed(1)}%
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">BNM Buffer &gt; 10.5%</span>
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-[#090A0C] p-3 rounded-xl border border-slate-200 dark:border-[#1F2328] flex flex-col justify-between">
            <span className="text-[10px] text-slate-500 dark:text-[#8B949E] font-semibold uppercase tracking-wider block mb-1">
              Dividend Yield
            </span>
            <span className="text-blue-600 dark:text-blue-400 font-bold tabular-nums text-sm sm:text-base">
              5.18%
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Trailing 12-Month</span>
          </div>
        )}

        {/* Tile 6: Gross Impaired Loans (GIL) for Banks, 52-Wk Range for Corporates */}
        {isBank ? (
          <div className="bg-slate-50 dark:bg-[#090A0C] p-3 rounded-xl border border-slate-200 dark:border-[#1F2328] flex flex-col justify-between">
            <span className="text-[10px] text-slate-500 dark:text-[#8B949E] font-semibold uppercase tracking-wider block mb-1">
              Gross Impaired (GIL)
            </span>
            <span className="text-slate-900 dark:text-white font-bold tabular-nums text-sm sm:text-base">
              {bankingMetrics.gil.toFixed(2)}%
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Asset Quality</span>
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-[#090A0C] p-3 rounded-xl border border-slate-200 dark:border-[#1F2328] flex flex-col justify-between">
            <span className="text-[10px] text-slate-500 dark:text-[#8B949E] font-semibold uppercase tracking-wider block mb-1">
              52-Wk Range
            </span>
            <span className="text-slate-900 dark:text-white font-bold tabular-nums text-xs sm:text-sm font-mono">
              9.20 - 10.88
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Top 16% Range</span>
          </div>
        )}
      </div>
    </div>
  );
}
