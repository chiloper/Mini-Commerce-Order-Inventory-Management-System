import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { AuthRepository } from "./repository/auth.repository";
import { compare, hash } from "bcryptjs";
import { User } from "../../generated/prisma/client";
import { AuthTokens, JwtPayload, PublicUser } from "./types/auth.types";
import { createHash, randomBytes, randomUUID } from "crypto";

const DUMMY_HASH =
  "$2b$10$CwTycUXWue0Thq9StjUM0uJ8.oOEmnhVbCk1S6nQfQK5jJx2fVJ0e";
export const REUSE_GRACE_MS = 10_000;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly refreshTtlMs: number;

  constructor(
    private readonly jwtService: JwtService,
    private readonly authRepository: AuthRepository
  ) {
    const days = Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 7);
    this.refreshTtlMs =
      (Number.isFinite(days) && days > 0 ? days : 7) * 86_400_000;
  }

  async register(dto: RegisterDto): Promise<AuthTokens> {
    const existing = await this.authRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException("Email is already registered.");
    }

    const passwordHash = await hash(dto.password, 10);
    const user = await this.authRepository.createUser(
      dto.email,
      passwordHash,
      dto.role || "customer"
    );

    return this.issueToken(user, randomUUID());
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.authRepository.findByEmail(dto.email);

    const passwordMatch = await compare(
      dto.password,
      user?.passwordHash ?? DUMMY_HASH
    );

    if (!user || !passwordMatch) {
      throw new UnauthorizedException("Invalid email or password.");
    }

    return this.issueToken(user, randomUUID());
  }

  async refresh(rawToken: string): Promise<AuthTokens> {
    const tokenHash = this.hasToken(rawToken);
    const stored = await this.authRepository.findRefreshToken(tokenHash);
    if (!stored) {
      throw new UnauthorizedException("Refresh token is invalid.");
    }
    if (stored.revokedAt) {
      const liveInFamily = await this.authRepository.countLiveInFamily(
        stored.familyId
      );
      if (liveInFamily === 0) {
        throw new UnauthorizedException("Refresh token is invalid.");
      }

      const revokedAgoMs = Date.now() - stored.revokedAt.getTime();

      if (revokedAgoMs <= REUSE_GRACE_MS) {
        throw new ConflictException(
          "Refresh token was just rotated. Retry with the current token."
        );
      }
      this.logger.warn(
        `Refresh token reuse detected for user ${stored.userId} revoking family ${stored.familyId}.`
      );

      await this.revokeFamily(stored.familyId);
      throw new UnauthorizedException("Refresh token is invalid.");
    }

    if (stored.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException("Refresh token has expired.");
    }

    const retired = await this.authRepository.revokeRefreshToken(stored.id);
    if (retired === 0) {
      throw new ConflictException(
        "Refresh token was just rotated. Retry with the current token."
      );
    }
    return this.issueToken(stored.user, stored.familyId);
  }

  async logout(rawToken: string): Promise<void> {
    const tokenHash = this.hasToken(rawToken);
    const stored = await this.authRepository.findRefreshToken(tokenHash);
    if (stored) {
      await this.revokeFamily(stored.familyId);
    }
  }

  async findById(id: number): Promise<PublicUser> {
    const user = await this.authRepository.findById(id);
    if (!user) {
      throw new UnauthorizedException("Account no longer exists.");
    }
    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }

  private async issueToken(user: User, familyId: string): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = randomBytes(32).toString("base64url");

    await this.authRepository.createRefreshToken(
      user.id,
      this.hasToken(refreshToken),
      familyId,
      this.refreshTtlMs
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: this.accessTokenTtlSeconds(),
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  private async revokeFamily(familyId: string): Promise<void> {
    await this.authRepository.revokeFamily(familyId);
  }

  private hasToken(rawToken: string): string {
    return createHash("sha256").update(rawToken).digest("hex");
  }

  private accessTokenTtlSeconds(): number {
    const ttl = process.env.JWT_ACCESS_TTL ?? "15m";
    const match = /^(\d+)([smhd])$/.exec(ttl.trim());

    if (!match) {
      return 900;
    }

    const amount = Number(match[1]);
    const unitSeconds: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };

    return amount * (unitSeconds[match[2]] ?? 60);
  }
}