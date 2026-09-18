"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSessionUserAction, logoutAction } from "../lib/auth/actions";
import { PublicUser } from "../lib/auth/type";
import { getCart } from "../lib/ecommerce-actions";
import CartDrawer from "../components/cart-drawer";

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [cartCount, setCartCount] = useState<number>(0);
  const [cartDrawerOpen, setCartDrawerOpen] = useState<boolean>(false);

  const isAdminPath =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/inventory") ||
    pathname.startsWith("/order") ||
    pathname.startsWith("/promotion");

  const fetchCartCount = async () => {
    try {
      const c = await getCart();
      setCartCount(c?.totalQuantity || 0);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    getSessionUserAction().then((u) => setUser(u));
    fetchCartCount();

    const handleCartUpdate = () => fetchCartCount();
    const handleOpenCart = () => setCartDrawerOpen(true);

    window.addEventListener("cart-updated", handleCartUpdate);
    window.addEventListener("open-cart", handleOpenCart);

    return () => {
      window.removeEventListener("cart-updated", handleCartUpdate);
      window.removeEventListener("open-cart", handleOpenCart);
    };
  }, [pathname]);

  const handleLogout = async () => {
    await logoutAction();
    setUser(null);
    if (isAdminPath) {
      router.push("/admin/console");
    } else {
      router.push("/");
    }
    router.refresh();
  };

  return (
    <>
      <div style={{ padding: "24px 32px 16px", maxWidth: "1280px", margin: "0 auto", width: "100%" }}>
        {/* ========================================================================= */}
        {/* STOREFRONT HEADER (Shown only when in Storefront)                        */}
        {/* ========================================================================= */}
        {!isAdminPath && (
          <header style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            <div style={{ height: "4px", background: "var(--color-text)" }} />
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: "var(--space-4)",
                padding: "2px 0",
              }}
            >
              <span style={{ fontSize: "11px", letterSpacing: ".16em", textTransform: "uppercase", fontWeight: 600 }}>
                Mini Commerce · Storefront
              </span>
              <span style={{ fontSize: "11px", letterSpacing: ".1em", color: "var(--color-neutral-700)" }}>
                ระบบร้านค้าออนไลน์
              </span>
            </div>
            <div style={{ height: "1px", background: "var(--color-text)" }} />

            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "var(--space-3)",
                marginTop: "var(--space-2)",
              }}
            >
              <div>
                <h1 style={{ margin: 0, fontSize: "38px", lineHeight: 1.08, maxWidth: "20ch" }}>
                  ระบบจัดการคำสั่งซื้อและสต็อกสินค้า
                </h1>
                <p style={{ margin: "6px 0 0", fontSize: "14px", maxWidth: "66ch", color: "var(--color-neutral-800)", lineHeight: 1.5 }}>
                  เลือกซื้อสินค้าคุณภาพ จัดการคำสั่งซื้อรวดเร็ว พร้อมตรวจสอบสต็อกคงเหลือแบบเรียลไทม์
                </p>
              </div>

              {/* User Account / Auth */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                  fontSize: "13px",
                  background: "var(--color-surface)",
                  padding: "6px 12px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-divider)",
                }}
              >
                {user ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: "var(--color-neutral-700)" }}>
                      ผู้ใช้: <strong style={{ color: "var(--color-text)" }}>{user.email}</strong>
                    </span>
                    {user.role === "admin" && (
                      <Link
                        href="/admin/console"
                        style={{
                          fontSize: "11px",
                          padding: "2px 6px",
                          background: "var(--color-accent-100)",
                          color: "var(--color-accent-800)",
                          borderRadius: "var(--radius-sm)",
                          fontWeight: 600,
                        }}
                      >
                        เข้าสู่หลังร้าน
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="btn btn-ghost"
                      style={{ fontSize: "12px", padding: "0 4px" }}
                    >
                      ออกจากระบบ
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <span style={{ color: "var(--color-neutral-600)" }}>ยังไม่ได้เข้าสู่ระบบ</span>
                    <Link
                      href="/login"
                      className="btn btn-primary"
                      style={{ padding: "4px 10px", fontSize: "12px" }}
                    >
                      เข้าสู่ระบบ
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Storefront Navigation bar (NO Admin tabs) */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-3)",
                padding: "var(--space-3) 0",
                borderTop: "1px solid var(--color-divider)",
                borderBottom: "1px solid var(--color-divider)",
                marginTop: "var(--space-2)",
              }}
            >
              <Link
                href="/"
                className="btn"
                style={{
                  fontSize: "14px",
                  padding: "6px 14px",
                  border: "1px solid var(--color-divider)",
                  background: pathname === "/" || pathname === "/list" ? "var(--color-accent)" : "transparent",
                  color: pathname === "/" || pathname === "/list" ? "#ffffff" : "var(--color-text)",
                  fontWeight: pathname === "/" || pathname === "/list" ? 600 : 400,
                }}
              >
                สินค้าทั้งหมด
              </Link>
              <Link
                href="/checkout"
                className="btn"
                style={{
                  fontSize: "14px",
                  padding: "6px 14px",
                  border: "1px solid var(--color-divider)",
                  background: pathname === "/checkout" ? "var(--color-accent)" : "transparent",
                  color: pathname === "/checkout" ? "#ffffff" : "var(--color-text)",
                  fontWeight: pathname === "/checkout" ? 600 : 400,
                }}
              >
                ชำระเงิน
              </Link>

              {/* Cart Drawer Button */}
              <div style={{ marginLeft: "auto" }}>
                <button
                  onClick={() => setCartDrawerOpen(true)}
                  className="btn btn-primary"
                  style={{ height: "36px", fontSize: "13px" }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M3 4h2.5l2.2 10.5h9.6L19 7H6" />
                    <circle cx="9" cy="19" r="1.4" />
                    <circle cx="17" cy="19" r="1.4" />
                  </svg>
                  ตะกร้า · {cartCount}
                </button>
              </div>
            </div>
          </header>
        )}

        {/* ========================================================================= */}
        {/* ADMIN HEADER (Shown only when in Admin Console)                           */}
        {/* ========================================================================= */}
        {isAdminPath && (
          <header style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            <div style={{ height: "4px", background: "var(--color-accent-2)" }} />
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: "var(--space-4)",
                padding: "2px 0",
              }}
            >
              <span style={{ fontSize: "11px", letterSpacing: ".16em", textTransform: "uppercase", fontWeight: 700, color: "var(--color-accent-2-700)" }}>
                Mini Commerce · Admin Console
              </span>
              <span style={{ fontSize: "11px", letterSpacing: ".1em", color: "var(--color-neutral-700)" }}>
                เฉพาะผู้ดูแลระบบ (Admin Console)
              </span>
            </div>
            <div style={{ height: "1px", background: "var(--color-divider)" }} />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "var(--space-3)",
                padding: "var(--space-2) 0",
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: "24px", lineHeight: 1.1 }}>
                  ระบบจัดการหลังร้านและคลังสินค้า
                </h2>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                {user && (
                  <span style={{ fontSize: "12px", color: "var(--color-neutral-700)", background: "var(--color-surface)", padding: "4px 8px", borderRadius: "var(--radius-sm)" }}>
                    Admin: <strong>{user.email}</strong>
                  </span>
                )}
                <Link href="/" className="btn btn-secondary" style={{ fontSize: "12px", padding: "4px 10px" }}>
                  ← ไปหน้าร้านค้า (Storefront)
                </Link>
                {user && (
                  <button onClick={handleLogout} className="btn btn-ghost" style={{ fontSize: "12px", padding: "4px 8px" }}>
                    ออกจากระบบ
                  </button>
                )}
              </div>
            </div>

            {/* Admin Menu Tabs */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "var(--space-1)",
                padding: "var(--space-2) 0",
                borderTop: "1px solid var(--color-divider)",
                borderBottom: "1px solid var(--color-divider)",
              }}
            >
              <Link
                href="/dashboard"
                className="btn"
                style={{
                  fontSize: "13px",
                  padding: "6px 14px",
                  border: "1px solid var(--color-divider)",
                  background: pathname.startsWith("/dashboard") ? "var(--color-accent)" : "transparent",
                  color: pathname.startsWith("/dashboard") ? "#ffffff" : "var(--color-text)",
                  fontWeight: pathname.startsWith("/dashboard") ? 600 : 400,
                }}
              >
                ภาพรวม (Dashboard)
              </Link>
              <Link
                href="/order"
                className="btn"
                style={{
                  fontSize: "13px",
                  padding: "6px 14px",
                  border: "1px solid var(--color-divider)",
                  background: pathname.startsWith("/order") ? "var(--color-accent)" : "transparent",
                  color: pathname.startsWith("/order") ? "#ffffff" : "var(--color-text)",
                  fontWeight: pathname.startsWith("/order") ? 600 : 400,
                }}
              >
                คำสั่งซื้อ (Orders)
              </Link>
              <Link
                href="/inventory"
                className="btn"
                style={{
                  fontSize: "13px",
                  padding: "6px 14px",
                  border: "1px solid var(--color-divider)",
                  background: pathname.startsWith("/inventory") ? "var(--color-accent)" : "transparent",
                  color: pathname.startsWith("/inventory") ? "#ffffff" : "var(--color-text)",
                  fontWeight: pathname.startsWith("/inventory") ? 600 : 400,
                }}
              >
                สินค้า & สต็อก (Inventory)
              </Link>
              <Link
                href="/promotion"
                className="btn"
                style={{
                  fontSize: "13px",
                  padding: "6px 14px",
                  border: "1px solid var(--color-divider)",
                  background: pathname.startsWith("/promotion") ? "var(--color-accent)" : "transparent",
                  color: pathname.startsWith("/promotion") ? "#ffffff" : "var(--color-text)",
                  fontWeight: pathname.startsWith("/promotion") ? 600 : 400,
                }}
              >
                โปรโมชั่น (Promotions)
              </Link>
            </div>
          </header>
        )}
      </div>

      {/* Slide-over Cart Drawer */}
      <CartDrawer isOpen={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />
    </>
  );
}
