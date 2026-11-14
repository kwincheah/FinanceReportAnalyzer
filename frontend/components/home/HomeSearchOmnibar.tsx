"use client";

import React from "react";
import { Search, Sparkles, X, ChevronRight } from "lucide-react";
import { BursaStockSuggestion } from "../../types/terminal";

interface HomeSearchOmnibarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  showSuggestions: boolean;
  setShowSuggestions: (val: boolean) => void;
  suggestions: BursaStockSuggestion[];
  activeSuggestionIdx: number;
  setActiveSuggestionIdx: (val: number) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onSubmit: (e: React.FormEvent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onSelectSuggestion: (stock: BursaStockSuggestion) => void;
  loading: boolean;
}

export function HomeSearchOmnibar({
  searchQuery,
  setSearchQuery,
  showSuggestions,
  setShowSuggestions,
  suggestions,
  activeSuggestionIdx,
  setActiveSuggestionIdx,
  containerRef,
  onSubmit,
  onKeyDown,
  onSelectSuggestion,
  loading,
}: HomeSearchOmnibarProps) {
  return (
    <div className="w-full max-w-xl relative" ref={containerRef}>
      <form onSubmit={onSubmit} className="relative">
        <div className="relative flex items-center shadow-md hover:shadow-lg transition-shadow rounded-xl">
          <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3.5 text-slate-400 dark:text-[#8B949E]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
              setActiveSuggestionIdx(-1);
            }}
            onFocus={() => {
              if (searchQuery.trim().length > 0) setShowSuggestions(true);
            }}
            onKeyDown={onKeyDown}
            placeholder="Enter company or prompt (e.g. 'Tenaga quarterly revenue')..."
            className="w-full bg-white dark:bg-[#121417] border border-slate-200 dark:border-[#1F2328] hover:border-slate-300 dark:hover:border-[#30363D] focus:border-blue-500 dark:focus:border-blue-500 rounded-xl pl-11 pr-28 py-3.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#6E7681] focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
            autoFocus
          />
          {searchQuery.trim() && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setShowSuggestions(false);
                setActiveSuggestionIdx(-1);
              }}
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

      {/* Autocomplete Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-[#121417] border border-slate-200 dark:border-[#1F2328] rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-[#1F2328]/70 backdrop-blur-md">
          <div className="px-3.5 py-1.5 bg-slate-50 dark:bg-[#16191D] flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-[#8B949E]">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-blue-500" />
              Matching Bursa Equities
            </span>
            <span className="text-[10px] text-slate-400 dark:text-[#6E7681]">↑↓ Navigate • ↵ Select</span>
          </div>
          <ul className="max-h-72 overflow-y-auto py-1">
            {suggestions.map((stock, idx) => {
              const isSelected = idx === activeSuggestionIdx;
              return (
                <li
                  key={stock.code}
                  onMouseEnter={() => setActiveSuggestionIdx(idx)}
                  onClick={() => onSelectSuggestion(stock)}
                  className={`px-3.5 py-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-blue-50/80 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100"
                      : "hover:bg-slate-50 dark:hover:bg-[#16191D] text-slate-800 dark:text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1F2328] text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-[#30363D] shrink-0">
                      {stock.code}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {stock.shortName}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-[#8B949E] font-mono shrink-0">
                          {stock.ticker}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-[#8B949E] truncate">
                        {stock.name}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#1F2328] text-slate-600 dark:text-[#8B949E] border border-slate-200 dark:border-[#30363D]">
                      {stock.sector.split("&")[0].trim()}
                    </span>
                    {stock.price && (
                      <span className="text-xs font-semibold text-slate-900 dark:text-white tabular-nums hidden sm:inline">
                        RM {stock.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <p className="text-[11px] text-slate-500 dark:text-[#8B949E] mt-2 text-center">
        Press <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-[#16191D] border border-slate-200 dark:border-[#1F2328] rounded text-[10px] font-mono text-slate-700 dark:text-slate-300 shadow-2xs">Enter</kbd> to confirm query
      </p>
    </div>
  );
}
