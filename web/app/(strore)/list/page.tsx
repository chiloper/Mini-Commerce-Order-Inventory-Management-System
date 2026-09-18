"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  addToCart,
  getProducts,
  getCategories,
} from "../../../lib/ecommerce-actions";
import type { Product, Category } from "@/types/ecommerce";

export default function ProductListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | number>("all");
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>("default");
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [addingSku, setAddingSku] = useState<string | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false);

  // Active filter count for badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== "all") count++;
    if (inStockOnly) count++;
    if (sortBy !== "default") count++;
    return count;
  }, [selectedCategory, inStockOnly, sortBy]);

  // Lock body scroll when mobile filter sheet is open
  useEffect(() => {
    if (mobileFilterOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileFilterOpen]);

  const loadData = async () => {
    setLoading(true);
    const [prods, cats] = await Promise.all([getProducts(), getCategories()]);
    setProducts((prods || []).filter((p) => p.isActive !== false));
    setCategories(cats || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatPrice = (n: number) => `฿${(n || 0).toLocaleString("th-TH")}`;

  // Filter and Sort products
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // 1. Search filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.catagory?.name?.toLowerCase().includes(q)
      );
    }

    // 2. Category filter
    if (selectedCategory !== "all") {
      list = list.filter((p) => p.catagoryId === Number(selectedCategory));
    }

    // 3. In-stock only filter
    if (inStockOnly) {
      list = list.filter((p) => (p.stock || 0) > 0);
    }

    // 4. Sorting
    if (sortBy === "price-asc") {
      list.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === "price-desc") {
      list.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === "name") {
      list.sort((a, b) => (a.name || "").localeCompare(b.name || "", "th"));
    }

    return list;
  }, [products, search, selectedCategory, inStockOnly, sortBy]);

  const handleAdd = async (product: Product) => {
    if (product.stock === 0) return;
    setAddingSku(product.sku);
    await addToCart(product.id, 1);
    window.dispatchEvent(new Event("cart-updated"));
    window.dispatchEvent(new Event("open-cart"));
    setAddingSku(null);
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 2xl:px-12 py-6 pb-16">
      <div className="flex flex-col md:flex-row items-start gap-8">
        {/* ================================================================= */}
        {/* LEFT SIDEBAR FILTER (Desktop: sticky left rail hugging left edge) */}
        {/* ================================================================= */}
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
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาชื่อสินค้า, SKU..."
                className="w-full bg-transparent border-0 outline-none text-xs sm:text-sm text-text placeholder:text-neutral-600"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
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
                onClick={() => setSelectedCategory("all")}
                className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer text-left ${
                  selectedCategory === "all"
                    ? "bg-accent-100 text-accent-900 border border-accent-200 font-bold"
                    : "text-neutral-800 hover:bg-bg hover:text-text"
                }`}
              >
                <span>ทุกหมวดหมู่</span>
                <span className="text-xs text-neutral-700 font-mono">({products.length})</span>
              </button>
              {categories.map((c) => {
                const count = products.filter(
                  (p) => p.catagoryId === c.id || p.catagory?.id === c.id
                ).length;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCategory(c.id)}
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
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 rounded accent-accent cursor-pointer"
              />
              <span className="font-medium text-neutral-800">เฉพาะสินค้าพร้อมส่ง</span>
            </label>

            {/* Sort by dropdown */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-neutral-800">เรียงตาม:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
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
          {(search || selectedCategory !== "all" || inStockOnly || sortBy !== "default") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedCategory("all");
                setInStockOnly(false);
                setSortBy("default");
              }}
              className="mt-1 w-full py-2 text-xs text-neutral-800 hover:text-rose-700 border border-divider hover:border-rose-300 rounded-xl bg-surface hover:bg-rose-50 transition-colors cursor-pointer text-center font-semibold"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          )}
        </aside>

        {/* ================================================================= */}
        {/* RIGHT MAIN CATALOG                                               */}
        {/* ================================================================= */}
        <main className="flex-1 min-w-0 w-full">
          {/* Mobile Filter Controls Bar (Visible only on < md screens) */}
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
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ค้นหาชื่อสินค้า, SKU..."
                  className="w-full bg-transparent border-0 outline-none text-xs text-text placeholder:text-neutral-600"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="text-xs text-neutral-700 hover:text-text p-0.5 rounded cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </label>

              {/* Mobile Filter Sheet Trigger Button */}
              <button
                type="button"
                onClick={() => setMobileFilterOpen(true)}
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

            {/* Quick Horizontal Scroll Category Chips (1-Tap Switching) */}
            <div
              className="flex items-center gap-1.5 overflow-x-auto pb-1"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap font-medium transition-all shrink-0 cursor-pointer border ${
                  selectedCategory === "all"
                    ? "bg-accent text-white border-accent font-bold shadow-xs"
                    : "bg-surface border-divider text-neutral-800 hover:bg-bg"
                }`}
              >
                ทั้งหมด ({products.length})
              </button>
              {categories.map((c) => {
                const count = products.filter(
                  (p) => p.catagoryId === c.id || p.catagory?.id === c.id
                ).length;
                const isSelected = selectedCategory === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCategory(c.id)}
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

          {/* Catalog Header */}
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4 pb-4 border-b border-divider">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
                {selectedCategory === "all"
                  ? "สินค้าทั้งหมด"
                  : categories.find((c) => c.id === selectedCategory)?.name || "หมวดหมู่สินค้า"}
              </h1>
              <p className="text-xs text-neutral-700 mt-1 font-medium">
                พบสินค้าทั้งหมด {filteredProducts.length} รายการ
              </p>
            </div>
          </div>

          {/* Active Filter Chips (NN/g Heuristic #3 & #7: User Control & Freedom) */}
          {(search || selectedCategory !== "all" || inStockOnly || sortBy !== "default") && (
            <div className="flex items-center gap-2 flex-wrap mb-5">
              <span className="text-xs text-neutral-800 font-semibold">ตัวกรองที่เลือก:</span>

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-surface border border-divider hover:border-rose-400 text-text hover:text-rose-700 transition-colors cursor-pointer"
                >
                  <span>ค้นหา: &quot;{search}&quot;</span>
                  <span className="text-[10px]">✕</span>
                </button>
              )}

              {selectedCategory !== "all" && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory("all")}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-surface border border-divider hover:border-rose-400 text-text hover:text-rose-700 transition-colors cursor-pointer"
                >
                  <span>หมวดหมู่: {categories.find((c) => c.id === selectedCategory)?.name || selectedCategory}</span>
                  <span className="text-[10px]">✕</span>
                </button>
              )}

              {inStockOnly && (
                <button
                  type="button"
                  onClick={() => setInStockOnly(false)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-surface border border-divider hover:border-rose-400 text-text hover:text-rose-700 transition-colors cursor-pointer"
                >
                  <span>เฉพาะพร้อมส่ง</span>
                  <span className="text-[10px]">✕</span>
                </button>
              )}

              {sortBy !== "default" && (
                <button
                  type="button"
                  onClick={() => setSortBy("default")}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-surface border border-divider hover:border-rose-400 text-text hover:text-rose-700 transition-colors cursor-pointer"
                >
                  <span>เรียงตาม: {sortBy === "price-asc" ? "ราคาต่ำ-สูง" : sortBy === "price-desc" ? "ราคาสูง-ต่ำ" : "ชื่อสินค้า"}</span>
                  <span className="text-[10px]">✕</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("all");
                  setInStockOnly(false);
                  setSortBy("default");
                }}
                className="text-xs text-rose-700 hover:underline cursor-pointer ml-1 font-bold"
              >
                ล้างทั้งหมด
              </button>
            </div>
          )}

          {/* Product Cards Grid: Responsively balanced to never crush below 260px */}
          {loading ? (
            <div className="py-24 text-center text-sm text-neutral-800 font-medium">
              กำลังโหลดข้อมูลสินค้า...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-24 text-center rounded-2xl border border-divider bg-surface p-8">
              <p className="text-base font-semibold text-text mb-1">ไม่พบสินค้าตามเงื่อนไขที่ค้นหา</p>
              <p className="text-xs text-neutral-700 mb-4 font-medium">ลองปรับเปลี่ยนคำค้นหา หรือรีเซ็ตตัวกรองด้านซ้าย</p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("all");
                  setInStockOnly(false);
                  setSortBy("default");
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-accent text-white hover:bg-accent-600 cursor-pointer shadow-xs"
              >
                ล้างตัวกรองทั้งหมด
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 min-[1800px]:grid-cols-5 gap-5">
              {filteredProducts.map((p) => {
                const isSoldOut = (p.stock || 0) === 0;

                return (
                  <article
                    key={p.sku || p.id}
                    className="group flex flex-col gap-3 p-3.5 bg-surface rounded-xl border border-divider hover:shadow-md transition-all duration-200"
                  >
                    {/* Product Image */}
                    <Link
                      href={`/product?id=${p.id}`}
                      className="block cursor-pointer overflow-hidden rounded-lg relative"
                    >
                      <div className="relative aspect-[4/3] w-full bg-neutral-200 flex items-center justify-center overflow-hidden">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <span className="text-[10px] tracking-widest uppercase text-neutral-700 font-mono font-semibold">
                            product shot · {p.sku}
                          </span>
                        )}
                      </div>

                      {/* Stock badge overlay */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1 z-10 pointer-events-none">
                        {isSoldOut ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white shadow-xs">
                            สินค้าหมด
                          </span>
                        ) : (p.stock || 0) <= 10 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-neutral-950 shadow-xs border border-amber-500">
                            เหลือ {p.stock} ชิ้น
                          </span>
                        ) : null}
                      </div>
                    </Link>

                    {/* SKU & Price */}
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="text-xs font-mono uppercase text-neutral-800 font-semibold truncate">
                        {p.sku}
                      </div>
                      <span className="text-base font-bold whitespace-nowrap text-text">
                        {formatPrice(p.price)}
                      </span>
                    </div>

                    {/* Title */}
                    <Link
                      href={`/product?id=${p.id}`}
                      className="flex-1 min-w-0 no-underline text-inherit hover:text-accent transition-colors"
                    >
                      <h3
                        className="text-sm font-semibold truncate m-0 text-text"
                        title={p.name}
                      >
                        {p.name}
                      </h3>
                    </Link>

                    {/* Category & Stock Status */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-[11px] font-semibold tracking-wide uppercase text-accent-900 bg-accent-100 border border-accent-200 px-2 py-0.5 rounded">
                        {p.catagory?.name || "สินค้าทั่วไป"}
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          isSoldOut ? "text-rose-700 font-bold" : "text-neutral-800"
                        }`}
                      >
                        {isSoldOut ? "สินค้าหมด" : `คงเหลือ ${p.stock} ชิ้น`}
                      </span>
                    </div>

                    {/* Action Button: ใส่ตะกร้า */}
                    <button
                      type="button"
                      onClick={() => handleAdd(p)}
                      disabled={isSoldOut || addingSku === p.sku}
                      className={`mt-auto w-full min-h-[40px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 ${
                        isSoldOut
                          ? "bg-neutral-200 text-neutral-600 cursor-not-allowed border border-neutral-300 font-medium"
                          : "bg-accent text-white hover:bg-accent-600 active:bg-accent-700 shadow-xs"
                      }`}
                    >
                      {addingSku === p.sku
                        ? "กำลังใส่ตะกร้า..."
                        : isSoldOut
                          ? "สินค้าหมด"
                          : "ใส่ตะกร้า"}
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* ================================================================= */}
      {/* MOBILE FILTER BOTTOM SHEET / MODAL (Progressive Disclosure)      */}
      {/* ================================================================= */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileFilterOpen(false)}
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
                onClick={() => setMobileFilterOpen(false)}
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
                    onClick={() => setSelectedCategory("all")}
                    className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-medium text-left flex items-center justify-between transition-colors ${
                      selectedCategory === "all"
                        ? "bg-accent-100 border-2 border-accent text-accent-900 font-bold"
                        : "bg-bg border border-divider text-neutral-800 hover:bg-surface"
                    }`}
                  >
                    <span>ทุกหมวดหมู่</span>
                    <span className="text-xs text-neutral-700 font-mono">({products.length})</span>
                  </button>
                  {categories.map((c) => {
                    const count = products.filter(
                      (p) => p.catagoryId === c.id || p.catagory?.id === c.id
                    ).length;
                    const isSelected = selectedCategory === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedCategory(c.id)}
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
                    onChange={(e) => setInStockOnly(e.target.checked)}
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
                      onClick={() => setSortBy(s.id)}
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
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("all");
                  setInStockOnly(false);
                  setSortBy("default");
                }}
                className="py-3 px-4 rounded-xl border border-divider bg-surface hover:bg-rose-50 text-neutral-800 hover:text-rose-700 text-xs font-bold transition-colors cursor-pointer"
              >
                ล้างทั้งหมด
              </button>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 py-3 px-4 rounded-xl bg-accent hover:bg-accent-600 active:bg-accent-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer text-center"
              >
                ดูสินค้า ({filteredProducts.length} รายการ)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}