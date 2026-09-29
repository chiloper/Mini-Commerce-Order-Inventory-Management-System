"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getCart,
  updateCartItem,
  removeCartItem,
  validatePromotion,
} from "../lib/ecommerce-actions";
import { getSessionUserAction } from "../lib/auth/actions";
import { getCachedUser, setCachedUser, subscribeAuthState } from "../lib/auth/auth-state";
import type { PublicUser } from "../lib/auth/type";
import type { Cart, CartItem } from "@/types/ecommerce";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AppliedPromo {
  id?: number;
  code: string;
  type?: string;
  value?: number;
  discountAmount: number;
  description: string;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const [user, setUser] = useState<PublicUser | null>(() => getCachedUser());
  const [authLoading, setAuthLoading] = useState<boolean>(() => !getCachedUser());
  const [mounted, setMounted] = useState<boolean>(false);
  const [cart, setCart] = useState<Cart>({ items: [], totalQuantity: 0, subtotal: 0 });
  const [loading, setLoading] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoMsg, setPromoMsg] = useState("");
  const [promoOk, setPromoOk] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [discount, setDiscount] = useState(0);

  const calculateDiscount = (promo: AppliedPromo, currentSubtotal: number) => {
    const promoType = (promo.type || "").toLowerCase();
    if (promoType === "percentage") {
      return Math.round((currentSubtotal * (promo.value || 0)) / 100);
    }
    if (promoType === "fixed") {
      return Math.min(currentSubtotal, promo.value || 0);
    }
    if (promoType === "freeship") {
      return 50;
    }
    return promo.discountAmount || 0;
  };

  const fetchCart = async () => {
    const c = await getCart();
    setCart(c);
    if (appliedPromo) {
      const newSub = c?.subtotal || 0;
      setDiscount(calculateDiscount(appliedPromo, newSub));
    }
  };

  useEffect(() => {
    setMounted(true);
    const unsub = subscribeAuthState((u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      fetchCart();
      getSessionUserAction().then((u) => {
        setUser(u);
        setCachedUser(u);
        setAuthLoading(false);
      });
      // Restore promo code from session if available
      if (typeof window !== "undefined" && !appliedPromo) {
        const savedCode = sessionStorage.getItem("cart_promo_code");
        if (savedCode) {
          setPromoCode(savedCode);
          handleApplyPromo(savedCode);
        }
      }
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleUpdate = () => {
      fetchCart();
      getSessionUserAction().then((u) => {
        setUser(u);
        setCachedUser(u);
        setAuthLoading(false);
      });
    };
    window.addEventListener("cart-updated", handleUpdate);
    return () => window.removeEventListener("cart-updated", handleUpdate);
  }, [appliedPromo]);

  const handleUpdateQty = async (itemId: number, currentQty: number, delta: number) => {
    const nextQty = currentQty + delta;
    setLoading(true);
    if (nextQty <= 0) {
      await removeCartItem(itemId);
    } else {
      await updateCartItem(itemId, nextQty);
    }
    const c = await getCart();
    setCart(c);
    if (appliedPromo) {
      setDiscount(calculateDiscount(appliedPromo, c?.subtotal || 0));
    }
    window.dispatchEvent(new Event("cart-updated"));
    setLoading(false);
  };

  const handleApplyPromo = async (codeToUse?: string) => {
    const code = (codeToUse || promoCode).trim().toUpperCase();
    if (!code) {
      setPromoMsg("กรุณากรอกโค้ดส่วนลด");
      setPromoOk(false);
      setDiscount(0);
      return;
    }

    setValidatingPromo(true);
    setPromoMsg("");

    try {
      const res = await validatePromotion(code, cart.subtotal || 0);
      if (res.ok && res.data && res.data.valid !== false) {
        const disc = res.data.discountAmount ?? res.data.discount ?? 0;
        const promoObj: AppliedPromo = {
          id: res.data.id || res.data.promotion?.id,
          code: res.data.code || res.data.promotion?.code || code,
          type: res.data.type || res.data.promotion?.type || "",
          value: res.data.value || res.data.promotion?.value || 0,
          discountAmount: disc,
          description:
            res.data.description ||
            (res.data.type === "percentage"
              ? `ส่วนลด ${res.data.value}%`
              : res.data.type === "freeship"
              ? "ส่งฟรี (฿50)"
              : `ส่วนลด ฿${disc.toLocaleString("th-TH")}`),
        };
        setPromoOk(true);
        setDiscount(disc);
        setAppliedPromo(promoObj);
        setPromoMsg(`ใช้โค้ด ${code} แล้ว — ${promoObj.description}`);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("cart_promo_code", code);
        }
      } else {
        setPromoOk(false);
        setDiscount(0);
        setAppliedPromo(null);
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("cart_promo_code");
        }
        setPromoMsg(res.data?.message || res.error || `โค้ด "${code}" ไม่ถูกต้องหรือหมดอายุแล้ว`);
      }
    } catch {
      setPromoOk(false);
      setDiscount(0);
      setAppliedPromo(null);
      setPromoMsg("เกิดข้อผิดพลาดในการตรวจสอบโค้ด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setValidatingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoOk(false);
    setDiscount(0);
    setPromoCode("");
    setPromoMsg("");
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("cart_promo_code");
    }
  };

  const formatPrice = (n: number) => `฿${(n || 0).toLocaleString("th-TH")}`;

  if (!isOpen) return null;

  const items = cart.items || [];
  const subtotal = cart.subtotal || 0;
  const freeShippingThreshold = 1500;
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingProgress = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));
  const isFreeShip =
    (appliedPromo &&
      (appliedPromo.code.toUpperCase() === "FREESHIP" ||
        (appliedPromo.type || "").toLowerCase() === "freeship")) ||
    subtotal >= freeShippingThreshold;
  const shipping = items.length === 0 ? 0 : isFreeShip ? 0 : 50;
  const total = Math.max(0, subtotal - discount + shipping);

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer */}
      <aside className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-surface shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-200 border-l border-divider">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-divider bg-surface">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <h3 className="text-base sm:text-lg font-bold tracking-tight text-text">
              ตะกร้าสินค้า
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-accent-100 text-accent-800">
              {cart.totalQuantity || 0} ชิ้น
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="ปิดตะกร้า"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-bg text-neutral-600 hover:text-text cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Free Shipping Progress Bar (Nudge Theory / Gamification) */}
        {items.length > 0 && (
          <div className="px-5 py-3 bg-bg border-b border-divider">
            <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
              {amountToFreeShipping > 0 ? (
                <span className="text-neutral-700">
                  ซื้อเพิ่มอีก <strong className="text-accent-800 font-bold">฿{amountToFreeShipping.toLocaleString()}</strong> เพื่อส่งฟรี!
                </span>
              ) : (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <span>🎉</span> ยินดีด้วย! คุณได้รับสิทธิ์จัดส่งฟรี
                </span>
              )}
              <span className="text-[11px] text-neutral-500 font-mono">{freeShippingProgress}%</span>
            </div>
            <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  freeShippingProgress >= 100 ? "bg-emerald-600" : "bg-accent"
                }`}
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Item List */}
        <div className="flex-1 overflow-y-auto px-5 divide-y divide-divider">
          {items.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-bg border border-divider flex items-center justify-center text-neutral-400 mb-3">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 4h2.5l2.2 10.5h9.6L19 7H6" />
                  <circle cx="9" cy="19" r="1.4" />
                  <circle cx="17" cy="19" r="1.4" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-text mb-1">
                ยังไม่มีสินค้าในตะกร้า
              </p>
              <p className="text-xs text-neutral-500 mb-5 max-w-[200px]">
                เลือกชมสินค้าคุณภาพหลากหลายรายการได้ที่หน้าร้าน
              </p>
              <button
                onClick={onClose}
                className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-neutral-800 text-white hover:bg-neutral-900 cursor-pointer transition-colors shadow-xs"
              >
                เลือกซื้อสินค้า
              </button>
            </div>
          ) : (
            items.map((item: CartItem) => {
              const productName = item.productName || item.product?.name || `สินค้า #${item.productId}`;
              const price = item.price ?? item.product?.price ?? 0;
              const stock = item.stock ?? item.product?.stock ?? 0;
              const imageUrl = item.imageUrl || item.product?.imageUrl;
              const isLow = stock > 0 && stock <= 10;
              const isOut = stock === 0;
              const lineTotal = item.totalPrice ?? (price * item.quantity);

              return (
                <div key={item.id} className="flex gap-3.5 py-4 group">
                  {/* Thumbnail */}
                  <div className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-neutral-200 border border-divider">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={productName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = "none";
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-full h-full flex items-center justify-center text-[9px] font-mono text-neutral-500 uppercase ${
                        imageUrl ? "hidden" : ""
                      }`}
                    >
                      shot
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col gap-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-xs sm:text-sm font-semibold text-text truncate" title={productName}>
                        {productName}
                      </span>
                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(item.id, item.quantity, -item.quantity)}
                        disabled={loading}
                        className="text-neutral-400 hover:text-rose-600 transition-colors p-0.5 cursor-pointer"
                        title="ลบออกจากตะกร้า"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-xs font-bold text-text">
                        {formatPrice(price)}
                      </span>
                      {isLow && (
                        <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded font-medium">
                          เหลือ {stock} ชิ้น
                        </span>
                      )}
                      {isOut && (
                        <span className="text-[10px] text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded font-medium">
                          สินค้าหมด
                        </span>
                      )}
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="inline-flex items-center border border-divider rounded-lg bg-bg overflow-hidden">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.id, item.quantity, -1)}
                          disabled={loading}
                          className="w-7 h-7 flex items-center justify-center text-xs font-bold text-text hover:bg-surface disabled:opacity-30 cursor-pointer transition-colors border-0"
                          aria-label="ลดจำนวน"
                        >
                          −
                        </button>
                        <span className="text-xs font-bold min-w-[24px] text-center select-none text-text">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.id, item.quantity, 1)}
                          disabled={loading || (stock > 0 && item.quantity >= stock)}
                          className="w-7 h-7 flex items-center justify-center text-xs font-bold text-text hover:bg-surface disabled:opacity-30 cursor-pointer transition-colors border-0"
                          aria-label="เพิ่มจำนวน"
                        >
                          +
                        </button>
                      </div>

                      <span className="ml-auto text-xs font-bold text-text">
                        {formatPrice(lineTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer (Fitts's Law: Prominent Checkout CTA) */}
        {items.length > 0 && (
          <div className="p-5 flex flex-col gap-3.5 bg-surface border-t border-divider shadow-lg">
            {/* Promo Code Section */}
            {appliedPromo ? (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold shrink-0">
                    ✓
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-xs text-emerald-900">
                        {appliedPromo.code}
                      </span>
                      <span className="text-[11px] text-emerald-700 truncate font-medium">
                        {appliedPromo.description}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemovePromo}
                  className="px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                  title="ยกเลิกโค้ด"
                >
                  ✕ ลบ
                </button>
              </div>
            ) : (
              <div>
                <div className="flex gap-2">
                  <input
                    placeholder="โค้ดส่วนลด (เช่น SAVE10, FREESHIP)"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleApplyPromo();
                      }
                    }}
                    disabled={validatingPromo}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-divider bg-bg outline-none focus:border-accent uppercase text-text placeholder:text-neutral-600 font-medium disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyPromo()}
                    disabled={validatingPromo || !promoCode.trim()}
                    className="px-3.5 py-2 text-xs font-bold rounded-xl border border-divider bg-surface hover:bg-bg cursor-pointer whitespace-nowrap transition-colors text-text disabled:opacity-50"
                  >
                    {validatingPromo ? "กำลังตรวจ..." : "ใช้โค้ด"}
                  </button>
                </div>

                {promoMsg && (
                  <p
                    className={`text-xs mt-1.5 m-0 font-semibold ${
                      promoOk ? "text-emerald-800" : "text-rose-700"
                    }`}
                  >
                    {promoMsg}
                  </p>
                )}
              </div>
            )}

            {/* Price Summary */}
            <div className="flex flex-col gap-2 text-xs pt-3 border-t border-divider">
              <div className="flex justify-between text-neutral-800 font-medium">
                <span>ยอดรวมสินค้า ({cart.totalQuantity} ชิ้น)</span>
                <span className="font-bold text-text">{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-800 font-bold">
                  <span>ส่วนลดโปรโมชั่น</span>
                  <span>−{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-neutral-800 font-medium">
                <span>ค่าจัดส่ง</span>
                <span className="font-bold text-text">
                  {shipping === 0 ? (
                    <span className="text-emerald-800 font-bold">ฟรี</span>
                  ) : (
                    formatPrice(shipping)
                  )}
                </span>
              </div>
              <div className="flex justify-between items-baseline pt-2.5 border-t border-divider">
                <span className="text-sm font-bold text-text">ยอดชำระสุทธิ</span>
                <span className="text-xl font-extrabold text-text">
                  {formatPrice(total)}
                </span>
              </div>
            </div>

            {/* Checkout Button: Requires login before checking out */}
            {!mounted || (authLoading && !user) ? (
              <div className="w-full min-h-[46px] flex items-center justify-center gap-2 rounded-xl text-sm font-semibold bg-neutral-200/70 text-neutral-500 animate-pulse select-none" aria-hidden="true">
                <span>กำลังตรวจสอบข้อมูล...</span>
              </div>
            ) : user ? (
              <Link
                href={appliedPromo ? `/checkout?promo=${encodeURIComponent(appliedPromo.code)}` : "/checkout"}
                onClick={onClose}
                className="w-full min-h-[46px] flex items-center justify-center gap-2 rounded-xl text-sm font-bold bg-accent !text-white hover:bg-accent-600 active:bg-accent-700 transition-all cursor-pointer shadow-xs text-center active:scale-[0.99]"
              >
                <span className="!text-white">ดำเนินการชำระเงิน</span>
                <span className="!text-white">·</span>
                <span className="!text-white">{formatPrice(total)}</span>
                <svg className="w-4 h-4 ml-1 !text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            ) : (
              <Link
                href={`/login?redirect=${encodeURIComponent(appliedPromo ? `/checkout?promo=${encodeURIComponent(appliedPromo.code)}` : "/checkout")}`}
                onClick={onClose}
                className="w-full min-h-[46px] flex items-center justify-center gap-2 rounded-xl text-sm font-bold bg-accent !text-white hover:bg-accent-600 active:bg-accent-700 transition-all cursor-pointer shadow-xs text-center active:scale-[0.99]"
              >
                <svg className="w-4 h-4 mr-0.5 !text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span className="!text-white">เข้าสู่ระบบเพื่อชำระเงิน</span>
                <span className="!text-white">·</span>
                <span className="!text-white">{formatPrice(total)}</span>
                <span className="!text-white ml-0.5">→</span>
              </Link>
            )}

            <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-700 font-medium">
              <svg className="w-3.5 h-3.5 text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>ระบบชำระเงินปลอดภัยและตัดสต็อกอัตโนมัติ</span>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
