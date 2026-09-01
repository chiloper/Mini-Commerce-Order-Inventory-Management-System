import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtModule, JwtModuleOptions } from "@nestjs/jwt";
import { AuthRepository } from "./repository/auth.repository";
import { APP_GUARD } from "@nestjs/core";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RoleGuard } from "./guards/role.guard";

@Module({
  imports: [

    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_ACCESS_SECRET;
        if (!secret) {
          throw new Error("JWT_ACCESS_SECRET it not set.")
        }

        const expiresIn = (process.env.JWT_ACCESS_TTL ?? "15m") as NonNullable<JwtModuleOptions["signOptions"]>["expiresIn"];
        return { secret, signOptions: { expiresIn } };
      }
    })
  ],
  controllers: [AuthController],
  providers: [
    AuthRepository,
    AuthService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RoleGuard }
  ],
  exports: [AuthService, JwtModule]
})
export class AuthModule { }