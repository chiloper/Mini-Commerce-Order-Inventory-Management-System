"use client";

import React from "react";
import type { Category } from "@/types/ecommerce";

interface CategoryTableProps {
  categories: Category[];
  loading: boolean;
  search: string;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

export function CategoryTable({
  categories,
  loading,
  search,
  onEdit,
  onDelete,
}: CategoryTableProps) {
  if (loading) {
    return (
      <div className="py-24 text-center text-sm font-medium text-neutral-600 bg-surface rounded-2xl border border-divider">
        <div className="inline-flex items-center gap-2">
          <svg className="w-5 h-5 animate-spin text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" strokeDasharray="30" strokeDashoffset="10" />
          </svg>
          <span>กำลังโหลดข้อมูลหมวดหมู่...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-divider bg-surface shadow-xs">
      <table className="w-full text-left border-collapse text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-divider bg-bg/60 text-neutral-700 text-xs font-bold uppercase tracking-wider">
            <th className="py-3.5 px-4 whitespace-nowrap w-24">รหัส (ID)</th>
            <th className="py-3.5 px-4 whitespace-nowrap">ชื่อหมวดหมู่สินค้า</th>
            <th className="py-3.5 px-4 whitespace-nowrap text-center w-36">สินค้าในหมวด</th>
            <th className="py-3.5 px-4 whitespace-nowrap text-right w-44">จัดการ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-divider text-text">
          {categories.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-16 text-center text-sm font-medium text-neutral-600">
                {search ? `ไม่พบหมวดหมู่ที่ตรงกับการค้นหา "${search}"` : "ยังไม่มีหมวดหมู่สินค้าในระบบ"}
              </td>
            </tr>
          ) : (
            categories.map((c) => {
              const productCount = c._count?.products || 0;

              return (
                <tr key={c.id} className="hover:bg-bg/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-semibold text-neutral-600 whitespace-nowrap">
                    #{c.id}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-text">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-accent/60 shrink-0" />
                      <span className="font-bold text-sm text-text">{c.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap text-center">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-neutral-100 border border-divider text-neutral-700">
                      <span>{productCount.toLocaleString("th-TH")}</span>
                      <span className="font-sans font-normal text-[11px] text-neutral-500">รายการ</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEdit(c)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-divider bg-surface hover:bg-bg text-text hover:border-neutral-400 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                        title="แก้ไขชื่อหมวดหมู่"
                      >
                        <svg className="w-3.5 h-3.5 text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        <span>แก้ไข</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(c)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-divider hover:border-rose-300 bg-surface hover:bg-rose-50 text-neutral-600 hover:text-rose-700 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                        title="ลบหมวดหมู่นี้"
                      >
                        <svg className="w-3.5 h-3.5 text-neutral-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        <span>ลบ</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default CategoryTable;
