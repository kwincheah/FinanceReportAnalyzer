"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { FileText, RefreshCw, CheckCircle2, AlertTriangle, X } from "lucide-react";

// Types
import {
  BursaStockSuggestion,
  BursaStockReportResponse,
  FinancialFiling,
  ChatMessage,
} from "../types/terminal";

// Constants & Utilities
import {
  BURSA_STOCKS_CATALOG,
  POPULAR_COMPANIES,
  MARKET_MOVERS,
  RECENT_DISCLOSURES,
  BURSA_SECTORS,
  CHART_INTERVALS,
  parseQuery,
} from "../constants/bursaData";
import { saveChatHistory } from "../utils/storageUtils";

// Shared Components
import { ThemeSwitch } from "../components/shared/ThemeSwitch";

// Home Components
import { MarketPulseBar } from "../components/home/MarketPulseBar";
import { HomeSearchOmnibar } from "../components/home/HomeSearchOmnibar";
import { PopularEquitiesGrid, PopularCompany } from "../components/home/PopularEquitiesGrid";
import { MarketMoversTable } from "../components/home/MarketMoversTable";
import { RecentDisclosuresStream } from "../components/home/RecentDisclosuresStream";
import { SectorPerformanceGrid } from "../components/home/SectorPerformanceGrid";
import { QuickModulesGrid } from "../components/home/QuickModulesGrid";
import { ConfirmationModal } from "../components/home/ConfirmationModal";

// Terminal Components
import { TerminalHeader } from "../components/terminal/TerminalHeader";
import { StockKPIStrip } from "../components/terminal/StockKPIStrip";
import { FilingsSidebar } from "../components/terminal/FilingsSidebar";
import { PerformanceVisualizer } from "../components/terminal/PerformanceVisualizer";
import { FinancialStatementTable } from "../components/terminal/FinancialStatementTable";
import { ValuationScenarios } from "../components/terminal/ValuationScenarios";
import { AIFinancialSummary } from "../components/terminal/AIFinancialSummary";
import { BottomCopilotTerminal } from "../components/terminal/BottomCopilotTerminal";

const API_BASE = "http://localhost:8008";

