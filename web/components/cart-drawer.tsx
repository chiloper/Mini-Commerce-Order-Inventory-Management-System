"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getCart,
  updateCartItem,
  removeCartItem,
  validatePromotion,
} from "../lib/ecommerce-actions";
import type { Cart, CartItem } from "@/types/ecommerce";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const [cart, setCart] = useState<Cart>({ items: [], totalQuantity: 0, subtotal: 0 });
  const [loading, setLoading] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoMsg, setPromoMsg] = useState("");
  const [promoOk, setPromoOk] = useState(false);
  const [discount, setDiscount] = useState(0);

  const fetchCart = async () => {
    const c = await getCart();
    setCart(c);
  };

  useEffect(() => {
    if (isOpen) {
      fetchCart();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleUpdate = () => {
      fetchCart();
    };
    window.addEventListener("cart-updated", handleUpdate);
    return () => window.removeEventListener("cart-updated", handleUpdate);
  }, []);

  const handleUpdateQty = async (itemId: number, currentQty: number, delta: number) => {
    const nextQty = currentQty + delta;
    setLoading(true);
    if (nextQty <= 0) {
      await removeCartItem(itemId);
    } else {
      await updateCartItem(itemId, nextQty);
    }
    await fetchCart();
    window.dispatchEvent(new Event("cart-updated"));
    setLoading(false);
  };

  const handleApplyPromo = async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) {
      setPromoMsg("กรุณากรอกโค้ดโปรโมชั่น");
      setPromoOk(false);
      setDiscount(0);
      return;
    }

    const res = await validatePromotion(code, cart.subtotal || 0);
    if (res.ok && res.data?.valid) {
      setPromoOk(true);
      setDiscount(res.data.discountAmount || 0);
      setPromoMsg(`ใช้โค้ด ${code} แล้ว — ${res.data.promotion?.type === "percentage" ? `ลด ${res.data.promotion.value}%` : `ลด ฿${res.data.promotion?.value}`}`);
    } else {
      setPromoOk(false);
      setDiscount(0);
      setPromoMsg(res.data?.message || res.error || `โค้ด ${code} ใช้ไม่ได้หรือหมดโควตาแล้ว`);
    }
  };

  const formatPrice = (n: number) => `฿${(n || 0).toLocaleString("th-TH")}`;

  if (!isOpen) return null;

  const items = cart.items || [];
  const subtotal = cart.subtotal || 0;
  const shipping = items.length === 0 ? 0 : promoCode.toUpperCase() === "FREESHIP" || subtotal - discount >= 1500 ? 0 : 50;
  const total = Math.max(0, subtotal - discount + shipping);

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity"
      />

      {/* Drawer */}
      <aside className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-bg shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-divider">
          <h3 className="text-xl font-bold tracking-tight text-text">
            ตะกร้าสินค้า · {cart.totalQuantity || 0} ชิ้น
          </h3>
          <button
            onClick={onClose}
            aria-label="ปิดตะกร้า"
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-text cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Item List */}
        <div className="flex-1 overflow-y-auto px-5 divide-y divide-divider">
          {items.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-neutral-600 mb-4">
                ยังไม่มีสินค้าในตะกร้า
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-neutral-800 text-white hover:bg-neutral-900 cursor-pointer transition-colors"
              >
                เลือกซื้อสินค้า
              </button>
            </div>
          ) : (
            items.map((item: CartItem) => {
              const product = item.product;
              const stock = product?.stock || 0;
              const isLow = stock > 0 && stock <= 10;
              const isOut = stock === 0;

              return (
                <div key={item.id} className="flex gap-3.5 py-4">
                  <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-neutral-200 dark:bg-neutral-800">
                    {product?.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[9px] font-mono text-neutral-600 uppercase">
                        shot
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col gap-1 min-w-0">
                    <span className="text-sm font-semibold text-text truncate">
                      {product?.name || `สินค้า #${item.productId}`}
                    </span>
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          isOut
                            ? "bg-neutral-200 text-neutral-600"
                            : isLow
                            ? "bg-rose-100 text-rose-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {isOut ? "หมดชั่วคราว" : isLow ? "ใกล้หมด" : "พร้อมส่ง"}
                      </span>
                      <span className="text-neutral-600">
                        {isOut ? "รอเข้าคลัง" : `เหลือ ${stock} ชิ้น`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => handleUpdateQty(item.id, item.quantity, -1)}
                        disabled={loading}
                        className="w-7 h-7 flex items-center justify-center rounded border border-divider text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 cursor-pointer"
                      >
                        −
                      </button>
                      <span className="text-xs font-medium min-w-[20px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQty(item.id, item.quantity, 1)}
                        disabled={loading || (product?.stock !== undefined && item.quantity >= product.stock)}
                        className="w-7 h-7 flex items-center justify-center rounded border border-divider text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <span className="text-sm font-bold whitespace-nowrap self-center text-text">
                    {formatPrice((product?.price || 0) * item.quantity)}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-5 flex flex-col gap-3 bg-surface border-t border-divider">
            {/* Promo Code Input */}
            <div className="flex gap-2">
              <input
                placeholder="โค้ดโปรโมชั่น (เช่น SAVE10, FREESHIP)"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-divider bg-bg outline-none focus:ring-1 focus:ring-accent"
              />
              <button
                type="button"
                onClick={handleApplyPromo}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-divider hover:bg-bg cursor-pointer whitespace-nowrap"
              >
                ใช้โค้ด
              </button>
            </div>

            {promoMsg && (
              <p
                className={`text-xs m-0 ${
                  promoOk ? "text-emerald-600 font-medium" : "text-rose-600 font-medium"
                }`}
              >
                {promoMsg}
              </p>
            )}

            {/* Price Summary */}
            <div className="flex flex-col gap-1.5 text-xs sm:text-sm pt-1">
              <div className="flex justify-between">
                <span className="text-neutral-600">ยอดสินค้า ({cart.totalQuantity} ชิ้น)</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div
                className={`flex justify-between ${
                  discount > 0 ? "text-emerald-600 font-medium" : "text-neutral-600"
                }`}
              >
                <span>{discount > 0 ? "ส่วนลดโปรโมชั่น" : "ส่วนลด"}</span>
                <span>{discount > 0 ? `−${formatPrice(discount)}` : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">ค่าจัดส่ง</span>
                <span className="font-medium">{shipping === 0 ? "ฟรี" : formatPrice(shipping)}</span>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-baseline pt-2 border-t border-divider">
              <span className="text-sm font-semibold">ยอดชำระ</span>
              <span className="text-2xl font-bold text-text">
                {formatPrice(total)}
              </span>
            </div>

            {/* Checkout Button */}
            <Link
              href="/checkout"
              onClick={onClose}
              className="w-full flex items-center justify-center py-2.5 rounded-lg text-sm font-semibold bg-neutral-800 text-white hover:bg-neutral-900 transition-colors cursor-pointer shadow-sm text-center"
            >
              ไปหน้าชำระเงิน
            </Link>

            <p className="text-[10px] text-neutral-500 text-center m-0 leading-relaxed">
              เมื่อกดชำระเงิน ระบบจะจองสต็อกและตัดสต็อกจริงเมื่อทำรายการสำเร็จ
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
