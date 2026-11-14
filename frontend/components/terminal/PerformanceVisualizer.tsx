"use client";

import React from "react";
import { LineChart, BarChart2 } from "lucide-react";
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
  Legend,
} from "recharts";
import { HistoricalQuarter } from "../../types/terminal";

interface PerformanceVisualizerProps {
  chartView: "price" | "financials" | "split";
  setChartView: (view: "price" | "financials" | "split") => void;
  selectedInterval: string;
  setSelectedInterval: (interval: string) => void;
  chartData: { time: string; price: number; volume: number }[];
  historicalQuarters: HistoricalQuarter[];
  isDark: boolean;
}

export function PerformanceVisualizer({
  chartView,
  setChartView,
  selectedInterval,
  setSelectedInterval,
  chartData,
  historicalQuarters,
  isDark,
}: PerformanceVisualizerProps) {
  return (
    <div className="bg-white dark:bg-[#121417] border border-slate-200 dark:border-[#1F2328] rounded-xl p-4 sm:p-5 space-y-3 shadow-xs shrink-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-[#1F2328] pb-2.5 gap-2">
        <div className="flex items-center space-x-2">
          {chartView === "financials" ? (
            <BarChart2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          ) : (
            <LineChart className="w-4 h-4 text-blue-500 dark:text-blue-400" />
          )}
          <span className="font-semibold text-xs text-slate-900 dark:text-white">
            {chartView === "financials"
              ? "Quarterly Revenue & Profit (RM 'M)"
              : "Price Action History (MYR)"}
          </span>
        </div>

        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
          {/* View Switcher: Price vs Financials vs Split */}
          <div className="flex items-center space-x-0.5 bg-slate-100 dark:bg-[#090A0C] border border-slate-200 dark:border-[#1F2328] p-0.5 rounded-lg text-xs">
            {(["price", "financials", "split"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setChartView(mode)}
                className={`px-2 py-0.5 rounded-md font-medium text-[11px] transition capitalize ${
                  chartView === mode
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "text-slate-600 dark:text-[#8B949E] hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {mode === "price" ? "Price Action" : mode === "financials" ? "Revenue & PAT" : "Split View"}
              </button>
            ))}
          </div>

          {/* Interval Selector */}
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
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
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
            <BarChart data={historicalQuarters} margin={{ top: 5, right: 5, left: -25, bottom: 0 }} barGap={6}>
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
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                formatter={(value: any, name: any) => [
                  `RM ${Number(value).toLocaleString()} M`,
                  name === "revenue" ? "Revenue" : "Net Profit",
                ]}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Bar
                dataKey="revenue"
                name="Revenue"
                fill={isDark ? "#64748B" : "#94A3B8"}
                barSize={18}
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              />
              <Bar
                dataKey="profit"
                name="Net Profit"
                fill={isDark ? "#10B981" : "#059669"}
                barSize={18}
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Split View */}
      {chartView === "split" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 dark:text-[#8B949E] font-medium block">
              Price Trend (MYR)
            </span>
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
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke={isDark ? "#38BDF8" : "#2563EB"}
                    strokeWidth={1.5}
                    fill="transparent"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 dark:text-[#8B949E] font-medium block">
              Revenue & Profit (RM 'M)
            </span>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={historicalQuarters} margin={{ top: 5, right: 5, left: -25, bottom: 0 }} barGap={4}>
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
                    formatter={(value: any, name: any) => [
                      `RM ${Number(value).toLocaleString()} M`,
                      name === "revenue" ? "Rev" : "PAT",
                    ]}
                  />
                  <Bar
                    dataKey="revenue"
                    name="Rev"
                    fill={isDark ? "#64748B" : "#94A3B8"}
                    barSize={12}
                    radius={[2, 2, 0, 0]}
                    isAnimationActive={false}
                  />
                  <Bar
                    dataKey="profit"
                    name="PAT"
                    fill={isDark ? "#10B981" : "#059669"}
                    barSize={12}
                    radius={[2, 2, 0, 0]}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
