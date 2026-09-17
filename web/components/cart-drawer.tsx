"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getCart,
  updateCartItem,
  removeCartItem,
  validatePromotion,
} from "../lib/ecommerce-actions";

export default function CartDrawer({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [cart, setCart] = useState<any>({ items: [], totalQuantity: 0, subtotal: 0 });
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
      setDiscount(res.data.discount || 0);
      setPromoMsg(`ใช้โค้ด ${code} แล้ว — ${res.data.description || "รับส่วนลดพิเศษ"}`);
    } else {
      setPromoOk(false);
      setDiscount(0);
      setPromoMsg(res.data?.message || `โค้ด ${code} ใช้ไม่ได้หรือหมดโควตาแล้ว`);
    }
  };

  const formatPrice = (n: number) => `฿${(n || 0).toLocaleString("th-TH")}`;

  if (!isOpen) return null;

  const items = cart.items || [];
  const subtotal = cart.subtotal || 0;
  const shipping = items.length === 0 ? 0 : promoCode.toUpperCase() === "FREESHIP" || subtotal - discount >= 1500 ? 0 : 50;
  const total = Math.max(0, subtotal - discount + shipping);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999 }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "color-mix(in srgb, var(--color-neutral-900) 45%, transparent)",
          backdropFilter: "blur(2px)",
        }}
      />

      {/* Drawer */}
      <aside
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "440px",
          maxWidth: "100%",
          background: "var(--color-bg)",
          boxShadow: "var(--shadow-lg)",
          display: "flex",
          flexDirection: "column",
          zIndex: 10000,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "var(--space-4)",
            borderBottom: "1px solid var(--color-text)",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "22px", fontFamily: "var(--font-heading)" }}>
            ตะกร้าสินค้า · {cart.totalQuantity || 0} ชิ้น
          </h3>
          <button
            className="btn btn-secondary btn-icon"
            onClick={onClose}
            aria-label="ปิดตะกร้า"
            style={{ width: "36px", height: "36px" }}
          >
            ✕
          </button>
        </div>

        {/* Item List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 var(--space-4)" }}>
          {items.length === 0 ? (
            <div style={{ padding: "var(--space-8) 0", textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: "15px", color: "var(--color-neutral-700)" }}>
                ยังไม่มีสินค้าในตะกร้า
              </p>
              <button
                className="btn btn-primary"
                onClick={onClose}
                style={{ marginTop: "var(--space-4)" }}
              >
                เลือกซื้อสินค้า
              </button>
            </div>
          ) : (
            items.map((item: any) => {
              const product = item.product || {};
              const avail = Math.max(0, (product.stock || 0) - (product.held || 0));
              const isLow = avail > 0 && avail <= 10;
              const isOut = avail === 0;
              const isOver = item.quantity > avail;

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
                  key={item.id}
                  style={{
                    display: "flex",
                    gap: "var(--space-3)",
                    padding: "var(--space-3) 0",
                    borderBottom: "1px solid color-mix(in srgb, var(--color-text) 8%, transparent)",
                  }}
                >
                  <div
                    className="halftone"
                    style={{
                      width: "64px",
                      height: "64px",
                      flex: "none",
                      background:
                        "repeating-linear-gradient(135deg, var(--color-neutral-200) 0 6px, var(--color-neutral-300) 6px 12px)",
                      display: "grid",
                      placeItems: "center",
                      borderRadius: "var(--radius-sm)",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        style={{
                          position: "absolute",
                          inset: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          fontSize: "9px",
                          letterSpacing: ".1em",
                          textTransform: "uppercase",
                          color: "var(--color-neutral-700)",
                        }}
                      >
                        shot
                      </span>
                    )}
                  </div>

                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px", minWidth: 0 }}>
                    <span style={{ fontSize: "14px", fontWeight: 600 }}>{product.name}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span className={tagCls}>{tagLabel}</span>
                      <span style={{ fontSize: "12px", color: "var(--color-neutral-700)" }}>
                        {isOut ? "รอเข้าคลัง" : `เหลือ ${avail} ชิ้น`}
                      </span>
                    </div>

                    {isOver && (
                      <span style={{ fontSize: "11px", color: "var(--color-accent-2-700)" }}>
                        ขายได้เพียง {avail} ชิ้น — ระบบจะปรับจำนวนให้เมื่อกดชำระเงิน
                      </span>
                    )}

                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginTop: "4px" }}>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleUpdateQty(item.id, item.quantity, -1)}
                        disabled={loading}
                        style={{ width: "28px", height: "28px", padding: 0 }}
                      >
                        −
                      </button>
                      <span style={{ fontSize: "14px", minWidth: "20px", textAlign: "center" }}>
                        {item.quantity}
                      </span>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleUpdateQty(item.id, item.quantity, 1)}
                        disabled={loading || item.quantity >= product.stock}
                        style={{ width: "28px", height: "28px", padding: 0 }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <span style={{ fontSize: "14px", whiteSpace: "nowrap", alignSelf: "center", fontWeight: 500 }}>
                    {formatPrice((product.price || 0) * item.quantity)}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div
            style={{
              padding: "var(--space-4)",
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-3)",
              background: "var(--color-surface)",
              borderTop: "1px solid var(--color-divider)",
            }}
          >
            {/* Promo Code Input */}
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              <input
                className="input"
                placeholder="โค้ดโปรโมชั่น (เช่น SAVE10, FREESHIP)"
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

            {/* Price Summary */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
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
              <span style={{ fontSize: "15px", fontWeight: 600 }}>ยอดชำระ</span>
              <span style={{ fontSize: "24px", fontFamily: "var(--font-heading)", fontWeight: 700 }}>
                {formatPrice(total)}
              </span>
            </div>

            {/* Checkout Button */}
            <Link
              href="/checkout"
              onClick={onClose}
              className="btn btn-primary btn-block"
              style={{ height: "44px", fontSize: "16px" }}
            >
              ไปหน้าชำระเงิน
            </Link>

            <p style={{ margin: 0, fontSize: "11px", color: "var(--color-neutral-700)", lineHeight: 1.6 }}>
              เมื่อกดชำระเงิน ระบบจะจองสต็อกให้ 10 นาที และตัดสต็อกจริงเมื่อชำระสำเร็จ หากสินค้าถูกซื้อหมดก่อน จะได้รับแจ้งเตือนและปรับจำนวนอัตโนมัติ
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
