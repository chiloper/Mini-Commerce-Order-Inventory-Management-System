import { Suspense } from "react";
import LoginForm from "./login-from";

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-110px)] items-center justify-center p-4">
      <Suspense fallback={<div className="py-12 text-center text-sm text-neutral-600">กำลังโหลด...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
