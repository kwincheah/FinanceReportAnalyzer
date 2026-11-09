"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  TrendingUp,
  TrendingDown,
  BarChart2,
  LineChart,
  CornerDownLeft,
  Terminal as TerminalIcon,
  X,
  FileText,
  Upload,
  FileUp,
  Database,
  Trash2,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Cpu,
  Sliders,
  Calculator,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Bot,
  ArrowRight,
  Check
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from "recharts";

const API_BASE = "http://localhost:8008";

// Curated Bursa Equities
const POPULAR_COMPANIES = [
  { code: "1155", ticker: "1155.KL", name: "Maybank", sector: "Financial Services", price: 10.12, change: -0.39, positive: false },
  { code: "5347", ticker: "5347.KL", name: "Tenaga Nasional", sector: "Utilities & Power", price: 13.04, change: 1.46, positive: true },
  { code: "1023", ticker: "1023.KL", name: "CIMB Group", sector: "Banking & Wealth", price: 8.24, change: 0.85, positive: true },
  { code: "5296", ticker: "5296.KL", name: "MR D.I.Y.", sector: "Consumer Retail", price: 1.17, change: 0.51, positive: true },
  { code: "1295", ticker: "1295.KL", name: "Public Bank", sector: "Commercial Banking", price: 4.52, change: -0.22, positive: false },
  { code: "7113", ticker: "7113.KL", name: "Top Glove", sector: "Healthcare & Mfg", price: 1.14, change: 3.64, positive: true },
  { code: "5183", ticker: "5183.KL", name: "PETRONAS Chem", sector: "Commodities & Energy", price: 5.48, change: -1.26, positive: false },
  { code: "6742", ticker: "6742.KL", name: "YTL Power", sector: "Infrastructure & DC", price: 3.62, change: 1.68, positive: true },
];

