import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { OrderService } from "./order.service";
import {
  CheckoutDto,
  CreateManualOrderDto,
  CreatePromotionDto,
  QueryOrderDto,
  QueryPromotionDto,
  UpdateOrderStatusDto,
  UpdatePromotionDto,
  ValidatePromotionDto,
} from "./dto/order.dto";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../auth/types/auth.types";
import { Public } from "../auth/decorators/public.decorator";
import { Roles } from "../auth/decorators/role.decorator";
import type {
  DashboardStatsResult,
  OrderWithRelations,
  ValidatePromotionResult,
} from "./types/order.types";
import type { Order, Promotion } from "../../generated/prisma/client";

@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post("orders")
  checkout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CheckoutDto
  ): Promise<unknown> {
    return this.orderService.checkout(user.id, dto);
  }

  @Roles("admin")
  @Post("admin/orders")
  createManualOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateManualOrderDto
  ): Promise<unknown> {
    return this.orderService.createManualOrder(user.id, dto);
  }

  @Get("orders")
  findOrders(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryOrderDto
  ): Promise<unknown> {
    if (query.page !== undefined) {
      return this.orderService.findOrdersPaginated(user.id, user.role, query);
    }
    return this.orderService.findOrders(user.id, user.role);
  }

  @Get("orders/:id")
  findOrderById(@Param("id", ParseIntPipe) id: number): Promise<OrderWithRelations> {
    return this.orderService.findOrderById(id);
  }

  @Roles("admin")
  @Patch("orders/:id/status")
  updateStatus(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto
  ): Promise<Order> {
    return this.orderService.updateStatus(id, dto);
  }

  @Public()
  @Post("promotions/validate")
  validatePromotion(@Body() dto: ValidatePromotionDto): Promise<ValidatePromotionResult> {
    return this.orderService.validatePromotion(dto);
  }

  @Roles("admin")
  @Get("promotions")
  getPromotions(@Query() query: QueryPromotionDto): Promise<unknown> {
    if (query.page !== undefined) {
      return this.orderService.getPromotionsPaginated(query);
    }
    return this.orderService.getPromotions();
  }

  @Roles("admin")
  @Post("promotions")
  createPromotion(@Body() dto: CreatePromotionDto): Promise<Promotion> {
    return this.orderService.createPromotion(dto);
  }

  @Roles("admin")
  @Patch("promotions/:id")
  updatePromotion(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdatePromotionDto
  ): Promise<Promotion> {
    return this.orderService.updatePromotion(id, dto);
  }

  @Roles("admin")
  @Delete("promotions/:id")
  deletePromotion(@Param("id", ParseIntPipe) id: number): Promise<Promotion> {
    return this.orderService.deletePromotion(id);
  }

  @Roles("admin")
  @Get("dashboard/stats")
  getDashboardStats(): Promise<DashboardStatsResult> {
    return this.orderService.getDashboardStats();
  }
}
