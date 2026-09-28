"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSessionUserAction, loginAction, logoutAction } from "../../../lib/auth/actions";
import { PublicUser } from "../../../lib/auth/type";

export default function AdminConsoleLoginPage() {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getSessionUserAction().then((u) => {
      setUser(u);
      setLoading(false);
      // If already logged in as admin, redirect directly to dashboard
      if (u && u.role === "admin") {
        router.push("/dashboard");
      }
    });
  }, [router]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    try {
      const res = await loginAction(null, formData);
      if (!res.success || !res.user) {
        setError(res.error || "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
        setSubmitting(false);
        return;
      }

      // Check role strictly
      if (res.user.role !== "admin") {
        setError("ปฏิเสธการเข้าถึง: บัญชีของคุณไม่ใช่ผู้ดูแลระบบ (Admin) ไม่สามารถเข้าใช้งาน Admin Console ได้");
        setSubmitting(false);
        return;
      }

      // Admin verified!
      setUser(res.user);
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการเชื่อมต่อ";
      setError(msg);
      setSubmitting(false);
    }
  };

  const handleQuickFill = () => {
    setEmail("admin@minicommerce.com");
    setPassword("admin123");
    setError(null);
  };

  const handleLogoutAndSwitch = async () => {
    await logoutAction();
    setUser(null);
    setEmail("");
    setPassword("");
    setError(null);
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-sm font-medium text-neutral-800">
        กำลังตรวจสอบสิทธิ์การเข้าถึง Admin Console...
      </div>
    );
  }

  // If user is currently logged in as customer (non-admin)
  if (user && user.role !== "admin") {
    return (
      <div className="max-w-md mx-auto my-12 px-4">
        <div className="rounded-2xl border border-rose-300 bg-surface p-6 sm:p-8 shadow-md flex flex-col gap-4 text-center">
          <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-2xl font-bold mx-auto shadow-2xs">
            ✕
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-text m-0 mb-1.5">
              ปฏิเสธการเข้าถึง (403 Forbidden)
            </h2>
            <p className="text-sm text-neutral-800 leading-relaxed m-0">
              คุณกำลังล็อกอินด้วยบัญชี: <strong className="text-text font-bold">{user.email}</strong> (สถานะ: ลูกค้า / Customer) ซึ่งไม่มีสิทธิ์เข้าใช้งานระบบจัดการหลังร้าน Admin Console
            </p>
          </div>

          <div className="flex flex-col gap-2.5 mt-2">
            <button
              type="button"
              onClick={handleLogoutAndSwitch}
              className="w-full min-h-[44px] rounded-xl bg-accent-2 hover:bg-accent-2-600 active:bg-accent-2-700 !text-white font-bold text-sm transition-colors shadow-xs flex items-center justify-center cursor-pointer"
            >
              ออกจากระบบและเข้าด้วยบัญชี Admin
            </button>
            <Link
              href="/"
              className="w-full min-h-[44px] rounded-xl border border-divider bg-surface hover:bg-bg text-text font-semibold text-sm transition-colors flex items-center justify-center shadow-2xs"
            >
              ← กลับไปหน้าร้านค้า (Storefront)
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Admin Login Screen
  return (
    <div className="max-w-md mx-auto my-12 px-4">
      <div className="rounded-2xl border border-divider bg-surface p-6 sm:p-8 shadow-md flex flex-col gap-5">
        <div className="text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border border-accent-2/30 bg-accent-2/10 text-accent-2 flex items-center justify-center mb-2 shadow-xs">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <span className="text-[11px] uppercase tracking-wider font-mono font-bold text-accent-2">
            Restricted Area · ผู้ดูแลระบบเท่านั้น
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-text m-0 mt-1.5">
            เข้าสู่ระบบ Admin Console
          </h1>
          <p className="text-xs sm:text-sm text-neutral-800 leading-relaxed m-0 mt-2">
            ระบบจัดการคำสั่งซื้อ สต็อกสินค้า และโปรโมชั่น (เข้าใช้งานได้เฉพาะบัญชีสิทธิ์ Admin)
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-950 text-xs font-semibold leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-neutral-800 block mb-1.5">
              อีเมลผู้ดูแลระบบ (Admin Email)
            </label>
            <input
              type="email"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-divider bg-bg text-text text-sm placeholder:text-neutral-500 outline-none focus:border-accent font-medium shadow-2xs"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@minicommerce.com"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-neutral-800 block mb-1.5">
              รหัสผ่าน (Password)
            </label>
            <input
              type="password"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-divider bg-bg text-text text-sm placeholder:text-neutral-500 outline-none focus:border-accent font-medium shadow-2xs"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full min-h-[46px] rounded-xl bg-accent-2 hover:bg-accent-2-600 active:bg-accent-2-700 !text-white font-bold text-sm transition-colors cursor-pointer shadow-xs flex items-center justify-center disabled:opacity-50 mt-1"
          >
            {submitting ? "กำลังตรวจสอบสิทธิ์..." : "เข้าสู่ระบบ Admin Console"}
          </button>
        </form>

        {/* Quick Demo Fill for Admin */}
        <div className="border-t border-divider pt-4 text-center">
          <p className="m-0 mb-2 text-[11px] font-mono tracking-wider uppercase font-bold text-neutral-700">
            บัญชีทดสอบสำหรับผู้ดูแลระบบ
          </p>
          <button
            type="button"
            onClick={handleQuickFill}
            className="w-full p-3 rounded-xl border border-divider bg-bg hover:bg-surface text-left transition-colors cursor-pointer flex items-center justify-between shadow-2xs group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-accent-2/10 text-accent-2 flex items-center justify-center shrink-0 border border-accent-2/20">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-bold text-accent-2 group-hover:underline">
                  Admin Account
                </div>
                <div className="text-[11px] text-neutral-800 font-medium">
                  admin@minicommerce.com (รหัสผ่าน: admin123)
                </div>
              </div>
            </div>
            <span className="text-xs font-bold text-accent shrink-0 ml-2">
              คลิกเพื่อกรอก →
            </span>
          </button>
        </div>

        <div className="text-center pt-1 border-t border-divider">
          <Link href="/" className="text-xs text-neutral-800 hover:text-accent font-semibold transition-colors">
            ← กลับไปหน้าร้านค้าทั่วไป
          </Link>
        </div>
      </div>
    </div>
  );
}
