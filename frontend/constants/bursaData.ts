import {
  BursaStockSuggestion,
  MarketMoverItem,
  DisclosureFeedItem,
  SectorIndexItem,
} from "../types/terminal";
import { PopularCompany } from "../components/home/PopularEquitiesGrid";

// Comprehensive Bursa Equities Catalog for Instant Zero-Latency Autocomplete & Query Matching
export const BURSA_STOCKS_CATALOG: BursaStockSuggestion[] = [
  // Banking & Financial Services
  {
    code: "1155",
    ticker: "1155.KL",
    name: "Malayan Banking Berhad",
    shortName: "Maybank",
    sector: "Banking & Finance",
    aliases: [
      "maybank", "malayan banking", "largest bank", "biggest bank", "top bank",
      "no 1 bank", "number one bank", "largest company", "dividend leader", "high dividend"
    ],
    price: 10.12,
    change: -0.39,
    positive: false,
  },
  {
    code: "1023",
    ticker: "1023.KL",
    name: "CIMB Group Holdings Berhad",
    shortName: "CIMB Group",
    sector: "Banking & Wealth",
    aliases: ["cimb", "cimb group", "cimb bank", "2nd largest bank", "second largest bank"],
    price: 8.24,
    change: 0.85,
    positive: true,
  },
  {
    code: "1295",
    ticker: "1295.KL",
    name: "Public Bank Berhad",
    shortName: "Public Bank",
    sector: "Commercial Banking",
    aliases: ["public bank", "pbb", "3rd largest bank", "third largest bank"],
    price: 4.52,
    change: -0.22,
    positive: false,
  },
  {
    code: "1066",
    ticker: "1066.KL",
    name: "RHB Bank Berhad",
    shortName: "RHB Bank",
    sector: "Banking & Finance",
    aliases: ["rhb", "rhb bank", "rhb group"],
    price: 5.65,
    change: 0.18,
    positive: true,
  },
  {
    code: "5819",
    ticker: "5819.KL",
    name: "Hong Leong Bank Berhad",
    shortName: "Hong Leong Bank",
    sector: "Banking & Finance",
    aliases: ["hong leong", "hlbank", "hong leong bank"],
    price: 19.30,
    change: 0.21,
    positive: true,
  },
  {
    code: "1015",
    ticker: "1015.KL",
    name: "AMMB Holdings Berhad",
    shortName: "AMMB (AmBank)",
    sector: "Banking & Finance",
    aliases: [
      "ambank", "ammb", "ammb holdings", "smallest bank", "small bank",
      "cheapest bank", "mid cap bank", "smallest commercial bank"
    ],
    price: 4.22,
    change: -0.47,
    positive: false,
  },
  {
    code: "1818",
    ticker: "1818.KL",
    name: "Bursa Malaysia Berhad",
    shortName: "Bursa Malaysia",
    sector: "Financial Services",
    aliases: ["bursa", "bursa exchange", "stock exchange"],
    price: 7.85,
    change: 0.64,
    positive: true,
  },

  // Energy & Utilities
  {
    code: "5347",
    ticker: "5347.KL",
    name: "Tenaga Nasional Berhad",
    shortName: "Tenaga Nasional",
    sector: "Utilities & Energy",
    aliases: ["tenaga", "tnb", "largest utility", "biggest utility", "power leader", "electric company"],
    price: 13.04,
    change: 1.46,
    positive: true,
  },
  {
    code: "5183",
    ticker: "5183.KL",
    name: "PETRONAS Chemicals Group Berhad",
    shortName: "PETRONAS Chem",
    sector: "Chemicals & Gas",
    aliases: ["petronas", "petchem", "pchem", "petronas chemicals"],
    price: 5.48,
    change: -1.26,
    positive: false,
  },
  {
    code: "6033",
    ticker: "6033.KL",
    name: "PETRONAS Gas Berhad",
    shortName: "PETRONAS Gas",
    sector: "Utilities & Gas",
    aliases: ["petgas", "petronas gas", "gas processing"],
    price: 17.80,
    change: 0.34,
    positive: true,
  },
  {
    code: "5681",
    ticker: "5681.KL",
    name: "PETRONAS Dagangan Berhad",
    shortName: "PETRONAS Dagangan",
    sector: "Energy & Retail",
    aliases: ["petdag", "petronas dagangan", "petrol stations", "high dividend"],
    price: 21.40,
    change: -0.19,
    positive: false,
  },
  {
    code: "6742",
    ticker: "6742.KL",
    name: "YTL Power International Berhad",
    shortName: "YTL Power",
    sector: "Data Centers & Infrastructure",
    aliases: ["ytl power", "ytlpower", "cheapest utility", "ai data centers", "power export"],
    price: 3.62,
    change: 1.68,
    positive: true,
  },
  {
    code: "4677",
    ticker: "4677.KL",
    name: "YTL Corporation Berhad",
    shortName: "YTL Corp",
    sector: "Conglomerates",
    aliases: ["ytl", "ytl corp", "ytl corporation"],
    price: 2.30,
    change: 0.88,
    positive: true,
  },
  {
    code: "7277",
    ticker: "7277.KL",
    name: "Dialog Group Berhad",
    shortName: "Dialog Group",
    sector: "Energy & Oilfield",
    aliases: ["dialog", "dialog group", "pengerang terminal", "oil storage"],
    price: 2.15,
    change: -0.46,
    positive: false,
  },
  {
    code: "5243",
    ticker: "5243.KL",
    name: "Velesto Energy Berhad",
    shortName: "Velesto Energy",
    sector: "Energy & Drilling",
    aliases: [
      "velesto", "velesto energy", "smallest company", "smallest stock", "small cap",
      "micro cap", "penny stock", "cheapest stock", "lowest price", "drilling", "offshore rig"
    ],
    price: 0.22,
    change: 0.00,
    positive: true,
  },

  // Consumer, Healthcare & Retail
  {
    code: "5296",
    ticker: "5296.KL",
    name: "MR D.I.Y. Group (M) Berhad",
    shortName: "MR D.I.Y.",
    sector: "Consumer Retail",
    aliases: ["mr diy", "mr. diy", "mrdiy", "diy", "largest retail", "hardware store"],
    price: 1.17,
    change: 0.51,
    positive: true,
  },
  {
    code: "7113",
    ticker: "7113.KL",
    name: "Top Glove Corporation Bhd",
    shortName: "Top Glove",
    sector: "Healthcare & Rubber",
    aliases: ["top glove", "topglove", "largest glove", "biggest glove", "rubber glove", "small cap"],
    price: 1.14,
    change: 3.64,
    positive: true,
  },
  {
    code: "5168",
    ticker: "5168.KL",
    name: "Hartalega Holdings Berhad",
    shortName: "Hartalega",
    sector: "Healthcare & Gloves",
    aliases: ["hartalega", "nitrile glove"],
    price: 2.92,
    change: 1.39,
    positive: true,
  },
  {
    code: "5225",
    ticker: "5225.KL",
    name: "IHH Healthcare Berhad",
    shortName: "IHH Healthcare",
    sector: "Healthcare & Hospitals",
    aliases: ["ihh", "ihh healthcare", "pantai hospital", "gleneagles"],
    price: 6.35,
    change: 0.47,
    positive: true,
  },
  {
    code: "4707",
    ticker: "4707.KL",
    name: "Nestle (Malaysia) Berhad",
    shortName: "Nestle Malaysia",
    sector: "Food & Beverage",
    aliases: ["nestle", "highest price", "most expensive stock", "milo", "maggi"],
    price: 112.50,
    change: -0.18,
    positive: false,
  },
  {
    code: "7084",
    ticker: "7084.KL",
    name: "QL Resources Berhad",
    shortName: "QL Resources",
    sector: "Consumer Agribusiness",
    aliases: ["ql", "ql resources", "family mart", "surimi", "marine products"],
    price: 6.88,
    change: 0.29,
    positive: true,
  },

  // Telecommunications & Technology
  {
    code: "6012",
    ticker: "6012.KL",
    name: "Maxis Berhad",
    shortName: "Maxis",
    sector: "Telecommunications",
    aliases: ["maxis", "hotlink", "telco"],
    price: 3.78,
    change: 0.27,
    positive: true,
  },
  {
    code: "6947",
    ticker: "6947.KL",
    name: "CelcomDigi Berhad",
    shortName: "CelcomDigi",
    sector: "Telecommunications",
    aliases: ["celcomdigi", "digi", "celcom", "largest telco"],
    price: 4.12,
    change: -0.48,
    positive: false,
  },
  {
    code: "6888",
    ticker: "6888.KL",
    name: "Axiata Group Berhad",
    shortName: "Axiata Group",
    sector: "Telecommunications",
    aliases: ["axiata", "edotco", "regional telco"],
    price: 2.45,
    change: -0.81,
    positive: false,
  },
  {
    code: "4863",
    ticker: "4863.KL",
    name: "Telekom Malaysia Berhad",
    shortName: "Telekom Malaysia",
    sector: "Telecommunications",
    aliases: ["tm", "telekom", "unifi", "broadband"],
    price: 6.70,
    change: 0.60,
    positive: true,
  },
  {
    code: "0166",
    ticker: "0166.KL",
    name: "Inari Amertron Berhad",
    shortName: "Inari Amertron",
    sector: "Tech & Semiconductors",
    aliases: ["inari", "inari amertron", "semiconductor", "chipmaker", "5g rf"],
    price: 3.25,
    change: 1.56,
    positive: true,
  },
  {
    code: "0138",
    ticker: "0138.KL",
    name: "MY E.G. Services Berhad",
    shortName: "MYEG Services",
    sector: "Digital Services & Tech",
    aliases: ["myeg", "myeg services", "small cap", "e-government", "zetrix blockchain"],
    price: 0.94,
    change: 1.08,
    positive: true,
  },

  // Industrials, Conglomerates & Plantations
  {
    code: "3182",
    ticker: "3182.KL",
    name: "Genting Berhad",
    shortName: "Genting",
    sector: "Gaming & Hospitality",
    aliases: ["genting", "genting group", "resorts world"],
    price: 4.45,
    change: -0.22,
    positive: false,
  },
  {
    code: "4715",
    ticker: "4715.KL",
    name: "Genting Malaysia Berhad",
    shortName: "Genting Malaysia",
    sector: "Leisure & Hospitality",
    aliases: ["genm", "genting malaysia", "highlands casino"],
    price: 2.68,
    change: 0.00,
    positive: true,
  },
  {
    code: "5398",
    ticker: "5398.KL",
    name: "Gamuda Berhad",
    shortName: "Gamuda",
    sector: "Construction & Infrastructure",
    aliases: ["gamuda", "mrt", "tunneling", "construction leader"],
    price: 7.92,
    change: 2.19,
    positive: true,
  },
  {
    code: "5211",
    ticker: "5211.KL",
    name: "Sunway Berhad",
    shortName: "Sunway",
    sector: "Conglomerate & Healthcare",
    aliases: ["sunway", "sunway group", "sunway city"],
    price: 4.38,
    change: 1.86,
    positive: true,
  },
  {
    code: "4197",
    ticker: "4197.KL",
    name: "Sime Darby Berhad",
    shortName: "Sime Darby",
    sector: "Industrial & Motors",
    aliases: ["sime", "sime darby", "umw motors", "industrial heavy equipment"],
    price: 2.52,
    change: -0.40,
    positive: false,
  },
  {
    code: "8869",
    ticker: "8869.KL",
    name: "Press Metal Aluminium Holdings Berhad",
    shortName: "Press Metal",
    sector: "Industrial Metals",
    aliases: ["pmetal", "press metal", "aluminium smelter"],
    price: 5.12,
    change: 0.79,
    positive: true,
  },
  {
    code: "5099",
    ticker: "5099.KL",
    name: "Capital A Berhad (AirAsia)",
    shortName: "Capital A (AirAsia)",
    sector: "Aviation & Logistics",
    aliases: ["airasia", "capital a", "budget airline", "aviation", "small cap", "penny stock"],
    price: 0.98,
    change: 3.16,
    positive: true,
  },
  {
    code: "4065",
    ticker: "4065.KL",
    name: "PPB Group Berhad",
    shortName: "PPB Group",
    sector: "Consumer & Agribusiness",
    aliases: ["ppb", "ppb group", "wilmar", "flour mills", "gsc cinemas"],
    price: 14.60,
    change: -0.27,
    positive: false,
  },
  {
    code: "3816",
    ticker: "3816.KL",
    name: "MISC Berhad",
    shortName: "MISC",
    sector: "Maritime & Energy Logistics",
    aliases: ["misc", "lng shipping", "offshore tanker"],
    price: 8.15,
    change: 0.37,
    positive: true,
  },
  {
    code: "1961",
    ticker: "1961.KL",
    name: "IOI Corporation Berhad",
    shortName: "IOI Corp",
    sector: "Plantation & Agribusiness",
    aliases: ["ioi", "ioi corp", "palm oil", "oleochemicals"],
    price: 3.82,
    change: -0.52,
    positive: false,
  },
  {
    code: "2445",
    ticker: "2445.KL",
    name: "Kuala Lumpur Kepong Berhad",
    shortName: "KLK",
    sector: "Plantations & Oleochemicals",
    aliases: ["klk", "kuala lumpur kepong", "plantations"],
    price: 21.80,
    change: 0.46,
    positive: true,
  },
];

