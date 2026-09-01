import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaMariaDb } from "@prisma/adapter-mariadb"
import { PrismaClient } from "src/generated/prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name)
  constructor() {
    const connectionStr = process.env.DATABASE_URL;
    if (!connectionStr) {
      throw new Error(
        "DATABASE_URL is not config",
      );
    }

    super({ adapter: new PrismaMariaDb(connectionStr) })
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Connected to Mysql via Prisma');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect
  }
}