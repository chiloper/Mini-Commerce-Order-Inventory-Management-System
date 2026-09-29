"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "../../../components/admin-sidebar";
import ConfirmModal from "../../../components/confirm-modal";
import OrderToolbar from "../../../components/order/order-toolbar";
import OrderTable, { DecoratedOrder } from "../../../components/order/order-table";
import OrderDetailsModal from "../../../components/order/order-details-modal";
import CreateOrderModal from "../../../components/order/create-order-modal";
import { getPaginatedOrders, exportOrdersAction } from "../../../lib/ecommerce-actions";
import { getSessionUserAction } from "../../../lib/auth/actions";
import type { Order } from "@/types/ecommerce";

export default function AdminOrderPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [exporting, setExporting] = useState(false);

  // Modals state
  const [selectedOrder, setSelectedOrder] = useState<DecoratedOrder | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // In-app Alert Modal State (Replaces browser alert)
  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    variant: "info" | "warning" | "danger" | "success";
  }>({
    isOpen: false,
    title: "",
    description: "",
    variant: "info",
  });

  const showAlert = (
    title: string,
    description: string,
    variant: "info" | "warning" | "danger" | "success" = "info"
  ) => {
    setAlertConfig({
      isOpen: true,
      title,
      description,
      variant,
    });
  };

  const loadOrders = async (
    targetPage = page,
    targetFilter = filter,
    targetDateRange = dateRange,
    targetSearch = search
  ) => {
    setLoading(true);
    const res = await getPaginatedOrders({
      page: targetPage,
      limit,
      status: targetFilter,
      dateRange: targetDateRange,
      search: targetSearch,
    });
    setOrders(res.data);
    setPage(res.page);
    setTotal(res.total);
    setTotalPages(res.totalPages);
    setLoading(false);
  };

  useEffect(() => {
    getSessionUserAction().then((u) => {
      if (!u || u.role !== "admin") {
        router.push("/admin/console");
        return;
      }
      loadOrders(1, filter, dateRange, search);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setPage(1);
    loadOrders(1, newFilter, dateRange, search);
  };

  const handleDateRangeChange = (newRange: string) => {
    setDateRange(newRange);
    setPage(1);
    loadOrders(1, filter, newRange, search);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    loadOrders(newPage, filter, dateRange, search);
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadOrders(1, filter, dateRange, search);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Decorate order with human-readable status, channel, breakdown, and date strings
  const decorate = (o: Order): DecoratedOrder => {
    let bd: Record<string, unknown> = {};
    if (o.discountBreakdown) {
      if (typeof o.discountBreakdown === "string") {
        try {
          bd = JSON.parse(o.discountBreakdown);
        } catch {
          bd = {};
        }
      } else {
        bd = o.discountBreakdown as Record<string, unknown>;
      }
    }

    const rawStatus = (bd.statusText as string) || (o.status ? "paid" : "pending");
    let statusLabel = "ชำระแล้ว";
    let statusCls = "bg-emerald-100 text-emerald-900 border border-emerald-300";
    let stockNote = "ตัดสต็อกแล้ว";
    let stockColor = "text-emerald-700";

    if (rawStatus === "cancelled") {
      statusLabel = "ยกเลิก";
      statusCls = "bg-rose-100 text-rose-900 border border-rose-300";
      stockNote = "คืนสต็อกแล้ว";
      stockColor = "text-rose-700";
    } else if (rawStatus === "shipped") {
      statusLabel = "จัดส่งแล้ว";
      statusCls = "bg-purple-100 text-purple-900 border border-purple-300";
      stockNote = "ตัดสต็อกแล้ว";
      stockColor = "text-purple-700";
    } else if (rawStatus === "processing") {
      statusLabel = "กำลังจัดของ";
      statusCls = "bg-sky-100 text-sky-900 border border-sky-300";
      stockNote = "ตัดสต็อกแล้ว";
      stockColor = "text-sky-700";
    } else if (rawStatus === "pending") {
      statusLabel = "รอชำระ";
      statusCls = "bg-amber-100 text-amber-900 border border-amber-300";
      stockNote = "ยังไม่ตัดสต็อก";
      stockColor = "text-amber-700";
    }

    const customerName = (bd.customerName as string) || (bd.shippingName as string) || "ลูกค้าทั่วไป";
    const phone = (bd.phone as string) || (bd.shippingPhone as string) || "";
    const shippingAddress = (bd.shippingAddress as string) || "";
    const paymentMethod = (bd.paymentMethod as string) || "โอนเงิน / พร้อมเพย์";
    const channel = (bd.channel as string) || ((bd.isManual as boolean) ? "หน้าร้าน / Walk-in" : "สั่งซื้อผ่านเว็บ");
    const isManual = (bd.isManual as boolean) || false;

    const subtotal = Number(bd.subtotal) || o.total;
    const discountAmount = Number(bd.discountAmount) || 0;
    const shippingFee = Number(bd.shippingFee) || 0;
    const promoCode = (bd.promoCode as string) || null;
    const promoDescription = (bd.promoDescription as string) || null;

    const items = Array.isArray(bd.items)
      ? (bd.items as DecoratedOrder["items"])
      : (o.orderItems || []).map((it) => ({
          productId: it.productId,
          name: it.product?.name,
          sku: it.product?.sku,
          price: it.product?.price,
          quantity: 1,
        }));

    const itemsCount = items.reduce((acc, it) => acc + (it.quantity || 1), 0);

    const d = o.createdAt ? new Date(o.createdAt) : new Date();
    const time = !isNaN(d.getTime())
      ? d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })
      : "-";
    const dateStr = !isNaN(d.getTime())
      ? d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })
      : "-";

    return {
      ...o,
      rawStatus,
      statusLabel,
      statusCls,
      stockNote,
      stockColor,
      customerName,
      phone,
      shippingAddress,
      paymentMethod,
      channel,
      isManual,
      totalAmount: o.total,
      subtotal,
      discountAmount,
      shippingFee,
      promoCode,
      promoDescription,
      items,
      itemsCount,
      time,
      dateStr,
    };
  };

  const decoratedOrders: DecoratedOrder[] = orders.map(decorate);

  // Handle Export Filtered Orders to CSV (with UTF-8 BOM)
  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const allOrders = await exportOrdersAction({
        status: filter,
        dateRange,
        search,
      });

      if (!allOrders || allOrders.length === 0) {
        showAlert(
          "ไม่พบข้อมูลคำสั่งซื้อ",
          "ไม่พบข้อมูลคำสั่งซื้อตามตัวกรองที่เลือกสำหรับส่งออกไฟล์ CSV",
          "warning"
        );
        setExporting(false);
        return;
      }

      const escapeCsv = (val: unknown) => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      const headers = [
        "เลขออเดอร์",
        "วันที่สั่งซื้อ",
        "เวลา",
        "ชื่อลูกค้า",
        "เบอร์โทรศัพท์",
        "ที่อยู่จัดส่ง",
        "ช่องทางการขาย",
        "วิธีชำระเงิน",
        "รายการสินค้า",
        "จำนวนชิ้นรวม",
        "ยอดรวมสินค้า (บาท)",
        "ส่วนลด (บาท)",
        "โค้ดโปรโมชั่น",
        "ค่าจัดส่ง (บาท)",
        "ยอดสุทธิทั้งสิ้น (บาท)",
        "สถานะคำสั่งซื้อ",
        "สถานะสต็อก",
      ];

      const rows = allOrders.map((o) => {
        const dec = decorate(o);
        const itemsSummary = dec.items
          .map((i) => `${i.name || i.product?.name || "สินค้า"} x${i.quantity || 1}`)
          .join(" | ");

        return [
          escapeCsv(`#${o.id}`),
          escapeCsv(dec.dateStr),
          escapeCsv(dec.time),
          escapeCsv(dec.customerName),
          escapeCsv(dec.phone),
          escapeCsv(dec.shippingAddress || "รับที่ร้าน / Walk-in"),
          escapeCsv(dec.channel),
          escapeCsv(dec.paymentMethod),
          escapeCsv(itemsSummary),
          escapeCsv(dec.itemsCount),
          escapeCsv(dec.subtotal),
          escapeCsv(dec.discountAmount),
          escapeCsv(dec.promoCode || "-"),
          escapeCsv(dec.shippingFee),
          escapeCsv(dec.totalAmount),
          escapeCsv(dec.statusLabel),
          escapeCsv(dec.stockNote),
        ].join(",");
      });

      const csvContent = "\uFEFF" + [headers.map(escapeCsv).join(","), ...rows].join("\r\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const dateStr = new Date().toISOString().slice(0, 10);
      link.setAttribute("href", url);
      link.setAttribute("download", `orders_export_${filter}_${dateRange}_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export Orders CSV error:", err);
      showAlert("เกิดข้อผิดพลาด", "เกิดข้อผิดพลาดในการส่งออกไฟล์ CSV กรุณาลองใหม่อีกครั้ง", "danger");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-bg text-text">
      {/* Sidebar Navigation */}
      <AdminSidebar />

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
          {/* Modular Order Toolbar */}
          <OrderToolbar
            filter={filter}
            onFilterChange={handleFilterChange}
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            search={search}
            onSearchChange={setSearch}
            total={total}
            page={page}
            totalPages={totalPages}
            exporting={exporting}
            loading={loading}
            onExportCsv={handleExportCsv}
            onOpenCreate={() => setIsCreateModalOpen(true)}
          />

          {/* Modular Order Table */}
          <OrderTable
            orders={decoratedOrders}
            loading={loading}
            search={search}
            page={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={handlePageChange}
            onSelectOrder={setSelectedOrder}
          />
        </main>

      {/* Modular Order Details Modal */}
      <OrderDetailsModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onStatusUpdated={() => loadOrders(page, filter, dateRange, search)}
        onShowAlert={showAlert}
      />

      {/* Modular Create Order Modal */}
      <CreateOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => loadOrders(1, filter, dateRange, search)}
        onShowAlert={showAlert}
      />

      {/* In-app Alert Modal (Replaces browser alert) */}
      <ConfirmModal
        isOpen={alertConfig.isOpen}
        title={alertConfig.title}
        description={alertConfig.description}
        confirmText="ตกลง"
        cancelText={null}
        variant={alertConfig.variant}
        onConfirm={() => setAlertConfig((prev) => ({ ...prev, isOpen: false }))}
        onCancel={() => setAlertConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}