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

function ProductTableImage({ src, name }: { src?: string | null; name: string }) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-divider flex items-center justify-center text-neutral-400 shrink-0">
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setError(true)}
      className="w-10 h-10 rounded-xl object-cover border border-divider shrink-0 bg-neutral-100"
    />
  );
}

export default function AdminInventoryPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");
  const [search, setSearch] = useState<string>("");

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
  const [refillAddAmount, setRefillAddAmount] = useState<number>(10);
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
    let statusCls = "bg-emerald-100 text-emerald-900 border border-emerald-300";
    let barColor = "bg-accent";

    if (isOut) {
      statusLabel = "หมดชั่วคราว";
      statusCls = "bg-neutral-200 text-neutral-800 border border-neutral-300";
      barColor = "bg-neutral-400";
    } else if (isLow) {
      statusLabel = "ใกล้หมด";
      statusCls = "bg-rose-100 text-rose-900 border border-rose-300";
      barColor = "bg-rose-500";
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
      rowBg: isLow ? "bg-rose-50/50" : "",
    };
  };

  const decorated = products.map(decorate);

  const lowCount = decorated.filter((p) => p.isLow).length;
  const outCount = decorated.filter((p) => p.isOut).length;

  const filtered = decorated.filter((p) => {
    const matchSearch =
      search.trim() === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.catagory?.name || p.category?.name || "").toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;

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

  // Handle Quick Refill (Incremental addition: current stock + added amount)
  const handleOpenRefill = (p: Product) => {
    setRefillProduct(p);
    setRefillAddAmount(10);
  };

  const handleSaveRefill = async () => {
    if (!refillProduct) return;
    const currentStock = Number(refillProduct.stock) || 0;
    const addQty = Math.max(1, Number(refillAddAmount) || 0);
    const newTotalStock = currentStock + addQty;

    setRefilling(true);
    await updateProductAction(refillProduct.id, { stock: newTotalStock });
    await loadData();
    setRefillProduct(null);
    setRefilling(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-12 sm:pb-16">
      <div className="flex flex-col md:flex-row min-h-[840px] bg-bg rounded-2xl shadow-md overflow-hidden border border-divider">
        <AdminSidebar />

        <main className="flex-1 p-4 sm:p-6 flex flex-col gap-6 min-w-0">
          {/* Header */}
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-accent-700 font-bold mb-1">
                {products.length} SKU · จุดสั่งซื้อ 10 ชิ้น
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text m-0">
                สินค้า & สต็อก
              </h2>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-accent hover:bg-accent-600 active:bg-accent-700 !text-white transition-all cursor-pointer shadow-xs"
                onClick={handleOpenCreate}
              >
                + เพิ่มสินค้าใหม่
              </button>
            </div>
          </div>

          {/* Filter Bar & Search */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              {/* Status Segmented Control */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl border border-divider bg-surface shadow-2xs">
                <button
                  type="button"
                  className={`px-3 py-1.5 text-xs rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                    filter === "all"
                      ? "bg-accent text-white shadow-xs"
                      : "text-neutral-700 hover:text-text hover:bg-bg"
                  }`}
                  onClick={() => setFilter("all")}
                >
                  ทุกสถานะ ({decorated.length})
                </button>
                <button
                  type="button"
                  className={`px-3 py-1.5 text-xs rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                    filter === "low"
                      ? "bg-accent text-white shadow-xs"
                      : "text-neutral-700 hover:text-text hover:bg-bg"
                  }`}
                  onClick={() => setFilter("low")}
                >
                  ใกล้หมด ({lowCount})
                </button>
                <button
                  type="button"
                  className={`px-3 py-1.5 text-xs rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                    filter === "out"
                      ? "bg-accent text-white shadow-xs"
                      : "text-neutral-700 hover:text-text hover:bg-bg"
                  }`}
                  onClick={() => setFilter("out")}
                >
                  หมดชั่วคราว ({outCount})
                </button>
              </div>

              {/* Product Search Box */}
              <label className="flex items-center gap-2 w-full sm:w-72 bg-surface border border-divider rounded-xl px-3.5 py-1.5 focus-within:ring-2 focus-within:ring-accent focus-within:border-transparent transition-all shadow-2xs">
                <svg className="w-4 h-4 text-neutral-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <line x1="16.5" y1="16.5" x2="21" y2="21" />
                </svg>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ค้นหาชื่อสินค้า, SKU, หมวดหมู่..."
                  className="w-full bg-transparent border-0 outline-none text-xs text-text placeholder:text-neutral-500"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="text-xs text-neutral-500 hover:text-text cursor-pointer p-0.5"
                    title="ล้างคำค้นหา"
                  >
                    ✕
                  </button>
                )}
              </label>
            </div>

            <div className="flex items-center gap-2 text-xs text-neutral-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span>แถวไฮไลต์คือ SKU ที่ระดับสต็อกต่ำกว่าจุดสั่งซื้อ (10 ชิ้น)</span>
            </div>
          </div>

          {/* Table (Streamlined 7 columns to ensure Refill Button is always visible on-screen) */}
          {loading ? (
            <div className="py-20 text-center text-sm text-neutral-700 font-medium">
              กำลังโหลดข้อมูลคลังสินค้า...
            </div>
          ) : (
            <div className="border border-divider rounded-2xl bg-surface overflow-x-auto shadow-2xs">
              <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-divider text-neutral-700 font-bold tracking-wider uppercase text-[11px] bg-bg/40">
                    <th className="py-3.5 px-3.5 whitespace-nowrap">SKU (แก้ไข)</th>
                    <th className="py-3.5 px-3.5 min-w-[180px]">สินค้า</th>
                    <th className="py-3.5 px-3.5 whitespace-nowrap">หมวดหมู่</th>
                    <th className="py-3.5 px-3.5 whitespace-nowrap">ราคา</th>
                    <th className="py-3.5 px-3.5 min-w-[150px]">สต็อกคงเหลือ</th>
                    <th className="py-3.5 px-3.5 whitespace-nowrap text-center">สถานะ</th>
                    <th className="py-3.5 px-3.5 whitespace-nowrap text-right">เติมสต็อก</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider text-neutral-800">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-sm font-medium text-neutral-700">
                        {search ? `ไม่พบสินค้าที่ตรงกับการค้นหา "${search}"` : "ไม่มีรายการสินค้าในหมวดหมู่นี้"}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((p) => (
                      <tr
                        key={p.id}
                        className={`hover:bg-bg/50 transition-colors ${
                          p.isLow ? "bg-rose-50/30" : ""
                        }`}
                      >
                        <td className="py-3.5 px-3.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            className="font-mono font-bold text-accent hover:text-accent-700 hover:underline cursor-pointer inline-flex items-center gap-1.5 group transition-colors"
                            title="คลิกที่ SKU เพื่อแก้ไขข้อมูลสินค้านี้"
                          >
                            <span>{p.sku}</span>
                            <svg className="w-3.5 h-3.5 text-accent/50 group-hover:text-accent transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                        </td>
                        <td className="py-3.5 px-3.5 font-semibold text-text">
                          <div className="flex items-center gap-2.5">
                            <ProductTableImage src={p.imageUrl} name={p.name} />
                            <span className="font-semibold text-text max-w-[200px] line-clamp-1" title={p.name}>
                              {p.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3.5 text-neutral-700 font-medium whitespace-nowrap">
                          {p.catagory?.name || p.category?.name || "-"}
                        </td>
                        <td className="py-3.5 px-3.5 font-bold font-mono text-text whitespace-nowrap">
                          {formatPrice(p.price)}
                        </td>
                        <td className="py-3.5 px-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-neutral-200 rounded-full overflow-hidden shrink-0">
                              <div className={`h-full rounded-full ${p.barColor}`} style={{ width: p.barW }} />
                            </div>
                            <span className="text-xs font-bold text-text font-mono shrink-0">
                              {p.stock} / 50
                            </span>
                          </div>
                          {(p.held || 0) > 0 && (
                            <span className="text-[10px] text-rose-700 font-medium block mt-0.5">
                              จองไว้ {p.held} ชิ้น (พร้อมขาย {p.avail})
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-3.5 whitespace-nowrap text-center">
                          <span
                            className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${p.statusCls}`}
                          >
                            {p.statusLabel}
                          </span>
                        </td>
                        <td className="py-3.5 px-3.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenRefill(p)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-accent text-white hover:bg-accent-600 active:bg-accent-700 transition-all shadow-xs cursor-pointer !text-white whitespace-nowrap"
                            title={`เติมสต็อก ${p.name}`}
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <line x1="12" y1="5" x2="12" y2="19" />
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            <span>เติมสต็อก</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* 1. Modal: เพิ่มสินค้าใหม่ (Create Product)                                */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-surface border border-divider rounded-2xl p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-divider">
              <h3 className="text-lg font-bold text-text m-0">
                เพิ่มสินค้าใหม่เข้าสู่คลัง
              </h3>
              <button
                type="button"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-700 hover:bg-bg cursor-pointer transition-colors"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-950 text-xs font-semibold">
                {createError}
              </div>
            )}

            <form onSubmit={handleSaveCreate} className="flex flex-col gap-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-800 block mb-1">
                    รหัส SKU (เช่น SKU-2130)
                  </label>
                  <input
                    required
                    className="w-full px-3 py-2 text-sm rounded-xl border border-divider bg-bg text-text outline-none focus:border-accent font-mono font-bold shadow-2xs"
                    value={createSku}
                    onChange={(e) => setCreateSku(e.target.value.toUpperCase())}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-800 block mb-1">
                    หมวดหมู่สินค้า
                  </label>
                  <select
                    className="w-full px-3 py-2 text-sm rounded-xl border border-divider bg-bg text-text outline-none focus:border-accent font-medium shadow-2xs"
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

              <div>
                <label className="text-xs font-bold text-neutral-800 block mb-1">
                  ชื่อสินค้า
                </label>
                <input
                  required
                  className="w-full px-3 py-2 text-sm rounded-xl border border-divider bg-bg text-text outline-none focus:border-accent font-medium shadow-2xs"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="เช่น หูฟัง True Wireless Neo"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-800 block mb-1">
                    ราคา (บาท)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-divider bg-bg text-text outline-none focus:border-accent font-bold shadow-2xs"
                    value={createPrice}
                    onChange={(e) => setCreatePrice(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-800 block mb-1">
                    จำนวนสต็อกเริ่มต้น (ชิ้น)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-divider bg-bg text-text outline-none focus:border-accent font-bold shadow-2xs"
                    value={createStock}
                    onChange={(e) => setCreateStock(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Product Multi-Image Gallery Section */}
              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <label className="text-xs font-bold text-neutral-800">
                    แกลเลอรีรูปภาพสินค้า ({createImages.length} รูป)
                  </label>
                  <span className="text-[11px] text-neutral-700 font-medium">
                    *รูปแรกสุดจะถูกใช้เป็นรูปหลัก (Cover)
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-dashed border-divider bg-bg flex flex-col gap-2.5">
                  {/* Gallery Thumbnails List */}
                  {createImages.length > 0 ? (
                    <div className="flex gap-2 flex-wrap items-center">
                      {createImages.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          className={`relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-surface ${
                            idx === 0 ? "border-2 border-accent" : "border border-divider"
                          }`}
                        >
                          <img
                            src={imgUrl}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {idx === 0 && (
                            <span className="absolute bottom-0 inset-x-0 bg-accent text-white text-[9px] text-center font-bold py-0.5">
                              รูปหลัก
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => setCreateImages(createImages.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/70 text-white text-[9px] flex items-center justify-center cursor-pointer hover:bg-rose-600 transition-colors"
                            title="ลบรูปนี้"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-3 text-xs text-neutral-700 font-medium">
                      ยังไม่มีรูปภาพในแกลเลอรี (สามารถเลือกหลายไฟล์ได้พร้อมกัน)
                    </div>
                  )}

                  {/* Actions: Multi-file select and URL input */}
                  <div className="flex gap-2 flex-wrap items-center">
                    <label className="px-3 py-1.5 rounded-lg border border-divider bg-surface hover:bg-bg text-xs font-bold text-text cursor-pointer flex items-center gap-1.5 shadow-2xs transition-colors">
                      <svg className="w-3.5 h-3.5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      <span>{uploadingCreateImage ? "กำลังอัปโหลด..." : "+ เลือกรูปภาพ (หลายรูปได้)"}</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
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
                        className="text-xs font-bold text-rose-700 hover:underline cursor-pointer"
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
                  <div className="flex gap-1.5 items-center">
                    <input
                      className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-divider bg-surface text-text outline-none focus:border-accent placeholder:text-neutral-500 font-medium"
                      value={createInputUrl}
                      onChange={(e) => setCreateInputUrl(e.target.value)}
                      placeholder="หรือวาง URL รูปภาพ (https://...)"
                    />
                    <button
                      type="button"
                      className="px-3 py-1 text-xs font-bold rounded-lg border border-divider bg-surface hover:bg-bg text-text cursor-pointer transition-colors shadow-2xs"
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
                    <span className={`text-[11px] font-semibold ${uploadCreateStatus.includes("✓") ? "text-emerald-700" : "text-rose-700"}`}>
                      {uploadCreateStatus}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-800 block mb-1">
                  คำอธิบายสินค้า
                </label>
                <textarea
                  className="w-full px-3 py-2 text-sm rounded-xl border border-divider bg-bg text-text outline-none focus:border-accent font-medium shadow-2xs min-h-[72px]"
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  placeholder="ระบุรายละเอียดจุดเด่นสินค้า..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-divider">
                <button
                  type="button"
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-divider bg-surface hover:bg-bg text-text transition-colors cursor-pointer"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating || uploadingCreateImage}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-accent hover:bg-accent-600 active:bg-accent-700 !text-white transition-all shadow-xs cursor-pointer disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-surface border border-divider rounded-2xl p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-divider">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-accent-700 font-bold block">
                  แก้ไขข้อมูลสินค้า
                </span>
                <h3 className="text-lg font-bold text-text m-0">
                  {editProduct.sku}
                </h3>
              </div>
              <button
                type="button"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-700 hover:bg-bg cursor-pointer transition-colors"
                onClick={() => setEditProduct(null)}
              >
                ✕
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-950 text-xs font-semibold">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="flex flex-col gap-3.5">
              <div>
                <label className="text-xs font-bold text-neutral-800 block mb-1">
                  ชื่อสินค้า
                </label>
                <input
                  required
                  className="w-full px-3 py-2 text-sm rounded-xl border border-divider bg-bg text-text outline-none focus:border-accent font-medium shadow-2xs"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-800 block mb-1">
                    ราคา (บาท)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-divider bg-bg text-text outline-none focus:border-accent font-bold shadow-2xs"
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-800 block mb-1">
                    จำนวนสต็อกคงเหลือ (ชิ้น)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-divider bg-bg text-text outline-none focus:border-accent font-bold shadow-2xs"
                    value={editStock}
                    onChange={(e) => setEditStock(Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-800 block mb-1">
                  หมวดหมู่สินค้า
                </label>
                <select
                  className="w-full px-3 py-2 text-sm rounded-xl border border-divider bg-bg text-text outline-none focus:border-accent font-medium shadow-2xs"
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
              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <label className="text-xs font-bold text-neutral-800">
                    รูปภาพสินค้า (อัปโหลดได้หลายรูปพร้อมกัน)
                  </label>
                  <span className="text-[11px] text-neutral-700 font-medium">
                    {editImages.length} รูป (รูปแรกเป็นรูปหลัก)
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-dashed border-divider bg-bg flex flex-col gap-2.5">
                  {/* Thumbnails list */}
                  {editImages.length > 0 ? (
                    <div className="flex gap-2 flex-wrap items-center">
                      {editImages.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          className={`relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-surface ${
                            idx === 0 ? "border-2 border-accent" : "border border-divider"
                          }`}
                        >
                          <img
                            src={imgUrl}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {idx === 0 && (
                            <span className="absolute bottom-0 inset-x-0 bg-accent text-white text-[9px] text-center font-bold py-0.5">
                              รูปหลัก
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => setEditImages(editImages.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/70 text-white text-[9px] flex items-center justify-center cursor-pointer hover:bg-rose-600 transition-colors"
                            title="ลบรูปนี้"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-3 text-xs text-neutral-700 font-medium">
                      ยังไม่มีรูปภาพในแกลเลอรี (สามารถเลือกหลายไฟล์ได้พร้อมกัน)
                    </div>
                  )}

                  {/* Actions: Multi-file select and URL input */}
                  <div className="flex gap-2 flex-wrap items-center">
                    <label className="px-3 py-1.5 rounded-lg border border-divider bg-surface hover:bg-bg text-xs font-bold text-text cursor-pointer flex items-center gap-1.5 shadow-2xs transition-colors">
                      <svg className="w-3.5 h-3.5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      <span>{uploadingEditImage ? "กำลังอัปโหลด..." : "+ เลือกรูปภาพ (หลายรูปได้)"}</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
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
                        className="text-xs font-bold text-rose-700 hover:underline cursor-pointer"
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
                  <div className="flex gap-1.5 items-center">
                    <input
                      className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-divider bg-surface text-text outline-none focus:border-accent placeholder:text-neutral-500 font-medium"
                      value={editInputUrl}
                      onChange={(e) => setEditInputUrl(e.target.value)}
                      placeholder="หรือวาง URL รูปภาพ (https://...)"
                    />
                    <button
                      type="button"
                      className="px-3 py-1 text-xs font-bold rounded-lg border border-divider bg-surface hover:bg-bg text-text cursor-pointer transition-colors shadow-2xs"
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
                    <span className={`text-[11px] font-semibold ${uploadEditStatus.includes("✓") ? "text-emerald-700" : "text-rose-700"}`}>
                      {uploadEditStatus}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-800 block mb-1">
                  คำอธิบายสินค้า
                </label>
                <textarea
                  className="w-full px-3 py-2 text-sm rounded-xl border border-divider bg-bg text-text outline-none focus:border-accent font-medium shadow-2xs min-h-[72px]"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                />
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-divider">
                <button
                  type="button"
                  onClick={handleDeleteProduct}
                  disabled={saving || deleting || uploadingEditImage}
                  className="text-xs font-bold text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  {deleting ? "กำลังลบ..." : "ลบสินค้านี้"}
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditProduct(null)}
                    disabled={saving || uploadingEditImage}
                    className="px-4 py-2 text-xs font-semibold rounded-xl border border-divider bg-surface hover:bg-bg text-text transition-colors cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={saving || uploadingEditImage}
                    className="px-5 py-2 text-xs font-bold rounded-xl bg-accent hover:bg-accent-600 active:bg-accent-700 !text-white transition-all shadow-xs cursor-pointer disabled:opacity-50"
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
      {/* 3. Modal: Quick Refill เติมสต็อกสินค้า (Incremental Addition)            */}
      {/* ========================================================================= */}
      {refillProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-surface border border-divider rounded-2xl p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-start pb-3 border-b border-divider">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-accent font-bold block">
                  เติมสต็อกสินค้า
                </span>
                <h3 className="text-base font-bold text-text m-0">
                  {refillProduct.name}
                </h3>
                <p className="text-xs font-mono text-neutral-600 m-0 mt-0.5">
                  {refillProduct.sku}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRefillProduct(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-neutral-600 hover:text-text hover:bg-bg border border-divider transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Current Stock vs New Stock Display */}
            <div className="p-3.5 rounded-xl bg-bg border border-divider flex items-center justify-between text-xs">
              <div>
                <span className="text-neutral-600 block">สต็อกเดิม:</span>
                <strong className="text-base font-bold text-text font-mono">
                  {refillProduct.stock || 0} ชิ้น
                </strong>
              </div>
              <div className="text-xl font-bold text-neutral-400">→</div>
              <div>
                <span className="text-accent font-bold block">สต็อกใหม่หลังเติม:</span>
                <strong className="text-base font-bold text-accent font-mono">
                  {(Number(refillProduct.stock) || 0) + Math.max(0, Number(refillAddAmount) || 0)} ชิ้น
                </strong>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-800 block mb-1.5">
                จำนวนที่ต้องการบวกเพิ่ม (+ ชิ้น)
              </label>
              <input
                type="number"
                className="w-full px-3.5 py-2 text-base font-bold font-mono rounded-xl border border-divider bg-bg text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent shadow-2xs"
                value={refillAddAmount}
                onChange={(e) => setRefillAddAmount(Math.max(1, Number(e.target.value)))}
                min="1"
                autoFocus
              />

              {/* Quick Add Chips: +5, +10, +20, +50 */}
              <div className="flex gap-1.5 mt-2.5">
                {[5, 10, 20, 50].map((qty) => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => setRefillAddAmount(qty)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      refillAddAmount === qty
                        ? "bg-accent text-white border-accent shadow-2xs"
                        : "bg-surface hover:bg-bg border-divider text-neutral-700 hover:text-text"
                    }`}
                  >
                    +{qty}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-divider">
              <button
                type="button"
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-divider bg-surface hover:bg-bg text-text transition-colors cursor-pointer"
                onClick={() => setRefillProduct(null)}
                disabled={refilling}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                className="px-5 py-2 text-xs font-bold rounded-xl bg-accent hover:bg-accent-600 active:bg-accent-700 !text-white transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                onClick={handleSaveRefill}
                disabled={refilling}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>
                  {refilling
                    ? "กำลังบันทึก..."
                    : `เติม +${refillAddAmount || 0} ชิ้น (เป็น ${(Number(refillProduct.stock) || 0) + (Number(refillAddAmount) || 0)})`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}