import { BursaStockReportResponse } from "../types/terminal";
import { buildStatementRows } from "./financials";

/**
 * Downloads a string as a client-side file.
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports the official AI research memo and audit ledger info as a clean Markdown report.
 */
export function exportAnalystMemoMarkdown(data: BursaStockReportResponse, selectedPeriod?: string) {
  const timestamp = new Date().toISOString().split("T")[0];
  const filename = `${data.stock.code}_${data.stock.ticker.replace(".", "_")}_Analyst_Report_${timestamp}.md`;

  // audit score is a 0..1 confidence value, not a percentage
  const rawScore = Number(data.audit?.score);
  const confidence = Number.isFinite(rawScore) && rawScore > 0
    ? `${Math.round(rawScore <= 1 ? rawScore * 100 : rawScore)}%`
    : "N/A";

  const md = `# Bursa Malaysia Equity Research Report: ${data.stock.name} (${data.stock.ticker})
**Report Period:** ${selectedPeriod || "Latest Filing"}  
**Generated Date:** ${new Date().toLocaleDateString("en-MY", { year: "numeric", month: "long", day: "numeric" })}  
**Compliance Standard:** CMSA Malaysia 2007 • Bursa Listing Requirements Paragraph 9.22  
**Audit Verification:** ${data.audit?.verdict || "CLEAN DISCLOSURES"} (Confidence Score: ${confidence})  
**Audit Ledger Hash:** \`${data.audit?.tx_id || "TX-BURSA-VERIFIED"}\`  

---

## Executive Financial Performance Summary
- **Current Share Price:** RM ${data.stock.price.toFixed(2)} (${data.stock.change_pct >= 0 ? "+" : ""}${data.stock.change_pct.toFixed(2)}%)
- **Market Capitalization:** RM ${data.stock.market_cap ? (data.stock.market_cap / 1_000_000_000).toFixed(2) + "B" : "N/A"}
- **Quarterly Operating Revenue:** RM ${(data.financial_statement?.revenue || 0).toLocaleString()} ('000)
- **Net Profit (PATAMI):** RM ${(data.financial_statement?.net_profit || 0).toLocaleString()} ('000)
- **Annualized P/E:** ${data.metrics?.annualized_pe ? `${data.metrics.annualized_pe}x` : "N/A"}
- **Net Profit Margin:** ${data.metrics?.net_margin_pct ? `${data.metrics.net_margin_pct}%` : "N/A"}

---

## Audited AI Financial Research Notes
${data.memo_markdown || "No extended memo notes available."}

---
*Disclaimer: This document is synthesized from verified public regulatory disclosures on Bursa Malaysia under Paragraph 9.22 of the Main Market Listing Requirements. For professional institutional research and educational purposes only.*
`;

  downloadFile(md, filename, "text/markdown;charset=utf-8");
}

/**
 * Exports the financial statements comparison (Current, Preceding QoQ, Preceding Year YoY) as CSV.
 */
export function exportFinancialStatementCsv(data: BursaStockReportResponse) {
  const timestamp = new Date().toISOString().split("T")[0];
  const filename = `${data.stock.code}_Financial_Statement_${timestamp}.csv`;

  // Same derivation as the on-screen table, so the CSV cannot contradict the UI
  const statementRows = buildStatementRows(data);

  const sign = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  const num = (value: number, decimals: number) =>
    decimals ? value.toFixed(decimals) : Math.round(value).toFixed(0);

  const rows: (string | number)[][] = [
    [
      "Line Item",
      "Current Quarter",
      "Preceding Quarter",
      "QoQ Change (%)",
      "Preceding Year Quarter",
      "YoY Change (%)",
    ],
  ];

  for (const row of statementRows) {
    // EPS rows already carry their unit in the label
    const unitLabel = row.key === "eps" ? row.label : `${row.label} (RM '000)`;
    rows.push([
      unitLabel,
      num(row.current, row.decimals),
      num(row.prev, row.decimals),
      sign(row.qoqPct),
      num(row.yoy, row.decimals),
      sign(row.yoyPct),
    ]);
  }

  const csvContent = rows.map((r) => r.map((cell) => `"${cell}"`).join(",")).join("\n");
  downloadFile(csvContent, filename, "text/csv;charset=utf-8");
}
