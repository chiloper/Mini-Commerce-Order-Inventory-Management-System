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
    let statusCls = "tag tag-accent";
    let barColor = "var(--color-accent)";

    if (isNearLimit) {
      statusLabel = "ใกล้หมดโควตา";
      statusCls = "tag tag-accent-2";
      barColor = "var(--color-accent-2-500)";
    } else if (c.isActive === false) {
      statusLabel = "ปิดใช้งาน";
      statusCls = "tag tag-neutral";
      barColor = "var(--color-neutral-400)";
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
      <div className="flex flex-col md:flex-row min-h-[840px] bg-bg rounded-xl shadow-md overflow-hidden border border-divider">
        <AdminSidebar />

        <main className="flex-1 p-6 flex flex-col gap-6 min-w-0">
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
                className="px-4 py-2 text-xs sm:text-sm font-medium rounded-lg bg-neutral-800 text-white hover:bg-neutral-900 transition-colors cursor-pointer shadow-xs"
                onClick={handleOpenCreate}
              >
                + สร้างโปรโมชั่นใหม่
              </button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="py-16 text-center text-sm text-neutral-600">
              กำลังโหลดข้อมูลโปรโมชั่น...
            </div>
          ) : (
            <div className="border border-divider rounded-xl bg-surface overflow-x-auto shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr>
                  <th>โค้ด</th>
                  <th>ประเภท</th>
                  <th>เงื่อนไข</th>
                  <th>ใช้แล้ว / โควตา</th>
                  <th>ช่วงเวลา</th>
                  <th>สถานะ</th>
                  <th style={{ textAlign: "right" }}>การดำเนินการ</th>
                </tr>
              </thead>
              <tbody>
                {decorated.map((c) => (
                  <tr key={c.id || c.code}>
                    <td style={{ letterSpacing: ".06em", fontWeight: 700, fontSize: "15px" }}>{c.code}</td>
                    <td>{c.typeText}</td>
                    <td style={{ color: "var(--color-neutral-700)" }}>{c.condText}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                        <div style={{ width: "110px", height: "6px", background: "var(--color-neutral-300)", overflow: "hidden" }}>
                          <div style={{ height: "6px", width: c.barW, background: c.barColor }} />
                        </div>
                        <span style={{ fontSize: "13px" }}>{c.usedText}</span>
                      </div>
                    </td>
                    <td style={{ color: "var(--color-neutral-700)" }}>{c.rangeText}</td>
                    <td>
                      <span className={c.statusCls}>{c.statusLabel}</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button className="btn btn-ghost" onClick={() => handleOpenEdit(c)}>
                        แก้ไข
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}

          <p style={{ margin: 0, fontSize: "13px", color: "var(--color-neutral-700)", maxWidth: "70ch", lineHeight: 1.6 }}>
            โค้ดที่ผูกกับสินค้าใกล้หมดจะถูกปิดอัตโนมัติเมื่อจำนวนขายได้ต่ำกว่าจุดสั่งซื้อ เพื่อไม่ให้เกิดคำสั่งซื้อที่ตัดสต็อกไม่สำเร็จ
          </p>
        </main>
      </div>

      {/* ========================================================================= */}
      {/* 1. Modal: สร้างโปรโมชั่นใหม่ (Create Promotion)                             */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "color-mix(in srgb, var(--color-neutral-900) 50%, transparent)",
            display: "grid",
            placeItems: "center",
            padding: "var(--space-4)",
            zIndex: 10000,
          }}
        >
          <div
            className="card"
            style={{
              width: "min(460px, 100%)",
              background: "var(--color-surface)",
              boxShadow: "var(--shadow-lg)",
              gap: "var(--space-3)",
              padding: "var(--space-6)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 className="card-title" style={{ fontSize: "20px" }}>
                สร้างโค้ดโปรโมชั่นใหม่
              </h3>
              <button
                className="btn btn-secondary btn-icon"
                onClick={() => setShowCreateModal(false)}
                style={{ width: "32px", height: "32px" }}
              >
                ✕
              </button>
            </div>

            {createError && (
              <div
                style={{
                  padding: "var(--space-2) var(--space-3)",
                  background: "var(--color-accent-2-100)",
                  color: "var(--color-accent-2-800)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "13px",
                }}
              >
                {createError}
              </div>
            )}

            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <div className="field">
                <label>รหัสโค้ด (เช่น SAVE20, FLASH50)</label>
                <input
                  required
                  className="input"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="CODE"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2)" }}>
                <div className="field">
                  <label>ประเภทส่วนลด</label>
                  <select
                    className="input"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                  >
                    <option value="PERCENTAGE">เปอร์เซ็นต์ (%)</option>
                    <option value="FIXED">จำนวนเงินคงที่ (บาท)</option>
                  </select>
                </div>
                <div className="field">
                  <label>มูลค่าส่วนลด</label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="input"
                    value={newValue}
                    onChange={(e) => setNewValue(Number(e.target.value))}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2)" }}>
                <div className="field">
                  <label>ยอดสั่งซื้อขั้นต่ำ (บาท)</label>
                  <input
                    type="number"
                    min="0"
                    className="input"
                    value={newMinSubtotal}
                    onChange={(e) => setNewMinSubtotal(Number(e.target.value))}
                  />
                </div>
                <div className="field">
                  <label>จำนวนโควตาสูงสุด</label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="input"
                    value={newQuota}
                    onChange={(e) => setNewQuota(Number(e.target.value))}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
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
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "color-mix(in srgb, var(--color-neutral-900) 50%, transparent)",
            display: "grid",
            placeItems: "center",
            padding: "var(--space-4)",
            zIndex: 10000,
          }}
        >
          <div
            className="card"
            style={{
              width: "min(460px, 100%)",
              background: "var(--color-surface)",
              boxShadow: "var(--shadow-lg)",
              gap: "var(--space-3)",
              padding: "var(--space-6)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span className="card-kicker">แก้ไขโปรโมชั่น</span>
                <h3 className="card-title" style={{ fontSize: "20px", margin: "2px 0 0" }}>
                  {editPromo.code}
                </h3>
              </div>
              <button
                className="btn btn-secondary btn-icon"
                onClick={() => setEditPromo(null)}
                style={{ width: "32px", height: "32px" }}
              >
                ✕
              </button>
            </div>

            {editError && (
              <div
                style={{
                  padding: "var(--space-2) var(--space-3)",
                  background: "var(--color-accent-2-100)",
                  color: "var(--color-accent-2-800)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "13px",
                }}
              >
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <div className="field">
                <label>รหัสโค้ด</label>
                <input
                  required
                  className="input"
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2)" }}>
                <div className="field">
                  <label>ประเภทส่วนลด</label>
                  <select
                    className="input"
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                  >
                    <option value="PERCENTAGE">เปอร์เซ็นต์ (%)</option>
                    <option value="FIXED">จำนวนเงินคงที่ (บาท)</option>
                  </select>
                </div>
                <div className="field">
                  <label>มูลค่าส่วนลด</label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="input"
                    value={editValue}
                    onChange={(e) => setEditValue(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="field">
                <label>จำนวนโควตาสูงสุด</label>
                <input
                  type="number"
                  required
                  min="1"
                  className="input"
                  value={editQuota}
                  onChange={(e) => setEditQuota(Number(e.target.value))}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "var(--space-2)" }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={handleDeletePromo}
                  disabled={saving || deleting}
                  style={{ color: "var(--color-accent-2-700)" }}
                >
                  {deleting ? "กำลังลบ..." : "ลบโค้ดนี้"}
                </button>

                <div style={{ display: "flex", gap: "var(--space-2)" }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setEditPromo(null)}
                    disabled={saving}
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
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
