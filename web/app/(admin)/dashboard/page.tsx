"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminSidebar from "../../../components/admin-sidebar";
import { getDashboardStats } from "../../../lib/ecommerce-actions";
import { getSessionUserAction } from "../../../lib/auth/actions";
import type { DashboardStats, Order, Product, MetricCard, StockMovementLog } from "@/types/ecommerce";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardStats | null>(null);
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

  const stockLog: StockMovementLog[] = data?.stockLog || [];

  const stats: MetricCard[] = data?.stats || [
    { label: "คำสั่งซื้อทั้งหมด", value: "0", note: "ยังไม่มีคำสั่งซื้อ" },
    { label: "ยอดขายรวม", value: "฿0", note: "เฉลี่ย ฿0 ต่อบิล" },
    { label: "รอจัดส่ง", value: "0", note: "คำสั่งซื้อที่ต้องแพ็คส่ง" },
    { label: "SKU ใกล้หมด", value: "0", note: "สต็อกเหลือน้อยกว่า 10 ชิ้น" },
  ];

  const lowStock = (data?.lowStockProducts || []).map((p: Product) => {
    const stock = p.stock || 0;
    const barW = Math.min(100, Math.round((stock / 50) * 100)) + "%";
    let statusLabel = "พร้อมส่ง";
    let statusCls = "bg-emerald-100 text-emerald-700";
    let barColor = "bg-accent";

    if (stock === 0) {
      statusLabel = "หมดชั่วคราว";
      statusCls = "bg-neutral-200 text-neutral-600";
      barColor = "bg-neutral-400";
    } else if (stock <= 10) {
      statusLabel = "ใกล้หมด";
      statusCls = "bg-rose-100 text-rose-700";
      barColor = "bg-rose-500";
    }

    return {
      ...p,
      barW,
      barColor,
      statusLabel,
      statusCls,
      stockText: stock === 0 ? "รอเข้าคลัง" : `เหลือ ${stock} ชิ้น`,
    };
  });

  const recentOrders: Order[] = data?.recentOrders || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
      <div className="flex flex-col md:flex-row min-h-[840px] bg-bg rounded-xl shadow-md overflow-hidden border border-divider">
        {/* Left Sidebar */}
        <AdminSidebar />

        {/* Main Content Area */}
        <main className="flex-1 p-6 flex flex-col gap-6 min-w-0">
          {/* Header */}
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-accent-700 mb-1">
                ภาพรวมระบบแบบเรียลไทม์
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text m-0">
                ภาพรวมร้าน
              </h2>
            </div>
            <div className="flex gap-2">
              <Link
                href="/inventory"
                className="px-4 py-2 text-xs sm:text-sm font-medium rounded-lg bg-neutral-800 text-white hover:bg-neutral-900 transition-colors shadow-xs"
              >
                จัดการสต็อกสินค้า
              </Link>
            </div>
          </div>

          {/* 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s: MetricCard, idx: number) => (
              <div
                key={idx}
                className="flex flex-col gap-1 p-4 rounded-xl border border-divider bg-surface shadow-xs"
              >
                <span className="text-xs font-medium text-neutral-600 uppercase tracking-wider">
                  {s.label}
                </span>
                <span className="text-2xl sm:text-3xl font-bold text-text">
                  {s.value}
                </span>
                <span className="text-xs text-neutral-600">
                  {s.note}
                </span>
              </div>
            ))}
          </div>

          {/* 2-Column Split: Urgent Stock Refill & Stock Movements Log */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Urgent Stock Refill */}
            <div className="flex flex-col gap-3 p-5 rounded-xl border border-divider bg-surface">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-semibold text-text m-0">
                  สต็อกที่ต้องเติมด่วน
                </h3>
                <Link
                  href="/inventory"
                  className="text-xs font-medium text-accent-700 hover:underline"
                >
                  จัดการทั้งหมด →
                </Link>
              </div>

              {lowStock.length === 0 ? (
                <p className="text-xs text-neutral-600 py-4 m-0">
                  ทุก SKU มีสต็อกเพียงพอในระดับปลอดภัย
                </p>
              ) : (
                <div className="flex flex-col divide-y divide-divider">
                  {lowStock.slice(0, 4).map((p) => (
                    <div key={p.sku || p.id} className="py-2.5 flex flex-col gap-1.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-medium text-text truncate">
                          {p.name}
                        </span>
                        <span className="text-xs font-mono text-neutral-600">
                          {p.sku}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${p.barColor}`}
                          style={{ width: p.barW }}
                        />
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${p.statusCls}`}>
                          {p.statusLabel}
                        </span>
                        <span className="text-neutral-600">
                          {p.stockText}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Stock Activity Log */}
            <div className="flex flex-col gap-3 p-5 rounded-xl border border-divider bg-surface">
              <h3 className="text-base font-semibold text-text m-0">
                ความเคลื่อนไหวสต็อก
              </h3>
              {stockLog.length === 0 ? (
                <p className="text-xs text-neutral-600 py-4 m-0">
                  ยังไม่มีประวัติการตัดสต็อกล่าสุด
                </p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {stockLog.map((e: StockMovementLog, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-baseline gap-3 text-xs"
                    >
                      <span className="font-mono text-neutral-500 shrink-0">
                        {e.time}
                      </span>
                      <span className="flex-1 text-text truncate">
                        {e.text}
                      </span>
                      <span className="font-bold text-rose-600 shrink-0">
                        {e.delta}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Orders Table */}
          <div className="flex flex-col gap-3 p-5 rounded-xl border border-divider bg-surface overflow-x-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-semibold text-text m-0">
                คำสั่งซื้อล่าสุด
              </h3>
              <Link
                href="/order"
                className="text-xs font-medium text-accent-700 hover:underline"
              >
                ดูคำสั่งซื้อทั้งหมด →
              </Link>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-divider text-neutral-600">
                  <th className="py-2.5 px-3 font-semibold">เลขที่</th>
                  <th className="py-2.5 px-3 font-semibold">ลูกค้า</th>
                  <th className="py-2.5 px-3 font-semibold">รายการ</th>
                  <th className="py-2.5 px-3 font-semibold">ยอด</th>
                  <th className="py-2.5 px-3 font-semibold">สถานะ</th>
                  <th className="py-2.5 px-3 font-semibold">สต็อก</th>
                  <th className="py-2.5 px-3 font-semibold">เวลา</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-neutral-600">
                      ยังไม่มีคำสั่งซื้อในระบบ
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((o: Order) => {
                    const b = o.discountBreakdown || {};
                    const customer = b.customerName || o.user?.email || "ลูกค้าทั่วไป";
                    const itemCount = (b.items && b.items.length) || (o.orderItems && o.orderItems.length) || 1;
                    const amount = o.total;
                    const rawStatus = b.statusText || (o.status ? "paid" : "wait");

                    let stCls = "bg-sky-100 text-sky-800";
                    let stLabel = "กำลังจัดของ";
                    if (rawStatus === "wait" || rawStatus === "pending") {
                      stCls = "bg-neutral-200 text-neutral-700";
                      stLabel = "รอชำระเงิน";
                    } else if (rawStatus === "shipped") {
                      stCls = "bg-emerald-100 text-emerald-800";
                      stLabel = "จัดส่งแล้ว";
                    } else if (rawStatus === "cancelled") {
                      stCls = "bg-rose-100 text-rose-800";
                      stLabel = "ยกเลิก";
                    }

                    return (
                      <tr key={o.id} className="hover:bg-bg/50 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold">#{o.id}</td>
                        <td className="py-3 px-3 font-medium">{customer}</td>
                        <td className="py-3 px-3">{itemCount} รายการ</td>
                        <td className="py-3 px-3 font-semibold">{formatPrice(amount)}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${stCls}`}>
                            {stLabel}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-emerald-700 font-medium">
                          ตัดสต็อกแล้ว
                        </td>
                        <td className="py-3 px-3 text-neutral-600 font-mono">
                          {new Date(o.createdAt || Date.now()).toLocaleTimeString("th-TH", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
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