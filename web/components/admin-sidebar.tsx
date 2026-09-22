"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminSidebar() {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/dashboard",
      label: "ภาพรวม",
      icon: (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      ),
    },
    {
      href: "/order",
      label: "คำสั่งซื้อ",
      icon: (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      ),
    },
    {
      href: "/inventory",
      label: "สินค้า & สต็อก",
      icon: (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      ),
    },
    {
      href: "/category",
      label: "หมวดหมู่สินค้า",
      icon: (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
    },
    {
      href: "/promotion",
      label: "โปรโมชั่น",
      icon: (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
      ),
    },
  ];

  return (
    <aside className="w-full md:w-56 lg:w-60 shrink-0 bg-surface border-b md:border-b-0 md:border-r border-divider p-3.5 sm:p-4 flex flex-col gap-4">
      {/* Brand Title (Desktop only) */}
      <div className="hidden md:block pb-2 border-b border-divider">
        <p className="m-0 font-serif font-bold text-base text-text">
          Mini Commerce
        </p>
        <p className="m-0 text-[10px] font-mono tracking-widest uppercase font-bold text-accent-2">
          Admin Console
        </p>
      </div>

      {/* Navigation links (Horizontal on mobile, vertical on desktop) */}
      <nav className="flex flex-row md:flex-col gap-1.5 overflow-x-auto -mx-1 px-1 md:mx-0 md:px-0">
        {navItems.map((n) => {
          const active = pathname.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                active
                  ? "bg-accent-100 text-accent-900 border-l-2 border-accent shadow-2xs font-bold"
                  : "text-neutral-800 hover:text-text hover:bg-bg border-l-2 border-transparent"
              }`}
            >
              <span className={active ? "text-accent-800" : "text-neutral-700"}>
                {n.icon}
              </span>
              <span>{n.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* System Status Card (Desktop only) */}
      <div className="hidden md:flex flex-col gap-2 p-3 rounded-xl bg-bg border border-divider mt-auto shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono tracking-wider uppercase font-bold text-neutral-700">
            System Health
          </span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
        </div>
        <div className="flex flex-col gap-1 text-xs text-neutral-800 font-medium">
          <div className="flex justify-between items-center">
            <span>คลังสินค้า:</span>
            <span className="font-bold text-emerald-800">ปกติ (Real-time)</span>
          </div>
          <div className="flex justify-between items-center">
            <span>เซิร์ฟเวอร์:</span>
            <span className="font-bold text-text">ออนไลน์</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
