"use client";

import React, { useState, useEffect } from "react";
import ImageGalleryUploader from "./image-gallery-uploader";
import ConfirmModal from "../confirm-modal";
import { updateProductAction, deleteProductAction } from "../../lib/ecommerce-actions";
import type { Product, Category } from "@/types/ecommerce";

interface EditProductModalProps {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditProductModal({
  product,
  categories,
  onClose,
  onSuccess,
}: EditProductModalProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [catId, setCatId] = useState<number | undefined>(undefined);
  const [desc, setDesc] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // In-app Confirm Modal State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: React.ReactNode;
    confirmText: string;
    variant: "danger" | "warning" | "info" | "success";
    actionType: "archive" | "unarchive" | "delete";
  }>({
    isOpen: false,
    title: "",
    description: "",
    confirmText: "",
    variant: "warning",
    actionType: "archive",
  });

  useEffect(() => {
    if (product) {
      setName(product.name || "");
      setPrice(product.price || 0);
      setStock(product.stock || 0);
      setCatId(product.catagoryId || (categories[0]?.id));
      setDesc(product.description || "");
      const initialImages =
        product.images && Array.isArray(product.images) && product.images.length > 0
          ? product.images
          : product.imageUrl
          ? [product.imageUrl]
          : [];
      setImages(initialImages);
      setError(null);
    }
  }, [product, categories]);

  if (!product) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const res = await updateProductAction(product.id, {
      name: name.trim(),
      price: Number(price),
      stock: Number(stock),
      catagoryId: catId ? Number(catId) : undefined,
      description: desc.trim() || undefined,
      imageUrl: images[0] || "",
      images: images,
    });

