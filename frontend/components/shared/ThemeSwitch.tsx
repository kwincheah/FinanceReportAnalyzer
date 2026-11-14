"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";

interface ThemeSwitchProps {
  theme: "dark" | "light";
  onToggle: () => void;
}

export function ThemeSwitch({ theme, onToggle }: ThemeSwitchProps) {
  const isDark = theme === "dark";
  return (
    <button
      onClick={onToggle}
      type="button"
      className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#1F2328] bg-slate-100 dark:bg-[#16191D] hover:bg-slate-200 dark:hover:bg-[#1F2328] text-slate-700 dark:text-[#F0F3F6] transition text-xs font-medium group active:scale-95 shadow-xs"
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
