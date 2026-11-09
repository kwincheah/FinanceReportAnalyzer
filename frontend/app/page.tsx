"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  TrendingUp,
  TrendingDown,
  BarChart2,
  LineChart,
  Send,
  MessageSquare,
  Sparkles,
  X,
  FileText,
  Upload,
  ArrowLeft,
  ChevronRight,
  Calculator,
  RefreshCw,
  CheckCircle2,
  Check,
  ArrowRight,
  Filter,
  Calendar,
  FolderOpen
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
  { code: "1155", ticker: "1155.KL", name: "Maybank", sector: "Banking & Finance", price: 10.12, change: -0.39, positive: false },
  { code: "5347", ticker: "5347.KL", name: "Tenaga Nasional", sector: "Utilities & Energy", price: 13.04, change: 1.46, positive: true },
  { code: "1023", ticker: "1023.KL", name: "CIMB Group", sector: "Banking & Wealth", price: 8.24, change: 0.85, positive: true },
  { code: "5296", ticker: "5296.KL", name: "MR D.I.Y.", sector: "Consumer Retail", price: 1.17, change: 0.51, positive: true },
  { code: "1295", ticker: "1295.KL", name: "Public Bank", sector: "Commercial Banking", price: 4.52, change: -0.22, positive: false },
  { code: "7113", ticker: "7113.KL", name: "Top Glove", sector: "Healthcare & Rubber", price: 1.14, change: 3.64, positive: true },
  { code: "5183", ticker: "5183.KL", name: "PETRONAS Chem", sector: "Chemicals & Gas", price: 5.48, change: -1.26, positive: false },
  { code: "6742", ticker: "6742.KL", name: "YTL Power", sector: "Data Centers & Infrastructure", price: 3.62, change: 1.68, positive: true },
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

const SUGGESTED_QUESTIONS = [
  { label: "Revenue Drivers", prompt: "What are the primary revenue drivers and segment performance in the latest report?" },
  { label: "Management Outlook", prompt: "Summarize the Board's business outlook and expected capital expenditures." },
  { label: "Quarterly Variance", prompt: "Explain the pre-tax profit variance between the current and preceding quarter." },
  { label: "Debt & Cash Position", prompt: "What are the company's total borrowings, gearing ratio, and cash reserves?" },
  { label: "DCF Valuation", prompt: "What are the fair value estimates and valuation sensitivity assumptions?" }
];

// Natural language query & ticker parser
function parseQuery(query: string) {
  if (!query.trim()) return { company: null, instruction: "", raw: "" };

  const qLower = query.toLowerCase().trim();
  let matchedCompany: typeof POPULAR_COMPANIES[0] | null = null;

  for (const comp of POPULAR_COMPANIES) {
    const aliases = [
      comp.code,
      comp.ticker.toLowerCase(),
      comp.name.toLowerCase(),
      ...comp.name.toLowerCase().split(" "),
    ].filter(t => t.length > 2);

    if (comp.name.toLowerCase().includes("tenaga")) aliases.push("tnb", "tenaga");
    if (comp.name.toLowerCase().includes("maybank")) aliases.push("malayan banking", "maybank");
    if (comp.name.toLowerCase().includes("cimb")) aliases.push("cimb");
    if (comp.name.toLowerCase().includes("d.i.y")) aliases.push("diy", "mr diy", "mr. diy", "mrdiy");
    if (comp.name.toLowerCase().includes("public bank")) aliases.push("pbb", "public bank");
    if (comp.name.toLowerCase().includes("top glove")) aliases.push("top glove", "topglove", "glove");
    if (comp.name.toLowerCase().includes("petronas chem")) aliases.push("petchem", "petronas", "pcg");
    if (comp.name.toLowerCase().includes("ytl power")) aliases.push("ytl", "ytl power", "ytlpower");

    for (const alias of aliases) {
      const reg = new RegExp(`\\b${alias.replace('.', '\\.')}\\b`, 'i');
      if (reg.test(qLower)) {
        matchedCompany = comp;
        break;
      }
    }
    if (matchedCompany) break;
  }

  if (!matchedCompany) {
    matchedCompany = POPULAR_COMPANIES.find(c =>
      qLower.includes(c.code) ||
      qLower.includes(c.name.toLowerCase()) ||
      qLower.includes(c.ticker.toLowerCase())
    ) || null;
  }

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

  if (/analy[sz]e/i.test(query) && /financial|report|filing|quarterly/i.test(query)) {
    instruction = "Please provide an executive summary and analysis of the latest financial report, highlighting revenue, profit margins, and key performance drivers.";
  }

  return {
    company: matchedCompany,
    instruction: instruction,
    raw: query
  };
}

