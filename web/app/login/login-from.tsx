"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAction, registerAction } from "../../lib/auth/actions";

export default function LoginForm() {
  const router = useRouter();
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
        router.push("/list");
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
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
      <div style={{ textAlign: "center" }}>
        <p style={{ margin: "0 0 4px", fontSize: "11px", letterSpacing: ".14em", textTransform: "uppercase", color: "var(--color-accent-700)", fontWeight: 600 }}>
          Mini Commerce · TiDB Cloud Serverless
        </p>
        <h2 style={{ margin: 0, fontSize: "28px" }}>
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2)" }}>
          <button
            type="button"
            onClick={() => handleQuickFill("admin@minicommerce.com", "admin123")}
            className="btn btn-secondary"
            style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "8px 10px", textAlign: "left" }}
          >
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-accent-700)" }}>Admin ผู้ดูแล</span>
            <span style={{ fontSize: "11px", color: "var(--color-neutral-700)", textOverflow: "ellipsis", overflow: "hidden", maxWidth: "160px" }}>
              admin@minicommerce.com
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickFill("customer@minicommerce.com", "customer123")}
            className="btn btn-secondary"
            style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "8px 10px", textAlign: "left" }}
          >
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-accent-2-700)" }}>Customer ลูกค้า</span>
            <span style={{ fontSize: "11px", color: "var(--color-neutral-700)", textOverflow: "ellipsis", overflow: "hidden", maxWidth: "160px" }}>
              customer@minicommerce.com
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
