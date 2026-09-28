import "server-only";
import { API_BASE_URL } from "./config";
import { AuthResult, AuthTokens, PublicUser } from "./type";

interface ApiErrorBody {
  message?: string | string[];
}

async function callApi<T>(
  path: string,
  init: RequestInit
): Promise<AuthResult<T>> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...init.headers,
      },
    });
  } catch {
    return {
      ok: false,
      status: 503,
      message: "Cannot reach the API. Is it running on " + API_BASE_URL + "?",
    };
  }
  if (response.status === 204) {
    return { ok: true, data: undefined as T };
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }

  if (!response.ok) {
    const errorBody = body as ApiErrorBody | undefined;
    const message = Array.isArray(errorBody?.message)
      ? errorBody.message[0]
      : (errorBody?.message ?? "Request failed.");

    return { ok: false, status: response.status, message };
  }
  return { ok: true, data: body as T };
}

export function registerRequest(
  email: string,
  password: string,
  role: string = "customer"
): Promise<AuthResult<AuthTokens>> {
  return callApi<AuthTokens>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, role }),
  });
}

export function loginRequest(
  email: string,
  password: string
): Promise<AuthResult<AuthTokens>> {
  return callApi<AuthTokens>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function refreshRequest(
  refreshToken: string
): Promise<AuthResult<AuthTokens>> {
  return callApi<AuthTokens>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

export function logoutRequest(
  refreshToken: string
): Promise<AuthResult<void>> {
  return callApi<void>("/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

export function meRequest(
  accessToken: string
): Promise<AuthResult<PublicUser>> {
  return callApi<PublicUser>("/auth/me", {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}