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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-12">
      {/* Header and Title */}
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-700 mb-1">
          แคตตาล็อกสินค้า
        </p>
        <h2 className="text-3xl font-bold tracking-tight text-text">
          สินค้าทั้งหมด
        </h2>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col gap-3.5 p-4 rounded-xl border border-divider bg-surface shadow-xs mb-8">
        {/* Row 1: Search and Category Pills */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search box */}
          <label className="flex items-center gap-2 w-full sm:w-80 bg-bg border border-divider rounded-lg px-3 py-1.5 focus-within:ring-1 focus-within:ring-accent transition-all">
            <svg
              className="w-4 h-4 opacity-50 shrink-0 text-text"
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
              placeholder="ค้นหาชื่อสินค้า หรือ SKU..."
              className="w-full bg-transparent border-0 outline-none text-xs sm:text-sm text-text placeholder-neutral-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-xs text-neutral-500 hover:text-text p-0.5 rounded cursor-pointer"
              >
                ✕
              </button>
            )}
          </label>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-accent-100 text-accent-800 border-accent font-semibold shadow-xs"
                  : "border-divider hover:bg-bg text-text"
              }`}
            >
              ทุกหมวดหมู่
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategory(c.id)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                  selectedCategory === c.id
                    ? "bg-accent-100 text-accent-800 border-accent font-semibold shadow-xs"
                    : "border-divider hover:bg-bg text-text"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: In-Stock Filter, Sort By, and Counter */}
        <div className="flex items-center justify-between flex-wrap gap-3 pt-3 border-t border-divider">
          <div className="flex items-center gap-4 flex-wrap text-xs sm:text-sm">
            {/* In-stock checkbox */}
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 rounded accent-accent cursor-pointer"
              />
              <span className="text-text font-medium">เฉพาะสินค้าพร้อมส่ง</span>
            </label>

            {/* Sort by dropdown */}
            <div className="inline-flex items-center gap-2">
              <span className="text-neutral-600">เรียงตาม:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs px-2.5 py-1 rounded-md border border-divider bg-bg text-text cursor-pointer outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="default">แนะนำ / ค่าเริ่มต้น</option>
                <option value="price-asc">ราคา: ต่ำไปสูง</option>
                <option value="price-desc">ราคา: สูงไปต่ำ</option>
                <option value="name">ชื่อสินค้า (ก-ฮ)</option>
              </select>
            </div>
          </div>

          <span className="text-xs text-neutral-600 font-medium">
            แสดง {filteredProducts.length} จาก {products.length} รายการ
          </span>
        </div>
      </div>

      {/* Product Cards Grid */}
      {loading ? (
        <div className="py-24 text-center text-sm text-neutral-600">
          กำลังโหลดข้อมูลสินค้า...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-24 text-center text-sm text-neutral-600">
          ไม่พบสินค้าตามเงื่อนไขที่ค้นหา
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
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
                  className="block cursor-pointer overflow-hidden rounded-lg"
                >
                  <div className="relative aspect-[4/3] w-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center overflow-hidden">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <span className="text-[10px] tracking-widest uppercase text-neutral-600 font-mono">
                        product shot · {p.sku}
                      </span>
                    )}
                  </div>
                </Link>

                {/* SKU */}
                <div className="text-[11px] font-mono uppercase text-neutral-600">
                  {p.sku}
                </div>

                {/* Title & Price */}
                <div className="flex items-baseline justify-between gap-2">
                  <Link
                    href={`/product?id=${p.id}`}
                    className="flex-1 min-w-0 no-underline text-inherit hover:text-accent transition-colors"
                  >
                    <h3
                      className="text-sm font-semibold truncate m-0"
                      title={p.name}
                    >
                      {p.name}
                    </h3>
                  </Link>
                  <span className="text-sm font-bold whitespace-nowrap text-text">
                    {formatPrice(p.price)}
                  </span>
                </div>

                {/* Category & Stock Status */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-[11px] font-medium tracking-wide uppercase text-accent-700 bg-accent-100 px-2 py-0.5 rounded">
                    {p.catagory?.name || "สินค้าทั่วไป"}
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      isSoldOut ? "text-rose-500" : "text-neutral-700"
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
                  className={`mt-auto w-full min-h-[38px] px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 cursor-pointer ${
                    isSoldOut
                      ? "bg-neutral-200 text-neutral-400 cursor-not-allowed border border-neutral-300"
                      : "bg-neutral-800 text-white hover:bg-neutral-900 active:scale-[0.98] shadow-xs"
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
    </div>
  );
}