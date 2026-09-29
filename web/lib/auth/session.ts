import { AuthTokens, PublicUser } from "./type";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "./config";
import { meRequest } from "./api";
import { refreshSession } from "./refresh";

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document !== "undefined") {
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
  }
}

function deleteCookie(name: string) {
  if (typeof document !== "undefined") {
    document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
  }
}

function getCookie(name: string): string | undefined {
  if (typeof document !== "undefined") {
    const match = document.cookie.match(new RegExp("(^|; )" + name + "=([^;]+)"));
    if (match) return decodeURIComponent(match[2]);
  }
  return undefined;
}

export async function writeSession(token: AuthTokens): Promise<void> {
  setCookie(ACCESS_TOKEN_COOKIE, token.accessToken, token.expiresIn);
  setCookie(REFRESH_TOKEN_COOKIE, token.refreshToken, 7 * 24 * 60 * 60);
  if (typeof window !== "undefined") {
    localStorage.setItem(ACCESS_TOKEN_COOKIE, token.accessToken);
    localStorage.setItem(REFRESH_TOKEN_COOKIE, token.refreshToken);
  }
}

export async function clearSession(): Promise<void> {
  deleteCookie(ACCESS_TOKEN_COOKIE);
  deleteCookie(REFRESH_TOKEN_COOKIE);
  if (typeof window !== "undefined") {
    localStorage.removeItem(ACCESS_TOKEN_COOKIE);
    localStorage.removeItem(REFRESH_TOKEN_COOKIE);
  }
}

export async function readAccesToken(): Promise<string | undefined> {
  const fromCookie = getCookie(ACCESS_TOKEN_COOKIE);
  if (fromCookie) return fromCookie;
  if (typeof window !== "undefined") {
    return localStorage.getItem(ACCESS_TOKEN_COOKIE) || undefined;
  }
  return undefined;
}

export async function readRefreshToken(): Promise<string | undefined> {
  const fromCookie = getCookie(REFRESH_TOKEN_COOKIE);
  if (fromCookie) return fromCookie;
  if (typeof window !== "undefined") {
    return localStorage.getItem(REFRESH_TOKEN_COOKIE) || undefined;
  }
  return undefined;
}

<<<<<<< HEAD
export async function getCurrentUser(): Promise<PublicUser | null> {
  const accessToken = await readAccesToken();

  if (!accessToken) {
=======
export const getCurrentUser = cache(async (): Promise<PublicUser | null> => {
  let accessToken = await readAccesToken();

  if (!accessToken) {
    const rt = await readRefreshToken();
    if (rt) {
      const refreshed = await refreshSession(rt);
      if (refreshed.ok && refreshed.data) {
        try {
          await writeSession(refreshed.data);
        } catch {
          // Ignore if called inside Server Component render
        }
        return refreshed.data.user;
      }
    }
>>>>>>> dev
    return null;
  }

  const result = await meRequest(accessToken);

<<<<<<< HEAD
  return result.ok ? result.data : null;
}
=======
  if (!result.ok) {
    const rt = await readRefreshToken();
    if (rt) {
      const refreshed = await refreshSession(rt);
      if (refreshed.ok && refreshed.data) {
        try {
          await writeSession(refreshed.data);
        } catch {
          // Ignore if called inside Server Component render
        }
        return refreshed.data.user;
      }
    }
    return null;
  }

  return result.data;
});
>>>>>>> dev
