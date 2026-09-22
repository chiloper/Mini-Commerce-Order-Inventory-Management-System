"use client";

import React, { useState, useEffect } from "react";
import { updateCategoryAction } from "@/lib/ecommerce-actions";
import type { Category } from "@/types/ecommerce";

interface EditCategoryModalProps {
  category: Category | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditCategoryModal({
  category,
  isOpen,
  onClose,
  onSuccess,
}: EditCategoryModalProps) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (category) {
      setName(category.name || "");
      setError(null);
      setSaving(false);
    }
  }, [category, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, saving, onClose]);

  if (!isOpen || !category) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("กรุณาระบุชื่อหมวดหมู่สินค้า");
      return;
    }

    setSaving(true);
    setError(null);

    const res = await updateCategoryAction(category.id, trimmed);
    if (res.ok) {
      onSuccess();
      onClose();
    } else {
      setError(res.error || "ไม่สามารถแก้ไขหมวดหมู่ได้ โปรดลองอีกครั้ง");
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={() => !saving && onClose()}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-surface border border-divider rounded-2xl shadow-xl z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col p-6 gap-5">
        <div className="flex items-center justify-between border-b border-divider pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-text m-0">แก้ไขหมวดหมู่สินค้า</h3>
              <span className="text-xs font-mono font-bold text-neutral-500 bg-bg px-2 py-0.5 rounded border border-divider">
                #{category.id}
              </span>
            </div>
            <p className="text-xs text-neutral-600 m-0 mt-0.5 font-medium">
              แก้ไขชื่อหมวดหมู่นี้ สินค้าที่ผูกอยู่จะได้รับการอัปเดตอัตโนมัติ
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="w-8 h-8 rounded-full bg-bg hover:bg-neutral-200 text-neutral-600 flex items-center justify-center cursor-pointer transition-colors font-bold disabled:opacity-50"
            title="ปิด"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text">
              ชื่อหมวดหมู่สินค้า <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ระบุชื่อหมวดหมู่"
              disabled={saving}
              className="w-full px-3.5 py-2.5 rounded-xl border border-divider bg-bg text-text text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all shadow-2xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-divider">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-divider bg-surface hover:bg-bg text-text transition-colors cursor-pointer disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-accent hover:bg-accent-600 active:bg-accent-700 !text-white transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && (
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeDasharray="30" strokeDashoffset="10" />
                </svg>
              )}
              <span>{saving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditCategoryModal;
