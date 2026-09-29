"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "../../../components/admin-sidebar";
import ConfirmModal from "../../../components/confirm-modal";
import InventoryToolbar from "../../../components/inventory/inventory-toolbar";
import InventoryTable, { DecoratedProduct } from "../../../components/inventory/inventory-table";
import CreateProductModal from "../../../components/inventory/create-product-modal";
import EditProductModal from "../../../components/inventory/edit-product-modal";
import RefillStockModal from "../../../components/inventory/refill-stock-modal";
import ImportProductModal from "../../../components/inventory/import-product-modal";
import {
  getProducts,
  getPaginatedProducts,
  getCategories,
  updateProductAction,
} from "../../../lib/ecommerce-actions";
import { getSessionUserAction } from "../../../lib/auth/actions";
import type { Product, Category } from "@/types/ecommerce";

export default function AdminInventoryPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "low" | "out" | "archived">("all");
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [exporting, setExporting] = useState<boolean>(false);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [refillProduct, setRefillProduct] = useState<Product | null>(null);

  // In-app Alert Modal
  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    variant: "info" | "warning" | "danger" | "success";
  }>({
    isOpen: false,
    title: "",
    description: "",
    variant: "info",
  });

  const loadData = async (
    targetPage = page,
    targetFilter = filter,
    targetSearch = search
  ) => {
    setLoading(true);
    const [paginated, cats] = await Promise.all([
      getPaginatedProducts({
        page: targetPage,
        limit,
        search: targetSearch,
        stockFilter: targetFilter,
      }),
      categories.length === 0 ? getCategories() : Promise.resolve(categories),
    ]);
    setProducts(paginated.data);
    setPage(paginated.page);
    setTotal(paginated.total);
    setTotalPages(paginated.totalPages);
    if (categories.length === 0 && cats) {
      setCategories(cats);
    }
    setLoading(false);
  };

  useEffect(() => {
    getSessionUserAction().then((u) => {
      if (!u || u.role !== "admin") {
        router.push("/admin/console");
        return;
      }
      loadData(1, filter, search);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const handleFilterChange = (newFilter: "all" | "low" | "out" | "archived") => {
    setFilter(newFilter);
    setPage(1);
    loadData(1, newFilter, search);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    loadData(newPage, filter, search);
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadData(1, filter, search);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Decorate products with stock indicators and status badges
  const decorate = (p: Product): DecoratedProduct => {
    const avail = Math.max(0, (p.stock || 0) - (p.held || 0));
    const isArchived = p.isActive === false;
    const isLow = !isArchived && (p.stock || 0) > 0 && avail <= 10;
    const isOut = !isArchived && (p.stock || 0) === 0;

    let statusLabel = "พร้อมส่ง";
    let statusCls = "bg-emerald-100 text-emerald-900 border border-emerald-300";
    let barColor = "bg-accent";

    if (isArchived) {
      statusLabel = "Archive";
      statusCls = "bg-neutral-800 text-white border border-neutral-700";
      barColor = "bg-neutral-400";
    } else if (isOut) {
      statusLabel = "หมดชั่วคราว";
      statusCls = "bg-neutral-200 text-neutral-800 border border-neutral-300";
      barColor = "bg-neutral-400";
    } else if (isLow) {
      statusLabel = "ใกล้หมด";
      statusCls = "bg-rose-100 text-rose-900 border border-rose-300";
      barColor = "bg-rose-500";
    }

    const barW = Math.min(100, Math.round(((p.stock || 0) / 50) * 100)) + "%";

    return {
      ...p,
      avail,
      isArchived,
      isLow,
      isOut,
      statusLabel,
      statusCls,
      barW,
      barColor,
      rowBg: isArchived ? "opacity-75 bg-neutral-100/40" : isLow ? "bg-rose-50/50" : "",
    };
  };

  const decoratedProducts: DecoratedProduct[] = products.map(decorate);

  // Handle Export All Stock to CSV (With UTF-8 BOM)
  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const allProducts = await getProducts();

      if (!allProducts || allProducts.length === 0) {
        setAlertConfig({
          isOpen: true,
          title: "ไม่พบข้อมูลสินค้า",
          description: "ไม่พบข้อมูลสินค้าในระบบสำหรับการส่งออกไฟล์ CSV",
          variant: "warning",
        });
        setExporting(false);
        return;
      }

      const escapeCsv = (val: unknown) => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      const headers = [
        "รหัสสินค้า (SKU)",
        "ชื่อสินค้า",
        "หมวดหมู่",
        "ราคาขาย (บาท)",
        "สต็อกคงเหลือ",
        "จองไว้",
        "พร้อมส่ง",
        "สถานะสต็อก",
        "สถานะการขาย",
        "รหัสระบบ (ID)",
      ];

      const rows = allProducts.map((p) => {
        const dec = decorate(p);
        const catName = p.catagory?.name || p.category?.name || "ทั่วไป";
        const saleStatus = p.isActive ? "เปิดขาย" : "ปิดการขาย";

        return [
          escapeCsv(p.sku),
          escapeCsv(p.name),
          escapeCsv(catName),
          escapeCsv(p.price),
          escapeCsv(p.stock || 0),
          escapeCsv(p.held || 0),
          escapeCsv(dec.avail),
          escapeCsv(dec.statusLabel),
          escapeCsv(saleStatus),
          escapeCsv(p.id),
        ].join(",");
      });

      const csvContent = "\uFEFF" + [headers.map(escapeCsv).join(","), ...rows].join("\r\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const dateStr = new Date().toISOString().slice(0, 10);
      link.setAttribute("href", url);
      link.setAttribute("download", `stock_inventory_all_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export Stock CSV error:", err);
      setAlertConfig({
        isOpen: true,
        title: "เกิดข้อผิดพลาด",
        description: "เกิดข้อผิดพลาดในการส่งออกไฟล์ CSV กรุณาลองใหม่อีกครั้ง",
        variant: "danger",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleRefillStock = async (productId: number, newStock: number) => {
    await updateProductAction(productId, { stock: newStock });
    await loadData(page, filter, search);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-bg text-text">
      {/* Sidebar Navigation */}
      <AdminSidebar />

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
          {/* Modular Toolbar */}
          <InventoryToolbar
            total={total}
            page={page}
            totalPages={totalPages}
            filter={filter}
            onFilterChange={handleFilterChange}
            search={search}
            onSearchChange={setSearch}
            onOpenCreate={() => setShowCreateModal(true)}
            onOpenImport={() => setShowImportModal(true)}
            onExportCsv={handleExportCsv}
            exporting={exporting}
            loading={loading}
          />

          {/* Modular Table */}
          <InventoryTable
            products={decoratedProducts}
            loading={loading}
            search={search}
            page={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={handlePageChange}
            onOpenEdit={setEditProduct}
            onOpenRefill={setRefillProduct}
          />
        </main>

      {/* Modular Create Product Modal */}
      <CreateProductModal
        isOpen={showCreateModal}
        categories={categories}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => loadData(1, filter, search)}
      />

      {/* Modular Import Product Modal (Excel / CSV) */}
      <ImportProductModal
        isOpen={showImportModal}
        categories={categories}
        existingProducts={products}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => loadData(1, filter, search)}
      />

      {/* Modular Edit Product Modal (With custom in-app confirms for Archive & Delete) */}
      <EditProductModal
        product={editProduct}
        categories={categories}
        onClose={() => setEditProduct(null)}
        onSuccess={() => loadData(page, filter, search)}
      />

      {/* Modular Quick Refill Modal */}
      <RefillStockModal
        product={refillProduct}
        onClose={() => setRefillProduct(null)}
        onRefill={handleRefillStock}
      />

      {/* In-app Alert Modal (Replaces browser alert) */}
      <ConfirmModal
        isOpen={alertConfig.isOpen}
        title={alertConfig.title}
        description={alertConfig.description}
        confirmText="ตกลง"
        cancelText={null}
        variant={alertConfig.variant}
        onConfirm={() => setAlertConfig((prev) => ({ ...prev, isOpen: false }))}
        onCancel={() => setAlertConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}