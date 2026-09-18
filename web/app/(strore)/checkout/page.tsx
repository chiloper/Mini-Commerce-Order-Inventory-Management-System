"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getCart,
  validatePromotion,
  checkoutAction,
} from "../../../lib/ecommerce-actions";
import { getSessionUserAction, loginAction } from "../../../lib/auth/actions";
import { PublicUser } from "../../../lib/auth/type";
import type { Cart, CartItem, Order } from "@/types/ecommerce";

export default function CheckoutPage() {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [cart, setCart] = useState<Cart>({ items: [], totalQuantity: 0, subtotal: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [customerName, setCustomerName] = useState("ณัฐพงษ์ วัฒนกุล");
  const [phone, setPhone] = useState("081-234-5678");
  const [shippingAddress, setShippingAddress] = useState(
    "88/12 ซอยสุขุมวิท 31 คลองเตยเหนือ วัฒนา กรุงเทพฯ 10110"
  );
  const [paymentMethod, setPaymentMethod] = useState("พร้อมเพย์ / QR");

  // Inline Login states for non-logged-in users
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Promo code
  const [promoCode, setPromoCode] = useState("");
  const [promoMsg, setPromoMsg] = useState("");
  const [promoOk, setPromoOk] = useState(false);
  const [discount, setDiscount] = useState(0);

  // Success state
  const [orderSuccess, setOrderSuccess] = useState<Order | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [currentUser, currentCart] = await Promise.all([
      getSessionUserAction(),
      getCart(),
    ]);
    setUser(currentUser);
    setCart(currentCart);
    if (currentUser?.email) {
      setCustomerName(currentUser.email.split("@")[0]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatPrice = (n: number) => `฿${(n || 0).toLocaleString("th-TH")}`;

  const handleInlineLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    const formData = new FormData();
    formData.append("email", loginEmail);
    formData.append("password", loginPassword);

    const res = await loginAction(null, formData);
    if (res.success && res.user) {
      setUser(res.user);
      setCustomerName(res.user.email.split("@")[0]);
      window.dispatchEvent(new Event("cart-updated"));
      await loadData();
    } else {
      setLoginError(res.error || "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    }
    setLoginLoading(false);
  };

  const handleQuickFill = (email: string, pass: string) => {
    setLoginEmail(email);
    setLoginPassword(pass);
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
      setDiscount(res.data.discount || 0);
      setPromoMsg(`ใช้โค้ด ${code} แล้ว — ${res.data.description || "รับส่วนลดพิเศษ"}`);
    } else {
      setPromoOk(false);
      setDiscount(0);
      setPromoMsg(res.data?.message || `โค้ด ${code} ใช้ไม่ได้หรือหมดโควตาแล้ว`);
    }
  };

  const handleCheckout = async () => {
    if ((cart.items || []).length === 0) return;
    setSubmitting(true);
    setErrorMsg(null);

    const idempotencyKey = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const res = await checkoutAction({
      idempotencyKey,
      customerName,
      phone,
      shippingAddress,
      paymentMethod,
      promotionCode: promoOk ? promoCode.trim().toUpperCase() : undefined,
    });

    if (res.ok && res.data) {
      setOrderSuccess(res.data);
      window.dispatchEvent(new Event("cart-updated"));
    } else {
      setErrorMsg(res.error || "ไม่สามารถทำรายการสั่งซื้อได้ กรุณาลองใหม่อีกครั้ง");
    }
    setSubmitting(false);
  };

  const items = cart.items || [];
  const subtotal = cart.subtotal || 0;
  const shipping = items.length === 0 ? 0 : promoCode.toUpperCase() === "FREESHIP" || subtotal - discount >= 1500 ? 0 : 50;
  const total = Math.max(0, subtotal - discount + shipping);

  if (loading) {
    return (
      <div style={{ padding: "80px 0", textAlign: "center", color: "var(--color-neutral-600)" }}>
        กำลังโหลดข้อมูลการชำระเงิน...
      </div>
    );
  }

  // 1. Order Success Screen (Digital Receipt)
  if (orderSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-surface rounded-2xl border border-divider shadow-md p-6 sm:p-8 flex flex-col gap-6">
          {/* Success Icon & Header */}
          <div className="text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-3xl font-bold mb-3 shadow-xs">
              ✓
            </div>
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-800 font-bold mb-1">
              ทำรายการสำเร็จ · ตัดสต็อกเรียบร้อยแล้ว
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
              ขอบคุณสำหรับคำสั่งซื้อ
            </h1>
            <p className="text-xs text-neutral-700 mt-1 font-medium">
              หมายเลขคำสั่งซื้อ <strong className="text-text font-mono font-bold">#{orderSuccess.id}</strong>
            </p>
          </div>

          {/* Receipt Details Card */}
          <div className="bg-bg rounded-xl border border-divider p-4 sm:p-5 flex flex-col gap-3.5 text-xs sm:text-sm">
            <div className="flex justify-between pb-3 border-b border-divider">
              <span className="text-neutral-800 font-medium">วันที่ทำรายการ</span>
              <span className="font-bold text-text">
                {new Date(orderSuccess.createdAt || Date.now()).toLocaleString("th-TH")}
              </span>
            </div>
            <div className="flex justify-between pb-3 border-b border-divider">
              <span className="text-neutral-800 font-medium">ผู้สั่งซื้อ</span>
              <span className="font-bold text-text">{customerName} ({phone})</span>
            </div>
            <div className="flex justify-between pb-3 border-b border-divider">
              <span className="text-neutral-800 font-medium">ที่อยู่จัดส่ง</span>
              <span className="font-bold text-text text-right max-w-[280px]">{shippingAddress}</span>
            </div>
            <div className="flex justify-between pb-3 border-b border-divider">
              <span className="text-neutral-800 font-medium">วิธีการชำระเงิน</span>
              <span className="font-bold text-accent-900 bg-accent-100 border border-accent-200 px-2 py-0.5 rounded text-xs">
                {paymentMethod}
              </span>
            </div>
            <div className="flex justify-between items-baseline pt-1">
              <span className="font-bold text-text">ยอดชำระสุทธิ</span>
              <span className="text-2xl font-extrabold text-text">
                {formatPrice(orderSuccess.totalAmount || total)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href="/"
              className="flex-1 py-3 rounded-xl text-xs sm:text-sm font-bold bg-accent text-white hover:bg-accent-600 active:bg-accent-700 transition-colors text-center shadow-xs"
            >
              เลือกซื้อสินค้าต่อ
            </Link>
            <Link
              href="/account"
              className="flex-1 py-3 rounded-xl text-xs sm:text-sm font-bold border border-divider bg-surface hover:bg-bg text-text transition-colors text-center"
            >
              ดูประวัติคำสั่งซื้อของฉัน
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Empty Cart Screen
  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-surface border border-divider flex items-center justify-center text-neutral-400 mx-auto mb-4">
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 4h2.5l2.2 10.5h9.6L19 7H6" />
            <circle cx="9" cy="19" r="1.4" />
            <circle cx="17" cy="19" r="1.4" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-text mb-2">ยังไม่มีสินค้าในตะกร้า</h2>
        <p className="text-xs text-neutral-500 mb-6">
          กรุณาเลือกสินค้าใส่ตะกร้าก่อนดำเนินการชำระเงิน
        </p>
        <Link
          href="/list"
          className="inline-flex px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-neutral-900 text-white hover:bg-black transition-colors shadow-xs"
        >
          ไปหน้ารายการสินค้า
        </Link>
      </div>
    );
  }

  // 3. User NOT Logged In Screen (Sleek Modern Auth Wall)
  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="bg-surface rounded-2xl border border-divider shadow-md p-6 sm:p-8 flex flex-col gap-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-accent-100 text-accent-800 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-text">เข้าสู่ระบบเพื่อดำเนินการสั่งซื้อ</h2>
            <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
              เพื่อบันทึกประวัติคำสั่งซื้อและตัดสต็อกสินค้าในระบบอย่างถูกต้อง
            </p>
          </div>

          {loginError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {loginError}
            </div>
          )}

          <form onSubmit={handleInlineLogin} className="flex flex-col gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">อีเมล (Email)</label>
              <input
                type="email"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-divider bg-bg text-text text-xs sm:text-sm outline-none focus:ring-1 focus:ring-accent"
                placeholder="name@example.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">รหัสผ่าน (Password)</label>
              <input
                type="password"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-divider bg-bg text-text text-xs sm:text-sm outline-none focus:ring-1 focus:ring-accent"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="mt-2 w-full min-h-[44px] rounded-xl text-xs sm:text-sm font-semibold bg-neutral-900 text-white hover:bg-black transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              {loginLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบเพื่อชำระเงิน"}
            </button>
          </form>

          {/* Quick Demo Test Buttons */}
          <div className="pt-4 border-t border-divider">
            <p className="text-[11px] uppercase tracking-wider text-neutral-500 text-center font-semibold mb-2.5">
              คลิกเพื่อเติมบัญชีสำหรับทดสอบ (Quick Test)
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                className="p-2.5 rounded-xl border border-divider bg-bg hover:bg-surface text-left transition-colors cursor-pointer"
                onClick={() => handleQuickFill("customer@minicommerce.com", "customer123")}
              >
                <span className="block text-xs font-bold text-accent-800">Customer ลูกค้า</span>
                <span className="block text-[10px] text-neutral-500 truncate">customer@minicommerce.com</span>
              </button>

              <button
                type="button"
                className="p-2.5 rounded-xl border border-divider bg-bg hover:bg-surface text-left transition-colors cursor-pointer"
                onClick={() => handleQuickFill("admin@minicommerce.com", "admin123")}
              >
                <span className="block text-xs font-bold text-purple-700">Admin ผู้ดูแล</span>
                <span className="block text-[10px] text-neutral-500 truncate">admin@minicommerce.com</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. User Logged In: Modern 2-Column Responsive Checkout
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-xs text-neutral-700 font-medium">
        <Link href="/" className="hover:text-accent">หน้าแรก</Link>
        <span>/</span>
        <Link href="/list" className="hover:text-accent">สินค้าทั้งหมด</Link>
        <span>/</span>
        <span className="text-text font-bold">ชำระเงิน</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Checkout Steps (7 cols on lg) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Step 1: Customer Info */}
          <div className="bg-surface rounded-2xl border border-divider p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <h3 className="text-base font-bold text-text">ข้อมูลผู้สั่งซื้อ</h3>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-accent-100 text-accent-900 border border-accent-200">
                {user.role === "admin" ? "ผู้ดูแลระบบ" : "สมาชิก"}
              </span>
            </div>
            <div className="p-3 bg-bg rounded-xl border border-divider flex items-center justify-between text-xs sm:text-sm">
              <span className="text-neutral-800 font-medium">บัญชีผู้ใช้: <strong className="text-text font-bold">{user.email}</strong></span>
              <span className="text-emerald-800 font-bold flex items-center gap-1">
                <span>✓</span> เข้าสู่ระบบแล้ว
              </span>
            </div>
          </div>

          {/* Step 2: Shipping Address */}
          <div className="bg-surface rounded-2xl border border-divider p-5 sm:p-6 shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center">
                2
              </span>
              <h3 className="text-base font-bold text-text">ที่อยู่จัดส่งสินค้า</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                  ชื่อ-นามสกุล ผู้รับ
                </label>
                <input
                  className="w-full px-3.5 py-2.5 rounded-xl border border-divider bg-bg text-text text-xs sm:text-sm outline-none focus:border-accent placeholder:text-neutral-600"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                  เบอร์โทรศัพท์
                </label>
                <input
                  className="w-full px-3.5 py-2.5 rounded-xl border border-divider bg-bg text-text text-xs sm:text-sm outline-none focus:border-accent placeholder:text-neutral-600"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                ที่อยู่จัดส่งโดยละเอียด
              </label>
              <textarea
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl border border-divider bg-bg text-text text-xs sm:text-sm outline-none focus:border-accent placeholder:text-neutral-600 leading-relaxed"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
              />
            </div>
          </div>

          {/* Step 3: Payment Methods (Visual Tiles without ring-1 overlap) */}
          <div className="bg-surface rounded-2xl border border-divider p-5 sm:p-6 shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center">
                3
              </span>
              <h3 className="text-base font-bold text-text">ช่องทางการชำระเงิน</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: "พร้อมเพย์ / QR", icon: "📱", desc: "สแกน QR ผ่าน Mobile Banking" },
                { id: "บัตรเครดิต", icon: "💳", desc: "Visa, Mastercard, JCB" },
                { id: "เก็บเงินปลายทาง", icon: "🚚", desc: "ชำระเงินเมื่อได้รับสินค้า" },
              ].map((m) => {
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`p-3.5 rounded-xl border-2 text-left flex flex-col gap-1.5 cursor-pointer transition-all ${
                      isSelected
                        ? "border-accent bg-accent-100 text-text font-semibold shadow-xs"
                        : "border-divider bg-bg hover:bg-surface text-neutral-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xl">{m.icon}</span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? "border-accent bg-accent" : "border-neutral-500"
                      }`}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                    <span className="text-xs font-bold mt-1 text-text">{m.id}</span>
                    <span className="text-xs text-neutral-700">{m.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 4: Items Review */}
          <div className="bg-surface rounded-2xl border border-divider p-5 sm:p-6 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between pb-3 border-b border-divider">
              <h3 className="text-base font-bold text-text">รายการสินค้า ({cart.totalQuantity} ชิ้น)</h3>
              <Link href="/list" className="text-xs text-accent hover:underline font-bold">
                + เพิ่มสินค้าอื่น
              </Link>
            </div>
            <div className="divide-y divide-divider">
              {items.map((it: CartItem) => {
                const productName = it.productName || it.product?.name || `สินค้า #${it.productId}`;
                const price = it.price ?? it.product?.price ?? 0;
                const imageUrl = it.imageUrl || it.product?.imageUrl;
                const lineTotal = it.totalPrice ?? (price * it.quantity);
                return (
                  <div key={it.id} className="py-3 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-bg border border-divider overflow-hidden shrink-0 flex items-center justify-center">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={productName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = "none";
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = "inline";
                          }}
                        />
                      ) : null}
                      <span
                        className={`text-[9px] font-mono text-neutral-700 font-semibold uppercase ${
                          imageUrl ? "hidden" : ""
                        }`}
                      >
                        shot
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-text truncate m-0">
                        {productName}
                      </p>
                      <p className="text-xs text-neutral-700 m-0 font-medium">
                        {it.quantity} × {formatPrice(price)}
                      </p>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-text">
                      {formatPrice(lineTotal)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Summary & Checkout CTA (5 cols on lg) */}
        <aside className="lg:col-span-5 lg:sticky lg:top-20 flex flex-col gap-4">
          <div className="bg-surface rounded-2xl border border-divider p-6 shadow-md flex flex-col gap-4">
            <h3 className="text-base font-bold text-text pb-3 border-b border-divider">
              สรุปคำสั่งซื้อ
            </h3>

            {/* Promo code */}
            <div>
              <div className="flex gap-2">
                <input
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-divider bg-bg outline-none focus:border-accent uppercase text-text placeholder:text-neutral-600 font-medium"
                  placeholder="โค้ดส่วนลด (เช่น SAVE10)"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl border border-divider bg-surface hover:bg-bg cursor-pointer whitespace-nowrap transition-colors text-text"
                >
                  ใช้โค้ด
                </button>
              </div>

              {promoMsg && (
                <p className={`text-xs mt-1.5 m-0 font-semibold ${
                  promoOk ? "text-emerald-800" : "text-rose-700"
                }`}>
                  {promoMsg}
                </p>
              )}
            </div>

            {/* Price breakdown */}
            <div className="flex flex-col gap-2 text-xs pt-2 border-t border-divider">
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
                  {shipping === 0 ? <span className="text-emerald-800 font-bold">ฟรี</span> : formatPrice(shipping)}
                </span>
              </div>
              <div className="flex justify-between items-baseline pt-3 border-t border-divider">
                <span className="text-sm font-bold text-text">ยอดชำระสุทธิ</span>
                <span className="text-2xl font-extrabold text-text">
                  {formatPrice(total)}
                </span>
              </div>
            </div>

            {/* Primary Order Button */}
            <button
              type="button"
              onClick={handleCheckout}
              disabled={submitting}
              className="w-full min-h-[48px] rounded-xl text-sm font-bold bg-accent hover:bg-accent-600 active:bg-accent-700 !text-white transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
            >
              {submitting ? (
                <span className="!text-white">กำลังตัดสต็อกและดำเนินการ...</span>
              ) : (
                <>
                  <span className="!text-white">ยืนยันคำสั่งซื้อ</span>
                  <span className="!text-white">·</span>
                  <span className="!text-white">{formatPrice(total)}</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-700 font-medium pt-1">
              <svg className="w-3.5 h-3.5 text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>เข้ารหัสข้อมูลปลอดภัย 256-bit SSL</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}