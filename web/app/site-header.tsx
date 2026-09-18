"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
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
  const [accountMenuOpen, setAccountMenuOpen] = useState<boolean>(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  const isAdminPath =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/inventory") ||
    pathname.startsWith("/order") ||
    pathname.startsWith("/promotion");

  const displayName = user?.email ? user.email.split("@")[0] : "";

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

  // Click outside and escape key listener for account popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAccountMenuOpen(false);
      }
    };

    if (accountMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [accountMenuOpen]);

  const handleLogout = async () => {
    await logoutAction();
    setUser(null);
    setAccountMenuOpen(false);
    if (isAdminPath) {
      router.push("/admin/console");
    } else {
      router.push("/");
    }
    router.refresh();
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* STOREFRONT HEADER (Full-Bleed 100% Width Sticky Header)                  */}
      {/* ========================================================================= */}
      {!isAdminPath && (
        <header className="w-full border-b border-divider bg-surface/90 backdrop-blur-md sticky top-0 z-40">
          <div className="w-full px-3.5 sm:px-6 lg:px-8 2xl:px-12 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
            {/* Left: Brand & Main Navigation */}
            <div className="flex items-center gap-3 sm:gap-6 min-w-0">
              <Link
                href="/"
                className="text-base sm:text-xl font-bold tracking-tight text-text hover:text-accent transition-colors flex items-center gap-1.5 shrink-0"
              >
                <span>Mini Commerce</span>
              </Link>
              <Link
                href="/list"
                className={`text-xs sm:text-sm font-medium transition-colors hidden sm:inline-block ${
                  pathname === "/" || pathname === "/list"
                    ? "text-accent font-semibold"
                    : "text-neutral-800 hover:text-text"
                }`}
              >
                สินค้าทั้งหมด
              </Link>
            </div>

            {/* Right: Auth User Popover & Cart Button */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {user ? (
                <div className="relative" ref={accountMenuRef}>
                  <button
                    type="button"
                    onClick={() => setAccountMenuOpen((prev) => !prev)}
                    className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg border border-divider bg-surface hover:bg-bg text-text transition-all cursor-pointer text-xs sm:text-sm font-medium shadow-xs select-none"
                    aria-expanded={accountMenuOpen}
                    aria-haspopup="true"
                  >
                    {/* User Person Icon Avatar */}
                    <div className="w-6 h-6 rounded-full bg-accent-100 text-accent-800 flex items-center justify-center shrink-0 text-xs font-bold">
                      <svg
                        className="w-3.5 h-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                    {/* Display name only */}
                    <span className="font-semibold text-text max-w-[75px] sm:max-w-[140px] truncate hidden xs:inline sm:inline">
                      {displayName}
                    </span>
                    <svg
                      className={`w-3.5 h-3.5 text-neutral-700 transition-transform duration-200 ${
                        accountMenuOpen ? "rotate-180" : ""
                      }`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {/* Account Popover Menu */}
                  {accountMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 sm:w-72 max-w-[calc(100vw-24px)] rounded-2xl border border-divider bg-surface shadow-xl py-3 px-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      {/* Account Summary */}
                      <div className="flex items-center gap-3 pb-3 border-b border-divider px-1">
                        <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-text truncate">
                              {displayName}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                user.role === "admin"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {user.role === "admin" ? "ผู้ดูแลระบบ" : "สมาชิก"}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-800 font-medium truncate" title={user.email}>
                            {user.email}
                          </p>
                        </div>
                      </div>

                      {/* Menu Links */}
                      <div className="py-2 flex flex-col gap-1">
                        <Link
                          href="/account"
                          onClick={() => setAccountMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs sm:text-sm font-medium text-text hover:bg-bg rounded-xl transition-colors"
                        >
                          <svg
                            className="w-4 h-4 text-neutral-700"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <path d="M16 10a4 4 0 0 1-8 0" />
                          </svg>
                          <span>ประวัติคำสั่งซื้อของฉัน</span>
                        </Link>

                        {user.role === "admin" && (
                          <Link
                            href="/admin/console"
                            onClick={() => setAccountMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-xs sm:text-sm font-medium text-purple-800 hover:bg-purple-50 rounded-xl transition-colors"
                          >
                            <svg
                              className="w-4 h-4 text-purple-700"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <rect x="3" y="3" width="7" height="7" />
                              <rect x="14" y="3" width="7" height="7" />
                              <rect x="14" y="14" width="7" height="7" />
                              <rect x="3" y="14" width="7" height="7" />
                            </svg>
                            <span>ระบบจัดการหลังร้าน (Admin)</span>
                          </Link>
                        )}
                      </div>

                      {/* Sign Out Button */}
                      <div className="pt-2 border-t border-divider">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs sm:text-sm font-medium text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        >
                          <svg
                            className="w-4 h-4 text-rose-600"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                          </svg>
                          <span>ออกจากระบบ</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg border border-divider hover:bg-bg text-text transition-colors"
                >
                  <svg
                    className="w-4 h-4 text-neutral-700"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>เข้าสู่ระบบ</span>
                </Link>
              )}

              {/* Cart Drawer Button */}
              <button
                onClick={() => setCartDrawerOpen(true)}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-accent text-white hover:bg-accent-600 active:bg-accent-700 cursor-pointer shadow-xs transition-colors"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 4h2.5l2.2 10.5h9.6L19 7H6" />
                  <circle cx="9" cy="19" r="1.4" />
                  <circle cx="17" cy="19" r="1.4" />
                </svg>
                <span className="hidden xs:inline sm:inline">ตะกร้า</span>
                <span className="px-1.5 py-0.2 bg-white/25 text-white rounded-full text-xs font-bold">
                  {cartCount}
                </span>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* ========================================================================= */}
      {/* ADMIN HEADER (Shown only when in Admin Console)                           */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* ADMIN HEADER (Shown only when in Admin Console)                           */}
      {/* ========================================================================= */}
      {isAdminPath && (
        <div className="w-full border-b border-divider bg-surface sticky top-0 z-40 shadow-xs">
          {/* Top Magenta Accent Line indicating Admin Mode */}
          <div className="h-1 bg-accent-2 w-full" />

          <div className="w-full px-4 sm:px-6 lg:px-8 2xl:px-12 py-3">
            {/* Top row: Title and Admin user actions */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-accent-2 font-mono">
                    Mini Commerce · Admin Console
                  </span>
                  <span className="text-[10px] bg-accent-2/10 text-accent-2 font-bold px-1.5 py-0.2 rounded border border-accent-2/20">
                    Restricted
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text m-0">
                  ระบบจัดการหลังร้านและคลังสินค้า
                </h1>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                {user && (
                  <div className="flex items-center gap-1.5 text-xs text-neutral-800 bg-bg border border-divider px-3 py-1.5 rounded-xl font-medium shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Admin:</span>
                    <strong className="text-text font-semibold">{user.email}</strong>
                  </div>
                )}
                <Link
                  href="/"
                  className="text-xs font-semibold px-3 py-2 rounded-xl border border-divider bg-surface hover:bg-bg text-text transition-colors shadow-xs flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                  <span>หน้าร้านค้า</span>
                </Link>
                {user && (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-xs font-semibold px-3 py-2 rounded-xl text-rose-700 hover:bg-rose-100/60 transition-colors cursor-pointer"
                  >
                    ออกจากระบบ
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slide-over Cart Drawer */}
      <CartDrawer isOpen={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />
    </>
  );
}
