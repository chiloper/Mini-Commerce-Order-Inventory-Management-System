"use client";

import React, { useState, useEffect } from "react";
import ImageGalleryUploader from "./image-gallery-uploader";
import { createProductAction } from "../../lib/ecommerce-actions";
import type { Category } from "@/types/ecommerce";

interface CreateProductModalProps {
  isOpen: boolean;
  categories: Category[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateProductModal({
  isOpen,
  categories,
  onClose,
  onSuccess,
}: CreateProductModalProps) {
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number>(990);
  const [stock, setStock] = useState<number>(20);
  const [catId, setCatId] = useState<number | undefined>(undefined);
  const [desc, setDesc] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSku(`SKU-${Math.floor(2100 + Math.random() * 899)}`);
      setName("");
      setPrice(990);
      setStock(20);
      setDesc("");
      setImages([]);
      setError(null);
      if (categories.length > 0) {
        setCatId(categories[0].id);
      }
    }
  }, [isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!sku.trim() || !name.trim()) {
      setError("กรุณากรอกรหัส SKU และชื่อสินค้า");
      return;
    }
    setCreating(true);

    const res = await createProductAction({
      sku: sku.trim().toUpperCase(),
      name: name.trim(),
      price: Number(price),
      stock: Number(stock),
      catagoryId: catId ? Number(catId) : undefined,
      description: desc.trim() || undefined,
      imageUrl: images[0] || undefined,
      images: images,
      isActive: true,
    });

    if (res.ok) {
      onSuccess();
      onClose();
    } else {
      setError(res.error || "เกิดข้อผิดพลาดในการเพิ่มสินค้า");
    }
    setCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-surface border border-divider rounded-2xl p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-2 border-b border-divider">
          <h3 className="text-lg font-bold text-text m-0">เพิ่มสินค้าใหม่เข้าสู่คลัง</h3>
          <button
            type="button"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-700 hover:bg-bg cursor-pointer transition-colors"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-950 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-neutral-800 block mb-1">
                รหัส SKU (เช่น SKU-2130)
              </label>
              <input
                required
                className="w-full px-3 py-2 text-sm rounded-xl border border-divider bg-bg text-text outline-none focus:border-accent font-mono font-bold shadow-2xs"
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-neutral-800 block mb-1">
                หมวดหมู่สินค้า
              </label>
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
          </div>

          <div>
            <label className="text-xs font-bold text-neutral-800 block mb-1">
              ชื่อสินค้า
            </label>
            <input
              required
              className="w-full px-3 py-2 text-sm rounded-xl border border-divider bg-bg text-text outline-none focus:border-accent font-medium shadow-2xs"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
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
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Shared Image Gallery Uploader */}
          <ImageGalleryUploader
            images={images}
            onChange={setImages}
            onError={setError}
          />

          <div>
            <label className="text-xs font-bold text-neutral-800 block mb-1">
              คำอธิบายสินค้า
            </label>
            <textarea
              className="w-full px-3 py-2 text-sm rounded-xl border border-divider bg-bg text-text outline-none focus:border-accent font-medium shadow-2xs min-h-[72px]"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="ระบุรายละเอียดจุดเด่นสินค้า..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-divider">
            <button
              type="button"
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-divider bg-surface hover:bg-bg text-text transition-colors cursor-pointer"
              onClick={onClose}
              disabled={creating}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-xl bg-accent hover:bg-accent-600 active:bg-accent-700 !text-white transition-all shadow-xs cursor-pointer disabled:opacity-50"
              disabled={creating}
            >
              {creating ? "กำลังบันทึกข้อมูล..." : "บันทึกสินค้าใหม่"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
