"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getProducts,
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  validatePromotion,
  checkoutAction,
  getDashboardStats,
  getOrders,
  getPromotions,
  updateProductAction,
} from "../../lib/ecommerce-actions";
import type { Product, Cart, CartItem, Order, Promotion, MetricCard } from "@/types/ecommerce";

export default function PreviewDualFramePage() {
  const [surface, setSurface] = useState<"store" | "admin">("store");
  const [storePage, setStorePage] = useState<"list" | "detail" | "checkout">("list");
  const [adminPage, setAdminPage] = useState<"dashboard" | "orders" | "products" | "promos">("dashboard");
  const [device, setDevice] = useState<"both" | "pc" | "mobile">("both");

  // Live data from TiDB Cloud
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Cart>({ items: [], totalQuantity: 0, subtotal: 0 });
  const [orders, setOrders] = useState<Order[]>([]);
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [stats, setStats] = useState<MetricCard[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [detailSku, setDetailSku] = useState<string>("SKU-2041");
  const [qty, setQty] = useState(1);

  // Promo code
  const [code, setCode] = useState("");
  const [promoMsg, setPromoMsg] = useState("");
  const [promoOk, setPromoOk] = useState(true);
  const [discount, setDiscount] = useState(0);

  const loadAll = async () => {
    const [prods, c, ords, pms, st] = await Promise.all([
      getProducts(),
      getCart(),
      getOrders(),
      getPromotions(),
      getDashboardStats(),
    ]);
    setProducts(prods);
    setCart(c);
    setOrders(ords);
    setPromos(pms);
    if (st?.stats) setStats(st.stats);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const formatPrice = (n?: number) => `฿${(n || 0).toLocaleString("th-TH")}`;

  const decorate = (it: Partial<Product> & { held?: number }) => {
    const stock = it.stock || 0;
    const held = it.held || 0;
    const avail = Math.max(0, stock - held);
    let statusLabel = "พร้อมส่ง";
    let statusCls = "tag tag-accent";
    let barColor = "var(--color-accent)";

    if (stock === 0) {
      statusLabel = "หมดชั่วคราว";
      statusCls = "tag tag-neutral";
      barColor = "var(--color-neutral-500)";
    } else if (avail <= 10) {
      statusLabel = "ใกล้หมด";
      statusCls = "tag tag-accent-2";
      barColor = "var(--color-accent-2-500)";
    }

    const barW = Math.min(100, Math.round((stock / 50) * 100)) + "%";
    const isLow = stock > 0 && avail <= 10;

    return {
      ...it,
      avail,
      statusLabel,
      statusCls,
      barColor,
      barW,
      stockText: stock === 0 ? "รอเข้าคลัง" : `เหลือ ${stock} ชิ้น`,
      stockShort: stock === 0 ? "รอเข้าคลัง" : `เหลือ ${stock}`,
      stockNum: stock,
      availNum: avail,
      heldNum: held,
      hasHeld: held > 0,
      heldText: `กำลังชำระเงินอยู่ ${held} ชิ้น`,
      heldColor: held > 0 ? "var(--color-accent-2-700)" : "var(--color-neutral-600)",
      soldOut: stock === 0,
      addLabel: stock === 0 ? "แจ้งเตือนเมื่อมีของ" : "ใส่ตะกร้า",
      rowBg: isLow ? "var(--color-accent-2-100)" : "transparent",
      rowCardBg: isLow ? "var(--color-accent-2-100)" : "var(--color-surface)",
      onAdd: async () => {
        if (it.id) {
          await addToCart(it.id, 1);
          const updated = await getCart();
          setCart(updated);
          setCartOpen(true);
        }
      },
      onOpen: () => {
        if (it.sku) {
          setDetailSku(it.sku);
          setStorePage("detail");
          setQty(1);
        }
      },
    };
  };

  const decoratedProducts = products.map((p) => decorate(p));
  const bySku: Record<string, ReturnType<typeof decorate>> = {};
  decoratedProducts.forEach((p) => {
    if (p.sku) bySku[p.sku] = p;
  });

  const cartLines = (cart.items || []).map((it: CartItem) => {
    const p =
      (it.sku && bySku[it.sku]) ||
      (it.product?.sku && bySku[it.product.sku]) ||
      decorate(it.product || ({ name: it.productName, price: it.price, stock: it.stock, sku: it.sku, id: it.productId } as any));
    const avail = p.availNum || p.avail || it.stock || 0;
    const over = it.quantity > avail;
    return {
      ...p,
      itemId: it.id,
      qty: it.quantity,
      lineText: formatPrice((it.price ?? it.product?.price ?? 0) * it.quantity),
      warn: over,
      warnText: `ขายได้เพียง ${avail} ชิ้น — ระบบจะปรับจำนวนให้เมื่อกดชำระเงิน`,
      onInc: async () => {
        await updateCartItem(it.id, it.quantity + 1);
        const updated = await getCart();
        setCart(updated);
      },
      onDec: async () => {
        if (it.quantity <= 1) await removeCartItem(it.id);
        else await updateCartItem(it.id, it.quantity - 1);
        const updated = await getCart();
        setCart(updated);
      },
    };
  });

  const cartCount = cart.totalQuantity || 0;
  const subtotal = cart.subtotal || 0;
  const ship = cartCount === 0 ? 0 : code.toUpperCase() === "FREESHIP" || subtotal - discount >= 1500 ? 0 : 50;
  const total = Math.max(0, subtotal - discount + ship);

  const applyPromo = async () => {
    const c = code.trim().toUpperCase();
    if (!c) {
      setPromoMsg("กรุณากรอกโค้ดโปรโมชั่น");
      setPromoOk(false);
      setDiscount(0);
      return;
    }
    const res = await validatePromotion(c, subtotal);
    if (res.ok && res.data && res.data.valid !== false) {
      setPromoOk(true);
      setDiscount(res.data.discountAmount ?? res.data.discount ?? 0);
      setPromoMsg(`ใช้โค้ด ${c} แล้ว — ${res.data.description || "รับส่วนลดพิเศษ"}`);
    } else {
      setPromoOk(false);
      setDiscount(0);
      setPromoMsg(res.data?.message || res.error || `โค้ด "${c}" ใช้ไม่ได้หรือหมดโควตาแล้ว`);
    }
  };

  const handleCheckoutSubmit = async () => {
    if (cartLines.length === 0) return;
    const key = `prev-${Date.now()}`;
    const res = await checkoutAction({
      idempotencyKey: key,
      paymentMethod: "พร้อมเพย์ / QR",
      customerName: "ณัฐพงษ์ วัฒนกุล",
      phone: "081-234-5678",
      shippingAddress: "88/12 ซอยสุขุมวิท 31 กรุงเทพฯ",
      promotionCode: promoOk && code ? code.trim().toUpperCase() : undefined,
    });
    if (res.ok) {
      alert(`ชำระเงินสำเร็จ! บันทึกคำสั่งซื้อ #${res.data?.id} เรียบร้อยแล้ว`);
      await loadAll();
      setStorePage("list");
      setCartOpen(false);
    } else {
      alert(res.error || "เกิดข้อผิดพลาดในการตัดสต็อก");
    }
  };

  const tabDefs =
    surface === "store"
      ? [
          ["list", "รายการสินค้า"],
          ["detail", "รายละเอียดสินค้า"],
          ["checkout", "สรุปยอด / ชำระเงิน"],
        ]
      : [
          ["dashboard", "ภาพรวม"],
          ["orders", "คำสั่งซื้อ"],
          ["products", "สินค้า & สต็อก"],
          ["promos", "โปรโมชั่น"],
        ];

  const adminNav = [
    { key: "dashboard", label: "ภาพรวม", short: "ภาพรวม" },
    { key: "orders", label: "คำสั่งซื้อ", short: "คำสั่งซื้อ" },
    { key: "products", label: "สินค้า & สต็อก", short: "สต็อก" },
    { key: "promos", label: "โปรโมชั่น", short: "โปรโมชั่น" },
  ];

  const stockLog = [
    { time: "09:24", text: "ตัดสต็อก #10428 · เมาส์ Glide Pro", delta: "−2", color: "var(--color-accent-2-700)" },
    { time: "09:18", text: "จองสต็อก #10427 · ลำโพงพกพา Pebble", delta: "จอง 2", color: "var(--color-neutral-700)" },
    { time: "09:06", text: "คืนสต็อกจากการยกเลิก #10419", delta: "+1", color: "var(--color-accent-700)" },
    { time: "08:52", text: "รับเข้าคลัง · ขาตั้งโน้ตบุ๊ก Rise", delta: "+20", color: "var(--color-accent-700)" },
    { time: "08:44", text: "คำขอซื้อชนกัน 3 รายการ · จ่ายสำเร็จ 1", delta: "−1", color: "var(--color-accent-2-700)" },
  ];

  const d = bySku[detailSku] || decoratedProducts[0] || {};
  const currentTab = surface === "store" ? storePage : adminPage;

  return (
    <div style={{ padding: "0 32px 80px", display: "flex", flexDirection: "column", gap: "var(--space-6)", maxWidth: "1340px", margin: "0 auto" }}>
      {/* Viewport Device Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", padding: "var(--space-2) 0" }}>
        <span style={{ fontSize: "13px", fontWeight: 600 }}>เลือกมุมมองอุปกรณ์:</span>
        <div className="seg">
          <button className={`seg-opt ${device === "both" ? "active" : ""}`} onClick={() => setDevice("both")}>
            ทั้งสองจอ (PC + Mobile)
          </button>
          <button className={`seg-opt ${device === "pc" ? "active" : ""}`} onClick={() => setDevice("pc")}>
            เฉพาะ PC (1280×840)
          </button>
          <button className={`seg-opt ${device === "mobile" ? "active" : ""}`} onClick={() => setDevice("mobile")}>
            เฉพาะ Mobile (390×800)
          </button>
        </div>
      </div>

      {/* Surface & Sub-tab Bar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "var(--space-3)",
          padding: "var(--space-3) 0",
          borderTop: "1px solid var(--color-divider)",
          borderBottom: "1px solid var(--color-divider)",
        }}
      >
        <div className="seg">
          <button
            className={`seg-opt ${surface === "store" ? "active" : ""}`}
            onClick={() => setSurface("store")}
          >
            Storefront
          </button>
          <button
            className={`seg-opt ${surface === "admin" ? "active" : ""}`}
            onClick={() => setSurface("admin")}
          >
            Admin Dashboard
          </button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-1)" }}>
          {tabDefs.map(([key, label]) => (
            <button
              key={key}
              onClick={() =>
                surface === "store"
                  ? setStorePage(key as "list" | "detail" | "checkout")
                  : setAdminPage(key as "dashboard" | "orders" | "products" | "promos")
              }
              style={{
                fontFamily: "inherit",
                fontSize: "13px",
                padding: "7px 12px",
                cursor: "pointer",
                border: "1px solid var(--color-divider)",
                borderRadius: "var(--radius-md)",
                background: currentTab === key ? "var(--color-accent)" : "transparent",
                color: currentTab === key ? "#ffffff" : "var(--color-text)",
                fontWeight: currentTab === key ? 600 : 400,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <span style={{ marginLeft: "auto", fontSize: "12px", color: "var(--color-neutral-700)" }}>
          เชื่อมต่อระบบฐานข้อมูลจริง · ในตะกร้า {cartCount} ชิ้น
        </span>
      </div>

      {/* PC Frame (1280 x 840) */}
      {(device === "both" || device === "pc") && (
        <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-3)" }}>
            <h2 style={{ margin: 0, fontSize: "20px" }}>PC</h2>
            <span style={{ fontSize: "11px", letterSpacing: ".12em", textTransform: "uppercase", color: "var(--color-neutral-700)" }}>
              1280 × 840 · desktop breakpoint
            </span>
          </div>

          <div
            style={{
              position: "relative",
              width: "1280px",
              height: "840px",
              overflow: "hidden",
              background: "var(--color-bg)",
              boxShadow: "var(--shadow-md)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-divider)",
            }}
          >
            <div style={{ position: "absolute", inset: 0, overflow: "auto" }}>
              {surface === "store" ? (
                <>
                  {/* Store Header */}
                  <header
                    className="nav"
                    style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 3,
                      background: "var(--color-bg)",
                      padding: "var(--space-3) var(--space-6)",
                      gap: "var(--space-4)",
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    <span className="nav-brand" style={{ marginRight: "var(--space-6)" }}>Mini Commerce</span>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-2)",
                        width: "380px",
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-divider)",
                        borderRadius: "var(--radius-md)",
                        padding: "0 var(--space-2)",
                        marginRight: "auto",
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ opacity: 0.55, flex: "none" }}>
                        <circle cx="11" cy="11" r="7" />
                        <line x1="16.5" y1="16.5" x2="21" y2="21" />
                      </svg>
                      <input className="input" placeholder="ค้นหาสินค้า หรือรหัส SKU" style={{ border: 0, background: "transparent" }} />
                    </label>
                    <button onClick={() => setStorePage("list")} style={{ background: "transparent", border: 0, cursor: "pointer", color: storePage === "list" ? "var(--color-accent)" : "inherit" }}>
                      สินค้าทั้งหมด
                    </button>
                    <button onClick={() => { setSurface("admin"); setAdminPage("promos"); }} style={{ background: "transparent", border: 0, cursor: "pointer" }}>
                      โปรโมชั่น
                    </button>
                    <button onClick={() => { setSurface("admin"); setAdminPage("orders"); }} style={{ background: "transparent", border: 0, cursor: "pointer" }}>
                      ติดตามคำสั่งซื้อ
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => setCartOpen(true)}
                      style={{ marginLeft: "var(--space-3)" }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path d="M3 4h2.5l2.2 10.5h9.6L19 7H6" />
                        <circle cx="9" cy="19" r="1.4" />
                        <circle cx="17" cy="19" r="1.4" />
                      </svg>
                      ตะกร้า · {cartCount}
                    </button>
                  </header>

                  {/* Store View: List */}
                  {storePage === "list" && (
                    <div style={{ padding: "var(--space-6) var(--space-6) var(--space-8)" }}>
                      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
                        <div>
                          <p style={{ margin: "0 0 6px", fontSize: "11px", letterSpacing: ".12em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>
                            คลังสินค้า · ตัดสต็อกเรียลไทม์
                          </p>
                          <h2 style={{ margin: 0, fontSize: "32px", lineHeight: 1.1 }}>สินค้าทั้งหมด</h2>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                          <span style={{ fontSize: "12px", padding: "5px 11px", border: "1px solid var(--color-divider)", borderRadius: "var(--radius-md)", background: "var(--color-accent-100)", color: "var(--color-accent-800)" }}>
                            ทั้งหมด {decoratedProducts.length}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--space-4)" }}>
                        {decoratedProducts.map((p) => (
                          <article key={p.sku} className="card elev-sm">
                            <button onClick={p.onOpen} style={{ all: "unset", cursor: "pointer", display: "block" }}>
                              <div
                                className="halftone"
                                style={{
                                  aspectRatio: "4/3",
                                  background: "repeating-linear-gradient(135deg,var(--color-neutral-200) 0 6px,var(--color-neutral-300) 6px 12px)",
                                  display: "grid",
                                  placeItems: "center",
                                  borderRadius: "var(--radius-sm)",
                                }}
                              >
                                <span style={{ fontSize: "10px", letterSpacing: ".14em", textTransform: "uppercase", color: "var(--color-neutral-700)" }}>
                                  product shot
                                </span>
                              </div>
                            </button>
                            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "var(--space-2)" }}>
                              <h3 className="card-title" style={{ fontSize: "16px" }}>{p.name}</h3>
                              <span style={{ fontSize: "15px", whiteSpace: "nowrap" }}>{formatPrice(p.price)}</span>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-2)" }}>
                                <span className={p.statusCls}>{p.statusLabel}</span>
                                <span style={{ fontSize: "12px", color: "var(--color-neutral-700)" }}>{p.stockText}</span>
                              </div>
                              <div style={{ height: "3px", background: "var(--color-neutral-300)", overflow: "hidden" }}>
                                <div style={{ height: "3px", width: p.barW, background: p.barColor }} />
                              </div>
                              {p.hasHeld && (
                                <span style={{ fontSize: "11px", color: "var(--color-accent-2-700)" }}>{p.heldText}</span>
                              )}
                            </div>
                            <button className="btn btn-secondary btn-block" onClick={p.onAdd} disabled={p.soldOut}>
                              {p.addLabel}
                            </button>
                          </article>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Store View: Detail */}
                  {storePage === "detail" && (
                    <div style={{ padding: "var(--space-6) var(--space-6) var(--space-8)", display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "var(--space-8)" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                        <div
                          className="halftone"
                          style={{
                            aspectRatio: "4/3",
                            background: "repeating-linear-gradient(135deg,var(--color-neutral-200) 0 8px,var(--color-neutral-300) 8px 16px)",
                            display: "grid",
                            placeItems: "center",
                          }}
                        >
                          <span style={{ fontSize: "11px", letterSpacing: ".16em", textTransform: "uppercase", color: "var(--color-neutral-700)" }}>
                            product shot · 1600×1200
                          </span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--space-2)" }}>
                          {[1, 2, 3, 4].map((i) => (
                            <div key={i} style={{ aspectRatio: "1", background: "repeating-linear-gradient(135deg,var(--color-neutral-200) 0 5px,var(--color-neutral-300) 5px 10px)" }} />
                          ))}
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                        <p style={{ margin: 0, fontSize: "11px", letterSpacing: ".12em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>
                          {d.sku} · {d.category?.name || d.catagory?.name || "อุปกรณ์"}
                        </p>
                        <h2 style={{ margin: 0, fontSize: "34px", lineHeight: 1.1 }}>{d.name}</h2>
                        <p style={{ margin: 0, fontSize: "26px" }}>{formatPrice(d.price)}</p>

                        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", padding: "var(--space-3)", background: "var(--color-surface)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                            <span className={d.statusCls}>{d.statusLabel}</span>
                            <span style={{ fontSize: "14px" }}>{d.stockText}</span>
                          </div>
                          <div style={{ height: "6px", background: "var(--color-neutral-300)", overflow: "hidden" }}>
                            <div style={{ height: "6px", width: d.barW, background: d.barColor }} />
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--color-neutral-700)" }}>
                            <span>ขายได้ {d.availNum} ชิ้น</span>
                            <span>{d.heldText}</span>
                          </div>
                        </div>

                        <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.6, color: "var(--color-neutral-800)" }}>
                          {d.description || "สินค้าจริงดึงข้อมูลตรงจากฐานข้อมูล พร้อมระบบหักสต็อกแบบ Atomic Transaction"}
                        </p>

                        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginTop: "var(--space-2)" }}>
                          <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--color-divider)", borderRadius: "var(--radius-md)" }}>
                            <button className="btn btn-ghost" onClick={() => setQty(Math.max(1, qty - 1))} style={{ width: "40px", height: "40px", padding: 0 }}>−</button>
                            <span style={{ minWidth: "36px", textAlign: "center", fontSize: "15px" }}>{qty}</span>
                            <button className="btn btn-ghost" onClick={() => setQty(qty + 1)} style={{ width: "40px", height: "40px", padding: 0 }}>+</button>
                          </div>
                          <button
                            className="btn btn-primary"
                            onClick={async () => {
                              if (d.id) {
                                await addToCart(d.id, qty);
                                const updated = await getCart();
                                setCart(updated);
                                setCartOpen(true);
                              }
                            }}
                            disabled={d.soldOut}
                            style={{ flex: 1, height: "44px" }}
                          >
                            {d.addLabel}
                          </button>
                        </div>
                        <p style={{ margin: "var(--space-2) 0 0", fontSize: "12px", color: "var(--color-neutral-700)", lineHeight: 1.6 }}>
                          สต็อกจะถูกจองไว้ 10 นาทีเมื่อกดชำระเงิน หากมีคนชำระสำเร็จก่อน ระบบจะแจ้งเตือนและปรับจำนวนในตะกร้าให้อัตโนมัติ
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Store View: Checkout */}
                  {storePage === "checkout" && (
                    <div style={{ padding: "var(--space-6) var(--space-6) var(--space-8)", display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "var(--space-8)" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                        <h2 style={{ margin: 0, fontSize: "30px" }}>ยืนยันคำสั่งซื้อ</h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                          <h3 style={{ margin: 0, fontSize: "15px", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--color-neutral-700)" }}>ที่อยู่จัดส่ง</h3>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
                            <div className="field"><label>ชื่อผู้รับ</label><input className="input" defaultValue="ณัฐพงษ์ วัฒนกุล" readOnly /></div>
                            <div className="field"><label>เบอร์โทร</label><input className="input" defaultValue="081-234-5678" readOnly /></div>
                          </div>
                          <div className="field"><label>ที่อยู่</label><input className="input" defaultValue="88/12 ซอยสุขุมวิท 31 คลองเตยเหนือ วัฒนา กรุงเทพฯ 10110" readOnly /></div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                          <h3 style={{ margin: 0, fontSize: "15px", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--color-neutral-700)" }}>ช่องทางชำระเงิน</h3>
                          <div style={{ display: "flex", gap: "var(--space-4)" }}>
                            <label className="radio"><input type="radio" name="pay-pc" defaultChecked /><span className="dot" />พร้อมเพย์ / QR</label>
                            <label className="radio"><input type="radio" name="pay-pc" /><span className="dot" />บัตรเครดิต</label>
                            <label className="radio"><input type="radio" name="pay-pc" /><span className="dot" />เก็บเงินปลายทาง</label>
                          </div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                          <h3 style={{ margin: 0, fontSize: "15px", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--color-neutral-700)" }}>
                            รายการ {cartCount} ชิ้น
                          </h3>
                          {cartLines.map((l) => (
                            <div key={l.sku} style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", padding: "var(--space-2) 0", borderBottom: "1px solid color-mix(in srgb, var(--color-text) 8%, transparent)" }}>
                              <div style={{ width: "48px", height: "48px", flex: "none", background: "repeating-linear-gradient(135deg,var(--color-neutral-200) 0 5px,var(--color-neutral-300) 5px 10px)" }} />
                              <span style={{ flex: 1, fontSize: "14px" }}>{l.name}</span>
                              <span className={l.statusCls}>{l.statusLabel}</span>
                              <span style={{ fontSize: "13px", color: "var(--color-neutral-700)", minWidth: "90px", textAlign: "right" }}>× {l.qty}</span>
                              <span style={{ fontSize: "14px", minWidth: "90px", textAlign: "right" }}>{l.lineText}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <aside style={{ alignSelf: "start", position: "sticky", top: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-3)", padding: "var(--space-4)", background: "var(--color-surface)" }}>
                        <h3 style={{ margin: 0, fontSize: "20px" }}>สรุปยอด</h3>
                        <div style={{ display: "flex", gap: "var(--space-2)" }}>
                          <input className="input" placeholder="โค้ดโปรโมชั่น" value={code} onChange={(e) => setCode(e.target.value)} />
                          <button className="btn btn-secondary" onClick={applyPromo} style={{ flex: "none" }}>ใช้โค้ด</button>
                        </div>
                        {promoMsg && <p style={{ margin: 0, fontSize: "12px", color: promoOk ? "var(--color-accent-700)" : "var(--color-accent-2-700)" }}>{promoMsg}</p>}

                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingTop: "var(--space-2)", borderTop: "1px solid var(--color-divider)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                            <span>ยอดสินค้า ({cartCount} ชิ้น)</span><span>{formatPrice(subtotal)}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: discount > 0 ? "var(--color-accent-2-700)" : "var(--color-neutral-600)" }}>
                            <span>{discount > 0 ? "ส่วนลดโปรโมชั่น" : "ส่วนลด"}</span><span>{discount > 0 ? `−${formatPrice(discount)}` : "—"}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                            <span>ค่าจัดส่ง</span><span>{ship === 0 ? "ฟรี" : formatPrice(ship)}</span>
                          </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingTop: "var(--space-2)", borderTop: "1px solid var(--color-text)" }}>
                          <span style={{ fontSize: "14px" }}>ยอดชำระ</span>
                          <span style={{ fontSize: "26px", fontWeight: 700 }}>{formatPrice(total)}</span>
                        </div>

                        <button className="btn btn-primary btn-block" onClick={handleCheckoutSubmit} style={{ height: "44px" }}>
                          ชำระเงิน
                        </button>
                        <p style={{ margin: 0, fontSize: "11px", color: "var(--color-neutral-700)", lineHeight: 1.6 }}>
                          เมื่อกดชำระเงิน ระบบจะจองสต็อกให้ 10 นาที และตัดสต็อกจริงเมื่อชำระสำเร็จ หากสินค้าถูกซื้อหมดก่อน จะได้รับแจ้งเตือนและปรับจำนวนอัตโนมัติ
                        </p>
                      </aside>
                    </div>
                  )}
                </>
              ) : (
                /* Admin Frame in PC View */
                <div style={{ display: "flex", minHeight: "840px" }}>
                  <aside style={{ width: "236px", flex: "none", background: "var(--color-surface)", padding: "var(--space-4) var(--space-3)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                    <div>
                      <p style={{ margin: 0, fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: "18px" }}>Mini Commerce</p>
                      <p style={{ margin: "2px 0 0", fontSize: "11px", letterSpacing: ".12em", textTransform: "uppercase", color: "var(--color-neutral-700)" }}>admin console</p>
                    </div>
                    <nav style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      {adminNav.map((n) => (
                        <button
                          key={n.key}
                          onClick={() => setAdminPage(n.key as "dashboard" | "orders" | "products" | "promos")}
                          style={{
                            fontFamily: "inherit",
                            textAlign: "left",
                            fontSize: "14px",
                            padding: "10px 12px",
                            cursor: "pointer",
                            border: 0,
                            borderLeft: adminPage === n.key ? "2px solid var(--color-accent)" : "2px solid transparent",
                            background: adminPage === n.key ? "var(--color-accent-100)" : "transparent",
                            color: adminPage === n.key ? "var(--color-accent-800)" : "var(--color-text)",
                            fontWeight: adminPage === n.key ? 600 : 400,
                          }}
                        >
                          {n.label}
                        </button>
                      ))}
                    </nav>
                    <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span style={{ fontSize: "11px", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--color-neutral-700)" }}>สถานะระบบ</span>
                      <span style={{ fontSize: "13px" }}>คิวตัดสต็อก: ว่าง</span>
                      <span style={{ fontSize: "12px", color: "var(--color-neutral-700)" }}>ซิงก์ล่าสุด 3 วินาทีที่แล้ว</span>
                    </div>
                  </aside>

                  <main style={{ flex: 1, padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-6)", minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "var(--space-4)" }}>
                      <div>
                        <p style={{ margin: "0 0 6px", fontSize: "11px", letterSpacing: ".12em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>
                          {adminPage === "dashboard" ? "วันนี้ · ภาพรวมร้าน" : adminPage === "orders" ? `ทั้งหมด ${orders.length} รายการ` : adminPage === "products" ? `${products.length} SKU` : `${promos.length} แคมเปญ`}
                        </p>
                        <h2 style={{ margin: 0, fontSize: "30px", lineHeight: 1.1 }}>
                          {adminPage === "dashboard" ? "ภาพรวมร้าน" : adminPage === "orders" ? "คำสั่งซื้อ" : adminPage === "products" ? "สินค้า & สต็อก" : "โปรโมชั่น"}
                        </h2>
                      </div>
                      <div style={{ display: "flex", gap: "var(--space-2)" }}>
                        <button className="btn btn-secondary">ส่งออก CSV</button>
                      </div>
                    </div>

                    {/* Admin Dashboard */}
                    {adminPage === "dashboard" && (
                      <>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--space-4)" }}>
                          {(stats.length ? stats : [
                            { label: "คำสั่งซื้อวันนี้", value: "128", note: "+12% จากเมื่อวาน" },
                            { label: "ยอดขายวันนี้", value: "฿184,200", note: "เฉลี่ย ฿1,440 ต่อบิล" },
                            { label: "รอจัดส่ง", value: "23", note: "เกิน SLA 2 รายการ" },
                            { label: "SKU ใกล้หมด", value: "3", note: "ต้องเติมภายใน 48 ชม.", noteColor: "var(--color-accent-2-700)" },
                          ]).map((s, idx: number) => (
                            <div key={idx} className="card elev-sm" style={{ gap: "6px" }}>
                              <span className="card-kicker">{s.label}</span>
                              <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: "30px", lineHeight: 1 }}>{s.value}</span>
                              <span style={{ fontSize: "12px", color: s.noteColor || "var(--color-neutral-700)" }}>{s.note}</span>
                            </div>
                          ))}
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: "var(--space-8)" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                            <h3 style={{ margin: 0, fontSize: "18px" }}>สต็อกที่ต้องเติมด่วน</h3>
                            {decoratedProducts.filter((p) => p.stockNum <= 10).slice(0, 3).map((p) => (
                              <div key={p.sku} style={{ display: "flex", flexDirection: "column", gap: "6px", paddingBottom: "var(--space-2)", borderBottom: "1px solid color-mix(in srgb, var(--color-text) 8%, transparent)" }}>
                                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "var(--space-2)" }}>
                                  <span style={{ fontSize: "15px" }}>{p.name}</span>
                                  <span style={{ fontSize: "13px", color: "var(--color-neutral-700)" }}>{p.sku}</span>
                                </div>
                                <div style={{ height: "6px", background: "var(--color-neutral-300)", overflow: "hidden" }}>
                                  <div style={{ height: "6px", width: p.barW, background: p.barColor }} />
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                                  <span className={p.statusCls}>{p.statusLabel}</span>
                                  <span style={{ fontSize: "12px", color: "var(--color-neutral-700)" }}>{p.stockText} · จองไว้ {p.heldNum} ชิ้น</span>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                            <h3 style={{ margin: 0, fontSize: "18px" }}>ความเคลื่อนไหวสต็อก</h3>
                            {stockLog.map((e, idx) => (
                              <div key={idx} style={{ display: "flex", gap: "var(--space-3)", alignItems: "baseline" }}>
                                <span style={{ fontSize: "12px", color: "var(--color-neutral-600)", minWidth: "44px" }}>{e.time}</span>
                                <span style={{ fontSize: "14px", flex: 1, lineHeight: 1.5 }}>{e.text}</span>
                                <span style={{ fontSize: "14px", color: e.color, whiteSpace: "nowrap" }}>{e.delta}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Admin Orders */}
                    {adminPage === "orders" && (
                      <table className="table">
                        <thead>
                          <tr><th>เลขที่</th><th>ลูกค้า</th><th>รายการ</th><th>ยอด</th><th>สถานะ</th><th>สต็อก</th></tr>
                        </thead>
                        <tbody>
                          {orders.map((o) => (
                            <tr key={o.id}>
                              <td>#{o.id}</td><td>{o.customerName || o.user?.email || "ลูกค้าทั่วไป"}</td><td>{o.items?.length || 1} รายการ</td>
                              <td>{formatPrice(o.totalAmount ?? o.total)}</td>
                              <td><span className="tag tag-accent">{typeof o.status === "boolean" ? (o.status ? "สำเร็จ" : "รอดำเนินการ") : o.status}</span></td>
                              <td style={{ color: "var(--color-accent-700)", fontSize: "13px" }}>ตัดสต็อกแล้ว</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {/* Admin Products */}
                    {adminPage === "products" && (
                      <table className="table">
                        <thead>
                          <tr><th>SKU</th><th>สินค้า</th><th>ราคา</th><th style={{ width: "220px" }}>ระดับสต็อก</th><th>ขายได้</th><th>จองไว้</th><th>สถานะ</th></tr>
                        </thead>
                        <tbody>
                          {decoratedProducts.map((p) => (
                            <tr key={p.sku} style={{ background: p.rowBg }}>
                              <td style={{ color: "var(--color-neutral-700)" }}>{p.sku}</td><td>{p.name}</td><td>{formatPrice(p.price)}</td>
                              <td>
                                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                                  <div style={{ flex: 1, height: "6px", background: "var(--color-neutral-300)", overflow: "hidden" }}><div style={{ height: "6px", width: p.barW, background: p.barColor }} /></div>
                                  <span style={{ fontSize: "13px", minWidth: "52px", textAlign: "right" }}>{p.stockNum} / 50</span>
                                </div>
                              </td>
                              <td style={{ fontWeight: 600 }}>{p.availNum}</td>
                              <td style={{ color: p.heldColor }}>{p.heldNum}</td>
                              <td><span className={p.statusCls}>{p.statusLabel}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {/* Admin Promos */}
                    {adminPage === "promos" && (
                      <table className="table">
                        <thead>
                          <tr><th>โค้ด</th><th>ประเภท</th><th>เงื่อนไข</th><th>ใช้แล้ว / โควตา</th><th>สถานะ</th></tr>
                        </thead>
                        <tbody>
                          {promos.map((c) => (
                            <tr key={c.id || c.code}>
                              <td style={{ letterSpacing: ".06em", fontWeight: 600 }}>{c.code}</td>
                              <td>{c.discountType === "PERCENTAGE" || c.type === "percentage" ? `ลด ${c.discountValue || c.value}%` : `ลด ฿${c.discountValue || c.value}`}</td>
                              <td>{c.minOrderAmount ? `ขั้นต่ำ ฿${c.minOrderAmount}` : "ไม่มีขั้นต่ำ"}</td>
                              <td>{c.usedCount || 0} / {c.usageLimit || 1000}</td>
                              <td><span className="tag tag-accent">{c.isActive !== false ? "ใช้งาน" : "ปิดใช้งาน"}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </main>
                </div>
              )}
            </div>

            {/* Slide-over Cart Drawer in PC */}
            {cartOpen && (
              <>
                <div onClick={() => setCartOpen(false)} style={{ position: "absolute", inset: 0, zIndex: 5, background: "color-mix(in srgb, var(--color-neutral-900) 45%, transparent)" }} />
                <aside style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "430px", zIndex: 6, background: "var(--color-bg)", boxShadow: "var(--shadow-lg)", display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-4)", borderBottom: "1px solid var(--color-text)" }}>
                    <h3 style={{ margin: 0, fontSize: "22px" }}>ตะกร้าสินค้า</h3>
                    <button className="btn btn-secondary btn-icon" onClick={() => setCartOpen(false)} aria-label="ปิดตะกร้า">✕</button>
                  </div>
                  <div style={{ flex: 1, overflow: "auto", padding: "0 var(--space-4)" }}>
                    {cartLines.map((l) => (
                      <div key={l.sku} style={{ display: "flex", gap: "var(--space-3)", padding: "var(--space-3) 0", borderBottom: "1px solid color-mix(in srgb, var(--color-text) 8%, transparent)" }}>
                        <div style={{ width: "64px", height: "64px", flex: "none", background: "repeating-linear-gradient(135deg,var(--color-neutral-200) 0 6px,var(--color-neutral-300) 6px 12px)" }} />
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px", minWidth: 0 }}>
                          <span style={{ fontSize: "14px" }}>{l.name}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span className={l.statusCls}>{l.statusLabel}</span>
                            <span style={{ fontSize: "12px", color: "var(--color-neutral-700)" }}>{l.stockText}</span>
                          </div>
                          {l.warn && <span style={{ fontSize: "11px", color: "var(--color-accent-2-700)" }}>{l.warnText}</span>}
                          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginTop: "4px" }}>
                            <button className="btn btn-secondary" onClick={l.onDec} style={{ width: "30px", height: "30px", padding: 0 }}>−</button>
                            <span style={{ fontSize: "14px", minWidth: "20px", textAlign: "center" }}>{l.qty}</span>
                            <button className="btn btn-secondary" onClick={l.onInc} style={{ width: "30px", height: "30px", padding: 0 }}>+</button>
                          </div>
                        </div>
                        <span style={{ fontSize: "14px", whiteSpace: "nowrap" }}>{l.lineText}</span>
                      </div>
                    ))}
                    {cartLines.length === 0 && <p style={{ margin: "var(--space-6) 0", fontSize: "14px", color: "var(--color-neutral-700)" }}>ยังไม่มีสินค้าในตะกร้า</p>}
                  </div>
                  <div style={{ padding: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-3)", background: "var(--color-surface)" }}>
                    <div style={{ display: "flex", gap: "var(--space-2)" }}>
                      <input className="input" placeholder="โค้ดโปรโมชั่น" value={code} onChange={(e) => setCode(e.target.value)} />
                      <button className="btn btn-secondary" onClick={applyPromo} style={{ flex: "none" }}>ใช้โค้ด</button>
                    </div>
                    {promoMsg && <p style={{ margin: 0, fontSize: "12px", color: promoOk ? "var(--color-accent-700)" : "var(--color-accent-2-700)" }}>{promoMsg}</p>}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingTop: "var(--space-2)", borderTop: "1px solid var(--color-text)" }}>
                      <span style={{ fontSize: "14px" }}>ยอดชำระ</span>
                      <span style={{ fontSize: "24px", fontWeight: 700 }}>{formatPrice(total)}</span>
                    </div>
                    <button className="btn btn-primary btn-block" onClick={() => { setCartOpen(false); setStorePage("checkout"); }} style={{ height: "44px" }}>
                      ไปหน้าชำระเงิน
                    </button>
                  </div>
                </aside>
              </>
            )}
          </div>
        </section>
      )}

      {/* Mobile Frame (390 x 800) */}
      {(device === "both" || device === "mobile") && (
        <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-3)" }}>
            <h2 style={{ margin: 0, fontSize: "20px" }}>Mobile</h2>
            <span style={{ fontSize: "11px", letterSpacing: ".12em", textTransform: "uppercase", color: "var(--color-neutral-700)" }}>
              390 × 800 · ระบบสี ฟอนต์ และคอมโพเนนต์ชุดเดียวกัน
            </span>
          </div>

          <div
            style={{
              position: "relative",
              width: "390px",
              height: "800px",
              overflow: "hidden",
              background: "var(--color-bg)",
              boxShadow: "var(--shadow-md)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-divider)",
            }}
          >
            <div style={{ position: "absolute", inset: 0, overflow: "auto" }}>
              {surface === "store" ? (
                <>
                  <header style={{ position: "sticky", top: 0, zIndex: 3, display: "flex", alignItems: "center", gap: "var(--space-2)", padding: "var(--space-3)", background: "var(--color-bg)", boxShadow: "var(--shadow-sm)" }}>
                    <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: "17px", marginRight: "auto" }}>Mini Commerce</span>
                    <button className="btn btn-secondary btn-icon" onClick={() => setCartOpen(true)} style={{ width: "36px", height: "36px" }}>
                      🛒
                    </button>
                  </header>

                  <div style={{ padding: "var(--space-4) var(--space-3) 120px", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                    <div>
                      <p style={{ margin: "0 0 4px", fontSize: "10px", letterSpacing: ".12em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>ตัดสต็อกเรียลไทม์</p>
                      <h2 style={{ margin: 0, fontSize: "26px", lineHeight: 1.1 }}>สินค้าทั้งหมด</h2>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2)" }}>
                      {decoratedProducts.map((p) => (
                        <article key={p.sku} className="card elev-sm" style={{ padding: "var(--space-2)", gap: "8px" }}>
                          <button onClick={p.onOpen} style={{ all: "unset", cursor: "pointer", display: "block" }}>
                            <div className="halftone" style={{ aspectRatio: "1", background: "repeating-linear-gradient(135deg,var(--color-neutral-200) 0 5px,var(--color-neutral-300) 5px 10px)", display: "grid", placeItems: "center" }}>
                              <span style={{ fontSize: "9px", letterSpacing: ".12em", textTransform: "uppercase", color: "var(--color-neutral-700)" }}>product</span>
                            </div>
                          </button>
                          <h3 className="card-title" style={{ fontSize: "14px", lineHeight: 1.3 }}>{p.name}</h3>
                          <span style={{ fontSize: "14px" }}>{formatPrice(p.price)}</span>
                          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                            <div style={{ height: "3px", background: "var(--color-neutral-300)", overflow: "hidden" }}>
                              <div style={{ height: "3px", width: p.barW, background: p.barColor }} />
                            </div>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "4px" }}>
                              <span className={p.statusCls} style={{ fontSize: "10px", padding: "2px 7px" }}>{p.statusLabel}</span>
                              <span style={{ fontSize: "11px", color: "var(--color-neutral-700)" }}>{p.stockShort}</span>
                            </div>
                          </div>
                          <button className="btn btn-secondary btn-block" onClick={p.onAdd} disabled={p.soldOut} style={{ minHeight: "44px", fontSize: "13px" }}>
                            {p.addLabel}
                          </button>
                        </article>
                      ))}
                    </div>
                  </div>

                  {/* Mobile FAB */}
                  <button
                    onClick={() => setCartOpen(true)}
                    style={{
                      position: "absolute",
                      right: "16px",
                      bottom: "24px",
                      zIndex: 4,
                      width: "60px",
                      height: "60px",
                      border: 0,
                      borderRadius: "50%",
                      cursor: "pointer",
                      background: "var(--color-accent)",
                      color: "#ffffff",
                      boxShadow: "var(--shadow-lg)",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                      <path d="M3 4h2.5l2.2 10.5h9.6L19 7H6" />
                      <circle cx="9" cy="19" r="1.4" />
                      <circle cx="17" cy="19" r="1.4" />
                    </svg>
                    <span style={{ position: "absolute", top: "-4px", right: "-4px", minWidth: "24px", height: "24px", padding: "0 6px", borderRadius: "12px", background: "var(--color-accent-2)", color: "#ffffff", fontSize: "12px", display: "grid", placeItems: "center", fontWeight: 700 }}>
                      {cartCount}
                    </span>
                  </button>
                </>
              ) : (
                /* Admin Mobile View */
                <div style={{ padding: "var(--space-3) var(--space-3) 96px", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "10px", letterSpacing: ".12em", textTransform: "uppercase", color: "var(--color-neutral-700)" }}>admin console</span>
                    <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: "18px" }}>ภาพรวมร้านค้า</span>
                  </div>

                  <div style={{ display: "flex", gap: "var(--space-2)", overflow: "auto", paddingBottom: "4px" }}>
                    {(stats.length ? stats : [
                      { label: "คำสั่งซื้อวันนี้", value: "128", note: "+12%" },
                      { label: "ยอดขายวันนี้", value: "฿184,200", note: "เฉลี่ย ฿1,440" },
                    ]).map((s, idx: number) => (
                      <div key={idx} className="card elev-sm" style={{ flex: "none", width: "160px", gap: "5px" }}>
                        <span className="card-kicker">{s.label}</span>
                        <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: "24px", lineHeight: 1 }}>{s.value}</span>
                        <span style={{ fontSize: "11px", color: s.noteColor || "var(--color-neutral-700)" }}>{s.note}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                    <h3 style={{ margin: 0, fontSize: "17px" }}>สต็อกที่ต้องเติมด่วน</h3>
                    {decoratedProducts.filter((p) => p.stockNum <= 10).slice(0, 3).map((p) => (
                      <div key={p.sku} className="card elev-sm" style={{ gap: "8px" }}>
                        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                          <span style={{ fontSize: "15px", fontWeight: 600 }}>{p.name}</span>
                          <span style={{ fontSize: "12px", color: "var(--color-neutral-700)" }}>{p.sku}</span>
                        </div>
                        <div style={{ height: "6px", background: "var(--color-neutral-300)", overflow: "hidden" }}>
                          <div style={{ height: "6px", width: p.barW, background: p.barColor }} />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span className={p.statusCls}>{p.statusLabel}</span>
                          <span style={{ fontSize: "12px", color: "var(--color-neutral-700)" }}>คงเหลือ {p.stockNum} · จอง {p.heldNum}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
