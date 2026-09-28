"use client";

import React, { useState } from "react";
import { createPromotionAction } from "../../lib/ecommerce-actions";

interface CreatePromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreatePromotionModal({
  isOpen,
  onClose,
  onSuccess,
}: CreatePromotionModalProps) {
  const [newCode, setNewCode] = useState("");
  const [newType, setNewType] = useState("PERCENTAGE");
  const [newValue, setNewValue] = useState(10);
  const [newMinSubtotal, setNewMinSubtotal] = useState(1000);
  const [newQuota, setNewQuota] = useState(1000);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    if (!newCode.trim()) {
      setCreateError("กรุณากรอกโค้ดโปรโมชั่น");
      return;
    }
    setCreating(true);

    const now = new Date();
    const expiresAt = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()).toISOString();

    const res = await createPromotionAction({
      code: newCode.trim().toUpperCase(),
      type: newType,
      value: Number(newValue),
      usageLimit: Number(newQuota),
      expiresAt,
    });

    if (res.ok) {
      setNewCode("");
      setNewType("PERCENTAGE");
      setNewValue(10);
      setNewMinSubtotal(1000);
      setNewQuota(1000);
      onSuccess();
      onClose();
    } else {
      setCreateError(res.error || "เกิดข้อผิดพลาดในการสร้างโปรโมชั่น");
    }
    setCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-md bg-surface border border-divider rounded-2xl p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95">
        <div className="flex justify-between items-center pb-2 border-b border-divider">
          <h3 className="text-lg font-bold text-text m-0">สร้างแคมเปญโปรโมชั่นใหม่</h3>
          <button
            type="button"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-600 hover:bg-bg cursor-pointer transition-colors"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {createError && (
          <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-950 text-xs font-semibold">
            {createError}
          </div>
        )}

        <form onSubmit={handleCreate} className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-bold text-neutral-800 block mb-1">
              รหัสโค้ดส่วนลด (เช่น SUMMER2026)
            </label>
            <input
              required
              className="w-full px-3 py-2 text-sm rounded-xl border border-divider bg-bg text-text outline-none focus:border-accent font-mono font-bold uppercase shadow-2xs"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              placeholder="SUMMER2026"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-neutral-800 block mb-1">
                ประเภทส่วนลด
              </label>
              <select
                className="w-full px-3 py-2 text-sm rounded-xl border border-divider bg-bg text-text outline-none focus:border-accent font-medium shadow-2xs"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
              >
                <option value="PERCENTAGE">เปอร์เซ็นต์ (%)</option>
                <option value="FIXED">จำนวนเงินคงที่ (฿)</option>
                <option value="FREESHIP">ส่งฟรี</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-neutral-800 block mb-1">
                {newType === "PERCENTAGE" ? "มูลค่าส่วนลด (%)" : "มูลค่าส่วนลด (บาท)"}
              </label>
              <input
                type="number"
                required
                min="0"
                disabled={newType === "FREESHIP"}
                className="w-full px-3 py-2 text-sm rounded-xl border border-divider bg-bg text-text outline-none focus:border-accent font-bold shadow-2xs disabled:opacity-50"
                value={newType === "FREESHIP" ? 0 : newValue}
                onChange={(e) => setNewValue(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-neutral-800 block mb-1">
                ยอดซื้อขั้นต่ำ (บาท)
              </label>
              <input
                type="number"
                min="0"
                className="w-full px-3 py-2 text-sm rounded-xl border border-divider bg-bg text-text outline-none focus:border-accent font-medium shadow-2xs"
                value={newMinSubtotal}
                onChange={(e) => setNewMinSubtotal(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-neutral-800 block mb-1">
                โควตาสูงสุด (ครั้ง)
              </label>
              <input
                type="number"
                required
                min="1"
                className="w-full px-3 py-2 text-sm rounded-xl border border-divider bg-bg text-text outline-none focus:border-accent font-bold shadow-2xs"
                value={newQuota}
                onChange={(e) => setNewQuota(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-divider mt-2">
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
              {creating ? "กำลังสร้าง..." : "สร้างโปรโมชั่น"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
