"use client";

import React from "react";
import AdminPagination from "../admin-pagination";
import type { Promotion } from "@/types/ecommerce";

export interface DecoratedPromotion extends Promotion {
  usedText: string;
  barW: string;
  barColor: string;
  condText: string;
  typeText: string;
  statusLabel: string;
  statusCls: string;
  rangeText: string;
}

interface PromotionTableProps {
  promos: DecoratedPromotion[];
  loading: boolean;
  search: string;
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (newPage: number) => void;
  onOpenEdit: (p: Promotion) => void;
}

export default function PromotionTable({
  promos,
  loading,
  search,
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onOpenEdit,
}: PromotionTableProps) {
  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-neutral-600 font-medium border border-divider rounded-2xl bg-surface shadow-2xs">
        กำลังโหลดข้อมูลโปรโมชั่น...
      </div>
    );
  }

  return (
    <div className="border border-divider rounded-2xl bg-surface overflow-x-auto shadow-2xs">
      <table className="w-full text-left text-xs border-collapse min-w-[700px]">
        <thead>
          <tr className="border-b border-divider text-neutral-700 font-bold tracking-wider uppercase text-[11px] bg-bg/40">
            <th className="py-3.5 px-3.5 whitespace-nowrap">โค้ดส่วนลด (แก้ไข)</th>
            <th className="py-3.5 px-3.5 whitespace-nowrap">ประเภทส่วนลด</th>
            <th className="py-3.5 px-3.5 whitespace-nowrap">เงื่อนไขขั้นต่ำ</th>
            <th className="py-3.5 px-3.5 min-w-[170px]">การใช้งานโควตา</th>
            <th className="py-3.5 px-3.5 whitespace-nowrap text-center">สถานะ</th>
            <th className="py-3.5 px-3.5 whitespace-nowrap">ระยะเวลา</th>
            <th className="py-3.5 px-3.5 whitespace-nowrap text-right">จัดการ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-divider text-neutral-800">
          {promos.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-16 text-center text-sm font-medium text-neutral-600">
                {search ? `ไม่พบแคมเปญที่ตรงกับการค้นหา "${search}"` : "ยังไม่มีแคมเปญโปรโมชั่น"}
              </td>
            </tr>
          ) : (
            promos.map((c) => (
              <tr key={c.id} className="hover:bg-bg/50 transition-colors">
                <td className="py-3.5 px-3.5 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => onOpenEdit(c)}
                    className="font-mono font-bold text-accent hover:text-accent-700 hover:underline cursor-pointer inline-flex items-center gap-1.5 group transition-colors"
                    title="คลิกที่โค้ดเพื่อแก้ไขโปรโมชั่นนี้"
                  >
                    <span>{c.code}</span>
                    <svg className="w-3.5 h-3.5 text-accent/50 group-hover:text-accent transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                </td>
                <td className="py-3.5 px-3.5 font-bold text-text whitespace-nowrap">
                  {c.typeText}
                </td>
                <td className="py-3.5 px-3.5 text-neutral-600 font-mono whitespace-nowrap">
                  {c.condText}
                </td>
                <td className="py-3.5 px-3.5 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-neutral-200 rounded-full overflow-hidden shrink-0">
                      <div className={`h-full rounded-full ${c.barColor}`} style={{ width: c.barW }} />
                    </div>
                    <span className="text-xs font-mono font-bold text-text shrink-0">
                      {c.usedText}
                    </span>
                  </div>
                </td>
                <td className="py-3.5 px-3.5 whitespace-nowrap text-center">
                  <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${c.statusCls}`}>
                    {c.statusLabel}
                  </span>
                </td>
                <td className="py-3.5 px-3.5 text-neutral-600 whitespace-nowrap font-mono text-[11px]">
                  {c.rangeText}
                </td>
                <td className="py-3.5 px-3.5 whitespace-nowrap text-right">
                  <button
                    type="button"
                    onClick={() => onOpenEdit(c)}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl border border-divider bg-surface hover:bg-bg text-text transition-all shadow-2xs cursor-pointer"
                  >
                    แก้ไข
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
