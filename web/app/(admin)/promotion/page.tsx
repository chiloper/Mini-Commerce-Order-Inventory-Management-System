"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "../../../components/admin-sidebar";
import {
  getPromotions,
  createPromotionAction,
  updatePromotionAction,
  deletePromotionAction,
} from "../../../lib/ecommerce-actions";
import { getSessionUserAction } from "../../../lib/auth/actions";
import type { Promotion } from "@/types/ecommerce";

export interface DecoratedPromotion extends Promotion {
  usedText: string;
  barW: string;
  barColor: string;
  condText: string;
  typeText: string;
  statusLabel: string;
  statusCls: string;
  rangeText: string;
}

export default function AdminPromotionPage() {
  const router = useRouter();
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal create
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newType, setNewType] = useState("PERCENTAGE");
  const [newValue, setNewValue] = useState(10);
  const [newMinSubtotal, setNewMinSubtotal] = useState(1000);
  const [newQuota, setNewQuota] = useState(1000);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Modal edit
  const [editPromo, setEditPromo] = useState<Promotion | null>(null);
  const [editCode, setEditCode] = useState("");
  const [editType, setEditType] = useState("PERCENTAGE");
  const [editValue, setEditValue] = useState<number>(0);
  const [editMinSubtotal, setEditMinSubtotal] = useState<number>(0);
  const [editQuota, setEditQuota] = useState<number>(1000);
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const data = await getPromotions();
    setPromos(data);
    setLoading(false);
  };

  useEffect(() => {
    getSessionUserAction().then((u) => {
      if (!u || u.role !== "admin") {
        router.push("/admin/console");
        return;
      }
      loadData();
    });
  }, [router]);

  const decorate = (c: Promotion): DecoratedPromotion => {
    const used = c.usedCount || 0;
    const quota = c.usageLimit || 1000;
    const pct = Math.min(100, Math.round((used / quota) * 100));
    const isNearLimit = pct >= 80;

    let statusLabel = c.isActive !== false ? "ใช้งาน" : "ปิดใช้งาน";
    let statusCls = "bg-emerald-50 text-emerald-800 border border-emerald-300";
    let barColor = "bg-accent";

    if (isNearLimit) {
      statusLabel = "ใกล้หมดโควตา";
      statusCls = "bg-amber-50 text-amber-900 border border-amber-300";
      barColor = "bg-accent-2";
    } else if (c.isActive === false) {
      statusLabel = "ปิดใช้งาน";
      statusCls = "bg-neutral-100 text-neutral-800 border border-neutral-300";
      barColor = "bg-neutral-400";
    }

    const typeStr = c.type || c.discountType;
    const val = c.value || c.discountValue || 0;
    const minAmt = c.minOrderAmount || 0;

    const condText = minAmt ? `ยอดขั้นต่ำ ฿${Number(minAmt).toLocaleString("th-TH")}` : "ไม่มีขั้นต่ำ";
    const typeText = typeStr === "PERCENTAGE" ? `ส่วนลด ${val}%` : `ลด ฿${Number(val).toLocaleString("th-TH")}`;
    const rangeText = c.expiresAt
      ? `ถึง ${new Date(c.expiresAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })}`
      : "ไม่จำกัดเวลา";

    return {
      ...c,
      usedText: `${used} / ${quota.toLocaleString("th-TH")}`,
      barW: `${pct}%`,
      barColor,
      condText,
      typeText,
      statusLabel,
      statusCls,
      rangeText,
    };
  };

  const decorated = promos.map(decorate);

  // Handle Create
  const handleOpenCreate = () => {
    setNewCode("");
    setNewType("PERCENTAGE");
    setNewValue(10);
    setNewMinSubtotal(1000);
    setNewQuota(1000);
    setCreateError(null);
    setShowCreateModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) {
      setCreateError("กรุณากรอกรหัสโค้ดโปรโมชั่น");
      return;
    }
    setCreateError(null);
    setCreating(true);

    const res = await createPromotionAction({
      code: newCode.trim().toUpperCase(),
      type: newType,
      value: Number(newValue),
      usageLimit: Number(newQuota),
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    });

    if (res.ok) {
      setShowCreateModal(false);
      await loadData();
    } else {
      setCreateError(res.error || "เกิดข้อผิดพลาดในการสร้างโปรโมชั่น");
    }
    setCreating(false);
  };

  // Handle Edit
  const handleOpenEdit = (c: Promotion) => {
    setEditPromo(c);
    setEditCode(c.code);
    setEditType(c.type || c.discountType || "PERCENTAGE");
    setEditValue(c.value || c.discountValue || 0);
    setEditMinSubtotal(c.minOrderAmount || 0);
    setEditQuota(c.usageLimit || 1000);
    setEditError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPromo) return;
    setEditError(null);
    setSaving(true);

    const res = await updatePromotionAction(editPromo.id, {
      code: editCode.trim().toUpperCase(),
      type: editType,
      value: Number(editValue),
      usageLimit: Number(editQuota),
    });

    if (res.ok) {
      setEditPromo(null);
      await loadData();
    } else {
      setEditError(res.error || "เกิดข้อผิดพลาดในการแก้ไขโปรโมชั่น");
    }
    setSaving(false);
  };

  // Handle Delete
  const handleDeletePromo = async () => {
    if (!editPromo) return;
    if (!confirm(`คุณต้องการลบโค้ดโปรโมชั่น "${editPromo.code}" ใช่หรือไม่?`)) return;
    setDeleting(true);

    const res = await deletePromotionAction(editPromo.id);
    if (res.ok) {
      setEditPromo(null);
      await loadData();
    } else {
      setEditError(res.error || "ไม่สามารถลบโปรโมชั่นได้");
    }
    setDeleting(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-12 sm:pb-16">
      <div className="flex flex-col md:flex-row min-h-[840px] bg-bg rounded-2xl shadow-md overflow-hidden border border-divider">
        <AdminSidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col gap-6 min-w-0">
          {/* Header */}
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-accent-700 mb-1">
                {promos.length} แคมเปญ
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text m-0">
                โปรโมชั่น
              </h2>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-accent text-white hover:bg-accent-600 active:bg-accent-700 transition-all cursor-pointer shadow-xs !text-white flex items-center gap-1.5"
                onClick={handleOpenCreate}
              >
                <span>+</span>
                <span>สร้างโปรโมชั่นใหม่</span>
              </button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="border border-divider rounded-2xl bg-surface p-12 text-center text-sm font-medium text-neutral-700">
              กำลังโหลดข้อมูลโปรโมชั่น...
            </div>
          ) : (
            <div className="border border-divider rounded-2xl bg-surface overflow-x-auto shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-divider text-neutral-700 font-bold tracking-wider uppercase text-[11px] bg-bg/40">
                    <th className="py-3.5 px-4">โค้ด</th>
                    <th className="py-3.5 px-4">ประเภท</th>
                    <th className="py-3.5 px-4">เงื่อนไข</th>
                    <th className="py-3.5 px-4">ใช้แล้ว / โควตา</th>
                    <th className="py-3.5 px-4">ช่วงเวลา</th>
                    <th className="py-3.5 px-4">สถานะ</th>
                    <th className="py-3.5 px-4 text-right">การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider">
                  {decorated.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-sm font-medium text-neutral-700">
                        ยังไม่มีแคมเปญโปรโมชั่น กด "+ สร้างโปรโมชั่นใหม่" เพื่อเริ่มต้น
                      </td>
                    </tr>
                  ) : (
                    decorated.map((c) => (
                      <tr key={c.id || c.code} className="hover:bg-bg/50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-sm tracking-wider text-text">{c.code}</td>
                        <td className="py-3.5 px-4 font-semibold text-text">{c.typeText}</td>
                        <td className="py-3.5 px-4 text-neutral-700">{c.condText}</td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-neutral-200 rounded-full overflow-hidden shrink-0">
                              <div className={`h-full rounded-full ${c.barColor}`} style={{ width: c.barW }} />
                            </div>
                            <span className="text-xs font-mono font-medium text-neutral-800">{c.usedText}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-neutral-700 font-medium">{c.rangeText}</td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${c.statusCls}`}>
                            {c.statusLabel}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(c)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-divider bg-surface hover:bg-bg text-neutral-800 cursor-pointer transition-all shadow-2xs hover:shadow-xs"
                          >
                            แก้ไข
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="p-4 rounded-xl bg-accent/5 border border-accent/20 text-xs text-neutral-800 flex items-start gap-2.5 leading-relaxed">
            <svg className="w-4 h-4 text-accent shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <p className="m-0">
              โค้ดที่ผูกกับสินค้าใกล้หมดจะถูกปิดอัตโนมัติเมื่อจำนวนขายได้ต่ำกว่าจุดสั่งซื้อ เพื่อไม่ให้เกิดคำสั่งซื้อที่ตัดสต็อกไม่สำเร็จ
            </p>
          </div>
        </main>
      </div>

      {/* ========================================================================= */}
      {/* 1. Modal: สร้างโปรโมชั่นใหม่ (Create Promotion)                             */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative w-full max-w-md bg-surface rounded-2xl border border-divider p-6 shadow-2xl flex flex-col gap-4 z-10 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-divider">
              <h3 className="text-lg font-bold text-text m-0">
                สร้างโค้ดโปรโมชั่นใหม่
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                aria-label="ปิดหน้าต่าง"
                className="w-8 h-8 rounded-xl flex items-center justify-center text-neutral-600 hover:text-neutral-900 hover:bg-bg border border-divider transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-neutral-800 mb-1 block">รหัสโค้ด (เช่น SAVE20, FLASH50)</label>
                <input
                  required
                  className="w-full rounded-xl border border-divider bg-bg px-3.5 py-2.5 text-xs text-text placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all shadow-2xs font-mono uppercase"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="CODE"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-800 mb-1 block">ประเภทส่วนลด</label>
                  <select
                    className="w-full rounded-xl border border-divider bg-bg px-3.5 py-2.5 text-xs text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all shadow-2xs"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                  >
                    <option value="PERCENTAGE">เปอร์เซ็นต์ (%)</option>
                    <option value="FIXED">จำนวนเงินคงที่ (บาท)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-800 mb-1 block">มูลค่าส่วนลด</label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="w-full rounded-xl border border-divider bg-bg px-3.5 py-2.5 text-xs text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all shadow-2xs font-mono"
                    value={newValue}
                    onChange={(e) => setNewValue(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-800 mb-1 block">ยอดสั่งซื้อขั้นต่ำ (บาท)</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-xl border border-divider bg-bg px-3.5 py-2.5 text-xs text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all shadow-2xs font-mono"
                    value={newMinSubtotal}
                    onChange={(e) => setNewMinSubtotal(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-800 mb-1 block">จำนวนโควตาสูงสุด</label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="w-full rounded-xl border border-divider bg-bg px-3.5 py-2.5 text-xs text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all shadow-2xs font-mono"
                    value={newQuota}
                    onChange={(e) => setNewQuota(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-divider">
                <button
                  type="button"
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-divider bg-surface hover:bg-bg text-neutral-800 transition-colors cursor-pointer"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-accent text-white hover:bg-accent-600 active:bg-accent-700 transition-colors cursor-pointer shadow-xs disabled:opacity-50 !text-white"
                  disabled={creating}
                >
                  {creating ? "กำลังบันทึกข้อมูล..." : "บันทึกโปรโมชั่น"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. Modal: แก้ไขโปรโมชั่น (Edit Promotion)                                  */}
      {/* ========================================================================= */}
      {editPromo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs"
            onClick={() => setEditPromo(null)}
          />
          <div className="relative w-full max-w-md bg-surface rounded-2xl border border-divider p-6 shadow-2xl flex flex-col gap-4 z-10 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-divider">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-accent-700 font-mono">
                  แก้ไขโปรโมชั่น
                </span>
                <h3 className="text-xl font-bold text-text m-0">
                  {editPromo.code}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditPromo(null)}
                aria-label="ปิดหน้าต่าง"
                className="w-8 h-8 rounded-xl flex items-center justify-center text-neutral-600 hover:text-neutral-900 hover:bg-bg border border-divider transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-neutral-800 mb-1 block">รหัสโค้ด</label>
                <input
                  required
                  className="w-full rounded-xl border border-divider bg-bg px-3.5 py-2.5 text-xs text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all shadow-2xs font-mono uppercase"
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-800 mb-1 block">ประเภทส่วนลด</label>
                  <select
                    className="w-full rounded-xl border border-divider bg-bg px-3.5 py-2.5 text-xs text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all shadow-2xs"
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                  >
                    <option value="PERCENTAGE">เปอร์เซ็นต์ (%)</option>
                    <option value="FIXED">จำนวนเงินคงที่ (บาท)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-800 mb-1 block">มูลค่าส่วนลด</label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="w-full rounded-xl border border-divider bg-bg px-3.5 py-2.5 text-xs text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all shadow-2xs font-mono"
                    value={editValue}
                    onChange={(e) => setEditValue(Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-800 mb-1 block">จำนวนโควตาสูงสุด</label>
                <input
                  type="number"
                  required
                  min="1"
                  className="w-full rounded-xl border border-divider bg-bg px-3.5 py-2.5 text-xs text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all shadow-2xs font-mono"
                  value={editQuota}
                  onChange={(e) => setEditQuota(Number(e.target.value))}
                />
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-divider">
                <button
                  type="button"
                  onClick={handleDeletePromo}
                  disabled={saving || deleting}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {deleting ? "กำลังลบ..." : "ลบโค้ดนี้"}
                </button>

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    className="px-4 py-2 text-xs font-semibold rounded-xl border border-divider bg-surface hover:bg-bg text-neutral-800 transition-colors cursor-pointer"
                    onClick={() => setEditPromo(null)}
                    disabled={saving}
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-accent text-white hover:bg-accent-600 active:bg-accent-700 transition-colors cursor-pointer shadow-xs disabled:opacity-50 !text-white"
                    disabled={saving}
                  >
                    {saving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
