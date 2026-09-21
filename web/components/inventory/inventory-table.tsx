"use client";

import React, { useState } from "react";
import AdminPagination from "../admin-pagination";
import type { Product } from "@/types/ecommerce";

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

export interface DecoratedProduct extends Product {
  avail: number;
  isArchived: boolean;
  isLow: boolean;
  isOut: boolean;
  statusLabel: string;
  statusCls: string;
  barW: string;
  barColor: string;
  rowBg: string;
}

interface InventoryTableProps {
  products: DecoratedProduct[];
  loading: boolean;
  search: string;
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (newPage: number) => void;
  onOpenEdit: (p: Product) => void;
  onOpenRefill: (p: Product) => void;
}

export default function InventoryTable({
  products,
  loading,
  search,
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onOpenEdit,
  onOpenRefill,
}: InventoryTableProps) {
  const formatPrice = (n: number) => `฿${(n || 0).toLocaleString("th-TH")}`;

  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-neutral-600 font-medium border border-divider rounded-2xl bg-surface shadow-2xs">
        กำลังโหลดข้อมูลคลังสินค้า...
      </div>
    );
  }

  return (
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
          {products.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-16 text-center text-sm font-medium text-neutral-600">
                {search ? `ไม่พบสินค้าที่ตรงกับการค้นหา "${search}"` : "ไม่มีรายการสินค้าในหมวดหมู่นี้"}
              </td>
            </tr>
          ) : (
            products.map((p) => (
              <tr
                key={p.id}
                className={`hover:bg-bg/50 transition-colors ${
                  p.isArchived
                    ? "opacity-75 bg-neutral-100/50"
                    : p.isLow
                    ? "bg-rose-50/30"
                    : ""
                }`}
              >
                <td className="py-3.5 px-3.5 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => onOpenEdit(p)}
                    className="font-mono font-bold text-accent hover:text-accent-700 hover:underline cursor-pointer inline-flex items-center gap-1.5 group transition-colors"
                    title="คลิกที่ SKU เพื่อแก้ไขข้อมูลสินค้านี้"
                  >
                    <span>{p.sku}</span>
                    <svg
                      className="w-3.5 h-3.5 text-accent/50 group-hover:text-accent transition-colors"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
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
                    onClick={() => onOpenRefill(p)}
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

      <div className="p-4 border-t border-divider">
        <AdminPagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={onPageChange}
          loading={loading}
        />
      </div>
    </div>
  );
}