// Curated Popular Equities for Home Screen
export const POPULAR_COMPANIES: PopularCompany[] = [
  { code: "1155", ticker: "1155.KL", name: "Maybank", sector: "Banking & Finance", price: 10.12, change: -0.39, positive: false },
  { code: "5347", ticker: "5347.KL", name: "Tenaga Nasional", sector: "Utilities & Energy", price: 13.04, change: 1.46, positive: true },
  { code: "1023", ticker: "1023.KL", name: "CIMB Group", sector: "Banking & Wealth", price: 8.24, change: 0.85, positive: true },
  { code: "5296", ticker: "5296.KL", name: "MR D.I.Y.", sector: "Consumer Retail", price: 1.17, change: 0.51, positive: true },
  { code: "1295", ticker: "1295.KL", name: "Public Bank", sector: "Commercial Banking", price: 4.52, change: -0.22, positive: false },
  { code: "7113", ticker: "7113.KL", name: "Top Glove", sector: "Healthcare & Rubber", price: 1.14, change: 3.64, positive: true },
  { code: "5183", ticker: "5183.KL", name: "PETRONAS Chem", sector: "Chemicals & Gas", price: 5.48, change: -1.26, positive: false },
  { code: "6742", ticker: "6742.KL", name: "YTL Power", sector: "Data Centers & Infrastructure", price: 3.62, change: 1.68, positive: true },
];

