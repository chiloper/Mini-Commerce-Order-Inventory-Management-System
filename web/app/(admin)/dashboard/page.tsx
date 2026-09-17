"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminSidebar from "../../../components/admin-sidebar";
import { getDashboardStats } from "../../../lib/ecommerce-actions";
import { getSessionUserAction } from "../../../lib/auth/actions";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSessionUserAction().then((u) => {
      if (!u || u.role !== "admin") {
        router.push("/admin/console");
        return;
      }
      getDashboardStats().then((res) => {
        setData(res);
        setLoading(false);
      });
    });
  }, [router]);

  const formatPrice = (n: number) => `฿${(n || 0).toLocaleString("th-TH")}`;

  const stockLog = [
    { time: "09:24", text: "ตัดสต็อก #10428 · เมาส์ Glide Pro", delta: "−2", color: "var(--color-accent-2-700)" },
    { time: "09:18", text: "จองสต็อก #10427 · ลำโพงพกพา Pebble", delta: "จอง 2", color: "var(--color-neutral-700)" },
    { time: "09:06", text: "คืนสต็อกจากการยกเลิก #10419", delta: "+1", color: "var(--color-accent-700)" },
    { time: "08:52", text: "รับเข้าคลัง · ขาตั้งโน้ตบุ๊ก Rise", delta: "+20", color: "var(--color-accent-700)" },
    { time: "08:44", text: "คำขอซื้อชนกัน 3 รายการ · จ่ายสำเร็จ 1", delta: "−1", color: "var(--color-accent-2-700)" },
  ];

  const stats = data?.stats || [
    { label: "คำสั่งซื้อวันนี้", value: "128", note: "+12% จากเมื่อวาน", noteColor: "var(--color-neutral-700)" },
    { label: "ยอดขายวันนี้", value: "฿184,200", note: "เฉลี่ย ฿1,440 ต่อบิล", noteColor: "var(--color-neutral-700)" },
    { label: "รอจัดส่ง", value: "23", note: "เกิน SLA 2 รายการ", noteColor: "var(--color-neutral-700)" },
    { label: "SKU ใกล้หมด", value: "3", note: "ต้องเติมภายใน 48 ชม.", noteColor: "var(--color-accent-2-700)" },
  ];

  const lowStock = (data?.lowStockProducts || []).map((p: any) => {
    const avail = Math.max(0, (p.stock || 0) - (p.held || 0));
    const barW = Math.min(100, Math.round(((p.stock || 0) / 50) * 100)) + "%";
    let statusLabel = "พร้อมส่ง";
    let statusCls = "tag tag-accent";
    let barColor = "var(--color-accent)";

    if (p.stock === 0) {
      statusLabel = "หมดชั่วคราว";
      statusCls = "tag tag-neutral";
      barColor = "var(--color-neutral-500)";
    } else if (avail <= 10) {
      statusLabel = "ใกล้หมด";
      statusCls = "tag tag-accent-2";
      barColor = "var(--color-accent-2-500)";
    }

    return {
      ...p,
      barW,
      barColor,
      statusLabel,
      statusCls,
      avail,
      stockText: p.stock === 0 ? "รอเข้าคลัง" : `เหลือ ${p.stock} ชิ้น`,
    };
  });

  const recentOrders = data?.recentOrders || [];

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-4) var(--space-8)" }}>
      <div style={{ display: "flex", minHeight: "840px", background: "var(--color-bg)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-md)", overflow: "hidden" }}>
        {/* Left Sidebar */}
        <AdminSidebar />

        {/* Main Content Area */}
        <main style={{ flex: 1, padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-6)", minWidth: 0 }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap" }}>
            <div>
              <p style={{ margin: "0 0 6px", fontSize: "11px", letterSpacing: ".12em", textTransform: "uppercase", color: "var(--color-accent-700)", fontWeight: 600 }}>
                วันนี้ · ภาพรวมเรียลไทม์ (TiDB Cloud)
              </p>
              <h2 style={{ margin: 0, fontSize: "30px", lineHeight: 1.1 }}>ภาพรวมร้าน</h2>
            </div>
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              <button className="btn btn-secondary">ส่งออก CSV</button>
              <Link href="/inventory" className="btn btn-primary">
                จัดการสต็อกสินค้า
              </Link>
            </div>
          </div>

          {/* 4 Metric Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-4)" }}>
            {stats.map((s: any, idx: number) => (
              <div key={idx} className="card elev-sm" style={{ gap: "6px" }}>
                <span className="card-kicker">{s.label}</span>
                <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: "30px", lineHeight: 1 }}>
                  {s.value}
                </span>
                <span style={{ fontSize: "12px", color: s.noteColor || "var(--color-neutral-700)" }}>
                  {s.note}
                </span>
              </div>
            ))}
          </div>

          {/* 2-Column Split: Urgent Stock Refill & Stock Movements Log */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--space-8)" }}>
            {/* Left: Urgent Stock Refill */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: "18px" }}>สต็อกที่ต้องเติมด่วน</h3>
                <Link href="/inventory" style={{ fontSize: "12px", color: "var(--color-accent)" }}>
                  จัดการทั้งหมด →
                </Link>
              </div>

              {lowStock.length === 0 ? (
                <p style={{ fontSize: "13px", color: "var(--color-neutral-700)" }}>
                  ทุก SKU มีสต็อกเพียงพอในระดับปลอดภัย
                </p>
              ) : (
                lowStock.slice(0, 4).map((p: any) => (
                  <div
                    key={p.sku || p.id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      paddingBottom: "var(--space-2)",
                      borderBottom: "1px solid color-mix(in srgb, var(--color-text) 8%, transparent)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "var(--space-2)" }}>
                      <span style={{ fontSize: "15px", fontWeight: 500 }}>{p.name}</span>
                      <span style={{ fontSize: "13px", color: "var(--color-neutral-700)" }}>{p.sku}</span>
                    </div>
                    <div style={{ height: "6px", background: "var(--color-neutral-300)", overflow: "hidden" }}>
                      <div style={{ height: "6px", width: p.barW, background: p.barColor }} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                      <span className={p.statusCls}>{p.statusLabel}</span>
                      <span style={{ fontSize: "12px", color: "var(--color-neutral-700)" }}>
                        {p.stockText} · จองไว้ {p.held || 0} ชิ้น
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Right: Stock Activity Log */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <h3 style={{ margin: 0, fontSize: "18px" }}>ความเคลื่อนไหวสต็อก</h3>
              {stockLog.map((e, idx) => (
                <div key={idx} style={{ display: "flex", gap: "var(--space-3)", alignItems: "baseline" }}>
                  <span style={{ fontSize: "12px", color: "var(--color-neutral-600)", minWidth: "44px" }}>
                    {e.time}
                  </span>
                  <span style={{ fontSize: "14px", flex: 1, lineHeight: 1.5 }}>{e.text}</span>
                  <span style={{ fontSize: "14px", color: e.color, whiteSpace: "nowrap", fontWeight: 600 }}>
                    {e.delta}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Orders Table */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", marginTop: "var(--space-2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "18px" }}>คำสั่งซื้อล่าสุด</h3>
              <Link href="/order" style={{ fontSize: "12px", color: "var(--color-accent)" }}>
                ดูคำสั่งซื้อทั้งหมด →
              </Link>
            </div>

            <table className="table">
              <thead>
                <tr>
                  <th>เลขที่</th>
                  <th>ลูกค้า</th>
                  <th>รายการ</th>
                  <th>ยอด</th>
                  <th>สถานะ</th>
                  <th>สต็อก</th>
                  <th>เวลา</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "var(--space-4)", color: "var(--color-neutral-700)" }}>
                      ยังไม่มีคำสั่งซื้อในระบบ
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((o: any) => {
                    let stCls = "tag tag-accent";
                    let stLabel = "กำลังจัดของ";
                    if (o.status === "PENDING_PAYMENT") {
                      stCls = "tag tag-neutral";
                      stLabel = "รอชำระเงิน";
                    } else if (o.status === "SHIPPED") {
                      stCls = "tag tag-outline";
                      stLabel = "จัดส่งแล้ว";
                    }

                    return (
                      <tr key={o.id}>
                        <td style={{ fontWeight: 600 }}>#{o.id}</td>
                        <td>{o.customerName || "ลูกค้าทั่วไป"}</td>
                        <td>{o.items?.length || 1} รายการ</td>
                        <td>{formatPrice(o.totalAmount)}</td>
                        <td>
                          <span className={stCls}>{stLabel}</span>
                        </td>
                        <td style={{ fontSize: "13px", color: "var(--color-accent-700)" }}>
                          ตัดสต็อกแล้ว
                        </td>
                        <td style={{ color: "var(--color-neutral-700)", fontSize: "13px" }}>
                          {new Date(o.createdAt || Date.now()).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}