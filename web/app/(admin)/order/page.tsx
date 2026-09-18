"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "../../../components/admin-sidebar";
import {
  getOrders,
  updateOrderStatus,
  getProducts,
  createManualOrderAction,
} from "../../../lib/ecommerce-actions";
import { getSessionUserAction } from "../../../lib/auth/actions";
import type { Order, Product } from "@/types/ecommerce";

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
  channel: string;
  isManual: boolean;
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

export interface ManualOrderItemRow {
  productId: number;
  product: Product;
  quantity: number;
  price: number;
}

export default function AdminOrderPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<DecoratedOrder | null>(null);
  const [updating, setUpdating] = useState(false);

  // Create Manual Order Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [channel, setChannel] = useState("หน้าร้าน / Walk-in");
  const [paymentMethod, setPaymentMethod] = useState("โอนเงิน / พร้อมเพย์");
  const [statusText, setStatusText] = useState("paid");
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [note, setNote] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [manualItems, setManualItems] = useState<ManualOrderItemRow[]>([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

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
    let statusCls = "bg-sky-50 text-sky-800 border border-sky-300";
    let stockNote = "ตัดสต็อกแล้ว";
    let stockColor = "text-emerald-700";

    if (rawStatus === "wait" || rawStatus === "pending") {
      statusLabel = "รอชำระ";
      statusCls = "bg-neutral-100 text-neutral-800 border border-neutral-300";
      stockNote = "ยังไม่ตัดสต็อก";
      stockColor = "text-neutral-700";
    } else if (rawStatus === "shipped") {
      statusLabel = "จัดส่งแล้ว";
      statusCls = "bg-emerald-50 text-emerald-800 border border-emerald-300";
      stockNote = "ตัดสต็อกแล้ว";
      stockColor = "text-emerald-700";
    } else if (rawStatus === "cancelled") {
      statusLabel = "ยกเลิก";
      statusCls = "bg-rose-50 text-rose-800 border border-rose-300";
      stockNote = "คืนสต็อกแล้ว";
      stockColor = "text-rose-700";
    }

    const customerName = b.customerName || o.user?.email || "ลูกค้าทั่วไป";
    const phone = b.phone || "-";
    const shippingAddress = b.shippingAddress || "-";
    const paymentMethod = b.paymentMethod || "พร้อมเพย์";
    const isManual = Boolean(b.isManual || b.channel);
    const channel = b.channel || (isManual ? "หน้าร้าน / Walk-in" : "สั่งซื้อผ่านเว็บ");
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
      channel,
      isManual,
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
      o.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      o.channel?.toLowerCase().includes(search.toLowerCase());

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

  const handleOpenCreateModal = async () => {
    setIsCreateModalOpen(true);
    setCreateError(null);
    setCustomerName("");
    setPhone("");
    setShippingAddress("");
    setChannel("หน้าร้าน / Walk-in");
    setPaymentMethod("โอนเงิน / พร้อมเพย์");
    setStatusText("paid");
    setShippingFee(0);
    setDiscountAmount(0);
    setNote("");
    setSelectedProductId("");
    setManualItems([]);

    if (products.length === 0) {
      setLoadingProducts(true);
      const prods = await getProducts();
      setProducts(prods);
      setLoadingProducts(false);
    }
  };

  const handleAddItem = (productId: number) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    setManualItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        const newQty = existing.quantity + 1;
        if (statusText === "paid" && newQty > prod.stock) {
          alert(`สินค้า "${prod.name}" เหลือในสต็อกเพียง ${prod.stock} ชิ้น`);
          return prev;
        }
        return prev.map((i) =>
          i.productId === productId ? { ...i, quantity: newQty } : i
        );
      }
      return [
        ...prev,
        {
          productId: prod.id,
          product: prod,
          quantity: 1,
          price: prod.price,
        },
      ];
    });
    setSelectedProductId("");
  };

  const handleUpdateItemQty = (productId: number, qty: number) => {
    if (qty <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setManualItems((prev) =>
      prev.map((it) => {
        if (it.productId === productId) {
          if (statusText === "paid" && qty > it.product.stock) {
            alert(`สินค้า "${it.product.name}" มีในสต็อก ${it.product.stock} ชิ้น`);
            return { ...it, quantity: it.product.stock };
          }
          return { ...it, quantity: qty };
        }
        return it;
      })
    );
  };

  const handleUpdateItemPrice = (productId: number, price: number) => {
    setManualItems((prev) =>
      prev.map((it) =>
        it.productId === productId ? { ...it, price: Math.max(0, price) } : it
      )
    );
  };

  const handleRemoveItem = (productId: number) => {
    setManualItems((prev) => prev.filter((it) => it.productId !== productId));
  };

  const manualSubtotal = manualItems.reduce(
    (acc, it) => acc + it.price * it.quantity,
    0
  );
  const manualGrandTotal = Math.max(
    0,
    manualSubtotal - (Number(discountAmount) || 0) + (Number(shippingFee) || 0)
  );

  const handleSubmitManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!customerName.trim()) {
      setCreateError("กรุณาระบุชื่อลูกค้า");
      return;
    }

    if (manualItems.length === 0) {
      setCreateError("กรุณาเลือกสินค้าอย่างน้อย 1 รายการ");
      return;
    }

    if (statusText === "paid") {
      const overstock = manualItems.find((i) => i.quantity > i.product.stock);
      if (overstock) {
        setCreateError(
          `สินค้า "${overstock.product.name}" เหลือสต็อกเพียง ${overstock.product.stock} ชิ้น ไม่พอสำหรับจำนวน ${overstock.quantity} ชิ้น`
        );
        return;
      }
    }

    setCreating(true);
    const res = await createManualOrderAction({
      customerName: customerName.trim(),
      phone: phone.trim() || undefined,
      shippingAddress: shippingAddress.trim() || undefined,
      paymentMethod,
      channel,
      statusText,
      shippingFee: Number(shippingFee) || 0,
      discountAmount: Number(discountAmount) || 0,
      note: note.trim() || undefined,
      items: manualItems.map((it) => ({
        productId: it.productId,
        quantity: it.quantity,
        price: it.price,
      })),
    });

    if (!res.ok) {
      setCreateError(res.error || "เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ");
      setCreating(false);
      return;
    }

    await loadOrders();
    setIsCreateModalOpen(false);
    setCreating(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-12 sm:pb-16">
      <div className="flex flex-col md:flex-row min-h-[840px] bg-bg rounded-2xl shadow-md overflow-hidden border border-divider">
        <AdminSidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col gap-6 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-accent-700 mb-1">
                ทั้งหมด {orders.length} รายการ
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text m-0">
                คำสั่งซื้อ
              </h2>
            </div>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent !text-white text-xs sm:text-sm font-bold shadow-xs hover:brightness-105 active:scale-95 transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span> สร้างคำสั่งซื้อ</span>
            </button>
          </div>

          {/* Filter Bar & Search */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 p-1 rounded-xl border border-divider bg-surface shadow-2xs overflow-x-auto max-w-full">
              <button
                type="button"
                className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  filter === "all"
                    ? "bg-accent text-white shadow-xs"
                    : "text-neutral-700 hover:text-neutral-900 hover:bg-bg"
                }`}
                onClick={() => setFilter("all")}
              >
                ทั้งหมด ({decorated.length})
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  filter === "wait"
                    ? "bg-accent text-white shadow-xs"
                    : "text-neutral-700 hover:text-neutral-900 hover:bg-bg"
                }`}
                onClick={() => setFilter("wait")}
              >
                รอชำระ ({decorated.filter((x) => x.rawStatus === "wait" || x.rawStatus === "pending").length})
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  filter === "paid"
                    ? "bg-accent text-white shadow-xs"
                    : "text-neutral-700 hover:text-neutral-900 hover:bg-bg"
                }`}
                onClick={() => setFilter("paid")}
              >
                กำลังจัดของ ({decorated.filter((x) => x.rawStatus === "paid" || x.rawStatus === "processing").length})
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  filter === "shipped"
                    ? "bg-accent text-white shadow-xs"
                    : "text-neutral-700 hover:text-neutral-900 hover:bg-bg"
                }`}
                onClick={() => setFilter("shipped")}
              >
                จัดส่งแล้ว ({decorated.filter((x) => x.rawStatus === "shipped").length})
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  filter === "cancelled"
                    ? "bg-accent text-white shadow-xs"
                    : "text-neutral-700 hover:text-neutral-900 hover:bg-bg"
                }`}
                onClick={() => setFilter("cancelled")}
              >
                ยกเลิก ({decorated.filter((x) => x.rawStatus === "cancelled").length})
              </button>
            </div>

            <label className="flex items-center gap-2 w-full sm:w-72 ml-auto bg-surface border border-divider rounded-xl px-3.5 py-2 focus-within:ring-2 focus-within:ring-accent focus-within:border-transparent transition-all shadow-2xs">
              <svg className="w-4 h-4 text-neutral-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <line x1="16.5" y1="16.5" x2="21" y2="21" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาเลขออเดอร์ หรือ ชื่อ..."
                className="w-full bg-transparent border-0 outline-none text-xs text-text placeholder:text-neutral-500"
              />
            </label>
          </div>

          {/* Orders Table */}
          <div className="border border-divider rounded-2xl bg-surface overflow-x-auto shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-divider text-neutral-700 font-bold tracking-wider uppercase text-[11px] bg-bg/40">
                  <th className="py-3.5 px-4">เลขออเดอร์</th>
                  <th className="py-3.5 px-4">ลูกค้า</th>
                  <th className="py-3.5 px-4">รายการ</th>
                  <th className="py-3.5 px-4">ยอดชำระ</th>
                  <th className="py-3.5 px-4">การชำระ</th>
                  <th className="py-3.5 px-4">สถานะ</th>
                  <th className="py-3.5 px-4">สต็อก</th>
                  <th className="py-3.5 px-4">เวลา</th>
                  <th className="py-3.5 px-4 text-right">การกระทำ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-sm font-medium text-neutral-700">
                      กำลังโหลดข้อมูลคำสั่งซื้อ...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-sm font-medium text-neutral-700">
                      ไม่พบรายการคำสั่งซื้อ
                    </td>
                  </tr>
                ) : (
                  filtered.map((o: DecoratedOrder) => (
                    <tr key={o.id} className="hover:bg-bg/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-text">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>#{o.id}</span>
                          {o.isManual ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 whitespace-nowrap">
                              {o.channel}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200 whitespace-nowrap">
                              เว็บ
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-text">{o.customerName}</div>
                        <div className="text-[11px] text-neutral-600">{o.phone}</div>
                      </td>
                      <td className="py-3.5 px-4 text-neutral-800 font-medium">{o.itemsCount} รายการ</td>
                      <td className="py-3.5 px-4 font-bold text-text">{formatPrice(o.totalAmount)}</td>
                      <td className="py-3.5 px-4 text-neutral-700">{o.paymentMethod}</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${o.statusCls}`}>
                          {o.statusLabel}
                        </span>
                      </td>
                      <td className={`py-3.5 px-4 font-semibold ${o.stockColor}`}>
                        {o.stockNote}
                      </td>
                      <td className="py-3.5 px-4 text-neutral-700 font-mono">
                        <div className="font-medium">{o.dateStr}</div>
                        <div className="text-[10px] text-neutral-600">{o.time}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(o)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-divider bg-surface hover:bg-bg text-neutral-800 cursor-pointer transition-all shadow-2xs hover:shadow-xs"
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
                className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs"
                onClick={() => setSelectedOrder(null)}
              />
              <div className="relative w-full max-w-lg bg-surface rounded-2xl border border-divider p-6 shadow-2xl flex flex-col gap-5 z-10 animate-in fade-in zoom-in-95">
                <div className="flex justify-between items-center pb-3 border-b border-divider">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider font-bold text-accent-700 font-mono">
                      รายละเอียดคำสั่งซื้อ
                    </span>
                    <h3 className="text-xl font-bold text-text m-0">
                      คำสั่งซื้อ #{selectedOrder.id}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    aria-label="ปิดหน้าต่าง"
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-neutral-600 hover:text-neutral-900 hover:bg-bg border border-divider transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex flex-col gap-3 text-xs sm:text-sm">
                  <div className="p-3.5 rounded-xl bg-bg border border-divider flex flex-col gap-2">
                    <p className="m-0 text-neutral-800">
                      ลูกค้า: <strong className="font-bold text-text">{selectedOrder.customerName}</strong> (โทร {selectedOrder.phone})
                    </p>
                    <p className="m-0 text-neutral-800">
                      ช่องทางการขาย: <strong className="font-semibold text-accent-700">{selectedOrder.channel}</strong>
                    </p>
                    <p className="m-0 text-neutral-800">
                      ที่อยู่จัดส่ง: <span className="font-medium text-text">{selectedOrder.shippingAddress || "-"}</span>
                    </p>
                    <p className="m-0 text-neutral-800">
                      ยอดชำระ: <strong className="font-bold text-text text-base">{formatPrice(selectedOrder.totalAmount)}</strong> ({selectedOrder.paymentMethod})
                    </p>
                  </div>

                  {selectedOrder.items && selectedOrder.items.length > 0 && (
                    <div className="p-3.5 bg-bg rounded-xl text-xs flex flex-col gap-2 border border-divider">
                      <span className="font-bold text-text block">รายการสินค้า:</span>
                      <div className="divide-y divide-divider/70">
                        {selectedOrder.items.map((it, idx: number) => (
                          <div key={idx} className="flex justify-between py-1.5 text-neutral-800">
                            <span className="font-medium">• {it.name || it.product?.name || `สินค้า #${it.productId}`} × {it.quantity || 1}</span>
                            <span className="font-bold text-text">{formatPrice((it.price || it.product?.price || 0) * (it.quantity || 1))}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-2 pt-2 border-t border-divider">
                    <label className="text-xs font-bold text-neutral-800">
                      ปรับสถานะคำสั่งซื้อ:
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus("processing")}
                        disabled={updating}
                        className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-sky-400 bg-sky-50 text-sky-900 hover:bg-sky-100 active:bg-sky-200 cursor-pointer disabled:opacity-50 transition-colors shadow-2xs"
                      >
                        กำลังจัดของ
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus("shipped")}
                        disabled={updating}
                        className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-emerald-400 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 active:bg-emerald-200 cursor-pointer disabled:opacity-50 transition-colors shadow-2xs"
                      >
                        จัดส่งแล้ว
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus("cancelled")}
                        disabled={updating}
                        className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-rose-400 bg-rose-50 text-rose-900 hover:bg-rose-100 active:bg-rose-200 cursor-pointer disabled:opacity-50 transition-colors shadow-2xs"
                      >
                        ยกเลิก (คืนสต็อก)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal: Create Manual Order */}
          {isCreateModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs"
                onClick={() => !creating && setIsCreateModalOpen(false)}
              />
              <div className="relative w-full max-w-3xl max-h-[92vh] bg-surface rounded-2xl border border-divider shadow-2xl flex flex-col z-10 animate-in fade-in zoom-in-95 overflow-hidden">
                {/* Modal Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-divider bg-bg/50">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider font-bold text-accent-700 font-mono">
                      Manual Order
                    </span>
                    <h3 className="text-xl font-bold text-text m-0">
                      สร้างคำสั่งซื้อใหม่ (สั่งซื้อโดยตรง)
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => !creating && setIsCreateModalOpen(false)}
                    aria-label="ปิดหน้าต่าง"
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-neutral-600 hover:text-neutral-900 hover:bg-bg border border-divider transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Modal Body - Scrollable */}
                <form onSubmit={handleSubmitManualOrder} className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 text-xs">
                  {/* Error Notification */}
                  {createError && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
                      <svg className="w-4 h-4 text-rose-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span>{createError}</span>
                    </div>
                  )}

                  {/* Section 1: Customer & Delivery Details */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-sm font-bold text-text m-0 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-accent" />
                      ข้อมูลลูกค้าและการจัดส่ง
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="font-semibold text-neutral-700">
                          ชื่อลูกค้า <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="เช่น สมชาย ใจดี หรือ ลูกค้าหน้าร้าน"
                          className="w-full bg-bg border border-divider rounded-xl px-3.5 py-2 text-text outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="font-semibold text-neutral-700">
                          เบอร์โทรศัพท์
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="เช่น 0812345678"
                          className="w-full bg-bg border border-divider rounded-xl px-3.5 py-2 text-text outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="font-semibold text-neutral-700">
                          ช่องทางการขาย
                        </label>
                        <select
                          value={channel}
                          onChange={(e) => setChannel(e.target.value)}
                          className="w-full bg-bg border border-divider rounded-xl px-3 py-2 text-text outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                        >
                          <option value="หน้าร้าน / Walk-in">หน้าร้าน / Walk-in</option>
                          <option value="LINE Official">LINE Official</option>
                          <option value="Facebook / Messenger">Facebook / Messenger</option>
                          <option value="โทรศัพท์ / Direct Call">โทรศัพท์ / Direct Call</option>
                          <option value="Shopee / Lazada">Shopee / Lazada</option>
                          <option value="อื่นๆ">อื่นๆ</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="font-semibold text-neutral-700">
                          วิธีชำระเงิน <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-full bg-bg border border-divider rounded-xl px-3 py-2 text-text outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                        >
                          <option value="โอนเงิน / พร้อมเพย์">โอนเงิน / พร้อมเพย์</option>
                          <option value="เงินสด (Cash)">เงินสด (Cash)</option>
                          <option value="เก็บเงินปลายทาง (COD)">เก็บเงินปลายทาง (COD)</option>
                          <option value="บัตรเครดิต / เดบิต">บัตรเครดิต / เดบิต</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2 flex flex-col gap-1.5">
                        <label className="font-semibold text-neutral-700">
                          ที่อยู่จัดส่งสินค้า
                        </label>
                        <textarea
                          rows={2}
                          value={shippingAddress}
                          onChange={(e) => setShippingAddress(e.target.value)}
                          placeholder="กรอกที่อยู่สำหรับจัดส่งพัสดุ (หรือใส่ '-' หากรับสินค้าหน้าร้าน)"
                          className="w-full bg-bg border border-divider rounded-xl px-3.5 py-2 text-text outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Product Selector & Items */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-text m-0 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-accent" />
                        รายการสินค้า ({manualItems.length})
                      </h4>
                      {loadingProducts && (
                        <span className="text-[11px] text-neutral-500">กำลังโหลดสินค้า...</span>
                      )}
                    </div>

                    {/* Add Product Dropdown Bar */}
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedProductId}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                        className="flex-1 bg-bg border border-divider rounded-xl px-3.5 py-2 text-text outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-xs"
                      >
                        <option value="">-- เลือกสินค้าที่ต้องการเพิ่ม --</option>
                        {products
                          .filter((p) => p.isActive)
                          .map((p) => (
                            <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                              [{p.sku}] {p.name} - ฿{p.price.toLocaleString("th-TH")} (คงเหลือ: {p.stock} ชิ้น)
                              {p.stock <= 0 ? " [หมด]" : ""}
                            </option>
                          ))}
                      </select>
                      <button
                        type="button"
                        disabled={!selectedProductId}
                        onClick={() => {
                          if (selectedProductId) {
                            handleAddItem(Number(selectedProductId));
                          }
                        }}
                        className="px-4 py-2 rounded-xl bg-accent !text-white font-bold hover:brightness-105 active:scale-95 transition-all disabled:opacity-50 cursor-pointer shrink-0 shadow-2xs"
                      >
                        + เพิ่มสินค้า
                      </button>
                    </div>

                    {/* Selected Items List */}
                    {manualItems.length === 0 ? (
                      <div className="p-6 rounded-xl border border-dashed border-divider text-center text-neutral-500 bg-bg/40">
                        ยังไม่มีรายการสินค้าในคำสั่งซื้อ — กรุณาเลือกสินค้าจากรายการด้านบน
                      </div>
                    ) : (
                      <div className="border border-divider rounded-xl overflow-hidden bg-bg">
                        <div className="divide-y divide-divider">
                          {manualItems.map((item) => (
                            <div key={item.productId} className="p-3 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                              <div className="flex-1 min-w-[180px]">
                                <span className="font-mono text-[11px] text-accent-700 font-bold block">
                                  {item.product.sku}
                                </span>
                                <span className="font-semibold text-text block">
                                  {item.product.name}
                                </span>
                                <span className="text-[11px] text-neutral-500">
                                  สต็อกคงเหลือ: {item.product.stock} ชิ้น
                                </span>
                              </div>

                              {/* Price per unit input */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-neutral-500 text-[11px]">฿</span>
                                <input
                                  type="number"
                                  min={0}
                                  value={item.price}
                                  onChange={(e) =>
                                    handleUpdateItemPrice(item.productId, Number(e.target.value))
                                  }
                                  className="w-20 bg-surface border border-divider rounded-lg px-2 py-1 text-right text-text font-bold outline-none focus:ring-1 focus:ring-accent"
                                  title="ราคาต่อหน่วย (สามารถแก้ไขได้)"
                                />
                              </div>

                              {/* Quantity controls */}
                              <div className="flex items-center gap-1 shrink-0 bg-surface border border-divider rounded-lg p-0.5">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateItemQty(item.productId, item.quantity - 1)}
                                  className="w-6 h-6 rounded flex items-center justify-center text-neutral-600 hover:bg-bg active:scale-95 font-bold cursor-pointer"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min={1}
                                  max={item.product.stock}
                                  value={item.quantity}
                                  onChange={(e) =>
                                    handleUpdateItemQty(item.productId, Number(e.target.value))
                                  }
                                  className="w-10 text-center font-bold text-text bg-transparent border-0 outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleUpdateItemQty(item.productId, item.quantity + 1)}
                                  className="w-6 h-6 rounded flex items-center justify-center text-neutral-600 hover:bg-bg active:scale-95 font-bold cursor-pointer"
                                >
                                  +
                                </button>
                              </div>

                              {/* Line Total */}
                              <div className="w-24 text-right font-bold text-text shrink-0">
                                ฿{(item.price * item.quantity).toLocaleString("th-TH")}
                              </div>

                              {/* Remove Button */}
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.productId)}
                                className="w-7 h-7 rounded-lg text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                                title="ลบรายการนี้"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Section 3: Financial Summary & Status Option */}
                  <div className="p-4 rounded-xl bg-bg border border-divider flex flex-col gap-3">
                    <div className="flex items-center justify-between text-neutral-700">
                      <span>ยอดรวมสินค้า (Subtotal):</span>
                      <span className="font-bold text-text font-mono">
                        ฿{manualSubtotal.toLocaleString("th-TH")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-neutral-700 gap-4">
                      <span>ค่าจัดส่ง:</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShippingFee(0)}
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            shippingFee === 0
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                              : "bg-surface text-neutral-600 border-divider hover:bg-bg"
                          }`}
                        >
                          ส่งฟรี
                        </button>
                        <button
                          type="button"
                          onClick={() => setShippingFee(50)}
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            shippingFee === 50
                              ? "bg-sky-50 text-sky-700 border-sky-300"
                              : "bg-surface text-neutral-600 border-divider hover:bg-bg"
                          }`}
                        >
                          ปกติ ฿50
                        </button>
                        <div className="flex items-center gap-1">
                          <span className="text-neutral-500 text-[11px]">฿</span>
                          <input
                            type="number"
                            min={0}
                            value={shippingFee}
                            onChange={(e) => setShippingFee(Number(e.target.value))}
                            className="w-16 bg-surface border border-divider rounded-lg px-2 py-1 text-right text-text font-bold outline-none focus:ring-1 focus:ring-accent"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-neutral-700 gap-4">
                      <span>ส่วนลดเพิ่มเติม:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-neutral-500 text-[11px]">฿</span>
                        <input
                          type="number"
                          min={0}
                          value={discountAmount}
                          onChange={(e) => setDiscountAmount(Number(e.target.value))}
                          placeholder="0"
                          className="w-20 bg-surface border border-divider rounded-lg px-2 py-1 text-right text-text font-bold outline-none focus:ring-1 focus:ring-accent"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-divider flex items-center justify-between">
                      <span className="text-sm font-bold text-text">ยอดรวมสุทธิ:</span>
                      <span className="text-xl font-bold text-accent font-mono">
                        ฿{manualGrandTotal.toLocaleString("th-TH")}
                      </span>
                    </div>

                    {/* Stock Deduction Option */}
                    <div className="pt-2 border-t border-divider flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="font-semibold text-neutral-700">
                        สถานะและการตัดสต็อก:
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setStatusText("paid")}
                          className={`px-3 py-1 rounded-xl font-semibold text-xs border transition-all cursor-pointer ${
                            statusText === "paid"
                              ? "bg-accent !text-white border-accent shadow-2xs"
                              : "bg-surface text-neutral-700 border-divider hover:bg-bg"
                          }`}
                        >
                          ✓ ชำระแล้ว (ตัดสต็อกทันที)
                        </button>
                        <button
                          type="button"
                          onClick={() => setStatusText("wait")}
                          className={`px-3 py-1 rounded-xl font-semibold text-xs border transition-all cursor-pointer ${
                            statusText === "wait"
                              ? "bg-accent !text-white border-accent shadow-2xs"
                              : "bg-surface text-neutral-700 border-divider hover:bg-bg"
                          }`}
                        >
                          ⏳ รอชำระ (ยังไม่ตัดสต็อก)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Note */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-semibold text-neutral-700">
                      หมายเหตุคำสั่งซื้อ (ถ้ามี)
                    </label>
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="เช่น ลูกค้าขอส่งด่วนภายในวันนี้ หรือ สั่งทางข้อความแชท"
                      className="w-full bg-bg border border-divider rounded-xl px-3.5 py-2 text-text outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    />
                  </div>

                  {/* Modal Actions */}
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-divider">
                    <button
                      type="button"
                      disabled={creating}
                      onClick={() => setIsCreateModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl border border-divider bg-surface hover:bg-bg text-neutral-700 font-semibold cursor-pointer transition-all"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={creating || manualItems.length === 0}
                      className="px-6 py-2.5 rounded-xl bg-accent !text-white font-bold hover:brightness-105 active:scale-95 transition-all shadow-md disabled:opacity-50 cursor-pointer flex items-center gap-2"
                    >
                      {creating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>กำลังบันทึก...</span>
                        </>
                      ) : (
                        <span>สร้างคำสั่งซื้อ</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}