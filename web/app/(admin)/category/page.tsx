"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "../../../components/admin-sidebar";
import ConfirmModal from "../../../components/confirm-modal";
import CategoryTable from "../../../components/category/category-table";
import CreateCategoryModal from "../../../components/category/create-category-modal";
import EditCategoryModal from "../../../components/category/edit-category-modal";
import { getCategories, deleteCategoryAction } from "../../../lib/ecommerce-actions";
import { getSessionUserAction } from "../../../lib/auth/actions";
import { getCachedUser, setCachedUser } from "../../../lib/auth/auth-state";
import type { Category } from "@/types/ecommerce";

export default function AdminCategoryPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);

  // Confirm / Alert Modal
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: React.ReactNode;
    confirmText?: string;
    cancelText?: string | null;
    variant: "info" | "warning" | "danger" | "success";
    isLoading?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    variant: "info",
    onConfirm: () => {},
  });

  const loadData = async () => {
    setLoading(true);
    const cats = await getCategories();
    setCategories(cats || []);
    setLoading(false);
  };

  useEffect(() => {
    const cached = getCachedUser();
    if (cached && cached.role === "admin") {
      loadData();
    }

    getSessionUserAction().then((u) => {
      if (!u || u.role !== "admin") {
        setCachedUser(null);
        router.push("/admin/console");
        return;
      }
      setCachedUser(u);
      if (!cached || cached.role !== "admin") {
        loadData();
      }
    });
  }, [router]);

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.trim().toLowerCase();
    return categories.filter((c) => c.name?.toLowerCase().includes(q));
  }, [categories, search]);

  const handleDeletePrompt = (cat: Category) => {
    const productCount = cat._count?.products || 0;

    setConfirmConfig({
      isOpen: true,
      title: "ยืนยันการลบหมวดหมู่สินค้า",
      description: (
        <span>
          คุณต้องการลบหมวดหมู่ <strong>&quot;{cat.name}&quot;</strong> ใช่หรือไม่?
          {productCount > 0 && (
            <span className="block mt-2 text-rose-700 font-semibold">
              * คำเตือน: ปัจจุบันมีสินค้า {productCount} รายการผูกอยู่กับหมวดหมู่นี้ หากลบ สินค้าเหล่านี้จะกลายเป็นสินค้าไม่มีหมวดหมู่
            </span>
          )}
        </span>
      ),
      confirmText: "ลบหมวดหมู่",
      cancelText: "ยกเลิก",
      variant: "danger",
      isLoading: false,
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, isLoading: true }));
        const res = await deleteCategoryAction(cat.id);
        if (res.ok) {
          setConfirmConfig((prev) => ({ ...prev, isOpen: false, isLoading: false }));
          await loadData();
        } else {
          setConfirmConfig({
            isOpen: true,
            title: "เกิดข้อผิดพลาด",
            description: res.error || "ไม่สามารถลบหมวดหมู่ได้",
            confirmText: "ตกลง",
            cancelText: null,
            variant: "danger",
            isLoading: false,
            onConfirm: () => setConfirmConfig((prev) => ({ ...prev, isOpen: false })),
          });
        }
      },
    });
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-bg text-text">
      {/* Sidebar Navigation */}
      <AdminSidebar />

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
        {/* Header Toolbar */}
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-accent-700 font-bold mb-1">
              หมวดหมู่สินค้าทั้งหมด {categories.length.toLocaleString("th-TH")} หมวด
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text m-0">
              หมวดหมู่สินค้า (Categories)
            </h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-accent hover:bg-accent-600 active:bg-accent-700 !text-white transition-all cursor-pointer shadow-xs shrink-0 flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>+ เพิ่มหมวดหมู่ใหม่</span>
            </button>
          </div>
        </div>

        {/* Search Filter Bar */}
        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 w-full sm:w-80 bg-surface border border-divider rounded-xl px-3.5 py-2 focus-within:ring-2 focus-within:ring-accent focus-within:border-transparent transition-all shadow-2xs">
            <svg className="w-4 h-4 text-neutral-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <line x1="16.5" y1="16.5" x2="21" y2="21" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อหมวดหมู่สินค้า..."
              className="w-full bg-transparent border-0 outline-none text-xs sm:text-sm text-text placeholder:text-neutral-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-xs text-neutral-400 hover:text-text cursor-pointer p-0.5 rounded"
              >
                ✕
              </button>
            )}
          </label>
        </div>

        {/* Category Table */}
        <CategoryTable
          categories={filteredCategories}
          loading={loading}
          search={search}
          onEdit={(cat) => setEditCategory(cat)}
          onDelete={handleDeletePrompt}
        />
      </main>

      {/* Modals */}
      <CreateCategoryModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadData}
      />

      <EditCategoryModal
        category={editCategory}
        isOpen={Boolean(editCategory)}
        onClose={() => setEditCategory(null)}
        onSuccess={loadData}
      />

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        description={confirmConfig.description}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        variant={confirmConfig.variant}
        isLoading={confirmConfig.isLoading}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
