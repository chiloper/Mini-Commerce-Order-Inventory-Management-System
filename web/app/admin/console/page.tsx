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
      <div style={{ padding: "100px 0", textAlign: "center", color: "var(--color-neutral-600)" }}>
        กำลังตรวจสอบสิทธิ์การเข้าถึง Admin Console...
      </div>
    );
  }

  // If user is currently logged in as customer (non-admin)
  if (user && user.role !== "admin") {
    return (
      <div style={{ maxWidth: "520px", margin: "60px auto", padding: "var(--space-4)" }}>
        <div
          className="card elev-md"
          style={{
            padding: "var(--space-6)",
            background: "var(--color-surface)",
            gap: "var(--space-4)",
            border: "1px solid var(--color-accent-2-300)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "var(--color-accent-2-100)",
              color: "var(--color-accent-2-700)",
              fontSize: "24px",
              display: "grid",
              placeItems: "center",
              margin: "0 auto",
              fontWeight: 700,
            }}
          >
            ✕
          </div>

          <div>
            <h2 style={{ margin: "0 0 6px", fontSize: "24px" }}>ปฏิเสธการเข้าถึง (403 Forbidden)</h2>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--color-neutral-700)", lineHeight: 1.5 }}>
              คุณกำลังล็อกอินด้วยบัญชี: <strong>{user.email}</strong> (สถานะ: ลูกค้า / Customer) ซึ่งไม่มีสิทธิ์เข้าใช้งานระบบจัดการหลังร้าน Admin Console
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
            <button
              onClick={handleLogoutAndSwitch}
              className="btn btn-primary btn-block"
              style={{ height: "42px" }}
            >
              ออกจากระบบและเข้าด้วยบัญชี Admin
            </button>
            <Link href="/" className="btn btn-secondary btn-block" style={{ height: "42px" }}>
              ← กลับไปหน้าร้านค้า (Storefront)
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Admin Login Screen
  return (
    <div style={{ maxWidth: "480px", margin: "50px auto", padding: "var(--space-4)" }}>
      <div
        className="card elev-md"
        style={{
          padding: "var(--space-6)",
          background: "var(--color-surface)",
          gap: "var(--space-4)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-divider)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: "11px", letterSpacing: ".16em", textTransform: "uppercase", color: "var(--color-accent-2-700)", fontWeight: 700 }}>
            Restricted Area · ผู้ดูแลระบบเท่านั้น
          </span>
          <h1 style={{ margin: "6px 0 0", fontSize: "28px" }}>เข้าสู่ระบบ Admin Console</h1>
          <p style={{ margin: "6px 0 0", fontSize: "13px", color: "var(--color-neutral-700)", lineHeight: 1.5 }}>
            ระบบจัดการคำสั่งซื้อ สต็อกสินค้า และโปรโมชั่น (เข้าใช้งานได้เฉพาะบัญชีสิทธิ์ Admin)
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: "var(--space-2) var(--space-3)",
              background: "var(--color-accent-2-100)",
              color: "var(--color-accent-2-800)",
              border: "1px solid var(--color-accent-2-300)",
              borderRadius: "var(--radius-md)",
              fontSize: "13px",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleAdminLogin} style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <div className="field">
            <label>อีเมลผู้ดูแลระบบ (Admin Email)</label>
            <input
              type="email"
              required
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@minicommerce.com"
            />
          </div>

          <div className="field">
            <label>รหัสผ่าน (Password)</label>
            <input
              type="password"
              required
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary btn-block"
            style={{ height: "44px", fontSize: "15px", marginTop: "var(--space-2)", background: "var(--color-accent-2)", borderColor: "var(--color-accent-2)" }}
          >
            {submitting ? "กำลังตรวจสอบสิทธิ์..." : "เข้าสู่ระบบ Admin Console"}
          </button>
        </form>

        {/* Quick Demo Fill for Admin */}
        <div style={{ borderTop: "1px solid var(--color-divider)", paddingTop: "var(--space-3)", textAlign: "center" }}>
          <p style={{ margin: "0 0 8px", fontSize: "11px", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--color-neutral-700)", fontWeight: 600 }}>
            บัญชีทดสอบสำหรับผู้ดูแลระบบ
          </p>
          <button
            type="button"
            onClick={handleQuickFill}
            className="btn btn-secondary"
            style={{ width: "100%", padding: "8px 12px", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-accent-2-700)" }}>Admin Account</div>
              <div style={{ fontSize: "11px", color: "var(--color-neutral-700)" }}>admin@minicommerce.com (รหัสผ่าน: admin123)</div>
            </div>
            <span style={{ fontSize: "11px", color: "var(--color-accent-700)", fontWeight: 600 }}>คลิกเพื่อกรอก →</span>
          </button>
        </div>

        <div style={{ textAlign: "center", paddingTop: "var(--space-1)" }}>
          <Link href="/" style={{ fontSize: "12px", color: "var(--color-neutral-700)" }}>
            ← กลับไปหน้าร้านค้าทั่วไป
          </Link>
        </div>
      </div>
    </div>
  );
}
