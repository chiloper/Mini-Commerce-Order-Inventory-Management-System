"use client";

import React, { useState } from "react";
import type { DecoratedOrder } from "./order-table";
import { updateOrderStatus } from "../../lib/ecommerce-actions";

interface OrderDetailsModalProps {
  order: DecoratedOrder | null;
  onClose: () => void;
  onStatusUpdated: () => void;
  onShowAlert: (title: string, desc: string, variant?: "info" | "warning" | "danger") => void;
}

export default function OrderDetailsModal({
  order,
  onClose,
  onStatusUpdated,
  onShowAlert,
}: OrderDetailsModalProps) {
  const [updating, setUpdating] = useState(false);

  if (!order) return null;

  const formatPrice = (n: number) => `฿${(n || 0).toLocaleString("th-TH")}`;
  const isShipped = order.rawStatus === "shipped";

  const handleUpdateStatus = async (newStatus: string) => {
    if (isShipped) {
      onShowAlert(
        "ไม่สามารถแก้ไขได้",
        "คำสั่งซื้อที่จัดส่งแล้วถูกล็อคสถานะ ไม่สามารถปรับเปลี่ยนสถานะได้อีก เพื่อความถูกต้องทางบัญชีและสต็อก",
        "warning"
      );
      return;
    }
    setUpdating(true);
    const res = await updateOrderStatus(order.id, newStatus);
    if (res.ok) {
      onStatusUpdated();
      onClose();
    } else {
      onShowAlert("เกิดข้อผิดพลาด", res.error || "ไม่สามารถอัปเดตสถานะได้", "danger");
    }
    setUpdating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-surface border border-divider rounded-2xl p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex justify-between items-start pb-3 border-b border-divider">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold font-mono text-accent">#{order.id}</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${order.statusCls}`}>
                {order.statusLabel}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-200">
                {order.channel}
              </span>
            </div>
            <p className="text-xs text-neutral-600 m-0 mt-1">
              สั่งซื้อเมื่อ {order.dateStr} เวลา {order.time} น.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-neutral-600 hover:text-text hover:bg-bg border border-divider transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Customer & Delivery Address */}
        <div className="p-3.5 rounded-xl bg-bg border border-divider flex flex-col gap-1 text-xs">
          <div className="flex justify-between items-baseline font-semibold text-text">
            <span>ผู้รับ: {order.customerName}</span>
            {order.phone && <span className="font-mono text-neutral-600">{order.phone}</span>}
          </div>
          <div className="text-neutral-600">
            ที่อยู่: {order.shippingAddress || "รับสินค้าเองที่หน้าร้าน / Walk-in"}
          </div>
          <div className="text-neutral-600 mt-1">
            การชำระเงิน: <strong className="text-text">{order.paymentMethod}</strong>
          </div>
        </div>

        {/* Order Items List */}
        <div>
          <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
            รายการสินค้าในคำสั่งซื้อ ({order.items.length} รายการ)
          </h4>
          <div className="border border-divider rounded-xl divide-y divide-divider bg-surface overflow-hidden">
            {order.items.map((item, idx) => (
              <div key={idx} className="p-3 flex items-center justify-between text-xs gap-3">
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-text block truncate">
                    {item.name || item.product?.name || "สินค้า"}
                  </span>
                  <span className="text-[11px] font-mono text-neutral-600">
                    {item.sku || item.product?.sku || "-"} · {formatPrice(item.price || item.product?.price || 0)} x {item.quantity || 1}
                  </span>
                </div>
                <span className="font-mono font-bold text-text shrink-0">
                  {formatPrice((item.price || item.product?.price || 0) * (item.quantity || 1))}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="p-3.5 rounded-xl bg-bg border border-divider flex flex-col gap-1.5 text-xs">
          <div className="flex justify-between text-neutral-600">
            <span>ยอดรวมสินค้า (Subtotal)</span>
            <span className="font-mono font-medium">{formatPrice(order.subtotal || order.totalAmount)}</span>
          </div>

          {order.promoCode && (
            <div className="flex justify-between items-center text-emerald-700">
              <span className="inline-flex items-center gap-1 font-semibold">
                <span>🏷️</span>
                <span>โค้ดส่วนลด ({order.promoCode}):</span>
                {order.promoDescription && (
                  <span className="text-[10px] text-emerald-600">({order.promoDescription})</span>
                )}
              </span>
              <span className="font-mono font-bold">-{formatPrice(order.discountAmount || 0)}</span>
            </div>
          )}

          <div className="flex justify-between text-neutral-600">
            <span>ค่าจัดส่ง</span>
            <span className="font-mono font-medium">
              {order.shippingFee === 0 ? "ฟรี (฿0)" : formatPrice(order.shippingFee || 0)}
            </span>
          </div>

          <div className="flex justify-between items-baseline pt-2 border-t border-divider font-bold text-sm text-text">
            <span>ยอดสุทธิทั้งสิ้น</span>
            <span className="font-mono text-base text-accent font-bold">
              {formatPrice(order.totalAmount)}
            </span>
          </div>
        </div>

        {/* Status Transition & Actions */}
        <div className="flex flex-col gap-2 pt-2 border-t border-divider">
          {isShipped ? (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>คำสั่งซื้อนี้จัดส่งสำเร็จแล้ว สถานะถูกล็อคถาวรเพื่อความถูกต้องทางบัญชี</span>
            </div>
          ) : (
            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1.5">
                ปรับเปลี่ยนสถานะคำสั่งซื้อ:
              </label>
              <div className="flex gap-2 flex-wrap">
                {order.rawStatus !== "processing" && (
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => handleUpdateStatus("processing")}
                    className="flex-1 px-3 py-2 text-xs font-bold rounded-xl border border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100 cursor-pointer transition-all disabled:opacity-50"
                  >
                    📦 กำลังจัดของ
                  </button>
                )}
                {order.rawStatus !== "shipped" && (
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => handleUpdateStatus("shipped")}
                    className="flex-1 px-3 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer transition-all disabled:opacity-50 shadow-2xs"
                  >
                    🚚 จัดส่งแล้ว
                  </button>
                )}
                {order.rawStatus !== "cancelled" && (
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => handleUpdateStatus("cancelled")}
                    className="px-3 py-2 text-xs font-bold rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 cursor-pointer transition-all disabled:opacity-50"
                  >
                    ✕ ยกเลิกออเดอร์
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
