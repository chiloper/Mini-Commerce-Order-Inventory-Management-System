import { getCurrentUser } from "../../lib/auth/session";
import { redirect } from "next/navigation";
import { getOrders } from "../../lib/ecommerce-actions";
import Link from "next/link";

export default async function AccountPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const orders = await getOrders();

  const getStatusBadge = (statusText: string) => {
    switch (statusText) {
      case "paid":
        return <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">กำลังจัดของ</span>;
      case "wait":
        return <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-700">รอชำระเงิน</span>;
      case "sent":
        return <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">จัดส่งแล้ว</span>;
      case "hold":
        return <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">ติดปัญหาสต็อก</span>;
      default:
        return <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">สำเร็จ</span>;
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Profile Card */}
      <div className="mb-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">
                {user.email[0].toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold text-neutral-900">{user.email}</h1>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      user.role === "admin"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    บทบาท: {user.role}
                  </span>
                  <span className="text-xs text-neutral-500">รหัสบัญชี #{user.id}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              href="/list"
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-xs"
            >
              ไปเลือกซื้อสินค้า
            </Link>
            {user.role === "admin" && (
              <Link
                href="/dashboard"
                className="rounded-lg border border-purple-300 bg-purple-50 px-4 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-100 transition-colors"
              >
                เข้าแดชบอร์ดแอดมิน
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Orders History */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-neutral-900">
            ประวัติคำสั่งซื้อของฉัน ({orders.length} รายการ)
          </h2>
        </div>

        {orders.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-neutral-500">ยังไม่มีประวัติการสั่งซื้อ</p>
            <Link
              href="/list"
              className="mt-3 inline-block rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
            >
              เริ่มเลือกซื้อสินค้า
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-700">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-semibold text-neutral-500">
                <tr>
                  <th className="py-3 px-4">เลขที่คำสั่งซื้อ</th>
                  <th className="py-3 px-4">วันที่สั่งซื้อ</th>
                  <th className="py-3 px-4">รายการสินค้า</th>
                  <th className="py-3 px-4">ยอดรวม</th>
                  <th className="py-3 px-4">วิธีชำระเงิน</th>
                  <th className="py-3 px-4 text-right">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {orders.map((ord: any) => {
                  const breakdown = (typeof ord.discountBreakdown === "object" ? ord.discountBreakdown : {}) as any;
                  return (
                    <tr key={ord.id} className="hover:bg-neutral-50/50">
                      <td className="py-3.5 px-4 font-mono font-semibold text-blue-600">
                        #{ord.id.toString().padStart(5, "0")}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-neutral-500">
                        {new Date(ord.createdAt).toLocaleDateString("th-TH", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {ord.orderItems?.map((it: any) => it.product?.name || `สินค้า #${it.productId}`).join(", ") || "-"}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-neutral-900">
                        ฿{ord.total.toLocaleString("th-TH")}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-neutral-600">
                        {breakdown.paymentMethod || "พร้อมเพย์"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
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
