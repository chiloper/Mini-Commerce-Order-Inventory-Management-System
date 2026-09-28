"use client";

import React from "react";

interface InventoryToolbarProps {
  total: number;
  page: number;
  totalPages: number;
  filter: "all" | "low" | "out" | "archived";
  onFilterChange: (f: "all" | "low" | "out" | "archived") => void;
  search: string;
  onSearchChange: (s: string) => void;
  onOpenCreate: () => void;
  onOpenImport: () => void;
  onExportCsv: () => void;
  exporting: boolean;
  loading: boolean;
}

export default function InventoryToolbar({
  total,
  page,
  totalPages,
  filter,
  onFilterChange,
  search,
  onSearchChange,
  onOpenCreate,
  onOpenImport,
  onExportCsv,
  exporting,
  loading,
}: InventoryToolbarProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* Header Row */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-accent-700 font-bold mb-1">
            ทั้งหมด {total.toLocaleString("th-TH")} รายการ {totalPages > 1 && `(หน้า ${page}/${totalPages})`} · จุดสั่งซื้อ 10 ชิ้น
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text m-0">
            สินค้า & สต็อก
          </h2>
        </div>
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          {/* Import Stock and Products Button */}
          <button
            type="button"
            onClick={onOpenImport}
            disabled={loading}
            title="นำเข้าสินค้าและสต็อกผ่านไฟล์ Excel (.xlsx) หรือ CSV (.csv)"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl border border-divider bg-surface hover:bg-bg text-text text-xs sm:text-sm font-bold transition-all shadow-2xs cursor-pointer shrink-0"
          >
            <svg className="w-4 h-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>นำเข้าสินค้า</span>
            <span className="px-1.5 py-0.2 rounded-full bg-accent-100 text-[10px] font-mono text-accent-900 border border-accent-200">
              Excel / CSV
            </span>
          </button>

          {/* Export All Stock to CSV */}
          <button
            type="button"
            onClick={onExportCsv}
            disabled={exporting || loading}
            title="ส่งออกรายการสินค้าและสต็อกทั้งหมดเป็นไฟล์ CSV (รองรับภาษาไทยใน Excel)"
            className="inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl border border-emerald-300/80 bg-emerald-50 text-emerald-800 hover:bg-emerald-100/90 active:scale-95 disabled:opacity-50 disabled:pointer-events-none text-xs sm:text-sm font-bold transition-all shadow-2xs cursor-pointer shrink-0"
          >
            {exporting ? (
              <>
                <svg className="w-4 h-4 animate-spin text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeDasharray="30" strokeDashoffset="10" />
                </svg>
                <span>กำลังส่งออก...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>ส่งออก CSV</span>
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-200/80 text-[10px] font-mono text-emerald-900">
                  ทั้งหมด
                </span>
              </>
            )}
          </button>

          <button
            type="button"
            className="px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-accent hover:bg-accent-600 active:bg-accent-700 !text-white transition-all cursor-pointer shadow-xs shrink-0"
            onClick={onOpenCreate}
          >
            + เพิ่มสินค้าใหม่
          </button>
        </div>
      </div>

      {/* Filter Bar & Search */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Status Segmented Control */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl border border-divider bg-surface shadow-2xs">
            <button
              type="button"
              className={`px-3 py-1.5 text-xs rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                filter === "all"
                  ? "bg-accent text-white shadow-xs"
                  : "text-neutral-700 hover:text-text hover:bg-bg"
              }`}
              onClick={() => onFilterChange("all")}
            >
              ทุกสถานะ
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 text-xs rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                filter === "low"
                  ? "bg-accent text-white shadow-xs"
                  : "text-neutral-700 hover:text-text hover:bg-bg"
              }`}
              onClick={() => onFilterChange("low")}
            >
              ใกล้หมด
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 text-xs rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                filter === "out"
                  ? "bg-accent text-white shadow-xs"
                  : "text-neutral-700 hover:text-text hover:bg-bg"
              }`}
              onClick={() => onFilterChange("out")}
            >
              หมดชั่วคราว
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 text-xs rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                filter === "archived"
                  ? "bg-neutral-800 text-white shadow-xs"
                  : "text-neutral-700 hover:text-text hover:bg-bg"
              }`}
              onClick={() => onFilterChange("archived")}
            >
              Archive
            </button>
          </div>

          {/* Product Search Box */}
          <label className="flex items-center gap-2 w-full sm:w-72 bg-surface border border-divider rounded-xl px-3.5 py-1.5 focus-within:ring-2 focus-within:ring-accent focus-within:border-transparent transition-all shadow-2xs">
            <svg className="w-4 h-4 text-neutral-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <line x1="16.5" y1="16.5" x2="21" y2="21" />
            </svg>
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ค้นหาชื่อสินค้า, SKU, หมวดหมู่..."
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

        <div className="flex items-center gap-2 text-xs text-neutral-700 font-medium">
          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
          <span>แถวไฮไลต์คือ SKU ที่ระดับสต็อกต่ำกว่าจุดสั่งซื้อ (10 ชิ้น)</span>
        </div>
      </div>
    </div>
  );
}
