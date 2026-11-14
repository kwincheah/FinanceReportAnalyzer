import React from "react";

export interface PopularCompany {
  code: string;
  ticker: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  positive: boolean;
}

interface PopularEquitiesGridProps {
  companies: PopularCompany[];
  sectorFilter: string;
  setSectorFilter: (filter: string) => void;
  onSelectCompany: (code: string) => void;
  loading: boolean;
}

export function PopularEquitiesGrid({
  companies,
  sectorFilter,
  setSectorFilter,
  onSelectCompany,
  loading,
}: PopularEquitiesGridProps) {
  const filtered = companies.filter((company) => {
    if (sectorFilter === "banking") return company.sector.toLowerCase().includes("bank");
    if (sectorFilter === "utilities")
      return (
        company.sector.toLowerCase().includes("utilit") ||
        company.sector.toLowerCase().includes("power") ||
        company.sector.toLowerCase().includes("gas")
      );
    if (sectorFilter === "other")
      return !company.sector.toLowerCase().includes("bank") && !company.sector.toLowerCase().includes("utilit");
    return true;
  });

  return (
    <div className="w-full space-y-2.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-[#1F2328] pb-2 gap-2">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-900 dark:text-white">Popular Bursa Equities</span>
          <span className="text-[10px] font-mono bg-slate-100 dark:bg-[#16191D] text-slate-600 dark:text-[#8B949E] px-2 py-0.5 rounded border border-slate-200 dark:border-[#1F2328]">
            KLSE Active
          </span>
        </div>

        {/* Sector Filter Chips */}
        <div className="flex items-center space-x-1 text-[11px] overflow-x-auto">
          {[
            { id: "all", label: "All" },
            { id: "banking", label: "Banking" },
            { id: "utilities", label: "Utilities & Power" },
            { id: "other", label: "Retail & Health" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSectorFilter(tab.id)}
              className={`px-2.5 py-1 rounded-lg font-medium transition whitespace-nowrap ${
                sectorFilter === tab.id
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "bg-slate-100 dark:bg-[#16191D] text-slate-600 dark:text-[#8B949E] hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#1F2328]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Symmetrical Equity Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {filtered.map((company) => (
          <button
            key={company.code}
            onClick={() => onSelectCompany(company.code)}
            disabled={loading}
            className="bg-white dark:bg-[#121417] hover:bg-slate-50 dark:hover:bg-[#16191D] p-3.5 rounded-xl border border-slate-200 dark:border-[#1F2328] hover:border-blue-500/60 dark:hover:border-blue-500/60 text-left transition-all duration-150 flex flex-col justify-between h-[112px] group active:scale-[0.98] shadow-xs hover:shadow-sm"
          >
            {/* Top Row: Sector Badge + Change Pill */}
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] text-slate-500 dark:text-[#8B949E] font-medium truncate max-w-[90px]">
                {company.sector.split("&")[0].trim()}
              </span>
              <span
                className={`text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded ${
                  company.positive
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50"
                    : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50"
                }`}
              >
                {company.positive ? "+" : ""}
                {company.change.toFixed(2)}%
              </span>
            </div>

            {/* Middle: Company Name */}
            <div className="my-1">
              <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                {company.name}
              </span>
            </div>

            {/* Bottom: Ticker Chip + Live Price */}
            <div className="flex items-baseline justify-between pt-1.5 border-t border-slate-100 dark:border-[#1F2328] w-full">
              <span className="text-[10px] text-slate-500 dark:text-[#8B949E] font-mono">
                {company.ticker}
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                RM {company.price.toFixed(2)}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
