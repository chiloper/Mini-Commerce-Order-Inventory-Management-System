"use server";

import { loginRequest, logoutRequest, registerRequest } from "./api";
import { clearSession, getCurrentUser, readRefreshToken, writeSession } from "./session";
import { PublicUser } from "./type";
import { mergeGuestCart } from "../ecommerce-actions";

export async function loginAction(
  prevState: unknown,
  formData: FormData
): Promise<{ success: boolean; error?: string; user?: PublicUser }> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "กรุณากรอกอีเมลและรหัสผ่าน" };
  }

  const result = await loginRequest(email, password);
  if (!result.ok) {
    return { success: false, error: result.message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
  }

  await writeSession(result.data);
  await mergeGuestCart(result.data.accessToken);
  return { success: true, user: result.data.user };
}

export async function registerAction(
  prevState: unknown,
  formData: FormData
): Promise<{ success: boolean; error?: string; user?: PublicUser }> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "กรุณากรอกอีเมลและรหัสผ่าน" };
  }

  if (password.length < 6) {
    return { success: false, error: "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร" };
  }

  const result = await registerRequest(email, password, "customer");
  if (!result.ok) {
    return { success: false, error: result.message || "การสมัครสมาชิกไม่สำเร็จ" };
  }

  await writeSession(result.data);
  await mergeGuestCart(result.data.accessToken);
  return { success: true, user: result.data.user };
}

export async function logoutAction(): Promise<void> {
  const rt = await readRefreshToken();
  if (rt) {
    try {
      await logoutRequest(rt);
    } catch {
      // ignore
    }
  }
  await clearSession();
}

export async function getSessionUserAction(): Promise<PublicUser | null> {
  return await getCurrentUser();
}
