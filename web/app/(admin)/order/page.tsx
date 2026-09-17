"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "../../../components/admin-sidebar";
import { getOrders, updateOrderStatus } from "../../../lib/ecommerce-actions";
import { getSessionUserAction } from "../../../lib/auth/actions";

export default function AdminOrderPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [updating, setUpdating] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    const data = await getOrders();
    setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    getSessionUserAction().then((u) => {
      if (!u || u.role !== "admin") {
        router.push("/admin/console");
        return;
      }
      loadOrders();
    });
  }, [router]);

  const formatPrice = (n: number) => `฿${(n || 0).toLocaleString("th-TH")}`;

  const decorateOrder = (o: any) => {
    let statusLabel = "กำลังจัดของ";
    let statusCls = "tag tag-accent";
    let stockNote = "ตัดสต็อกแล้ว";
    let stockColor = "var(--color-neutral-700)";

    if (o.status === "PENDING_PAYMENT") {
      statusLabel = "รอชำระ";
      statusCls = "tag tag-neutral";
      stockNote = "ยังไม่ตัดสต็อก";
    } else if (o.status === "SHIPPED") {
      statusLabel = "จัดส่งแล้ว";
      statusCls = "tag tag-outline";
      stockNote = "ตัดสต็อกแล้ว";
    } else if (o.status === "HOLD" || o.status === "CANCELLED") {
      statusLabel = "ติดปัญหาสต็อก";
      statusCls = "tag tag-accent-2";
      stockNote = "สต็อกไม่พอ / ยกเลิก";
      stockColor = "var(--color-accent-2-700)";
    }

    return {
      ...o,
      statusLabel,
      statusCls,
      stockNote,
      stockColor,
      time: new Date(o.createdAt || Date.now()).toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const decorated = orders.map(decorateOrder);

  const filtered = decorated.filter((o) => {
    const matchSearch =
      search.trim() === "" ||
      String(o.id).includes(search) ||
      o.customerName?.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;

    if (filter === "wait") return o.status === "PENDING_PAYMENT";
    if (filter === "paid") return o.status === "PAID" || o.status === "PROCESSING";
    if (filter === "hold") return o.status === "HOLD" || o.status === "CANCELLED";
    return true;
  });

  const handleUpdateStatus = async (status: string) => {
    if (!selectedOrder) return;
    setUpdating(true);
    await updateOrderStatus(selectedOrder.id, status);
    await loadOrders();
    setSelectedOrder(null);
    setUpdating(false);
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
                ทั้งหมด {orders.length} รายการ (TiDB Cloud)
              </p>
              <h2 style={{ margin: 0, fontSize: "30px", lineHeight: 1.1 }}>คำสั่งซื้อ</h2>
            </div>
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              <button className="btn btn-secondary">ส่งออก CSV</button>
            </div>
          </div>

          {/* Filter Bar & Search */}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
            <div className="seg">
              <button
                className={`seg-opt ${filter === "all" ? "active" : ""}`}
                onClick={() => setFilter("all")}
              >
                ทั้งหมด ({decorated.length})
              </button>
              <button
                className={`seg-opt ${filter === "wait" ? "active" : ""}`}
                onClick={() => setFilter("wait")}
              >
                รอชำระ ({decorated.filter((x) => x.status === "PENDING_PAYMENT").length})
              </button>
              <button
                className={`seg-opt ${filter === "paid" ? "active" : ""}`}
                onClick={() => setFilter("paid")}
              >
                กำลังจัดของ ({decorated.filter((x) => x.status === "PAID" || x.status === "PROCESSING").length})
              </button>
              <button
                className={`seg-opt ${filter === "hold" ? "active" : ""}`}
                onClick={() => setFilter("hold")}
              >
                ติดปัญหาสต็อก ({decorated.filter((x) => x.status === "HOLD" || x.status === "CANCELLED").length})
              </button>
            </div>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
                width: "280px",
                marginLeft: "auto",
                background: "var(--color-surface)",
                border: "1px solid var(--color-divider)",
                borderRadius: "var(--radius-md)",
                padding: "0 var(--space-2)",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ opacity: 0.55, flex: "none" }}>
                <circle cx="11" cy="11" r="7" />
                <line x1="16.5" y1="16.5" x2="21" y2="21" />
              </svg>
              <input
                className="input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาเลขที่ / ลูกค้า"
                style={{ border: 0, background: "transparent" }}
              />
            </label>
          </div>

          {/* Orders Table */}
          {loading ? (
            <div style={{ padding: "60px 0", textAlign: "center", color: "var(--color-neutral-600)" }}>
              กำลังโหลดข้อมูลคำสั่งซื้อจาก TiDB Cloud...
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>เลขที่</th>
                  <th>ลูกค้า</th>
                  <th>รายการ</th>
                  <th>ยอด</th>
                  <th>ชำระเงิน</th>
                  <th>สถานะ</th>
                  <th>สต็อก</th>
                  <th>เวลา</th>
                  <th style={{ textAlign: "right" }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: "var(--space-6)", color: "var(--color-neutral-700)" }}>
                      ไม่พบคำสั่งซื้อตามตัวกรอง
                    </td>
                  </tr>
                ) : (
                  filtered.map((o) => (
                    <tr key={o.id}>
                      <td style={{ fontWeight: 600 }}>#{o.id}</td>
                      <td>{o.customerName || "ลูกค้าทั่วไป"}</td>
                      <td>{o.items?.length || 1} รายการ</td>
                      <td style={{ fontWeight: 600 }}>{formatPrice(o.totalAmount)}</td>
                      <td style={{ color: "var(--color-neutral-700)" }}>{o.paymentMethod || "พร้อมเพย์"}</td>
                      <td>
                        <span className={o.statusCls}>{o.statusLabel}</span>
                      </td>
                      <td style={{ color: o.stockColor, fontSize: "13px" }}>{o.stockNote}</td>
                      <td style={{ color: "var(--color-neutral-700)", fontSize: "13px" }}>{o.time}</td>
                      <td style={{ textAlign: "right" }}>
                        <button className="btn btn-ghost" onClick={() => setSelectedOrder(o)}>
                          จัดการ
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </main>
      </div>

      {/* Order Management Dialog */}
      {selectedOrder && (
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
              padding: "var(--space-4)",
            }}
          >
            <h3 className="card-title" style={{ fontSize: "18px" }}>
              จัดการคำสั่งซื้อ #{selectedOrder.id}
            </h3>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--color-neutral-800)" }}>
              ลูกค้า: <strong>{selectedOrder.customerName || "ลูกค้าทั่วไป"}</strong> ({selectedOrder.phone || "-"})
            </p>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--color-neutral-700)" }}>
              ที่อยู่: {selectedOrder.shippingAddress || "-"}
            </p>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--color-neutral-800)" }}>
              ยอดชำระ: <strong>{formatPrice(selectedOrder.totalAmount)}</strong> ({selectedOrder.paymentMethod})
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "var(--space-2)" }}>
              <label style={{ fontSize: "12px", color: "var(--color-neutral-700)" }}>ปรับสถานะคำสั่งซื้อ:</label>
              <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleUpdateStatus("PROCESSING")}
                  disabled={updating}
                  style={{ fontSize: "12px", padding: "6px 12px" }}
                >
                  กำลังจัดของ
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => handleUpdateStatus("SHIPPED")}
                  disabled={updating}
                  style={{ fontSize: "12px", padding: "6px 12px" }}
                >
                  จัดส่งแล้ว
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleUpdateStatus("CANCELLED")}
                  disabled={updating}
                  style={{ fontSize: "12px", padding: "6px 12px", color: "var(--color-accent-2-700)" }}
                >
                  ยกเลิก / คืนสต็อก
                </button>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "var(--space-3)" }}>
              <button className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}