import { getCurrentUser } from "../../lib/auth/session";
import { redirect } from "next/navigation";
import { getOrders } from "../../lib/ecommerce-actions";
import Link from "next/link";
import type { Order, OrderItem } from "@/types/ecommerce";

export default async function AccountPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const orders: Order[] = await getOrders();

  const getStatusBadge = (statusText: string) => {
    switch (statusText) {
      case "paid":
        return <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">กำลังจัดของ</span>;
      case "wait":
        return <span className="rounded-full bg-neutral-200 px-2.5 py-0.5 text-xs font-semibold text-neutral-700">รอชำระเงิน</span>;
      case "sent":
        return <span className="rounded-full bg-accent-100 px-2.5 py-0.5 text-xs font-semibold text-accent-800">จัดส่งแล้ว</span>;
      case "hold":
        return <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">ติดปัญหาสต็อก</span>;
      default:
        return <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">สำเร็จ</span>;
    }
  };

  const displayName = user.email.split("@")[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 pb-20">
      {/* Profile Card */}
      <div className="mb-8 rounded-2xl border border-divider bg-surface p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-2xl font-bold text-white shadow-xs">
              {displayName[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-text">{displayName}</h1>
              <p className="text-xs text-neutral-700 font-medium mt-0.5">{user.email}</p>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    user.role === "admin"
                      ? "bg-purple-100 text-purple-800 border border-purple-200"
                      : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  }`}
                >
                  {user.role === "admin" ? "ผู้ดูแลระบบ (Admin)" : "สมาชิก (Member)"}
                </span>
                <span className="text-[11px] text-neutral-700 font-mono font-semibold">ID #{user.id}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/list"
              className="rounded-xl bg-accent hover:bg-accent-600 active:bg-accent-700 px-4 py-2 text-xs font-bold !text-white transition-colors shadow-xs"
            >
              เลือกซื้อสินค้า
            </Link>
            {user.role === "admin" && (
              <Link
                href="/admin/console"
                className="rounded-xl border border-purple-200 bg-purple-50 px-4 py-2 text-xs font-bold text-purple-800 hover:bg-purple-100 transition-colors"
              >
                จัดการหลังร้าน (Admin)
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Orders History */}
      <div className="rounded-2xl border border-divider bg-surface p-6 shadow-xs">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-text">
            ประวัติคำสั่งซื้อของฉัน ({orders.length} รายการ)
          </h2>
        </div>

        {orders.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-neutral-800 font-semibold mb-3">ยังไม่มีประวัติการสั่งซื้อ</p>
            <Link
              href="/list"
              className="inline-block rounded-xl bg-accent hover:bg-accent-600 active:bg-accent-700 px-5 py-2.5 text-xs font-bold !text-white transition-colors shadow-xs"
            >
              เริ่มเลือกซื้อสินค้า
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-neutral-800">
              <thead className="border-b border-divider bg-bg text-xs font-bold text-neutral-800 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">เลขที่คำสั่งซื้อ</th>
                  <th className="py-3 px-4">วันที่สั่งซื้อ</th>
                  <th className="py-3 px-4">รายการสินค้า</th>
                  <th className="py-3 px-4">ยอดรวม</th>
                  <th className="py-3 px-4">วิธีชำระเงิน</th>
                  <th className="py-3 px-4 text-right">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {orders.map((ord: Order) => {
                  const breakdown = ord.discountBreakdown || {};
                  return (
                    <tr key={ord.id} className="hover:bg-bg/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-accent-900">
                        #{ord.id.toString().padStart(5, "0")}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-neutral-700 font-medium whitespace-nowrap">
                        {new Date(ord.createdAt).toLocaleDateString("th-TH", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-text max-w-[240px] truncate">
                        {ord.orderItems?.map((it: OrderItem) => it.product?.name || `สินค้า #${it.productId}`).join(", ") || "-"}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-text whitespace-nowrap">
                        ฿{ord.total.toLocaleString("th-TH")}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-neutral-800 font-medium">
                        {breakdown.paymentMethod || "พร้อมเพย์"}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {getStatusBadge(breakdown.statusText || (ord.status ? "paid" : "hold"))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
