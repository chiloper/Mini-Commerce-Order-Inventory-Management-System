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

export default function AdminPromotionPage() {
  const router = useRouter();
  const [promos, setPromos] = useState<any[]>([]);
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
  const [editPromo, setEditPromo] = useState<any | null>(null);
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

  const decorate = (c: any) => {
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

    let condText = minAmt ? `ยอดขั้นต่ำ ฿${Number(minAmt).toLocaleString("th-TH")}` : "ไม่มีขั้นต่ำ";
    if (c.code === "NEW300") condText = "ลูกค้าใหม่เท่านั้น";
    if (c.code === "BUNDLE2") condText = "เฉพาะหมวดอุปกรณ์เสริม";

    let typeText = typeStr === "PERCENTAGE" ? `ส่วนลด ${val}%` : `ลด ฿${Number(val).toLocaleString("th-TH")}`;
    if (c.code === "FREESHIP") typeText = "ส่งฟรี";

    return {
      ...c,
      usedText: `${used} / ${quota.toLocaleString("th-TH")}`,
      barW: `${pct}%`,
      barColor,
      condText,
      typeText,
      statusLabel,
      statusCls,
      rangeText: "1–31 ส.ค.",
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
  const handleOpenEdit = (c: any) => {
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
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-4) var(--space-8)" }}>
      <div
        style={{
          display: "flex",
          minHeight: "840px",
          background: "var(--color-bg)",
          borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-md)",
          overflow: "hidden",
        }}
      >
        <AdminSidebar />

        <main style={{ flex: 1, padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-6)", minWidth: 0 }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap" }}>
            <div>
              <p style={{ margin: "0 0 6px", fontSize: "11px", letterSpacing: ".12em", textTransform: "uppercase", color: "var(--color-accent-700)", fontWeight: 600 }}>
                {promos.length} แคมเปญ (TiDB Cloud)
              </p>
              <h2 style={{ margin: 0, fontSize: "30px", lineHeight: 1.1 }}>โปรโมชั่น</h2>
            </div>
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              <button className="btn btn-primary" onClick={handleOpenCreate}>
                + สร้างโปรโมชั่นใหม่
              </button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ padding: "60px 0", textAlign: "center", color: "var(--color-neutral-600)" }}>
              กำลังโหลดข้อมูลโปรโมชั่นจาก TiDB Cloud...
            </div>
          ) : (
            <table className="table">
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
                  {creating ? "กำลังบันทึก..." : "บันทึกลง TiDB"}
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