// Market Movers (Most Active, Top Gainers, Top Value)
export const MARKET_MOVERS: { [key: string]: MarketMoverItem[] } = {
  active: [
    { code: "6742", ticker: "6742.KL", name: "YTL Power International", sector: "Utilities", price: 3.62, change: 1.68, volume_m: 48.2, turnover_m: 174.5 },
    { code: "7113", ticker: "7113.KL", name: "Top Glove Corporation", sector: "Healthcare", price: 1.14, change: 3.64, volume_m: 42.1, turnover_m: 48.0 },
    { code: "0138", ticker: "0138.KL", name: "MY E.G. Services", sector: "Technology", price: 0.94, change: 1.08, volume_m: 36.8, turnover_m: 34.6 },
    { code: "5099", ticker: "5099.KL", name: "Capital A Berhad", sector: "Aviation", price: 0.98, change: 3.16, volume_m: 29.5, turnover_m: 28.9 },
    { code: "5243", ticker: "5243.KL", name: "Velesto Energy", sector: "Energy", price: 0.22, change: 0.00, volume_m: 27.4, turnover_m: 6.0 },
  ],
  gainers: [
    { code: "7113", ticker: "7113.KL", name: "Top Glove Corporation", sector: "Healthcare", price: 1.14, change: 3.64, volume_m: 42.1, turnover_m: 48.0 },
    { code: "5099", ticker: "5099.KL", name: "Capital A Berhad", sector: "Aviation", price: 0.98, change: 3.16, volume_m: 29.5, turnover_m: 28.9 },
    { code: "5398", ticker: "5398.KL", name: "Gamuda Berhad", sector: "Construction", price: 7.92, change: 2.19, volume_m: 14.8, turnover_m: 117.2 },
    { code: "5211", ticker: "5211.KL", name: "Sunway Berhad", sector: "Conglomerate", price: 4.38, change: 1.86, volume_m: 18.2, turnover_m: 79.7 },
    { code: "6742", ticker: "6742.KL", name: "YTL Power International", sector: "Utilities", price: 3.62, change: 1.68, volume_m: 48.2, turnover_m: 174.5 },
  ],
  value: [
    { code: "1155", ticker: "1155.KL", name: "Malayan Banking Berhad", sector: "Banking", price: 10.12, change: -0.39, volume_m: 21.4, turnover_m: 216.5 },
    { code: "5347", ticker: "5347.KL", name: "Tenaga Nasional Berhad", sector: "Utilities", price: 13.04, change: 1.46, volume_m: 15.2, turnover_m: 198.2 },
    { code: "6742", ticker: "6742.KL", name: "YTL Power International", sector: "Utilities", price: 3.62, change: 1.68, volume_m: 48.2, turnover_m: 174.5 },
    { code: "1023", ticker: "1023.KL", name: "CIMB Group Holdings", sector: "Banking", price: 8.24, change: 0.85, volume_m: 18.6, turnover_m: 153.3 },
    { code: "5398", ticker: "5398.KL", name: "Gamuda Berhad", sector: "Construction", price: 7.92, change: 2.19, volume_m: 14.8, turnover_m: 117.2 },
  ],
};

