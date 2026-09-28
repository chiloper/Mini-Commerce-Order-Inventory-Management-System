"use client";

import type { Category } from "@/types/ecommerce";

interface ActiveFilterChipsProps {
  search: string;
  onClearSearch: () => void;
  selectedCategory: string | number;
  onClearCategory: () => void;
  categories: Category[];
  inStockOnly: boolean;
  onClearInStock: () => void;
  sortBy: string;
  onClearSort: () => void;
  onClearAll: () => void;
}

export function ActiveFilterChips({
  search,
  onClearSearch,
  selectedCategory,
  onClearCategory,
  categories,
  inStockOnly,
  onClearInStock,
  sortBy,
  onClearSort,
  onClearAll,
}: ActiveFilterChipsProps) {
  const hasFilters =
    Boolean(search) ||
    selectedCategory !== "all" ||
    inStockOnly ||
    sortBy !== "default";

  if (!hasFilters) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap mb-5">
      <span className="text-xs text-neutral-800 font-semibold">ตัวกรองที่เลือก:</span>

      {search && (
        <button
          type="button"
          onClick={onClearSearch}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-surface border border-divider hover:border-rose-400 text-text hover:text-rose-700 transition-colors cursor-pointer"
        >
          <span>ค้นหา: &quot;{search}&quot;</span>
          <span className="text-[10px]">✕</span>
        </button>
      )}

      {selectedCategory !== "all" && (
        <button
          type="button"
          onClick={onClearCategory}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-surface border border-divider hover:border-rose-400 text-text hover:text-rose-700 transition-colors cursor-pointer"
        >
          <span>
            หมวดหมู่: {categories.find((c) => c.id === selectedCategory)?.name || selectedCategory}
          </span>
          <span className="text-[10px]">✕</span>
        </button>
      )}

      {inStockOnly && (
        <button
          type="button"
          onClick={onClearInStock}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-surface border border-divider hover:border-rose-400 text-text hover:text-rose-700 transition-colors cursor-pointer"
        >
          <span>เฉพาะพร้อมส่ง</span>
          <span className="text-[10px]">✕</span>
        </button>
      )}

      {sortBy !== "default" && (
        <button
          type="button"
          onClick={onClearSort}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-surface border border-divider hover:border-rose-400 text-text hover:text-rose-700 transition-colors cursor-pointer"
        >
          <span>
            เรียงตาม:{" "}
            {sortBy === "price-asc"
              ? "ราคาต่ำ-สูง"
              : sortBy === "price-desc"
                ? "ราคาสูง-ต่ำ"
                : "ชื่อสินค้า"}
          </span>
          <span className="text-[10px]">✕</span>
        </button>
      )}

      <button
        type="button"
        onClick={onClearAll}
        className="text-xs text-rose-700 hover:underline cursor-pointer ml-1 font-bold"
      >
        ล้างทั้งหมด
      </button>
    </div>
  );
}
