import { getCurrentUser } from "../../lib/auth/session";
import { redirect } from "next/navigation";
import { getOrders } from "../../lib/ecommerce-actions";
import Link from "next/link";
import type { Order } from "@/types/ecommerce";
import AccountOrdersList from "../../components/account-orders-list";

export default async function AccountPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const orders: Order[] = await getOrders();
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

        <AccountOrdersList orders={orders} />
      </div>
    </div>
  );
}