// Regulatory Disclosures Feed with Para 9.22 Statutory Labels
export const RECENT_DISCLOSURES: DisclosureFeedItem[] = [
  { code: "1155", ticker: "1155.KL", name: "Maybank", period: "Q2 2026", date: "10 Nov 2026", title: "Quarterly Rpt on consolidated results for the financial period ended 30 Jun 2026", rev_m: 7200, profit_m: 2350, type: "Quarterly Report", is_audited: false },
  { code: "5347", ticker: "5347.KL", name: "Tenaga Nasional", period: "Q2 2026", date: "08 Nov 2026", title: "Financial Results for the 2nd Quarter ended 30 June 2026", rev_m: 14450, profit_m: 1420, type: "Quarterly Report", is_audited: false },
  { code: "1023", ticker: "1023.KL", name: "CIMB Group", period: "Q2 2026", date: "06 Nov 2026", title: "Unaudited Consolidated Financial Statements for 2nd Quarter ended 30 June 2026", rev_m: 5820, profit_m: 1810, type: "Quarterly Report", is_audited: false },
  { code: "7113", ticker: "7113.KL", name: "Top Glove", period: "Q3 2026", date: "04 Nov 2026", title: "Consolidated Results for the 3rd Financial Quarter Ended 31 May 2026", rev_m: 636, profit_m: 52, type: "Quarterly Report", is_audited: false },
  { code: "5296", ticker: "5296.KL", name: "MR D.I.Y.", period: "Q2 2026", date: "02 Nov 2026", title: "Financial Results for the 2nd Quarter ended 30 June 2026", rev_m: 1180, profit_m: 155, type: "Quarterly Report", is_audited: false },
];

