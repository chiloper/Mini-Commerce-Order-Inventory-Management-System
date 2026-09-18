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
import { CartService } from "./cart.service";
import { AddToCartDto, UpdateCartItemDto } from "./dto/cart.dto";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../auth/types/auth.types";
import type { CartSummary } from "./types/cart.types";

@Controller("cart")
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@CurrentUser() user: AuthenticatedUser): Promise<CartSummary> {
    return this.cartService.getCart(user.id);
  }

  @Post("items")
  addItem(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddToCartDto
  ): Promise<CartSummary> {
    return this.cartService.addItem(user.id, dto);
  }

  @Patch("items/:id")
  updateItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseIntPipe) itemId: number,
    @Body() dto: UpdateCartItemDto
  ): Promise<CartSummary> {
    return this.cartService.updateItem(user.id, itemId, dto);
  }

  @Delete("items/:id")
  removeItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseIntPipe) itemId: number
  ): Promise<CartSummary> {
    return this.cartService.removeItem(user.id, itemId);
  }

  @Delete()
  clearCart(@CurrentUser() user: AuthenticatedUser): Promise<CartSummary> {
    return this.cartService.clearCart(user.id);
  }
}
