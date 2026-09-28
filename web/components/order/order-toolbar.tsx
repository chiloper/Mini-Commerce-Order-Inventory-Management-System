"use client";

import React from "react";

interface OrderToolbarProps {
  filter: string;
  onFilterChange: (newFilter: string) => void;
  dateRange: string;
  onDateRangeChange: (newRange: string) => void;
  search: string;
  onSearchChange: (val: string) => void;
  total: number;
  page: number;
  totalPages: number;
  exporting: boolean;
  loading: boolean;
  onExportCsv: () => void;
  onOpenCreate: () => void;
}

const STATUS_OPTIONS = [
  { value: "all", label: "ทั้งหมด" },
  { value: "pending", label: "รอชำระ" },
  { value: "processing", label: "กำลังจัดของ" },
  { value: "shipped", label: "จัดส่งแล้ว" },
  { value: "cancelled", label: "ยกเลิก" },
];

const DATE_RANGE_OPTIONS = [
  { value: "all", label: "ทั้งหมด" },
  { value: "1d", label: "1 วัน" },
  { value: "7d", label: "7 วัน" },
  { value: "30d", label: "30 วัน" },
  { value: "1y", label: "1 ปี" },
];

export default function OrderToolbar({
  filter,
  onFilterChange,
  dateRange,
  onDateRangeChange,
  search,
  onSearchChange,
  total,
  page,
  totalPages,
  exporting,
  loading,
  onExportCsv,
  onOpenCreate,
}: OrderToolbarProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Header Row */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-accent-700 font-bold mb-1">
            ทั้งหมด {total.toLocaleString("th-TH")} รายการ {totalPages > 1 && `(หน้า ${page}/${totalPages})`} · อัปเดตล่าสุดวันนี้
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text m-0">
            คำสั่งซื้อ
          </h2>
        </div>

        <button
          type="button"
          onClick={onOpenCreate}
          className="px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-accent hover:bg-accent-600 active:bg-accent-700 !text-white transition-all cursor-pointer shadow-xs shrink-0"
        >
          + สร้างคำสั่งซื้อ
        </button>
      </div>

      {/* 2-Tier Toolbar */}
      <div className="flex flex-col gap-2.5 p-3 rounded-2xl bg-surface border border-divider shadow-2xs">
        {/* Tier 1: Order Status Tabs + Search */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl border border-divider bg-bg/50 overflow-x-auto max-w-full">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`px-3 py-1.5 text-xs rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                  filter === opt.value
                    ? "bg-accent text-white shadow-xs"
                    : "text-neutral-600 hover:text-text hover:bg-bg"
                }`}
                onClick={() => onFilterChange(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <label className="flex items-center gap-2 w-full sm:w-72 bg-bg border border-divider rounded-xl px-3.5 py-1.5 focus-within:ring-2 focus-within:ring-accent focus-within:border-transparent transition-all shadow-2xs">
            <svg className="w-4 h-4 text-neutral-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <line x1="16.5" y1="16.5" x2="21" y2="21" />
            </svg>
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ค้นหาเลขออเดอร์, ชื่อลูกค้า, เบอร์โทร..."
              className="w-full bg-transparent border-0 outline-none text-xs text-text placeholder:text-neutral-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="text-xs text-neutral-500 hover:text-text cursor-pointer p-0.5"
                title="ล้างคำค้นหา"
              >
                ✕
              </button>
            )}
          </label>
        </div>

        {/* Tier 2: Date Range Pills + Filter-Aware CSV Export Button */}
        <div className="flex items-center justify-between gap-3 flex-wrap pt-2 border-t border-divider/60">
          {/* Date Range Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-neutral-600 flex items-center gap-1 shrink-0">
              <svg className="w-3.5 h-3.5 text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>ช่วงเวลา:</span>
            </span>
            <div className="flex items-center gap-1 bg-bg/50 p-0.5 rounded-lg border border-divider">
              {DATE_RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onDateRangeChange(opt.value)}
                  className={`px-2.5 py-1 text-xs rounded-md font-bold transition-all cursor-pointer whitespace-nowrap ${
                    dateRange === opt.value
                      ? "bg-accent text-white shadow-2xs"
                      : "text-neutral-600 hover:text-text hover:bg-bg"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filter-Aware CSV Export Button */}
          <button
            type="button"
            onClick={onExportCsv}
            disabled={exporting || loading}
            title="ส่งออกรายการคำสั่งซื้อตามเงื่อนไขตัวกรองปัจจุบันเป็นไฟล์ CSV (รองรับภาษาไทยใน Excel)"
            className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-xl border border-emerald-300/80 bg-emerald-50 text-emerald-800 hover:bg-emerald-100/90 active:scale-95 disabled:opacity-50 disabled:pointer-events-none text-xs font-bold transition-all shadow-2xs cursor-pointer ml-auto shrink-0"
          >
            {exporting ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeDasharray="30" strokeDashoffset="10" />
                </svg>
                <span>กำลังส่งออก...</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>ส่งออก CSV</span>
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-200/80 text-[10px] font-mono text-emerald-900">
                  {total.toLocaleString("th-TH")} รายการ
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