// Bursa Malaysia 13-Sector Index Overview
export const BURSA_SECTORS: SectorIndexItem[] = [
  { name: "Financial Services", code: "001", change: 0.65, count: 32, leader: "Maybank (1155)" },
  { name: "Utilities", code: "002", change: 1.24, count: 14, leader: "Tenaga (5347)" },
  { name: "Healthcare", code: "003", change: 2.15, count: 21, leader: "Top Glove (7113)" },
  { name: "Technology", code: "004", change: 1.42, count: 98, leader: "Inari (0166)" },
  { name: "Construction", code: "005", change: 1.88, count: 54, leader: "Gamuda (5398)" },
  { name: "Consumer Products", code: "006", change: 0.32, count: 168, leader: "MR D.I.Y. (5296)" },
  { name: "Industrial Products", code: "007", change: 0.45, count: 242, leader: "Press Metal (8869)" },
  { name: "Energy & Oilfield", code: "008", change: -0.54, count: 36, leader: "Dialog (7277)" },
  { name: "Plantation", code: "009", change: -0.28, count: 42, leader: "KLK (2445)" },
  { name: "Telecommunications", code: "010", change: -0.15, count: 18, leader: "CelcomDigi (6947)" },
  { name: "Transport & Logistics", code: "011", change: 0.72, count: 33, leader: "MISC (3816)" },
  { name: "Property", code: "012", change: 0.84, count: 94, leader: "Sunway (5211)" },
];

export const CHART_INTERVALS: { [key: string]: { time: string; price: number; volume: number }[] } = {
  "1D": [
    { time: "09:00", price: 10.16, volume: 120 },
    { time: "10:00", price: 10.18, volume: 240 },
    { time: "11:00", price: 10.14, volume: 180 },
    { time: "12:00", price: 10.15, volume: 90 },
    { time: "13:00", price: 10.15, volume: 40 },
    { time: "14:00", price: 10.11, volume: 210 },
    { time: "15:00", price: 10.09, volume: 320 },
    { time: "16:00", price: 10.10, volume: 410 },
    { time: "17:00", price: 10.12, volume: 530 },
  ],
  "5D": [
    { time: "Mon", price: 10.04, volume: 1200 },
    { time: "Tue", price: 10.08, volume: 1450 },
    { time: "Wed", price: 10.22, volume: 1800 },
    { time: "Thu", price: 10.16, volume: 1350 },
    { time: "Fri", price: 10.12, volume: 1980 },
  ],
  "1M": [
    { time: "Wk 1", price: 9.85, volume: 6500 },
    { time: "Wk 2", price: 9.94, volume: 7200 },
    { time: "Wk 3", price: 10.05, volume: 8100 },
    { time: "Wk 4", price: 10.12, volume: 7900 },
  ],
  "6M": [
    { time: "Jun", price: 9.45, volume: 24000 },
    { time: "Jul", price: 9.68, volume: 26500 },
    { time: "Aug", price: 9.88, volume: 31000 },
    { time: "Sep", price: 10.02, volume: 28000 },
    { time: "Oct", price: 10.25, volume: 34000 },
    { time: "Nov", price: 10.12, volume: 29500 },
  ],
  "1Y": [
    { time: "Q1", price: 9.20, volume: 110000 },
    { time: "Q2", price: 9.55, volume: 135000 },
    { time: "Q3", price: 9.90, volume: 142000 },
    { time: "Q4", price: 10.12, volume: 128000 },
  ],
};

