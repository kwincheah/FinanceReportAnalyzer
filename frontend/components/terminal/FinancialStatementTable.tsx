import React from "react";
import { Download, FileSpreadsheet, Info } from "lucide-react";
import { BursaStockReportResponse } from "../../types/terminal";
import { exportFinancialStatementCsv } from "../../utils/exportUtils";
import { buildStatementRows } from "../../utils/financials";

interface FinancialStatementTableProps {
  data: BursaStockReportResponse;
}

export function FinancialStatementTable({ data }: FinancialStatementTableProps) {
  // Shared with the CSV export so the two never disagree
  const statementRows = buildStatementRows(data);

  const rows = statementRows.map((row) => ({
    label: row.label,
    current: row.current.toLocaleString(undefined, {
      minimumFractionDigits: row.decimals,
      maximumFractionDigits: row.decimals,
    }),
    prev: Math.round(row.prev).toLocaleString(),
    qoq: row.qoqPct,
    yoyVal: row.decimals
      ? row.yoy.toFixed(row.decimals)
      : Math.round(row.yoy).toLocaleString(),
    yoy: row.yoyPct,
    isBold: row.isBold,
    highlightPositive: row.highlightPositive,
  }));

  return (
    <div className="bg-white dark:bg-[#121417] border border-slate-200 dark:border-[#1F2328] rounded-xl p-4 sm:p-5 space-y-3 shadow-xs shrink-0">
      {/* Header with Export CSV action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-[#1F2328] pb-2.5 gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="font-semibold text-xs text-slate-900 dark:text-white">
              Financial Statement Summary (QoQ & YoY)
            </span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-[#8B949E] mt-0.5">
            Interim Unaudited Financial Statement • Figures in RM &apos;000 unless specified
          </p>
        </div>

        <button
          onClick={() => exportFinancialStatementCsv(data)}
          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#16191D] hover:bg-slate-200 dark:hover:bg-[#1F2328] text-slate-700 dark:text-[#8B949E] hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#1F2328] transition text-[11px] font-medium shadow-2xs self-start sm:self-auto active:scale-95"
          title="Export CSV to analyze in Excel"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Financial Table with QoQ and YoY Columns */}
      <div className="overflow-x-auto rounded-lg border border-slate-200/80 dark:border-[#1F2328]">
        <table className="w-full text-left text-xs table-zebra">
          <thead className="bg-slate-50 dark:bg-[#090A0C] text-slate-500 dark:text-[#8B949E] text-[10px] uppercase border-b border-slate-200 dark:border-[#1F2328]">
            <tr>
              <th className="py-2.5 px-3 font-semibold">Line Item</th>
              <th className="py-2.5 px-3 text-right font-semibold">Current Qtr</th>
              <th className="py-2.5 px-3 text-right font-semibold">Preceding Qtr</th>
              <th className="py-2.5 px-3 text-right font-semibold">QoQ %</th>
              <th className="py-2.5 px-3 text-right font-semibold">Preceding Yr Qtr</th>
              <th className="py-2.5 px-3 text-right font-semibold">YoY %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-[#1F2328]">
            {rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-[#16191D] transition-colors">
                <td className={`py-2 px-3 text-slate-900 dark:text-white ${row.isBold ? "font-bold" : "font-medium"}`}>
                  {row.label}
                </td>
                <td
                  className={`py-2 px-3 text-right tabular-nums ${
                    row.highlightPositive
                      ? "text-emerald-700 dark:text-emerald-400 font-bold"
                      : row.isBold
                      ? "text-slate-900 dark:text-white font-bold"
                      : "text-slate-800 dark:text-slate-200 font-medium"
                  }`}
                >
                  {row.current}
                </td>
                <td className="py-2 px-3 text-right tabular-nums text-slate-500 dark:text-[#8B949E]">
                  {row.prev}
                </td>
                <td
                  className={`py-2 px-3 text-right tabular-nums font-semibold ${
                    row.qoq >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"
                  }`}
                >
                  {row.qoq >= 0 ? "+" : ""}
                  {row.qoq.toFixed(2)}%
                </td>
                <td className="py-2 px-3 text-right tabular-nums text-slate-500 dark:text-[#8B949E]">
                  {row.yoyVal}
                </td>
                <td
                  className={`py-2 px-3 text-right tabular-nums font-semibold ${
                    row.yoy >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"
                  }`}
                >
                  {row.yoy >= 0 ? "+" : ""}
                  {row.yoy.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bursa Paragraph 9.22 Statutory Notice */}
      <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 dark:text-[#8B949E]">
        <div className="flex items-center space-x-1.5">
          <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span>Bursa Listing Requirements Paragraph 9.22 • Unaudited Interim Financial Statements</span>
        </div>
        <span className="font-mono hidden sm:inline">MFRS 134 Compliant</span>
      </div>
    </div>
  );
}
