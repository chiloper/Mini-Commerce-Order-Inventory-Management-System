import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const connectionStr = process.env.DATABASE_URL;
    if (!connectionStr) {
      throw new Error("DATABASE_URL is not configured");
    }

    try {
      const url = new URL(connectionStr);
      const isCloudOrTidb =
        url.hostname.includes("tidbcloud.com") ||
        url.hostname.includes("aws") ||
        connectionStr.includes("ssl");

      const poolOptions: any = {
        host: url.hostname,
        port: Number(url.port) || 3306,
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        database: url.pathname.replace(/^\//, ""),
      };

      if (isCloudOrTidb) {
        poolOptions.ssl = {
          minVersion: "TLSv1.2",
          rejectUnauthorized: true,
        };
      }

      super({ adapter: new PrismaMariaDb(poolOptions) });
    } catch {
      super({ adapter: new PrismaMariaDb(connectionStr) });
    }
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log("Connected to MySQL / TiDB Cloud via Prisma");
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log("Disconnected from MySQL / TiDB Cloud");
  }
}