export interface ParsedQueryIntent {
  company: PopularCompany | null;
  candidateCompanies?: PopularCompany[];
  categoryTitle?: string;
  categoryExplanation?: string;
  instruction: string;
  raw: string;
  isConceptualOrScreening?: boolean;
}

// Convert BursaStockSuggestion to PopularCompany format
function toPopularCompany(stock: BursaStockSuggestion): PopularCompany {
  return {
    code: stock.code,
    ticker: stock.ticker,
    name: stock.name,
    sector: stock.sector,
    price: stock.price ?? 1.0,
    change: stock.change ?? 0.0,
    positive: stock.positive ?? true,
  };
}

// Natural language query & ticker parser with semantic superlatives & screening intelligence
export function parseQuery(query: string): ParsedQueryIntent {
  if (!query || !query.trim()) {
    return { company: null, instruction: "", raw: "" };
  }

  // 1. Normalize typos in "Malaysia", "smallest", "largest"
  let qNorm = query
    .toLowerCase()
    .trim()
    .replace(/\b(malayusia|malysia|malasyia|mlaysia)\b/g, "malaysia")
    .replace(/\b(smalest)\b/g, "smallest")
    .replace(/\b(lagest)\b/g, "largest");

  let matchedCompany: PopularCompany | null = null;
  let candidateCompanies: PopularCompany[] = [];
  let categoryTitle = "";
  let categoryExplanation = "";
  let isConceptual = false;

  // 2. SEMANTIC SUPERLATIVES & INTENT CLASSIFIER

  // A. SMALLEST BANK / LENDER
  if (
    /(smallest|micro|small\s?cap|lowest\s?cap|lowest\s?price|cheapest)\s+(bank|banking|lender)/i.test(qNorm) ||
    /malaysia('?s)?\s+(smallest|cheapest)\s+(bank|banking|lender)/i.test(qNorm)
  ) {
    const ambank = BURSA_STOCKS_CATALOG.find((c) => c.code === "1015");
    if (ambank) {
      matchedCompany = toPopularCompany(ambank);
      categoryTitle = "Smallest Commercial Banking Peer";
      categoryExplanation = "AMMB Holdings (AmBank) is the smallest primary commercial banking group by market cap in the peer catalog.";
      candidateCompanies = [
        toPopularCompany(ambank),
        toPopularCompany(BURSA_STOCKS_CATALOG.find((c) => c.code === "1295")!), // Public Bank
        toPopularCompany(BURSA_STOCKS_CATALOG.find((c) => c.code === "1066")!), // RHB
      ].filter(Boolean);
      isConceptual = true;
    }
  }

  // B. SMALLEST COMPANY / EQUITIES / MICRO-CAP / PENNY STOCKS
  else if (
    /(smallest|micro\s?cap|lowest\s?cap|penny\s?stock|lowest\s?price|cheapest)\s*(company|companies|stock|stocks|equity|equities|listed|firm|enterprise)?/i.test(qNorm) ||
    /malaysia('?s)?\s+(smallest|cheapest)\s*(company|companies|stock|stocks|equity|equities)?/i.test(qNorm)
  ) {
    // Sort all catalog stocks by price ascending to find the smallest-cap constituents
    const sortedByPrice = [...BURSA_STOCKS_CATALOG]
      .filter((s) => s.price !== undefined)
      .sort((a, b) => (a.price ?? 999) - (b.price ?? 999));

    if (sortedByPrice.length > 0) {
      matchedCompany = toPopularCompany(sortedByPrice[0]); // Velesto Energy (0.22)
      categoryTitle = "Smallest Listed Equities (Micro & Small-Cap)";
      categoryExplanation = "Found lowest market cap & penny-tier constituents tracked on Bursa Malaysia.";
      candidateCompanies = sortedByPrice.slice(0, 4).map(toPopularCompany);
      isConceptual = true;
    }
  }

  // C. LARGEST BANK / TOP LENDER
  else if (
    /(largest|biggest|top|no\.?\s?1|number\s?one)\s+(bank|banking|lender)/i.test(qNorm) ||
    /malaysia('?s)?\s+(largest|biggest|top)\s+bank/i.test(qNorm)
  ) {
    const maybank = BURSA_STOCKS_CATALOG.find((c) => c.code === "1155");
    if (maybank) {
      matchedCompany = toPopularCompany(maybank);
      categoryTitle = "Malaysia's #1 Largest Bank & Listed Company";
      categoryExplanation = "Malayan Banking Berhad (Maybank) is Malaysia's largest commercial bank with RM 121B+ market cap.";
    }
  }

  // D. 2ND LARGEST BANK
  else if (
    /(second|2nd)\s+(largest|biggest)\s+(bank|banking|lender)/i.test(qNorm) ||
    /malaysia('?s)?\s+(second|2nd)\s+(largest|biggest)\s+bank/i.test(qNorm)
  ) {
    const cimb = BURSA_STOCKS_CATALOG.find((c) => c.code === "1023");
    if (cimb) {
      matchedCompany = toPopularCompany(cimb);
      categoryTitle = "Malaysia's 2nd Largest Commercial Bank";
      categoryExplanation = "CIMB Group Holdings is Malaysia's second largest banking group with regional footprint.";
    }
  }

  // E. 3RD LARGEST BANK
  else if (
    /(third|3rd)\s+(largest|biggest)\s+(bank|banking|lender)/i.test(qNorm) ||
    /malaysia('?s)?\s+(third|3rd)\s+(largest|biggest)\s+bank/i.test(qNorm)
  ) {
    const pbb = BURSA_STOCKS_CATALOG.find((c) => c.code === "1295");
    if (pbb) {
      matchedCompany = toPopularCompany(pbb);
      categoryTitle = "Malaysia's 3rd Largest Commercial Bank";
      categoryExplanation = "Public Bank Berhad is Malaysia's third largest commercial bank, leading in consumer asset quality.";
    }
  }

  // F. UTILITIES / POWER LEADERS & CHEAPEST UTILITY
  else if (/(largest|biggest)\s+(utility|power|electric)/i.test(qNorm)) {
    const tnb = BURSA_STOCKS_CATALOG.find((c) => c.code === "5347");
    if (tnb) matchedCompany = toPopularCompany(tnb);
  } else if (/(cheapest|lowest)\s+(utility|power)/i.test(qNorm)) {
    const ytlp = BURSA_STOCKS_CATALOG.find((c) => c.code === "6742");
    if (ytlp) matchedCompany = toPopularCompany(ytlp);
  }

  // G. HIGHEST DIVIDEND / YIELD LEADER
  else if (/(highest\s+dividend|best\s+dividend|dividend\s+yield|high\s+yield)/i.test(qNorm)) {
    const maybank = BURSA_STOCKS_CATALOG.find((c) => c.code === "1155");
    const petdag = BURSA_STOCKS_CATALOG.find((c) => c.code === "5681");
    if (maybank) {
      matchedCompany = toPopularCompany(maybank);
      categoryTitle = "High Dividend Yield Leaders";
      categoryExplanation = "Maybank & PETRONAS Dagangan historically maintain industry-leading 6%+ dividend payout yields.";
      candidateCompanies = [
        toPopularCompany(maybank),
        petdag ? toPopularCompany(petdag) : null,
        toPopularCompany(BURSA_STOCKS_CATALOG.find((c) => c.code === "5347")!),
      ].filter(Boolean) as PopularCompany[];
      isConceptual = true;
    }
  }

  // H. HIGHEST PRICED / EXPENSIVE SHARE
  else if (/(highest\s+price|most\s+expensive)/i.test(qNorm)) {
    const nestle = BURSA_STOCKS_CATALOG.find((c) => c.code === "4707");
    if (nestle) {
      matchedCompany = toPopularCompany(nestle);
      categoryTitle = "Highest Unit Share Price Constituent";
      categoryExplanation = "Nestle (Malaysia) Berhad trades at ~RM 112.50 per share, the highest nominal share price on Bursa.";
    }
  }

  // 3. GENERIC SECTOR STOPWORDS FOR EXACT NAME ISOLATION
  const SECTOR_STOPWORDS = new Set([
    "bank", "banking", "group", "holdings", "berhad", "bhd", "corp", "corporation",
    "chem", "chemicals", "power", "malaysia", "retail", "national", "international",
    "services", "the", "and", "company", "stock", "equity", "share", "shares"
  ]);

  // 4. DIRECT SEARCH ACROSS ALL 37+ BURSA CATALOG STOCKS (Not just the 8 popular ones!)
  if (!matchedCompany) {
    for (const stock of BURSA_STOCKS_CATALOG) {
      const distinctNameWords = stock.name
        .toLowerCase()
        .split(/[\s.()/]+/)
        .filter((t) => t.length > 2 && !SECTOR_STOPWORDS.has(t));

      const aliases = [
        stock.code,
        stock.ticker.toLowerCase(),
        stock.shortName.toLowerCase(),
        ...(stock.aliases || []).map((a) => a.toLowerCase()),
        ...distinctNameWords,
      ];

      for (const alias of aliases) {
        const reg = new RegExp(`\\b${alias.replace(".", "\\.")}\\b`, "i");
        if (reg.test(qNorm)) {
          matchedCompany = toPopularCompany(stock);
          break;
        }
      }
      if (matchedCompany) break;
    }
  }

  // 5. DIRECT CODE OR SUBSTRING MATCH
  if (!matchedCompany) {
    const found = BURSA_STOCKS_CATALOG.find(
      (c) =>
        qNorm.includes(c.code) ||
        qNorm.includes(c.name.toLowerCase()) ||
        qNorm.includes(c.ticker.toLowerCase()) ||
        qNorm.includes(c.shortName.toLowerCase())
    );
    if (found) matchedCompany = toPopularCompany(found);
  }

  // 6. DYNAMIC SECTOR / TOPIC MATCHING FOR CANDIDATES WHEN NO EXACT MATCH
  if (!matchedCompany) {
    isConceptual = true;
    if (/\b(bank|banking|finance|financial)\b/i.test(qNorm)) {
      categoryTitle = "Bursa Malaysia Banking Sector";
      categoryExplanation = "Commercial banking institutions tracked by Bursa Financial Intelligence.";
      candidateCompanies = BURSA_STOCKS_CATALOG.filter((s) => s.sector.toLowerCase().includes("bank")).map(toPopularCompany);
    } else if (/\b(tech|technology|semiconductor|chip|software)\b/i.test(qNorm)) {
      categoryTitle = "Technology & Semiconductor Equities";
      categoryExplanation = "Digital technology, outsourced semiconductor assembly and test (OSAT) constituents.";
      candidateCompanies = BURSA_STOCKS_CATALOG.filter((s) => s.sector.toLowerCase().includes("tech")).map(toPopularCompany);
    } else if (/\b(energy|oil|gas|drilling|petroleum)\b/i.test(qNorm)) {
      categoryTitle = "Energy & Oilfield Services";
      categoryExplanation = "Oilfield exploration, offshore drilling, and downstream energy constituents.";
      candidateCompanies = BURSA_STOCKS_CATALOG.filter((s) => s.sector.toLowerCase().includes("energy") || s.sector.toLowerCase().includes("gas")).map(toPopularCompany);
    } else if (/\b(glove|healthcare|rubber|hospital)\b/i.test(qNorm)) {
      categoryTitle = "Healthcare & Protective Rubber";
      categoryExplanation = "Healthcare hospital operators and medical examination glove manufacturers.";
      candidateCompanies = BURSA_STOCKS_CATALOG.filter((s) => s.sector.toLowerCase().includes("health")).map(toPopularCompany);
    } else {
      // Unrecognized query: do not seed arbitrary fallback constituents.
      candidateCompanies = [];
    }
  }

  // 7. Extract Clean Instruction
  let instruction = query;
  if (matchedCompany) {
    const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const identityTokens = [
      matchedCompany.name,
      matchedCompany.ticker,
      matchedCompany.code,
      ...matchedCompany.name.split(/[\s.()/&,-]+/),
    ]
      .map((token) => token.trim())
      .filter((token) => token.length > 1 && !SECTOR_STOPWORDS.has(token.toLowerCase()))
      .sort((a, b) => b.length - a.length);

    let clean = query;
    for (const token of identityTokens) {
      clean = clean.replace(new RegExp(escapeRegExp(token), "gi"), " ");
    }
    clean = clean.replace(new RegExp(`\\b${escapeRegExp(matchedCompany.code)}\\b`, "gi"), " ");
    clean = clean.replace(
      /\b(for|of|on|about|the|stock|company|bursa|please|can you|analyze|analyse|report|reports|financial|financials|results|malaysia|malayusia)\b/gi,
      " "
    );
    clean = clean.replace(/\s+/g, " ").trim();
    instruction = /[a-z0-9]/i.test(clean) ? clean : "";
  }

  if (/analy[sz]e/i.test(query) && /financial|report|filing|quarterly/i.test(query)) {
    instruction = "Please provide an executive summary and analysis of the latest financial report, highlighting revenue, profit margins, and key performance drivers.";
  }

  return {
    company: matchedCompany,
    candidateCompanies,
    categoryTitle,
    categoryExplanation,
    instruction,
    raw: query,
    isConceptualOrScreening: isConceptual,
  };
}
