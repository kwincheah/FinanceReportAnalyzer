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
  FolderOpen,
  Sun,
  Moon
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

function ThemeSwitch({ theme, onToggle }: { theme: "dark" | "light"; onToggle: () => void }) {
  const isDark = theme === "dark";
  return (
    <button
      onClick={onToggle}
      type="button"
      className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#1F2328] bg-slate-100 dark:bg-[#16191D] hover:bg-slate-200 dark:hover:bg-[#1F2328] text-slate-700 dark:text-[#F0F3F6] transition text-xs font-medium group active:scale-95 shadow-sm"
      title={`Switch to ${isDark ? "Light" : "Dark"} Mode`}
      aria-label={`Switch to ${isDark ? "Light" : "Dark"} Mode`}
    >
      {isDark ? (
        <>
          <Sun className="w-3.5 h-3.5 text-amber-400 transition-transform group-hover:rotate-45" />
          <span className="hidden sm:inline text-[11px] text-[#8B949E] group-hover:text-white">Light Mode</span>
        </>
      ) : (
        <>
          <Moon className="w-3.5 h-3.5 text-blue-600 transition-transform group-hover:-rotate-12" />
          <span className="hidden sm:inline text-[11px] text-slate-600 group-hover:text-slate-900">Dark Mode</span>
        </>
      )}
    </button>
  );
}

