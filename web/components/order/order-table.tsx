"use client";

import React from "react";
import AdminPagination from "../admin-pagination";

export interface DecoratedOrder {
  id: number;
  rawStatus: string;
  statusLabel: string;
  statusCls: string;
  stockNote: string;
  stockColor: string;
  customerName: string;
  phone: string;
  shippingAddress: string;
  paymentMethod: string;
  channel: string;
  isManual: boolean;
  totalAmount: number;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  promoCode: string | null;
  promoDescription: string | null;
  items: Array<{
    name?: string;
    sku?: string;
    price?: number;
    quantity?: number;
    productId?: number | null;
    product?: { name?: string; sku?: string; price?: number };
  }>;
  itemsCount: number;
  time: string;
  dateStr: string;
}

interface OrderTableProps {
  orders: DecoratedOrder[];
  loading: boolean;
  search: string;
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (newPage: number) => void;
  onSelectOrder: (order: DecoratedOrder) => void;
}

export default function OrderTable({
  orders,
  loading,
  search,
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onSelectOrder,
}: OrderTableProps) {
  const formatPrice = (n: number) => `฿${(n || 0).toLocaleString("th-TH")}`;

  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-neutral-600 font-medium border border-divider rounded-2xl bg-surface shadow-2xs">
        กำลังโหลดข้อมูลคำสั่งซื้อ...
      </div>
    );
  }

  return (
    <div className="border border-divider rounded-2xl bg-surface overflow-x-auto shadow-2xs">
      <table className="w-full text-left text-xs border-collapse min-w-[760px]">
        <thead>
          <tr className="border-b border-divider text-neutral-700 font-bold tracking-wider uppercase text-[11px] bg-bg/40">
            <th className="py-3.5 px-3.5 whitespace-nowrap">ออเดอร์</th>
            <th className="py-3.5 px-3.5 whitespace-nowrap">วันที่ & เวลา</th>
            <th className="py-3.5 px-3.5 min-w-[150px]">ลูกค้า</th>
            <th className="py-3.5 px-3.5 whitespace-nowrap">ช่องทาง & ชำระเงิน</th>
            <th className="py-3.5 px-3.5 whitespace-nowrap text-center">รายการ</th>
            <th className="py-3.5 px-3.5 whitespace-nowrap text-right">ยอดสุทธิ</th>
            <th className="py-3.5 px-3.5 whitespace-nowrap text-center">สถานะ</th>
            <th className="py-3.5 px-3.5 whitespace-nowrap text-right">จัดการ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-divider text-neutral-800">
          {orders.length === 0 ? (
            <tr>
              <td colSpan={8} className="py-16 text-center text-sm font-medium text-neutral-600">
                {search ? `ไม่พบคำสั่งซื้อที่ตรงกับการค้นหา "${search}"` : "ไม่มีรายการคำสั่งซื้อ"}
              </td>
            </tr>
          ) : (
            orders.map((o) => (
              <tr key={o.id} className="hover:bg-bg/50 transition-colors">
                {/* Order ID */}
                <td className="py-3.5 px-3.5 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => onSelectOrder(o)}
                    className="font-mono font-bold text-accent hover:text-accent-700 hover:underline cursor-pointer inline-flex items-center gap-1 group"
                    title="คลิกเพื่อดูรายละเอียดคำสั่งซื้อ"
                  >
                    <span>#{o.id}</span>
                    <svg className="w-3.5 h-3.5 text-accent/50 group-hover:text-accent transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                </td>

                {/* Date & Time */}
                <td className="py-3.5 px-3.5 whitespace-nowrap text-neutral-600">
                  <span className="font-semibold text-text block">{o.dateStr}</span>
                  <span className="text-[11px] text-neutral-600 font-mono">{o.time}</span>
                </td>

                {/* Customer Info */}
                <td className="py-3.5 px-3.5">
                  <span className="font-semibold text-text block max-w-[160px] truncate" title={o.customerName}>
                    {o.customerName}
                  </span>
                  {o.phone && (
                    <span className="text-[11px] text-neutral-600 font-mono block">
                      {o.phone}
                    </span>
                  )}
                </td>

                {/* Channel & Payment */}
                <td className="py-3.5 px-3.5 whitespace-nowrap">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-200 block w-fit mb-0.5">
                    {o.channel}
                  </span>
                  <span className="text-[11px] text-neutral-600 font-medium">
                    {o.paymentMethod}
                  </span>
                </td>

                {/* Items count */}
                <td className="py-3.5 px-3.5 whitespace-nowrap text-center font-mono font-bold text-neutral-700">
                  {o.itemsCount} ชิ้น
                </td>

                {/* Total amount */}
                <td className="py-3.5 px-3.5 whitespace-nowrap text-right font-mono font-bold text-text">
                  {formatPrice(o.totalAmount)}
                </td>

                {/* Status Badges */}
                <td className="py-3.5 px-3.5 whitespace-nowrap text-center">
                  <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${o.statusCls}`}>
                    {o.statusLabel}
                  </span>
                  {o.stockNote && (
                    <span className={`text-[10px] font-semibold block mt-0.5 ${o.stockColor}`}>
                      {o.stockNote}
                    </span>
                  )}
                </td>

                {/* Action */}
                <td className="py-3.5 px-3.5 whitespace-nowrap text-right">
                  <button
                    type="button"
                    onClick={() => onSelectOrder(o)}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl border border-divider bg-surface hover:bg-bg text-text transition-all shadow-2xs cursor-pointer"
                  >
                    ดูรายละเอียด
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
