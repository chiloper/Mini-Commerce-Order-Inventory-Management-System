"use client";

import React, { useState } from "react";
import type { Product } from "@/types/ecommerce";

interface RefillStockModalProps {
  product: Product | null;
  onClose: () => void;
  onRefill: (productId: number, newStock: number) => Promise<void>;
}

export default function RefillStockModal({
  product,
  onClose,
  onRefill,
}: RefillStockModalProps) {
  const [addAmount, setAddAmount] = useState<number>(10);
  const [submitting, setSubmitting] = useState(false);

  if (!product) return null;

  const currentStock = Number(product.stock) || 0;
  const addQty = Math.max(1, Number(addAmount) || 0);
  const newTotalStock = currentStock + addQty;

  const handleSubmit = async () => {
    setSubmitting(true);
    await onRefill(product.id, newTotalStock);
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-sm bg-surface border border-divider rounded-2xl p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95">
        <div className="flex justify-between items-start pb-3 border-b border-divider">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-accent font-bold block">
              เติมสต็อกสินค้า
            </span>
            <h3 className="text-base font-bold text-text m-0">{product.name}</h3>
            <p className="text-xs font-mono text-neutral-600 m-0 mt-0.5">{product.sku}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
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
              {currentStock} ชิ้น
            </strong>
          </div>
          <div className="text-xl font-bold text-neutral-400">→</div>
          <div>
            <span className="text-accent font-bold block">สต็อกใหม่หลังเติม:</span>
            <strong className="text-base font-bold text-accent font-mono">
              {newTotalStock} ชิ้น
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
            value={addAmount}
            onChange={(e) => setAddAmount(Math.max(1, Number(e.target.value)))}
            min="1"
            autoFocus
          />

          {/* Quick Add Chips */}
          <div className="flex gap-1.5 mt-2.5">
            {[5, 10, 20, 50].map((qty) => (
              <button
                key={qty}
                type="button"
                onClick={() => setAddAmount(qty)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  addAmount === qty
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
            onClick={onClose}
            disabled={submitting}
          >
            ยกเลิก
          </button>
          <button
            type="button"
            className="px-5 py-2 text-xs font-bold rounded-xl bg-accent hover:bg-accent-600 active:bg-accent-700 !text-white transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <span>กำลังบันทึก...</span>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>เติม +{addQty} ชิ้น (เป็น {newTotalStock})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