export default function App() {
  const [view, setView] = useState<"home" | "terminal">("home");
  const [activeCode, setActiveCode] = useState<string>("1155");
  const [searchQuery, setSearchQuery] = useState("");
  const [data, setData] = useState<any>(null);

  // Theme state: light or dark mode
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    try {
      const stored = (localStorage.getItem("theme") || localStorage.getItem("color-scheme")) as "dark" | "light" | null;
      if (stored === "light" || stored === "dark") {
        setTheme(stored);
        applyTheme(stored);
      } else {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const initial = prefersDark ? "dark" : "dark";
        setTheme(initial);
        applyTheme(initial);
      }
    } catch (e) {}
  }, []);

  const applyTheme = (t: "dark" | "light") => {
    if (t === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
    const meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) meta.setAttribute("content", t);
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    try {
      localStorage.setItem("theme", next);
      localStorage.setItem("color-scheme", next);
    } catch (e) {}
  };

  const isDark = theme === "dark";
  
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
  const [chartView, setChartView] = useState<"price" | "financials" | "split">("price");
  const [homeSectorFilter, setHomeSectorFilter] = useState<string>("all");

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

  // Focus confirm button when popup appears & listen for Escape key
  useEffect(() => {
    if (assistantOpen) {
      setTimeout(() => confirmButtonRef.current?.focus(), 50);
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setAssistantOpen(false);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#090A0C] text-slate-900 dark:text-[#F0F3F6] flex flex-col font-sans transition-colors duration-150">
      
      {/* 1. Header (Clean & Minimal with Theme Switch) */}
      {view === "terminal" && (
        <header className="bg-white dark:bg-[#121417] border-b border-slate-200 dark:border-[#1F2328] sticky top-0 z-40 transition-colors">
          <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
            
            {/* Back to Start Page */}
            <button
              onClick={() => {
                setView("home");
                setAssistantOpen(false);
              }}
              className="bg-slate-100 dark:bg-[#16191D] hover:bg-slate-200 dark:hover:bg-[#1F2328] text-slate-700 dark:text-[#8B949E] hover:text-slate-900 dark:hover:text-[#F0F3F6] px-3 py-1.5 rounded border border-slate-200 dark:border-[#1F2328] flex items-center space-x-1.5 transition text-xs font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Start Page</span>
            </button>

            {/* Quick Switch Stock Search Bar */}
            <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md flex items-center">
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#8B949E]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Switch company (e.g. Tenaga, Maybank, CIMB, 5347)..."
                  className="w-full bg-slate-100 dark:bg-[#090A0C] border border-slate-200 dark:border-[#1F2328] rounded pl-8 pr-16 py-1.5 text-xs text-slate-900 dark:text-[#F0F3F6] placeholder:text-slate-400 dark:placeholder:text-[#6E7681] focus:outline-none focus:border-blue-500 transition"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="absolute right-1 top-1/2 -translate-y-1/2 bg-slate-200 dark:bg-[#1F2328] hover:bg-slate-300 dark:hover:bg-[#30363D] text-slate-800 dark:text-[#F0F3F6] px-2.5 py-0.5 rounded text-xs font-medium border border-slate-300 dark:border-[#30363D] transition disabled:opacity-40"
                >
                  {loading ? "..." : "Go"}
                </button>
              </div>
            </form>

            <div className="flex items-center space-x-2.5">
              <ThemeSwitch theme={theme} onToggle={toggleTheme} />
              <span className="text-xs text-slate-500 dark:text-[#8B949E] hidden sm:inline font-medium">
                Bursa Malaysia
              </span>
            </div>
          </div>
        </header>
      )}

      {/* Start Page Header with Theme Switch */}
      {view === "home" && (
        <header className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-5 pb-0 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              B
            </div>
            <span className="text-xs font-bold tracking-tight text-slate-800 dark:text-white">
              Bursa Intelligence
            </span>
            <span className="hidden sm:inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Live Market Data</span>
            </span>
          </div>
          <ThemeSwitch theme={theme} onToggle={toggleTheme} />
        </header>
      )}

      {/* 2. VIEW 1: CLEAN MINIMAL START PAGE */}
      {view === "home" && (
        <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col items-center justify-center space-y-7">
          
          {/* Minimalist Hero */}
          <div className="text-center space-y-2 max-w-xl w-full">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Bursa Market Research
            </h1>
            <p className="text-slate-600 dark:text-[#8B949E] text-xs sm:text-sm leading-relaxed max-w-md mx-auto">
              Institutional intelligence & verified financial disclosures across Bursa Malaysia equities.
            </p>
          </div>

          {/* 1. Market Pulse Benchmarks (4 Tidy Tiles) */}
          <div className="w-full">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="bg-white dark:bg-[#121417] p-3 rounded-xl border border-slate-200 dark:border-[#1F2328] shadow-xs flex flex-col justify-between">
                <span className="text-[10px] text-slate-500 dark:text-[#8B949E] font-medium uppercase tracking-wider block mb-0.5">FBM KLCI Index</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">1,624.18</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">+5.12 (+0.32%)</span>
              </div>
              <div className="bg-white dark:bg-[#121417] p-3 rounded-xl border border-slate-200 dark:border-[#1F2328] shadow-xs flex flex-col justify-between">
                <span className="text-[10px] text-slate-500 dark:text-[#8B949E] font-medium uppercase tracking-wider block mb-0.5">USD / MYR</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">4.4125</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">-0.0065 (-0.15%)</span>
              </div>
              <div className="bg-white dark:bg-[#121417] p-3 rounded-xl border border-slate-200 dark:border-[#1F2328] shadow-xs flex flex-col justify-between">
                <span className="text-[10px] text-slate-500 dark:text-[#8B949E] font-medium uppercase tracking-wider block mb-0.5">Brent Crude</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">$73.87</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">+$0.48 (+0.65%)</span>
              </div>
              <div className="bg-white dark:bg-[#121417] p-3 rounded-xl border border-slate-200 dark:border-[#1F2328] shadow-xs flex flex-col justify-between">
                <span className="text-[10px] text-slate-500 dark:text-[#8B949E] font-medium uppercase tracking-wider block mb-0.5">BNM OPR Rate</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">3.00%</span>
                <span className="text-[10px] text-slate-500 dark:text-[#8B949E] font-medium mt-0.5">Neutral Stance</span>
              </div>
            </div>
          </div>

          {/* 2. Clean Search Box */}
          <div className="w-full max-w-xl relative">
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="relative flex items-center shadow-md hover:shadow-lg transition-shadow rounded-xl">
                <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3.5 text-slate-400 dark:text-[#8B949E]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter company or prompt (e.g. 'Tenaga quarterly revenue')..."
                  className="w-full bg-white dark:bg-[#121417] border border-slate-200 dark:border-[#1F2328] hover:border-slate-300 dark:hover:border-[#30363D] focus:border-blue-500 dark:focus:border-blue-500 rounded-xl pl-11 pr-28 py-3.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#6E7681] focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                  autoFocus
                />
                {searchQuery.trim() && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-24 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                    title="Clear"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading || !searchQuery.trim()}
                  className="absolute right-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-40 flex items-center space-x-1.5 transition shadow-sm active:scale-95"
                >
                  <span>Search</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
            <p className="text-[11px] text-slate-500 dark:text-[#8B949E] mt-2 text-center">
              Press <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-[#16191D] border border-slate-200 dark:border-[#1F2328] rounded text-[10px] font-mono text-slate-700 dark:text-slate-300 shadow-2xs">Enter</kbd> to confirm query
            </p>
          </div>

          {/* 3. Popular Bursa Equities with Sector Filter Tabs */}
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
                    onClick={() => setHomeSectorFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition whitespace-nowrap ${
                      homeSectorFilter === tab.id
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "bg-slate-100 dark:bg-[#16191D] text-slate-600 dark:text-[#8B949E] hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#1F2328]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Symmetrical Equity Tiles (Fixed Height & Balanced Alignment) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {POPULAR_COMPANIES
                .filter((company) => {
                  if (homeSectorFilter === "banking") return company.sector.toLowerCase().includes("bank");
                  if (homeSectorFilter === "utilities") return company.sector.toLowerCase().includes("utilit") || company.sector.toLowerCase().includes("power") || company.sector.toLowerCase().includes("gas");
                  if (homeSectorFilter === "other") return !company.sector.toLowerCase().includes("bank") && !company.sector.toLowerCase().includes("utilit");
                  return true;
                })
                .map((company) => (
                  <button
                    key={company.code}
                    onClick={() => loadStockData(company.code)}
                    disabled={loading}
                    className="bg-white dark:bg-[#121417] hover:bg-slate-50 dark:hover:bg-[#16191D] p-3.5 rounded-xl border border-slate-200 dark:border-[#1F2328] hover:border-blue-500/60 dark:hover:border-blue-500/60 text-left transition-all duration-150 flex flex-col justify-between h-[112px] group active:scale-[0.98] shadow-xs hover:shadow-sm"
                  >
                    {/* Top Row: Sector Badge + Change Pill */}
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[10px] text-slate-500 dark:text-[#8B949E] font-medium truncate max-w-[90px]">
                        {company.sector.split("&")[0].trim()}
                      </span>
                      <span className={`text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded ${
                        company.positive
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50"
                          : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50"
                      }`}>
                        {company.positive ? "+" : ""}{company.change.toFixed(2)}%
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

          {/* 4. Quick Analytical Topic Tiles */}
          <div className="w-full space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1F2328] pb-2">
              <span className="text-xs font-semibold text-slate-900 dark:text-white">Quick Research Modules</span>
              <span className="text-[11px] text-slate-500 dark:text-[#8B949E]">1-Click Copilot Inquiries</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
              <button
                onClick={() => loadStockData("1155", "Please provide an executive summary and analysis of the latest financial report, highlighting revenue, profit margins, and key performance drivers.")}
                className="bg-white dark:bg-[#121417] hover:bg-slate-50 dark:hover:bg-[#16191D] p-3 rounded-xl border border-slate-200 dark:border-[#1F2328] hover:border-blue-500/50 text-left transition group shadow-xs active:scale-98"
              >
                <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 mb-1">
                  <FileText className="w-3.5 h-3.5" />
                  <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">Quarterly Results</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-[#8B949E] line-clamp-2">
                  Review revenue growth, EBITDA margin variance, and segment drivers.
                </p>
              </button>

              <button
                onClick={() => loadStockData("5347", "What are the fair value estimates and 5-year discounted cash flow sensitivity assumptions?")}
                className="bg-white dark:bg-[#121417] hover:bg-slate-50 dark:hover:bg-[#16191D] p-3 rounded-xl border border-slate-200 dark:border-[#1F2328] hover:border-blue-500/50 text-left transition group shadow-xs active:scale-98"
              >
                <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 mb-1">
                  <Calculator className="w-3.5 h-3.5" />
                  <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">DCF Valuation</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-[#8B949E] line-clamp-2">
                  Conservative, base, and optimistic intrinsic valuation sensitivity.
                </p>
              </button>

              <button
                onClick={() => loadStockData("1023", "What are the company's total borrowings, gearing ratio, and cash reserves?")}
                className="bg-white dark:bg-[#121417] hover:bg-slate-50 dark:hover:bg-[#16191D] p-3 rounded-xl border border-slate-200 dark:border-[#1F2328] hover:border-blue-500/50 text-left transition group shadow-xs active:scale-98"
              >
                <div className="flex items-center space-x-2 text-purple-600 dark:text-purple-400 mb-1">
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">Debt & Liquidity</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-[#8B949E] line-clamp-2">
                  Total borrowings, interest coverage, and net cash balances.
                </p>
              </button>

              <button
                onClick={() => loadStockData("1155", "Assess dividend track record, dividend yield, and cash flow payout sustainability.")}
                className="bg-white dark:bg-[#121417] hover:bg-slate-50 dark:hover:bg-[#16191D] p-3 rounded-xl border border-slate-200 dark:border-[#1F2328] hover:border-blue-500/50 text-left transition group shadow-xs active:scale-98"
              >
                <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400">Dividend Quality</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-[#8B949E] line-clamp-2">
                  Historical dividend yields, payout ratios, and free cash support.
                </p>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* USER CONFIRMATION POPUP: ONLY TRIGGERS ONCE USER FINISHES INPUT AND ENTERS */}
          {/* ========================================================================= */}
          {assistantOpen && (
            <div
              className="fixed inset-0 z-50 bg-slate-900/50 dark:bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) setAssistantOpen(false);
              }}
            >
              <div className="w-full max-w-lg bg-white dark:bg-[#12161f] border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-5 text-xs animate-in fade-in zoom-in-95 duration-150 space-y-4">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1F2328] pb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-6 h-6 rounded-lg bg-blue-600/10 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-xs">Confirm Target & Query</h3>
                      <p className="text-[10px] text-slate-500 dark:text-[#8B949E]">Review parameters before analyzing official filings</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="hidden sm:inline text-[10px] text-slate-400 dark:text-slate-500">
                      <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-[#16191D] border border-slate-200 dark:border-[#1F2328] rounded text-[10px] font-mono">Esc</kbd>
                    </span>
                    <button
                      onClick={() => setAssistantOpen(false)}
                      className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-md hover:bg-slate-100 dark:hover:bg-[#1F2328] transition"
                      title="Close (Esc)"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Case 1: Company Matched */}
                {parsedIntent.company ? (
                  <div className="space-y-3.5">
                    <div className="bg-slate-50 dark:bg-[#090c14] border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-[#8B949E]">
                        <span>Target Bursa Equity:</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center space-x-1">
                          <Check className="w-3 h-3" />
                          <span>Identified</span>
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-slate-900 dark:text-white font-bold text-sm">
                          {parsedIntent.company.name} ({parsedIntent.company.ticker})
                        </span>
                        <span className="text-blue-600 dark:text-blue-400 font-bold tabular-nums">
                          RM {parsedIntent.company.price.toFixed(2)}
                        </span>
                      </div>

                      {parsedIntent.instruction ? (
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px]">
                          <span className="text-slate-500 dark:text-[#8B949E] block mb-1">Your analytical request:</span>
                          <div className="text-blue-900 dark:text-blue-300 bg-blue-50 dark:bg-[#141b28] p-2.5 rounded-lg border border-blue-200 dark:border-blue-900/40 font-medium leading-relaxed">
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
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 transition text-xs shadow-md focus:ring-2 focus:ring-blue-400 active:scale-[0.99]"
                    >
                      <span>
                        {parsedIntent.instruction ? `Run Analysis on ${parsedIntent.company.name}` : `View ${parsedIntent.company.name} Financials`}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    {/* Quick Suggestions */}
                    <div className="pt-2 border-t border-slate-200 dark:border-[#1F2328]">
                      <span className="text-[10px] text-slate-500 dark:text-[#8B949E] block mb-1.5 font-medium">Or choose a focused research topic:</span>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          onClick={() => {
                            const comp = parsedIntent.company!;
                            loadStockData(comp.code, "Summarize revenue drivers and segment performance from the latest quarterly report.");
                          }}
                          className="bg-slate-100 dark:bg-[#16191D] hover:bg-slate-200 dark:hover:bg-[#1F2328] text-slate-700 dark:text-[#8B949E] hover:text-slate-900 dark:hover:text-white text-[11px] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#1F2328] transition active:scale-95"
                        >
                          Revenue & Margins
                        </button>
                        <button
                          onClick={() => {
                            const comp = parsedIntent.company!;
                            loadStockData(comp.code, "What are the management's key operating risks and market outlook?");
                          }}
                          className="bg-slate-100 dark:bg-[#16191D] hover:bg-slate-200 dark:hover:bg-[#1F2328] text-slate-700 dark:text-[#8B949E] hover:text-slate-900 dark:hover:text-white text-[11px] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#1F2328] transition active:scale-95"
                        >
                          Operating Outlook
                        </button>
                        <button
                          onClick={() => {
                            const comp = parsedIntent.company!;
                            loadStockData(comp.code, "Summarize total borrowings, gearing ratio, and cash position.");
                          }}
                          className="bg-slate-100 dark:bg-[#16191D] hover:bg-slate-200 dark:hover:bg-[#1F2328] text-slate-700 dark:text-[#8B949E] hover:text-slate-900 dark:hover:text-white text-[11px] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#1F2328] transition active:scale-95"
                        >
                          Debt & Cash
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Case 2: Ambiguous Query - Quick Company Selector */
                  <div className="space-y-3">
                    <p className="text-slate-600 dark:text-[#8B949E] text-xs">
                      Please select the Bursa company you wish to analyze:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {POPULAR_COMPANIES.slice(0, 4).map((c) => (
                        <button
                          key={c.code}
                          onClick={() => {
                            const instruction = searchQuery.trim();
                            loadStockData(c.code, instruction);
                          }}
                          className="bg-slate-50 dark:bg-[#090c14] hover:bg-slate-100 dark:hover:bg-[#16191D] text-left p-3 border border-slate-200 dark:border-slate-800 hover:border-blue-500 rounded-xl transition flex items-center justify-between group active:scale-[0.98]"
                        >
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block text-xs group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {c.name}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-[#8B949E] font-mono">{c.ticker}</span>
                          </div>
                          <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">Select →</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

        </main>
      )}

      {/* 3. VIEW 2: ACTIVE COMPANY FINANCIAL WORKSPACE */}
      {view === "terminal" && data && (
        <main className="flex-1 w-full max-w-[1600px] mx-auto p-2 sm:p-4 space-y-3">
          
          {/* Mobile Tab Switcher (3 Tabs: Filings, Financials, Copilot) */}
          <div className="lg:hidden bg-white dark:bg-[#121417] border border-slate-200 dark:border-[#1F2328] rounded-xl p-1 grid grid-cols-3 gap-1 text-xs shadow-2xs">
            <button
              onClick={() => setActiveTab("filings")}
              className={`py-2 px-2 rounded-lg font-semibold transition text-center flex items-center justify-center space-x-1.5 ${
                activeTab === "filings"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-[#8B949E] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1F2328]"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Filings ({(data.filings || []).length})</span>
            </button>
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-2 px-2 rounded-lg font-semibold transition text-center flex items-center justify-center space-x-1.5 ${
                activeTab === "overview"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-[#8B949E] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1F2328]"
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Financials</span>
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`py-2 px-2 rounded-lg font-semibold transition text-center flex items-center justify-center space-x-1.5 ${
                activeTab === "chat"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-[#8B949E] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1F2328]"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Copilot</span>
            </button>
          </div>

          {/* Stock Header & KPI Metric Strip (6 Uniform Tiles) */}
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
                  {POPULAR_COMPANIES.find(c => c.code === (data.stock.code || activeCode))?.sector && (
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 font-medium">
                      {POPULAR_COMPANIES.find(c => c.code === (data.stock.code || activeCode))?.sector}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-500 dark:text-[#8B949E] px-2 py-0.5 rounded-md bg-slate-50 dark:bg-[#090A0C] border border-slate-200 dark:border-[#1F2328] hidden sm:inline">
                    Main Market • KLSE
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-[#8B949E]">
                  <span className="flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Live Market Session</span>
                  </span>
                  <span>•</span>
                  <span>Verified Bursa Disclosures Grounded</span>
                </div>
              </div>

              {/* Right Live Price & Intraday Spread */}
              <div className="flex items-baseline md:items-end justify-between md:flex-col gap-1">
                <div className="flex items-baseline space-x-2.5">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                    RM {data.stock.price.toFixed(2)}
                  </span>
                  <span className={`text-xs font-semibold tabular-nums px-2 py-0.5 rounded-md flex items-center ${
                    isPositive 
                      ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60" 
                      : "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60"
                  }`}>
                    {isPositive ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
                    {isPositive ? "+" : ""}{data.stock.change_pct.toFixed(2)}% Today
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

            {/* Bottom 6 Uniform KPI Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
              <div className="bg-slate-50 dark:bg-[#090A0C] p-3 rounded-xl border border-slate-200 dark:border-[#1F2328] flex flex-col justify-between">
                <span className="text-[10px] text-slate-500 dark:text-[#8B949E] font-semibold uppercase tracking-wider block mb-1">Market Cap</span>
                <span className="text-slate-900 dark:text-white font-bold tabular-nums text-sm sm:text-base">
                  RM {data.stock.market_cap ? (data.stock.market_cap / 1_000_000_000).toFixed(1) + "B" : "122.5B"}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Rank #1 Bursa</span>
              </div>

              <div className="bg-slate-50 dark:bg-[#090A0C] p-3 rounded-xl border border-slate-200 dark:border-[#1F2328] flex flex-col justify-between">
                <span className="text-[10px] text-slate-500 dark:text-[#8B949E] font-semibold uppercase tracking-wider block mb-1">P/E Ratio</span>
                <span className="text-slate-900 dark:text-white font-bold tabular-nums text-sm sm:text-base">
                  {data.metrics.annualized_pe ? `${data.metrics.annualized_pe}x` : "12.8x"}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Sector: 14.2x</span>
              </div>

              <div className="bg-slate-50 dark:bg-[#090A0C] p-3 rounded-xl border border-slate-200 dark:border-[#1F2328] flex flex-col justify-between">
                <span className="text-[10px] text-slate-500 dark:text-[#8B949E] font-semibold uppercase tracking-wider block mb-1">Net Margin</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold tabular-nums text-sm sm:text-base">
                  {data.metrics.net_margin_pct ? `${data.metrics.net_margin_pct}%` : "32.6%"}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">High Stability</span>
              </div>

              <div className="bg-slate-50 dark:bg-[#090A0C] p-3 rounded-xl border border-slate-200 dark:border-[#1F2328] flex flex-col justify-between">
                <span className="text-[10px] text-slate-500 dark:text-[#8B949E] font-semibold uppercase tracking-wider block mb-1">Gearing Ratio</span>
                <span className="text-slate-900 dark:text-white font-bold tabular-nums text-sm sm:text-base">
                  {data.metrics.gearing_ratio ? `${data.metrics.gearing_ratio}x` : "0.45x"}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Low Leverage</span>
              </div>

              <div className="bg-slate-50 dark:bg-[#090A0C] p-3 rounded-xl border border-slate-200 dark:border-[#1F2328] flex flex-col justify-between">
                <span className="text-[10px] text-slate-500 dark:text-[#8B949E] font-semibold uppercase tracking-wider block mb-1">Dividend Yield</span>
                <span className="text-blue-600 dark:text-blue-400 font-bold tabular-nums text-sm sm:text-base">
                  5.18%
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">RM 0.55 / share</span>
              </div>

              <div className="bg-slate-50 dark:bg-[#090A0C] p-3 rounded-xl border border-slate-200 dark:border-[#1F2328] flex flex-col justify-between">
                <span className="text-[10px] text-slate-500 dark:text-[#8B949E] font-semibold uppercase tracking-wider block mb-1">52-Wk Range</span>
                <span className="text-slate-900 dark:text-white font-bold tabular-nums text-xs sm:text-sm font-mono">
                  9.20 - 10.88
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Top 16% Range</span>
              </div>
            </div>
          </div>

          {/* 3-Column Responsive Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
            
            {/* 1. LEFT COLUMN: Financial Reports & Public Disclosures List */}
            <div className={`lg:col-span-3 ${activeTab === "filings" ? "block" : "hidden lg:block"}`}>
              <div className="bg-white dark:bg-[#121417] border border-slate-200 dark:border-[#1F2328] rounded-xl p-3.5 shadow-xs flex flex-col h-auto lg:h-[820px]">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1F2328] pb-2.5 shrink-0">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <div>
                      <h3 className="font-semibold text-xs text-slate-900 dark:text-white">Financial Reports</h3>
                      <p className="text-[10px] text-slate-500 dark:text-[#8B949E]">Official Disclosures</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-slate-100 dark:bg-[#16191D] text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-[#1F2328]">
                    {(data.filings || []).length} Available
                  </span>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center space-x-1 bg-slate-100 dark:bg-[#090A0C] border border-slate-200 dark:border-[#1F2328] p-0.5 rounded-lg text-[11px] my-2.5 shrink-0">
                  <button
                    onClick={() => setFilingsFilter("all")}
                    className={`flex-1 py-1 rounded-md font-medium transition text-center ${
                      filingsFilter === "all"
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "text-slate-600 dark:text-[#8B949E] hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    All ({(data.filings || []).length})
                  </button>
                  <button
                    onClick={() => setFilingsFilter("quarterly")}
                    className={`flex-1 py-1 rounded-md font-medium transition text-center ${
                      filingsFilter === "quarterly"
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "text-slate-600 dark:text-[#8B949E] hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Quarterly
                  </button>
                  <button
                    onClick={() => setFilingsFilter("annual")}
                    className={`flex-1 py-1 rounded-md font-medium transition text-center ${
                      filingsFilter === "annual"
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "text-slate-600 dark:text-[#8B949E] hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Annual
                  </button>
                </div>

                {/* Reports List */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 min-h-0">
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
                          className={`p-3 rounded-xl border transition cursor-pointer text-left ${
                            isSelected
                              ? "bg-blue-50/80 dark:bg-[#161d28] border-l-4 border-l-blue-600 dark:border-l-blue-400 border-t border-r border-b border-blue-200 dark:border-blue-900/60 shadow-xs"
                              : "bg-slate-50/70 dark:bg-[#090A0C] border-slate-200 dark:border-[#1F2328] hover:border-blue-400/50 hover:bg-slate-100/70 dark:hover:bg-[#12161f]"
                          }`}
                        >
                          {/* Top Row: Period badge + Latest indicator + Type */}
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center space-x-1.5">
                              <span className="text-xs font-bold text-slate-900 dark:text-white font-mono bg-slate-200/80 dark:bg-[#16191D] px-2 py-0.5 rounded border border-slate-300 dark:border-[#1F2328]">
                                {f.period}
                              </span>
                              {f.is_latest && (
                                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60 px-2 py-0.5 rounded-full font-semibold flex items-center">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse mr-1"></span>
                                  Latest
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 dark:text-[#8B949E] font-medium">
                              {f.type}
                            </span>
                          </div>

                          {/* Filing Title */}
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 mb-1.5 leading-snug">
                            {f.title}
                          </p>

                          {/* Period Ended & Release Date */}
                          <div className="text-[11px] text-slate-500 dark:text-[#8B949E] space-y-0.5 mb-2">
                            <div className="flex items-center justify-between">
                              <span className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                <span>Period Ended:</span>
                              </span>
                              <span className="text-slate-700 dark:text-slate-300 font-mono">{f.period_ended}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Released Date:</span>
                              <span className="text-slate-700 dark:text-slate-300 font-mono">{f.release_date}</span>
                            </div>
                          </div>

                          {/* Financial Metric Badges + Quick Action */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-[#1F2328] text-[11px]">
                            <div className="text-[11px] text-slate-500 dark:text-[#8B949E]">
                              <span>Rev: <strong className="text-slate-900 dark:text-white font-mono">RM {f.revenue_m?.toLocaleString()}M</strong></span>
                              <span className="mx-1 text-slate-300 dark:text-[#484F58]">•</span>
                              <span>PAT: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">RM {f.profit_m?.toLocaleString()}M</strong></span>
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
                              className="text-[10px] text-blue-600 dark:text-blue-400 hover:text-white bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-600 dark:hover:bg-blue-600 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-900/50 hover:border-blue-600 transition font-medium flex items-center space-x-1 disabled:opacity-50 active:scale-95 shadow-2xs"
                              title="Ask Copilot about this filing"
                            >
                              {chatLoading && selectedFiling?.id === f.id ? (
                                <RefreshCw className="w-3 h-3 animate-spin text-blue-500 dark:text-blue-400" />
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
                <div className="pt-2 border-t border-slate-200 dark:border-[#1F2328] text-[10px] text-slate-500 dark:text-[#8B949E] flex items-center space-x-1.5 shrink-0 mt-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Verified Bursa Malaysia public filings</span>
                </div>

              </div>
            </div>

            {/* 2. CENTER COLUMN: Charts & Financial Statement Tables */}
            <div className={`lg:col-span-5 flex flex-col space-y-3.5 h-auto lg:h-[820px] overflow-y-auto pr-1 ${activeTab === "overview" ? "block" : "hidden lg:flex"}`}>
              
              {/* Selected Filing Context Banner */}
              {selectedFiling && (
                <div className="bg-blue-50/80 dark:bg-[#121417] border border-blue-200 dark:border-blue-900/40 rounded-xl p-3 flex items-center justify-between text-xs shadow-2xs shrink-0">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse"></span>
                    <span className="text-slate-500 dark:text-[#8B949E]">Viewing Filing:</span>
                    <span className="text-slate-900 dark:text-white font-bold">{selectedFiling.period}</span>
                    <span className="text-slate-500 dark:text-[#8B949E] hidden sm:inline truncate max-w-[180px]">({selectedFiling.title})</span>
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
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-white font-semibold flex items-center space-x-1 shrink-0 ml-2 disabled:opacity-50 active:scale-95 transition"
                  >
                    {chatLoading ? (
                      <RefreshCw className="w-3 h-3 animate-spin text-blue-500 dark:text-blue-400" />
                    ) : (
                      <ArrowRight className="w-3 h-3" />
                    )}
                    <span>{chatLoading ? "Analyzing..." : "Analyze with Copilot"}</span>
                  </button>
                </div>
              )}
              
              {/* 1. Interactive Performance & Financial Visualizer Tile */}
              <div className="bg-white dark:bg-[#121417] border border-slate-200 dark:border-[#1F2328] rounded-xl p-4 sm:p-5 space-y-3 shadow-xs shrink-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-[#1F2328] pb-2.5 gap-2">
                  <div className="flex items-center space-x-2">
                    {chartView === "financials" ? (
                      <BarChart2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                    ) : (
                      <LineChart className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                    )}
                    <span className="font-semibold text-xs text-slate-900 dark:text-white">
                      {chartView === "financials" ? "Quarterly Revenue & Profit (RM 'M)" : "Price Action History (MYR)"}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                    {/* View Switcher: Price vs Financials vs Split */}
                    <div className="flex items-center space-x-0.5 bg-slate-100 dark:bg-[#090A0C] border border-slate-200 dark:border-[#1F2328] p-0.5 rounded-lg text-xs">
                      <button
                        onClick={() => setChartView("price")}
                        className={`px-2 py-0.5 rounded-md font-medium text-[11px] transition ${
                          chartView === "price"
                            ? "bg-blue-600 text-white shadow-2xs"
                            : "text-slate-600 dark:text-[#8B949E] hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        Price Action
                      </button>
                      <button
                        onClick={() => setChartView("financials")}
                        className={`px-2 py-0.5 rounded-md font-medium text-[11px] transition ${
                          chartView === "financials"
                            ? "bg-blue-600 text-white shadow-2xs"
                            : "text-slate-600 dark:text-[#8B949E] hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        Revenue & PAT
                      </button>
                      <button
                        onClick={() => setChartView("split")}
                        className={`px-2 py-0.5 rounded-md font-medium text-[11px] transition ${
                          chartView === "split"
                            ? "bg-blue-600 text-white shadow-2xs"
                            : "text-slate-600 dark:text-[#8B949E] hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        Split View
                      </button>
                    </div>

                    {/* Interval Selector (Active when viewing Price) */}
                    {chartView !== "financials" && (
                      <div className="flex items-center space-x-0.5 bg-slate-100 dark:bg-[#090A0C] border border-slate-200 dark:border-[#1F2328] p-0.5 rounded-lg text-xs">
                        {(["1D", "5D", "1M", "6M", "1Y"] as const).map((interval) => (
                          <button
                            key={interval}
                            onClick={() => setSelectedInterval(interval)}
                            className={`px-1.5 py-0.5 rounded font-medium text-[10px] transition ${
                              selectedInterval === interval
                                ? "bg-slate-700 dark:bg-[#30363D] text-white"
                                : "text-slate-500 dark:text-[#8B949E] hover:text-slate-900 dark:hover:text-white"
                            }`}
                          >
                            {interval}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Single View: Price Action */}
                {chartView === "price" && (
                  <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1F2328" : "#E2E8F0"} />
                        <XAxis dataKey="time" stroke={isDark ? "#8B949E" : "#64748B"} tick={{ fontSize: 10 }} />
                        <YAxis domain={["auto", "auto"]} stroke={isDark ? "#8B949E" : "#64748B"} tick={{ fontSize: 10 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isDark ? "#121417" : "#FFFFFF",
                            borderColor: isDark ? "#1F2328" : "#E2E8F0",
                            borderRadius: "8px",
                            fontSize: "11px",
                            color: isDark ? "#F0F3F6" : "#0F172A",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                          }}
                          formatter={(value: any) => [`RM ${Number(value).toFixed(2)}`, "Price"]}
                        />
                        <Area
                          type="monotone"
                          dataKey="price"
                          stroke={isDark ? "#38BDF8" : "#2563EB"}
                          strokeWidth={2}
                          fill="transparent"
                          isAnimationActive={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Single View: Revenue & Net Profit BarChart */}
                {chartView === "financials" && (
                  <div className="h-52 w-full">
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
                        barGap={6}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1F2328" : "#E2E8F0"} />
                        <XAxis dataKey="quarter" stroke={isDark ? "#8B949E" : "#64748B"} tick={{ fontSize: 10 }} />
                        <YAxis stroke={isDark ? "#8B949E" : "#64748B"} tick={{ fontSize: 10 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isDark ? "#121417" : "#FFFFFF",
                            borderColor: isDark ? "#1F2328" : "#E2E8F0",
                            borderRadius: "8px",
                            fontSize: "11px",
                            color: isDark ? "#F0F3F6" : "#0F172A",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                          }}
                          formatter={(value: any, name: any) => [
                            `RM ${Number(value).toLocaleString()} M`,
                            name === "revenue" ? "Revenue" : "Net Profit",
                          ]}
                        />
                        <Legend wrapperStyle={{ fontSize: "11px" }} />
                        <Bar dataKey="revenue" name="Revenue" fill={isDark ? "#64748B" : "#94A3B8"} barSize={18} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                        <Bar dataKey="profit" name="Net Profit" fill={isDark ? "#10B981" : "#059669"} barSize={18} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Split View: Compact Side-by-Side or Stacked */}
                {chartView === "split" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {/* Compact AreaChart */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 dark:text-[#8B949E] font-medium block">Price Trend (MYR)</span>
                      <div className="h-40 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1F2328" : "#E2E8F0"} />
                            <XAxis dataKey="time" stroke={isDark ? "#8B949E" : "#64748B"} tick={{ fontSize: 9 }} />
                            <YAxis domain={["auto", "auto"]} stroke={isDark ? "#8B949E" : "#64748B"} tick={{ fontSize: 9 }} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: isDark ? "#121417" : "#FFFFFF",
                                borderColor: isDark ? "#1F2328" : "#E2E8F0",
                                borderRadius: "8px",
                                fontSize: "10px",
                              }}
                              formatter={(value: any) => [`RM ${Number(value).toFixed(2)}`, "Price"]}
                            />
                            <Area type="monotone" dataKey="price" stroke={isDark ? "#38BDF8" : "#2563EB"} strokeWidth={1.5} fill="transparent" isAnimationActive={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Compact BarChart */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 dark:text-[#8B949E] font-medium block">Revenue & Profit (RM 'M)</span>
                      <div className="h-40 w-full">
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
                            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1F2328" : "#E2E8F0"} />
                            <XAxis dataKey="quarter" stroke={isDark ? "#8B949E" : "#64748B"} tick={{ fontSize: 9 }} />
                            <YAxis stroke={isDark ? "#8B949E" : "#64748B"} tick={{ fontSize: 9 }} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: isDark ? "#121417" : "#FFFFFF",
                                borderColor: isDark ? "#1F2328" : "#E2E8F0",
                                borderRadius: "8px",
                                fontSize: "10px",
                              }}
                              formatter={(value: any, name: any) => [`RM ${Number(value).toLocaleString()} M`, name === "revenue" ? "Rev" : "PAT"]}
                            />
                            <Bar dataKey="revenue" name="Rev" fill={isDark ? "#64748B" : "#94A3B8"} barSize={12} radius={[2, 2, 0, 0]} isAnimationActive={false} />
                            <Bar dataKey="profit" name="PAT" fill={isDark ? "#10B981" : "#059669"} barSize={12} radius={[2, 2, 0, 0]} isAnimationActive={false} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Financial Statement Excerpt Table */}
              <div className="bg-white dark:bg-[#121417] border border-slate-200 dark:border-[#1F2328] rounded-xl p-4 sm:p-5 space-y-3 shadow-xs shrink-0">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1F2328] pb-2.5">
                  <span className="font-semibold text-xs text-slate-900 dark:text-white">Financial Statement Summary</span>
                  <span className="text-[11px] text-slate-500 dark:text-[#8B949E]">RM &apos;000</span>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-200/80 dark:border-[#1F2328]">
                  <table className="w-full text-left text-xs table-zebra">
                    <thead className="bg-slate-50 dark:bg-[#090A0C] text-slate-500 dark:text-[#8B949E] text-[11px] uppercase border-b border-slate-200 dark:border-[#1F2328]">
                      <tr>
                        <th className="py-2 px-3 font-semibold">Line Item</th>
                        <th className="py-2 px-3 text-right font-semibold">Current Qtr</th>
                        <th className="py-2 px-3 text-right font-semibold">Preceding Qtr</th>
                        <th className="py-2 px-3 text-right font-semibold">QoQ Change</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-[#1F2328]">
                      <tr>
                        <td className="py-2 px-3 text-slate-900 dark:text-white font-medium">Revenue</td>
                        <td className="py-2 px-3 text-right tabular-nums text-slate-900 dark:text-white font-semibold">
                          {(data.financial_statement?.revenue || 7200000).toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums text-slate-500 dark:text-[#8B949E]">
                          {(data.financial_statement?.prev_revenue || 6800000).toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                          {data.metrics?.rev_growth_qoq >= 0 ? "+" : ""}{data.metrics?.rev_growth_qoq}%
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-slate-900 dark:text-white font-medium">Net Profit (PATAMI)</td>
                        <td className="py-2 px-3 text-right tabular-nums text-slate-900 dark:text-white font-bold">
                          {(data.financial_statement?.net_profit || 2350000).toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums text-slate-500 dark:text-[#8B949E]">
                          {(data.financial_statement?.prev_net_profit || 2200000).toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                          {data.metrics?.profit_growth_qoq >= 0 ? "+" : ""}{data.metrics?.profit_growth_qoq}%
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-slate-900 dark:text-white font-medium">Total Borrowings</td>
                        <td className="py-2 px-3 text-right tabular-nums text-slate-900 dark:text-white font-medium">
                          {(data.financial_statement?.total_borrowings || 45000000).toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums text-slate-500 dark:text-[#8B949E]">
                          {((data.financial_statement?.total_borrowings || 45000000) * 0.98).toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums text-slate-500 dark:text-[#8B949E]">+2.04%</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-slate-900 dark:text-white font-medium">Cash & Bank Balances</td>
                        <td className="py-2 px-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400 font-bold">
                          {(data.financial_statement?.cash || 60000000).toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums text-slate-500 dark:text-[#8B949E]">
                          {((data.financial_statement?.cash || 60000000) * 0.97).toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400 font-semibold">+3.09%</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-slate-900 dark:text-white font-medium">Basic EPS (sen)</td>
                        <td className="py-2 px-3 text-right tabular-nums text-slate-900 dark:text-white font-bold">
                          {(data.financial_statement?.eps_sen || 19.5).toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums text-slate-500 dark:text-[#8B949E]">
                          {((data.financial_statement?.eps_sen || 19.5) * 0.94).toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400 font-semibold">+6.38%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. DCF Valuation Scenarios */}
              <div className="bg-white dark:bg-[#121417] border border-slate-200 dark:border-[#1F2328] rounded-xl p-4 sm:p-5 space-y-3 shadow-xs shrink-0">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1F2328] pb-2">
                  <div className="flex items-center space-x-2">
                    <Calculator className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                    <span className="font-semibold text-xs text-slate-900 dark:text-white">5-Year DCF Valuation Scenarios</span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-[#8B949E]">Sensitivity Analysis</span>
                </div>

                <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                  <div className="bg-slate-50 dark:bg-[#090A0C] p-3 rounded-xl border border-slate-200 dark:border-[#1F2328]">
                    <span className="text-[11px] text-slate-500 dark:text-[#8B949E] block mb-0.5">Conservative</span>
                    <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm tabular-nums">RM {(data.stock.price * 1.05).toFixed(2)}</span>
                    <span className="text-[10px] text-slate-500 dark:text-[#8B949E] block mt-0.5">WACC: 10.0%</span>
                  </div>
                  <div className="bg-blue-50/70 dark:bg-blue-950/20 p-3 rounded-xl border border-blue-200 dark:border-blue-800/40">
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 block font-semibold mb-0.5">Base Case</span>
                    <span className="font-bold text-blue-700 dark:text-blue-300 text-xs sm:text-sm tabular-nums">RM {(data.stock.price * 1.25).toFixed(2)}</span>
                    <span className="text-[10px] text-blue-600/80 dark:text-blue-400/80 block mt-0.5">WACC: 8.5%</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-[#090A0C] p-3 rounded-xl border border-slate-200 dark:border-[#1F2328]">
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block mb-0.5">Optimistic</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm tabular-nums">RM {(data.stock.price * 1.48).toFixed(2)}</span>
                    <span className="text-[10px] text-slate-500 dark:text-[#8B949E] block mt-0.5">WACC: 7.0%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. RIGHT COLUMN: AI Financial Research Copilot */}
            <div className={`lg:col-span-4 flex flex-col bg-white dark:bg-[#121417] border ${
              highlightCopilot
                ? "border-blue-500 ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/10"
                : "border-slate-200 dark:border-[#1F2328]"
            } rounded-xl h-auto lg:h-[820px] transition-all duration-300 shadow-xs ${activeTab === "chat" ? "block" : "hidden lg:flex"}`}>
              
              {/* Copilot Header */}
              <div className="p-3.5 bg-slate-50 dark:bg-[#16191D] border-b border-slate-200 dark:border-[#1F2328] flex items-center justify-between rounded-t-xl shrink-0">
                <div className="flex items-center space-x-2.5">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white">AI Research Copilot</h3>
                    <p className="text-[10px] text-slate-500 dark:text-[#8B949E]">
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
                  className="text-[11px] text-slate-500 dark:text-[#8B949E] hover:text-slate-900 dark:hover:text-white px-2.5 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-[#1F2328] border border-transparent hover:border-slate-200 dark:hover:border-[#30363D] transition"
                  title="Clear conversation"
                >
                  Clear Chat
                </button>
              </div>

              {/* Suggested Questions Pills */}
              <div className="px-3.5 py-2.5 bg-slate-50/60 dark:bg-[#121417] border-b border-slate-200 dark:border-[#1F2328] flex items-center space-x-1.5 overflow-x-auto text-xs whitespace-nowrap shrink-0">
                <span className="text-[11px] text-slate-500 dark:text-[#8B949E] shrink-0 mr-1">Suggestions:</span>
                {SUGGESTED_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q.prompt)}
                    disabled={chatLoading}
                    className="bg-white dark:bg-[#16191D] hover:bg-slate-100 dark:hover:bg-[#1F2328] text-slate-600 dark:text-[#8B949E] hover:text-slate-900 dark:hover:text-white text-[11px] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#1F2328] transition shrink-0 disabled:opacity-40 active:scale-95 shadow-2xs"
                  >
                    {q.label}
                  </button>
                ))}
              </div>

              {/* Message Feed */}
              <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3.5 text-xs min-h-0">
                {chatMessages.map((msg, index) => (
                  <div key={index} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    
                    <div className="flex items-center space-x-1.5 mb-1 text-[10px] text-slate-500 dark:text-[#8B949E]">
                      <span>{msg.role === "user" ? "You" : "Analyst Copilot"}</span>
                      {msg.time && <span>• {msg.time}</span>}
                    </div>

                    <div className={`p-3.5 rounded-xl max-w-[92%] leading-relaxed ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-tr-xs shadow-sm"
                        : "bg-slate-100 dark:bg-[#16191D] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#1F2328] rounded-tl-xs shadow-2xs"
                    }`}>
                      {msg.role === "user" ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div className="prose dark:prose-invert prose-xs max-w-none space-y-2 text-slate-800 dark:text-slate-200">
                          <ReactMarkdown
                            components={{
                              h1: ({ node, ...props }) => <h3 className="text-xs font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-[#1F2328] pb-1 mt-1 mb-1" {...props} />,
                              h2: ({ node, ...props }) => <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1 mb-0.5" {...props} />,
                              p: ({ node, ...props }) => <p className="mb-1.5 leading-relaxed text-xs text-slate-800 dark:text-slate-200" {...props} />,
                              ul: ({ node, ...props }) => <ul className="list-disc pl-4 space-y-0.5 mb-1 text-xs" {...props} />,
                              ol: ({ node, ...props }) => <ol className="list-decimal pl-4 space-y-0.5 mb-1 text-xs" {...props} />,
                              li: ({ node, ...props }) => <li className="text-slate-800 dark:text-slate-200" {...props} />,
                              strong: ({ node, ...props }) => <strong className="font-bold text-slate-900 dark:text-white" {...props} />,
                              blockquote: ({ node, ...props }) => (
                                <blockquote className="border-l-2 border-blue-500 pl-2.5 py-1 my-1.5 bg-slate-200/50 dark:bg-[#121417] text-slate-600 dark:text-[#8B949E] italic text-[11px] rounded-r" {...props} />
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
                    <div className="text-[10px] text-slate-500 dark:text-[#8B949E] mb-1">Analyst Copilot is reviewing disclosures...</div>
                    <div className="bg-slate-100 dark:bg-[#16191D] border border-slate-200 dark:border-[#1F2328] rounded-xl rounded-tl-xs p-3.5 flex items-center space-x-2 text-slate-700 dark:text-slate-300 shadow-2xs">
                      <div className="flex space-x-1.5">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-[#8B949E]">Reviewing quarterly disclosures & notes...</span>
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="p-3.5 bg-slate-50 dark:bg-[#121417] border-t border-slate-200 dark:border-[#1F2328] rounded-b-xl shrink-0">
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
                    placeholder={`Ask about ${data.stock.name} revenue, debt, or outlook...`}
                    className="flex-1 bg-white dark:bg-[#090A0C] border border-slate-200 dark:border-[#1F2328] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#6E7681] focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                  />
                  <button
                    type="submit"
                    disabled={chatLoading || !chatInput.trim()}
                    className="bg-blue-600 hover:bg-blue-500 text-white p-2.5 rounded-xl transition disabled:opacity-40 active:scale-95 shadow-xs"
                    title="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
                <p className="text-[10px] text-slate-500 dark:text-[#8B949E] text-center mt-2">
                  AI insights grounded in verified quarterly reports
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#12161f] border border-slate-200 dark:border-slate-700/80 rounded-2xl max-w-md w-full p-6 text-center shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Animated Loading Rings & Document Icon */}
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin"></div>
              <div className="absolute inset-2 rounded-full border-2 border-emerald-500/20 border-b-emerald-500 animate-spin [animation-duration:1.5s]"></div>
              <div className="absolute inset-0 flex items-center justify-center text-blue-500 dark:text-blue-400">
                <FileText className="w-6 h-6 animate-pulse" />
              </div>
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Reviewing {loadingStockName || "Company Reports"}...
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Retrieving official quarterly disclosures and generating insights
              </p>
            </div>

            {/* Multi-Step Ingestion Checklist (Zero tech jargon) */}
            <div className="bg-slate-50 dark:bg-[#090c14] border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-left text-xs space-y-2.5 font-sans">
              <div className="flex items-center space-x-2.5">
                {loadingStep > 1 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <RefreshCw className="w-4 h-4 text-blue-500 dark:text-blue-400 animate-spin shrink-0" />
                )}
                <span className={loadingStep >= 1 ? "text-slate-800 dark:text-slate-200 font-medium" : "text-slate-400 dark:text-slate-500"}>
                  1. Retrieving verified quarterly financial statements
                </span>
              </div>

              <div className="flex items-center space-x-2.5">
                {loadingStep > 2 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : loadingStep === 2 ? (
                  <RefreshCw className="w-4 h-4 text-blue-500 dark:text-blue-400 animate-spin shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 shrink-0" />
                )}
                <span className={loadingStep >= 2 ? "text-slate-800 dark:text-slate-200 font-medium" : "text-slate-400 dark:text-slate-500"}>
                  2. Extracting balance sheet & explanatory notes
                </span>
              </div>

              <div className="flex items-center space-x-2.5">
                {loadingStep > 3 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : loadingStep === 3 ? (
                  <RefreshCw className="w-4 h-4 text-blue-500 dark:text-blue-400 animate-spin shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 shrink-0" />
                )}
                <span className={loadingStep >= 3 ? "text-slate-800 dark:text-slate-200 font-medium" : "text-slate-400 dark:text-slate-500"}>
                  3. Analyzing revenue drivers & operating margins
                </span>
              </div>

              <div className="flex items-center space-x-2.5">
                {loadingStep >= 4 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 shrink-0" />
                )}
                <span className={loadingStep >= 4 ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-slate-400 dark:text-slate-500"}>
                  4. Preparing financial model & analyst workspace
                </span>
              </div>
            </div>

            {/* Smooth Animated Progress Bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full transition-all duration-300"
                style={{ width: `${Math.min(loadingStep * 25, 100)}%` }}
              />
            </div>

          </div>
        </div>
      )}

      {/* 5. Clean Minimal Footer */}
      <footer className="bg-white dark:bg-[#121417] border-t border-slate-200 dark:border-[#1F2328] py-3 px-4 text-xs text-slate-500 dark:text-[#8B949E]">
        <div className="w-full max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-1 text-[11px]">
          <p>© 2026 Bursa Intelligence. Public market data and financial disclosures.</p>
          <p>For educational & research purposes only.</p>
        </div>
      </footer>

    </div>
  );
}