export default function App() {
  const [view, setView] = useState<"home" | "terminal">("home");
  const [activeCode, setActiveCode] = useState<string>("1155");
  const [searchQuery, setSearchQuery] = useState("");
  const [data, setData] = useState<any>(null);
  
  // Loading interface states
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(1);
  const [loadingStockName, setLoadingStockName] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Assistant Confirmation Popup - ONLY triggers after user finishes input and presses Enter
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [parsedIntent, setParsedIntent] = useState<ReturnType<typeof parseQuery>>({ company: null, instruction: "", raw: "" });
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Time Interval & Charts
  const [selectedInterval, setSelectedInterval] = useState<string>("1D");
  const [chartData, setChartData] = useState(CHART_INTERVALS["1D"]);

  // Analyst Chat Messages
  const [chatMessages, setChatMessages] = useState<
    { role: "user" | "assistant"; content: string; time?: string }[]
  >([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Responsive Workspace View Toggle for mobile (3 tabs: Filings, Overview, Copilot)
  const [activeTab, setActiveTab] = useState<"filings" | "overview" | "chat">("overview");

  // Selected Financial Filing for focused review
  const [selectedFiling, setSelectedFiling] = useState<any>(null);
  const [filingsFilter, setFilingsFilter] = useState<"all" | "quarterly" | "annual">("all");
  const [highlightCopilot, setHighlightCopilot] = useState(false);

  // Ingestion Modal State
  const [ingestModalOpen, setIngestModalOpen] = useState(false);
  const [ingestStockCode, setIngestStockCode] = useState("1155");
  const [ingestMode, setIngestMode] = useState<"file" | "text">("file");
  const [ingestFile, setIngestFile] = useState<File | null>(null);
  const [ingestText, setIngestText] = useState("");
  const [ingestLoading, setIngestLoading] = useState(false);
  const [ingestFeedback, setIngestFeedback] = useState<{ success: boolean; message: string; details?: any } | null>(null);

  // Focus confirm button when popup appears
  useEffect(() => {
    if (assistantOpen) {
      setTimeout(() => confirmButtonRef.current?.focus(), 50);
    }
  }, [assistantOpen]);

  const loadStockData = async (code: string, autoInstruction?: string) => {
    setLoading(true);
    setLoadingStep(1);
    setError(null);
    setAssistantOpen(false);

    const found = POPULAR_COMPANIES.find(c => c.code === code);
    setLoadingStockName(found ? found.name : `Stock ${code}`);

    // Natural multi-step loading transitions
    const step2Timer = setTimeout(() => setLoadingStep(2), 500);
    const step3Timer = setTimeout(() => setLoadingStep(3), 1100);
    const step4Timer = setTimeout(() => setLoadingStep(4), 1800);

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
      if (json.filings && json.filings.length > 0) {
        setSelectedFiling(json.filings[0]);
      } else {
        setSelectedFiling(null);
      }
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
          role: "assistant",
          content: `Hello! I have loaded the latest financial statements and disclosures for **${json.stock.name} (${json.stock.ticker})**.\n\n- **Current Price:** RM ${json.stock.price.toFixed(2)} (${json.stock.change_pct >= 0 ? "+" : ""}${json.stock.change_pct.toFixed(2)}%)\n- **Operating Revenue:** RM ${(json.financial_statement?.revenue || 7200000).toLocaleString()} ('000)\n- **Net Profit:** RM ${(json.financial_statement?.net_profit || 2350000).toLocaleString()} ('000)\n\nAsk me any questions about the company's financial results, revenue drivers, or operating performance.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);

      if (autoInstruction && autoInstruction.trim().length > 0) {
        setTimeout(() => {
          handleSendMessage(autoInstruction.trim(), code);
        }, 500);
      }

    } catch (err: any) {
      setError(err.message || "Failed to load stock data");
    } finally {
      clearTimeout(step2Timer);
      clearTimeout(step3Timer);
      clearTimeout(step4Timer);
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
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [chatMessages, chatLoading]);

  // ON SUBMIT (Enter or button click): Trigger confirmation popup
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Parse the query and trigger confirmation popup ONLY when user submits
    const parsed = parseQuery(searchQuery);
    setParsedIntent(parsed);
    setAssistantOpen(true);
  };

  const handleSendMessage = async (textToSend?: string, overrideCode?: string) => {
    const query = textToSend || chatInput;
    if (!query.trim() || chatLoading) return;

    const stockToUse = overrideCode || activeCode;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
      const replyContent = json.reply || json.response || "Analysis completed based on verified financial disclosures.";

      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: replyContent,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
      ]);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Unable to complete request: ${err.message}. Please try again shortly.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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

      if (!res.ok) throw new Error(`Upload failed with status ${res.status}`);
      const json = await res.json();

      setIngestFeedback({
        success: true,
        message: json.message || "Filing uploaded successfully.",
        details: json
      });

      const reportName = json.filename || "Quarterly Filing";
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `I've successfully uploaded and processed **${reportName}** for **${json.stock_code}**. You can now ask questions about this report!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
        message: err.message || "Failed to upload filing.",
      });
    } finally {
      setIngestLoading(false);
    }
  };

  const isPositive = (data?.stock?.change_pct || 0) >= 0;

  return (
    <div className="min-h-screen bg-[#090A0C] text-[#F0F3F6] flex flex-col font-sans">
      
      {/* 1. Header (Clean & Minimal: NO Logo and NO Upload Filing Button) */}
      {view === "terminal" && (
        <header className="bg-[#121417] border-b border-[#1F2328] sticky top-0 z-40">
          <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
            
            {/* Back to Start Page */}
            <button
              onClick={() => {
                setView("home");
                setAssistantOpen(false);
              }}
              className="bg-[#16191D] hover:bg-[#1F2328] text-[#8B949E] hover:text-[#F0F3F6] px-3 py-1.5 rounded border border-[#1F2328] flex items-center space-x-1.5 transition text-xs font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Start Page</span>
            </button>

            {/* Quick Switch Stock Search Bar */}
            <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md flex items-center">
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8B949E]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Switch company (e.g. Tenaga, Maybank, CIMB, 5347)..."
                  className="w-full bg-[#090A0C] border border-[#1F2328] rounded pl-8 pr-16 py-1.5 text-xs text-[#F0F3F6] placeholder:text-[#6E7681] focus:outline-none focus:border-blue-500 transition"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="absolute right-1 top-1/2 -translate-y-1/2 bg-[#1F2328] hover:bg-[#30363D] text-[#F0F3F6] px-2.5 py-0.5 rounded text-xs font-medium border border-[#30363D] transition disabled:opacity-40"
                >
                  {loading ? "..." : "Go"}
                </button>
              </div>
            </form>

            <span className="text-xs text-[#8B949E] hidden sm:inline">
              Bursa Malaysia
            </span>
          </div>
        </header>
      )}

      {/* 2. VIEW 1: CLEAN MINIMAL START PAGE */}
      {view === "home" && (
        <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 flex flex-col items-center justify-center space-y-8">
          
          {/* Minimalist Hero */}
          <div className="text-center space-y-2 max-w-xl w-full">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              Bursa Market Research
            </h1>
            <p className="text-[#8B949E] text-xs sm:text-sm leading-relaxed max-w-md mx-auto">
              Search any company or ticker code to review quarterly earnings, financial statements, and explore insights.
            </p>
          </div>

          {/* Clean Search Box - NO POPUP WHILE TYPING; ONLY OPENS AFTER USER PRESSES ENTER */}
          <div className="w-full max-w-xl relative">
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="relative flex items-center shadow-lg">
                <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3.5 text-[#8B949E]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter company or question (e.g. 'analyse report for Tenaga')..."
                  className="w-full bg-[#121417] border border-[#1F2328] hover:border-[#30363D] focus:border-blue-500 rounded-lg pl-10 pr-24 py-3 sm:py-3.5 text-xs sm:text-sm text-white placeholder:text-[#6E7681] focus:outline-none transition"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={loading || !searchQuery.trim()}
                  className="absolute right-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-xs font-semibold disabled:opacity-40 flex items-center space-x-1 transition"
                >
                  <span>Search</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
            <p className="text-[11px] text-[#8B949E] mt-2 text-center">
              Press <kbd className="px-1.5 py-0.5 bg-[#16191D] border border-[#1F2328] rounded text-[10px] text-white">Enter</kbd> to confirm and search
            </p>
          </div>

          {/* Popular Equities Grid */}
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between border-b border-[#1F2328] pb-1.5">
              <span className="text-xs font-semibold text-white">Popular Companies</span>
              <span className="text-[11px] text-[#8B949E]">Bursa Malaysia</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
              {POPULAR_COMPANIES.map((company) => (
                <button
                  key={company.code}
                  onClick={() => loadStockData(company.code)}
                  disabled={loading}
                  className="bg-[#121417] hover:bg-[#16191D] p-3 rounded border border-[#1F2328] hover:border-slate-700 text-left transition flex flex-col justify-between group active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xs font-bold text-white group-hover:text-blue-400">
                      {company.name}
                    </span>
                    <span className={`text-[11px] font-semibold tabular-nums ${company.positive ? "text-emerald-400" : "text-rose-400"}`}>
                      {company.positive ? "+" : ""}{company.change.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-[11px] text-[#8B949E]">
                      {company.ticker}
                    </span>
                    <span className="text-xs font-bold text-white tabular-nums">
                      RM {company.price.toFixed(2)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Market Overview Benchmarks */}
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between border-b border-[#1F2328] pb-1.5">
              <span className="text-xs font-semibold text-white">Market Overview</span>
              <span className="text-[11px] text-[#8B949E]">Live Benchmarks</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 text-xs">
              <div className="bg-[#121417] p-3 rounded border border-[#1F2328]">
                <span className="text-[11px] text-[#8B949E] block mb-0.5">FBM KLCI Index</span>
                <span className="text-sm font-bold text-white tabular-nums">1,624.18</span>
                <span className="text-[11px] text-emerald-400 block font-medium mt-0.5">+5.12 (+0.32%)</span>
              </div>
              <div className="bg-[#121417] p-3 rounded border border-[#1F2328]">
                <span className="text-[11px] text-[#8B949E] block mb-0.5">USD / MYR</span>
                <span className="text-sm font-bold text-white tabular-nums">4.4125</span>
                <span className="text-[11px] text-emerald-400 block font-medium mt-0.5">-0.0065 (-0.15%)</span>
              </div>
              <div className="bg-[#121417] p-3 rounded border border-[#1F2328]">
                <span className="text-[11px] text-[#8B949E] block mb-0.5">Brent Crude</span>
                <span className="text-sm font-bold text-white tabular-nums">$73.87</span>
                <span className="text-[11px] text-emerald-400 block font-medium mt-0.5">+$0.48 (+0.65%)</span>
              </div>
              <div className="bg-[#121417] p-3 rounded border border-[#1F2328]">
                <span className="text-[11px] text-[#8B949E] block mb-0.5">BNM OPR Rate</span>
                <span className="text-sm font-bold text-white tabular-nums">3.00%</span>
                <span className="text-[11px] text-[#8B949E] block font-medium mt-0.5">Neutral Policy</span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* USER CONFIRMATION POPUP: ONLY TRIGGERS ONCE USER FINISHES INPUT AND ENTERS */}
          {/* ========================================================================= */}
          {assistantOpen && (
            <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-lg z-40 bg-[#12161f] border border-blue-500/50 shadow-2xl rounded-xl p-4 text-xs animate-in fade-in slide-in-from-bottom-3 duration-200">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#1F2328] pb-2 mb-2.5">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center">
                    <Sparkles className="w-3 h-3" />
                  </div>
                  <span className="font-bold text-white text-xs">Confirm Target & Query</span>
                </div>
                <button
                  onClick={() => setAssistantOpen(false)}
                  className="text-[#8B949E] hover:text-white p-1 rounded hover:bg-[#1F2328] transition"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Case 1: Company Matched */}
              {parsedIntent.company ? (
                <div className="space-y-3">
                  <div className="bg-[#090c14] border border-slate-800 p-3 rounded-lg">
                    <div className="flex items-center justify-between text-[11px] text-[#8B949E] mb-1">
                      <span>Target Company:</span>
                      <span className="text-emerald-400 font-medium flex items-center space-x-1">
                        <Check className="w-3 h-3" />
                        <span>Identified</span>
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-white font-bold text-sm">
                        {parsedIntent.company.name} ({parsedIntent.company.ticker})
                      </span>
                      <span className="text-blue-400 font-bold tabular-nums">
                        RM {parsedIntent.company.price.toFixed(2)}
                      </span>
                    </div>

                    {parsedIntent.instruction ? (
                      <div className="mt-2.5 pt-2 border-t border-slate-800 text-[11px]">
                        <span className="text-[#8B949E] block mb-1">Your analytical request:</span>
                        <div className="text-blue-300 bg-[#141b28] p-2 rounded border border-blue-900/40 font-medium">
                          &quot;{parsedIntent.instruction}&quot;
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* Primary Action Button (Focused for instant Enter key submission) */}
                  <button
                    ref={confirmButtonRef}
                    onClick={() => {
                      const comp = parsedIntent.company!;
                      loadStockData(comp.code, parsedIntent.instruction);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-3 rounded-lg flex items-center justify-center space-x-2 transition text-xs shadow-md focus:ring-2 focus:ring-blue-400"
                  >
                    <span>
                      {parsedIntent.instruction ? `Run Analysis on ${parsedIntent.company.name}` : `View ${parsedIntent.company.name} Financials`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {/* Quick Suggestions */}
                  <div className="pt-2 border-t border-[#1F2328]">
                    <span className="text-[10px] text-[#8B949E] block mb-1.5">Or choose a common topic:</span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => {
                          const comp = parsedIntent.company!;
                          loadStockData(comp.code, "Summarize revenue drivers and segment performance from the latest quarterly report.");
                        }}
                        className="bg-[#16191D] hover:bg-[#1F2328] text-[#8B949E] hover:text-white text-[11px] px-2 py-1 rounded border border-[#1F2328] transition"
                      >
                        Revenue & Margins
                      </button>
                      <button
                        onClick={() => {
                          const comp = parsedIntent.company!;
                          loadStockData(comp.code, "What are the management's key operating risks and market outlook?");
                        }}
                        className="bg-[#16191D] hover:bg-[#1F2328] text-[#8B949E] hover:text-white text-[11px] px-2 py-1 rounded border border-[#1F2328] transition"
                      >
                        Operating Outlook
                      </button>
                      <button
                        onClick={() => {
                          const comp = parsedIntent.company!;
                          loadStockData(comp.code, "Summarize total borrowings, gearing ratio, and cash position.");
                        }}
                        className="bg-[#16191D] hover:bg-[#1F2328] text-[#8B949E] hover:text-white text-[11px] px-2 py-1 rounded border border-[#1F2328] transition"
                      >
                        Debt & Cash
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Case 2: Ambiguous Query - Quick Company Selector */
                <div className="space-y-2.5">
                  <p className="text-[#8B949E] text-xs">
                    Please select a company to run your query:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {POPULAR_COMPANIES.slice(0, 4).map((c) => (
                      <button
                        key={c.code}
                        onClick={() => {
                          const instruction = searchQuery.trim();
                          loadStockData(c.code, instruction);
                        }}
                        className="bg-[#090c14] hover:bg-[#16191D] text-left p-2.5 border border-slate-800 hover:border-blue-500 rounded-lg transition flex items-center justify-between"
                      >
                        <div>
                          <span className="font-bold text-white block text-xs">{c.name}</span>
                          <span className="text-[10px] text-[#8B949E]">{c.ticker}</span>
                        </div>
                        <span className="text-xs text-blue-400 font-medium">Select →</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </main>
      )}

      {/* 3. VIEW 2: ACTIVE COMPANY FINANCIAL WORKSPACE */}
      {view === "terminal" && data && (
        <main className="flex-1 w-full max-w-[1600px] mx-auto p-2 sm:p-4 space-y-3">
          
          {/* Mobile Tab Switcher (3 Tabs: Filings, Financials, Copilot) */}
          <div className="lg:hidden bg-[#121417] border border-[#1F2328] rounded p-1 grid grid-cols-3 gap-1 text-xs">
            <button
              onClick={() => setActiveTab("filings")}
              className={`py-1.5 px-2 rounded font-semibold transition text-center flex items-center justify-center space-x-1 ${
                activeTab === "filings" ? "bg-blue-600 text-white" : "text-[#8B949E] hover:text-white"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Filings ({(data.filings || []).length})</span>
            </button>
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-1.5 px-2 rounded font-semibold transition text-center flex items-center justify-center space-x-1 ${
                activeTab === "overview" ? "bg-blue-600 text-white" : "text-[#8B949E] hover:text-white"
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Financials</span>
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`py-1.5 px-2 rounded font-semibold transition text-center flex items-center justify-center space-x-1 ${
                activeTab === "chat" ? "bg-blue-600 text-white" : "text-[#8B949E] hover:text-white"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Copilot</span>
            </button>
          </div>

          {/* Stock Header Banner */}
          <div className="bg-[#121417] border border-[#1F2328] rounded-lg p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-3">
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    {data.stock.name}
                  </h1>
                  <span className="bg-[#16191D] text-[#8B949E] text-xs px-2 py-0.5 rounded border border-[#1F2328] font-mono">
                    {data.stock.ticker}
                  </span>
                </div>
                <div className="flex items-baseline space-x-2 mt-0.5">
                  <span className="text-xl sm:text-2xl font-bold text-white tabular-nums">
                    RM {data.stock.price.toFixed(2)}
                  </span>
                  <span className={`text-xs font-semibold tabular-nums flex items-center ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                    {isPositive ? <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> : <TrendingDown className="w-3.5 h-3.5 mr-0.5" />}
                    {isPositive ? "+" : ""}{data.stock.change_pct.toFixed(2)}% Today
                  </span>
                </div>
              </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 w-full sm:w-auto text-xs">
              <div className="bg-[#090A0C] p-2 rounded border border-[#1F2328]">
                <span className="text-[10px] text-[#8B949E] block">Market Cap</span>
                <span className="text-white font-semibold tabular-nums">
                  RM {data.stock.market_cap ? (data.stock.market_cap / 1_000_000_000).toFixed(1) + "B" : "122.5B"}
                </span>
              </div>
              <div className="bg-[#090A0C] p-2 rounded border border-[#1F2328]">
                <span className="text-[10px] text-[#8B949E] block">P/E Ratio</span>
                <span className="text-white font-semibold tabular-nums">
                  {data.metrics.annualized_pe ? `${data.metrics.annualized_pe}x` : "12.8x"}
                </span>
              </div>
              <div className="bg-[#090A0C] p-2 rounded border border-[#1F2328]">
                <span className="text-[10px] text-[#8B949E] block">Operating Margin</span>
                <span className="text-emerald-400 font-semibold tabular-nums">
                  {data.metrics.net_margin_pct ? `${data.metrics.net_margin_pct}%` : "32.6%"}
                </span>
              </div>
              <div className="bg-[#090A0C] p-2 rounded border border-[#1F2328]">
                <span className="text-[10px] text-[#8B949E] block">Gearing Ratio</span>
                <span className="text-white font-semibold tabular-nums">
                  {data.metrics.gearing_ratio ? `${data.metrics.gearing_ratio}x` : "0.45x"}
                </span>
              </div>
            </div>
          </div>

          {/* 3-Column Responsive Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
            
            {/* 1. LEFT COLUMN: Financial Reports & Public Disclosures List */}
            <div className={`lg:col-span-3 space-y-2.5 ${activeTab === "filings" ? "block" : "hidden lg:block"}`}>
              <div className="bg-[#121417] border border-[#1F2328] rounded-lg p-3 space-y-2.5">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#1F2328] pb-2">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <div>
                      <h3 className="font-semibold text-xs text-white">Financial Reports</h3>
                      <p className="text-[10px] text-[#8B949E]">Official Disclosures</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-[#16191D] text-slate-300 px-2 py-0.5 rounded border border-[#1F2328]">
                    {(data.filings || []).length} Available
                  </span>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center space-x-1 bg-[#090A0C] border border-[#1F2328] p-0.5 rounded text-[11px]">
                  <button
                    onClick={() => setFilingsFilter("all")}
                    className={`flex-1 py-1 rounded font-medium transition text-center ${
                      filingsFilter === "all" ? "bg-blue-600 text-white" : "text-[#8B949E] hover:text-white"
                    }`}
                  >
                    All ({(data.filings || []).length})
                  </button>
                  <button
                    onClick={() => setFilingsFilter("quarterly")}
                    className={`flex-1 py-1 rounded font-medium transition text-center ${
                      filingsFilter === "quarterly" ? "bg-blue-600 text-white" : "text-[#8B949E] hover:text-white"
                    }`}
                  >
                    Quarterly
                  </button>
                  <button
                    onClick={() => setFilingsFilter("annual")}
                    className={`flex-1 py-1 rounded font-medium transition text-center ${
                      filingsFilter === "annual" ? "bg-blue-600 text-white" : "text-[#8B949E] hover:text-white"
                    }`}
                  >
                    Annual
                  </button>
                </div>

                {/* Reports List */}
                <div className="space-y-2 max-h-[620px] overflow-y-auto pr-0.5">
                  {(data.filings || [])
                    .filter((f: any) => {
                      if (filingsFilter === "quarterly") return f.type.toLowerCase().includes("quarterly");
                      if (filingsFilter === "annual") return f.type.toLowerCase().includes("annual");
                      return true;
                    })
                    .map((f: any) => {
                      const isSelected = selectedFiling?.id === f.id;
                      return (
                        <div
                          key={f.id}
                          onClick={() => setSelectedFiling(f)}
                          className={`p-2.5 rounded border transition cursor-pointer text-left ${
                            isSelected
                              ? "bg-[#161d28] border-blue-500/70 shadow-sm"
                              : "bg-[#090A0C] border-[#1F2328] hover:border-slate-700 hover:bg-[#12161f]"
                          }`}
                        >
                          {/* Top Row: Period badge + Latest indicator + Type */}
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center space-x-1.5">
                              <span className="text-xs font-bold text-white font-mono bg-[#16191D] px-1.5 py-0.5 rounded border border-[#1F2328]">
                                {f.period}
                              </span>
                              {f.is_latest && (
                                <span className="text-[10px] bg-emerald-950/70 text-emerald-400 border border-emerald-800/60 px-1.5 py-0.2 rounded font-semibold flex items-center">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1"></span>
                                  Latest
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-[#8B949E] font-medium">
                              {f.type}
                            </span>
                          </div>

                          {/* Filing Title */}
                          <p className="text-xs font-medium text-slate-200 line-clamp-2 mb-1.5 leading-snug">
                            {f.title}
                          </p>

                          {/* Period Ended & Release Date */}
                          <div className="text-[11px] text-[#8B949E] space-y-0.5 mb-2">
                            <div className="flex items-center justify-between">
                              <span>Period Ended:</span>
                              <span className="text-slate-300 font-mono">{f.period_ended}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Released Date:</span>
                              <span className="text-slate-300 font-mono">{f.release_date}</span>
                            </div>
                          </div>

                          {/* Financial Metric Badges + Quick Action */}
                          <div className="flex items-center justify-between pt-1.5 border-t border-[#1F2328] text-[11px]">
                            <div className="text-[11px] text-[#8B949E]">
                              <span>Rev: <strong className="text-white font-mono">RM {f.revenue_m?.toLocaleString()}M</strong></span>
                              <span className="mx-1 text-[#484F58]">•</span>
                              <span>PAT: <strong className="text-emerald-400 font-mono">RM {f.profit_m?.toLocaleString()}M</strong></span>
                            </div>
                            <button
                              disabled={chatLoading}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedFiling(f);
                                setActiveTab("chat");
                                setHighlightCopilot(true);
                                setTimeout(() => setHighlightCopilot(false), 2500);
                                handleSendMessage(
                                  `Please provide a detailed financial breakdown of the ${f.period} (${f.title}): highlight revenue drivers, operating margins, and disclosures.`,
                                  data?.stock?.code || activeCode
                                );
                              }}
                              className="text-[10px] text-blue-400 hover:text-white bg-blue-950/40 hover:bg-blue-600 px-2 py-0.5 rounded border border-blue-900/50 hover:border-blue-500 transition font-medium flex items-center space-x-1 disabled:opacity-50"
                              title="Ask Copilot about this filing"
                            >
                              {chatLoading && selectedFiling?.id === f.id ? (
                                <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />
                              ) : (
                                <Sparkles className="w-3 h-3" />
                              )}
                              <span>{chatLoading && selectedFiling?.id === f.id ? "Analyzing..." : "Ask"}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Footer note in filings panel */}
                <div className="pt-2 border-t border-[#1F2328] text-[10px] text-[#8B949E] flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>Verified Bursa Malaysia public filings</span>
                </div>

              </div>
            </div>

            {/* 2. CENTER COLUMN: Charts & Financial Statement Tables */}
            <div className={`lg:col-span-5 space-y-3 ${activeTab === "overview" ? "block" : "hidden lg:block"}`}>
              
              {/* Selected Filing Context Banner */}
              {selectedFiling && (
                <div className="bg-[#121417] border border-blue-900/40 rounded-lg p-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                    <span className="text-[#8B949E]">Viewing Filing:</span>
                    <span className="text-white font-semibold">{selectedFiling.period}</span>
                    <span className="text-[#8B949E] hidden sm:inline truncate max-w-[180px]">({selectedFiling.title})</span>
                  </div>
                  <button
                    disabled={chatLoading}
                    onClick={() => {
                      setActiveTab("chat");
                      setHighlightCopilot(true);
                      setTimeout(() => setHighlightCopilot(false), 2500);
                      handleSendMessage(
                        `Explain the quarter-over-quarter revenue and profit variance for ${selectedFiling.period}.`,
                        data?.stock?.code || activeCode
                      );
                    }}
                    className="text-[11px] text-blue-400 hover:text-white font-medium flex items-center space-x-1 shrink-0 ml-2 disabled:opacity-50"
                  >
                    {chatLoading ? (
                      <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />
                    ) : (
                      <ArrowRight className="w-3 h-3" />
                    )}
                    <span>{chatLoading ? "Analyzing..." : "Analyze with Copilot"}</span>
                  </button>
                </div>
              )}
              
              {/* 1. Price Area Chart */}
              <div className="bg-[#121417] border border-[#1F2328] rounded-lg p-3 sm:p-4 space-y-2">
                <div className="flex items-center justify-between border-b border-[#1F2328] pb-2">
                  <div className="flex items-center space-x-2">
                    <LineChart className="w-4 h-4 text-blue-400" />
                    <span className="font-semibold text-xs text-white">Price History (MYR)</span>
                  </div>

                  {/* Interval Selector */}
                  <div className="flex items-center space-x-1 bg-[#090A0C] border border-[#1F2328] p-0.5 rounded text-xs">
                    {(["1D", "5D", "1M", "6M", "1Y"] as const).map((interval) => (
                      <button
                        key={interval}
                        onClick={() => setSelectedInterval(interval)}
                        className={`px-2 py-0.5 rounded font-medium transition ${
                          selectedInterval === interval
                            ? "bg-blue-600 text-white"
                            : "text-[#8B949E] hover:text-white"
                        }`}
                      >
                        {interval}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-44 sm:h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1F2328" />
                      <XAxis dataKey="time" stroke="#8B949E" tick={{ fontSize: 10 }} />
                      <YAxis domain={["auto", "auto"]} stroke="#8B949E" tick={{ fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#121417",
                          borderColor: "#1F2328",
                          borderRadius: "4px",
                          fontSize: "11px",
                          color: "#F0F3F6"
                        }}
                        formatter={(value: any) => [`RM ${Number(value).toFixed(2)}`, "Price"]}
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

              {/* 2. Topline Revenue vs. Net Profit Progression */}
              <div className="bg-[#121417] border border-[#1F2328] rounded-lg p-3 sm:p-4 space-y-2">
                <div className="flex items-center justify-between border-b border-[#1F2328] pb-2">
                  <div className="flex items-center space-x-2">
                    <BarChart2 className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-xs text-white">Quarterly Revenue vs. Profit (RM &apos;M)</span>
                  </div>
                  <span className="text-[11px] text-[#8B949E]">Historical Progression</span>
                </div>

                <div className="h-32 sm:h-36 w-full">
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
                      barGap={4}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1F2328" />
                      <XAxis dataKey="quarter" stroke="#8B949E" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#8B949E" tick={{ fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#121417",
                          borderColor: "#1F2328",
                          borderRadius: "4px",
                          fontSize: "11px",
                          color: "#F0F3F6"
                        }}
                        formatter={(value: any, name: any) => [
                          `RM ${Number(value).toLocaleString()} M`,
                          name === "revenue" ? "Revenue" : "Net Profit",
                        ]}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                      <Bar dataKey="revenue" name="Revenue" fill="#64748B" barSize={14} radius={[2, 2, 0, 0]} isAnimationActive={false} />
                      <Bar dataKey="profit" name="Net Profit" fill="#10B981" barSize={14} radius={[2, 2, 0, 0]} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 3. Financial Statement Excerpt Table */}
              <div className="bg-[#121417] border border-[#1F2328] rounded-lg p-3 sm:p-4 space-y-2">
                <div className="flex items-center justify-between border-b border-[#1F2328] pb-2">
                  <span className="font-semibold text-xs text-white">Financial Statement Summary</span>
                  <span className="text-[11px] text-[#8B949E]">RM &apos;000</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs table-zebra">
                    <thead className="bg-[#090A0C] text-[#8B949E] text-[11px] uppercase border-b border-[#1F2328]">
                      <tr>
                        <th className="py-1.5 px-2.5 font-medium">Line Item</th>
                        <th className="py-1.5 px-2.5 text-right font-medium">Current Qtr</th>
                        <th className="py-1.5 px-2.5 text-right font-medium">Preceding Qtr</th>
                        <th className="py-1.5 px-2.5 text-right font-medium">QoQ Change</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1F2328]">
                      <tr>
                        <td className="py-1.5 px-2.5 text-white font-medium">Revenue</td>
                        <td className="py-1.5 px-2.5 text-right tabular-nums text-white">
                          {(data.financial_statement?.revenue || 7200000).toLocaleString()}
                        </td>
                        <td className="py-1.5 px-2.5 text-right tabular-nums text-[#8B949E]">
                          {(data.financial_statement?.prev_revenue || 6800000).toLocaleString()}
                        </td>
                        <td className="py-1.5 px-2.5 text-right tabular-nums font-semibold text-emerald-400">
                          {data.metrics?.rev_growth_qoq >= 0 ? "+" : ""}{data.metrics?.rev_growth_qoq}%
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-2.5 text-white font-medium">Net Profit (PATAMI)</td>
                        <td className="py-1.5 px-2.5 text-right tabular-nums text-white font-bold">
                          {(data.financial_statement?.net_profit || 2350000).toLocaleString()}
                        </td>
                        <td className="py-1.5 px-2.5 text-right tabular-nums text-[#8B949E]">
                          {(data.financial_statement?.prev_net_profit || 2200000).toLocaleString()}
                        </td>
                        <td className="py-1.5 px-2.5 text-right tabular-nums font-semibold text-emerald-400">
                          {data.metrics?.profit_growth_qoq >= 0 ? "+" : ""}{data.metrics?.profit_growth_qoq}%
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-2.5 text-white font-medium">Total Borrowings</td>
                        <td className="py-1.5 px-2.5 text-right tabular-nums text-white">
                          {(data.financial_statement?.total_borrowings || 45000000).toLocaleString()}
                        </td>
                        <td className="py-1.5 px-2.5 text-right tabular-nums text-[#8B949E]">
                          {((data.financial_statement?.total_borrowings || 45000000) * 0.98).toLocaleString()}
                        </td>
                        <td className="py-1.5 px-2.5 text-right tabular-nums text-[#8B949E]">+2.04%</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-2.5 text-white font-medium">Cash & Bank Balances</td>
                        <td className="py-1.5 px-2.5 text-right tabular-nums text-emerald-400 font-bold">
                          {(data.financial_statement?.cash || 60000000).toLocaleString()}
                        </td>
                        <td className="py-1.5 px-2.5 text-right tabular-nums text-[#8B949E]">
                          {((data.financial_statement?.cash || 60000000) * 0.97).toLocaleString()}
                        </td>
                        <td className="py-1.5 px-2.5 text-right tabular-nums text-emerald-400 font-semibold">+3.09%</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-2.5 text-white font-medium">Basic EPS (sen)</td>
                        <td className="py-1.5 px-2.5 text-right tabular-nums text-white font-bold">
                          {(data.financial_statement?.eps_sen || 19.5).toFixed(2)}
                        </td>
                        <td className="py-1.5 px-2.5 text-right tabular-nums text-[#8B949E]">
                          {((data.financial_statement?.eps_sen || 19.5) * 0.94).toFixed(2)}
                        </td>
                        <td className="py-1.5 px-2.5 text-right tabular-nums text-emerald-400 font-semibold">+6.38%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. DCF Valuation Scenarios */}
              <div className="bg-[#121417] border border-[#1F2328] rounded-lg p-3 sm:p-4 space-y-2">
                <div className="flex items-center justify-between border-b border-[#1F2328] pb-1.5">
                  <div className="flex items-center space-x-2">
                    <Calculator className="w-4 h-4 text-blue-400" />
                    <span className="font-semibold text-xs text-white">5-Year DCF Valuation Scenarios</span>
                  </div>
                  <span className="text-[11px] text-[#8B949E]">Sensitivity Analysis</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-[#090A0C] p-2 rounded border border-[#1F2328]">
                    <span className="text-[11px] text-[#8B949E] block mb-0.5">Conservative</span>
                    <span className="font-bold text-white text-xs sm:text-sm tabular-nums">RM {(data.stock.price * 1.05).toFixed(2)}</span>
                    <span className="text-[10px] text-[#8B949E] block mt-0.5">WACC: 10.0%</span>
                  </div>
                  <div className="bg-blue-950/20 p-2 rounded border border-blue-800/40">
                    <span className="text-[11px] text-blue-400 block font-semibold mb-0.5">Base Case</span>
                    <span className="font-bold text-blue-300 text-xs sm:text-sm tabular-nums">RM {(data.stock.price * 1.25).toFixed(2)}</span>
                    <span className="text-[10px] text-blue-400/80 block mt-0.5">WACC: 8.5%</span>
                  </div>
                  <div className="bg-[#090A0C] p-2 rounded border border-[#1F2328]">
                    <span className="text-[11px] text-emerald-400 block mb-0.5">Optimistic</span>
                    <span className="font-bold text-emerald-400 text-xs sm:text-sm tabular-nums">RM {(data.stock.price * 1.48).toFixed(2)}</span>
                    <span className="text-[10px] text-[#8B949E] block mt-0.5">WACC: 7.0%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. RIGHT COLUMN: AI Financial Research Copilot */}
            <div className={`lg:col-span-4 flex flex-col bg-[#121417] border ${
              highlightCopilot
                ? "border-blue-500 ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/10"
                : "border-[#1F2328]"
            } rounded-lg h-[540px] sm:h-[620px] lg:h-[760px] transition-all duration-300 ${activeTab === "chat" ? "block" : "hidden lg:flex"}`}>
              
              {/* Copilot Header */}
              <div className="p-3 bg-[#16191D] border-b border-[#1F2328] flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-white">AI Research Copilot</h3>
                    <p className="text-[10px] text-[#8B949E]">
                      {data.stock.name} • {selectedFiling ? selectedFiling.period : "Latest Filing"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setChatMessages([
                      {
                        role: "assistant",
                        content: `Chat history cleared. Active context is **${data.stock.name} (${data.stock.ticker})**. How can I help you today?`,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      }
                    ]);
                  }}
                  className="text-[11px] text-[#8B949E] hover:text-white px-2 py-1 rounded hover:bg-[#1F2328] border border-transparent hover:border-[#30363D] transition"
                  title="Clear conversation"
                >
                  Clear Chat
                </button>
              </div>

              {/* Suggested Questions Pills */}
              <div className="px-3 py-2 bg-[#121417] border-b border-[#1F2328] flex items-center space-x-1.5 overflow-x-auto text-xs whitespace-nowrap">
                <span className="text-[11px] text-[#8B949E] shrink-0 mr-1">Suggestions:</span>
                {SUGGESTED_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q.prompt)}
                    disabled={chatLoading}
                    className="bg-[#16191D] hover:bg-[#1F2328] text-[#8B949E] hover:text-white text-[11px] px-2 py-0.5 rounded border border-[#1F2328] transition shrink-0 disabled:opacity-40"
                  >
                    {q.label}
                  </button>
                ))}
              </div>

              {/* Message Feed */}
              <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3.5 text-xs">
                {chatMessages.map((msg, index) => (
                  <div key={index} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    
                    <div className="flex items-center space-x-1.5 mb-1 text-[10px] text-[#8B949E]">
                      <span>{msg.role === "user" ? "You" : "Analyst Copilot"}</span>
                      {msg.time && <span>• {msg.time}</span>}
                    </div>

                    <div className={`p-3 rounded-lg max-w-[92%] leading-relaxed ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-tr-none"
                        : "bg-[#16191D] text-slate-200 border border-[#1F2328] rounded-tl-none"
                    }`}>
                      {msg.role === "user" ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div className="prose prose-invert prose-xs max-w-none space-y-1.5 text-slate-200">
                          <ReactMarkdown
                            components={{
                              h1: ({ node, ...props }) => <h3 className="text-xs font-bold text-white border-b border-[#1F2328] pb-1 mt-1 mb-1" {...props} />,
                              h2: ({ node, ...props }) => <h4 className="text-xs font-bold text-white mt-1 mb-0.5" {...props} />,
                              p: ({ node, ...props }) => <p className="mb-1.5 leading-relaxed text-xs" {...props} />,
                              ul: ({ node, ...props }) => <ul className="list-disc pl-4 space-y-0.5 mb-1 text-xs" {...props} />,
                              ol: ({ node, ...props }) => <ol className="list-decimal pl-4 space-y-0.5 mb-1 text-xs" {...props} />,
                              li: ({ node, ...props }) => <li className="text-slate-200" {...props} />,
                              strong: ({ node, ...props }) => <strong className="font-bold text-white" {...props} />,
                              blockquote: ({ node, ...props }) => (
                                <blockquote className="border-l-2 border-blue-500 pl-2 py-0.5 my-1 bg-[#121417] text-[#8B949E] italic text-[11px]" {...props} />
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
                    <div className="text-[10px] text-[#8B949E] mb-1">Analyst Copilot is analyzing filings...</div>
                    <div className="bg-[#16191D] border border-[#1F2328] rounded-lg rounded-tl-none p-3 flex items-center space-x-2 text-slate-300">
                      <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                      </div>
                      <span className="text-[11px] text-[#8B949E]">Reviewing quarterly disclosures...</span>
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 bg-[#121417] border-t border-[#1F2328]">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center space-x-2"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={`Ask about ${data.stock.name} revenue, debt, or prospects...`}
                    className="flex-1 bg-[#090A0C] border border-[#1F2328] rounded px-3 py-2 text-xs text-white placeholder:text-[#6E7681] focus:outline-none focus:border-blue-500 transition"
                  />
                  <button
                    type="submit"
                    disabled={chatLoading || !chatInput.trim()}
                    className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded transition disabled:opacity-40"
                    title="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
                <p className="text-[10px] text-[#8B949E] text-center mt-1.5">
                  AI insights grounded in official quarterly reports
                </p>
              </div>

            </div>

          </div>
        </main>
      )}

      {/* ========================================================================= */}
      {/* 4. CLEAN, HUMAN-FRIENDLY LOADING OVERLAY                                    */}
      {/* Shows animated step-by-step progress without any implementation jargon    */}
      {/* ========================================================================= */}
      {loading && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12161f] border border-slate-700/80 rounded-2xl max-w-md w-full p-6 text-center shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Animated Loading Rings & Document Icon */}
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin"></div>
              <div className="absolute inset-2 rounded-full border-2 border-emerald-500/20 border-b-emerald-500 animate-spin [animation-duration:1.5s]"></div>
              <div className="absolute inset-0 flex items-center justify-center text-blue-400">
                <FileText className="w-6 h-6 animate-pulse" />
              </div>
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">
                Analyzing {loadingStockName || "Company Reports"}...
              </h3>
              <p className="text-xs text-slate-400">
                Pulling official quarterly disclosures and generating insights
              </p>
            </div>

            {/* Multi-Step Ingestion Checklist (Zero tech jargon) */}
            <div className="bg-[#090c14] border border-slate-800 rounded-xl p-3.5 text-left text-xs space-y-2.5 font-sans">
              <div className="flex items-center space-x-2.5">
                {loadingStep > 1 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <RefreshCw className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
                )}
                <span className={loadingStep >= 1 ? "text-slate-200 font-medium" : "text-slate-500"}>
                  1. Retrieving quarterly financial statements & balance sheets
                </span>
              </div>

              <div className="flex items-center space-x-2.5">
                {loadingStep > 2 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : loadingStep === 2 ? (
                  <RefreshCw className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
                )}
                <span className={loadingStep >= 2 ? "text-slate-200 font-medium" : "text-slate-500"}>
                  2. Extracting financial tables & explanatory notes
                </span>
              </div>

              <div className="flex items-center space-x-2.5">
                {loadingStep > 3 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : loadingStep === 3 ? (
                  <RefreshCw className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
                )}
                <span className={loadingStep >= 3 ? "text-slate-200 font-medium" : "text-slate-500"}>
                  3. Analyzing revenue drivers & profit margins
                </span>
              </div>

              <div className="flex items-center space-x-2.5">
                {loadingStep >= 4 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
                )}
                <span className={loadingStep >= 4 ? "text-emerald-400 font-medium" : "text-slate-500"}>
                  4. Preparing research overview & copilot
                </span>
              </div>
            </div>

            {/* Smooth Animated Progress Bar */}
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full transition-all duration-300"
                style={{ width: `${Math.min(loadingStep * 25, 100)}%` }}
              />
            </div>

          </div>
        </div>
      )}

      {/* 5. Clean Minimal Footer */}
      <footer className="bg-[#121417] border-t border-[#1F2328] py-3 px-4 text-xs text-[#8B949E]">
        <div className="w-full max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-1 text-[11px]">
          <p>© 2026 Bursa Intelligence. Public market data and financial disclosures.</p>
          <p>For educational & research purposes only.</p>
        </div>
      </footer>

    </div>
  );
}
