"use client";

import { useState } from "react";
import Link from "next/link";
import type { Order, OrderItem } from "@/types/ecommerce";

interface AccountOrdersListProps {
  orders: Order[];
}

export default function AccountOrdersList({ orders }: AccountOrdersListProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const formatPrice = (n: number) => `฿${(n || 0).toLocaleString("th-TH")}`;

  const getStatusBadge = (statusText: string) => {
    switch ((statusText || "").toLowerCase()) {
      case "paid":
      case "processing":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200 shadow-2xs whitespace-nowrap">
            กำลังจัดของ
          </span>
        );
      case "wait":
      case "pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs whitespace-nowrap">
            รอชำระเงิน
          </span>
        );
      case "shipped":
      case "sent":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs whitespace-nowrap">
            จัดส่งแล้ว
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 shadow-2xs whitespace-nowrap">
            ยกเลิก
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs whitespace-nowrap">
            สำเร็จ
          </span>
        );
    }
  };

  const getOrderBreakdown = (ord: Order) => {
    const b = ord.discountBreakdown || {};
    const rawItems = Array.isArray(b.items) && b.items.length > 0 ? b.items : ord.orderItems || [];
    const items = rawItems.map((it: unknown) => {
      const itemObj = it as {
        name?: string;
        price?: number;
        quantity?: number;
        productId?: number | null;
        product?: { name?: string; price?: number };
      };
      return {
        name: itemObj.name || itemObj.product?.name || `สินค้า #${itemObj.productId || ""}`,
        price: itemObj.price ?? itemObj.product?.price ?? 0,
        quantity: itemObj.quantity || 1,
      };
    });

    const itemsSubtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
    const subtotal = Number(b.subtotal ?? (itemsSubtotal > 0 ? itemsSubtotal : ord.total));
    const promoCode = b.promoCode || ord.promotion?.code || null;
    const shippingFee = Number(
      b.shippingFee !== undefined
        ? b.shippingFee
        : ord.total < 1500 && !promoCode?.toUpperCase().includes("FREESHIP")
        ? 50
        : 0
    );
    const discountAmount = Number(
      b.discountAmount !== undefined
        ? b.discountAmount
        : Math.max(0, subtotal + shippingFee - ord.total)
    );
    const promoDescription =
      b.promoDescription ||
      (promoCode
        ? ord.promotion?.type === "percentage"
          ? `ส่วนลด ${ord.promotion.value}% จากยอดสินค้า`
          : `ส่วนลดโค้ด ${promoCode}`
        : null);

    return {
      items,
      subtotal,
      shippingFee,
      discountAmount,
      promoCode,
      promoDescription,
      paymentMethod: b.paymentMethod || "พร้อมเพย์",
      customerName: b.customerName || "ลูกค้าทั่วไป",
      phone: b.phone || "-",
      shippingAddress: b.shippingAddress || "-",
      statusText: b.statusText || (ord.status ? "paid" : "wait"),
    };
  };

  if (orders.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-neutral-800 font-semibold mb-3">ยังไม่มีประวัติการสั่งซื้อ</p>
        <Link
          href="/list"
          className="inline-block rounded-xl bg-accent hover:bg-accent-600 active:bg-accent-700 px-5 py-2.5 text-xs font-bold !text-white transition-colors shadow-xs"
        >
          เริ่มเลือกซื้อสินค้า
        </Link>
      </div>
    );
  }

  const selectedDetails = selectedOrder ? getOrderBreakdown(selectedOrder) : null;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm text-neutral-800 min-w-[720px]">
          <thead className="border-b border-divider bg-bg text-xs font-bold text-neutral-800 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">เลขออเดอร์</th>
              <th className="py-3 px-4">วันที่สั่งซื้อ</th>
              <th className="py-3 px-4">รายการสินค้า</th>
              <th className="py-3 px-4">โค้ดส่วนลด</th>
              <th className="py-3 px-4">ยอดรวมสุทธิ</th>
              <th className="py-3 px-4">สถานะ</th>
              <th className="py-3 px-4 text-right">รายละเอียด</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-divider">
            {orders.map((ord: Order) => {
              const b = getOrderBreakdown(ord);
              return (
                <tr key={ord.id} className="hover:bg-bg/60 transition-colors">
                  {/* Order Number Button */}
                  <td className="py-3.5 px-4 font-mono font-bold whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(ord)}
                      className="font-mono font-bold text-accent hover:text-accent-700 hover:underline cursor-pointer inline-flex items-center gap-1 group transition-colors"
                      title="คลิกเพื่อดูรายละเอียดคำสั่งซื้อนี้"
                    >
                      <span>#{ord.id.toString().padStart(5, "0")}</span>
                      <svg className="w-3.5 h-3.5 text-accent/50 group-hover:text-accent transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 3h6v6" />
                        <path d="M10 14L21 3" />
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      </svg>
                    </button>
                  </td>

                  {/* Order Date */}
                  <td className="py-3.5 px-4 text-xs text-neutral-700 font-medium whitespace-nowrap">
                    {new Date(ord.createdAt).toLocaleDateString("th-TH", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>

                  {/* Items Summary */}
                  <td className="py-3.5 px-4 text-xs font-medium text-text max-w-[200px]">
                    <div className="truncate" title={b.items.map((it) => `${it.name} (${it.quantity})`).join(", ")}>
                      {b.items.length > 0 ? (
                        <span>
                          <strong className="text-text font-bold">{b.items.length} รายการ</strong> · {b.items[0].name}
                          {b.items.length > 1 && ` และอื่นๆ (${b.items.length - 1})`}
                        </span>
                      ) : (
                        "-"
                      )}
                    </div>
                  </td>

                  {/* Promotion Code & Discount */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {b.promoCode ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono font-bold text-[11px] bg-emerald-100 text-emerald-800 border border-emerald-300 w-fit">
                          <span>🏷️</span>
                          <span>{b.promoCode}</span>
                        </span>
                        {b.discountAmount > 0 && (
                          <span className="text-[11px] text-emerald-700 font-bold">
                            −{formatPrice(b.discountAmount)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-neutral-500 text-xs">-</span>
                    )}
                  </td>

                  {/* Net Amount */}
                  <td className="py-3.5 px-4 font-bold text-text whitespace-nowrap">
                    {formatPrice(ord.total)}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {getStatusBadge(b.statusText)}
                  </td>

                  {/* View Details CTA */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(ord)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-divider bg-surface hover:bg-bg text-neutral-800 cursor-pointer transition-all shadow-2xs hover:shadow-xs"
                    >
                      ดูรายละเอียด
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ========================================================================= */}
      {/* Order Details Modal (รายละเอียดคำสั่งซื้อ, สินค้า, ส่วนลด, ค่าจัดส่ง)       */}
      {/* ========================================================================= */}
      {selectedOrder && selectedDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs"
            onClick={() => setSelectedOrder(null)}
          />
          <div className="relative w-full max-w-lg bg-surface rounded-2xl border border-divider p-6 shadow-2xl flex flex-col gap-5 z-10 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-3 border-b border-divider">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-accent font-mono">
                  รายละเอียดคำสั่งซื้อ
                </span>
                <h3 className="text-xl font-bold text-text m-0 mt-0.5">
                  คำสั่งซื้อ #{selectedOrder.id.toString().padStart(5, "0")}
                </h3>
                <p className="text-xs text-neutral-500 m-0 mt-1 font-mono">
                  {new Date(selectedOrder.createdAt).toLocaleDateString("th-TH", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
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

            {/* Status & Delivery Details */}
            <div className="p-3.5 rounded-xl bg-bg border border-divider flex flex-col gap-2 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-divider">
                <span className="text-neutral-700 font-medium">สถานะคำสั่งซื้อ:</span>
                <div>{getStatusBadge(selectedDetails.statusText)}</div>
              </div>
              <div className="flex justify-between items-start gap-2">
                <span className="text-neutral-700 font-medium">ผู้รับสินค้า:</span>
                <span className="font-bold text-text text-right">{selectedDetails.customerName} (โทร {selectedDetails.phone})</span>
              </div>
              <div className="flex justify-between items-start gap-2">
                <span className="text-neutral-700 font-medium">ที่อยู่จัดส่ง:</span>
                <span className="font-medium text-text text-right max-w-[240px]">{selectedDetails.shippingAddress}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-neutral-700 font-medium">วิธีชำระเงิน:</span>
                <span className="font-semibold text-text">{selectedDetails.paymentMethod}</span>
              </div>
            </div>

            {/* Order Items List */}
            <div className="p-3.5 bg-bg rounded-xl text-xs flex flex-col gap-2 border border-divider">
              <span className="font-bold text-text block pb-1 border-b border-divider">
                รายการสินค้าในคำสั่งซื้อ ({selectedDetails.items.length} รายการ):
              </span>
              <div className="divide-y divide-divider/70">
                {selectedDetails.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 text-neutral-800">
                    <div className="flex flex-col min-w-0 mr-3">
                      <span className="font-semibold text-text truncate">• {it.name}</span>
                      <span className="text-[11px] text-neutral-500 font-mono">
                        {it.quantity} ชิ้น × {formatPrice(it.price)}
                      </span>
                    </div>
                    <span className="font-bold text-text shrink-0">{formatPrice(it.price * it.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary Breakdown */}
            <div className="p-3.5 bg-bg rounded-xl text-xs flex flex-col gap-2 border border-divider">
              <span className="font-bold text-text block pb-1 border-b border-divider">
                สรุปยอดเงินและส่วนลด:
              </span>
              <div className="flex justify-between text-neutral-800">
                <span>ยอดรวมสินค้า</span>
                <span className="font-semibold text-text">{formatPrice(selectedDetails.subtotal)}</span>
              </div>

              {/* Promo Code Details */}
              <div className="flex justify-between items-center text-neutral-800">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span>โค้ดส่วนลด:</span>
                  {selectedDetails.promoCode ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono font-bold text-[11px] bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <span>🏷️</span>
                      <span>{selectedDetails.promoCode}</span>
                    </span>
                  ) : (
                    <span className="text-neutral-500 font-normal">ไม่มี</span>
                  )}
                </div>
                {selectedDetails.discountAmount > 0 ? (
                  <span className="font-bold text-emerald-700">
                    −{formatPrice(selectedDetails.discountAmount)}
                  </span>
                ) : (
                  <span className="text-neutral-500 font-mono">฿0</span>
                )}
              </div>

              {selectedDetails.promoDescription && (
                <p className="text-[11px] text-emerald-800 font-medium m-0 pl-1">
                  ↳ {selectedDetails.promoDescription}
                </p>
              )}

              {/* Shipping Fee */}
              <div className="flex justify-between items-center text-neutral-800">
                <span>ค่าจัดส่ง:</span>
                <span className="font-semibold text-text">
                  {selectedDetails.shippingFee === 0 ? (
                    <span className="text-emerald-700 font-bold">ฟรี (฿0)</span>
                  ) : (
                    formatPrice(selectedDetails.shippingFee)
                  )}
                </span>
              </div>

              {/* Grand Total */}
              <div className="flex justify-between items-baseline pt-2 border-t border-divider text-sm">
                <span className="font-bold text-text">ยอดชำระสุทธิ:</span>
                <span className="font-extrabold text-base text-text">
                  {formatPrice(selectedOrder.total)}
                </span>
              </div>
            </div>

            {/* Close CTA */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold rounded-xl bg-neutral-800 text-white hover:bg-neutral-900 transition-colors cursor-pointer text-center"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