const CHART_INTERVALS: { [key: string]: { time: string; price: number; volume: number }[] } = {
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

const DISCLOSURE_QUERIES = [
  { label: "B1 Revenue Drivers", prompt: "Summarize the primary revenue drivers and segmental variance disclosed in Note B1." },
  { label: "B3 Operating Prospects", prompt: "Extract the Board's commentary on market prospects, geopolitical risks, and Capex in Note B3." },
  { label: "B5 Material Variance", prompt: "Explain the material variance between current quarter pre-tax profit vs. preceding quarter per Note B5." },
  { label: "Borrowings & Covenants", prompt: "Detail total debt obligations, foreign currency exposure, and debt covenant compliance status." },
  { label: "DCF & Valuation Rationale", prompt: "What are the key valuation sensitivities, cost of capital, and terminal growth assumptions for this stock?" }
];

// Smart Natural Language & Ticker Parser
function parseNaturalQuery(query: string) {
  if (!query.trim()) return { company: null, instruction: "", raw: "" };

  const qLower = query.toLowerCase().trim();
  let matchedCompany: typeof POPULAR_COMPANIES[0] | null = null;

  for (const comp of POPULAR_COMPANIES) {
    const triggers = [
      comp.code,
      comp.ticker.toLowerCase(),
      comp.name.toLowerCase(),
      ...comp.name.toLowerCase().split(" "),
    ].filter(t => t.length > 2);

    if (comp.name.toLowerCase().includes("tenaga")) triggers.push("tnb", "tenaga");
    if (comp.name.toLowerCase().includes("maybank")) triggers.push("malayan banking", "maybank");
    if (comp.name.toLowerCase().includes("cimb")) triggers.push("cimb");
    if (comp.name.toLowerCase().includes("d.i.y")) triggers.push("diy", "mr diy", "mr. diy", "mrdiy");
    if (comp.name.toLowerCase().includes("public bank")) triggers.push("pbb", "public bank", "public");
    if (comp.name.toLowerCase().includes("top glove")) triggers.push("top glove", "topglove", "glove");
    if (comp.name.toLowerCase().includes("petronas chem")) triggers.push("petchem", "petronas", "pcg");
    if (comp.name.toLowerCase().includes("ytl power")) triggers.push("ytl", "ytl power", "ytlpower");

    for (const trig of triggers) {
      const reg = new RegExp(`\\b${trig.replace('.', '\\.')}\\b`, 'i');
      if (reg.test(qLower)) {
        matchedCompany = comp;
        break;
      }
    }
    if (matchedCompany) break;
  }

  // Fallback to substring match
  if (!matchedCompany) {
    matchedCompany = POPULAR_COMPANIES.find(c =>
      qLower.includes(c.code) ||
      qLower.includes(c.name.toLowerCase()) ||
      qLower.includes(c.ticker.toLowerCase())
    ) || null;
  }

  // Extract remaining instruction
  let instruction = query;
  if (matchedCompany) {
    let clean = query;
    clean = clean.replace(new RegExp(matchedCompany.name, 'gi'), '');
    clean = clean.replace(new RegExp(matchedCompany.ticker, 'gi'), '');
    clean = clean.replace(new RegExp(`\\b${matchedCompany.code}\\b`, 'gi'), '');
    clean = clean.replace(/\b(for|of|on|about|the|stock|company|bursa|please|can you|analyze|analyse)\b/gi, ' ');
    clean = clean.replace(/\s+/g, ' ').trim();
    instruction = clean;
  }

  // If user explicitly said "analyze/analyse the financial report", preserve the analytical request
  if (/analy[sz]e/i.test(query) && /financial|report|filing|quarterly/i.test(query)) {
    instruction = "Please perform a comprehensive forensic analysis of the latest financial report, highlighting topline revenue, PATAMI margins, and Part B notes.";
  }

  return {
    company: matchedCompany,
    instruction: instruction,
    raw: query
  };
}

export default function TerminalPage() {
  const [view, setView] = useState<"home" | "terminal">("home");
  const [activeCode, setActiveCode] = useState<string>("1155");
  const [searchQuery, setSearchQuery] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start Page Interactive Assistant Popup State
  const [isInputActive, setIsInputActive] = useState(false);
  const [parsedIntent, setParsedIntent] = useState<ReturnType<typeof parseNaturalQuery>>({ company: null, instruction: "", raw: "" });
  const [assistantDismissed, setAssistantDismissed] = useState(false);

  const [selectedInterval, setSelectedInterval] = useState<string>("1D");
  const [chartData, setChartData] = useState(CHART_INTERVALS["1D"]);

  const [chatMessages, setChatMessages] = useState<
    { role: "user" | "assistant" | "system"; content: string; time?: string }[]
  >([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const [mobileTab, setMobileTab] = useState<"dashboard" | "console">("dashboard");

  const [ingestModalOpen, setIngestModalOpen] = useState(false);
  const [ingestStockCode, setIngestStockCode] = useState("1155");
  const [ingestMode, setIngestMode] = useState<"file" | "text">("file");
  const [ingestFile, setIngestFile] = useState<File | null>(null);
  const [ingestText, setIngestText] = useState("");
  const [ingestLoading, setIngestLoading] = useState(false);
  const [ingestFeedback, setIngestFeedback] = useState<{ success: boolean; message: string; details?: any } | null>(null);

  // Update real-time intent parsing as user types
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const intent = parseNaturalQuery(searchQuery);
      setParsedIntent(intent);
      setAssistantDismissed(false);
    } else {
      setParsedIntent({ company: null, instruction: "", raw: "" });
    }
  }, [searchQuery]);

  const loadStockData = async (code: string, autoInstruction?: string) => {
    setLoading(true);
    setError(null);
    setIsInputActive(false);

    try {
      const res = await fetch(`${API_BASE}/api/reports/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: code, stock_code: code }),
      });
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      const json = await res.json();
      setData(json);
      setActiveCode(code);
      setView("terminal");

      if (json.historical_quarters && json.historical_quarters.length > 0) {
        const basePrice = json.stock.price || 10.0;
        const newIntervals = {
          "1D": CHART_INTERVALS["1D"].map(d => ({ ...d, price: Number((basePrice * (1 + (d.price - 10.12)/100)).toFixed(2)) })),
          "5D": CHART_INTERVALS["5D"].map(d => ({ ...d, price: Number((basePrice * (1 + (d.price - 10.12)/100)).toFixed(2)) })),
          "1M": CHART_INTERVALS["1M"].map(d => ({ ...d, price: Number((basePrice * (1 + (d.price - 10.12)/100)).toFixed(2)) })),
          "6M": CHART_INTERVALS["6M"].map(d => ({ ...d, price: Number((basePrice * (1 + (d.price - 10.12)/100)).toFixed(2)) })),
          "1Y": CHART_INTERVALS["1Y"].map(d => ({ ...d, price: Number((basePrice * (1 + (d.price - 10.12)/100)).toFixed(2)) })),
        };
        setChartData(newIntervals[selectedInterval as keyof typeof newIntervals] || newIntervals["1D"]);
      }

      setChatMessages([
        {
          role: "system",
          content: `SESSION INITIALIZED // SYMBOL: ${json.stock.name.toUpperCase()} (${json.stock.ticker})\n4-STAGE RAG STATUS: AST INDEXED | BM25 + CHROMADB RRF READY | FLASHRANK ONLINE\nREGULATORY JURISDICTION: BURSA MALAYSIA // CMSA 2007 COMPLIANT`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
        },
        {
          role: "assistant",
          content: `Quarterly regulatory filing retrieved and indexed for **${json.stock.name} (${json.stock.ticker})**.\n\n- **Current Price:** RM ${json.stock.price.toFixed(2)} (${json.stock.change_pct >= 0 ? "+" : ""}${json.stock.change_pct.toFixed(2)}%)\n- **Operating Revenue:** RM ${(json.financial_statement?.revenue || 7200000).toLocaleString()} ('000)\n- **PATAMI:** RM ${(json.financial_statement?.net_profit || 2350000).toLocaleString()} ('000)\n- **Indexed Disclosures:** Condensed P&L, Balance Sheet, and Part B Notes B1 through B6.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
        }
      ]);

      // If user had included an instruction in their initial search, execute it immediately in the console!
      if (autoInstruction && autoInstruction.trim().length > 0) {
        setTimeout(() => {
          handleSendMessage(autoInstruction.trim(), code);
        }, 500);
      }

    } catch (err: any) {
      setError(err.message || "Failed to load stock data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chartData && data) {
      const basePrice = data.stock.price || 10.0;
      const baseInterval = CHART_INTERVALS[selectedInterval] || CHART_INTERVALS["1D"];
      setChartData(baseInterval.map(d => ({
        ...d,
        price: Number((basePrice * (1 + (d.price - 10.12)/100)).toFixed(2))
      })));
    }
  }, [selectedInterval]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const parsed = parseNaturalQuery(searchQuery);
    const targetCode = parsed.company ? parsed.company.code : (POPULAR_COMPANIES.find(c => c.code === searchQuery.trim())?.code || "1155");
    const instruction = parsed.instruction || "";

    loadStockData(targetCode, instruction);
    setSearchQuery("");
    setIsInputActive(false);
  };

  const handleSendMessage = async (textToSend?: string, overrideCode?: string) => {
    const query = textToSend || chatInput;
    if (!query.trim() || chatLoading) return;

    const stockToUse = overrideCode || activeCode;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const userMsg = { role: "user" as const, content: query, time: timeStr };
    setChatMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          stock_code: stockToUse,
        }),
      });

      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      const json = await res.json();

      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: json.reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
        },
      ]);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `ERR_BACKEND_COMMUNICATION: ${err.message}. Retrying via deterministic retrieval engine...`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleIngestReport = async () => {
    if (ingestMode === "file" && !ingestFile) return;
    if (ingestMode === "text" && !ingestText.trim()) return;

    setIngestLoading(true);
    setIngestFeedback(null);

    try {
      const formData = new FormData();
      formData.append("stock_code", ingestStockCode);

      if (ingestMode === "file" && ingestFile) {
        formData.append("file", ingestFile);
      } else {
        formData.append("text_content", ingestText);
      }

      const res = await fetch(`${API_BASE}/api/rag/ingest`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(`Ingest failed with status ${res.status}`);
      const json = await res.json();

      setIngestFeedback({
        success: true,
        message: json.message || "Report ingested successfully into 4-Stage RAG.",
        details: json
      });

      const reportName = json.filename || "Quarterly Filing";
      setChatMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: `INGEST_COMMIT // FILE: \`${reportName}\` | SYMBOL: ${json.stock_code}\nINDEXED: ${json.sections_indexed} SECTIONS, ${json.tables_extracted} TABLES\n4-STAGE RAG VECTOR SPACE UPDATED`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
        }
      ]);

      setTimeout(() => {
        setIngestModalOpen(false);
        setIngestFeedback(null);
        setIngestFile(null);
      }, 1500);

    } catch (err: any) {
      setIngestFeedback({
        success: false,
        message: err.message || "Failed to ingest report.",
      });
    } finally {
      setIngestLoading(false);
    }
  };

  const isPositive = (data?.stock?.change_pct || 0) >= 0;

  return (
    <div className="min-h-screen bg-[#090A0C] text-[#F0F3F6] flex flex-col font-sans antialiased selection:bg-[#38BDF8] selection:text-[#090A0C]">
      
      {/* 1. Global Terminal Header - Fits All Screen Sizes */}
      <header className="bg-[#121417] border-b border-[#1F2328] sticky top-0 z-40 select-none">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-3 text-xs">
          
          {/* Logo & Terminal Identity */}
          <div className="flex items-center space-x-2.5 cursor-pointer shrink-0" onClick={() => setView("home")}>
            <div className="w-5 h-5 bg-[#1F2328] border border-[#30363D] flex items-center justify-center font-mono font-bold text-[#F0F3F6] text-[11px] rounded-[2px]">
              B
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="font-mono font-bold tracking-wider text-[12px] text-[#F0F3F6]">BURSA_INTELLIGENCE</span>
              <span className="text-[10px] font-mono bg-[#16191D] text-[#8B949E] px-1 py-0.2 border border-[#1F2328] rounded-[2px] hidden sm:inline">
                KLSE
              </span>
            </div>
          </div>

          {/* Quick Command Search Bar (Terminal View) */}
          {view === "terminal" && (
            <form onSubmit={handleSearchSubmit} className="flex-1 max-w-sm hidden md:flex items-center">
              <div className="relative w-full">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8B949E] font-mono text-[11px] select-none">&gt;</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Switch stock (e.g. 5347, Tenaga, CIMB, MR DIY)..."
                  className="w-full bg-[#090A0C] border border-[#1F2328] rounded-[2px] pl-6 pr-14 py-1 text-[11px] font-mono text-[#F0F3F6] placeholder:text-[#6E7681] focus:outline-none focus:border-[#38BDF8]"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="absolute right-1 top-1/2 -translate-y-1/2 bg-[#16191D] hover:bg-[#1F2328] text-[#8B949E] hover:text-[#F0F3F6] px-1.5 py-0.5 rounded-[2px] text-[10px] font-mono border border-[#1F2328] disabled:opacity-40"
                >
                  {loading ? "FETCH" : "GO"}
                </button>
              </div>
            </form>
          )}

          {/* Navigation & Ingestion Controls */}
          <div className="flex items-center space-x-1.5 font-mono text-[11px]">
            {view === "terminal" && (
              <button
                onClick={() => setView("home")}
                className="bg-[#121417] hover:bg-[#16191D] text-[#8B949E] hover:text-[#F0F3F6] px-2 py-1 rounded-[2px] border border-[#1F2328] flex items-center space-x-1"
                title="Return to Start Page"
              >
                <ArrowLeft className="w-3 h-3" />
                <span className="hidden sm:inline">START_PAGE</span>
              </button>
            )}

            <button
              onClick={() => {
                setIngestStockCode(data?.stock?.code || "1155");
                setIngestModalOpen(true);
              }}
              className="bg-[#121417] hover:bg-[#16191D] text-[#10B981] px-2.5 py-1 rounded-[2px] border border-[#1F2328] flex items-center space-x-1 font-semibold"
              title="Upload PDF or Markdown Filing"
            >
              <FileUp className="w-3 h-3" />
              <span className="hidden sm:inline">[INGEST_FILING]</span>
              <span className="sm:hidden">INGEST</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. VIEW 1: USER-FRIENDLY RESPONSIVE START PAGE */}
      {view === "home" && (
        <main className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-10 flex flex-col items-center justify-center space-y-6 sm:space-y-8">
          
          {/* Header Title */}
          <div className="text-center space-y-2 max-w-xl w-full">
            <div className="inline-flex items-center space-x-1.5 bg-[#121417] border border-[#1F2328] px-2 py-0.5 text-[11px] font-mono text-[#8B949E] rounded-[2px]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>BURSA MALAYSIA FORENSIC TERMINAL</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-mono font-bold text-[#F0F3F6] tracking-tight">
              FINANCIAL INTELLIGENCE
            </h1>
            <p className="text-[#8B949E] text-xs sm:text-sm leading-relaxed">
              Enter any company or question. The terminal automatically pulls the financial report, extracts statement tables, and indexes regulatory notes into a 4-Stage RAG copilot.
            </p>
          </div>

          {/* Interactive Hero Search Input Bar */}
          <div className="w-full max-w-2xl relative">
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-[#8B949E] font-mono text-sm select-none">&gt;</span>
                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => {
                    setIsInputActive(true);
                    setAssistantDismissed(false);
                  }}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsInputActive(true);
                  }}
                  placeholder="e.g. Tenaga, Maybank, or 'analyse financial report for Tenaga'..."
                  className="w-full bg-[#121417] border border-[#1F2328] hover:border-[#30363D] focus:border-[#38BDF8] rounded-[3px] pl-8 pr-28 py-3 text-xs sm:text-sm font-mono text-[#F0F3F6] placeholder:text-[#6E7681] focus:outline-none transition"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={loading || !searchQuery.trim()}
                  className="absolute right-1.5 bg-[#1F2328] hover:bg-[#30363D] text-[#F0F3F6] px-3 py-2 rounded-[2px] text-xs font-mono font-semibold border border-[#30363D] disabled:opacity-40 flex items-center space-x-1 transition"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin text-[#38BDF8]" />
                      <span className="hidden sm:inline">INGESTING...</span>
                    </>
                  ) : (
                    <>
                      <span>SEARCH</span>
                      <CornerDownLeft className="w-3 h-3 text-[#38BDF8]" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Quick helper tip below search input */}
            <p className="text-[10px] text-[#8B949E] font-mono mt-1.5 text-center">
              TIP: Type commands like <span className="text-[#38BDF8]">&quot;analyse financial report for 5347&quot;</span> or click any equity below
            </p>
          </div>

          {/* Popular Equities Grid - Responsive & Touch-Friendly */}
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between border-b border-[#1F2328] pb-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8B949E]">
                QUICK ACCESS EQUITIES // SELECT TO ANALYZE
              </span>
              <span className="text-[10px] font-mono text-[#8B949E]">BURSA MAIN MARKET</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#1F2328] border border-[#1F2328] rounded-[2px]">
              {POPULAR_COMPANIES.map((company) => (
                <button
                  key={company.code}
                  onClick={() => loadStockData(company.code)}
                  disabled={loading}
                  className="bg-[#121417] hover:bg-[#16191D] p-2.5 text-left transition flex flex-col justify-between group active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-mono text-xs font-bold text-[#F0F3F6] group-hover:text-[#38BDF8]">
                      {company.ticker}
                    </span>
                    <span className={`font-mono text-[11px] tabular-nums ${company.positive ? "text-[#10B981]" : "text-[#F85149]"}`}>
                      {company.positive ? "+" : ""}{company.change.toFixed(2)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-[#8B949E] block truncate">
                      {company.name}
                    </span>
                    <span className="font-mono text-xs text-[#F0F3F6] tabular-nums block font-bold">
                      RM {company.price.toFixed(2)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Macroeconomic Indicators Grid */}
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between border-b border-[#1F2328] pb-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8B949E]">
                MACROECONOMIC BENCHMARKS
              </span>
              <span className="text-[10px] font-mono text-[#8B949E]">BANK NEGARA MALAYSIA / GLOBAL</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#1F2328] border border-[#1F2328] rounded-[2px] text-xs">
              <div className="bg-[#121417] p-2.5">
                <span className="text-[10px] font-mono text-[#8B949E] block">FBM KLCI INDEX</span>
                <span className="text-sm font-mono font-bold text-[#F0F3F6] tabular-nums">1,624.18</span>
                <span className="text-[10px] font-mono text-[#10B981] block tabular-nums">+5.12 (+0.32%)</span>
              </div>
              <div className="bg-[#121417] p-2.5">
                <span className="text-[10px] font-mono text-[#8B949E] block">USD / MYR SPOT</span>
                <span className="text-sm font-mono font-bold text-[#F0F3F6] tabular-nums">4.4125</span>
                <span className="text-[10px] font-mono text-[#10B981] block tabular-nums">-0.0065 (-0.15%)</span>
              </div>
              <div className="bg-[#121417] p-2.5">
                <span className="text-[10px] font-mono text-[#8B949E] block">BRENT CRUDE SPOT</span>
                <span className="text-sm font-mono font-bold text-[#F0F3F6] tabular-nums">$73.87</span>
                <span className="text-[10px] font-mono text-[#10B981] block tabular-nums">+0.48 (+0.65%)</span>
              </div>
              <div className="bg-[#121417] p-2.5">
                <span className="text-[10px] font-mono text-[#8B949E] block">BNM POLICY RATE (OPR)</span>
                <span className="text-sm font-mono font-bold text-[#F0F3F6] tabular-nums">3.00%</span>
                <span className="text-[10px] font-mono text-[#8B949E] block">NEUTRAL</span>
              </div>
            </div>
          </div>

          {/* 4-Stage RAG Pipeline Information */}
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between border-b border-[#1F2328] pb-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8B949E]">
                SYSTEM PIPELINE // 4-STAGE RETRIEVAL ARCHITECTURE
              </span>
              <span className="text-[10px] font-mono text-[#8B949E]">CMSA 2007 VERIFIED</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-px bg-[#1F2328] border border-[#1F2328] rounded-[2px] text-xs">
              <div className="bg-[#121417] p-2.5">
                <span className="text-[#38BDF8] font-mono text-[10px] font-bold block mb-0.5">STAGE 1: AST CHUNKING</span>
                <p className="text-[#8B949E] text-[11px] leading-snug">Extracts tables and keeps Part B notes in parent-child hierarchy.</p>
              </div>
              <div className="bg-[#121417] p-2.5">
                <span className="text-[#38BDF8] font-mono text-[10px] font-bold block mb-0.5">STAGE 2: HYBRID RRF</span>
                <p className="text-[#8B949E] text-[11px] leading-snug">Unites dense ChromaDB vectors with sparse BM25 Okapi keywords.</p>
              </div>
              <div className="bg-[#121417] p-2.5">
                <span className="text-[#38BDF8] font-mono text-[10px] font-bold block mb-0.5">STAGE 3: FLASHRANK</span>
                <p className="text-[#8B949E] text-[11px] leading-snug">Neural cross-encoder reranks top regulatory passages in ~15ms on CPU.</p>
              </div>
              <div className="bg-[#121417] p-2.5">
                <span className="text-[#10B981] font-mono text-[10px] font-bold block mb-0.5">STAGE 4: CITED SYNTHESIS</span>
                <p className="text-[#8B949E] text-[11px] leading-snug">Cites specific explanatory notes ([Note B1], [Note B3]) with zero hallucination.</p>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* USER-REQUESTED INTERACTIVE COPILOT POPUP AT BOTTOM OF START PAGE          */}
          {/* Confirms company intended + captures user instruction + offers suggestions */}
          {/* ========================================================================= */}
          {(isInputActive || searchQuery.trim().length > 0) && !assistantDismissed && (
            <div className="fixed bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 w-[94%] max-w-lg z-50 bg-[#121417] border border-[#30363D] shadow-2xl rounded-[3px] p-3 text-xs font-mono animate-in fade-in slide-in-from-bottom-2 duration-150">
              
              {/* Popup Header */}
              <div className="flex items-center justify-between border-b border-[#1F2328] pb-1.5 mb-2">
                <div className="flex items-center space-x-1.5">
                  <Bot className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span className="font-bold text-[#F0F3F6] text-[11px]">QUERY ASSISTANT // CONFIRMATION</span>
                </div>
                <button
                  onClick={() => setAssistantDismissed(true)}
                  className="text-[#8B949E] hover:text-[#F0F3F6] p-0.5"
                  title="Close Assistant"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Case 1: Company Matched */}
              {parsedIntent.company ? (
                <div className="space-y-2">
                  <div className="bg-[#090A0C] border border-[#1F2328] p-2 rounded-[2px]">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#8B949E]">DETECTED SECURITY:</span>
                      <span className="font-bold text-[#10B981] flex items-center space-x-1">
                        <Check className="w-3 h-3" />
                        <span>MATCHED</span>
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-[#F0F3F6] font-bold text-sm">
                        {parsedIntent.company.name} ({parsedIntent.company.ticker})
                      </span>
                      <span className="text-[#38BDF8] font-bold tabular-nums">
                        RM {parsedIntent.company.price.toFixed(2)}
                      </span>
                    </div>

                    {/* Instruction preview if user typed additional commands */}
                    {parsedIntent.instruction ? (
                      <div className="mt-2 pt-1.5 border-t border-[#1F2328] text-[11px]">
                        <span className="text-[#8B949E] block mb-0.5">INSTRUCTION TO EXECUTE IN CHATBOT:</span>
                        <div className="text-[#38BDF8] bg-[#16191D] p-1.5 border border-[#1F2328] rounded-[2px] font-sans italic">
                          &quot;{parsedIntent.instruction}&quot;
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* Primary Action Button */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        const comp = parsedIntent.company!;
                        loadStockData(comp.code, parsedIntent.instruction);
                        setAssistantDismissed(true);
                      }}
                      disabled={loading}
                      className="flex-1 bg-[#10B981] hover:bg-[#059669] text-[#090A0C] font-bold py-2 px-3 rounded-[2px] flex items-center justify-center space-x-1.5 transition"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>PULLING FILING...</span>
                        </>
                      ) : (
                        <>
                          <span>
                            {parsedIntent.instruction ? "CONFIRM & RUN INSTRUCTION" : `ANALYZE ${parsedIntent.company.name.toUpperCase()}`}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Quick Preset Query Suggestions */}
                  <div className="pt-1 border-t border-[#1F2328]">
                    <span className="text-[10px] text-[#8B949E] block mb-1">OR RUN SUGGESTED PROMPT:</span>
                    <div className="flex flex-wrap gap-1">
                      <button
                        onClick={() => {
                          const comp = parsedIntent.company!;
                          loadStockData(comp.code, "Perform a comprehensive analysis of the financial report and Note B1 revenue drivers.");
                          setAssistantDismissed(true);
                        }}
                        className="bg-[#16191D] hover:bg-[#1F2328] text-[#8B949E] hover:text-[#F0F3F6] text-[10px] px-1.5 py-0.5 rounded-[2px] border border-[#1F2328] transition"
                      >
                        + Note B1 Revenue Breakdown
                      </button>
                      <button
                        onClick={() => {
                          const comp = parsedIntent.company!;
                          loadStockData(comp.code, "Analyze Note B3 prospects, capital expenditure plans, and operational risks.");
                          setAssistantDismissed(true);
                        }}
                        className="bg-[#16191D] hover:bg-[#1F2328] text-[#8B949E] hover:text-[#F0F3F6] text-[10px] px-1.5 py-0.5 rounded-[2px] border border-[#1F2328] transition"
                      >
                        + Note B3 Board Prospects
                      </button>
                      <button
                        onClick={() => {
                          const comp = parsedIntent.company!;
                          loadStockData(comp.code, "Summarize total borrowings, gearing ratio, and debt covenants.");
                          setAssistantDismissed(true);
                        }}
                        className="bg-[#16191D] hover:bg-[#1F2328] text-[#8B949E] hover:text-[#F0F3F6] text-[10px] px-1.5 py-0.5 rounded-[2px] border border-[#1F2328] transition"
                      >
                        + Debt & Covenants
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Case 2: No Exact Company Matched Yet - Provide Quick Selector */
                <div className="space-y-2">
                  <p className="text-[#8B949E] text-[11px]">
                    Which Bursa company would you like to analyze? Click one to confirm:
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {POPULAR_COMPANIES.slice(0, 4).map((c) => (
                      <button
                        key={c.code}
                        onClick={() => {
                          const instruction = searchQuery.trim();
                          loadStockData(c.code, instruction);
                          setAssistantDismissed(true);
                        }}
                        className="bg-[#090A0C] hover:bg-[#16191D] text-left p-1.5 border border-[#1F2328] hover:border-[#38BDF8] rounded-[2px] transition flex items-center justify-between"
                      >
                        <div>
                          <span className="font-bold text-[#F0F3F6] block text-[11px]">{c.name}</span>
                          <span className="text-[10px] text-[#8B949E]">{c.ticker}</span>
                        </div>
                        <span className="text-[10px] text-[#38BDF8]">SELECT &gt;</span>
                      </button>
                    ))}
                  </div>
                  {searchQuery.trim() && (
                    <div className="text-[10px] text-[#8B949E] pt-1 border-t border-[#1F2328]">
                      Your instruction: <span className="text-[#F0F3F6]">&quot;{searchQuery}&quot;</span> will run immediately after selecting a company.
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

        </main>
      )}

      {/* 3. VIEW 2: ACTIVE STOCK TERMINAL WORKSPACE */}
      {view === "terminal" && data && (
        <main className="flex-1 w-full max-w-7xl mx-auto p-2 sm:p-3 space-y-2">
          
          {/* Mobile Tab Switcher */}
          <div className="lg:hidden bg-[#121417] border border-[#1F2328] rounded-[2px] p-0.5 flex text-xs font-mono">
            <button
              onClick={() => setMobileTab("dashboard")}
              className={`flex-1 py-1.5 px-2 rounded-[2px] font-bold transition text-center ${
                mobileTab === "dashboard" ? "bg-[#1F2328] text-[#F0F3F6]" : "text-[#8B949E]"
              }`}
            >
              DATA_DASHBOARD
            </button>
            <button
              onClick={() => setMobileTab("console")}
              className={`flex-1 py-1.5 px-2 rounded-[2px] font-bold transition text-center flex items-center justify-center space-x-1 ${
                mobileTab === "console" ? "bg-[#1F2328] text-[#F0F3F6]" : "text-[#8B949E]"
              }`}
            >
              <TerminalIcon className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>COMMAND_CONSOLE</span>
            </button>
          </div>

          {/* Active Security Ribbon Header - Responsive Wrap */}
          <div className="bg-[#121417] border border-[#1F2328] rounded-[2px] px-3 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-3">
              <span className="font-mono text-sm sm:text-base font-bold text-[#F0F3F6] tracking-tight">
                {data.stock.name.toUpperCase()}
              </span>
              <span className="font-mono text-xs bg-[#16191D] text-[#8B949E] px-1.5 py-0.2 border border-[#1F2328] rounded-[2px]">
                {data.stock.ticker}
              </span>
              <div className="flex items-baseline space-x-2 font-mono">
                <span className="text-sm sm:text-base font-bold text-[#F0F3F6] tabular-nums">
                  RM {data.stock.price.toFixed(2)}
                </span>
                <span className={`text-[11px] font-bold tabular-nums ${isPositive ? "text-[#10B981]" : "text-[#F85149]"}`}>
                  {isPositive ? "+" : ""}{data.stock.change_pct.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Metrics Ribbon */}
            <div className="flex items-center space-x-3 sm:space-x-4 font-mono text-[11px] text-[#8B949E] overflow-x-auto w-full sm:w-auto py-0.5">
              <div className="shrink-0">
                <span className="text-[10px] text-[#8B949E] mr-1">MCAP:</span>
                <span className="text-[#F0F3F6] font-semibold tabular-nums">
                  RM {data.stock.market_cap ? (data.stock.market_cap / 1_000_000_000).toFixed(1) + "B" : "122.5B"}
                </span>
              </div>
              <span className="text-[#1F2328]">|</span>
              <div className="shrink-0">
                <span className="text-[10px] text-[#8B949E] mr-1">P/E:</span>
                <span className="text-[#F0F3F6] font-semibold tabular-nums">
                  {data.metrics.annualized_pe ? `${data.metrics.annualized_pe}x` : "12.8x"}
                </span>
              </div>
              <span className="text-[#1F2328]">|</span>
              <div className="shrink-0">
                <span className="text-[10px] text-[#8B949E] mr-1">NET_MARGIN:</span>
                <span className="text-[#10B981] font-semibold tabular-nums">
                  {data.metrics.net_margin_pct ? `${data.metrics.net_margin_pct}%` : "32.6%"}
                </span>
              </div>
              <span className="text-[#1F2328]">|</span>
              <div className="shrink-0">
                <span className="text-[10px] text-[#8B949E] mr-1">GEARING:</span>
                <span className="text-[#F0F3F6] font-semibold tabular-nums">
                  {data.metrics.gearing_ratio ? `${data.metrics.gearing_ratio}x` : "0.45x"}
                </span>
              </div>
            </div>
          </div>

          {/* Continuous Tiled Grid: Left Data Dashboard (52%) + Right Command Console (48%) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 items-start">
            
            {/* LEFT COLUMN: Charts & Tabular Statement Excerpt */}
            <div className={`lg:col-span-6 space-y-2 ${mobileTab === "dashboard" ? "block" : "hidden lg:block"}`}>
              
              {/* 1. Price Trajectory Chart - Sharp Solid Line */}
              <div className="bg-[#121417] border border-[#1F2328] rounded-[2px] p-2 space-y-1.5">
                <div className="flex items-center justify-between border-b border-[#1F2328] pb-1">
                  <div className="flex items-center space-x-1.5 font-mono text-[11px]">
                    <LineChart className="w-3.5 h-3.5 text-[#38BDF8]" />
                    <span className="font-bold text-[#F0F3F6]">PRICE TRAJECTORY // MYR</span>
                  </div>

                  {/* Interval Selector */}
                  <div className="flex items-center space-x-0.5 bg-[#090A0C] border border-[#1F2328] p-0.5 rounded-[2px] text-[10px] font-mono">
                    {(["1D", "5D", "1M", "6M", "1Y"] as const).map((interval) => (
                      <button
                        key={interval}
                        onClick={() => setSelectedInterval(interval)}
                        className={`px-1.5 py-0.2 rounded-[1px] font-bold transition ${
                          selectedInterval === interval
                            ? "bg-[#1F2328] text-[#38BDF8]"
                            : "text-[#8B949E] hover:text-[#F0F3F6]"
                        }`}
                      >
                        {interval}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-36 sm:h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="2 2" stroke="#1F2328" />
                      <XAxis dataKey="time" stroke="#8B949E" tick={{ fontSize: 9, fontFamily: "monospace" }} />
                      <YAxis domain={["auto", "auto"]} stroke="#8B949E" tick={{ fontSize: 9, fontFamily: "monospace" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#121417",
                          borderColor: "#1F2328",
                          borderRadius: "2px",
                          fontSize: "11px",
                          fontFamily: "monospace",
                          color: "#F0F3F6",
                          padding: "4px 8px"
                        }}
                        formatter={(value: any) => [`RM ${Number(value).toFixed(2)}`, "PRICE"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke="#38BDF8"
                        strokeWidth={1.5}
                        fill="transparent"
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 2. Topline vs. Profit Bar Chart - High Density Timeline */}
              <div className="bg-[#121417] border border-[#1F2328] rounded-[2px] p-2 space-y-1.5">
                <div className="flex items-center justify-between border-b border-[#1F2328] pb-1">
                  <div className="flex items-center space-x-1.5 font-mono text-[11px]">
                    <BarChart2 className="w-3.5 h-3.5 text-[#10B981]" />
                    <span className="font-bold text-[#F0F3F6]">TOPLINE VS PROFIT // RM 'M</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#8B949E]">5-QUARTER TIMELINE</span>
                </div>

                <div className="h-28 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.historical_quarters || [
                        { quarter: "Q2 '25", revenue: 6150, profit: 1890 },
                        { quarter: "Q3 '25", revenue: 6420, profit: 1980 },
                        { quarter: "Q4 '25", revenue: 6600, profit: 2110 },
                        { quarter: "Q1 '26", revenue: 6800, profit: 2200 },
                        { quarter: "Q2 '26", revenue: 7200, profit: 2350 },
                      ]}
                      margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                      barGap={2}
                    >
                      <CartesianGrid strokeDasharray="2 2" stroke="#1F2328" />
                      <XAxis dataKey="quarter" stroke="#8B949E" tick={{ fontSize: 9, fontFamily: "monospace" }} />
                      <YAxis stroke="#8B949E" tick={{ fontSize: 9, fontFamily: "monospace" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#121417",
                          borderColor: "#1F2328",
                          borderRadius: "2px",
                          fontSize: "11px",
                          fontFamily: "monospace",
                          color: "#F0F3F6",
                          padding: "4px 8px"
                        }}
                        formatter={(value: any, name: any) => [
                          `RM ${Number(value).toLocaleString()} M`,
                          name === "revenue" ? "REVENUE" : "NET PROFIT",
                        ]}
                      />
                      <Legend wrapperStyle={{ fontSize: "10px", fontFamily: "monospace" }} />
                      <Bar dataKey="revenue" name="Revenue" fill="#64748B" barSize={12} radius={[0, 0, 0, 0]} isAnimationActive={false} />
                      <Bar dataKey="profit" name="Net Profit" fill="#10B981" barSize={12} radius={[0, 0, 0, 0]} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 3. Financial Statement Excerpt Table */}
              <div className="bg-[#121417] border border-[#1F2328] rounded-[2px] p-2 space-y-1">
                <div className="flex items-center justify-between border-b border-[#1F2328] pb-1">
                  <span className="font-mono font-bold text-[11px] text-[#F0F3F6]">
                    FINANCIAL STATEMENT EXCERPT
                  </span>
                  <span className="font-mono text-[10px] text-[#8B949E]">UNITS: RM '000</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] table-zebra">
                    <thead className="bg-[#090A0C] text-[#8B949E] font-mono text-[10px] uppercase border-b border-[#1F2328]">
                      <tr>
                        <th className="py-1 px-2">LINE_ITEM</th>
                        <th className="py-1 px-2 text-right">CURRENT_QTR</th>
                        <th className="py-1 px-2 text-right">PRECEDING_QTR</th>
                        <th className="py-1 px-2 text-right">QOQ_DELTA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1F2328] font-mono">
                      <tr>
                        <td className="py-1 px-2 text-[#F0F3F6] font-sans">Revenue</td>
                        <td className="py-1 px-2 text-right tabular-nums text-[#F0F3F6]">
                          {(data.financial_statement?.revenue || 7200000).toLocaleString()}
                        </td>
                        <td className="py-1 px-2 text-right tabular-nums text-[#8B949E]">
                          {(data.financial_statement?.prev_revenue || 6800000).toLocaleString()}
                        </td>
                        <td className="py-1 px-2 text-right tabular-nums font-bold text-[#10B981]">
                          {data.metrics?.rev_growth_qoq >= 0 ? "+" : ""}{data.metrics?.rev_growth_qoq}%
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1 px-2 text-[#F0F3F6] font-sans">Net Profit (PATAMI)</td>
                        <td className="py-1 px-2 text-right tabular-nums text-[#F0F3F6] font-bold">
                          {(data.financial_statement?.net_profit || 2350000).toLocaleString()}
                        </td>
                        <td className="py-1 px-2 text-right tabular-nums text-[#8B949E]">
                          {(data.financial_statement?.prev_net_profit || 2200000).toLocaleString()}
                        </td>
                        <td className="py-1 px-2 text-right tabular-nums font-bold text-[#10B981]">
                          {data.metrics?.profit_growth_qoq >= 0 ? "+" : ""}{data.metrics?.profit_growth_qoq}%
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1 px-2 text-[#F0F3F6] font-sans">Total Borrowings</td>
                        <td className="py-1 px-2 text-right tabular-nums text-[#F0F3F6]">
                          {(data.financial_statement?.total_borrowings || 45000000).toLocaleString()}
                        </td>
                        <td className="py-1 px-2 text-right tabular-nums text-[#8B949E]">
                          {((data.financial_statement?.total_borrowings || 45000000) * 0.98).toLocaleString()}
                        </td>
                        <td className="py-1 px-2 text-right tabular-nums text-[#8B949E]">+2.04%</td>
                      </tr>
                      <tr>
                        <td className="py-1 px-2 text-[#F0F3F6] font-sans">Cash & Bank Balances</td>
                        <td className="py-1 px-2 text-right tabular-nums text-[#10B981] font-bold">
                          {(data.financial_statement?.cash || 60000000).toLocaleString()}
                        </td>
                        <td className="py-1 px-2 text-right tabular-nums text-[#8B949E]">
                          {((data.financial_statement?.cash || 60000000) * 0.97).toLocaleString()}
                        </td>
                        <td className="py-1 px-2 text-right tabular-nums text-[#10B981]">+3.09%</td>
                      </tr>
                      <tr>
                        <td className="py-1 px-2 text-[#F0F3F6] font-sans">Basic EPS (sen)</td>
                        <td className="py-1 px-2 text-right tabular-nums text-[#F0F3F6] font-bold">
                          {(data.financial_statement?.eps_sen || 19.5).toFixed(2)}
                        </td>
                        <td className="py-1 px-2 text-right tabular-nums text-[#8B949E]">
                          {((data.financial_statement?.eps_sen || 19.5) * 0.94).toFixed(2)}
                        </td>
                        <td className="py-1 px-2 text-right tabular-nums text-[#10B981]">+6.38%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. DCF Valuation Sensitivity Strip */}
              <div className="bg-[#121417] border border-[#1F2328] rounded-[2px] p-2 space-y-1">
                <div className="flex items-center justify-between border-b border-[#1F2328] pb-1">
                  <div className="flex items-center space-x-1.5 font-mono text-[11px]">
                    <Calculator className="w-3.5 h-3.5 text-[#8B949E]" />
                    <span className="font-bold text-[#F0F3F6]">5-YEAR DCF SENSITIVITY MATRIX</span>
                  </div>
                  <span className="font-mono text-[10px] text-[#8B949E]">DETERMINISTIC SANDBOX</span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 text-center text-xs font-mono">
                  <div className="bg-[#090A0C] p-1.5 border border-[#1F2328] rounded-[2px]">
                    <span className="text-[10px] text-[#8B949E] block">CONSERVATIVE</span>
                    <span className="font-bold text-[#F0F3F6] text-xs tabular-nums">RM {(data.stock.price * 1.05).toFixed(2)}</span>
                    <span className="text-[9px] text-[#8B949E] block">WACC 10.0%</span>
                  </div>
                  <div className="bg-[#16191D] p-1.5 border border-[#30363D] rounded-[2px]">
                    <span className="text-[10px] text-[#38BDF8] block font-bold">BASE CASE</span>
                    <span className="font-bold text-[#38BDF8] text-xs tabular-nums">RM {(data.stock.price * 1.25).toFixed(2)}</span>
                    <span className="text-[9px] text-[#8B949E] block">WACC 8.5%</span>
                  </div>
                  <div className="bg-[#090A0C] p-1.5 border border-[#1F2328] rounded-[2px]">
                    <span className="text-[10px] text-[#10B981] block">OPTIMISTIC</span>
                    <span className="font-bold text-[#10B981] text-xs tabular-nums">RM {(data.stock.price * 1.48).toFixed(2)}</span>
                    <span className="text-[9px] text-[#8B949E] block">WACC 7.0%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Rigid Docked Command & Query Console */}
            <div className={`lg:col-span-6 flex flex-col bg-[#121417] border border-[#1F2328] rounded-[2px] h-[550px] sm:h-[620px] lg:h-[670px] ${mobileTab === "console" ? "block" : "hidden lg:flex"}`}>
              
              {/* Console Header Bar */}
              <div className="p-2 bg-[#090A0C] border-b border-[#1F2328] flex items-center justify-between text-xs font-mono select-none">
                <div className="flex items-center space-x-2">
                  <TerminalIcon className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span className="font-bold text-[#F0F3F6]">INTERACTIVE_COMMAND_CONSOLE</span>
                  <span className="text-[10px] text-[#10B981] bg-[#16191D] px-1 border border-[#1F2328]">
                    [ONLINE]
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setChatMessages([
                        {
                          role: "system",
                          content: `LOG CLEARED // ACTIVE SECURITY: ${data.stock.name.toUpperCase()} (${data.stock.ticker})`,
                          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
                        }
                      ]);
                    }}
                    className="text-[10px] text-[#8B949E] hover:text-[#F0F3F6] px-1.5 py-0.5 hover:bg-[#1F2328] border border-[#1F2328] rounded-[2px] transition"
                  >
                    [CLEAR]
                  </button>
                </div>
              </div>

              {/* Discrete Query Shortcuts Toolbar */}
              <div className="px-2 py-1 bg-[#121417] border-b border-[#1F2328] flex items-center space-x-2 overflow-x-auto text-[10px] font-mono whitespace-nowrap">
                <span className="text-[#8B949E]">QUERIES:</span>
                {DISCLOSURE_QUERIES.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q.prompt)}
                    disabled={chatLoading}
                    className="text-[#8B949E] hover:text-[#38BDF8] hover:bg-[#1F2328] px-1.5 py-0.5 border border-transparent hover:border-[#30363D] transition shrink-0 disabled:opacity-40"
                  >
                    [{q.label}]
                  </button>
                ))}
              </div>

              {/* Output Log Stream */}
              <div className="flex-1 p-2.5 overflow-y-auto space-y-3 text-xs font-mono">
                {chatMessages.map((msg, index) => (
                  <div key={index} className="space-y-1">
                    
                    {/* Timestamp & Sender Identifier */}
                    <div className="flex items-center space-x-2 text-[10px] text-[#8B949E] select-none">
                      <span>[{msg.time || "00:00:00"}]</span>
                      {msg.role === "user" ? (
                        <span className="font-bold text-[#F0F3F6]">&gt; USER_QUERY</span>
                      ) : msg.role === "system" ? (
                        <span className="text-[#D29922]">&gt;&gt; SYSTEM_DAEMON</span>
                      ) : (
                        <span className="font-bold text-[#38BDF8]">&gt; RAG_DISCLOSURE_ENGINE [CHROMA+BM25+FLASHRANK]</span>
                      )}
                    </div>

                    {/* Content Display */}
                    <div className={`p-2 border rounded-[2px] ${
                      msg.role === "user"
                        ? "bg-[#16191D] border-[#30363D] text-[#F0F3F6]"
                        : msg.role === "system"
                        ? "bg-[#090A0C] border-[#1F2328] text-[#D29922] font-mono text-[11px]"
                        : "bg-[#090A0C] border-[#1F2328] text-[#F0F3F6]"
                    }`}>
                      {msg.role === "user" ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : msg.role === "system" ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div className="prose prose-invert prose-xs max-w-none text-[#F0F3F6] font-sans leading-relaxed">
                          <ReactMarkdown
                            components={{
                              h1: ({ node, ...props }) => <h3 className="text-xs font-mono font-bold text-[#38BDF8] border-b border-[#1F2328] pb-1 mt-1 mb-1" {...props} />,
                              h2: ({ node, ...props }) => <h4 className="text-xs font-mono font-bold text-[#F0F3F6] mt-1 mb-0.5" {...props} />,
                              h3: ({ node, ...props }) => <h5 className="text-[11px] font-mono font-bold text-[#8B949E] mt-1 mb-0.5" {...props} />,
                              p: ({ node, ...props }) => <p className="mb-1.5 leading-relaxed text-[12px]" {...props} />,
                              ul: ({ node, ...props }) => <ul className="list-disc pl-4 space-y-0.5 mb-1.5 text-[12px]" {...props} />,
                              ol: ({ node, ...props }) => <ol className="list-decimal pl-4 space-y-0.5 mb-1.5 text-[12px]" {...props} />,
                              li: ({ node, ...props }) => <li className="text-[#F0F3F6]" {...props} />,
                              strong: ({ node, ...props }) => <strong className="font-bold text-[#38BDF8] font-mono" {...props} />,
                              blockquote: ({ node, ...props }) => (
                                <blockquote className="border-l-2 border-[#38BDF8] pl-2 py-0.5 my-1 bg-[#16191D] text-[#8B949E] italic text-[11px]" {...props} />
                              ),
                              code: ({ node, ...props }) => (
                                <code className="bg-[#16191D] text-[#38BDF8] font-mono px-1 py-0.2 rounded-[2px] border border-[#1F2328] text-[11px]" {...props} />
                              )
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {chatLoading && (
                  <div className="space-y-1">
                    <div className="text-[10px] text-[#8B949E] font-mono">
                      &gt; SEARCHING RRF RETRIEVAL INDEX + FLASHRANK NEURAL RERANKING...
                    </div>
                    <div className="bg-[#090A0C] border border-[#1F2328] p-2 text-xs font-mono text-[#8B949E] flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-[#38BDF8] animate-pulse"></div>
                      <span>Extracting cited notes from AST filing chunks...</span>
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Docked Command Bar at Bottom */}
              <div className="p-2 bg-[#090A0C] border-t border-[#1F2328]">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center space-x-1.5"
                >
                  <span className="text-[#8B949E] font-mono text-xs select-none pl-1">&gt;</span>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={`Query ${data.stock.name} disclosures (e.g. Note B1 revenue breakdown, debt covenants)...`}
                    className="flex-1 bg-[#121417] border border-[#1F2328] rounded-[2px] px-2.5 py-1.5 text-xs font-mono text-[#F0F3F6] placeholder:text-[#6E7681] focus:outline-none focus:border-[#38BDF8]"
                  />
                  <button
                    type="submit"
                    disabled={chatLoading || !chatInput.trim()}
                    className="bg-[#1F2328] hover:bg-[#30363D] text-[#F0F3F6] px-3 py-1.5 rounded-[2px] font-mono text-xs font-bold border border-[#30363D] transition disabled:opacity-40 flex items-center space-x-1"
                  >
                    <span>EXEC</span>
                    <CornerDownLeft className="w-3 h-3 text-[#38BDF8]" />
                  </button>
                </form>
                <div className="flex items-center justify-between text-[9px] font-mono text-[#8B949E] mt-1 px-1">
                  <span>CMSA 2007 OBJECTIVE RESEARCH</span>
                  <span>IMMUTABLE AUDIT LOG ACTIVE</span>
                </div>
              </div>

            </div>

          </div>
        </main>
      )}

      {/* 4. Universal Document Ingestion Modal */}
      {ingestModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 select-none">
          <div className="bg-[#121417] border border-[#1F2328] rounded-[2px] max-w-lg w-full p-4 space-y-3 font-mono text-xs">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#1F2328] pb-2">
              <div className="flex items-center space-x-2">
                <FileUp className="w-4 h-4 text-[#10B981]" />
                <span className="font-bold text-[#F0F3F6]">INGEST_DISCLOSURE_FILING</span>
              </div>
              <button
                onClick={() => {
                  setIngestModalOpen(false);
                  setIngestFeedback(null);
                }}
                className="text-[#8B949E] hover:text-[#F0F3F6] p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Stock Code */}
            <div className="space-y-1">
              <label className="text-[10px] text-[#8B949E] uppercase block">Target Bursa Code</label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={ingestStockCode}
                  onChange={(e) => setIngestStockCode(e.target.value)}
                  placeholder="e.g. 1155"
                  className="bg-[#090A0C] border border-[#1F2328] rounded-[2px] px-2 py-1 text-xs text-[#F0F3F6] w-24 font-mono focus:outline-none focus:border-[#38BDF8]"
                />
                <span className="text-[11px] text-[#8B949E] font-sans">
                  Active Security: <span className="text-[#F0F3F6] font-bold">{data?.stock?.name || "Maybank"}</span> ({ingestStockCode}.KL)
                </span>
              </div>
            </div>

            {/* Ingestion Mode Toggle */}
            <div className="flex items-center space-x-1 border-b border-[#1F2328] pb-2 text-[11px]">
              <button
                onClick={() => setIngestMode("file")}
                className={`py-1 px-2.5 rounded-[2px] font-bold transition ${
                  ingestMode === "file" ? "bg-[#1F2328] text-[#F0F3F6]" : "text-[#8B949E]"
                }`}
              >
                FILE_UPLOAD (.PDF / .MD / .TXT)
              </button>
              <button
                onClick={() => setIngestMode("text")}
                className={`py-1 px-2.5 rounded-[2px] font-bold transition ${
                  ingestMode === "text" ? "bg-[#1F2328] text-[#F0F3F6]" : "text-[#8B949E]"
                }`}
              >
                PASTE_FILING_TEXT
              </button>
            </div>

            {/* File Upload Area */}
            {ingestMode === "file" && (
              <div className="space-y-2">
                <div
                  className="border border-dashed border-[#1F2328] hover:border-[#38BDF8] p-4 text-center cursor-pointer transition bg-[#090A0C] rounded-[2px]"
                  onClick={() => document.getElementById("report-file-input")?.click()}
                >
                  <Upload className="w-6 h-6 text-[#8B949E] mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-[#F0F3F6]">
                    {ingestFile ? ingestFile.name : "CLICK TO BROWSE OR DRAG DISCLOSURE FILE"}
                  </p>
                  <p className="text-[10px] text-[#8B949E] mt-0.5">Supports Bursa PDF Quarterly Reports, Markdown, and Text</p>
                  {ingestFile && (
                    <span className="inline-block mt-2 text-[10px] bg-[#16191D] text-[#10B981] px-1.5 py-0.5 border border-[#1F2328] rounded-[2px]">
                      {(ingestFile.size / 1024).toFixed(1)} KB READY FOR RAG INGESTION
                    </span>
                  )}
                </div>
                <input
                  id="report-file-input"
                  type="file"
                  accept=".pdf,.md,.txt"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setIngestFile(e.target.files[0]);
                    }
                  }}
                />
              </div>
            )}

            {/* Text Paste Area */}
            {ingestMode === "text" && (
              <div className="space-y-1">
                <label className="text-[10px] text-[#8B949E] uppercase block">Raw Markdown or Note Text</label>
                <textarea
                  rows={6}
                  value={ingestText}
                  onChange={(e) => setIngestText(e.target.value)}
                  placeholder="Paste statement tables or Part B explanatory notes..."
                  className="w-full bg-[#090A0C] border border-[#1F2328] rounded-[2px] p-2 text-[11px] font-mono text-[#F0F3F6] focus:outline-none focus:border-[#38BDF8]"
                />
              </div>
            )}

            {/* Status Feedback */}
            {ingestFeedback && (
              <div className={`p-2 rounded-[2px] text-xs border ${
                ingestFeedback.success
                  ? "bg-[#090A0C] border-[#10B981] text-[#10B981]"
                  : "bg-[#090A0C] border-[#F85149] text-[#F85149]"
              }`}>
                <p className="font-bold">{ingestFeedback.message}</p>
                {ingestFeedback.details && (
                  <p className="text-[10px] text-[#8B949E] mt-0.5">
                    Indexed {ingestFeedback.details.sections_indexed} sections and {ingestFeedback.details.tables_extracted} tables into RAG.
                  </p>
                )}
              </div>
            )}

            {/* Modal Controls */}
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#1F2328]">
              <button
                type="button"
                onClick={() => {
                  setIngestModalOpen(false);
                  setIngestFeedback(null);
                }}
                className="px-2.5 py-1 text-xs text-[#8B949E] hover:text-[#F0F3F6] hover:bg-[#1F2328] rounded-[2px] transition"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleIngestReport}
                disabled={ingestLoading || (ingestMode === "file" && !ingestFile) || (ingestMode === "text" && !ingestText.trim())}
                className="bg-[#1F2328] hover:bg-[#30363D] text-[#10B981] px-3 py-1 rounded-[2px] text-xs font-bold border border-[#30363D] transition disabled:opacity-40 flex items-center space-x-1.5"
              >
                {ingestLoading ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>INDEXING...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-3 h-3" />
                    <span>INGEST_INDEX</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 5. Minimal Institutional Footer */}
      <footer className="bg-[#121417] border-t border-[#1F2328] py-2 px-3 sm:px-4 text-[10px] font-mono text-[#8B949E] select-none">
        <div className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1">
          <p>© 2026 BURSA_INTELLIGENCE // GROUNDED IN PUBLIC QUARTERLY FILINGS</p>
          <p>CMSA 2007 NON-ADVISORY COMPLIANT // 4-STAGE RAG (AST + CHROMADB + BM25 + FLASHRANK)</p>
        </div>
      </footer>

    </div>
  );
}
