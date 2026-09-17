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

export default function CheckoutPage() {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [cart, setCart] = useState<any>({ items: [], totalQuantity: 0, subtotal: 0 });
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
  const [orderSuccess, setOrderSuccess] = useState<any | null>(null);
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
        กำลังโหลดข้อมูลการชำระเงินจาก TiDB Cloud...
      </div>
    );
  }

  // 1. Order Success Screen
  if (orderSuccess) {
    return (
      <div style={{ maxWidth: "680px", margin: "40px auto", padding: "var(--space-6)" }}>
        <div
          className="card elev-md"
          style={{
            padding: "var(--space-6)",
            background: "var(--color-surface)",
            textAlign: "center",
            gap: "var(--space-4)",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "var(--color-accent-100)",
              color: "var(--color-accent-800)",
              display: "grid",
              placeItems: "center",
              margin: "0 auto",
              fontSize: "28px",
            }}
          >
            ✓
          </div>
          <p style={{ margin: 0, fontSize: "12px", letterSpacing: ".12em", textTransform: "uppercase", color: "var(--color-accent-700)", fontWeight: 600 }}>
            ชำระเงินและตัดสต็อกสำเร็จ
          </p>
          <h2 style={{ margin: 0, fontSize: "30px" }}>ขอบคุณสำหรับคำสั่งซื้อ</h2>
          <p style={{ margin: 0, fontSize: "16px", color: "var(--color-neutral-800)" }}>
            เลขที่คำสั่งซื้อ: <strong>#{orderSuccess.id}</strong>
          </p>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--color-neutral-700)" }}>
            ระบบได้ทำการตัดสต็อกใน TiDB Cloud เรียบร้อยแล้ว ยอดชำระทั้งหมด: <strong>{formatPrice(orderSuccess.totalAmount || total)}</strong> ({paymentMethod})
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: "var(--space-3)", marginTop: "var(--space-3)" }}>
            <Link href="/" className="btn btn-primary" style={{ height: "40px", padding: "0 24px" }}>
              เลือกซื้อสินค้าต่อ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Empty Cart Screen
  if (items.length === 0) {
    return (
      <div style={{ maxWidth: "600px", margin: "60px auto", textAlign: "center", padding: "var(--space-4)" }}>
        <h2 style={{ fontSize: "28px", marginBottom: "var(--space-2)" }}>ยังไม่มีสินค้าในตะกร้า</h2>
        <p style={{ color: "var(--color-neutral-700)", marginBottom: "var(--space-4)" }}>
          กรุณาเลือกสินค้าใส่ตะกร้าก่อนดำเนินการชำระเงิน
        </p>
        <Link href="/" className="btn btn-primary">
          ไปหน้ารายการสินค้า
        </Link>
      </div>
    );
  }

  // 3. User NOT Logged In Screen (Requirement: "ถ้าอยากชำระเงินให้ login ก่อนถึงจะสามารถชำระเงินได้")
  if (!user) {
    return (
      <div style={{ maxWidth: "540px", margin: "40px auto", padding: "var(--space-4)" }}>
        <div
          className="card elev-md"
          style={{
            padding: "var(--space-6)",
            background: "var(--color-surface)",
            gap: "var(--space-4)",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <span className="card-kicker">ความปลอดภัยในการสั่งซื้อ</span>
            <h2 style={{ margin: "4px 0 0", fontSize: "26px" }}>กรุณาเข้าสู่ระบบก่อนชำระเงิน</h2>
            <p style={{ margin: "6px 0 0", fontSize: "13px", color: "var(--color-neutral-700)", lineHeight: 1.5 }}>
              เพื่อบันทึกคำสั่งซื้อและตัดสต็อกสินค้าในระบบอย่างถูกต้อง กรุณาเข้าสู่ระบบก่อนทำการชำระเงิน (สามารถใช้บัญชี Customer หรือ Admin ก็ได้)
            </p>
          </div>

          {loginError && (
            <div
              style={{
                padding: "var(--space-2) var(--space-3)",
                background: "var(--color-accent-2-100)",
                color: "var(--color-accent-2-800)",
                borderRadius: "var(--radius-md)",
                fontSize: "13px",
              }}
            >
              {loginError}
            </div>
          )}

          <form onSubmit={handleInlineLogin} style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <div className="field">
              <label>อีเมล (Email)</label>
              <input
                type="email"
                required
                className="input"
                placeholder="name@example.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
            </div>
            <div className="field">
              <label>รหัสผ่าน (Password)</label>
              <input
                type="password"
                required
                className="input"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="btn btn-primary btn-block"
              style={{ height: "42px", fontSize: "15px", marginTop: "var(--space-2)" }}
            >
              {loginLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบเพื่อชำระเงิน"}
            </button>
          </form>

          {/* Quick Demo Accounts */}
          <div style={{ borderTop: "1px solid var(--color-divider)", paddingTop: "var(--space-3)" }}>
            <p style={{ margin: "0 0 var(--space-2)", fontSize: "11px", textAlign: "center", textTransform: "uppercase", color: "var(--color-neutral-700)", fontWeight: 600 }}>
              คลิกเพื่อเติมบัญชีสำหรับทดสอบ (Quick Test)
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2)" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleQuickFill("customer@minicommerce.com", "customer123")}
                style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "6px 10px", textAlign: "left" }}
              >
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-accent-2-700)" }}>Customer ลูกค้า</span>
                <span style={{ fontSize: "10px", color: "var(--color-neutral-700)" }}>customer@minicommerce.com</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleQuickFill("admin@minicommerce.com", "admin123")}
                style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "6px 10px", textAlign: "left" }}
              >
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-accent-700)" }}>Admin ผู้ดูแล</span>
                <span style={{ fontSize: "10px", color: "var(--color-neutral-700)" }}>admin@minicommerce.com</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. User Logged In: Full Checkout Screen
  return (
    <div
      style={{
        padding: "var(--space-4) var(--space-6) var(--space-8)",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
        gap: "var(--space-8)",
        maxWidth: "1280px",
        margin: "0 auto",
      }}
    >
      {/* Left Column: Confirmation form & cart items */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--space-2)" }}>
          <h2 style={{ margin: 0, fontSize: "30px" }}>ยืนยันคำสั่งซื้อ</h2>
          <span style={{ fontSize: "13px", color: "var(--color-neutral-700)", background: "var(--color-surface)", padding: "4px 10px", borderRadius: "var(--radius-sm)" }}>
            สั่งซื้อในนาม: <strong>{user.email}</strong> ({user.role})
          </span>
        </div>

        {errorMsg && (
          <div
            style={{
              padding: "var(--space-3)",
              background: "var(--color-accent-2-100)",
              color: "var(--color-accent-2-800)",
              border: "1px solid var(--color-accent-2-300)",
              borderRadius: "var(--radius-md)",
              fontSize: "14px",
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* Shipping Address */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <h3 style={{ margin: 0, fontSize: "14px", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--color-neutral-700)", fontWeight: 600 }}>
            ที่อยู่จัดส่ง
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
            <div className="field">
              <label>ชื่อผู้รับ</label>
              <input
                className="input"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div className="field">
              <label>เบอร์โทร</label>
              <input
                className="input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>
          <div className="field">
            <label>ที่อยู่จัดส่ง</label>
            <textarea
              className="input"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              style={{ minHeight: "72px" }}
            />
          </div>
        </div>

        {/* Payment Methods */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <h3 style={{ margin: 0, fontSize: "14px", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--color-neutral-700)", fontWeight: 600 }}>
            ช่องทางชำระเงิน
          </h3>
          <div style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap" }}>
            {["พร้อมเพย์ / QR", "บัตรเครดิต", "เก็บเงินปลายทาง"].map((method) => (
              <label key={method} className="radio">
                <input
                  type="radio"
                  name="pay-method"
                  checked={paymentMethod === method}
                  onChange={() => setPaymentMethod(method)}
                />
                <span className="dot" />
                {method}
              </label>
            ))}
          </div>
        </div>

        {/* Cart items list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <h3 style={{ margin: 0, fontSize: "14px", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--color-neutral-700)", fontWeight: 600 }}>
            รายการ {cart.totalQuantity} ชิ้น
          </h3>
          {items.map((it: any) => {
            const product = it.product || {};
            const avail = Math.max(0, (product.stock || 0) - (product.held || 0));
            const isLow = avail > 0 && avail <= 10;
            const isOut = avail === 0;

            let tagCls = "tag tag-accent";
            let tagLabel = "พร้อมส่ง";
            if (isOut) {
              tagCls = "tag tag-neutral";
              tagLabel = "หมดชั่วคราว";
            } else if (isLow) {
              tagCls = "tag tag-accent-2";
              tagLabel = "ใกล้หมด";
            }

            return (
              <div
                key={it.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-3)",
                  padding: "var(--space-2) 0",
                  borderBottom: "1px solid color-mix(in srgb, var(--color-text) 8%, transparent)",
                }}
              >
                <div
                  className="halftone"
                  style={{
                    width: "48px",
                    height: "48px",
                    flex: "none",
                    background:
                      "repeating-linear-gradient(135deg, var(--color-neutral-200) 0 5px, var(--color-neutral-300) 5px 10px)",
                    borderRadius: "var(--radius-sm)",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <span style={{ fontSize: "8px", textTransform: "uppercase", color: "var(--color-neutral-700)" }}>
                    shot
                  </span>
                </div>
                <span style={{ flex: 1, fontSize: "14px", fontWeight: 500 }}>{product.name}</span>
                <span className={tagCls}>{tagLabel}</span>
                <span style={{ fontSize: "13px", color: "var(--color-neutral-700)", minWidth: "70px", textAlign: "right" }}>
                  × {it.quantity}
                </span>
                <span style={{ fontSize: "14px", minWidth: "90px", textAlign: "right", fontWeight: 600 }}>
                  {formatPrice((product.price || 0) * it.quantity)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Sticky Summary & Pay Button */}
      <aside
        style={{
          alignSelf: "start",
          position: "sticky",
          top: "var(--space-4)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-3)",
          padding: "var(--space-4)",
          background: "var(--color-surface)",
          borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <h3 style={{ margin: 0, fontSize: "20px" }}>สรุปยอด</h3>

        {/* Promo code */}
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <input
            className="input"
            placeholder="โค้ดโปรโมชั่น (เช่น SAVE10)"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
          />
          <button
            className="btn btn-secondary"
            onClick={handleApplyPromo}
            style={{ flex: "none", whiteSpace: "nowrap" }}
          >
            ใช้โค้ด
          </button>
        </div>

        {promoMsg && (
          <p
            style={{
              margin: 0,
              fontSize: "12px",
              color: promoOk ? "var(--color-accent-700)" : "var(--color-accent-2-700)",
            }}
          >
            {promoMsg}
          </p>
        )}

        {/* Breakdown */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            paddingTop: "var(--space-2)",
            borderTop: "1px solid var(--color-divider)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
            <span>ยอดสินค้า ({cart.totalQuantity} ชิ้น)</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "14px",
              color: discount > 0 ? "var(--color-accent-2-700)" : "var(--color-neutral-600)",
            }}
          >
            <span>{discount > 0 ? "ส่วนลดโปรโมชั่น" : "ส่วนลด"}</span>
            <span>{discount > 0 ? `−${formatPrice(discount)}` : "—"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
            <span>ค่าจัดส่ง</span>
            <span>{shipping === 0 ? "ฟรี" : formatPrice(shipping)}</span>
          </div>
        </div>

        {/* Total */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            paddingTop: "var(--space-2)",
            borderTop: "1px solid var(--color-text)",
          }}
        >
          <span style={{ fontSize: "14px", fontWeight: 600 }}>ยอดชำระ</span>
          <span style={{ fontSize: "26px", fontFamily: "var(--font-heading)", fontWeight: 700 }}>
            {formatPrice(total)}
          </span>
        </div>

        <button
          className="btn btn-primary btn-block"
          onClick={handleCheckout}
          disabled={submitting}
          style={{ height: "44px", fontSize: "16px" }}
        >
          {submitting ? "กำลังตัดสต็อกและดำเนินการ..." : "ชำระเงิน"}
        </button>

        <p style={{ margin: 0, fontSize: "11px", color: "var(--color-neutral-700)", lineHeight: 1.6 }}>
          เมื่อกดชำระเงิน ระบบจะจองสต็อกให้ 10 นาที และตัดสต็อกจริงเมื่อชำระสำเร็จ หากสินค้าถูกซื้อหมดก่อน จะได้รับแจ้งเตือนและปรับจำนวนอัตโนมัติ
        </p>
      </aside>
    </div>
  );
}