import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { CreatePromotionDto } from "../dto/order.dto";

@Injectable()
export class OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findIdempotencyKey(key: string) {
    return await this.prisma.idempotencyKey.findUnique({
      where: { key },
    });
  }

  async createIdempotencyKey(key: string, orderId: number, responsePayload: any) {
    return await this.prisma.idempotencyKey.create({
      data: {
        key,
        orderId,
        responsePayload,
      },
    });
  }

  async findPromotionByCode(code: string) {
    return await this.prisma.promotion.findFirst({
      where: { code: code.toUpperCase() },
    });
  }

  async findAllPromotions() {
    return await this.prisma.promotion.findMany({
      orderBy: { id: "desc" },
    });
  }

  async createPromotion(dto: CreatePromotionDto) {
    return await this.prisma.promotion.create({
      data: {
        code: dto.code.toUpperCase(),
        type: dto.type,
        value: dto.value,
        usageLimit: dto.usageLimit,
        usedCount: 0,
        expiresAt: new Date(dto.expiresAt),
      },
    });
  }

  async updatePromotion(id: number, dto: any) {
    const data: any = {};
    if (dto.code !== undefined) data.code = dto.code.toUpperCase();
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.value !== undefined) data.value = dto.value;
    if (dto.usageLimit !== undefined) data.usageLimit = dto.usageLimit;
    if (dto.expiresAt !== undefined) data.expiresAt = new Date(dto.expiresAt);

    return await this.prisma.promotion.update({
      where: { id },
      data,
    });
  }

  async deletePromotion(id: number) {
    return await this.prisma.promotion.delete({
      where: { id },
    });
  }

  async findOrderById(id: number) {
    return await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true } },
        promotion: true,
        orderItems: {
          include: {
            product: {
              include: { catagory: true },
            },
          },
        },
      },
    });
  }

  async findOrdersByUserId(userId: number) {
    return await this.prisma.order.findMany({
      where: { userId },
      include: {
        promotion: true,
        orderItems: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { id: "desc" },
    });
  }

  async findAllOrders() {
    return await this.prisma.order.findMany({
      include: {
        user: { select: { id: true, email: true } },
        promotion: true,
        orderItems: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { id: "desc" },
    });
  }

  async updateOrderStatus(id: number, statusText: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) return null;

    const breakdown = (typeof order.discountBreakdown === "object" && order.discountBreakdown !== null
      ? order.discountBreakdown
      : {}) as Record<string, any>;

    breakdown.statusText = statusText;

    return await this.prisma.order.update({
      where: { id },
      data: {
        status: statusText !== "cancelled",
        discountBreakdown: breakdown,
      },
    });
  }

  async getDashboardStats() {
    const totalOrders = await this.prisma.order.count();
    const allOrders = await this.prisma.order.findMany({
      select: { total: true, createdAt: true, discountBreakdown: true },
    });

    const totalSales = allOrders.reduce((acc, o) => acc + o.total, 0);

    const pendingDelivery = allOrders.filter((o) => {
      const b = (o.discountBreakdown as any) || {};
      return b.statusText === "paid" || b.statusText === "wait";
    }).length;

    const lowStockProducts = await this.prisma.product.findMany({
      where: {
        stock: { lte: 10 },
        isActive: true,
      },
      include: { catagory: true },
    });

    const recentOrders = await this.prisma.order.findMany({
      take: 8,
      orderBy: { id: "desc" },
      include: {
        user: { select: { email: true } },
        orderItems: { include: { product: true } },
      },
    });

    return {
      stats: [
        { label: "คำสั่งซื้อทั้งหมด", value: totalOrders.toString(), note: "+12% จากเมื่อวาน" },
        { label: "ยอดขายรวม", value: `฿${totalSales.toLocaleString("th-TH")}`, note: `เฉลี่ย ฿${totalOrders > 0 ? Math.round(totalSales / totalOrders).toLocaleString("th-TH") : 0} ต่อบิล` },
        { label: "รอจัดส่ง", value: pendingDelivery.toString(), note: "ต้องจัดส่งภายใน 24 ชม." },
        { label: "SKU ใกล้หมด", value: lowStockProducts.length.toString(), note: "ต้องเติมภายใน 48 ชม." },
      ],
      lowStockProducts,
      recentOrders,
    };
  }
}
