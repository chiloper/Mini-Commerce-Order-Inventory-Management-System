import { Injectable } from "@nestjs/common";
import { Prisma, RefreshToken, User } from "src/generated/prisma/client";
import { PrismaService } from "src/prisma/prisama.service";

@Injectable()
export class AuthRepository {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  async findByEmail(email: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { email }
    })
  }

  async findById(id: number): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { id }
    })
  }
  async createRefreshToken(userId: number, token: string, familyId: string, refreshTtlMs: number): Promise<void> {
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: token,
        familyId,
        expiresAt: new Date(Date.now() + refreshTtlMs)
      }
    })
  }

  async findRefreshToken(tokenHash: string): Promise<Prisma.RefreshTokenGetPayload<{ include: { user: true } }> | null> {
    return await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true }
    })
  }
  async countLiveInFamily(familyId: string): Promise<number> {
    return await this.prisma.refreshToken.count({
      where: {
        familyId,
        revokedAt: null
      }
    })
  }

  async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() }
    })
  }

  async revokeRefreshToken(id: number): Promise<number> {
    const result = await this.prisma.refreshToken.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: new Date() }
    })
    return result.count
  }
}