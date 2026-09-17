import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { AuthenticatedUser, RoleValue } from "../types/auth.types";
import { ROLES_KEY } from "../decorators/role.decorator";

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) { }
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleValue[]>(
      ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ])

    if (!requiredRoles || requiredRoles.length === 0) {
      return true
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser }>();

    if (
      !request.user ||
      !requiredRoles.includes(request.user.role as RoleValue)
    ) {
      throw new ForbiddenException("Insufficient role for this resource.")
    }

    return true
  }
}