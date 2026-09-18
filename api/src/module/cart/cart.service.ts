import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { CartRepository } from "./repository/cart.repository";
import { AddToCartDto, UpdateCartItemDto } from "./dto/cart.dto";
import { ProductRepository } from "../product/repository/product.repository";
import { CartItemDetail, CartSummary } from "./types/cart.types";

@Injectable()
export class CartService {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly productRepository: ProductRepository
  ) {}

  async getCart(userId: number): Promise<CartSummary> {
    const cart = await this.cartRepository.getActiveCartByUserId(userId);

    const items = cart.CartItem.map((item) => {
      const product = item.product;
      const availableStock = product?.stock ?? 0;
      const isOverStock = item.quantity > availableStock;

      return {
        id: item.id,
        productId: item.productId,
        productName: product?.name ?? "Unknown Product",
        sku: product?.sku ?? "",
        price: product?.price ?? 0,
        quantity: item.quantity,
        totalPrice: (product?.price ?? 0) * item.quantity,
        stock: availableStock,
        isOverStock,
        category: product?.catagory?.name ?? "",
        imageUrl: product?.imageUrl ?? null,
        images: product?.images ?? null,
      };
    });

    const totalQuantity = items.reduce((acc, it) => acc + it.quantity, 0);
    const subtotal = items.reduce((acc, it) => acc + it.totalPrice, 0);

    return {
      id: cart.id,
      userId: cart.userId,
      items,
      totalQuantity,
      subtotal,
    };
  }

  async addItem(userId: number, dto: AddToCartDto): Promise<CartSummary> {
    const product = await this.productRepository.findById(dto.productId);
    if (!product) {
      throw new NotFoundException(`Product ID ${dto.productId} not found`);
    }

    if (!product.isActive) {
      throw new BadRequestException(`Product ${product.name} is not available`);
    }

    const cart = await this.cartRepository.getActiveCartByUserId(userId);
    const existingItem = await this.cartRepository.findCartItem(cart.id, dto.productId);
    const currentQty = existingItem ? existingItem.quantity : 0;
    const requestedQty = currentQty + dto.quantity;

    if (requestedQty > product.stock) {
      throw new BadRequestException(
        `Cannot add ${dto.quantity} items. Stock remaining: ${product.stock}, current in cart: ${currentQty}`
      );
    }

    await this.cartRepository.addItem(cart.id, dto.productId, dto.quantity);
    return this.getCart(userId);
  }

  async updateItem(userId: number, itemId: number, dto: UpdateCartItemDto): Promise<CartSummary> {
    const item = await this.cartRepository.findCartItemById(itemId);
    if (!item) {
      throw new NotFoundException(`Cart item with ID ${itemId} not found`);
    }

    if (item.cart?.userId !== userId) {
      throw new BadRequestException("Unauthorized access to cart item");
    }

    if (dto.quantity > 0 && item.product) {
      if (dto.quantity > item.product.stock) {
        throw new BadRequestException(
          `Requested quantity ${dto.quantity} exceeds available stock of ${item.product.stock}`
        );
      }
    }

    await this.cartRepository.updateItemQuantity(itemId, dto.quantity);
    return this.getCart(userId);
  }

  async removeItem(userId: number, itemId: number): Promise<CartSummary> {
    const item = await this.cartRepository.findCartItemById(itemId);
    if (!item) {
      throw new NotFoundException(`Cart item with ID ${itemId} not found`);
    }

    if (item.cart?.userId !== userId) {
      throw new BadRequestException("Unauthorized access to cart item");
    }

    await this.cartRepository.removeItem(itemId);
    return this.getCart(userId);
  }

  async clearCart(userId: number): Promise<CartSummary> {
    const cart = await this.cartRepository.getActiveCartByUserId(userId);
    await this.cartRepository.clearCart(cart.id);
    return this.getCart(userId);
  }
}
