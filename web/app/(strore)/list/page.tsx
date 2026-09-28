"use client";

import { useEffect, useState, useMemo } from "react";
import {
  addToCart,
  getProducts,
  getCategories,
} from "../../../lib/ecommerce-actions";
import type { Product, Category } from "@/types/ecommerce";
import { ProductCard } from "@/components/storefront/product-card";
import { FilterSidebar } from "@/components/storefront/filter-sidebar";
import { MobileFilterBar, MobileFilterSheet } from "@/components/storefront/mobile-filters";
import { ActiveFilterChips } from "@/components/storefront/active-filter-chips";

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

  // Active filter count for mobile badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== "all") count++;
    if (inStockOnly) count++;
    if (sortBy !== "default") count++;
    return count;
  }, [selectedCategory, inStockOnly, sortBy]);

  const hasActiveFilters = Boolean(search) || activeFilterCount > 0;

  const resetFilters = () => {
    setSearch("");
    setSelectedCategory("all");
    setInStockOnly(false);
    setSortBy("default");
  };

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

  // Category counts cache for fast rendering
  const categoryCounts = useMemo(() => {
    const counts: Record<string | number, number> = {};
    for (const p of products) {
      const catId = p.catagoryId || p.catagory?.id;
      if (catId) {
        counts[catId] = (counts[catId] || 0) + 1;
      }
    }
    return counts;
  }, [products]);

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
        {/* Desktop Filter Sidebar */}
        <FilterSidebar
          categories={categories}
          totalProductsCount={products.length}
          categoryCounts={categoryCounts}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          inStockOnly={inStockOnly}
          onToggleInStock={setInStockOnly}
          sortBy={sortBy}
          onSortChange={setSortBy}
          search={search}
          onSearchChange={setSearch}
          onResetFilters={resetFilters}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Right Main Catalog */}
        <main className="flex-1 min-w-0 w-full">
          {/* Mobile Filter Controls Bar */}
          <MobileFilterBar
            search={search}
            onSearchChange={setSearch}
            activeFilterCount={activeFilterCount}
            onOpenFilterSheet={() => setMobileFilterOpen(true)}
            categories={categories}
            totalProductsCount={products.length}
            categoryCounts={categoryCounts}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />

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

          {/* Active Filter Chips */}
          <ActiveFilterChips
            search={search}
            onClearSearch={() => setSearch("")}
            selectedCategory={selectedCategory}
            onClearCategory={() => setSelectedCategory("all")}
            categories={categories}
            inStockOnly={inStockOnly}
            onClearInStock={() => setInStockOnly(false)}
            sortBy={sortBy}
            onClearSort={() => setSortBy("default")}
            onClearAll={resetFilters}
          />

          {/* Products Grid */}
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
                onClick={resetFilters}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-accent text-white hover:bg-accent-600 cursor-pointer shadow-xs"
              >
                ล้างตัวกรองทั้งหมด
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 min-[1800px]:grid-cols-5 gap-5">
              {filteredProducts.map((p) => (
                <ProductCard
                  key={p.sku || p.id}
                  product={p}
                  onAddToCart={handleAdd}
                  isAdding={addingSku === p.sku}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filter Bottom Sheet */}
      <MobileFilterSheet
        isOpen={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        categories={categories}
        totalProductsCount={products.length}
        categoryCounts={categoryCounts}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        inStockOnly={inStockOnly}
        onToggleInStock={setInStockOnly}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onResetFilters={resetFilters}
        filteredCount={filteredProducts.length}
        activeFilterCount={activeFilterCount}
      />
    </div>
  );
}
