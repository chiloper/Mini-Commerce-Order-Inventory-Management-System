"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getProductById,
  getProducts,
  addToCart,
} from "../../../lib/ecommerce-actions";

function ProductDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");
  const skuParam = searchParams.get("sku");

  const [product, setProduct] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setSelectedImage(null);
      if (idParam) {
        const p = await getProductById(Number(idParam));
        setProduct(p);
      } else {
        const all = await getProducts();
        if (skuParam) {
          const match = all.find((x) => x.sku === skuParam);
          setProduct(match || all[0]);
        } else {
          setProduct(all[0]);
        }
      }
      setLoading(false);
    }
    load();
  }, [idParam, skuParam]);

  const formatPrice = (n: number) => `฿${(n || 0).toLocaleString("th-TH")}`;

  if (loading) {
    return (
      <div style={{ padding: "80px 0", textAlign: "center", color: "var(--color-neutral-600)" }}>
        กำลังโหลดรายละเอียดสินค้าจาก TiDB Cloud...
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ padding: "80px 0", textAlign: "center" }}>
        <p style={{ fontSize: "18px", color: "var(--color-neutral-700)" }}>ไม่พบสินค้านี้</p>
        <Link href="/list" className="btn btn-primary" style={{ marginTop: "var(--space-4)" }}>
          กลับไปหน้ารายการสินค้า
        </Link>
      </div>
    );
  }

  const lowStockThreshold = 10;
  const avail = Math.max(0, (product.stock || 0) - (product.held || 0));
  let statusLabel = "พร้อมส่ง";
  let statusCls = "tag tag-accent";
  let barColor = "var(--color-accent)";

  if (product.stock === 0) {
    statusLabel = "หมดชั่วคราว";
    statusCls = "tag tag-neutral";
    barColor = "var(--color-neutral-500)";
  } else if (avail <= lowStockThreshold) {
    statusLabel = "ใกล้หมด";
    statusCls = "tag tag-accent-2";
    barColor = "var(--color-accent-2-500)";
  }

  const barW = Math.min(100, Math.round(((product.stock || 0) / 50) * 100)) + "%";
  const stockText = product.stock === 0 ? "รอเข้าคลัง" : `เหลือ ${product.stock} ชิ้น`;
  const heldText = product.held > 0 ? `กำลังชำระเงินอยู่ ${product.held} ชิ้น` : "ไม่มีรายการค้างชำระ";
  const soldOut = product.stock === 0;
  const addLabel = soldOut ? "แจ้งเตือนเมื่อมีของ" : "ใส่ตะกร้า";

  const imagesList: string[] =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : product.imageUrl
      ? [product.imageUrl]
      : [];
  const activeImage = selectedImage || imagesList[0] || null;

  const handleAdd = async () => {
    if (soldOut) return;
    setAdding(true);
    await addToCart(product.id, qty);
    window.dispatchEvent(new Event("cart-updated"));
    window.dispatchEvent(new Event("open-cart"));
    setAdding(false);
  };

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "var(--space-6) var(--space-6) var(--space-8)" }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: "var(--space-4)", fontSize: "13px", color: "var(--color-neutral-700)" }}>
        <Link href="/list" style={{ color: "var(--color-accent-700)" }}>
          ← กลับหน้ารายการสินค้า
        </Link>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: "var(--space-8)",
          alignItems: "start",
        }}
      >
        {/* Left column: Main Product Shot and Interactive Thumbnails */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <div
            className="halftone"
            style={{
              aspectRatio: "4/3",
              background:
                "repeating-linear-gradient(135deg, var(--color-neutral-200) 0 8px, var(--color-neutral-300) 8px 16px)",
              display: "grid",
              placeItems: "center",
              borderRadius: "var(--radius-sm)",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {activeImage ? (
              <img
                src={activeImage}
                alt={product.name}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transition: "opacity 0.2s ease",
                }}
              />
            ) : (
              <span
                style={{
                  fontSize: "11px",
                  letterSpacing: ".16em",
                  textTransform: "uppercase",
                  color: "var(--color-neutral-700)",
                }}
              >
                product shot · 1600×1200
              </span>
            )}
          </div>

          {/* Interactive Thumbnails */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${Math.min(Math.max(4, imagesList.length), 6)}, 1fr)`,
              gap: "var(--space-2)",
            }}
          >
            {Array.from({ length: Math.max(4, imagesList.length) }).map((_, idx) => {
              const imgUrl = imagesList[idx];
              const isSelected = imgUrl ? activeImage === imgUrl : false;
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={!imgUrl}
                  onClick={() => imgUrl && setSelectedImage(imgUrl)}
                  style={{
                    all: "unset",
                    cursor: imgUrl ? "pointer" : "default",
                    aspectRatio: "1",
                    background:
                      "repeating-linear-gradient(135deg, var(--color-neutral-200) 0 5px, var(--color-neutral-300) 5px 10px)",
                    borderRadius: "var(--radius-sm)",
                    border: isSelected ? "2px solid var(--color-accent)" : "1px solid var(--color-divider)",
                    overflow: "hidden",
                    position: "relative",
                    display: "block",
                    boxShadow: isSelected ? "0 0 0 1px var(--color-accent)" : "none",
                  }}
                  title={imgUrl ? `ดูภาพที่ ${idx + 1}` : undefined}
                >
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={`Thumbnail ${idx + 1}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "grid",
                        placeItems: "center",
                        fontSize: "9px",
                        color: "var(--color-neutral-500)",
                        letterSpacing: "0.1em",
                      }}
                    >
                      · {idx + 1} ·
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right column: Details, Stock Box, Stepper & Button */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <p
            style={{
              margin: 0,
              fontSize: "11px",
              letterSpacing: ".12em",
              textTransform: "uppercase",
              color: "var(--color-accent-700)",
              fontWeight: 600,
            }}
          >
            {product.sku} · {product.category?.name || "หมวดหมู่สินค้า"}
          </p>

          <h2 style={{ margin: 0, fontSize: "34px", lineHeight: 1.1 }}>{product.name}</h2>
          <p style={{ margin: 0, fontSize: "26px", fontWeight: 600 }}>{formatPrice(product.price)}</p>

          {/* Real-time Stock Box */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-2)",
              padding: "var(--space-3)",
              background: "var(--color-surface)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <span className={statusCls}>{statusLabel}</span>
              <span style={{ fontSize: "14px" }}>{stockText}</span>
            </div>

            <div style={{ height: "6px", background: "var(--color-neutral-300)", overflow: "hidden" }}>
              <div style={{ height: "6px", width: barW, background: barColor }} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--color-neutral-700)" }}>
              <span>ขายได้ {avail} ชิ้น</span>
              <span>{heldText}</span>
            </div>
          </div>

          <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.6, color: "var(--color-neutral-800)" }}>
            {product.description ||
              "สินค้าจริงจะดึงรายละเอียดจากฐานข้อมูล พร้อมจำนวนคงเหลือที่หักรายการที่ถูกจองระหว่างชำระเงินออกแล้ว จำนวนนี้อัปเดตทุกครั้งที่มีการสั่งซื้อสำเร็จ"}
          </p>

          {/* Stepper + Add to Cart */}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginTop: "var(--space-2)" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                border: "1px solid var(--color-divider)",
                borderRadius: "var(--radius-md)",
                background: "var(--color-surface)",
              }}
            >
              <button
                className="btn btn-ghost"
                onClick={() => setQty(Math.max(1, qty - 1))}
                style={{ width: "40px", height: "40px", padding: 0, fontSize: "18px" }}
              >
                −
              </button>
              <span style={{ minWidth: "36px", textAlign: "center", fontSize: "15px", fontWeight: 600 }}>
                {qty}
              </span>
              <button
                className="btn btn-ghost"
                onClick={() => setQty(qty + 1)}
                disabled={qty >= avail}
                style={{ width: "40px", height: "40px", padding: 0, fontSize: "18px" }}
              >
                +
              </button>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleAdd}
              disabled={soldOut || adding}
              style={{ flex: 1, height: "44px", fontSize: "15px" }}
            >
              {adding ? "กำลังใส่ตะกร้า..." : addLabel}
            </button>
          </div>

          <p style={{ margin: "var(--space-2) 0 0", fontSize: "12px", color: "var(--color-neutral-700)", lineHeight: 1.6 }}>
            สต็อกจะถูกจองไว้ 10 นาทีเมื่อกดชำระเงิน หากมีคนชำระสำเร็จก่อน ระบบจะแจ้งเตือนและปรับจำนวนในตะกร้าให้อัตโนมัติ
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  return (
    <Suspense fallback={<div style={{ padding: "60px", textAlign: "center" }}>กำลังโหลด...</div>}>
      <ProductDetailContent />
    </Suspense>
  );
}