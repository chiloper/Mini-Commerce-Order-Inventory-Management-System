export interface JwtPayload {
  sub: number;
  email: string;
  role: string
}

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

export interface AuthenticatedUser {
  id: number;
  email: string;
  role: string;
}

export const Role = {
  Admin: "admin",
  Customer: "customer",
} as const;

export type RoleValue = (typeof Role)[keyof typeof Role];