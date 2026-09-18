import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { OrderRepository } from "./repository/order.repository";
import { CartRepository } from "../cart/repository/cart.repository";
import { PrismaService } from "../../prisma/prisma.service";
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
import type {
  DashboardStatsResult,
  DiscountBreakdownData,
  OrderWithRelations,
  PaginatedResult,
  ValidatePromotionResult,
} from "./types/order.types";
import type { Order, Promotion } from "../../generated/prisma/client";

@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly cartRepository: CartRepository,
    private readonly prisma: PrismaService
  ) {}

  async validatePromotion(dto: ValidatePromotionDto): Promise<ValidatePromotionResult> {
    const promo = await this.orderRepository.findPromotionByCode(dto.code);
    if (!promo) {
      throw new NotFoundException(`โค้ด ${dto.code} ไม่ถูกต้อง`);
    }

    if (promo.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException(`โค้ด ${dto.code} หมดอายุแล้ว`);
    }

    if (promo.usedCount >= promo.usageLimit) {
      throw new BadRequestException(`โค้ด ${dto.code} ถูกใช้งานครบโควตาแล้ว`);
    }

    let discountAmount = 0;
    let description = "";

    const promoType = (promo.type || "").toLowerCase();

    if (promoType === "percentage") {
      discountAmount = Math.round((dto.subtotal * promo.value) / 100);
      description = `ส่วนลด ${promo.value}% จากยอดสินค้า`;
    } else if (promoType === "fixed") {
      discountAmount = Math.min(dto.subtotal, promo.value);
      description = `ส่วนลด ฿${promo.value.toLocaleString("th-TH")}`;
    } else if (promoType === "freeship") {
      discountAmount = 50; // Standard shipping fee
      description = `ส่งฟรี (มูลค่า ฿50)`;
    }

    return {
      id: promo.id,
      code: promo.code,
      type: promo.type,
      value: promo.value,
      discountAmount,
      discount: discountAmount,
      description,
      valid: true,
      promotion: promo,
    };
  }

  async checkout(userId: number, dto: CheckoutDto): Promise<unknown> {
    // 1. Check Idempotency Key
    const existingKey = await this.orderRepository.findIdempotencyKey(
      dto.idempotencyKey
    );
    if (existingKey) {
      return existingKey.responsePayload;
    }

    // 2. Get user's cart
    const cart = await this.cartRepository.getActiveCartByUserId(userId);
    if (!cart || cart.CartItem.length === 0) {
      throw new BadRequestException("ตะกร้าสินค้าว่างเปล่า ไม่สามารถสั่งซื้อได้");
    }

    // 3. Verify stock
    const cartItems = cart.CartItem;
    for (const item of cartItems) {
      const p = item.product;
      if (!p || !p.isActive) {
        throw new BadRequestException(`สินค้า "${p?.name || item.productId}" ไม่พร้อมจำหน่าย`);
      }
      if (p.stock < item.quantity) {
        throw new ConflictException(
          `สินค้า "${p.name}" เหลือในสต็อกเพียง ${p.stock} ชิ้น (คุณสั่งซื้อ ${item.quantity} ชิ้น)`
        );
      }
    }

    // 4. Calculate subtotal & promotion
    const subtotal = cartItems.reduce(
      (acc, it) => acc + (it.product?.price || 0) * it.quantity,
      0
    );

    let promotionId: number | null = null;
    let promoUsageLimit: number | null = null;
    let discountAmount = 0;
    let promoDescription = "";

    if (dto.promotionCode) {
      const promoResult = await this.validatePromotion({
        code: dto.promotionCode,
        subtotal,
      });
      promotionId = promoResult.id;
      promoUsageLimit = promoResult.promotion?.usageLimit ?? null;
      discountAmount = promoResult.discountAmount;
      promoDescription = promoResult.description;
    }

    const shippingFee =
      subtotal >= 1500 || (dto.promotionCode && dto.promotionCode.toUpperCase() === "FREESHIP")
        ? 0
        : 50;

    const total = Math.max(0, subtotal - discountAmount + shippingFee);

    // 5. Execute Atomic Transaction
    const order = await this.prisma.$transaction(async (tx) => {
      // a. Sort cart items by productId ascending to eliminate deadlock risks
      const sortedCartItems = [...cartItems].sort(
        (a, b) => (a.productId ?? 0) - (b.productId ?? 0)
      );

      // b. Decrement inventory atomically with conditional check (Compare-and-Swap)
      for (const item of sortedCartItems) {
        if (!item.productId) continue;
        const updateResult = await tx.product.updateMany({
          where: {
            id: item.productId,
            stock: { gte: item.quantity },
            isActive: true,
          },
          data: {
            stock: { decrement: item.quantity },
          },
        });

        if (updateResult.count === 0) {
          const freshProduct = await tx.product.findUnique({
            where: { id: item.productId },
          });
          if (!freshProduct || !freshProduct.isActive) {
            throw new ConflictException(
              `สินค้า "${freshProduct?.name || item.productId}" ไม่พร้อมจำหน่ายหรือถูกปิดการขายแล้ว`
            );
          }
          throw new ConflictException(
            `สินค้า "${freshProduct.name}" สต็อกไม่เพียงพอระหว่างทำรายการ (คงเหลือ ${freshProduct.stock} ชิ้น, คุณสั่งซื้อ ${item.quantity} ชิ้น)`
          );
        }
      }

      // c. Create Order
      const discountBreakdown = {
        subtotal,
        discountAmount,
        shippingFee,
        promoCode: dto.promotionCode || null,
        promoDescription,
        paymentMethod: dto.paymentMethod,
        customerName: dto.customerName || "ลูกค้าทั่วไป",
        shippingAddress: dto.shippingAddress || "-",
        phone: dto.phone || "-",
        statusText: "paid", // Initial order status
        items: cartItems.map((it) => ({
          productId: it.productId,
          name: it.product?.name,
          sku: it.product?.sku,
          price: it.product?.price,
          quantity: it.quantity,
        })),
      };

      const newOrder = await tx.order.create({
        data: {
          userId,
          status: true,
          total,
          promotionId,
          discountBreakdown,
          createdAt: new Date(),
          orderItems: {
            create: cartItems.map((it) => ({
              productId: it.productId,
            })),
          },
        },
        include: {
          orderItems: {
            include: { product: true },
          },
          promotion: true,
        },
      });

      // d. Increment promotion usage atomically with quota & expiry condition using pure Prisma Client
      if (promotionId) {
        let limit = promoUsageLimit;
        if (limit === null) {
          const freshPromo = await tx.promotion.findUnique({ where: { id: promotionId } });
          limit = freshPromo?.usageLimit ?? 0;
        }

        const promoResult = await tx.promotion.updateMany({
          where: {
            id: promotionId,
            usedCount: { lt: limit },
            expiresAt: { gt: new Date() },
          },
          data: {
            usedCount: { increment: 1 },
          },
        });

        if (promoResult.count === 0) {
          throw new ConflictException(
            `โค้ดโปรโมชั่นถูกใช้งานจนครบโควตา หรือหมดอายุระหว่างทำรายการ`
          );
        }
      }

      // d. Clear user's cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      // e. Record Idempotency Key
      await tx.idempotencyKey.create({
        data: {
          key: dto.idempotencyKey,
          orderId: newOrder.id,
          responsePayload: newOrder,
        },
      });

      return newOrder;
    });

    return order;
  }

  async createManualOrder(adminUserId: number, dto: CreateManualOrderDto): Promise<unknown> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException("ต้องระบุสินค้าอย่างน้อย 1 รายการ");
    }

    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    const isPaidOrProcessing = (dto.statusText || "paid") !== "wait";

    for (const item of dto.items) {
      const p = productMap.get(item.productId);
      if (!p || !p.isActive) {
        throw new BadRequestException(
          `สินค้า #${item.productId} ไม่พร้อมจำหน่ายหรือไม่มีอยู่ในระบบ`
        );
      }
      if (isPaidOrProcessing && p.stock < item.quantity) {
        throw new ConflictException(
          `สินค้า "${p.name}" เหลือในสต็อกเพียง ${p.stock} ชิ้น (คุณสั่งซื้อ ${item.quantity} ชิ้น)`
        );
      }
    }

    const calculatedItems = dto.items.map((item) => {
      const p = productMap.get(item.productId)!;
      const unitPrice =
        item.price !== undefined && item.price >= 0 ? item.price : p.price;
      return {
        productId: p.id,
        name: p.name,
        sku: p.sku,
        price: unitPrice,
        quantity: item.quantity,
      };
    });

    const subtotal = calculatedItems.reduce(
      (acc, it) => acc + it.price * it.quantity,
      0
    );

    let promotionId: number | null = null;
    let promoUsageLimit: number | null = null;
    let discountAmount = Math.max(0, dto.discountAmount || 0);
    let promoDescription = "";
    let promoCode: string | null = null;

    if (dto.promotionCode && dto.promotionCode.trim()) {
      const promoResult = await this.validatePromotion({
        code: dto.promotionCode.trim(),
        subtotal,
      });
      promotionId = promoResult.id;
      promoUsageLimit = promoResult.promotion?.usageLimit ?? null;
      discountAmount = promoResult.discountAmount;
      promoDescription = promoResult.description;
      promoCode = promoResult.code;
    }

    let shippingFee =
      dto.shippingFee !== undefined
        ? Math.max(0, dto.shippingFee)
        : subtotal >= 1500
        ? 0
        : 50;

    if (promoCode && promoCode.toUpperCase() === "FREESHIP") {
      shippingFee = 0;
    }

    const total = Math.max(0, subtotal - discountAmount + shippingFee);
    const statusText = dto.statusText || "paid";

    const newOrder = await this.prisma.$transaction(async (tx) => {
      if (isPaidOrProcessing) {
        // Sort items by productId ascending to eliminate deadlock risks
        const sortedItems = [...dto.items].sort((a, b) => a.productId - b.productId);
        for (const it of sortedItems) {
          const updateResult = await tx.product.updateMany({
            where: {
              id: it.productId,
              stock: { gte: it.quantity },
              isActive: true,
            },
            data: {
              stock: { decrement: it.quantity },
            },
          });

          if (updateResult.count === 0) {
            const freshProduct = await tx.product.findUnique({
              where: { id: it.productId },
            });
            if (!freshProduct || !freshProduct.isActive) {
              throw new ConflictException(
                `สินค้า "${freshProduct?.name || it.productId}" ไม่พร้อมจำหน่ายหรือถูกปิดการขายแล้ว`
              );
            }
            throw new ConflictException(
              `สินค้า "${freshProduct.name}" สต็อกไม่เพียงพอระหว่างทำรายการ (คงเหลือ ${freshProduct.stock} ชิ้น, คุณสั่งซื้อ ${it.quantity} ชิ้น)`
            );
          }
        }
      }

      if (promotionId) {
        let limit = promoUsageLimit;
        if (limit === null) {
          const freshPromo = await tx.promotion.findUnique({ where: { id: promotionId } });
          limit = freshPromo?.usageLimit ?? 0;
        }

        const promoResult = await tx.promotion.updateMany({
          where: {
            id: promotionId,
            usedCount: { lt: limit },
            expiresAt: { gt: new Date() },
          },
          data: {
            usedCount: { increment: 1 },
          },
        });

        if (promoResult.count === 0) {
          throw new ConflictException(
            `โค้ดโปรโมชั่นถูกใช้งานจนครบโควตา หรือหมดอายุระหว่างทำรายการ`
          );
        }
      }

      const discountBreakdown = {
        subtotal,
        discountAmount,
        shippingFee,
        promoCode,
        promoDescription:
          promoDescription ||
          dto.note ||
          (dto.channel
            ? `สร้างคำสั่งซื้อด้วยตนเอง (${dto.channel})`
            : "สร้างคำสั่งซื้อด้วยตนเอง (หน้าร้าน/ออฟไลน์)"),
        paymentMethod: dto.paymentMethod,
        customerName: dto.customerName || "ลูกค้าทั่วไป",
        shippingAddress: dto.shippingAddress || "-",
        phone: dto.phone || "-",
        statusText,
        channel: dto.channel || "หน้าร้าน / Direct",
        note: dto.note || "",
        items: calculatedItems,
        isManual: true,
      };

      const created = await tx.order.create({
        data: {
          userId: adminUserId,
          status: true,
          total,
          promotionId,
          discountBreakdown,
          createdAt: new Date(),
          orderItems: {
            create: dto.items.map((it) => ({
              productId: it.productId,
            })),
          },
        },
        include: {
          orderItems: {
            include: { product: true },
          },
        },
      });

      return created;
    });

    return newOrder;
  }

  async findOrders(userId: number, role?: string): Promise<OrderWithRelations[]> {
    if (role === "admin") {
      return await this.orderRepository.findAllOrders();
    }
    return await this.orderRepository.findOrdersByUserId(userId);
  }

  async findOrdersPaginated(
    userId: number,
    role?: string,
    query?: QueryOrderDto
  ): Promise<PaginatedResult<OrderWithRelations>> {
    return await this.orderRepository.findOrdersPaginated(userId, role, query);
  }

  async findOrderById(id: number): Promise<OrderWithRelations> {
    const order = await this.orderRepository.findOrderById(id);
    if (!order) {
      throw new NotFoundException(`ไม่พบคำสั่งซื้อ #${id}`);
    }
    return order;
  }

  async updateStatus(id: number, dto: UpdateOrderStatusDto): Promise<Order> {
    const existing = await this.orderRepository.findOrderById(id);
    if (!existing) {
      throw new NotFoundException(`ไม่พบคำสั่งซื้อ #${id}`);
    }

    const breakdown = (existing.discountBreakdown as unknown as DiscountBreakdownData) || {};
    const currentStatus = (breakdown.statusText || "").toLowerCase();
    if (currentStatus === "shipped") {
      throw new BadRequestException("คำสั่งซื้อนี้มีสถานะจัดส่งแล้ว ไม่สามารถปรับเปลี่ยนสถานะได้อีก");
    }

    const updated = await this.orderRepository.updateOrderStatus(id, dto.status);
    if (!updated) {
      throw new NotFoundException(`ไม่พบคำสั่งซื้อ #${id}`);
    }
    return updated;
  }

  async getPromotions(): Promise<Promotion[]> {
    return await this.orderRepository.findAllPromotions();
  }

  async getPromotionsPaginated(
    query?: QueryPromotionDto
  ): Promise<PaginatedResult<Promotion>> {
    return await this.orderRepository.findPromotionsPaginated(query);
  }

  async createPromotion(dto: CreatePromotionDto): Promise<Promotion> {
    const existing = await this.orderRepository.findPromotionByCode(dto.code);
    if (existing) {
      throw new ConflictException(`โค้ด ${dto.code} มีอยู่แล้ว`);
    }
    return await this.orderRepository.createPromotion(dto);
  }

  async updatePromotion(id: number, dto: UpdatePromotionDto): Promise<Promotion> {
    return await this.orderRepository.updatePromotion(id, dto);
  }

  async deletePromotion(id: number): Promise<Promotion> {
    return await this.orderRepository.deletePromotion(id);
  }

  async getDashboardStats(): Promise<DashboardStatsResult> {
    return await this.orderRepository.getDashboardStats();
  }
}
