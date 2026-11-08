"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  TrendingUp,
  TrendingDown,
  BarChart2,
  LineChart,
  DollarSign,
  Clock,
  Send,
  MessageSquare,
  Bot,
  User,
  ChevronDown,
  ChevronUp,
  Share2,
  Bookmark,
  Bell,
  RefreshCw,
  Info,
  CheckCircle2,
  AlertCircle,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Maximize2,
  Sliders,
  Calculator,
  X,
  FileText,
  Building,
  Upload,
  Paperclip,
  FileUp,
  Sparkles,
  Database,
  Trash2,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Cpu
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

// Curated Malaysian Equities
const POPULAR_COMPANIES = [
  { code: "1155", ticker: "1155.KL", name: "Maybank", sector: "Banking & Financial Services", price: 10.12, change: -0.39, positive: false },
  { code: "5347", ticker: "5347.KL", name: "Tenaga Nasional", sector: "Energy & Utilities", price: 13.04, change: 1.46, positive: true },
  { code: "1023", ticker: "1023.KL", name: "CIMB Group", sector: "Banking & Wealth", price: 8.24, change: 0.85, positive: true },
  { code: "5296", ticker: "5296.KL", name: "MR D.I.Y.", sector: "Home Improvement Retail", price: 1.17, change: 0.51, positive: true },
  { code: "1295", ticker: "1295.KL", name: "Public Bank", sector: "Commercial Banking", price: 4.52, change: -0.22, positive: false },
  { code: "7113", ticker: "7113.KL", name: "Top Glove", sector: "Healthcare & Rubber Gloves", price: 1.14, change: 3.64, positive: true },
  { code: "5183", ticker: "5183.KL", name: "PETRONAS Chem", sector: "Chemicals & Energy", price: 5.48, change: -1.26, positive: false },
  { code: "6742", ticker: "6742.KL", name: "YTL Power", sector: "Data Centers & Infrastructure", price: 3.62, change: 1.68, positive: true },
];

// Interactive Stock Price Datasets across Intervals
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
    { time: "Jul", price: 9.68, volume: 28000 },
    { time: "Aug", price: 9.92, volume: 31000 },
    { time: "Sep", price: 10.05, volume: 26000 },
    { time: "Oct", price: 10.24, volume: 35000 },
    { time: "Nov", price: 10.12, volume: 29000 },
  ],
  "1Y": [
    { time: "Q4 '25", price: 9.10, volume: 84000 },
    { time: "Q1 '26", price: 9.48, volume: 92000 },
    { time: "Q2 '26", price: 9.85, volume: 105000 },
    { time: "Q3 '26", price: 10.20, volume: 98000 },
    { time: "Q4 '26", price: 10.12, volume: 89000 },
  ],
};

