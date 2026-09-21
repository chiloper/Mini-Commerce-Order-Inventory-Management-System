"use client";

import type { Category } from "@/types/ecommerce";

interface FilterSidebarProps {
  categories: Category[];
  totalProductsCount: number;
  categoryCounts: Record<string | number, number>;
  selectedCategory: string | number;
  onSelectCategory: (id: string | number) => void;
  inStockOnly: boolean;
  onToggleInStock: (checked: boolean) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  search: string;
  onSearchChange: (search: string) => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

export function FilterSidebar({
  categories,
  totalProductsCount,
  categoryCounts,
  selectedCategory,
  onSelectCategory,
  inStockOnly,
  onToggleInStock,
  sortBy,
  onSortChange,
  search,
  onSearchChange,
  onResetFilters,
  hasActiveFilters,
}: FilterSidebarProps) {
  return (
    <aside className="hidden md:flex w-64 lg:w-72 shrink-0 md:sticky md:top-20 flex-col gap-6 p-5 rounded-2xl border border-divider bg-surface shadow-xs self-start">
      <div>
        <h3 className="text-base font-bold text-text tracking-tight mb-3">
          ตัวกรองสินค้า
        </h3>

        {/* Search */}
        <label className="flex items-center gap-2 w-full bg-bg border border-divider rounded-xl px-3 py-2 focus-within:border-accent transition-all">
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
            className="w-full bg-transparent border-0 outline-none text-xs sm:text-sm text-text placeholder:text-neutral-600"
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
      </div>

      {/* Categories */}
      <div className="border-t border-divider pt-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800 mb-2.5">
          หมวดหมู่สินค้า
        </h4>
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => onSelectCategory("all")}
            className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer text-left ${
              selectedCategory === "all"
                ? "bg-accent-100 text-accent-900 border border-accent-200 font-bold"
                : "text-neutral-800 hover:bg-bg hover:text-text"
            }`}
          >
            <span>ทุกหมวดหมู่</span>
            <span className="text-xs text-neutral-700 font-mono">({totalProductsCount})</span>
          </button>
          {categories.map((c) => {
            const count = categoryCounts[c.id] || 0;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelectCategory(c.id)}
                className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer text-left ${
                  selectedCategory === c.id
                    ? "bg-accent-100 text-accent-900 border border-accent-200 font-bold"
                    : "text-neutral-800 hover:bg-bg hover:text-text"
                }`}
              >
                <span>{c.name}</span>
                <span className="text-xs text-neutral-700 font-mono">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Availability & Sorting */}
      <div className="border-t border-divider pt-4 flex flex-col gap-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
          สถานะ & การเรียงลำดับ
        </h4>

        {/* In-stock checkbox */}
        <label className="flex items-center gap-2.5 text-xs sm:text-sm text-text cursor-pointer select-none">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => onToggleInStock(e.target.checked)}
            className="w-4 h-4 rounded accent-accent cursor-pointer"
          />
          <span className="font-medium text-neutral-800">เฉพาะสินค้าพร้อมส่ง</span>
        </label>

        {/* Sort by dropdown */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-neutral-800">เรียงตาม:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-divider bg-bg text-text cursor-pointer outline-none focus:border-accent"
          >
            <option value="default">แนะนำ / ค่าเริ่มต้น</option>
            <option value="price-asc">ราคา: ต่ำไปสูง</option>
            <option value="price-desc">ราคา: สูงไปต่ำ</option>
            <option value="name">ชื่อสินค้า (ก-ฮ)</option>
          </select>
        </div>
      </div>

      {/* Reset Filters button if any active */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={onResetFilters}
          className="mt-1 w-full py-2 text-xs text-neutral-800 hover:text-rose-700 border border-divider hover:border-rose-300 rounded-xl bg-surface hover:bg-rose-50 transition-colors cursor-pointer text-center font-semibold"
        >
          ล้างตัวกรองทั้งหมด
        </button>
      )}
    </aside>
  );
}
