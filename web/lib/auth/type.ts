export interface PublicUser {
  id: number;
  email: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: PublicUser;
}

export type AuthResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string }