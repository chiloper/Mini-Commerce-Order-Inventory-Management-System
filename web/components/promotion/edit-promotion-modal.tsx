"use client";

import React, { useState, useEffect } from "react";
import ConfirmModal from "../confirm-modal";
import { updatePromotionAction, deletePromotionAction } from "../../lib/ecommerce-actions";
import type { Promotion } from "@/types/ecommerce";

interface EditPromotionModalProps {
  promo: Promotion | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditPromotionModal({
  promo,
  onClose,
  onSuccess,
}: EditPromotionModalProps) {
  const [editCode, setEditCode] = useState("");
  const [editType, setEditType] = useState("PERCENTAGE");
  const [editValue, setEditValue] = useState<number>(0);
  const [editMinSubtotal, setEditMinSubtotal] = useState<number>(0);
  const [editQuota, setEditQuota] = useState<number>(1000);
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    if (promo) {
      setEditCode(promo.code || "");
      setEditType(promo.type || "PERCENTAGE");
      setEditValue(promo.value || 0);
      setEditQuota(promo.usageLimit || 1000);
      setEditError(null);
    }
  }, [promo]);

  if (!promo) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);
    setSaving(true);

    const res = await updatePromotionAction(promo.id, {
      code: editCode.trim().toUpperCase(),
      type: editType,
      value: Number(editValue),
      usageLimit: Number(editQuota),
    });

    if (res.ok) {
      onSuccess();
      onClose();
    } else {
      setEditError(res.error || "เกิดข้อผิดพลาดในการแก้ไขโปรโมชั่น");
    }
    setSaving(false);
  };

  const handleExecuteDelete = async () => {
    setDeleting(true);
    const res = await deletePromotionAction(promo.id);
    if (res.ok) {
      setIsConfirmDeleteOpen(false);
      onSuccess();
      onClose();
    } else {
      setEditError(res.error || "ไม่สามารถลบโปรโมชั่นได้");
    }
    setDeleting(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
        <div className="w-full max-w-md bg-surface border border-divider rounded-2xl p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95">
          <div className="flex justify-between items-center pb-2 border-b border-divider">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-accent-700 font-bold block">
                แก้ไขแคมเปญ
              </span>
              <h3 className="text-lg font-bold text-text m-0">{promo.code}</h3>
            </div>
            <button
              type="button"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-600 hover:bg-bg cursor-pointer transition-colors"
              onClick={onClose}
            >
              ✕
            </button>
          </div>

          {editError && (
            <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-950 text-xs font-semibold">
              {editError}
            </div>
          )}

          <form onSubmit={handleSave} className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-bold text-neutral-800 block mb-1">
                รหัสโค้ดส่วนลด
              </label>
              <input
                required
                className="w-full px-3 py-2 text-sm rounded-xl border border-divider bg-bg text-text outline-none focus:border-accent font-mono font-bold uppercase shadow-2xs"
                value={editCode}
                onChange={(e) => setEditCode(e.target.value.toUpperCase())}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-neutral-800 block mb-1">
                  ประเภทส่วนลด
                </label>
                <select
                  className="w-full px-3 py-2 text-sm rounded-xl border border-divider bg-bg text-text outline-none focus:border-accent font-medium shadow-2xs"
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                >
                  <option value="PERCENTAGE">เปอร์เซ็นต์ (%)</option>
                  <option value="FIXED">จำนวนเงินคงที่ (฿)</option>
                  <option value="FREESHIP">ส่งฟรี</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-800 block mb-1">
                  {editType === "PERCENTAGE" ? "มูลค่าส่วนลด (%)" : "มูลค่าส่วนลด (บาท)"}
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  disabled={editType === "FREESHIP"}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-divider bg-bg text-text outline-none focus:border-accent font-bold shadow-2xs disabled:opacity-50"
                  value={editType === "FREESHIP" ? 0 : editValue}
                  onChange={(e) => setEditValue(Number(e.target.value))}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-800 block mb-1">
                โควตาสูงสุด (ครั้ง)
              </label>
              <input
                type="number"
                required
                min={promo.usedCount || 1}
                className="w-full px-3 py-2 text-sm rounded-xl border border-divider bg-bg text-text outline-none focus:border-accent font-bold shadow-2xs"
                value={editQuota}
                onChange={(e) => setEditQuota(Number(e.target.value))}
              />
              <span className="text-[11px] text-neutral-600 block mt-1">
                ใช้ไปแล้ว {promo.usedCount || 0} ครั้ง
              </span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-divider mt-2">
              <button
                type="button"
                onClick={() => setIsConfirmDeleteOpen(true)}
                disabled={saving || deleting}
                className="text-xs font-bold text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                {deleting ? "กำลังลบ..." : "ลบโปรโมชั่นนี้"}
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving || deleting}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-divider bg-surface hover:bg-bg text-text transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving || deleting}
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
        isOpen={isConfirmDeleteOpen}
        title="ยืนยันการลบโปรโมชั่น"
        description={
          <span>
            คุณต้องการลบโค้ดโปรโมชั่น <strong>&quot;{promo.code}&quot;</strong> ใช่หรือไม่?
            <br />
            การดำเนินการนี้จะไม่สามารถย้อนกลับได้
          </span>
        }
        confirmText="ยืนยันลบ"
        cancelText="ยกเลิก"
        variant="danger"
        isLoading={deleting}
        onConfirm={handleExecuteDelete}
        onCancel={() => setIsConfirmDeleteOpen(false)}
      />
    </>
  );
}
