"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  addToCart,
  getProducts,
} from "../../../lib/ecommerce-actions";

export default function ProductListPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [addingSku, setAddingSku] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const prods = await getProducts();
    setProducts((prods || []).filter((p: any) => p.isActive !== false));
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatPrice = (n: number) => `฿${(n || 0).toLocaleString("th-TH")}`;

  const decorateProduct = (it: any) => {
    const lowStockThreshold = 10;
    const avail = Math.max(0, (it.stock || 0) - (it.held || 0));
    let statusLabel = "พร้อมส่ง";
    let statusCls = "tag tag-accent";
    let barColor = "var(--color-accent)";

    if (it.stock === 0) {
      statusLabel = "หมดชั่วคราว";
      statusCls = "tag tag-neutral";
      barColor = "var(--color-neutral-500)";
    } else if (avail <= lowStockThreshold) {
      statusLabel = "ใกล้หมด";
      statusCls = "tag tag-accent-2";
      barColor = "var(--color-accent-2-500)";
    }

    const barW = Math.min(100, Math.round(((it.stock || 0) / 50) * 100)) + "%";
    const stockText = it.stock === 0 ? "รอเข้าคลัง" : `เหลือ ${it.stock} ชิ้น`;
    const heldText = `กำลังชำระเงินอยู่ ${it.held} ชิ้น`;
    const soldOut = it.stock === 0;
    const addLabel = soldOut ? "แจ้งเตือนเมื่อมีของ" : "ใส่ตะกร้า";

    return {
      ...it,
      avail,
      statusLabel,
      statusCls,
      barColor,
      barW,
      stockText,
      heldText,
      hasHeld: (it.held || 0) > 0,
      soldOut,
      addLabel,
    };
  };

  const decoratedList = products.map(decorateProduct);

  const countTotal = decoratedList.length;
  const countAvailable = decoratedList.filter((p) => !p.soldOut && p.avail > 10).length;
  const countLow = decoratedList.filter((p) => !p.soldOut && p.avail <= 10).length;
  const countOut = decoratedList.filter((p) => p.soldOut).length;

  const filteredProducts = decoratedList.filter((p) => {
    const matchSearch =
      search.trim() === "" ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;

    if (statusFilter === "available") return !p.soldOut && p.avail > 10;
    if (statusFilter === "low") return !p.soldOut && p.avail <= 10;
    if (statusFilter === "out") return p.soldOut;
    return true;
  });

  const handleAdd = async (product: any) => {
    if (product.soldOut) return;
    setAddingSku(product.sku);
    await addToCart(product.id, 1);
    window.dispatchEvent(new Event("cart-updated"));
    window.dispatchEvent(new Event("open-cart"));
    setAddingSku(null);
  };

  return (
    <div style={{ padding: "var(--space-6) var(--space-6) var(--space-8)", maxWidth: "1280px", margin: "0 auto" }}>
      {/* Search and Filters toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "var(--space-3)",
          marginBottom: "var(--space-4)",
        }}
      >
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
            width: "360px",
            maxWidth: "100%",
            background: "var(--color-surface)",
            border: "1px solid var(--color-divider)",
            borderRadius: "var(--radius-md)",
            padding: "0 var(--space-2)",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            style={{ opacity: 0.55, flex: "none" }}
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="16.5" y1="16.5" x2="21" y2="21" />
          </svg>
          <input
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อสินค้า หรือรหัส SKU..."
            style={{ border: 0, background: "transparent", minHeight: "36px" }}
          />
        </label>
        <span style={{ fontSize: "12px", color: "var(--color-neutral-700)" }}>
          พบสินค้าทั้งหมด {filteredProducts.length} รายการ
        </span>
      </div>

      {/* Main Section Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "var(--space-4)",
          marginBottom: "var(--space-6)",
          paddingTop: "var(--space-2)",
        }}
      >
        <div>
          <p
            style={{
              margin: "0 0 6px",
              fontSize: "11px",
              letterSpacing: ".12em",
              textTransform: "uppercase",
              color: "var(--color-accent-700)",
              fontWeight: 600,
            }}
          >
            คลังสินค้า · ตัดสต็อกเรียลไทม์
          </p>
          <h2 style={{ margin: 0, fontSize: "32px", lineHeight: 1.1 }}>สินค้าทั้งหมด</h2>
        </div>

        {/* Filter chips */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
          <button
            onClick={() => setStatusFilter("all")}
            style={{
              fontFamily: "inherit",
              fontSize: "12px",
              padding: "5px 11px",
              border: "1px solid var(--color-divider)",
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
              background: statusFilter === "all" ? "var(--color-accent-100)" : "transparent",
              color: statusFilter === "all" ? "var(--color-accent-800)" : "var(--color-neutral-800)",
              fontWeight: statusFilter === "all" ? 600 : 400,
            }}
          >
            ทั้งหมด {countTotal}
          </button>
          <button
            onClick={() => setStatusFilter("available")}
            style={{
              fontFamily: "inherit",
              fontSize: "12px",
              padding: "5px 11px",
              border: "1px solid var(--color-divider)",
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
              background: statusFilter === "available" ? "var(--color-accent-100)" : "transparent",
              color: statusFilter === "available" ? "var(--color-accent-800)" : "var(--color-neutral-800)",
              fontWeight: statusFilter === "available" ? 600 : 400,
            }}
          >
            พร้อมส่ง {countAvailable}
          </button>
          <button
            onClick={() => setStatusFilter("low")}
            style={{
              fontFamily: "inherit",
              fontSize: "12px",
              padding: "5px 11px",
              border: "1px solid var(--color-divider)",
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
              background: statusFilter === "low" ? "var(--color-accent-2-100)" : "transparent",
              color: statusFilter === "low" ? "var(--color-accent-2-800)" : "var(--color-neutral-800)",
              fontWeight: statusFilter === "low" ? 600 : 400,
            }}
          >
            ใกล้หมด {countLow}
          </button>
          <button
            onClick={() => setStatusFilter("out")}
            style={{
              fontFamily: "inherit",
              fontSize: "12px",
              padding: "5px 11px",
              border: "1px solid var(--color-divider)",
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
              background: statusFilter === "out" ? "var(--color-neutral-300)" : "transparent",
              color: statusFilter === "out" ? "var(--color-neutral-900)" : "var(--color-neutral-800)",
              fontWeight: statusFilter === "out" ? 600 : 400,
            }}
          >
            หมดชั่วคราว {countOut}
          </button>
        </div>
      </div>

      {/* Product Cards Grid */}
      {loading ? (
        <div style={{ padding: "60px 0", textAlign: "center", color: "var(--color-neutral-600)" }}>
          กำลังโหลดข้อมูลสินค้าจาก TiDB Cloud...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div style={{ padding: "60px 0", textAlign: "center", color: "var(--color-neutral-600)" }}>
          ไม่พบสินค้าตามเงื่อนไขที่ค้นหา
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))",
            gap: "var(--space-4)",
          }}
        >
          {filteredProducts.map((p) => (
            <article
              key={p.sku || p.id}
              className="card elev-sm"
              style={{
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
            >
              {/* Product Halftone Shot / Image */}
              <Link
                href={`/product?id=${p.id}`}
                style={{ all: "unset", cursor: "pointer", display: "block" }}
              >
                <div
                  className="halftone"
                  style={{
                    aspectRatio: "4/3",
                    background:
                      "repeating-linear-gradient(135deg, var(--color-neutral-200) 0 6px, var(--color-neutral-300) 6px 12px)",
                    display: "grid",
                    placeItems: "center",
                    borderRadius: "var(--radius-sm)",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
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
                        fontSize: "10px",
                        letterSpacing: ".14em",
                        textTransform: "uppercase",
                        color: "var(--color-neutral-700)",
                      }}
                    >
                      product shot · {p.sku}
                    </span>
                  )}
                </div>
              </Link>

              {/* Title and Price */}
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: "var(--space-2)",
                }}
              >
                <Link
                  href={`/product?id=${p.id}`}
                  style={{ color: "inherit", textDecoration: "none" }}
                >
                  <h3 className="card-title" style={{ fontSize: "16px" }}>
                    {p.name}
                  </h3>
                </Link>
                <span style={{ fontSize: "15px", whiteSpace: "nowrap", fontWeight: 600 }}>
                  {formatPrice(p.price)}
                </span>
              </div>

              {/* Stock Status Box */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "var(--space-2)",
                  }}
                >
                  <span className={p.statusCls}>{p.statusLabel}</span>
                  <span style={{ fontSize: "12px", color: "var(--color-neutral-700)" }}>
                    {p.stockText}
                  </span>
                </div>

                {/* Progress Bar */}
                <div style={{ height: "3px", background: "var(--color-neutral-300)", overflow: "hidden" }}>
                  <div style={{ height: "3px", width: p.barW, background: p.barColor }} />
                </div>

                {p.hasHeld && (
                  <span style={{ fontSize: "11px", color: "var(--color-accent-2-700)" }}>
                    {p.heldText}
                  </span>
                )}
              </div>

              {/* Action Button */}
              <button
                className="btn btn-secondary btn-block"
                onClick={() => handleAdd(p)}
                disabled={p.soldOut || addingSku === p.sku}
                style={{ minHeight: "38px" }}
              >
                {addingSku === p.sku ? "กำลังใส่ตะกร้า..." : p.addLabel}
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}