    if (res.ok) {
      onSuccess();
      onClose();
    } else {
      setError(res.error || "เกิดข้อผิดพลาดในการแก้ไขสินค้า");
    }
    setSaving(false);
  };

  // Open in-app confirm modal for Archive
  const promptArchive = () => {
    setConfirmConfig({
      isOpen: true,
      title: "ยืนยันการจัดเก็บสินค้าเข้าคลังถาวร (Archive)",
      description: (
        <span>
          คุณต้องการเก็บสินค้า <strong>&quot;{product.name}&quot;</strong> ({product.sku}) เข้าคลังถาวรใช่หรือไม่?
          <br /><br />
          <span className="text-amber-700 font-semibold block">
            * สินค้านี้จะถูกซ่อนจากหน้าร้านค้าและไม่สามารถสั่งซื้อได้ แต่ประวัติคำสั่งซื้อเดิมยังคงอยู่ครบถ้วน 100%
          </span>
        </span>
      ),
      confirmText: "เก็บเข้าคลังถาวร",
      variant: "warning",
      actionType: "archive",
    });
  };

  // Open in-app confirm modal for Unarchive / Restore
  const promptUnarchive = () => {
    setConfirmConfig({
      isOpen: true,
      title: "ยืนยันการนำสินค้ากลับมาเปิดขาย (Unarchive)",
      description: (
        <span>
          คุณต้องการนำสินค้า <strong>&quot;{product.name}&quot;</strong> ({product.sku}) กลับมาแสดงที่หน้าร้านและเปิดให้สั่งซื้ออีกครั้งใช่หรือไม่?
        </span>
      ),
      confirmText: "เปิดการขายสินค้า",
      variant: "info",
      actionType: "unarchive",
    });
  };

  // Open in-app confirm modal for Permanent Deletion
  const promptDelete = () => {
    setConfirmConfig({
      isOpen: true,
      title: "⚠️ ยืนยันการลบสินค้าถาวร (Delete Permanently)",
      description: (
        <span>
          คุณแน่ใจหรือไม่ว่าต้องการลบสินค้า <strong>&quot;{product.name}&quot;</strong> ({product.sku}) อย่างถาวร?
          <br /><br />
          <span className="text-rose-700 font-bold block">
            การดำเนินการนี้จะลบข้อมูลสินค้าออกจากระบบโดยเด็ดขาดและไม่สามารถกู้คืนได้!
          </span>
        </span>
      ),
      confirmText: "ลบสินค้าอย่างถาวร",
      variant: "danger",
      actionType: "delete",
    });
  };

  // Execute confirmed action
  const handleExecuteConfirmedAction = async () => {
    setActionLoading(true);
    if (confirmConfig.actionType === "archive") {
      const res = await updateProductAction(product.id, { isActive: false });
      if (res.ok) {
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        onSuccess();
        onClose();
      } else {
        setError(res.error || "ไม่สามารถจัดเก็บสินค้าได้");
      }
    } else if (confirmConfig.actionType === "unarchive") {
      const res = await updateProductAction(product.id, { isActive: true });
      if (res.ok) {
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        onSuccess();
        onClose();
      } else {
        setError(res.error || "ไม่สามารถเปิดการขายสินค้าได้");
      }
    } else if (confirmConfig.actionType === "delete") {
      const res = await deleteProductAction(product.id);
      if (res.ok) {
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        onSuccess();
        onClose();
      } else {
        setError(res.error || "ไม่สามารถลบสินค้าได้");
      }
    }
    setActionLoading(false);
  };

  const isArchived = product.isActive === false;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
        <div className="w-full max-w-lg bg-surface border border-divider rounded-2xl p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center pb-2 border-b border-divider">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-accent-700 font-bold block">
                แก้ไขข้อมูลสินค้า
              </span>
              <h3 className="text-lg font-bold text-text m-0">{product.sku}</h3>
            </div>
            <button
              type="button"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-700 hover:bg-bg cursor-pointer transition-colors"
              onClick={onClose}
            >
              ✕
            </button>
          </div>

          {/* Archived Notice Banner */}
          {isArchived && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-neutral-900 text-neutral-100 text-xs font-semibold shadow-xs">
              <span className="text-base shrink-0">📦</span>
              <div className="flex-1 min-w-0">
                <span className="font-bold text-amber-400">สินค้านี้อยู่ในสถานะเก็บถาวร (Archived)</span>
                <span className="block text-neutral-300 text-[11px] mt-0.5">
                  ถูกซ่อนจากหน้าร้านค้าและไม่สามารถสั่งซื้อได้ คุณสามารถกด &quot;นำกลับมาขาย&quot; เพื่อเปิดขายใหม่ หรือ &quot;ลบสินค้าถาวร&quot; เพื่อลบออกจากระบบ
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-950 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSave} className="flex flex-col gap-3.5">
            <div>
              <label className="text-xs font-bold text-neutral-800 block mb-1">ชื่อสินค้า</label>
              <input
                required
                className="w-full px-3 py-2 text-sm rounded-xl border border-divider bg-bg text-text outline-none focus:border-accent font-medium shadow-2xs"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-neutral-800 block mb-1">ราคา (บาท)</label>
                <input
                  type="number"
                  required
                  min="0"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-divider bg-bg text-text outline-none focus:border-accent font-bold shadow-2xs"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-800 block mb-1">จำนวนสต็อกคงเหลือ (ชิ้น)</label>
                <input
                  type="number"
                  required
                  min="0"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-divider bg-bg text-text outline-none focus:border-accent font-bold shadow-2xs"
                  value={stock}
                  onChange={(e) => setStock(Number(e.target.value))}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-800 block mb-1">หมวดหมู่สินค้า</label>
              <select
                className="w-full px-3 py-2 text-sm rounded-xl border border-divider bg-bg text-text outline-none focus:border-accent font-medium shadow-2xs"
                value={catId}
                onChange={(e) => setCatId(Number(e.target.value))}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Shared Image Gallery Uploader */}
            <ImageGalleryUploader
              images={images}
              onChange={setImages}
              onError={setError}
            />

            <div>
              <label className="text-xs font-bold text-neutral-800 block mb-1">คำอธิบายสินค้า</label>
              <textarea
                className="w-full px-3 py-2 text-sm rounded-xl border border-divider bg-bg text-text outline-none focus:border-accent font-medium shadow-2xs min-h-[72px]"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
            </div>

            {/* Modal Footer with Two-Step Removal Pattern */}
            <div className="flex justify-between items-center pt-3 border-t border-divider flex-wrap gap-2">
              {isArchived ? (
                <div className="flex items-center gap-2">
                  {/* Delete Permanently (Only when archived) */}
                  <button
                    type="button"
                    onClick={promptDelete}
                    disabled={saving || actionLoading}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-300 hover:border-rose-600 px-3.5 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                    title="ลบข้อมูลสินค้านี้ออกจากระบบอย่างถาวร"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    <span>ลบสินค้าถาวร</span>
                  </button>

                  {/* Unarchive / Restore */}
                  <button
                    type="button"
                    onClick={promptUnarchive}
                    disabled={saving || actionLoading}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-3.5 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                    title="เปิดการขายสินค้านี้อีกครั้งและแสดงที่หน้าร้าน"
                  >
                    <svg className="w-4 h-4 text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 14 4 9 9 4" />
                      <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
                    </svg>
                    <span>นำกลับมาขาย</span>
                  </button>
                </div>
              ) : (
                /* Active: Show Archive Button */
                <button
                  type="button"
                  onClick={promptArchive}
                  disabled={saving || actionLoading}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-3.5 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                  title="เก็บสินค้านี้เข้าคลังถาวร"
                >
                  <svg className="w-4 h-4 text-amber-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="21 8 21 21 3 21 3 8" />
                    <rect x="1" y="3" width="22" height="5" />
                    <line x1="10" y1="12" x2="14" y2="12" />
                  </svg>
                  <span>เก็บถาวร (Archive)</span>
                </button>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving || actionLoading}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-divider bg-surface hover:bg-bg text-text transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving || actionLoading}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-accent hover:bg-accent-600 active:bg-accent-700 !text-white transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {saving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* In-app Confirmation Modal (Replaces browser confirm) */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        description={confirmConfig.description}
        confirmText={confirmConfig.confirmText}
        cancelText="ยกเลิก"
        variant={confirmConfig.variant}
        isLoading={actionLoading}
        onConfirm={handleExecuteConfirmedAction}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </>
  );
}
