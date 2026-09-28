import { refreshRequest } from "./api";
import { AuthResult, AuthTokens } from "./type";

const inFlight = new Map<
  string,
  {
    promise: Promise<AuthResult<AuthTokens>>;
    expiresAt: number
  }
>();

const RESULT_CACHE_MS = 15_000;

export function refreshSession(
  refreshToken: string
): Promise<AuthResult<AuthTokens>> {
  const now = Date.now()

  for (const [token, entry] of inFlight) {
    {
      if (entry.expiresAt <= now) {
        inFlight.delete(token)
      }
    }
  }
  const existing = inFlight.get(refreshToken);
  if (existing) {
    return existing.promise
  }

  const promise = refreshRequest(refreshToken);

  inFlight.set(refreshToken, { promise, expiresAt: now + RESULT_CACHE_MS });

  void promise.then((result) => {
    if (!result.ok) {
      inFlight.delete(refreshToken)
    }
  })

  return promise
}