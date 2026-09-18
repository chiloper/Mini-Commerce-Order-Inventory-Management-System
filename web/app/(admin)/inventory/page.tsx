"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "../../../components/admin-sidebar";
import {
  getProducts,
  getCategories,
  createProductAction,
  updateProductAction,
  deleteProductAction,
} from "../../../lib/ecommerce-actions";
import { getSessionUserAction } from "../../../lib/auth/actions";
import { uploadImage, uploadMultipleImages } from "../../../lib/cloudinary";
import type { Product, Category } from "@/types/ecommerce";

export default function AdminInventoryPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");

  // Create Product Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createSku, setCreateSku] = useState("");
  const [createName, setCreateName] = useState("");
  const [createPrice, setCreatePrice] = useState<number>(990);
  const [createStock, setCreateStock] = useState<number>(20);
  const [createCatId, setCreateCatId] = useState<number | undefined>(undefined);
  const [createDesc, setCreateDesc] = useState("");
  const [createImages, setCreateImages] = useState<string[]>([]);
  const [createInputUrl, setCreateInputUrl] = useState<string>("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [uploadingCreateImage, setUploadingCreateImage] = useState(false);
  const [uploadCreateStatus, setUploadCreateStatus] = useState<string>("");

  // Edit Product Modal state
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editStock, setEditStock] = useState<number>(0);
  const [editCatId, setEditCatId] = useState<number | undefined>(undefined);
  const [editDesc, setEditDesc] = useState("");
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editInputUrl, setEditInputUrl] = useState<string>("");
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingEditImage, setUploadingEditImage] = useState(false);
  const [uploadEditStatus, setUploadEditStatus] = useState<string>("");

  // Quick Refill Modal state
  const [refillProduct, setRefillProduct] = useState<Product | null>(null);
  const [refillStock, setRefillStock] = useState<number>(0);
  const [refilling, setRefilling] = useState(false);

  const handleMultipleImageFiles = async (
    e: React.ChangeEvent<HTMLInputElement>,
    currentImages: string[],
    setImages: (imgs: string[]) => void,
    onErr: (msg: string) => void,
    setUploading: (val: boolean) => void,
    setStatus: (msg: string) => void
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setStatus(`กำลังเตรียมอัปโหลด ${files.length} รูปภาพ...`);

    const { urls, errors } = await uploadMultipleImages(files, (done, total) => {
      setStatus(`กำลังอัปโหลดรูปภาพ (${done}/${total})...`);
    });

    if (urls.length > 0) {
      setImages([...currentImages, ...urls]);
      setStatus(`✓ อัปโหลดสำเร็จ ${urls.length} รูป!`);
    }
    if (errors.length > 0) {
      onErr(errors.join("; "));
    }
    setUploading(false);
    e.target.value = "";
  };

  const loadData = async () => {
    setLoading(true);
    const [prods, cats] = await Promise.all([getProducts(), getCategories()]);
    setProducts(prods);
    setCategories(cats);
    if (cats.length > 0 && !createCatId) {
      setCreateCatId(cats[0].id);
    }
    setLoading(false);
  };

  useEffect(() => {
    getSessionUserAction().then((u) => {
      if (!u || u.role !== "admin") {
        router.push("/admin/console");
        return;
      }
      loadData();
    });
  }, [router]);

  const formatPrice = (n: number) => `฿${(n || 0).toLocaleString("th-TH")}`;

  const decorate = (p: Product) => {
    const avail = Math.max(0, (p.stock || 0) - (p.held || 0));
    const isLow = (p.stock || 0) > 0 && avail <= 10;
    const isOut = (p.stock || 0) === 0;

    let statusLabel = "พร้อมส่ง";
    let statusCls = "tag tag-accent";
    let barColor = "var(--color-accent)";

    if (isOut) {
      statusLabel = "หมดชั่วคราว";
      statusCls = "tag tag-neutral";
      barColor = "var(--color-neutral-500)";
    } else if (isLow) {
      statusLabel = "ใกล้หมด";
      statusCls = "tag tag-accent-2";
      barColor = "var(--color-accent-2-500)";
    }

    const barW = Math.min(100, Math.round(((p.stock || 0) / 50) * 100)) + "%";

    return {
      ...p,
      avail,
      isLow,
      isOut,
      statusLabel,
      statusCls,
      barW,
      barColor,
      rowBg: isLow ? "var(--color-accent-2-100)" : "transparent",
    };
  };

  const decorated = products.map(decorate);

  const lowCount = decorated.filter((p) => p.isLow).length;
  const outCount = decorated.filter((p) => p.isOut).length;

  const filtered = decorated.filter((p) => {
    if (filter === "low") return p.isLow;
    if (filter === "out") return p.isOut;
    return true;
  });

  // Handle Create Product
  const handleOpenCreate = () => {
    setCreateSku(`SKU-${Math.floor(2100 + Math.random() * 899)}`);
    setCreateName("");
    setCreatePrice(990);
    setCreateStock(20);
    setCreateDesc("");
    setCreateImages([]);
    setCreateInputUrl("");
    setUploadCreateStatus("");
    setUploadingCreateImage(false);
    setCreateError(null);
    setShowCreateModal(true);
  };

  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    if (!createSku.trim() || !createName.trim()) {
      setCreateError("กรุณากรอกรหัส SKU และชื่อสินค้า");
      return;
    }
    setCreating(true);

    const res = await createProductAction({
      sku: createSku.trim().toUpperCase(),
      name: createName.trim(),
      price: Number(createPrice),
      stock: Number(createStock),
      catagoryId: createCatId ? Number(createCatId) : undefined,
      description: createDesc.trim() || undefined,
      imageUrl: createImages[0] || undefined,
      images: createImages,
      isActive: true,
    });

    if (res.ok) {
      setShowCreateModal(false);
      await loadData();
    } else {
      setCreateError(res.error || "เกิดข้อผิดพลาดในการเพิ่มสินค้า");
    }
    setCreating(false);
  };

  // Handle Edit Product
  const handleOpenEdit = (p: Product) => {
    setEditProduct(p);
    setEditName(p.name || "");
    setEditPrice(p.price || 0);
    setEditStock(p.stock || 0);
    setEditCatId(p.catagoryId || (categories[0]?.id));
    setEditDesc("");
    const initialImages =
      p.images && Array.isArray(p.images) && p.images.length > 0
        ? p.images
        : p.imageUrl
        ? [p.imageUrl]
        : [];
    setEditImages(initialImages);
    setEditInputUrl("");
    setUploadEditStatus("");
    setUploadingEditImage(false);
    setEditError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProduct) return;
    setEditError(null);
    setSaving(true);

    const res = await updateProductAction(editProduct.id, {
      name: editName.trim(),
      price: Number(editPrice),
      stock: Number(editStock),
      catagoryId: editCatId ? Number(editCatId) : undefined,
      imageUrl: editImages[0] || "",
      images: editImages,
    });

    if (res.ok) {
      setEditProduct(null);
      await loadData();
    } else {
      setEditError(res.error || "เกิดข้อผิดพลาดในการแก้ไขสินค้า");
    }
    setSaving(false);
  };

  // Handle Delete Product
  const handleDeleteProduct = async () => {
    if (!editProduct) return;
    if (!confirm(`คุณต้องการลบสินค้า "${editProduct.name}" (${editProduct.sku}) ใช่หรือไม่?`)) return;
    setDeleting(true);

    const res = await deleteProductAction(editProduct.id);
    if (res.ok) {
      setEditProduct(null);
      await loadData();
    } else {
      setEditError(res.error || "ไม่สามารถลบสินค้าได้");
    }
    setDeleting(false);
  };

  // Handle Quick Refill
  const handleOpenRefill = (p: Product) => {
    setRefillProduct(p);
    setRefillStock(p.stock || 0);
  };

  const handleSaveRefill = async () => {
    if (!refillProduct) return;
    setRefilling(true);
    await updateProductAction(refillProduct.id, { stock: Number(refillStock) });
    await loadData();
    setRefillProduct(null);
    setRefilling(false);
  };

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-4) var(--space-8)" }}>
      <div
        style={{
          display: "flex",
          minHeight: "840px",
          background: "var(--color-bg)",
          borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-md)",
          overflow: "hidden",
        }}
      >
        <AdminSidebar />

        <main style={{ flex: 1, padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-6)", minWidth: 0 }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap" }}>
            <div>
              <p style={{ margin: "0 0 6px", fontSize: "11px", letterSpacing: ".12em", textTransform: "uppercase", color: "var(--color-accent-700)", fontWeight: 600 }}>
                {products.length} SKU · จุดสั่งซื้อ 10 ชิ้น
              </p>
              <h2 style={{ margin: 0, fontSize: "30px", lineHeight: 1.1 }}>สินค้า & สต็อก</h2>
            </div>
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              <button className="btn btn-primary" onClick={handleOpenCreate}>
                + เพิ่มสินค้าใหม่
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
            <div className="seg">
              <button
                className={`seg-opt ${filter === "all" ? "active" : ""}`}
                onClick={() => setFilter("all")}
              >
                ทุกสถานะ ({decorated.length})
              </button>
              <button
                className={`seg-opt ${filter === "low" ? "active" : ""}`}
                onClick={() => setFilter("low")}
              >
                ใกล้หมด ({lowCount})
              </button>
              <button
                className={`seg-opt ${filter === "out" ? "active" : ""}`}
                onClick={() => setFilter("out")}
              >
                หมดชั่วคราว ({outCount})
              </button>
            </div>
            <span style={{ marginLeft: "auto", fontSize: "12px", color: "var(--color-neutral-700)" }}>
              แถวไฮไลต์คือ SKU ที่ระดับสต็อกต่ำกว่าจุดสั่งซื้อ
            </span>
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ padding: "60px 0", textAlign: "center", color: "var(--color-neutral-600)" }}>
              กำลังโหลดข้อมูลคลังสินค้า...
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>สินค้า</th>
                  <th>หมวดหมู่</th>
                  <th>ราคา</th>
                  <th style={{ width: "200px" }}>ระดับสต็อก</th>
                  <th>ขายได้</th>
                  <th>จองไว้</th>
                  <th>สถานะ</th>
                  <th style={{ textAlign: "right" }}>การดำเนินการ</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} style={{ background: p.rowBg }}>
                    <td style={{ color: "var(--color-neutral-700)", fontWeight: 500 }}>{p.sku}</td>
                    <td style={{ fontWeight: 600 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "var(--radius-sm)",
                            overflow: "hidden",
                            flex: "none",
                            background: "var(--color-neutral-200)",
                            border: "1px solid var(--color-divider)",
                            display: "grid",
                            placeItems: "center",
                          }}
                        >
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            <span style={{ fontSize: "8px", color: "var(--color-neutral-600)", letterSpacing: ".06em", textTransform: "uppercase" }}>
                              shot
                            </span>
                          )}
                        </div>
                        <span>{p.name}</span>
                      </div>
                    </td>
                    <td style={{ color: "var(--color-neutral-700)", fontSize: "13px" }}>
                      {p.catagory?.name || p.category?.name || "-"}
                    </td>
                    <td>{formatPrice(p.price)}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                        <div style={{ flex: 1, height: "6px", background: "var(--color-neutral-300)", overflow: "hidden" }}>
                          <div style={{ height: "6px", width: p.barW, background: p.barColor }} />
                        </div>
                        <span style={{ fontSize: "13px", minWidth: "52px", textAlign: "right" }}>
                          {p.stock} / 50
                        </span>
                      </div>
                    </td>
                    <td>{p.avail}</td>
                    <td style={{ color: (p.held || 0) > 0 ? "var(--color-accent-2-700)" : "var(--color-neutral-600)", fontWeight: (p.held || 0) > 0 ? 600 : 400 }}>
                      {p.held || 0}
                    </td>
                    <td>
                      <span className={p.statusCls}>{p.statusLabel}</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "4px" }}>
                        <button className="btn btn-ghost" onClick={() => handleOpenEdit(p)} style={{ fontSize: "13px" }}>
                          แก้ไข
                        </button>
                        <button className="btn btn-ghost" onClick={() => handleOpenRefill(p)} style={{ fontSize: "13px", color: "var(--color-accent-700)" }}>
                          เติมสต็อก
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* 1. Modal: เพิ่มสินค้าใหม่ (Create Product)                                */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "color-mix(in srgb, var(--color-neutral-900) 50%, transparent)",
            display: "grid",
            placeItems: "center",
            padding: "var(--space-4)",
            zIndex: 10000,
          }}
        >
          <div
            className="card"
            style={{
              width: "min(500px, 100%)",
              background: "var(--color-surface)",
              boxShadow: "var(--shadow-lg)",
              gap: "var(--space-3)",
              padding: "var(--space-6)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 className="card-title" style={{ fontSize: "20px" }}>
                เพิ่มสินค้าใหม่เข้าสู่คลัง
              </h3>
              <button
                className="btn btn-secondary btn-icon"
                onClick={() => setShowCreateModal(false)}
                style={{ width: "32px", height: "32px" }}
              >
                ✕
              </button>
            </div>

            {createError && (
              <div
                style={{
                  padding: "var(--space-2) var(--space-3)",
                  background: "var(--color-accent-2-100)",
                  color: "var(--color-accent-2-800)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "13px",
                }}
              >
                {createError}
              </div>
            )}

            <form onSubmit={handleSaveCreate} style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2)" }}>
                <div className="field">
                  <label>รหัส SKU (เช่น SKU-2130)</label>
                  <input
                    required
                    className="input"
                    value={createSku}
                    onChange={(e) => setCreateSku(e.target.value.toUpperCase())}
                  />
                </div>
                <div className="field">
                  <label>หมวดหมู่สินค้า</label>
                  <select
                    className="input"
                    value={createCatId}
                    onChange={(e) => setCreateCatId(Number(e.target.value))}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="field">
                <label>ชื่อสินค้า</label>
                <input
                  required
                  className="input"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="เช่น หูฟัง True Wireless Neo"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2)" }}>
                <div className="field">
                  <label>ราคา (บาท)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="input"
                    value={createPrice}
                    onChange={(e) => setCreatePrice(Number(e.target.value))}
                  />
                </div>
                <div className="field">
                  <label>จำนวนสต็อกเริ่มต้น (ชิ้น)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="input"
                    value={createStock}
                    onChange={(e) => setCreateStock(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Product Multi-Image Gallery Section */}
              <div className="field">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <label>แกลเลอรีรูปภาพสินค้า ({createImages.length} รูป)</label>
                  <span style={{ fontSize: "11px", color: "var(--color-neutral-700)" }}>
                    *รูปแรกสุดจะถูกใช้เป็นรูปหลัก (Cover)
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-2)",
                    padding: "var(--space-3)",
                    background: "var(--color-bg)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px dashed var(--color-divider)",
                  }}
                >
                  {/* Gallery Thumbnails List */}
                  {createImages.length > 0 ? (
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                      {createImages.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          style={{
                            position: "relative",
                            width: "72px",
                            height: "72px",
                            borderRadius: "var(--radius-sm)",
                            border: idx === 0 ? "2px solid var(--color-accent)" : "1px solid var(--color-divider)",
                            overflow: "hidden",
                            background: "var(--color-surface)",
                          }}
                        >
                          <img
                            src={imgUrl}
                            alt={`Preview ${idx + 1}`}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                          {idx === 0 && (
                            <span
                              style={{
                                position: "absolute",
                                bottom: 0,
                                left: 0,
                                right: 0,
                                background: "var(--color-accent)",
                                color: "#fff",
                                fontSize: "9px",
                                textAlign: "center",
                                padding: "1px 0",
                                fontWeight: 600,
                              }}
                            >
                              รูปหลัก
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => setCreateImages(createImages.filter((_, i) => i !== idx))}
                            style={{
                              position: "absolute",
                              top: "2px",
                              right: "2px",
                              width: "18px",
                              height: "18px",
                              borderRadius: "50%",
                              background: "rgba(0,0,0,0.6)",
                              color: "#fff",
                              border: "none",
                              cursor: "pointer",
                              display: "grid",
                              placeItems: "center",
                              fontSize: "10px",
                              lineHeight: 1,
                              padding: 0,
                            }}
                            title="ลบรูปนี้"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", padding: "12px 0", color: "var(--color-neutral-600)", fontSize: "13px" }}>
                      ยังไม่มีรูปภาพในแกลเลอรี (สามารถเลือกหลายไฟล์ได้พร้อมกัน)
                    </div>
                  )}

                  {/* Actions: Multi-file select and URL input */}
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", marginTop: "4px" }}>
                    <label
                      className="btn btn-secondary"
                      style={{ fontSize: "12px", padding: "5px 12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      {uploadingCreateImage ? "กำลังอัปโหลด..." : "+ เลือกรูปภาพ (หลายรูปพร้อมกันได้)"}
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        style={{ display: "none" }}
                        disabled={uploadingCreateImage}
                        onChange={(e) =>
                          handleMultipleImageFiles(
                            e,
                            createImages,
                            setCreateImages,
                            (err) => setCreateError(err),
                            setUploadingCreateImage,
                            setUploadCreateStatus
                          )
                        }
                      />
                    </label>

                    {createImages.length > 0 && (
                      <button
                        type="button"
                        className="btn btn-ghost"
                        style={{ fontSize: "12px", padding: "4px 8px", color: "var(--color-accent-2-700)" }}
                        onClick={() => {
                          setCreateImages([]);
                          setUploadCreateStatus("");
                        }}
                      >
                        ลบทั้งหมด
                      </button>
                    )}
                  </div>

                  {/* Add by URL */}
                  <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "2px" }}>
                    <input
                      className="input"
                      style={{ fontSize: "12px", minHeight: "30px", height: "30px", flex: 1 }}
                      value={createInputUrl}
                      onChange={(e) => setCreateInputUrl(e.target.value)}
                      placeholder="หรือวาง URL รูปภาพ (https://...)"
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ fontSize: "12px", padding: "0 10px", height: "30px" }}
                      onClick={() => {
                        if (createInputUrl.trim()) {
                          setCreateImages([...createImages, createInputUrl.trim()]);
                          setCreateInputUrl("");
                        }
                      }}
                    >
                      + เพิ่ม
                    </button>
                  </div>

                  {uploadCreateStatus && (
                    <span style={{ fontSize: "11px", color: uploadCreateStatus.includes("✓") ? "var(--color-accent)" : "var(--color-accent-2-700)", fontWeight: 500 }}>
                      {uploadCreateStatus}
                    </span>
                  )}
                </div>
              </div>

              <div className="field">
                <label>คำอธิบายสินค้า</label>
                <textarea
                  className="input"
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  placeholder="ระบุรายละเอียดจุดเด่นสินค้า..."
                  style={{ minHeight: "70px" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating || uploadingCreateImage}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={creating || uploadingCreateImage}
                >
                  {creating ? "กำลังบันทึกข้อมูล..." : "บันทึกสินค้าใหม่"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. Modal: แก้ไขสินค้า (Edit Product)                                     */}
      {/* ========================================================================= */}
      {editProduct && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "color-mix(in srgb, var(--color-neutral-900) 50%, transparent)",
            display: "grid",
            placeItems: "center",
            padding: "var(--space-4)",
            zIndex: 10000,
          }}
        >
          <div
            className="card"
            style={{
              width: "min(500px, 100%)",
              background: "var(--color-surface)",
              boxShadow: "var(--shadow-lg)",
              gap: "var(--space-3)",
              padding: "var(--space-6)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span className="card-kicker">แก้ไขข้อมูลสินค้า</span>
                <h3 className="card-title" style={{ fontSize: "20px", margin: "2px 0 0" }}>
                  {editProduct.sku}
                </h3>
              </div>
              <button
                className="btn btn-secondary btn-icon"
                onClick={() => setEditProduct(null)}
                style={{ width: "32px", height: "32px" }}
              >
                ✕
              </button>
            </div>

            {editError && (
              <div
                style={{
                  padding: "var(--space-2) var(--space-3)",
                  background: "var(--color-accent-2-100)",
                  color: "var(--color-accent-2-800)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "13px",
                }}
              >
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <div className="field">
                <label>ชื่อสินค้า</label>
                <input
                  required
                  className="input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2)" }}>
                <div className="field">
                  <label>ราคา (บาท)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="input"
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                  />
                </div>
                <div className="field">
                  <label>จำนวนสต็อกคงเหลือ (ชิ้น)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="input"
                    value={editStock}
                    onChange={(e) => setEditStock(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="field">
                <label>หมวดหมู่สินค้า</label>
                <select
                  className="input"
                  value={editCatId}
                  onChange={(e) => setEditCatId(Number(e.target.value))}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Multi-Image Gallery */}
              <div className="field">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <label>รูปภาพสินค้า (อัปโหลดได้หลายรูปพร้อมกัน)</label>
                  <span style={{ fontSize: "11px", color: "var(--color-neutral-600)" }}>
                    {editImages.length} รูป (รูปแรกเป็นรูปหลัก)
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-2)",
                    padding: "var(--space-3)",
                    background: "var(--color-bg)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px dashed var(--color-divider)",
                  }}
                >
                  {/* Thumbnails list */}
                  {editImages.length > 0 ? (
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                      {editImages.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          style={{
                            position: "relative",
                            width: "72px",
                            height: "72px",
                            borderRadius: "var(--radius-sm)",
                            border: idx === 0 ? "2px solid var(--color-accent)" : "1px solid var(--color-divider)",
                            overflow: "hidden",
                            background: "var(--color-surface)",
                          }}
                        >
                          <img
                            src={imgUrl}
                            alt={`Preview ${idx + 1}`}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                          {idx === 0 && (
                            <span
                              style={{
                                position: "absolute",
                                bottom: 0,
                                left: 0,
                                right: 0,
                                background: "var(--color-accent)",
                                color: "#fff",
                                fontSize: "9px",
                                textAlign: "center",
                                padding: "1px 0",
                                fontWeight: 600,
                              }}
                            >
                              รูปหลัก
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => setEditImages(editImages.filter((_, i) => i !== idx))}
                            style={{
                              position: "absolute",
                              top: "2px",
                              right: "2px",
                              width: "18px",
                              height: "18px",
                              borderRadius: "50%",
                              background: "rgba(0,0,0,0.6)",
                              color: "#fff",
                              border: "none",
                              cursor: "pointer",
                              display: "grid",
                              placeItems: "center",
                              fontSize: "10px",
                              lineHeight: 1,
                              padding: 0,
                            }}
                            title="ลบรูปนี้"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", padding: "12px 0", color: "var(--color-neutral-600)", fontSize: "13px" }}>
                      ยังไม่มีรูปภาพในแกลเลอรี (สามารถเลือกหลายไฟล์ได้พร้อมกัน)
                    </div>
                  )}

                  {/* Actions: Multi-file select and URL input */}
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", marginTop: "4px" }}>
                    <label
                      className="btn btn-secondary"
                      style={{ fontSize: "12px", padding: "5px 12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      {uploadingEditImage ? "กำลังอัปโหลด..." : "+ เลือกรูปภาพ (หลายรูปพร้อมกันได้)"}
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        style={{ display: "none" }}
                        disabled={uploadingEditImage}
                        onChange={(e) =>
                          handleMultipleImageFiles(
                            e,
                            editImages,
                            setEditImages,
                            (err) => setEditError(err),
                            setUploadingEditImage,
                            setUploadEditStatus
                          )
                        }
                      />
                    </label>

                    {editImages.length > 0 && (
                      <button
                        type="button"
                        className="btn btn-ghost"
                        style={{ fontSize: "12px", padding: "4px 8px", color: "var(--color-accent-2-700)" }}
                        onClick={() => {
                          setEditImages([]);
                          setUploadEditStatus("");
                        }}
                      >
                        ลบทั้งหมด
                      </button>
                    )}
                  </div>

                  {/* Add by URL */}
                  <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "2px" }}>
                    <input
                      className="input"
                      style={{ fontSize: "12px", minHeight: "30px", height: "30px", flex: 1 }}
                      value={editInputUrl}
                      onChange={(e) => setEditInputUrl(e.target.value)}
                      placeholder="หรือวาง URL รูปภาพ (https://...)"
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ fontSize: "12px", padding: "0 10px", height: "30px" }}
                      onClick={() => {
                        if (editInputUrl.trim()) {
                          setEditImages([...editImages, editInputUrl.trim()]);
                          setEditInputUrl("");
                        }
                      }}
                    >
                      + เพิ่ม
                    </button>
                  </div>

                  {uploadEditStatus && (
                    <span style={{ fontSize: "11px", color: uploadEditStatus.includes("✓") ? "var(--color-accent)" : "var(--color-accent-2-700)", fontWeight: 500 }}>
                      {uploadEditStatus}
                    </span>
                  )}
                </div>
              </div>

              <div className="field">
                <label>คำอธิบายสินค้า</label>
                <textarea
                  className="input"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  style={{ minHeight: "70px" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "var(--space-2)" }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={handleDeleteProduct}
                  disabled={saving || deleting || uploadingEditImage}
                  style={{ color: "var(--color-accent-2-700)" }}
                >
                  {deleting ? "กำลังลบ..." : "ลบสินค้านี้"}
                </button>

                <div style={{ display: "flex", gap: "var(--space-2)" }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setEditProduct(null)}
                    disabled={saving || uploadingEditImage}
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving || uploadingEditImage}
                  >
                    {saving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. Modal: Quick Refill สต็อกด่วน                                          */}
      {/* ========================================================================= */}
      {refillProduct && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "color-mix(in srgb, var(--color-neutral-900) 50%, transparent)",
            display: "grid",
            placeItems: "center",
            padding: "var(--space-4)",
            zIndex: 10000,
          }}
        >
          <div
            className="card"
            style={{
              width: "min(380px, 100%)",
              background: "var(--color-surface)",
              boxShadow: "var(--shadow-lg)",
              gap: "var(--space-3)",
              padding: "var(--space-4)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <h3 className="card-title" style={{ fontSize: "18px" }}>
              เติมสต็อกสินค้าด่วน
            </h3>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--color-neutral-700)" }}>
              {refillProduct.name} ({refillProduct.sku})
            </p>

            <div className="field">
              <label>จำนวนสต็อกคงเหลือใหม่ (ชิ้น)</label>
              <input
                type="number"
                className="input"
                value={refillStock}
                onChange={(e) => setRefillStock(Number(e.target.value))}
                min="0"
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
              <button
                className="btn btn-secondary"
                onClick={() => setRefillProduct(null)}
                disabled={refilling}
              >
                ยกเลิก
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveRefill}
                disabled={refilling}
              >
                {refilling ? "กำลังบันทึกข้อมูล..." : "บันทึกสต็อก"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}