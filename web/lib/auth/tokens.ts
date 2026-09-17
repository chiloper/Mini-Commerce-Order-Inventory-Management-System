import "server-only"
import { REFRESH_SKEW_SECONDS } from "./config";

interface AccessTokenClaims {
  sub?: number;
  email?: string;
  role?: string;
  exp?: number;
}


export function decodeAccessToken(token: string): AccessTokenClaims | null {
  const segments = token.split(".");

  if (segments.length !== 3) {
    return null
  }
  try {
    const payload = Buffer.from(segments[1], "base64url").toString("utf8");
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