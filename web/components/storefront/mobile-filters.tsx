"use client";

import { useEffect } from "react";
import type { Category } from "@/types/ecommerce";

interface MobileFilterBarProps {
  search: string;
  onSearchChange: (search: string) => void;
  activeFilterCount: number;
  onOpenFilterSheet: () => void;
  categories: Category[];
  totalProductsCount: number;
  categoryCounts: Record<string | number, number>;
  selectedCategory: string | number;
  onSelectCategory: (id: string | number) => void;
}

export function MobileFilterBar({
  search,
  onSearchChange,
  activeFilterCount,
  onOpenFilterSheet,
  categories,
  totalProductsCount,
  categoryCounts,
  selectedCategory,
  onSelectCategory,
}: MobileFilterBarProps) {
  return (
    <div className="md:hidden flex flex-col gap-3 mb-6">
      <div className="flex items-center gap-2">
        {/* Mobile Search Bar */}
        <label className="flex-1 flex items-center gap-2 bg-surface border border-divider rounded-xl px-3 py-2.5 focus-within:border-accent transition-all shadow-xs">
          <svg
            className="w-4 h-4 text-neutral-600 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="16.5" y1="16.5" x2="21" y2="21" />
          </svg>
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ค้นหาชื่อสินค้า, SKU..."
            className="w-full bg-transparent border-0 outline-none text-xs text-text placeholder:text-neutral-600"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="text-xs text-neutral-700 hover:text-text p-0.5 rounded cursor-pointer"
            >
              ✕
            </button>
          )}
        </label>

        {/* Mobile Filter Sheet Trigger Button */}
        <button
          type="button"
          onClick={onOpenFilterSheet}
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-divider bg-surface text-text hover:bg-bg transition-colors text-xs font-semibold shrink-0 cursor-pointer shadow-xs select-none"
        >
          <svg
            className="w-4 h-4 text-neutral-700"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="4" y1="21" x2="4" y2="14" />
            <line x1="4" y1="10" x2="4" y2="3" />
            <line x1="12" y1="21" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12" y2="3" />
            <line x1="20" y1="21" x2="20" y2="16" />
            <line x1="20" y1="12" x2="20" y2="3" />
            <line x1="1" y1="14" x2="7" y2="14" />
            <line x1="9" y1="8" x2="15" y2="8" />
            <line x1="17" y1="16" x2="23" y2="16" />
          </svg>
          <span>ตัวกรอง</span>
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Quick Horizontal Scroll Category Chips */}
      <div
        className="flex items-center gap-1.5 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <button
          type="button"
          onClick={() => onSelectCategory("all")}
          className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap font-medium transition-all shrink-0 cursor-pointer border ${
            selectedCategory === "all"
              ? "bg-accent text-white border-accent font-bold shadow-xs"
              : "bg-surface border-divider text-neutral-800 hover:bg-bg"
          }`}
        >
          ทั้งหมด ({totalProductsCount})
        </button>
        {categories.map((c) => {
          const count = categoryCounts[c.id] || 0;
          const isSelected = selectedCategory === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelectCategory(c.id)}
              className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap font-medium transition-all shrink-0 cursor-pointer border ${
                isSelected
                  ? "bg-accent text-white border-accent font-bold shadow-xs"
                  : "bg-surface border-divider text-neutral-800 hover:bg-bg"
              }`}
            >
              {c.name} ({count})
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface MobileFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  totalProductsCount: number;
  categoryCounts: Record<string | number, number>;
  selectedCategory: string | number;
  onSelectCategory: (id: string | number) => void;
  inStockOnly: boolean;
  onToggleInStock: (checked: boolean) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  onResetFilters: () => void;
  filteredCount: number;
  activeFilterCount: number;
}

export function MobileFilterSheet({
  isOpen,
  onClose,
  categories,
  totalProductsCount,
  categoryCounts,
  selectedCategory,
  onSelectCategory,
  inStockOnly,
  onToggleInStock,
  sortBy,
  onSortChange,
  onResetFilters,
  filteredCount,
  activeFilterCount,
}: MobileFilterSheetProps) {
  // Lock body scroll when mobile filter sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Bottom Sheet Card */}
      <div className="relative w-full max-h-[85vh] bg-surface rounded-t-3xl border-t border-divider shadow-2xl flex flex-col z-10 overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-divider bg-surface">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-text">ตัวกรอง & จัดเรียงสินค้า</h3>
            {activeFilterCount > 0 && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-accent-100 text-accent-900 border border-accent-200">
                เลือกอยู่ {activeFilterCount} ข้อ
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-bg hover:bg-neutral-300 text-neutral-700 flex items-center justify-center cursor-pointer transition-colors font-bold"
            aria-label="ปิด"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex flex-col gap-5 flex-1 bg-surface">
          {/* Category */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800 mb-2.5">
              หมวดหมู่สินค้า
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onSelectCategory("all")}
                className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-medium text-left flex items-center justify-between transition-colors ${
                  selectedCategory === "all"
                    ? "bg-accent-100 border-2 border-accent text-accent-900 font-bold"
                    : "bg-bg border border-divider text-neutral-800 hover:bg-surface"
                }`}
              >
                <span>ทุกหมวดหมู่</span>
                <span className="text-xs text-neutral-700 font-mono">({totalProductsCount})</span>
              </button>
              {categories.map((c) => {
                const count = categoryCounts[c.id] || 0;
                const isSelected = selectedCategory === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onSelectCategory(c.id)}
                    className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-medium text-left flex items-center justify-between transition-colors ${
                      isSelected
                        ? "bg-accent-100 border-2 border-accent text-accent-900 font-bold"
                        : "bg-bg border border-divider text-neutral-800 hover:bg-surface"
                    }`}
                  >
                    <span className="truncate mr-1">{c.name}</span>
                    <span className="text-xs text-neutral-700 font-mono shrink-0">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status */}
          <div className="border-t border-divider pt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800 mb-2.5">
              สถานะสินค้า
            </h4>
            <label className="flex items-center justify-between min-h-[44px] px-3.5 py-2 bg-bg border border-divider rounded-xl cursor-pointer">
              <span className="text-xs font-semibold text-text">เฉพาะสินค้าพร้อมส่ง</span>
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => onToggleInStock(e.target.checked)}
                className="w-5 h-5 rounded accent-accent cursor-pointer"
              />
            </label>
          </div>

          {/* Sort by */}
          <div className="border-t border-divider pt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800 mb-2.5">
              จัดเรียงลำดับตาม
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "default", label: "แนะนำ / ค่าเริ่มต้น" },
                { id: "price-asc", label: "ราคา: ต่ำไปสูง" },
                { id: "price-desc", label: "ราคา: สูงไปต่ำ" },
                { id: "name", label: "ชื่อสินค้า (ก-ฮ)" },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onSortChange(s.id)}
                  className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-medium text-center transition-colors ${
                    sortBy === s.id
                      ? "bg-accent-100 border-2 border-accent text-accent-900 font-bold"
                      : "bg-bg border border-divider text-neutral-800 hover:bg-surface"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-divider bg-surface flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onResetFilters}
            className="py-3 px-4 rounded-xl border border-divider bg-surface hover:bg-rose-50 text-neutral-800 hover:text-rose-700 text-xs font-bold transition-colors cursor-pointer"
          >
            ล้างทั้งหมด
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl bg-accent hover:bg-accent-600 active:bg-accent-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer text-center"
          >
            ดูสินค้า ({filteredCount} รายการ)
          </button>
        </div>
      </div>
    </div>
  );
}
