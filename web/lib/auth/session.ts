import "server-only"
import { AuthTokens, PublicUser } from "./type";
import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE, accessCookieOptions, REFRESH_TOKEN_COOKIE, refreshCookieOptions } from "./config";
import { cache } from "react";
import { meRequest } from "./api";

export async function writeSession(token: AuthTokens): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(
    ACCESS_TOKEN_COOKIE,
    token.accessToken,
    accessCookieOptions(token.expiresIn)
  )
  cookieStore.set(
    REFRESH_TOKEN_COOKIE,
    token.refreshToken,
    refreshCookieOptions()
  )
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
}

export async function readAccesToken(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(ACCESS_TOKEN_COOKIE)?.value
}

export async function readRefreshToken(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(REFRESH_TOKEN_COOKIE)?.value
}

export const getCurrentUser = cache(async (): Promise<PublicUser | null> => {
  const accessToken = await readAccesToken();

  if (!accessToken) {
    return null
  }

  const result = await meRequest(accessToken);

  return result.ok ? result.data : null;
})