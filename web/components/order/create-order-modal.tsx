"use client";

import React, { useState, useEffect } from "react";
import { getProducts, createManualOrderAction, validatePromotion } from "../../lib/ecommerce-actions";
import type { Product } from "@/types/ecommerce";

export interface ManualOrderItemRow {
  productId: number;
  product: Product;
  quantity: number;
  price: number;
}

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onShowAlert: (title: string, desc: string, variant?: "info" | "warning" | "danger") => void;
}

export default function CreateOrderModal({
  isOpen,
  onClose,
  onSuccess,
  onShowAlert,
}: CreateOrderModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [channel, setChannel] = useState("หน้าร้าน / Walk-in");
  const [paymentMethod, setPaymentMethod] = useState("โอนเงิน / พร้อมเพย์");
  const [statusText, setStatusText] = useState("paid");
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [promoCodeInput, setPromoCodeInput] = useState<string>("");
  const [appliedPromo, setAppliedPromo] = useState<{
    id?: number;
    code: string;
    type?: string;
    value?: number;
    discountAmount: number;
    description: string;
  } | null>(null);
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [manualItems, setManualItems] = useState<ManualOrderItemRow[]>([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCustomerName("");
      setPhone("");
      setShippingAddress("");
      setChannel("หน้าร้าน / Walk-in");
      setPaymentMethod("โอนเงิน / พร้อมเพย์");
      setStatusText("paid");
      setShippingFee(0);
      setPromoCodeInput("");
      setAppliedPromo(null);
      setPromoError(null);
      setNote("");
      setSelectedProductId("");
      setManualItems([]);
      setCreateError(null);

      if (products.length === 0) {
        setLoadingProducts(true);
        getProducts().then((prods) => {
          setProducts((prods || []).filter((p) => p.isActive !== false));
          setLoadingProducts(false);
        });
      }
    }
  }, [isOpen, products.length]);

  if (!isOpen) return null;

  const formatPrice = (n: number) => `฿${(n || 0).toLocaleString("th-TH")}`;

  const handleAddItem = (productId: number) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    setManualItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        const newQty = existing.quantity + 1;
        if (statusText === "paid" && newQty > prod.stock) {
          onShowAlert(
            "สต็อกสินค้าไม่เพียงพอ",
            `สินค้า "${prod.name}" มีสต็อกพร้อมส่งเพียง ${prod.stock} ชิ้น ไม่สามารถเพิ่มเกินจำนวนนี้ได้`,
            "warning"
          );
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
            onShowAlert(
              "สต็อกสินค้าไม่เพียงพอ",
              `สินค้า "${it.product.name}" มีสต็อกพร้อมส่งเพียง ${it.product.stock} ชิ้น`,
              "warning"
            );
            return { ...it, quantity: it.product.stock };
          }
          return { ...it, quantity: qty };
        }
        return it;
      })
    );
  };

  const handleRemoveItem = (productId: number) => {
    setManualItems((prev) => prev.filter((it) => it.productId !== productId));
  };

  const manualSubtotal = manualItems.reduce(
    (acc, it) => acc + it.price * it.quantity,
    0
  );

  const handleApplyPromoCode = async (codeToApply?: string) => {
    const code = (codeToApply || promoCodeInput).trim().toUpperCase();
    if (!code) {
      setPromoError("กรุณากรอกโค้ดโปรโมชั่น");
      return;
    }
    if (manualSubtotal <= 0) {
      setPromoError("กรุณาเลือกสินค้าอย่างน้อย 1 รายการก่อนใช้โค้ด");
      return;
    }

    setValidatingPromo(true);
    setPromoError(null);

    const res = await validatePromotion(code, manualSubtotal);
    if (!res.ok || !res.data) {
      setPromoError(res.error || `โค้ด "${code}" ไม่ถูกต้องหรือหมดอายุแล้ว`);
      setValidatingPromo(false);
      return;
    }

    const promoData = res.data;
    setAppliedPromo({
      id: promoData.id || promoData.promotion?.id,
      code: promoData.code || promoData.promotion?.code || code,
      type: promoData.type || promoData.promotion?.type,
      value: promoData.value || promoData.promotion?.value,
      discountAmount: promoData.discountAmount || 0,
      description: promoData.description || `ส่วนลดจากโค้ด ${code}`,
    });

    if (code === "FREESHIP" || promoData.type === "freeship") {
      setShippingFee(0);
    }
    setValidatingPromo(false);
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCodeInput("");
    setPromoError(null);
  };

  const discountAmount = appliedPromo?.discountAmount || 0;
  const grandTotal = Math.max(0, manualSubtotal - discountAmount + shippingFee);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (manualItems.length === 0) {
      setCreateError("กรุณาเลือกสินค้าเข้าสู่คำสั่งซื้ออย่างน้อย 1 รายการ");
      return;
    }
    setCreating(true);
    setCreateError(null);

    const res = await createManualOrderAction({
      customerName: customerName.trim() || "ลูกค้าทั่วไป (Walk-in)",
      phone: phone.trim() || undefined,
      shippingAddress: shippingAddress.trim() || undefined,
      channel,
      paymentMethod,
      statusText,
      shippingFee,
      items: manualItems.map((it) => ({
        productId: it.productId,
        quantity: it.quantity,
        price: it.price,
      })),
      note: note.trim() || undefined,
      promotionCode: appliedPromo?.code,
      discountAmount: discountAmount || undefined,
    });

    if (res.ok) {
      onSuccess();
      onClose();
    } else {
      setCreateError(res.error || "เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ");
    }
    setCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-surface border border-divider rounded-2xl p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
        <div className="flex justify-between items-center pb-2 border-b border-divider">
          <div>
            <h3 className="text-lg font-bold text-text m-0">สร้างคำสั่งซื้อใหม่ (Manual Order)</h3>
            <p className="text-xs text-neutral-600 m-0 mt-0.5">
              บันทึกออเดอร์จากหน้าร้าน, LINE Official หรือออเดอร์โทรศัพท์
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-600 hover:text-text hover:bg-bg transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {createError && (
          <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-950 text-xs font-semibold">
            {createError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Customer & Channel Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-neutral-800 block mb-1">ชื่อลูกค้า / ผู้รับ</label>
              <input
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-divider bg-bg text-text outline-none focus:border-accent"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="เช่น สมชาย ใจดี หรือ ลูกค้าหน้าร้าน"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-neutral-800 block mb-1">เบอร์โทรศัพท์</label>
              <input
                className="w-full px-3 py-2 text-xs rounded-xl border border-divider bg-bg text-text outline-none focus:border-accent font-mono"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="เช่น 081-234-5678"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-neutral-800 block mb-1">ช่องทางการขาย</label>
              <select
                className="w-full px-3 py-2 text-xs rounded-xl border border-divider bg-bg text-text outline-none focus:border-accent font-medium"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
              >
                <option value="หน้าร้าน / Walk-in">หน้าร้าน / Walk-in</option>
                <option value="LINE Official">LINE Official</option>
                <option value="Facebook / Inbox">Facebook / Inbox</option>
                <option value="โทรสั่งซื้อ">โทรสั่งซื้อ</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-neutral-800 block mb-1">วิธีชำระเงิน</label>
              <select
                className="w-full px-3 py-2 text-xs rounded-xl border border-divider bg-bg text-text outline-none focus:border-accent font-medium"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="โอนเงิน / พร้อมเพย์">โอนเงิน / พร้อมเพย์</option>
                <option value="เงินสด (Cash)">เงินสด (Cash)</option>
                <option value="บัตรเครดิต">บัตรเครดิต</option>
                <option value="เก็บเงินปลายทาง (COD)">เก็บเงินปลายทาง (COD)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-neutral-800 block mb-1">ที่อยู่จัดส่งสินค้า</label>
            <input
              className="w-full px-3 py-2 text-xs rounded-xl border border-divider bg-bg text-text outline-none focus:border-accent"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder="ระบุที่อยู่จัดส่ง หรือเว้นว่างหากรับหน้าร้าน"
            />
          </div>

          {/* Product Items Selection */}
          <div className="border border-divider rounded-xl p-3 bg-bg flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-neutral-800">
                รายการสินค้าในออเดอร์ ({manualItems.length} รายการ)
              </label>
              <div className="flex gap-2 items-center">
                <select
                  className="px-2.5 py-1 text-xs rounded-lg border border-divider bg-surface text-text outline-none focus:border-accent max-w-[220px]"
                  value={selectedProductId}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    if (id) handleAddItem(id);
                  }}
                  disabled={loadingProducts}
                >
                  <option value="">+ เลือกสินค้าเพื่อเพิ่มในออเดอร์</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                      {p.name} ({p.sku}) - {formatPrice(p.price)} {p.stock <= 0 ? "(หมด)" : `(เหลือ ${p.stock})`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {manualItems.length === 0 ? (
              <div className="text-center py-6 text-xs text-neutral-600 font-medium">
                ยังไม่มีสินค้าในออเดอร์ กรุณาเลือกสินค้าจากตัวเลือกด้านบน
              </div>
            ) : (
              <div className="divide-y divide-divider border border-divider rounded-xl bg-surface overflow-hidden">
                {manualItems.map((it) => (
                  <div key={it.productId} className="p-2.5 flex items-center justify-between text-xs gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-text block truncate">{it.product.name}</span>
                      <span className="text-[11px] font-mono text-neutral-600">
                        {it.product.sku} · สต็อก {it.product.stock}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center border border-divider rounded-lg bg-bg overflow-hidden">
                        <button
                          type="button"
                          onClick={() => handleUpdateItemQty(it.productId, it.quantity - 1)}
                          className="px-2 py-0.5 text-neutral-600 hover:bg-surface"
                        >
                          -
                        </button>
                        <span className="px-2 font-mono font-bold text-xs">{it.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateItemQty(it.productId, it.quantity + 1)}
                          className="px-2 py-0.5 text-neutral-600 hover:bg-surface"
                        >
                          +
                        </button>
                      </div>

                      <span className="font-mono font-bold text-text w-16 text-right">
                        {formatPrice(it.price * it.quantity)}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(it.productId)}
                        className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                        title="ลบรายการนี้"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Promotion & Discount Section */}
          <div className="p-3 rounded-xl bg-bg border border-divider flex flex-col gap-2">
            <label className="text-xs font-bold text-neutral-800">โค้ดโปรโมชั่น / ส่วนลด</label>
            <div className="flex gap-2 items-center">
              <input
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-divider bg-surface text-text outline-none focus:border-accent font-mono uppercase font-bold"
                value={promoCodeInput}
                onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                placeholder="ระบุโค้ดส่วนลด เช่น SAVE10, VIP888, FREESHIP"
                disabled={!!appliedPromo || validatingPromo}
              />
              {appliedPromo ? (
                <button
                  type="button"
                  onClick={handleRemovePromo}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl border border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100 cursor-pointer"
                >
                  ✕ ยกเลิกโค้ด
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleApplyPromoCode()}
                  disabled={validatingPromo || !promoCodeInput.trim()}
                  className="px-4 py-1.5 text-xs font-bold rounded-xl bg-accent text-white hover:bg-accent-600 cursor-pointer disabled:opacity-50"
                >
                  {validatingPromo ? "ตรวจสอบ..." : "ใช้โค้ด"}
                </button>
              )}
            </div>

            {promoError && (
              <span className="text-[11px] font-semibold text-rose-600">{promoError}</span>
            )}

            {appliedPromo && (
              <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between font-medium">
                <span>✓ ใช้โค้ด &quot;{appliedPromo.code}&quot; สำเร็จ ({appliedPromo.description})</span>
                <span className="font-bold font-mono">-{formatPrice(appliedPromo.discountAmount)}</span>
              </div>
            )}
          </div>

          {/* Financial Summary */}
          <div className="p-3.5 rounded-xl bg-bg border border-divider flex flex-col gap-1.5 text-xs">
            <div className="flex justify-between text-neutral-600">
              <span>ยอดรวมสินค้า</span>
              <span className="font-mono">{formatPrice(manualSubtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>ส่วนลด ({appliedPromo?.code})</span>
                <span className="font-mono">-{formatPrice(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-neutral-600">
              <span>ค่าจัดส่ง</span>
              <div className="flex items-center gap-1.5">
                {[0, 50].map((fee) => (
                  <button
                    key={fee}
                    type="button"
                    onClick={() => setShippingFee(fee)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                      shippingFee === fee ? "bg-accent text-white border-accent" : "border-divider bg-surface"
                    }`}
                  >
                    {fee === 0 ? "ส่งฟรี" : `฿${fee}`}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-divider font-bold text-sm text-text">
              <span>ยอดรวมสุทธิ</span>
              <span className="font-mono text-base text-accent">{formatPrice(grandTotal)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-divider">
            <button
              type="button"
              onClick={onClose}
              disabled={creating}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-divider bg-surface hover:bg-bg text-text transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={creating || manualItems.length === 0}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-accent hover:bg-accent-600 active:bg-accent-700 !text-white transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {creating ? "กำลังบันทึก..." : `สร้างคำสั่งซื้อ (${formatPrice(grandTotal)})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