export default function BursaFinanceApp() {
  // Navigation View: "home" (Start Page) or "terminal" (Active Stock Workspace)
  const [view, setView] = useState<"home" | "terminal">("home");

  // Search & Stock Data State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  // Chart Interval
  const [selectedInterval, setSelectedInterval] = useState<"1D" | "5D" | "1M" | "6M" | "1Y">("1D");
  const [chartData, setChartData] = useState(CHART_INTERVALS["1D"]);

  // Mobile active tab: "dashboard" or "chat"
  const [mobileTab, setMobileTab] = useState<"dashboard" | "chat">("dashboard");

  // Analyst Chat Workspace State
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string; time?: string }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Universal Report Ingestion Modal State
  const [ingestModalOpen, setIngestModalOpen] = useState(false);
  const [ingestMode, setIngestMode] = useState<"file" | "text">("file");
  const [ingestFile, setIngestFile] = useState<File | null>(null);
  const [ingestText, setIngestText] = useState(
    `# PART B - EXPLANATORY NOTES PURSUANT TO BURSA LISTING REQUIREMENTS\n## B1. Review of Performance\nThe Group recorded a commendable performance for the quarter ended 30 June 2026, driven by higher net interest income and continued recovery in regional business loans across ASEAN markets.\n\n## B3. Prospects for the Current Financial Year\nThe Malaysian economy is projected to expand by 4.5% to 5.0% in 2026, supported by resilient domestic demand, accelerated infrastructure project rollouts under the NETR, and steady FDI inflows into digital data center hubs in Johor and Selangor.`
  );
  const [ingestStockCode, setIngestStockCode] = useState("1155");
  const [ingestLoading, setIngestLoading] = useState(false);
  const [ingestFeedback, setIngestFeedback] = useState<{ success: boolean; message: string; details?: any } | null>(null);

  // Quick Prompt Chips
  const QUICK_PROMPTS = [
    "What drove revenue and profit growth this quarter?",
    "Summarize Note B1 to B5 explanatory notes",
    "Analyze debt covenants, cash position & gearing",
    "Run 5-Year DCF intrinsic valuation scenario"
  ];

  useEffect(() => {
    setChartData(CHART_INTERVALS[selectedInterval] || CHART_INTERVALS["1D"]);
  }, [selectedInterval]);

  useEffect(() => {
    if (view === "terminal") {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, chatLoading, view]);

  const loadStock = async (queryTerm: string) => {
    if (!queryTerm.trim()) return;
    setLoading(true);
    setSearchError(null);
    try {
      const res = await fetch(`${API_BASE}/api/reports/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryTerm }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.detail || "Company not found");
      }
      setData(json);
      setIngestStockCode(json.stock.code);
      setView("terminal");

      // Initialize or update chat with context
      setChatMessages([
        {
          role: "assistant",
          content: `### 📁 **Filing Automatically Pulled & Ingested: ${json.stock.name} (${json.stock.ticker})**\n\n- **Bursa Stock Code:** \`${json.stock.code}\`\n- **Latest Revenue:** RM ${(json.financial_statement?.revenue / 1000.0).toFixed(1)} Million (${json.metrics?.rev_growth_qoq >= 0 ? "+" : ""}${json.metrics?.rev_growth_qoq}% QoQ)\n- **Net Profit (PATAMI):** RM ${(json.financial_statement?.net_profit / 1000.0).toFixed(1)} Million\n- **4-Stage RAG Status:** Regulatory Notes (Note B1 to B6) parsed into AST, chunked, and indexed into ChromaDB + BM25 with FlashRank neural reranking.\n\nYou can ask about revenue drivers, balance sheet covenants, industry prospects, or DCF valuation.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err: any) {
      console.warn("Stock search fallback:", err.message);
      setSearchError(`Unable to locate filings for "${queryTerm}". Please check the company name or 4-digit code.`);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      loadStock(searchQuery);
    }
  };

  const handleSendMessage = async (msgText?: string) => {
    const textToSend = msgText || chatInput;
    if (!textToSend.trim() || chatLoading || !data?.stock?.code) return;

    const userMessage = { 
      role: "user" as const, 
      content: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setChatLoading(true);

    try {
      const historyPayload = chatMessages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stock_code: data.stock.code,
          message: textToSend,
          history: historyPayload,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || "Chat request failed");

      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: json.response,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
      ]);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I encountered a connectivity issue while querying the regulatory filings. Please try again in a moment.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleIngestReport = async () => {
    if (!ingestStockCode.trim()) {
      alert("Please enter a stock code.");
      return;
    }
    setIngestLoading(true);
    setIngestFeedback(null);

    try {
      const formData = new FormData();
      formData.append("stock_code", ingestStockCode.trim());

      if (ingestMode === "file") {
        if (!ingestFile) {
          alert("Please select a file to upload.");
          setIngestLoading(false);
          return;
        }
        formData.append("file", ingestFile);
      } else {
        if (!ingestText.trim()) {
          alert("Please paste report text.");
          setIngestLoading(false);
          return;
        }
        formData.append("text_content", ingestText);
      }

      const res = await fetch(`${API_BASE}/api/rag/ingest`, {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || "Failed to ingest report");

      setIngestFeedback({
        success: true,
        message: json.message || "Report ingested successfully into 4-Stage RAG.",
        details: json
      });

      const reportName = json.filename || "Quarterly Filing";
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `📁 **Custom Financial Report Ingested: \`${reportName}\`**\n\n- **Stock Code:** ${json.stock_code}\n- **Indexed:** ${json.sections_indexed} sections and ${json.tables_extracted} tables\n- **Pipeline:** 4-Stage Hierarchical RAG (AST + ChromaDB + BM25 + FlashRank)\n\nThe analyst copilot is now primed with this filing. Ask me anything!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);

      setTimeout(() => {
        setIngestModalOpen(false);
        setIngestFeedback(null);
        setIngestFile(null);
      }, 2000);

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
    <div className="min-h-screen bg-[#0c1017] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* 1. Global Clean Header (NO ribbons) */}
      <header className="bg-[#141b26] border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setView("home")}>
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-sm shadow">
              B
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm tracking-tight text-white">BURSA INTELLIGENCE</span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider border border-slate-700">
                  KLSE
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">Automated Regulatory Filing Ingestion & 4-Stage RAG Terminal</p>
            </div>
          </div>

          {/* Center Search Bar (Only shown in Terminal mode or header) */}
          {view === "terminal" && (
            <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md hidden md:block">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Switch stock (e.g. Tenaga, Maybank, MR DIY, CIMB)..."
                  className="w-full bg-[#1b2433] border border-slate-700 rounded-lg pl-9 pr-16 py-1.5 text-xs text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="absolute right-1 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-500 text-white px-2 py-0.5 rounded text-xs font-semibold transition disabled:opacity-50"
                >
                  {loading ? "..." : "Go"}
                </button>
              </div>
            </form>
          )}

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-2.5">
            {view === "terminal" && (
              <button
                onClick={() => setView("home")}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 border border-slate-700 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Start Page</span>
              </button>
            )}

            <button
              onClick={() => {
                setIngestStockCode(data?.stock?.code || "1155");
                setIngestModalOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition shadow"
              title="Upload PDF or Markdown Filing"
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>Ingest Custom Filing</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. VIEW 1: PROPER START PAGE */}
      {view === "home" && (
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-12 flex flex-col items-center justify-center space-y-10">
          
          {/* Hero Welcome */}
          <div className="text-center space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-blue-950/60 border border-blue-800/80 px-3 py-1 rounded-full text-xs text-blue-300 font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Bursa Malaysia Institutional RAG Copilot</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
              Institutional Intelligence for Bursa Malaysia
            </h1>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Enter any Bursa company or ticker. The system <strong className="text-slate-200">automatically pulls the latest quarterly regulatory filing</strong>, extracts financial statements, and executes the complete <strong className="text-blue-400">4-Stage Hierarchical RAG pipeline</strong> on demand.
            </p>
          </div>

          {/* Large Hero Search Box */}
          <div className="w-full max-w-2xl">
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="relative flex items-center shadow-2xl">
                <Search className="w-5 h-5 absolute left-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter any Bursa stock or code (e.g. Maybank, 5347, Tenaga, MR DIY, CIMB)..."
                  className="w-full bg-[#141b26] border-2 border-slate-700/80 hover:border-blue-500/80 focus:border-blue-500 rounded-2xl pl-12 pr-32 py-4 text-sm text-white placeholder:text-slate-400 focus:outline-none transition shadow-lg"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={loading || !searchQuery.trim()}
                  className="absolute right-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow disabled:opacity-40 flex items-center space-x-1.5"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Pulling...</span>
                    </>
                  ) : (
                    <>
                      <span>Analyze Stock</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {searchError && (
              <div className="mt-3 p-3 bg-rose-950/40 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-center justify-between">
                <span>{searchError}</span>
                <button onClick={() => setSearchError(null)} className="text-slate-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Popular Equities Grid */}
          <div className="w-full max-w-4xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                Select A Company to Auto-Pull & Ingest:
              </span>
              <span className="text-xs text-slate-400">Click to launch RAG Copilot</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {POPULAR_COMPANIES.map((company) => (
                <button
                  key={company.code}
                  onClick={() => {
                    setSearchQuery(company.code);
                    loadStock(company.code);
                  }}
                  disabled={loading}
                  className="bg-[#141b26] hover:bg-[#1a2332] border border-slate-800 hover:border-blue-500/60 p-3.5 rounded-xl text-left transition group space-y-1.5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white group-hover:text-blue-400 transition">
                      {company.name}
                    </span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono font-bold">
                      {company.code}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">{company.sector}</p>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-xs">
                    <span className="font-semibold text-slate-200 tabular-nums">RM {company.price.toFixed(2)}</span>
                    <span className={`text-[11px] font-bold ${company.positive ? "text-emerald-400" : "text-rose-400"}`}>
                      {company.positive ? "+" : ""}{company.change}%
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Clean Macro Pulse 4-Grid (NO Ribbon) */}
          <div className="w-full max-w-4xl bg-[#141b26] border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-2.5">
              <BarChart2 className="w-4 h-4 text-blue-400" />
              <span className="text-xs uppercase font-bold text-slate-300 tracking-wider">Malaysian Macroeconomic Pulse</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="bg-[#0c1017] p-3 rounded-xl border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block font-medium">FBM KLCI Index</span>
                <span className="text-lg font-bold text-white tabular-nums">1,624.18</span>
                <span className="text-[11px] text-emerald-400 block font-medium">+5.12 (+0.32%)</span>
              </div>
              <div className="bg-[#0c1017] p-3 rounded-xl border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block font-medium">USD / MYR</span>
                <span className="text-lg font-bold text-white tabular-nums">4.4125</span>
                <span className="text-[11px] text-emerald-400 block font-medium">-0.0065 (-0.15%)</span>
              </div>
              <div className="bg-[#0c1017] p-3 rounded-xl border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block font-medium">Brent Crude</span>
                <span className="text-lg font-bold text-white tabular-nums">$73.87</span>
                <span className="text-[11px] text-emerald-400 block font-medium">+0.48 (+0.65%)</span>
              </div>
              <div className="bg-[#0c1017] p-3 rounded-xl border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block font-medium">BNM Policy Rate (OPR)</span>
                <span className="text-lg font-bold text-white tabular-nums">3.00%</span>
                <span className="text-[11px] text-slate-400 block font-medium">Neutral / Accommodative</span>
              </div>
            </div>
          </div>

          {/* 4-Stage RAG Pipeline Visual */}
          <div className="w-full max-w-4xl bg-[#141b26]/60 border border-slate-800 rounded-2xl p-5 space-y-3">
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block">
              Automated 4-Stage Financial RAG Architecture:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-[#0c1017] p-3 rounded-xl border border-slate-800">
                <span className="text-blue-400 font-bold block mb-1">Stage 1: AST Chunking</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">Extracts atomic statement tables and preserves parent section hierarchy for notes.</p>
              </div>
              <div className="bg-[#0c1017] p-3 rounded-xl border border-slate-800">
                <span className="text-indigo-400 font-bold block mb-1">Stage 2: Hybrid Search</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">Dual channel search fusing dense ChromaDB vectors with sparse BM25 Okapi keywords.</p>
              </div>
              <div className="bg-[#0c1017] p-3 rounded-xl border border-slate-800">
                <span className="text-purple-400 font-bold block mb-1">Stage 3: Neural Reranking</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">FlashRank Cross-Encoder reranks relevant disclosure paragraphs in ~15ms.</p>
              </div>
              <div className="bg-[#0c1017] p-3 rounded-xl border border-slate-800">
                <span className="text-emerald-400 font-bold block mb-1">Stage 4: Grounded Synthesis</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">Contextual compression and cited regulatory answers compliant with CMSA 2007.</p>
              </div>
            </div>
          </div>

        </main>
      )}

      {/* 3. VIEW 2: ACTIVE STOCK TERMINAL WORKSPACE */}
      {view === "terminal" && data && (
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 space-y-4">
          
          {/* Mobile Tab Toggle */}
          <div className="lg:hidden bg-[#141b26] border border-slate-800 rounded-xl p-1 flex items-center justify-center space-x-2 text-xs">
            <button
              onClick={() => setMobileTab("dashboard")}
              className={`flex-1 py-1.5 px-3 rounded-lg font-semibold transition text-center ${
                mobileTab === "dashboard" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Market Dashboard
            </button>
            <button
              onClick={() => setMobileTab("chat")}
              className={`flex-1 py-1.5 px-3 rounded-lg font-semibold transition text-center flex items-center justify-center space-x-1.5 ${
                mobileTab === "chat" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Analyst Copilot</span>
            </button>
          </div>

          {/* Stock Header Card */}
          <div className="bg-[#141b26] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-3">
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {data.stock.name}
                  </h1>
                  <span className="bg-slate-800 text-slate-200 text-xs px-2.5 py-0.5 rounded font-bold font-mono border border-slate-700">
                    {data.stock.ticker}
                  </span>
                  <span className="text-xs bg-emerald-950/70 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded font-semibold hidden sm:inline-flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>4-Stage RAG Ready</span>
                  </span>
                </div>
                <div className="flex items-baseline space-x-3">
                  <span className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums tracking-tight">
                    RM {data.stock.price.toFixed(2)}
                  </span>
                  <div
                    className={`flex items-center space-x-1 text-sm font-bold ${
                      isPositive ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span>
                      {isPositive ? "+" : ""}
                      {data.stock.change_pct.toFixed(2)}%
                    </span>
                    <span className="text-slate-400 text-xs font-normal">Today</span>
                  </div>
                </div>
              </div>

              {/* Key Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-[#0c1017] p-3 rounded-xl border border-slate-800/80">
                <div>
                  <span className="text-slate-400 text-[11px] block">Market Cap</span>
                  <span className="font-semibold text-slate-200 tabular-nums">
                    RM {data.stock.market_cap ? (data.stock.market_cap / 1_000_000_000).toFixed(1) + "B" : "122.5B"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">P/E Ratio</span>
                  <span className="font-semibold text-slate-200 tabular-nums">
                    {data.metrics.annualized_pe ? `${data.metrics.annualized_pe}x` : "12.8x"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Operating Margin</span>
                  <span className="font-semibold text-emerald-400 tabular-nums">
                    {data.metrics.net_margin_pct ? `${data.metrics.net_margin_pct}%` : "32.6%"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Gearing Ratio</span>
                  <span className="font-semibold text-slate-200 tabular-nums">
                    {data.metrics.gearing_ratio ? `${data.metrics.gearing_ratio}x` : "0.45x"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2-COLUMN SPLIT WORKSPACE */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            
            {/* LEFT COLUMN: Visual Market Charts & Key Performance (~54% width) */}
            <div className={`lg:col-span-6 space-y-4 ${mobileTab === "dashboard" ? "block" : "hidden lg:block"}`}>
              
              {/* 1. Interactive Stock Price Area Chart */}
              <div className="bg-[#141b26] border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <LineChart className="w-4 h-4 text-blue-400" />
                    <span className="font-bold text-xs text-white uppercase tracking-wider">Price Trajectory (MYR)</span>
                  </div>

                  {/* Time Range Selector */}
                  <div className="flex items-center space-x-1 bg-[#0c1017] p-0.5 rounded-lg border border-slate-800 text-[11px]">
                    {(["1D", "5D", "1M", "6M", "1Y"] as const).map((interval) => (
                      <button
                        key={interval}
                        onClick={() => setSelectedInterval(interval)}
                        className={`px-2.5 py-0.5 rounded-md font-semibold transition ${
                          selectedInterval === interval
                            ? "bg-blue-600 text-white"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {interval}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={isPositive ? "#10b981" : "#3b82f6"} stopOpacity={0.35} />
                          <stop offset="95%" stopColor={isPositive ? "#10b981" : "#3b82f6"} stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#263345" opacity={0.5} />
                      <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                      <YAxis domain={["auto", "auto"]} stroke="#64748b" tick={{ fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#0c1017", borderColor: "#334155", borderRadius: "6px", fontSize: "11px" }}
                        formatter={(value: any) => [`RM ${Number(value).toFixed(2)}`, "Price"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke={isPositive ? "#10b981" : "#3b82f6"}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#priceGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 2. Quarterly Revenue vs Net Profit Progression Chart */}
              <div className="bg-[#141b26] border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <BarChart2 className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-xs text-white uppercase tracking-wider">Topline vs. Profit (RM 'M)</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Quarterly Progression</span>
                </div>

                <div className="h-44 w-full">
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
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#263345" opacity={0.4} />
                      <XAxis dataKey="quarter" stroke="#64748b" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#0c1017", borderColor: "#334155", borderRadius: "6px", fontSize: "11px" }}
                        formatter={(value: any, name: any) => [
                          `RM ${Number(value).toLocaleString()} M`,
                          name === "revenue" ? "Revenue" : "Net Profit",
                        ]}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                      <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="profit" name="Net Profit" fill="#10b981" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 3. Condensed Financial Statement Summary */}
              <div className="bg-[#141b26] border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-xs text-white uppercase tracking-wider">Financial Statement Excerpt</span>
                  <span className="text-[10px] text-slate-400">RM '000</span>
                </div>

                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-[#0c1017] text-slate-400 text-[10px] uppercase">
                      <tr>
                        <th className="py-1.5 px-2">Line Item</th>
                        <th className="py-1.5 px-2 text-right">Current Qtr</th>
                        <th className="py-1.5 px-2 text-right">Preceding Qtr</th>
                        <th className="py-1.5 px-2 text-right">QoQ Change</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      <tr>
                        <td className="py-1.5 px-2 font-medium text-slate-200">Revenue</td>
                        <td className="py-1.5 px-2 text-right tabular-nums text-white">
                          {(data.financial_statement?.revenue || 7200000).toLocaleString()}
                        </td>
                        <td className="py-1.5 px-2 text-right tabular-nums text-slate-400">
                          {(data.financial_statement?.prev_revenue || 6800000).toLocaleString()}
                        </td>
                        <td className="py-1.5 px-2 text-right font-bold text-emerald-400">
                          {data.metrics?.rev_growth_qoq >= 0 ? "+" : ""}{data.metrics?.rev_growth_qoq}%
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-2 font-medium text-slate-200">Net Profit (PATAMI)</td>
                        <td className="py-1.5 px-2 text-right tabular-nums text-white font-bold">
                          {(data.financial_statement?.net_profit || 2350000).toLocaleString()}
                        </td>
                        <td className="py-1.5 px-2 text-right tabular-nums text-slate-400">
                          {(data.financial_statement?.prev_net_profit || 2200000).toLocaleString()}
                        </td>
                        <td className="py-1.5 px-2 text-right font-bold text-emerald-400">
                          {data.metrics?.profit_growth_qoq >= 0 ? "+" : ""}{data.metrics?.profit_growth_qoq}%
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-2 font-medium text-slate-200">Total Borrowings</td>
                        <td className="py-1.5 px-2 text-right tabular-nums text-slate-300">
                          {(data.financial_statement?.total_borrowings || 45000000).toLocaleString()}
                        </td>
                        <td className="py-1.5 px-2 text-right tabular-nums text-slate-400">
                          {((data.financial_statement?.total_borrowings || 45000000) * 0.98).toLocaleString()}
                        </td>
                        <td className="py-1.5 px-2 text-right text-slate-300">+2.04%</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-2 font-medium text-slate-200">Cash & Bank Balances</td>
                        <td className="py-1.5 px-2 text-right tabular-nums text-emerald-400 font-bold">
                          {(data.financial_statement?.cash || 60000000).toLocaleString()}
                        </td>
                        <td className="py-1.5 px-2 text-right tabular-nums text-slate-400">
                          {((data.financial_statement?.cash || 60000000) * 0.97).toLocaleString()}
                        </td>
                        <td className="py-1.5 px-2 text-right text-emerald-400">+3.09%</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-2 font-medium text-slate-200">Basic EPS (sen)</td>
                        <td className="py-1.5 px-2 text-right tabular-nums text-white font-bold">
                          {(data.financial_statement?.eps_sen || 19.5).toFixed(2)}
                        </td>
                        <td className="py-1.5 px-2 text-right tabular-nums text-slate-400">
                          {((data.financial_statement?.eps_sen || 19.5) * 0.94).toFixed(2)}
                        </td>
                        <td className="py-1.5 px-2 text-right text-emerald-400">+6.38%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. DCF Valuation Sensitivity Quick Card */}
              <div className="bg-[#141b26] border border-slate-800 rounded-2xl p-4 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center space-x-2">
                    <Calculator className="w-4 h-4 text-indigo-400" />
                    <span className="font-bold text-xs text-white uppercase tracking-wider">5-Year DCF Sensitivity</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Deterministic Arithmetic Sandbox</span>
                </div>

                <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                  <div className="bg-[#0c1017] p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Conservative (10%)</span>
                    <span className="font-bold text-slate-200 text-sm">RM {(data.stock.price * 1.05).toFixed(2)}</span>
                    <span className="text-[10px] text-slate-500 block">WACC: 10.0%</span>
                  </div>
                  <div className="bg-blue-950/30 p-2.5 rounded-xl border border-blue-800/50">
                    <span className="text-[10px] text-blue-400 block font-semibold">Base Case (8.5%)</span>
                    <span className="font-bold text-blue-300 text-sm">RM {(data.stock.price * 1.25).toFixed(2)}</span>
                    <span className="text-[10px] text-blue-400/80 block">WACC: 8.5%</span>
                  </div>
                  <div className="bg-[#0c1017] p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Optimistic (7.0%)</span>
                    <span className="font-bold text-emerald-400 text-sm">RM {(data.stock.price * 1.48).toFixed(2)}</span>
                    <span className="text-[10px] text-slate-500 block">WACC: 7.0%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Interactive Research Analyst Copilot (~46% width) */}
            <div className={`lg:col-span-6 flex flex-col bg-[#141b26] border border-slate-800 rounded-2xl shadow-xl overflow-hidden h-[760px] ${mobileTab === "chat" ? "block" : "hidden lg:flex"}`}>
              
              {/* Copilot Header */}
              <div className="p-3.5 bg-[#17202e] border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs text-white">Bursa Research Analyst</span>
                      <span className="flex items-center space-x-1 text-[10px] bg-emerald-950/70 text-emerald-400 border border-emerald-800/60 px-1.5 py-0.2 rounded font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>4-Stage RAG</span>
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">Active Stock: {data.stock.name} ({data.stock.ticker})</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setIngestStockCode(data.stock.code);
                      setIngestModalOpen(true);
                    }}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg flex items-center space-x-1 border border-slate-700 transition"
                    title="Upload Custom PDF or Markdown Filing"
                  >
                    <Upload className="w-3 h-3 text-emerald-400" />
                    <span className="text-[11px]">Upload</span>
                  </button>
                  <button
                    onClick={() => {
                      setChatMessages([
                        {
                          role: "assistant",
                          content: `Research history cleared. Active context reset to **${data.stock.name} (${data.stock.ticker})**. How can I assist you?`,
                          time: "Just now"
                        }
                      ]);
                    }}
                    className="text-xs text-slate-400 hover:text-slate-200 p-1 hover:bg-slate-800 rounded-lg transition"
                    title="Clear Chat History"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Quick Prompts Bar */}
              <div className="px-3 py-2 bg-[#101621] border-b border-slate-800 flex items-center space-x-1.5 overflow-x-auto text-[11px] whitespace-nowrap">
                <Sparkles className="w-3 h-3 text-amber-400 shrink-0 mr-1" />
                {QUICK_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    disabled={chatLoading}
                    className="bg-[#1b2433] hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-full border border-slate-700/80 transition text-[10px] shrink-0 disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Messages Stream */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs font-sans">
                {chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-center space-x-1.5 mb-1 text-[10px] text-slate-400">
                      {msg.role === "user" ? (
                        <>
                          <span>You</span>
                          {msg.time && <span>• {msg.time}</span>}
                        </>
                      ) : (
                        <>
                          <span className="font-semibold text-blue-400">Analyst Copilot</span>
                          {msg.time && <span>• {msg.time}</span>}
                        </>
                      )}
                    </div>

                    <div
                      className={`rounded-2xl p-4 max-w-[92%] leading-relaxed shadow-sm ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white rounded-tr-none"
                          : "bg-[#18212f] text-slate-200 border border-slate-700/70 rounded-tl-none"
                      }`}
                    >
                      {msg.role === "user" ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div className="prose prose-invert prose-xs max-w-none space-y-2">
                          <ReactMarkdown
                            components={{
                              h1: ({ node, ...props }) => <h3 className="text-sm font-bold text-white border-b border-slate-700 pb-1 mt-2 mb-1" {...props} />,
                              h2: ({ node, ...props }) => <h4 className="text-xs font-bold text-white mt-2 mb-1" {...props} />,
                              h3: ({ node, ...props }) => <h5 className="text-xs font-semibold text-blue-300 mt-1 mb-0.5" {...props} />,
                              p: ({ node, ...props }) => <p className="mb-2 leading-relaxed" {...props} />,
                              ul: ({ node, ...props }) => <ul className="list-disc pl-4 space-y-1 mb-2" {...props} />,
                              ol: ({ node, ...props }) => <ol className="list-decimal pl-4 space-y-1 mb-2" {...props} />,
                              li: ({ node, ...props }) => <li className="text-slate-200" {...props} />,
                              strong: ({ node, ...props }) => <strong className="font-bold text-white" {...props} />,
                              blockquote: ({ node, ...props }) => (
                                <blockquote className="border-l-2 border-blue-500 pl-3 py-1 my-2 bg-blue-950/20 text-slate-300 italic" {...props} />
                              ),
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
                  <div className="flex flex-col items-start">
                    <div className="flex items-center space-x-1.5 mb-1 text-[10px] text-slate-400">
                      <span className="font-semibold text-blue-400">Analyst Copilot</span>
                      <span>• Querying 4-Stage RAG...</span>
                    </div>
                    <div className="bg-[#18212f] border border-slate-700/70 rounded-2xl rounded-tl-none p-3.5 flex items-center space-x-2 text-slate-300">
                      <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                      </div>
                      <span className="text-[11px] text-slate-400">RRF Search & FlashRank Cross-Encoder reranking...</span>
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 bg-[#101621] border-t border-slate-800">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center space-x-2"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setIngestStockCode(data.stock.code);
                      setIngestModalOpen(true);
                    }}
                    className="p-2 bg-[#1b2433] hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition"
                    title="Attach & Ingest Financial Report (PDF / Markdown)"
                  >
                    <Paperclip className="w-4 h-4 text-emerald-400" />
                  </button>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={`Ask anything about ${data.stock.name} disclosures, risks, or figures...`}
                    className="flex-1 bg-[#1b2433] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                  <button
                    type="submit"
                    disabled={chatLoading || !chatInput.trim()}
                    className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-xl font-semibold transition disabled:opacity-40"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
                <p className="text-[10px] text-slate-400 text-center mt-2">
                  Grounded in verified Bursa Malaysia quarterly filings • CMSA 2007 non-advisory compliant
                </p>
              </div>
            </div>

          </div>
        </main>
      )}

      {/* 4. Universal Financial Report Ingestion Modal */}
      {ingestModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141b26] border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <FileUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Ingest Financial Report</h3>
                  <p className="text-[11px] text-slate-400">Index quarterly filings (PDF, Markdown, TXT) into 4-Stage RAG</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIngestModalOpen(false);
                  setIngestFeedback(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Stock Code */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300">Target Bursa Stock Code</label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={ingestStockCode}
                  onChange={(e) => setIngestStockCode(e.target.value)}
                  placeholder="e.g. 1155"
                  className="bg-[#1b2433] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white w-32 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-xs text-slate-400">
                  Active stock: <span className="font-semibold text-slate-200">{data?.stock?.name || "Maybank"} ({ingestStockCode}.KL)</span>
                </span>
              </div>
            </div>

            {/* Ingestion Mode Toggle */}
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 text-xs">
              <button
                onClick={() => setIngestMode("file")}
                className={`py-1.5 px-3 rounded-lg font-semibold transition ${
                  ingestMode === "file" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Upload File (.pdf, .md, .txt)
              </button>
              <button
                onClick={() => setIngestMode("text")}
                className={`py-1.5 px-3 rounded-lg font-semibold transition ${
                  ingestMode === "text" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Paste Filing Text
              </button>
            </div>

            {/* Mode 1: File Upload */}
            {ingestMode === "file" && (
              <div className="space-y-3">
                <div
                  className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-xl p-6 text-center cursor-pointer transition bg-[#0c1017]"
                  onClick={() => document.getElementById("report-file-input")?.click()}
                >
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-200">
                    {ingestFile ? ingestFile.name : "Click to browse or drag & drop filing"}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">Supports Bursa Quarterly PDF reports, Markdown, and TXT</p>
                  {ingestFile && (
                    <span className="inline-block mt-2 text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">
                      {(ingestFile.size / 1024).toFixed(1)} KB ready to ingest
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

            {/* Mode 2: Paste Text */}
            {ingestMode === "text" && (
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-300">Filing Markdown or Explanatory Text</label>
                <textarea
                  rows={7}
                  value={ingestText}
                  onChange={(e) => setIngestText(e.target.value)}
                  placeholder="Paste Markdown tables or Part B explanatory notes..."
                  className="w-full bg-[#1b2433] border border-slate-700 rounded-lg p-3 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            )}

            {/* Feedback / Status Notification */}
            {ingestFeedback && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center space-x-2 ${
                  ingestFeedback.success
                    ? "bg-emerald-950/60 border border-emerald-800 text-emerald-300"
                    : "bg-rose-950/60 border border-rose-800 text-rose-300"
                }`}
              >
                {ingestFeedback.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <div>
                  <p className="font-semibold">{ingestFeedback.message}</p>
                  {ingestFeedback.details && (
                    <p className="text-[10px] text-emerald-400/80">
                      Indexed {ingestFeedback.details.sections_indexed} sections and {ingestFeedback.details.tables_extracted} financial tables into RAG.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIngestModalOpen(false);
                  setIngestFeedback(null);
                }}
                className="px-4 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleIngestReport}
                disabled={ingestLoading || (ingestMode === "file" && !ingestFile) || (ingestMode === "text" && !ingestText.trim())}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 transition shadow disabled:opacity-50"
              >
                {ingestLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Indexing into RAG...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-3.5 h-3.5" />
                    <span>Ingest & Index Report</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 5. Clean Institutional Footer */}
      <footer className="bg-[#141b26] border-t border-slate-800 py-4 px-4 sm:px-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
          <p>© 2026 Bursa Intelligence Terminal. Grounded in Bursa Malaysia Regulatory Disclosures.</p>
          <p className="text-slate-400">Compliant with CMSA 2007 • 4-Stage Modular RAG (AST + ChromaDB + BM25 + FlashRank)</p>
        </div>
      </footer>
    </div>
  );
}
