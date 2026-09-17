import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from "@nestjs/common";
import { OrderService } from "./order.service";
import {
  CheckoutDto,
  CreatePromotionDto,
  UpdateOrderStatusDto,
  ValidatePromotionDto,
} from "./dto/order.dto";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../auth/types/auth.types";
import { Public } from "../auth/decorators/public.decorator";
import { Roles } from "../auth/decorators/role.decorator";

@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post("orders")
  checkout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CheckoutDto
  ) {
    return this.orderService.checkout(user.id, dto);
  }

  @Get("orders")
  findOrders(@CurrentUser() user: AuthenticatedUser) {
    return this.orderService.findOrders(user.id, user.role);
  }

  @Get("orders/:id")
  findOrderById(@Param("id", ParseIntPipe) id: number) {
    return this.orderService.findOrderById(id);
  }

  @Roles("admin")
  @Patch("orders/:id/status")
  updateStatus(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto
  ) {
    return this.orderService.updateStatus(id, dto);
  }

  @Public()
  @Post("promotions/validate")
  validatePromotion(@Body() dto: ValidatePromotionDto) {
    return this.orderService.validatePromotion(dto);
  }

  @Roles("admin")
  @Get("promotions")
  getPromotions() {
    return this.orderService.getPromotions();
  }

  @Roles("admin")
  @Post("promotions")
  createPromotion(@Body() dto: CreatePromotionDto) {
    return this.orderService.createPromotion(dto);
  }

  @Roles("admin")
  @Patch("promotions/:id")
  updatePromotion(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: any
  ) {
    return this.orderService.updatePromotion(id, dto);
  }

  @Roles("admin")
  @Delete("promotions/:id")
  deletePromotion(@Param("id", ParseIntPipe) id: number) {
    return this.orderService.deletePromotion(id);
  }

  @Roles("admin")
  @Get("dashboard/stats")
  getDashboardStats() {
    return this.orderService.getDashboardStats();
  }
}
