"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginAction, registerAction } from "../../lib/auth/actions";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect") || "/list";

  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    try {
      const res =
        tab === "login"
          ? await loginAction(null, formData)
          : await registerAction(null, formData);

      if (!res.success) {
        setError(res.error || "เกิดข้อผิดพลาด");
        setLoading(false);
      } else {
        window.dispatchEvent(new Event("cart-updated"));
        router.push(redirectParam);
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการเชื่อมต่อ";
      setError(msg);
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setTab("login");
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div
      className="card elev-md"
      style={{
        width: "100%",
        maxWidth: "460px",
        background: "var(--color-surface)",
        padding: "var(--space-6)",
        gap: "var(--space-4)",
        borderRadius: "var(--radius-md)",
      }}
    >
      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "9999px",
            border: "1px solid var(--color-divider)",
            background: "var(--color-bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-accent)",
            marginBottom: "8px",
          }}
        >
          <svg style={{ width: "24px", height: "24px" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <p style={{ margin: "0 0 4px", fontSize: "11px", letterSpacing: ".14em", textTransform: "uppercase", color: "var(--color-accent-700)", fontWeight: 600 }}>
          Mini Commerce
        </p>
        <h2 style={{ margin: 0, fontSize: "26px" }}>
          {tab === "login" ? "เข้าสู่ระบบ" : "สมัครสมาชิกใหม่"}
        </h2>
      </div>

      {/* Tabs */}
      <div className="seg" style={{ width: "100%", display: "flex" }}>
        <button
          type="button"
          onClick={() => {
            setTab("login");
            setError(null);
          }}
          className={`seg-opt ${tab === "login" ? "active" : ""}`}
          style={{ flex: 1, justifyContent: "center" }}
        >
          เข้าสู่ระบบ (Sign In)
        </button>
        <button
          type="button"
          onClick={() => {
            setTab("register");
            setError(null);
          }}
          className={`seg-opt ${tab === "register" ? "active" : ""}`}
          style={{ flex: 1, justifyContent: "center" }}
        >
          สมัครสมาชิก (Register)
        </button>
      </div>

      {/* Error Alert */}
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

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <div className="field">
          <label>อีเมล (Email)</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="input"
          />
        </div>

        <div className="field">
          <label>รหัสผ่าน (Password)</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="input"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary btn-block"
          style={{ height: "42px", fontSize: "15px", marginTop: "var(--space-2)" }}
        >
          {loading ? "กำลังดำเนินการ..." : tab === "login" ? "เข้าสู่ระบบ" : "ยืนยันสมัครสมาชิก"}
        </button>
      </form>

      {/* Demo Accounts Quick-Click */}
      <div style={{ borderTop: "1px solid var(--color-divider)", paddingTop: "var(--space-3)", marginTop: "var(--space-2)" }}>
        <p style={{ margin: "0 0 var(--space-2)", textAlign: "center", fontSize: "11px", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--color-neutral-700)", fontWeight: 600 }}>
          บัญชีสำหรับทดสอบระบบ (Quick Demo)
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <button
            type="button"
            onClick={() => handleQuickFill("admin@minicommerce.com", "admin123")}
            className="btn btn-secondary"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
              padding: "10px 12px",
              width: "100%",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "9999px",
                  background: "rgba(147, 51, 234, 0.12)",
                  color: "#7e22ce",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  border: "1px solid rgba(147, 51, 234, 0.25)",
                }}
              >
                <svg style={{ width: "17px", height: "17px" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-accent-700)" }}>
                  Admin ผู้ดูแลระบบ
                </div>
                <div style={{ fontSize: "11px", color: "var(--color-neutral-700)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                  admin@minicommerce.com · รหัส: admin123
                </div>
              </div>
            </div>
            <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-accent)", flexShrink: 0, whiteSpace: "nowrap" }}>
              กรอกข้อมูล →
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickFill("customer@minicommerce.com", "customer123")}
            className="btn btn-secondary"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
              padding: "10px 12px",
              width: "100%",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "9999px",
                  background: "rgba(37, 99, 235, 0.12)",
                  color: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  border: "1px solid rgba(37, 99, 235, 0.25)",
                }}
              >
                <svg style={{ width: "16px", height: "16px" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-accent-2-700)" }}>
                  Customer ลูกค้าทั่วไป
                </div>
                <div style={{ fontSize: "11px", color: "var(--color-neutral-700)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                  customer@minicommerce.com · รหัส: customer123
                </div>
              </div>
            </div>
            <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-accent)", flexShrink: 0, whiteSpace: "nowrap" }}>
              กรอกข้อมูล →
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