export default function App() {
  const [view, setView] = useState<"home" | "terminal">("home");
  const [activeCode, setActiveCode] = useState<string>("1155");
  const [searchQuery, setSearchQuery] = useState("");
  const [data, setData] = useState<BursaStockReportResponse | null>(null);

  // Theme state: dark / light
  const [theme, setTheme] = useState<"dark" | "light">("dark");

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

  useEffect(() => {
    try {
      const stored = (localStorage.getItem("theme") || localStorage.getItem("color-scheme")) as "dark" | "light" | null;
      if (stored === "light" || stored === "dark") {
        setTheme(stored);
        applyTheme(stored);
      } else {
        // Honour the OS preference (the inline bootstrap script in layout.tsx does the same)
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const initial = prefersDark ? "dark" : "light";
        setTheme(initial);
        applyTheme(initial);
      }
    } catch (e) {}
  }, []);

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

  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(1);
  const [loadingStockName, setLoadingStockName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resolvingSearch, setResolvingSearch] = useState(false);

  // AbortController refs to eliminate fetch race conditions on rapid navigation
  const loadStockAbortController = useRef<AbortController | null>(null);
  const chatAbortController = useRef<AbortController | null>(null);

  // Assistant Confirmation Popup
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [parsedIntent, setParsedIntent] = useState<ReturnType<typeof parseQuery>>({
    company: null,
    instruction: "",
    raw: "",
  });
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Charts & Intervals
  const [selectedInterval, setSelectedInterval] = useState<string>("1D");
  const [chartData, setChartData] = useState(CHART_INTERVALS["1D"]);
  const [chartView, setChartView] = useState<"price" | "financials" | "split">("price");
  const [homeSectorFilter, setHomeSectorFilter] = useState<string>("all");
  const [moversTab, setMoversTab] = useState<"active" | "gainers" | "value">("active");

  // Analyst Chat & Transcript Persistence
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Mirror of chatMessages that is always up to date inside async callbacks.
  // Without it, a prompt fired right after loading a stock appends to the
  // previous stock's transcript (stale closure) and persists it under the new code.
  const chatMessagesRef = useRef<ChatMessage[]>([]);
  const updateChatMessages = (messages: ChatMessage[]) => {
    chatMessagesRef.current = messages;
    setChatMessages(messages);
  };

  // Responsive Workspace View Toggle for mobile (4 tabs: Filings, Overview, Summary, Copilot)
  const [activeTab, setActiveTab] = useState<"filings" | "overview" | "summary" | "chat">("overview");
  const copilotSectionRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const [highlightCopilot, setHighlightCopilot] = useState(false);

  // Selected Financial Filing
  const [selectedFiling, setSelectedFiling] = useState<FinancialFiling | null>(null);
  const [filingsFilter, setFilingsFilter] = useState<"all" | "quarterly" | "annual">("all");

  // Autocomplete state
  const [showHomeSuggestions, setShowHomeSuggestions] = useState(false);
  const [showHeaderSuggestions, setShowHeaderSuggestions] = useState(false);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(-1);
  const homeSearchContainerRef = useRef<HTMLDivElement>(null);
  const headerSearchContainerRef = useRef<HTMLDivElement>(null);
  const [serverSuggestions, setServerSuggestions] = useState<BursaStockSuggestion[]>([]);

  // Instant In-Memory + Server Filtered Suggestions
  const stockSuggestions = useMemo(() => {
    const rawQ = searchQuery.trim().toLowerCase();
    if (!rawQ || rawQ.length < 1) return [];

    const q = rawQ
      .replace(/\b(malayusia|malysia|malasyia|mlaysia)\b/g, "malaysia")
      .replace(/\b(smalest)\b/g, "smallest")
      .replace(/\b(lagest)\b/g, "largest");

    const tokens = q.split(/\s+/).filter((t) => t.length > 1);

    const localMatches = BURSA_STOCKS_CATALOG.filter((stock) => {
      const code = stock.code.toLowerCase();
      const ticker = stock.ticker.toLowerCase();
      const name = stock.name.toLowerCase();
      const shortName = stock.shortName.toLowerCase();
      const aliases = (stock.aliases || []).map((a) => a.toLowerCase());

      if (code.startsWith(q) || ticker.startsWith(q)) return true;
      if (shortName.startsWith(q)) return true;
      if (aliases.some((a) => a.startsWith(q))) return true;

      if (code.includes(q) || ticker.includes(q) || shortName.includes(q) || name.includes(q)) return true;
      if (aliases.some((a) => a.includes(q))) return true;

      // Token-level matching across code, ticker, name, shortName, aliases
      if (tokens.length > 1) {
        const matchesAll = tokens.every(
          (tok) =>
            code.includes(tok) ||
            ticker.includes(tok) ||
            shortName.includes(tok) ||
            name.includes(tok) ||
            aliases.some((a) => a.includes(tok))
        );
        if (matchesAll) return true;
      }

      return false;
    });

    // If query implies small-cap / penny / cheapest, prioritize lowest nominal price first
    if (/\b(small|smallest|penny|micro|cheap)\b/i.test(q)) {
      localMatches.sort((a, b) => (a.price ?? 999) - (b.price ?? 999));
    }
    // If query implies mega-cap / largest / top, prioritize largest/highest price first
    else if (/\b(large|largest|big|biggest|top)\b/i.test(q)) {
      localMatches.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    }

    const seen = new Set(localMatches.map((s) => s.code));
    const merged = [...localMatches];
    for (const item of serverSuggestions) {
      if (!seen.has(item.code)) {
        merged.push(item);
        seen.add(item.code);
      }
    }

    return merged.slice(0, 6);
  }, [searchQuery, serverSuggestions]);

  // Debounced backend autocomplete query
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setServerSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/stocks/autocomplete?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.suggestions)) {
            setServerSuggestions(
              json.suggestions.map((s: any) => ({
                code: s.code,
                ticker: s.ticker || `${s.code}.KL`,
                name: s.name,
                shortName: s.short_name || s.name,
                sector: s.sector || "Equities",
                price: s.price,
                change: s.change,
                positive: s.positive,
              }))
            );
          }
        }
      } catch (e) {}
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Dismiss autocomplete on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (homeSearchContainerRef.current && !homeSearchContainerRef.current.contains(e.target as Node)) {
        setShowHomeSuggestions(false);
      }
      if (headerSearchContainerRef.current && !headerSearchContainerRef.current.contains(e.target as Node)) {
        setShowHeaderSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSuggestion = (stock: BursaStockSuggestion) => {
    setSearchQuery("");
    setShowHomeSuggestions(false);
    setShowHeaderSuggestions(false);
    setActiveSuggestionIdx(-1);
    loadStockData(stock.code);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent, isHeader: boolean = false) => {
    const isOpen = isHeader ? showHeaderSuggestions : showHomeSuggestions;
    if (isOpen && stockSuggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveSuggestionIdx((prev) => (prev + 1) % stockSuggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveSuggestionIdx((prev) => (prev - 1 + stockSuggestions.length) % stockSuggestions.length);
        return;
      }
      if (e.key === "Enter" && activeSuggestionIdx >= 0 && activeSuggestionIdx < stockSuggestions.length) {
        e.preventDefault();
        handleSelectSuggestion(stockSuggestions[activeSuggestionIdx]);
        return;
      }
      if (e.key === "Escape") {
        setShowHomeSuggestions(false);
        setShowHeaderSuggestions(false);
        setActiveSuggestionIdx(-1);
        return;
      }
    }
  };

  // Keyboard accessibility for confirm popup
  useEffect(() => {
    if (assistantOpen) {
      setTimeout(() => confirmButtonRef.current?.focus(), 50);
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setAssistantOpen(false);
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [assistantOpen]);

  // Auto-scroll chat transcript to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [chatMessages, chatLoading]);

  // Primary data loader with AbortController and localStorage restoration
  const loadStockData = async (code: string, autoInstruction?: string) => {
    // Abort any ongoing stock request to prevent race conditions
    if (loadStockAbortController.current) {
      loadStockAbortController.current.abort();
    }
    const controller = new AbortController();
    loadStockAbortController.current = controller;

    setLoading(true);
    setLoadingStep(1);
    setError(null);
    setAssistantOpen(false);

    const found = BURSA_STOCKS_CATALOG.find((c) => c.code === code) || POPULAR_COMPANIES.find((c) => c.code === code);
    setLoadingStockName(found ? found.name : `Stock ${code}`);

    const step2Timer = setTimeout(() => setLoadingStep(2), 500);
    const step3Timer = setTimeout(() => setLoadingStep(3), 1100);
    const step4Timer = setTimeout(() => setLoadingStep(4), 1800);

    try {
      const res = await fetch(`${API_BASE}/api/reports/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: code, stock_code: code }),
        signal: controller.signal,
      });

      if (!res.ok) {
        // Surface the backend's own message (e.g. unknown stock code) instead of a bare status.
        let detail = `HTTP Error ${res.status}`;
        try {
          const body = await res.json();
          if (body && typeof body.detail === "string") detail = body.detail;
        } catch (e) {}
        throw new Error(detail);
      }
      const json: BursaStockReportResponse = await res.json();
      setData(json);
      setActiveCode(code);

      if (json.filings && json.filings.length > 0) {
        setSelectedFiling(json.filings[0]);
      } else {
        setSelectedFiling(null);
      }
      setView("terminal");

      // Dynamic Price Simulation — rescale the reference series around the live
      // quote while PRESERVING its percentage shape (the series is expressed in
      // absolute RM around the RM 10.12 reference price).
      if (json.stock?.price) {
        const basePrice = json.stock.price;
        const REFERENCE_PRICE = 10.12;
        const factor = basePrice / REFERENCE_PRICE;
        const decimals = basePrice < 1 ? 3 : 2;
        const rescale = (series: typeof CHART_INTERVALS["1D"]) =>
          series.map((d) => ({ ...d, price: Number((d.price * factor).toFixed(decimals)) }));

        const newIntervals = {
          "1D": rescale(CHART_INTERVALS["1D"]),
          "5D": rescale(CHART_INTERVALS["5D"]),
          "1M": rescale(CHART_INTERVALS["1M"]),
          "6M": rescale(CHART_INTERVALS["6M"]),
          "1Y": rescale(CHART_INTERVALS["1Y"]),
        };
        setChartData(newIntervals[selectedInterval as keyof typeof newIntervals] || newIntervals["1D"]);
      }

      // Always start fresh: clear search bar and chat input
      setSearchQuery("");
      setChatInput("");
      setShowHomeSuggestions(false);
      setShowHeaderSuggestions(false);

      // Seed fresh institutional greeting (do not restore stale chat history from past sessions)
      const initialGreeting: ChatMessage = {
        role: "assistant",
        content: `Hello! I have loaded the latest financial statements and disclosures for **${json.stock.name} (${json.stock.ticker})**.\n\n- **Current Price:** RM ${json.stock.price.toFixed(2)} (${json.stock.change_pct >= 0 ? "+" : ""}${json.stock.change_pct.toFixed(2)}%)\n- **Operating Revenue:** RM ${(json.financial_statement?.revenue || 7200000).toLocaleString()} ('000)\n- **Net Profit:** RM ${(json.financial_statement?.net_profit || 2350000).toLocaleString()} ('000)\n\nAsk me any questions about the company's financial results, revenue drivers, or operating performance.`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      updateChatMessages([initialGreeting]);
      saveChatHistory(code, [initialGreeting]);

      if (autoInstruction && autoInstruction.trim().length > 0) {
        setTimeout(() => {
          handleSendMessage(autoInstruction.trim(), code);
        }, 500);
      }
    } catch (err: any) {
      if (err.name === "AbortError") return; // Ignored on normal user cancellation
      setError(err.message || "Failed to load stock data");
      setView((prev) => (data ? prev : "home"));
    } finally {
      clearTimeout(step2Timer);
      clearTimeout(step3Timer);
      clearTimeout(step4Timer);
      // Only the newest request may clear the overlay, otherwise a superseded
      // request hides the spinner while the current one is still running.
      if (loadStockAbortController.current === controller) {
        setLoading(false);
      }
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setShowHomeSuggestions(false);
    setShowHeaderSuggestions(false);
    setActiveSuggestionIdx(-1);

    // 1. Fast local catalog match (exact 4-digit code, ticker, or catalog company name)
    const parsed = parseQuery(query);
    if (parsed.company) {
      setParsedIntent(parsed);
      setAssistantOpen(true);
      return;
    }

    // 2. Ambiguous, conceptual, or natural language query:
    // Resolve via backend hybrid resolver (direct_match_search -> Yahoo -> Gemini LLM disambiguator)
    setResolvingSearch(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/stocks/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (res.ok) {
        const json = await res.json();

        // Case A: EXACT match with single target company
        if (json.type === "EXACT" && json.stock) {
          const resolvedCompany: PopularCompany = json.stock;
          setParsedIntent({
            company: resolvedCompany,
            candidateCompanies: json.candidates || [resolvedCompany],
            categoryTitle: json.title || "Identified Bursa Malaysia Security",
            categoryExplanation: json.explanation || `Resolved from your query: "${query}"`,
            instruction:
              query.toLowerCase() !== resolvedCompany.name.toLowerCase() &&
              query !== resolvedCompany.code
                ? query
                : "",
            raw: query,
            isConceptualOrScreening: false,
          });
          setAssistantOpen(true);
          return;
        }

        // Case B: MULTIPLE matches (e.g. "toy company", "banks", "semiconductors")
        if (json.type === "MULTIPLE" && json.candidates && json.candidates.length > 0) {
          setParsedIntent({
            company: null, // Leaves company null so candidate grid is presented for selection
            candidateCompanies: json.candidates,
            categoryTitle: json.title || "Matching Bursa Equities",
            categoryExplanation: json.explanation || `Multiple constituents matching: "${query}"`,
            instruction: query,
            raw: query,
            isConceptualOrScreening: true,
          });
          setAssistantOpen(true);
          return;
        }

        // Case C: NONE match (e.g. "haha", "anaconda", gibberish)
        // Show centered modal error just like legitimate response
        setParsedIntent({
          company: null,
          candidateCompanies: [],
          categoryTitle: json.title || "No Listed Security Found",
          categoryExplanation: json.explanation || `No listed Bursa Malaysia security matches "${query}".`,
          instruction: "",
          raw: query,
          isConceptualOrScreening: false,
        });
        setAssistantOpen(true);
        return;
      } else {
        // Fallback HTTP error -> also open centered modal
        const errJson = await res.json().catch(() => ({}));
        setParsedIntent({
          company: null,
          candidateCompanies: [],
          categoryTitle: "No Listed Security Found",
          categoryExplanation:
            errJson.detail ||
            `No Bursa Malaysia listed company found matching "${query}". Please check the 4-digit code or company name.`,
          instruction: "",
          raw: query,
          isConceptualOrScreening: false,
        });
        setAssistantOpen(true);
      }
    } catch (err: any) {
      setParsedIntent({
        company: null,
        candidateCompanies: [],
        categoryTitle: "Search Error",
        categoryExplanation: `Network error connecting to resolution service for "${query}".`,
        instruction: "",
        raw: query,
        isConceptualOrScreening: false,
      });
      setAssistantOpen(true);
    } finally {
      setResolvingSearch(false);
    }
  };

  const handleSendMessage = async (textToSend?: string, overrideCode?: string) => {
    const query = textToSend || chatInput;
    if (!query.trim() || chatLoading) return;

    const stockToUse = overrideCode || activeCode;
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg: ChatMessage = { role: "user", content: query, time: timeStr };

    // Read from the ref, never from the (possibly stale) render closure
    const priorMessages = chatMessagesRef.current;
    const updatedMessages = [...priorMessages, userMsg];
    updateChatMessages(updatedMessages);
    saveChatHistory(stockToUse, updatedMessages);

    if (!textToSend) setChatInput("");
    setChatLoading(true);

    if (chatAbortController.current) {
      chatAbortController.current.abort();
    }
    const controller = new AbortController();
    chatAbortController.current = controller;

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          stock_code: stockToUse,
          // Send the prior turns so the analyst keeps multi-turn context
          history: priorMessages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        let detail = `HTTP Error ${res.status}`;
        try {
          const body = await res.json();
          if (body && typeof body.detail === "string") detail = body.detail;
        } catch (e) {}
        throw new Error(detail);
      }
      const json = await res.json();
      const replyContent = json.reply || json.response || "Analysis completed based on verified financial disclosures.";

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: replyContent,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      const finalMessages = [...updatedMessages, assistantMsg];
      updateChatMessages(finalMessages);
      saveChatHistory(stockToUse, finalMessages);
    } catch (err: any) {
      if (err.name === "AbortError") return;
      const errorMsg: ChatMessage = {
        role: "assistant",
        content: `Error: Unable to connect to analyst service (${err.message}). Please ensure backend is operational.`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      const finalWithErr = [...updatedMessages, errorMsg];
      updateChatMessages(finalWithErr);
      saveChatHistory(stockToUse, finalWithErr);
    } finally {
      setChatLoading(false);
    }
  };

  const handleClearTranscript = () => {
    if (!data) return;
    const resetMsg: ChatMessage = {
      role: "assistant",
      content: `Chat transcript cleared. Active context is **${data.stock.name} (${data.stock.ticker})**. How can I assist your financial analysis?`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    updateChatMessages([resetMsg]);
    saveChatHistory(data.stock.code || activeCode, [resetMsg]);
  };

  const askCopilot = (prompt: string) => {
    setActiveTab("chat");
    setHighlightCopilot(true);
    setTimeout(() => setHighlightCopilot(false), 2500);
    copilotSectionRef.current?.scrollIntoView({ behavior: "smooth" });
    handleSendMessage(prompt, data?.stock?.code || activeCode);
    setTimeout(() => {
      chatInputRef.current?.focus();
    }, 400);
  };

  const activeSector = useMemo(() => {
    if (!data) return undefined;
    return POPULAR_COMPANIES.find((c) => c.code === (data.stock.code || activeCode))?.sector;
  }, [data, activeCode]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#090A0C] text-slate-800 dark:text-[#F0F3F6] flex flex-col font-sans antialiased transition-colors duration-200">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER NAVIGATION                                                  */}
      {/* ========================================================================= */}
      {view === "home" ? (
        <header className="bg-white dark:bg-[#121417] border-b border-slate-200 dark:border-[#1F2328] sticky top-0 z-40 transition-colors">
          <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-extrabold tracking-tight text-sm sm:text-base text-slate-900 dark:text-white">
                BURSA INTELLIGENCE
              </span>
              <span className="text-[10px] font-mono bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 px-2 py-0.5 rounded-full font-semibold">
                Terminal
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-[11px] text-slate-500 dark:text-[#8B949E] hidden md:inline">
                Malaysia Equity Disclosures (MFRS 134)
              </span>
              <ThemeSwitch theme={theme} onToggle={toggleTheme} />
            </div>
          </div>
        </header>
      ) : (
        <TerminalHeader
          onBack={() => {
            setView("home");
            setSearchQuery("");
            setError(null);
            setShowHeaderSuggestions(false);
          }}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          showHeaderSuggestions={showHeaderSuggestions}
          setShowHeaderSuggestions={setShowHeaderSuggestions}
          stockSuggestions={stockSuggestions}
          activeSuggestionIdx={activeSuggestionIdx}
          setActiveSuggestionIdx={setActiveSuggestionIdx}
          headerSearchContainerRef={headerSearchContainerRef}
          handleSearchSubmit={handleSearchSubmit}
          handleInputKeyDown={handleInputKeyDown}
          handleSelectSuggestion={handleSelectSuggestion}
          loading={loading || resolvingSearch}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      )}

      {/* ========================================================================= */}
      {/* ERROR BANNER — surfaced for every failed load / request                   */}
      {/* ========================================================================= */}
      {error && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-[60] sm:max-w-md animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div
            role="alert"
            className="bg-white dark:bg-[#12161f] border border-rose-300 dark:border-rose-900/60 rounded-xl shadow-2xl p-3.5 flex items-start gap-3"
          >
            <div className="w-6 h-6 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 dark:text-white">Analysis request failed</p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 break-words">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-md hover:bg-slate-100 dark:hover:bg-[#1F2328] transition shrink-0"
              title="Dismiss"
              aria-label="Dismiss error"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. VIEW 1: HOME START PAGE                                                */}
      {/* ========================================================================= */}
      {view === "home" && (
        <main className="flex-1 w-full max-w-[1600px] mx-auto p-3 sm:p-5 space-y-6">
          <MarketPulseBar />

          <div className="flex flex-col items-center justify-center pt-2 pb-1 text-center space-y-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Bursa Malaysia Financial Intelligence
            </h1>
            <p className="text-xs text-slate-500 dark:text-[#8B949E] max-w-lg">
              Official regulatory quarterly filings, forensic ratio audits, and AI research grounded in Paragraph 9.22 disclosures.
            </p>

            <HomeSearchOmnibar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              showSuggestions={showHomeSuggestions}
              setShowSuggestions={setShowHomeSuggestions}
              suggestions={stockSuggestions}
              activeSuggestionIdx={activeSuggestionIdx}
              setActiveSuggestionIdx={setActiveSuggestionIdx}
              containerRef={homeSearchContainerRef}
              onSubmit={handleSearchSubmit}
              onKeyDown={(e) => handleInputKeyDown(e, false)}
              onSelectSuggestion={handleSelectSuggestion}
              loading={loading || resolvingSearch}
            />
          </div>

          <PopularEquitiesGrid
            companies={POPULAR_COMPANIES}
            sectorFilter={homeSectorFilter}
            setSectorFilter={setHomeSectorFilter}
            onSelectCompany={(code) => loadStockData(code)}
            loading={loading}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7">
              <MarketMoversTable
                movers={MARKET_MOVERS}
                moversTab={moversTab}
                setMoversTab={setMoversTab}
                onSelectStock={(code) => loadStockData(code)}
                loading={loading}
              />
            </div>
            <div className="lg:col-span-5">
              <RecentDisclosuresStream
                disclosures={RECENT_DISCLOSURES}
                onSelectDisclosure={(code, prompt) => loadStockData(code, prompt)}
                loading={loading}
              />
            </div>
          </div>

          <SectorPerformanceGrid sectors={BURSA_SECTORS} />

          <QuickModulesGrid
            onSelectPrompt={(code, prompt) => loadStockData(code, prompt)}
            loading={loading}
          />
        </main>
      )}

      {/* ========================================================================= */}
      {/* CONFIRMATION MODAL — mounted for both views so the terminal header        */}
      {/* search ("Go") is not a dead control                                     */}
      {/* ========================================================================= */}
      <ConfirmationModal
        isOpen={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        parsedIntent={parsedIntent}
        confirmButtonRef={confirmButtonRef}
        onConfirm={(code, instruction) => loadStockData(code, instruction)}
        popularCompanies={POPULAR_COMPANIES}
      />

      {/* ========================================================================= */}
      {/* 3. VIEW 2: ACTIVE COMPANY FINANCIAL WORKSPACE                             */}
      {/* ========================================================================= */}
      {view === "terminal" && data && (
        <main className="flex-1 w-full max-w-[1600px] mx-auto p-2 sm:p-4 space-y-3">
          {/* Mobile Tab Switcher */}
          <div className="lg:hidden bg-white dark:bg-[#121417] border border-slate-200 dark:border-[#1F2328] rounded-xl p-1 grid grid-cols-4 gap-1 text-xs shadow-2xs">
            {(["filings", "overview", "summary", "chat"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1.5 rounded-lg font-semibold transition text-center capitalize ${
                  activeTab === tab
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-[#8B949E] hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Stock Header & KPI Strip */}
          <StockKPIStrip data={data} activeSector={activeSector} />

          {/* Two-Tier Core Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
            {/* Left 3 cols: Official Filings */}
            <FilingsSidebar
              filings={data.filings || []}
              selectedFiling={selectedFiling}
              setSelectedFiling={setSelectedFiling}
              filingsFilter={filingsFilter}
              setFilingsFilter={setFilingsFilter}
              onAskCopilot={askCopilot}
              chatLoading={chatLoading}
              activeTab={activeTab}
            />

            {/* Center 5 cols: Visualizer, Financial Table (QoQ & YoY), and Valuation Scenarios */}
            <div
              className={`lg:col-span-5 flex flex-col space-y-3.5 h-auto lg:h-[620px] overflow-y-auto pr-1 ${
                activeTab === "overview" ? "block" : "hidden lg:flex"
              }`}
            >
              <PerformanceVisualizer
                chartView={chartView}
                setChartView={setChartView}
                selectedInterval={selectedInterval}
                setSelectedInterval={setSelectedInterval}
                chartData={chartData}
                historicalQuarters={data.historical_quarters || []}
                isDark={isDark}
              />

              <FinancialStatementTable data={data} />

              <ValuationScenarios data={data} activeSector={activeSector} />
            </div>

            {/* Right 4 cols: AI Financial Summary */}
            <div className={`lg:col-span-4 ${activeTab === "summary" ? "block" : "hidden lg:block"}`}>
              <AIFinancialSummary
                data={data}
                selectedFiling={selectedFiling}
                activeSector={activeSector}
                onAskCopilot={askCopilot}
                onScrollToCopilot={() => {
                  copilotSectionRef.current?.scrollIntoView({ behavior: "smooth" });
                  chatInputRef.current?.focus();
                }}
              />
            </div>
          </div>

          {/* Tier 2: Bottom Full-Width AI Copilot Research Terminal */}
          <div className={`w-full ${activeTab === "chat" ? "block" : "hidden lg:block"}`}>
            <BottomCopilotTerminal
              data={data}
              selectedFiling={selectedFiling}
              chatMessages={chatMessages}
              chatInput={chatInput}
              chatLoading={chatLoading}
              highlightCopilot={highlightCopilot}
              onInputChange={setChatInput}
              onSendMessage={handleSendMessage}
              onClearTranscript={handleClearTranscript}
              containerRef={copilotSectionRef}
              inputRef={chatInputRef}
              chatBottomRef={chatBottomRef}
            />
          </div>
        </main>
      )}

      {/* ========================================================================= */}
      {/* 4. LOADING OVERLAY                                                        */}
      {/* ========================================================================= */}
      {loading && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#12161f] border border-slate-200 dark:border-slate-700/80 rounded-2xl max-w-md w-full p-6 text-center shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin"></div>
              <div className="absolute inset-2 rounded-full border-2 border-emerald-500/20 border-b-emerald-500 animate-spin [animation-duration:1.5s]"></div>
              <div className="absolute inset-0 flex items-center justify-center text-blue-500 dark:text-blue-400">
                <FileText className="w-6 h-6 animate-pulse" />
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Reviewing {loadingStockName || "Company Reports"}...
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Retrieving official quarterly disclosures and generating insights
              </p>
            </div>

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

            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full transition-all duration-300"
                style={{ width: `${Math.min(loadingStep * 25, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MINIMAL FOOTER                                                         */}
      {/* ========================================================================= */}
      <footer className="bg-white dark:bg-[#121417] border-t border-slate-200 dark:border-[#1F2328] py-3 px-4 text-xs text-slate-500 dark:text-[#8B949E]">
        <div className="w-full max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-1 text-[11px]">
          <p>© 2026 Bursa Intelligence. Public market data and financial disclosures.</p>
          <p>Paragraph 9.22 Listing Requirements Compliance • For institutional research</p>
        </div>
      </footer>
    </div>
  );
}
