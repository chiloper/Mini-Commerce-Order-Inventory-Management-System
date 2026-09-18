"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminSidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "ภาพรวม", short: "ภาพรวม", iconRadius: "50%" },
    { href: "/order", label: "คำสั่งซื้อ", short: "คำสั่งซื้อ", iconRadius: "2px" },
    { href: "/inventory", label: "สินค้า & สต็อก", short: "สต็อก", iconRadius: "2px" },
    { href: "/promotion", label: "โปรโมชั่น", short: "โปรโมชั่น", iconRadius: "50% 2px" },
  ];

  return (
    <aside
      style={{
        width: "236px",
        flex: "none",
        background: "var(--color-surface)",
        padding: "var(--space-4) var(--space-3)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-4)",
        borderRight: "1px solid var(--color-divider)",
        borderRadius: "var(--radius-md) 0 0 var(--radius-md)",
      }}
    >
      <div>
        <p style={{ margin: 0, fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: "18px" }}>
          Mini Commerce
        </p>
        <p
          style={{
            margin: "2px 0 0",
            fontSize: "11px",
            letterSpacing: ".12em",
            textTransform: "uppercase",
            color: "var(--color-neutral-700)",
          }}
        >
          admin console
        </p>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        {navItems.map((n) => {
          const active = pathname.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              style={{
                fontFamily: "inherit",
                textAlign: "left",
                fontSize: "14px",
                padding: "10px 12px",
                borderLeft: active ? "2px solid var(--color-accent)" : "2px solid transparent",
                background: active ? "var(--color-accent-100)" : "transparent",
                color: active ? "var(--color-accent-800)" : "var(--color-text)",
                fontWeight: active ? 600 : 400,
                textDecoration: "none",
                display: "block",
              }}
            >
              {n.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
        <span
          style={{
            fontSize: "11px",
            letterSpacing: ".1em",
            textTransform: "uppercase",
            color: "var(--color-neutral-700)",
          }}
        >
          สถานะระบบ
        </span>
        <span style={{ fontSize: "13px" }}>ระบบสต็อก: ปกติ</span>
        <span style={{ fontSize: "12px", color: "var(--color-neutral-700)" }}>สถานะระบบ: ออนไลน์</span>
      </div>
    </aside>
  );
}
