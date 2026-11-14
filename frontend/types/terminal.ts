export interface BursaStockSuggestion {
  code: string;
  ticker: string;
  name: string;
  shortName: string;
  sector: string;
  aliases?: string[];
  price?: number;
  change?: number;
  positive?: boolean;
}

export interface FinancialFiling {
  id: string;
  title: string;
  period: string;
  period_ended: string;
  release_date: string;
  type: string;
  is_latest: boolean;
  revenue_m?: number;
  profit_m?: number;
  is_audited?: boolean; // Para 9.22: only annual reports are audited
}

export interface FinancialStatementData {
  revenue: number;
  prev_revenue?: number;
  yoy_revenue?: number;
  net_profit: number;
  prev_net_profit?: number;
  yoy_net_profit?: number;
  total_borrowings: number;
  cash: number;
  equity: number;
  eps_sen: number;
}

export interface FinancialMetrics {
  rev_growth_qoq?: number;
  rev_growth_yoy?: number;
  profit_growth_qoq?: number;
  profit_growth_yoy?: number;
  net_margin_pct?: number;
  net_debt_rm_k?: number;
  gearing_ratio?: number;
  annualized_pe?: number;
  // Banking-specific institutional metrics
  net_interest_margin?: number; // NIM %
  cost_to_income_ratio?: number; // CIR %
  gross_impaired_loans_ratio?: number; // GIL %
  cet1_ratio?: number; // CET-1 Capital Ratio %
  return_on_equity?: number; // ROE %
}

export interface AuditRecord {
  score: number;
  verdict: string;
  anomalies: string[];
  action_required?: string;
  tx_id?: string;
}

export interface StockQuote {
  code: string;
  ticker: string;
  name: string;
  price: number;
  change_pct: number;
  currency?: string;
  market_cap?: number;
}

export interface HistoricalQuarter {
  quarter: string;
  revenue: number;
  profit: number;
}

export interface BursaStockReportResponse {
  success: boolean;
  stock: StockQuote;
  metrics: FinancialMetrics;
  historical_quarters: HistoricalQuarter[];
  financial_statement: FinancialStatementData;
  audit: AuditRecord;
  filings: FinancialFiling[];
  memo_markdown: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  time?: string;
}

export interface MarketMoverItem {
  code: string;
  ticker: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  volume_m: number;
  turnover_m: number;
}

export interface DisclosureFeedItem {
  code: string;
  ticker: string;
  name: string;
  period: string;
  date: string;
  title: string;
  rev_m: number;
  profit_m: number;
  type: string;
  is_audited?: boolean;
}

export interface SectorIndexItem {
  name: string;
  code: string;
  change: number;
  count: number;
  leader: string;
}
