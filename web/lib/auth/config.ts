export const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3001";
export const ACCESS_TOKEN_COOKIE = "mc_at";
export const REFRESH_TOKEN_COOKIE = "mc_rt";
export const REFRESH_SKEW_SECONDS = 60;
const refreshTtlDays = Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 7);
const REFRESH_TOKEN_MAX_AGE_SECONDS =
  (Number.isFinite(refreshTtlDays) && refreshTtlDays > 0 ? refreshTtlDays : 7) *
  60 *
  60 *
  24;

const isProduction = process.env.NODE_ENV === "production";

export interface SessionCookieOptions {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
}

export function accessCookieOptions(maxAgeSeconds: number): SessionCookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export function refreshCookieOptions(): SessionCookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
  };
}

export const PROTECTED_ROUTE_PREFIXES = ["/account"];

export const LOGIN_ROUTE = "/login";

export const DEFAULT_AUTHENTICATED_ROUTE = "/account";

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}