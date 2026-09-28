import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class CartRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveCartByUserId(userId: number) {
    let cart = await this.prisma.cart.findFirst({
      where: {
        userId,
        status: true,
      },
      include: {
        CartItem: {
          include: {
            product: {
              include: {
                catagory: true,
              },
            },
          },
          orderBy: { id: "asc" },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: {
          userId,
          status: true,
        },
        include: {
          CartItem: {
            include: {
              product: {
                include: {
                  catagory: true,
                },
              },
            },
          },
        },
      });
    }

    return cart;
  }

  async findCartItem(cartId: number, productId: number) {
    return await this.prisma.cartItem.findFirst({
      where: { cartId, productId },
    });
  }

  async findCartItemById(id: number) {
    return await this.prisma.cartItem.findUnique({
      where: { id },
      include: {
        cart: true,
        product: true,
      },
    });
  }

  async addItem(cartId: number, productId: number, quantity: number) {
    const existing = await this.findCartItem(cartId, productId);
    if (existing) {
      return await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: {
          quantity: existing.quantity + quantity,
        },
      });
    }

    return await this.prisma.cartItem.create({
      data: {
        cartId,
        productId,
        quantity,
      },
    });
  }

  async updateItemQuantity(itemId: number, quantity: number) {
    if (quantity <= 0) {
      return await this.removeItem(itemId);
    }

    return await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });
  }

  async removeItem(itemId: number) {
    return await this.prisma.cartItem.delete({
      where: { id: itemId },
    });
  }

  async clearCart(cartId: number) {
    return await this.prisma.cartItem.deleteMany({
      where: { cartId },
    });
  }
}
