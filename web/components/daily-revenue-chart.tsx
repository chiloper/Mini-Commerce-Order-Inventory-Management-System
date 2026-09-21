"use client";

import { useState } from "react";
import type { DailyRevenuePoint } from "@/types/ecommerce";

interface DailyRevenueChartProps {
  data?: DailyRevenuePoint[];
}

export default function DailyRevenueChart({ data = [] }: DailyRevenueChartProps) {
  const [timeframe, setTimeframe] = useState<7 | 14 | 30>(14);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Slice data based on timeframe
  const points = (data && data.length > 0) ? data.slice(-timeframe) : [];

  // Summary statistics
  const totalRevenue = points.reduce((acc, p) => acc + (p.revenue || 0), 0);
  const totalOrders = points.reduce((acc, p) => acc + (p.ordersCount || 0), 0);
  const avgDaily = points.length > 0 ? Math.round(totalRevenue / points.length) : 0;

  const peakPoint = points.reduce<DailyRevenuePoint | null>((max, p) => {
    if (!max || p.revenue > max.revenue) return p;
    return max;
  }, null);

  const formatPrice = (n: number) => `฿${(n || 0).toLocaleString("th-TH")}`;

  // Chart dimensions & scaling
  const chartHeight = 180;
  const paddingBottom = 30;
  const paddingTop = 20;
  const usableHeight = chartHeight - paddingTop - paddingBottom;

  const rawMax = Math.max(...points.map((p) => p.revenue), 1000);
  // Round maxVal up to clean numbers (e.g. 1000, 2000, 5000)
  const maxVal = Math.ceil(rawMax / 1000) * 1000;

  // Generate SVG points
  const totalPoints = points.length;
  const getX = (idx: number) => {
    if (totalPoints <= 1) return 400;
    const paddingX = 40;
    const usableWidth = 800 - paddingX * 2;
    return paddingX + (idx / (totalPoints - 1)) * usableWidth;
  };

  const getY = (val: number) => {
    const ratio = Math.min(1, Math.max(0, val / maxVal));
    return chartHeight - paddingBottom - ratio * usableHeight;
  };

  // Build SVG Path
  const lineCoords = points.map((p, idx) => ({
    x: getX(idx),
    y: getY(p.revenue),
    ...p,
  }));

  let pathD = "";
  let areaD = "";
  if (lineCoords.length > 0) {
    pathD = `M ${lineCoords[0].x} ${lineCoords[0].y}`;
    for (let i = 1; i < lineCoords.length; i++) {
      const prev = lineCoords[i - 1];
      const curr = lineCoords[i];
      const cx = (prev.x + curr.x) / 2;
      pathD += ` C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    const lastX = lineCoords[lineCoords.length - 1].x;
    const firstX = lineCoords[0].x;
    const baselineY = chartHeight - paddingBottom;
    areaD = `${pathD} L ${lastX} ${baselineY} L ${firstX} ${baselineY} Z`;
  }

  const activePoint = hoveredIdx !== null ? lineCoords[hoveredIdx] : null;

  return (
    <div className="flex flex-col gap-4 p-5 sm:p-6 rounded-2xl border border-divider bg-surface shadow-2xs">
      {/* Header with Title and Timeframe Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-divider">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg font-bold text-text">
              กราฟแสดงรายรับต่อวัน
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
              รายรับจริง
            </span>
          </div>
          <p className="text-xs text-neutral-600 mt-0.5">
            แนวโน้มยอดขายและรายรับสุทธิรายวัน ไม่รวมรายการที่ยกเลิก
          </p>
        </div>

        {/* Timeframe Buttons */}
        <div className="flex items-center gap-1 bg-bg p-1 rounded-xl border border-divider self-start sm:self-auto">
          {([7, 14, 30] as const).map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => {
                setTimeframe(days);
                setHoveredIdx(null);
              }}
              className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-all cursor-pointer ${
                timeframe === days
                  ? "bg-accent !text-white shadow-xs"
                  : "text-neutral-700 hover:text-neutral-900 hover:bg-surface"
              }`}
            >
              {days} วัน
            </button>
          ))}
        </div>
      </div>

      {/* 3 Metric Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex flex-col gap-0.5 px-3.5 py-2.5 rounded-xl bg-bg/60 border border-divider">
          <span className="text-[11px] font-medium text-neutral-600">
            ยอดรวมในรอบ {timeframe} วัน
          </span>
          <span className="text-lg font-extrabold text-accent">
            {formatPrice(totalRevenue)}
          </span>
          <span className="text-[11px] text-neutral-500 font-medium">
            รวม {totalOrders} ออเดอร์
          </span>
        </div>

        <div className="flex flex-col gap-0.5 px-3.5 py-2.5 rounded-xl bg-bg/60 border border-divider">
          <span className="text-[11px] font-medium text-neutral-600">
            เฉลี่ยต่อวัน
          </span>
          <span className="text-lg font-extrabold text-text">
            {formatPrice(avgDaily)}
          </span>
          <span className="text-[11px] text-neutral-500 font-medium">
            ต่อ 24 ชั่วโมง
          </span>
        </div>

        <div className="flex flex-col gap-0.5 px-3.5 py-2.5 rounded-xl bg-bg/60 border border-divider">
          <span className="text-[11px] font-medium text-neutral-600">
            วันที่ขายดีที่สุด
          </span>
          <span className="text-lg font-extrabold text-emerald-700">
            {peakPoint && peakPoint.revenue > 0
              ? formatPrice(peakPoint.revenue)
              : "฿0"}
          </span>
          <span className="text-[11px] text-neutral-500 font-medium truncate">
            {peakPoint && peakPoint.revenue > 0
              ? `${peakPoint.dayName} ${peakPoint.label} (${peakPoint.ordersCount} บิล)`
              : "ยังไม่มีรายการ"}
          </span>
        </div>
      </div>

      {/* SVG Chart Container */}
      <div className="relative w-full overflow-hidden pt-2">
        {/* Tooltip Overlay */}
        {activePoint && (
          <div
            className="absolute z-20 pointer-events-none transition-all duration-100 bg-neutral-900/90 text-white text-xs rounded-xl px-3 py-2 shadow-lg backdrop-blur-md border border-white/10"
            style={{
              left: `${Math.min(85, Math.max(15, (activePoint.x / 800) * 100))}%`,
              top: "10px",
              transform: "translateX(-50%)",
            }}
          >
            <div className="font-bold flex items-center gap-1.5 text-neutral-200 border-b border-white/10 pb-1 mb-1">
              <span>{activePoint.dayName} {activePoint.label}</span>
              <span className="text-[10px] text-neutral-400 font-mono">({activePoint.date})</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-neutral-300">รายรับ:</span>
              <span className="font-extrabold text-accent-300">{formatPrice(activePoint.revenue)}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-[11px] text-neutral-400">
              <span>คำสั่งซื้อ:</span>
              <span>{activePoint.ordersCount} บิล</span>
            </div>
          </div>
        )}

        <svg
          viewBox="0 0 800 190"
          className="w-full h-44 sm:h-52 overflow-visible select-none"
        >
          <defs>
            <linearGradient id="revenueAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent, #0088b0)" stopOpacity="0.32" />
              <stop offset="100%" stopColor="var(--color-accent, #0088b0)" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent, #0088b0)" stopOpacity="0.85" />
              <stop offset="100%" stopColor="var(--color-accent, #0088b0)" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Horizontal Gridlines */}
          {[0, 0.33, 0.66, 1].map((ratio, idx) => {
            const y = chartHeight - paddingBottom - ratio * usableHeight;
            const val = Math.round(ratio * maxVal);
            return (
              <g key={idx}>
                <line
                  x1="35"
                  y1={y}
                  x2="770"
                  y2={y}
                  stroke="currentColor"
                  className="text-divider"
                  strokeDasharray={idx === 0 ? "none" : "3,3"}
                  strokeWidth="1"
                />
                <text
                  x="30"
                  y={y + 3}
                  textAnchor="end"
                  className="text-[10px] font-mono fill-neutral-500"
                >
                  {formatPrice(val)}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          {areaD && (
            <path
              d={areaD}
              fill="url(#revenueAreaGrad)"
              className="transition-all duration-300"
            />
          )}

          {/* Smooth Curve Line */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="var(--color-accent, #0088b0)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-300"
            />
          )}

          {/* Interactive Bars & Points */}
          {lineCoords.map((pt, idx) => {
            const isHovered = hoveredIdx === idx;
            const barWidth = Math.max(6, Math.min(24, 700 / totalPoints - 4));
            const barHeight = Math.max(0, chartHeight - paddingBottom - pt.y);

            // Determine if X label should be displayed
            const showLabel =
              totalPoints <= 7
                ? true
                : totalPoints <= 14
                ? idx % 2 === 0 || idx === totalPoints - 1
                : idx % 4 === 0 || idx === totalPoints - 1;

            return (
              <g
                key={pt.date}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Invisible Hover Zone */}
                <rect
                  x={pt.x - barWidth}
                  y={paddingTop}
                  width={barWidth * 2}
                  height={chartHeight - paddingTop}
                  fill="transparent"
                />

                {/* Subtle Column Bar */}
                {pt.revenue > 0 && (
                  <rect
                    x={pt.x - barWidth / 2}
                    y={pt.y}
                    width={barWidth}
                    height={barHeight}
                    rx="3"
                    fill={isHovered ? "var(--color-accent, #0088b0)" : "url(#barGrad)"}
                    className="transition-all duration-150"
                  />
                )}

                {/* Data Point Dot */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 5.5 : pt.revenue > 0 ? 3.5 : 2}
                  className={`transition-all duration-150 ${
                    isHovered
                      ? "fill-white stroke-accent stroke-2"
                      : pt.revenue > 0
                      ? "fill-accent stroke-surface stroke-1.5"
                      : "fill-neutral-300 stroke-transparent"
                  }`}
                />

                {/* X-axis Day Label */}
                {showLabel && (
                  <text
                    x={pt.x}
                    y={chartHeight - paddingBottom + 16}
                    textAnchor="middle"
                    className={`text-[10px] select-none font-medium ${
                      isHovered
                        ? "fill-accent font-bold"
                        : "fill-neutral-500"
                    }`}
                  >
                    {pt.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
