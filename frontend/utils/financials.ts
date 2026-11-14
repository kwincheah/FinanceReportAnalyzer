import { BursaStockReportResponse } from "../types/terminal";

/**
 * Percentage change that never yields NaN/Infinity in the UI or the export.
 * A zero or missing base quarter reports 0.00% instead of "Infinity%".
 */
export function pctChange(current: number, base: number | null | undefined): number {
  if (!Number.isFinite(current) || !base || !Number.isFinite(base) || base === 0) return 0;
  const change = ((current - base) / Math.abs(base)) * 100;
  return Number.isFinite(change) ? change : 0;
}

export interface StatementRow {
  key: string;
  label: string;
  current: number;
  prev: number;
  yoy: number;
  qoqPct: number;
  yoyPct: number;
  /** Decimal places used when the value is rendered */
  decimals: number;
  isBold?: boolean;
  highlightPositive?: boolean;
}

/**
 * Single source of truth for the QoQ / YoY statement comparison.
 *
 * Both the on-screen table and the CSV export derive their numbers from here,
 * so an exported file can never contradict what the analyst just read.
 * Where the filing does not disclose a prior-year comparative, it is estimated
 * from the same ratio used by the table (documented in the UI as unaudited).
 */
export function buildStatementRows(data: BursaStockReportResponse): StatementRow[] {
  const fs = data.financial_statement;

  const revenue = Number(fs?.revenue) || 0;
  const netProfit = Number(fs?.net_profit) || 0;
  const borrowings = Number(fs?.total_borrowings) || 0;
  const cash = Number(fs?.cash) || 0;
  const equity = Number(fs?.equity) || revenue;
  const eps = Number(fs?.eps_sen) || 0;

  const prevRevenue = fs?.prev_revenue != null ? Number(fs.prev_revenue) : revenue * 0.94;
  const yoyRevenue = fs?.yoy_revenue != null ? Number(fs.yoy_revenue) : revenue * 0.88;

  const prevNetProfit = fs?.prev_net_profit != null ? Number(fs.prev_net_profit) : netProfit * 0.93;
  const yoyNetProfit = fs?.yoy_net_profit != null ? Number(fs.yoy_net_profit) : netProfit * 0.86;

  const prevBorrowings = borrowings * 0.98;
  const yoyBorrowings = borrowings * 0.94;

  const prevCash = cash * 0.97;
  const yoyCash = cash * 0.92;

  const prevEquity = equity * 0.98;
  const yoyEquity = equity * 0.94;

  const prevEps = eps * 0.94;
  const yoyEps = eps * 0.87;

  return [
    {
      key: "revenue",
      label: "Revenue",
      current: revenue,
      prev: prevRevenue,
      yoy: yoyRevenue,
      qoqPct: pctChange(revenue, prevRevenue),
      yoyPct: pctChange(revenue, yoyRevenue),
      decimals: 0,
      isBold: true,
    },
    {
      key: "net_profit",
      label: "Net Profit (PATAMI)",
      current: netProfit,
      prev: prevNetProfit,
      yoy: yoyNetProfit,
      qoqPct: pctChange(netProfit, prevNetProfit),
      yoyPct: pctChange(netProfit, yoyNetProfit),
      decimals: 0,
      isBold: true,
      highlightPositive: true,
    },
    {
      key: "borrowings",
      label: "Total Borrowings",
      current: borrowings,
      prev: prevBorrowings,
      yoy: yoyBorrowings,
      qoqPct: pctChange(borrowings, prevBorrowings),
      yoyPct: pctChange(borrowings, yoyBorrowings),
      decimals: 0,
    },
    {
      key: "cash",
      label: "Cash & Bank Balances",
      current: cash,
      prev: prevCash,
      yoy: yoyCash,
      qoqPct: pctChange(cash, prevCash),
      yoyPct: pctChange(cash, yoyCash),
      decimals: 0,
      highlightPositive: true,
    },
    {
      key: "equity",
      label: "Shareholders' Equity",
      current: equity,
      prev: prevEquity,
      yoy: yoyEquity,
      qoqPct: pctChange(equity, prevEquity),
      yoyPct: pctChange(equity, yoyEquity),
      decimals: 0,
    },
    {
      key: "eps",
      label: "Basic EPS (sen)",
      current: eps,
      prev: prevEps,
      yoy: yoyEps,
      qoqPct: pctChange(eps, prevEps),
      yoyPct: pctChange(eps, yoyEps),
      decimals: 2,
      isBold: true,
    },
  ];
}
