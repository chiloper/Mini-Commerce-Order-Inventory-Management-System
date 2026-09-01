import { Body, Controller, Get, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import type { AuthenticatedUser, AuthTokens, PublicUser } from "./types/auth.types";
import { RefreshDto } from "./dto/regresh.dto";
import { CurrentUser } from "./decorators/current-user.decorator";
import { Public } from "./decorators/public.decorator";
import { Roles } from "./decorators/role.decorator";


@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) { }
  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<AuthTokens> {
    return this.authService.login(dto)
  }
  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshDto): Promise<AuthTokens> {
    return this.authService.refresh(dto.refreshToken)
  }
  @Public()
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  logout(@Body() dto: RefreshDto): Promise<void> {
    return this.authService.logout(dto.refreshToken)
  }

  @Get("me")
  me(@CurrentUser() User: AuthenticatedUser): Promise<PublicUser> {
    return this.authService.findById(User.id)
  }
}