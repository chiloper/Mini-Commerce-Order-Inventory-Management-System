"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "../../../components/admin-sidebar";
import PromotionTable, { DecoratedPromotion } from "../../../components/promotion/promotion-table";
import CreatePromotionModal from "../../../components/promotion/create-promotion-modal";
import EditPromotionModal from "../../../components/promotion/edit-promotion-modal";
import { getPaginatedPromotions } from "../../../lib/ecommerce-actions";
import { getSessionUserAction } from "../../../lib/auth/actions";
import type { Promotion } from "@/types/ecommerce";

export default function AdminPromotionPage() {
  const router = useRouter();
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [search, setSearch] = useState<string>("");

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editPromo, setEditPromo] = useState<Promotion | null>(null);

  const loadData = async (targetPage = page, targetSearch = search) => {
    setLoading(true);
    const res = await getPaginatedPromotions({
      page: targetPage,
      limit,
      search: targetSearch,
    });
    setPromos(res.data);
    setPage(res.page);
    setTotal(res.total);
    setTotalPages(res.totalPages);
    setLoading(false);
  };

  useEffect(() => {
    getSessionUserAction().then((u) => {
      if (!u || u.role !== "admin") {
        router.push("/admin/console");
        return;
      }
      loadData(1, search);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    loadData(newPage, search);
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadData(1, search);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Decorate promotion with quota bars, status chips, and date strings
  const decorate = (c: Promotion): DecoratedPromotion => {
    const used = c.usedCount || 0;
    const limitQuota = c.usageLimit || 1;
    const pct = Math.min(100, Math.round((used / limitQuota) * 100));
    const now = new Date();
    const exp = c.expiresAt ? new Date(c.expiresAt) : null;
    const isExpired = exp ? exp < now : false;

    let barColor = "bg-accent";
    if (pct >= 90) barColor = "bg-rose-500";
    else if (pct >= 70) barColor = "bg-amber-500";

    const isAvailable = !isExpired && used < limitQuota;
    const statusLabel = isExpired ? "หมดอายุ" : used >= limitQuota ? "โควตาเต็ม" : "เปิดใช้งาน";
    const statusCls = isExpired
      ? "bg-neutral-200 text-neutral-800 border border-neutral-300"
      : used >= limitQuota
      ? "bg-rose-100 text-rose-900 border border-rose-300"
      : "bg-emerald-100 text-emerald-900 border border-emerald-300";

    let rangeText = "ไม่จำกัดเวลา";
    if (exp && !isNaN(exp.getTime())) {
      rangeText = `ถึง ${exp.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })}`;
    }

    let condText = "-";
    if (c.type === "FREESHIP") {
      condText = "ส่งฟรีทุกยอด";
    }

    let typeText = "ส่วนลดทั่วไป";
    if (c.type === "PERCENTAGE") typeText = `ลด ${c.value}%`;
    else if (c.type === "FIXED") typeText = `ลด ฿${(c.value || 0).toLocaleString("th-TH")}`;
    else if (c.type === "FREESHIP") typeText = "ส่งฟรี";

    return {
      ...c,
      usedText: `${used} / ${limitQuota} (${pct}%)`,
      barW: `${pct}%`,
      barColor: isAvailable ? barColor : "bg-neutral-400",
      condText,
      typeText,
      statusLabel,
      statusCls,
      rangeText,
    };
  };

  const decoratedPromos: DecoratedPromotion[] = promos.map(decorate);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-bg text-text">
      {/* Sidebar Navigation */}
      <AdminSidebar />

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
          {/* Header & Controls */}
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-accent-700 font-bold mb-1">
                ทั้งหมด {total.toLocaleString("th-TH")} แคมเปญ {totalPages > 1 && `(หน้า ${page}/${totalPages})`} · โปรโมชั่นและส่วนลด
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text m-0">
                แคมเปญ & โค้ดส่วนลด
              </h2>
            </div>
            <button
              type="button"
              className="px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-accent hover:bg-accent-600 active:bg-accent-700 !text-white transition-all cursor-pointer shadow-xs shrink-0"
              onClick={() => setShowCreateModal(true)}
            >
              + สร้างโปรโมชั่น
            </button>
          </div>

          {/* Search Box */}
          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 w-full sm:w-80 bg-surface border border-divider rounded-xl px-3.5 py-1.5 focus-within:ring-2 focus-within:ring-accent focus-within:border-transparent transition-all shadow-2xs">
              <svg className="w-4 h-4 text-neutral-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <line x1="16.5" y1="16.5" x2="21" y2="21" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาโค้ดส่วนลด, รายละเอียด..."
                className="w-full bg-transparent border-0 outline-none text-xs text-text placeholder:text-neutral-500"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="text-xs text-neutral-500 hover:text-text cursor-pointer p-0.5"
                  title="ล้างคำค้นหา"
                >
                  ✕
                </button>
              )}
            </label>
          </div>

          {/* Modular Promotion Table */}
          <PromotionTable
            promos={decoratedPromos}
            loading={loading}
            search={search}
            page={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={handlePageChange}
            onOpenEdit={setEditPromo}
          />
        </main>

      {/* Modular Create Promotion Modal */}
      <CreatePromotionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => loadData(1, search)}
      />

      {/* Modular Edit Promotion Modal (With in-app ConfirmModal for delete) */}
      <EditPromotionModal
        promo={editPromo}
        onClose={() => setEditPromo(null)}
        onSuccess={() => loadData(page, search)}
      />
    </div>
  );
}
