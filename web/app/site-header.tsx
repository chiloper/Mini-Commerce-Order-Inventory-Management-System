"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { getSessionUserAction, logoutAction } from "../lib/auth/actions";
import { PublicUser } from "../lib/auth/type";
import { getCachedUser, setCachedUser, subscribeAuthState } from "../lib/auth/auth-state";
import { getCart } from "../lib/ecommerce-actions";
import CartDrawer from "../components/cart-drawer";
import { ADMIN_NAV_ITEMS } from "../components/admin-sidebar";

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(() => getCachedUser());
  const [authLoading, setAuthLoading] = useState<boolean>(() => !getCachedUser());
  const [cartCount, setCartCount] = useState<number>(0);
  const [cartDrawerOpen, setCartDrawerOpen] = useState<boolean>(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  const isAdminPath =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/inventory") ||
    pathname.startsWith("/order") ||
    pathname.startsWith("/promotion") ||
    pathname.startsWith("/category");

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
    const unsub = subscribeAuthState((u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    setMobileSidebarOpen(false);
    getSessionUserAction().then((u) => {
      setUser(u);
      setCachedUser(u);
      setAuthLoading(false);
    });
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

  // Click outside and escape key listener for account popover & mobile sidebar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAccountMenuOpen(false);
        setMobileSidebarOpen(false);
      }
    };

    if (accountMenuOpen || mobileSidebarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [accountMenuOpen, mobileSidebarOpen]);

  const handleLogout = async () => {
    setCachedUser(null);
    setUser(null);
    setAccountMenuOpen(false);
    await logoutAction();
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
              {authLoading && !user ? (
                <div className="flex items-center gap-1.5 sm:gap-2 select-none animate-pulse" aria-hidden="true">
                  <div className="w-14 sm:w-16 h-4 bg-neutral-200/70 rounded-md hidden xs:block" />
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-neutral-200/70 shrink-0" />
                </div>
              ) : user ? (
                <div className="relative" ref={accountMenuRef}>
                  <button
                    type="button"
                    onClick={() => setAccountMenuOpen((prev) => !prev)}
                    className="flex items-center gap-1.5 sm:gap-2 cursor-pointer select-none group"
                    aria-expanded={accountMenuOpen}
                    aria-haspopup="true"
                  >
                    {/* Customer display name in front */}
                    <span className="font-semibold text-text text-xs sm:text-sm max-w-[85px] sm:max-w-[140px] truncate group-hover:text-accent transition-colors">
                      {displayName}
                    </span>

                    {/* Circular User Icon Avatar */}
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border bg-surface group-hover:bg-bg flex items-center justify-center shrink-0 shadow-xs transition-all ${
                        accountMenuOpen
                          ? "border-accent ring-2 ring-accent/30 text-accent"
                          : "border-divider text-neutral-800 group-hover:text-accent group-hover:border-accent/40"
                      }`}
                    >
                      <svg
                        className="w-4 h-4 sm:w-4.5 sm:h-4.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
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
                  className="flex items-center gap-1.5 sm:gap-2 cursor-pointer select-none group"
                  title="เข้าสู่ระบบ"
                >
                  {/* Action text in front */}
                  <span className="font-semibold text-text text-xs sm:text-sm group-hover:text-accent transition-colors">
                    เข้าสู่ระบบ
                  </span>
                  {/* Circular User Icon */}
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-divider bg-surface group-hover:bg-bg group-hover:border-accent/40 text-neutral-800 group-hover:text-accent flex items-center justify-center shrink-0 shadow-xs transition-all">
                    <svg
                      className="w-4 h-4 sm:w-4.5 sm:h-4.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                </Link>
              )}

              {/* Cart Drawer Button */}
              <button
                type="button"
                onClick={() => setCartDrawerOpen(true)}
                className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-accent text-white hover:bg-accent-600 active:bg-accent-700 cursor-pointer shadow-xs transition-all shrink-0 group"
                aria-label={`ตะกร้าสินค้า (${cartCount} รายการ)`}
                title={`ตะกร้าสินค้า (${cartCount} รายการ)`}
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-110"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <path d="M3 4h2.5l2.2 10.5h9.6L19 7H6" />
                  <circle cx="9" cy="19" r="1.5" />
                  <circle cx="17" cy="19" r="1.5" />
                </svg>
                <span
                  className={`absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 px-1 min-w-[18px] h-[18px] sm:min-w-[20px] sm:h-[20px] flex items-center justify-center rounded-full text-[10px] sm:text-[11px] font-bold border-2 border-surface shadow-xs leading-none ${
                    cartCount > 0 ? "bg-rose-500 text-white" : "bg-neutral-600 text-white"
                  }`}
                >
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* ========================================================================= */}
      {/* ADMIN BACK-OFFICE HEADER (Shown on all Admin Pages)                       */}
      {/* ========================================================================= */}
      {isAdminPath && (
        <header className="w-full border-b border-divider bg-surface/90 backdrop-blur-md sticky top-0 z-40 shadow-xs">
          {/* Subtle Top Accent Line indicating Admin Mode */}
          <div className="h-0.5 bg-accent-2 w-full" />

          <div className="w-full px-3.5 sm:px-6 lg:px-8 2xl:px-12 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
            {/* Left: Hamburger (Mobile) & Brand & Admin Badge */}
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              {/* Mobile Hamburger Button */}
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                className="flex md:hidden items-center justify-center w-8 h-8 rounded-xl border border-divider bg-surface hover:bg-neutral-100 text-neutral-800 active:bg-neutral-200 cursor-pointer shadow-2xs transition-all shrink-0"
                aria-label="เปิดเมนูการจัดการ"
                title="เปิดเมนูการจัดการ"
              >
                <svg className="w-4 h-4 text-neutral-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>

              <Link
                href="/dashboard"
                className="text-base sm:text-xl font-bold tracking-tight text-text hover:text-accent transition-colors flex items-center gap-2 shrink-0"
              >
                <span>Mini Commerce</span>
                <span className="text-[10px] font-mono tracking-wider uppercase font-bold text-accent-2 bg-purple-100 border border-purple-200/80 px-2 py-0.5 rounded-full">
                  Admin Console
                </span>
              </Link>
            </div>

            {/* Right: View Storefront Link & Admin Profile Popover */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">

              {/* Admin Profile Trigger */}
              {authLoading && !user ? (
                <div className="flex items-center gap-1.5 sm:gap-2 select-none animate-pulse" aria-hidden="true">
                  <div className="w-16 sm:w-20 h-4 bg-purple-200/60 rounded-md hidden xs:block" />
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-purple-200/60 shrink-0" />
                </div>
              ) : user ? (
                <div className="relative" ref={accountMenuRef}>
                  <button
                    type="button"
                    onClick={() => setAccountMenuOpen((prev) => !prev)}
                    className="flex items-center gap-1.5 sm:gap-2 cursor-pointer select-none group"
                    aria-expanded={accountMenuOpen}
                    aria-haspopup="true"
                  >
                    {/* Admin name in front */}
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-text max-w-[85px] sm:max-w-[150px] truncate group-hover:text-accent transition-colors">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      <span className="text-neutral-700 hidden xs:inline">Admin:</span>
                      <span className="truncate">{displayName}</span>
                    </div>

                    {/* Circular Shield Avatar */}
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border bg-surface group-hover:bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 shadow-xs transition-all ${
                        accountMenuOpen
                          ? "border-purple-600 ring-2 ring-purple-500/30 text-purple-800"
                          : "border-divider group-hover:border-purple-300"
                      }`}
                      title={`ผู้ดูแลระบบ: ${user.email}`}
                    >
                      <svg
                        className="w-4 h-4 sm:w-4.5 sm:h-4.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                      >
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                    </div>
                  </button>

                  {/* Admin Popover Menu */}
                  {accountMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 sm:w-72 max-w-[calc(100vw-24px)] rounded-2xl border border-divider bg-surface shadow-xl py-3 px-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      {/* Account Summary */}
                      <div className="flex items-center gap-3 pb-3 border-b border-divider px-1">
                        <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-text truncate">
                              {displayName}
                            </span>
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 shrink-0">
                              ผู้ดูแลระบบ
                            </span>
                          </div>
                          <p className="text-xs text-neutral-800 font-medium truncate" title={user.email}>
                            {user.email}
                          </p>
                        </div>
                      </div>

                      {/* Admin Links */}
                      <div className="py-2 flex flex-col gap-1">
                        <Link
                          href="/"
                          onClick={() => setAccountMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs sm:text-sm font-medium text-text hover:bg-bg rounded-xl transition-colors"
                        >
                          <svg className="w-4 h-4 text-neutral-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                          </svg>
                          <span>ดูหน้าร้านค้า (Storefront)</span>
                        </Link>

                        <Link
                          href="/dashboard"
                          onClick={() => setAccountMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs sm:text-sm font-medium text-text hover:bg-bg rounded-xl transition-colors"
                        >
                          <svg className="w-4 h-4 text-neutral-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="9" rx="1" />
                            <rect x="14" y="3" width="7" height="5" rx="1" />
                            <rect x="14" y="12" width="7" height="9" rx="1" />
                            <rect x="3" y="16" width="7" height="5" rx="1" />
                          </svg>
                          <span>ภาพรวมร้าน (Dashboard)</span>
                        </Link>
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
                  href="/admin/console"
                  className="px-3 py-1.5 text-xs sm:text-sm font-bold rounded-xl bg-accent text-white hover:bg-accent-600 transition-all shadow-xs"
                >
                  เข้าสู่ระบบแอดมิน
                </Link>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Slide-over Mobile Admin Drawer (Mobile only) */}
      {isAdminPath && mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />

          {/* Drawer Container */}
          <div className="fixed inset-y-0 left-0 max-w-[280px] w-full bg-surface shadow-2xl flex flex-col z-10 border-r border-divider animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-divider flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-text">เมนูระบบหลังร้าน</span>
                <span className="text-[9px] font-mono uppercase font-bold text-accent-2 bg-purple-100 border border-purple-200 px-1.5 py-0.5 rounded-md">
                  Admin
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                aria-label="ปิดเมนู"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Navigation links */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {ADMIN_NAV_ITEMS.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname?.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-purple-100/90 text-purple-900 font-semibold shadow-2xs border border-purple-200/60"
                        : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
                    }`}
                  >
                    <span className="text-lg shrink-0">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Footer / Storefront link & Logout */}
            <div className="p-3 border-t border-divider space-y-1.5 bg-neutral-50/50">
              <Link
                href="/products"
                onClick={() => setMobileSidebarOpen(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-white rounded-xl border border-divider transition-all"
              >
                <svg className="w-4 h-4 text-neutral-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <span>ดูหน้าร้านค้า</span>
              </Link>

              {user && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileSidebarOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4 text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span>ออกจากระบบ</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Slide-over Cart Drawer (Only mounted for storefront) */}
      {!isAdminPath && (
        <CartDrawer isOpen={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />
      )}
    </>
  );
}
