"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "../../../components/admin-sidebar";
import { getOrders, updateOrderStatus } from "../../../lib/ecommerce-actions";
import { getSessionUserAction } from "../../../lib/auth/actions";
import type { Order } from "@/types/ecommerce";

export interface DecoratedOrder extends Order {
  rawStatus: string;
  statusLabel: string;
  statusCls: string;
  stockNote: string;
  stockColor: string;
  customerName: string;
  phone: string;
  shippingAddress: string;
  paymentMethod: string;
  totalAmount: number;
  items: Array<{
    name?: string;
    price?: number;
    quantity?: number;
    productId?: number | null;
    product?: { name?: string; price?: number };
  }>;
  itemsCount: number;
  time: string;
  dateStr: string;
}

export default function AdminOrderPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<DecoratedOrder | null>(null);
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

  const decorateOrder = (o: Order): DecoratedOrder => {
    const b = o.discountBreakdown || {};
    const rawStatus = (b.statusText || (o.status ? "paid" : "wait")).toLowerCase();

    let statusLabel = "กำลังจัดของ";
    let statusCls = "bg-sky-100 text-sky-800";
    let stockNote = "ตัดสต็อกแล้ว";
    let stockColor = "text-emerald-700";

    if (rawStatus === "wait" || rawStatus === "pending") {
      statusLabel = "รอชำระ";
      statusCls = "bg-neutral-200 text-neutral-700";
      stockNote = "ยังไม่ตัดสต็อก";
      stockColor = "text-neutral-600";
    } else if (rawStatus === "shipped") {
      statusLabel = "จัดส่งแล้ว";
      statusCls = "bg-emerald-100 text-emerald-800";
      stockNote = "ตัดสต็อกแล้ว";
      stockColor = "text-emerald-700";
    } else if (rawStatus === "cancelled") {
      statusLabel = "ยกเลิก";
      statusCls = "bg-rose-100 text-rose-800";
      stockNote = "คืนสต็อกแล้ว";
      stockColor = "text-rose-700";
    }

    const customerName = b.customerName || o.user?.email || "ลูกค้าทั่วไป";
    const phone = b.phone || "-";
    const shippingAddress = b.shippingAddress || "-";
    const paymentMethod = b.paymentMethod || "พร้อมเพย์";
    const totalAmount = o.total;
    const items = Array.isArray(b.items) && b.items.length > 0 ? b.items : (o.orderItems || []);
    const itemsCount = items.length || 1;

    return {
      ...o,
      rawStatus,
      statusLabel,
      statusCls,
      stockNote,
      stockColor,
      customerName,
      phone,
      shippingAddress,
      paymentMethod,
      totalAmount,
      items,
      itemsCount,
      time: new Date(o.createdAt || Date.now()).toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      dateStr: new Date(o.createdAt || Date.now()).toLocaleDateString("th-TH"),
    };
  };

  const decorated = orders.map(decorateOrder);

  const filtered = decorated.filter((o) => {
    const matchSearch =
      search.trim() === "" ||
      String(o.id).includes(search) ||
      o.customerName?.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;

    if (filter === "wait") return o.rawStatus === "wait" || o.rawStatus === "pending";
    if (filter === "paid") return o.rawStatus === "paid" || o.rawStatus === "processing";
    if (filter === "shipped") return o.rawStatus === "shipped";
    if (filter === "cancelled") return o.rawStatus === "cancelled";
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
      <div className="flex flex-col md:flex-row min-h-[840px] bg-bg rounded-xl shadow-md overflow-hidden border border-divider">
        <AdminSidebar />

        <main className="flex-1 p-6 flex flex-col gap-6 min-w-0">
          {/* Header */}
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-accent-700 mb-1">
                ทั้งหมด {orders.length} รายการ
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text m-0">
                คำสั่งซื้อ
              </h2>
            </div>
          </div>

          {/* Filter Bar & Search */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 p-1 rounded-lg border border-divider bg-surface">
              <button
                type="button"
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                  filter === "all" ? "bg-bg shadow-xs font-semibold" : "hover:bg-bg/60"
                }`}
                onClick={() => setFilter("all")}
              >
                ทั้งหมด ({decorated.length})
              </button>
              <button
                type="button"
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                  filter === "wait" ? "bg-bg shadow-xs font-semibold" : "hover:bg-bg/60"
                }`}
                onClick={() => setFilter("wait")}
              >
                รอชำระ ({decorated.filter((x) => x.rawStatus === "wait" || x.rawStatus === "pending").length})
              </button>
              <button
                type="button"
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                  filter === "paid" ? "bg-bg shadow-xs font-semibold" : "hover:bg-bg/60"
                }`}
                onClick={() => setFilter("paid")}
              >
                กำลังจัดของ ({decorated.filter((x) => x.rawStatus === "paid" || x.rawStatus === "processing").length})
              </button>
              <button
                type="button"
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                  filter === "shipped" ? "bg-bg shadow-xs font-semibold" : "hover:bg-bg/60"
                }`}
                onClick={() => setFilter("shipped")}
              >
                จัดส่งแล้ว ({decorated.filter((x) => x.rawStatus === "shipped").length})
              </button>
              <button
                type="button"
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                  filter === "cancelled" ? "bg-bg shadow-xs font-semibold" : "hover:bg-bg/60"
                }`}
                onClick={() => setFilter("cancelled")}
              >
                ยกเลิก ({decorated.filter((x) => x.rawStatus === "cancelled").length})
              </button>
            </div>

            <label className="flex items-center gap-2 w-full sm:w-64 ml-auto bg-surface border border-divider rounded-lg px-3 py-1.5">
              <svg className="w-4 h-4 opacity-50 shrink-0 text-text" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <line x1="16.5" y1="16.5" x2="21" y2="21" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาเลขออเดอร์ หรือ ชื่อ..."
                className="w-full bg-transparent border-0 outline-none text-xs text-text"
              />
            </label>
          </div>

          {/* Orders Table */}
          <div className="border border-divider rounded-xl bg-surface overflow-x-auto shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-divider text-neutral-600 bg-bg/40">
                  <th className="py-3 px-3 font-semibold">เลขออเดอร์</th>
                  <th className="py-3 px-3 font-semibold">ลูกค้า</th>
                  <th className="py-3 px-3 font-semibold">รายการ</th>
                  <th className="py-3 px-3 font-semibold">ยอดชำระ</th>
                  <th className="py-3 px-3 font-semibold">การชำระ</th>
                  <th className="py-3 px-3 font-semibold">สถานะ</th>
                  <th className="py-3 px-3 font-semibold">สต็อก</th>
                  <th className="py-3 px-3 font-semibold">เวลา</th>
                  <th className="py-3 px-3 font-semibold text-right">การกระทำ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-sm text-neutral-600">
                      กำลังโหลดข้อมูลคำสั่งซื้อ...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-sm text-neutral-600">
                      ไม่พบรายการคำสั่งซื้อ
                    </td>
                  </tr>
                ) : (
                  filtered.map((o: DecoratedOrder) => (
                    <tr key={o.id} className="hover:bg-bg/50 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold">#{o.id}</td>
                      <td className="py-3 px-3 font-medium">
                        <div>{o.customerName}</div>
                        <div className="text-[10px] text-neutral-500">{o.phone}</div>
                      </td>
                      <td className="py-3 px-3">{o.itemsCount} รายการ</td>
                      <td className="py-3 px-3 font-semibold">{formatPrice(o.totalAmount)}</td>
                      <td className="py-3 px-3 text-neutral-600">{o.paymentMethod}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${o.statusCls}`}>
                          {o.statusLabel}
                        </span>
                      </td>
                      <td className={`py-3 px-3 font-medium ${o.stockColor}`}>
                        {o.stockNote}
                      </td>
                      <td className="py-3 px-3 text-neutral-600 font-mono">
                        <div>{o.dateStr}</div>
                        <div className="text-[10px]">{o.time}</div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(o)}
                          className="px-2.5 py-1 text-xs font-medium rounded-md border border-divider hover:bg-bg cursor-pointer transition-colors"
                        >
                          จัดการ
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Modal: Order Details & Status Update */}
          {selectedOrder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="fixed inset-0 bg-black/40 backdrop-blur-[2px]"
                onClick={() => setSelectedOrder(null)}
              />
              <div className="relative w-full max-w-lg bg-bg rounded-xl border border-divider p-6 shadow-2xl flex flex-col gap-4 z-10">
                <div className="flex justify-between items-center pb-2 border-b border-divider">
                  <h3 className="text-lg font-bold text-text m-0">
                    คำสั่งซื้อ #{selectedOrder.id}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex flex-col gap-2 text-xs sm:text-sm">
                  <p className="m-0 text-neutral-700">
                    ลูกค้า: <strong>{selectedOrder.customerName}</strong> (โทร {selectedOrder.phone})
                  </p>
                  <p className="m-0 text-neutral-700">
                    ที่อยู่: {selectedOrder.shippingAddress || "-"}
                  </p>
                  <p className="m-0 text-neutral-800">
                    ยอดชำระ: <strong className="font-bold">{formatPrice(selectedOrder.totalAmount)}</strong> ({selectedOrder.paymentMethod})
                  </p>

                  {selectedOrder.items && selectedOrder.items.length > 0 && (
                    <div className="my-2 p-3 bg-surface rounded-lg text-xs flex flex-col gap-1.5 border border-divider">
                      <span className="font-semibold block mb-1">รายการสินค้า:</span>
                      {selectedOrder.items.map((it, idx: number) => (
                        <div key={idx} className="flex justify-between py-0.5 text-neutral-700">
                          <span>• {it.name || it.product?.name || `สินค้า #${it.productId}`} × {it.quantity || 1}</span>
                          <span className="font-medium">{formatPrice((it.price || it.product?.price || 0) * (it.quantity || 1))}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-col gap-2 pt-2">
                    <label className="text-xs font-semibold text-neutral-700">
                      ปรับสถานะคำสั่งซื้อ:
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus("processing")}
                        disabled={updating}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100 cursor-pointer disabled:opacity-50"
                      >
                        กำลังจัดของ
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus("shipped")}
                        disabled={updating}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 cursor-pointer disabled:opacity-50"
                      >
                        จัดส่งแล้ว
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus("cancelled")}
                        disabled={updating}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100 cursor-pointer disabled:opacity-50"
                      >
                        ยกเลิก (คืนสต็อก)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}