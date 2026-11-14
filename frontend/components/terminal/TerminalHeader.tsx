"use client";

import React from "react";
import { ArrowLeft, Search, Sparkles } from "lucide-react";
import { BursaStockSuggestion } from "../../types/terminal";
import { ThemeSwitch } from "../shared/ThemeSwitch";

interface TerminalHeaderProps {
  onBack: () => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  showHeaderSuggestions: boolean;
  setShowHeaderSuggestions: (val: boolean) => void;
  stockSuggestions: BursaStockSuggestion[];
  activeSuggestionIdx: number;
  setActiveSuggestionIdx: (val: number) => void;
  headerSearchContainerRef: React.RefObject<HTMLDivElement | null>;
  handleSearchSubmit: (e: React.FormEvent) => void;
  handleInputKeyDown: (e: React.KeyboardEvent, isHeader: boolean) => void;
  handleSelectSuggestion: (stock: BursaStockSuggestion) => void;
  loading: boolean;
  theme: "dark" | "light";
  toggleTheme: () => void;
}

export function TerminalHeader({
  onBack,
  searchQuery,
  setSearchQuery,
  showHeaderSuggestions,
  setShowHeaderSuggestions,
  stockSuggestions,
  activeSuggestionIdx,
  setActiveSuggestionIdx,
  headerSearchContainerRef,
  handleSearchSubmit,
  handleInputKeyDown,
  handleSelectSuggestion,
  loading,
  theme,
  toggleTheme,
}: TerminalHeaderProps) {
  return (
    <header className="bg-white dark:bg-[#121417] border-b border-slate-200 dark:border-[#1F2328] sticky top-0 z-40 transition-colors">
      <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Back to Start Page */}
        <button
          onClick={onBack}
          className="bg-slate-100 dark:bg-[#16191D] hover:bg-slate-200 dark:hover:bg-[#1F2328] text-slate-700 dark:text-[#8B949E] hover:text-slate-900 dark:hover:text-[#F0F3F6] px-3 py-1.5 rounded border border-slate-200 dark:border-[#1F2328] flex items-center space-x-1.5 transition text-xs font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Start Page</span>
        </button>

        {/* Quick Switch Stock Search Bar with Autocomplete */}
        <div className="relative flex-1 max-w-md" ref={headerSearchContainerRef}>
          <form onSubmit={handleSearchSubmit} className="flex items-center">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#8B949E]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowHeaderSuggestions(true);
                  setActiveSuggestionIdx(-1);
                }}
                onFocus={() => {
                  if (searchQuery.trim().length > 0) setShowHeaderSuggestions(true);
                }}
                onKeyDown={(e) => handleInputKeyDown(e, true)}
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

          {/* Autocomplete Dropdown */}
          {showHeaderSuggestions && stockSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-[#121417] border border-slate-200 dark:border-[#1F2328] rounded-lg shadow-2xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-[#1F2328]/70 backdrop-blur-md">
              <div className="px-3 py-1 bg-slate-50 dark:bg-[#16191D] flex items-center justify-between text-[10px] font-medium text-slate-500 dark:text-[#8B949E]">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-blue-500" />
                  Switch Stock
                </span>
                <span className="text-[9px] text-slate-400 dark:text-[#6E7681]">↑↓ Navigate • ↵ Select</span>
              </div>
              <ul className="max-h-60 overflow-y-auto py-0.5">
                {stockSuggestions.map((stock, idx) => {
                  const isSelected = idx === activeSuggestionIdx;
                  return (
                    <li
                      key={stock.code}
                      onMouseEnter={() => setActiveSuggestionIdx(idx)}
                      onClick={() => handleSelectSuggestion(stock)}
                      className={`px-3 py-2 flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-blue-50/80 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100"
                          : "hover:bg-slate-50 dark:hover:bg-[#16191D] text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#1F2328] text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-[#30363D] shrink-0">
                          {stock.code}
                        </span>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-medium text-slate-900 dark:text-white truncate">
                            {stock.shortName}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-[#8B949E] truncate">
                            {stock.name}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-[#8B949E] shrink-0 ml-2">
                        {stock.sector.split("&")[0].trim()}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2.5">
          <ThemeSwitch theme={theme} onToggle={toggleTheme} />
          <span className="text-xs text-slate-500 dark:text-[#8B949E] hidden sm:inline font-medium">
            Bursa Malaysia
          </span>
        </div>
      </div>
    </header>
  );
}
