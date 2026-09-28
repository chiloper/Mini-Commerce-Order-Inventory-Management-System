import { REFRESH_SKEW_SECONDS } from "./config";

interface AccessTokenClaims {
  sub?: number;
  email?: string;
  role?: string;
  exp?: number;
}

function decodeBase64Url(str: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str, "base64url").toString("utf8");
  }
  try {
    let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    return decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
  } catch {
    return "";
  }
}

export function decodeAccessToken(token: string): AccessTokenClaims | null {
  const segments = token.split(".");

  if (segments.length !== 3) {
    return null;
  }
  try {
    const payload = decodeBase64Url(segments[1]);
    const claims: unknown = JSON.parse(payload);

    return typeof claims === "object" && claims !== null
      ? (claims as AccessTokenClaims)
      : null

  } catch {
    return null
  }
}

export function needsRefresh(token: string | undefined): boolean {
  if (!token) {
    return true
  }

  const claims = decodeAccessToken(token);

  if (!claims?.exp) {
    return true
  }

  const secondsLife = claims.exp - Math.floor(Date.now() / 1000);
  return secondsLife <= REFRESH_SKEW_SECONDS;
}