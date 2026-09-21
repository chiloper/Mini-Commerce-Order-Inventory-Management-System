import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { CreateProductDto, QueryProductDto, UpdateProductDto } from "../dto/product.dto";
import { Category, Product, Prisma } from "../../../generated/prisma/client";

import type { ProductWithCategory } from "../types/product.types";
export type { ProductWithCategory };

@Injectable()
export class ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  private transformProduct<T extends { images?: string | null; imageUrl?: string | null }>(
    p: T
  ): Omit<T, "images"> & { images: string[] } {
    let parsedImages: string[] = [];
    if (p.images) {
      try {
        parsedImages = typeof p.images === "string" ? JSON.parse(p.images) : (p.images as unknown as string[]);
      } catch {
        parsedImages = [];
      }
    }
    if (parsedImages.length === 0 && p.imageUrl) {
      parsedImages = [p.imageUrl];
    }
    return {
      ...p,
      images: parsedImages,
    };
  }

  async findAll(query: QueryProductDto): Promise<ProductWithCategory[]> {
    const where: Prisma.ProductWhereInput = {};

    if (query.activeOnly) {
      where.isActive = true;
    }

    if (query.catagoryId) {
      where.catagoryId = query.catagoryId;
    }

    if (query.category) {
      where.catagory = {
        name: query.category,
      };
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { sku: { contains: query.search } },
      ];
    }

    const list = await this.prisma.product.findMany({
      where,
      include: {
        catagory: true,
      },
      orderBy: { id: "asc" },
    });

    return list.map((p) => this.transformProduct(p));
  }

  async findPaginated(query: QueryProductDto): Promise<{
    data: ProductWithCategory[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 10);
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};

    if (query.activeOnly) {
      where.isActive = true;
    }

    if (query.catagoryId) {
      where.catagoryId = query.catagoryId;
    }

    if (query.category) {
      where.catagory = {
        name: query.category,
      };
    }

    if (query.search && query.search.trim()) {
      where.OR = [
        { name: { contains: query.search.trim() } },
        { sku: { contains: query.search.trim() } },
      ];
    }

    if (query.stockFilter === "low") {
      where.stock = { gt: 0, lte: 10 };
      where.isActive = true;
    } else if (query.stockFilter === "out") {
      where.stock = 0;
      where.isActive = true;
    } else if (query.stockFilter === "archived") {
      where.isActive = false;
    }

    const total = await this.prisma.product.count({ where });
    const list = await this.prisma.product.findMany({
      where,
      skip,
      take: limit,
      include: {
        catagory: true,
      },
      orderBy: { id: "desc" },
    });

    return {
      data: list.map((p) => this.transformProduct(p)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findById(id: number): Promise<ProductWithCategory | null> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        catagory: true,
      },
    });
    return product ? this.transformProduct(product) : null;
  }

  async findBySku(sku: string): Promise<ProductWithCategory | null> {
    const product = await this.prisma.product.findUnique({
      where: { sku },
      include: {
        catagory: true,
      },
    });
    return product ? this.transformProduct(product) : null;
  }

  async create(data: CreateProductDto): Promise<ProductWithCategory> {
    let primaryUrl = data.imageUrl;
    let imagesJson: string | null = null;
    if (data.images && Array.isArray(data.images)) {
      imagesJson = JSON.stringify(data.images);
      if (!primaryUrl && data.images.length > 0) {
        primaryUrl = data.images[0];
      }
    }

    const created = await this.prisma.product.create({
      data: {
        sku: data.sku,
        name: data.name,
        price: data.price,
        stock: data.stock,
        catagoryId: data.catagoryId ?? null,
        isActive: data.isActive ?? true,
        imageUrl: primaryUrl ?? null,
        images: imagesJson,
      },
      include: { catagory: true },
    });
    return this.transformProduct(created);
  }

  async update(id: number, data: UpdateProductDto): Promise<ProductWithCategory> {
    let primaryUrl = data.imageUrl;
    let imagesJson: string | null | undefined = undefined;
    if (data.images !== undefined) {
      if (Array.isArray(data.images)) {
        imagesJson = JSON.stringify(data.images);
        if (primaryUrl === undefined && data.images.length > 0) {
          primaryUrl = data.images[0];
        }
      } else {
        imagesJson = null;
      }
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.stock !== undefined && { stock: data.stock }),
        ...(data.catagoryId !== undefined && { catagoryId: data.catagoryId }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(primaryUrl !== undefined && { imageUrl: primaryUrl }),
        ...(imagesJson !== undefined && { images: imagesJson }),
      },
      include: { catagory: true },
    });
    return this.transformProduct(updated);
  }

  async delete(id: number): Promise<Product> {
    return await this.prisma.$transaction(async (tx) => {
      await tx.cartItem.deleteMany({ where: { productId: id } });
      await tx.orderItem.updateMany({ where: { productId: id }, data: { productId: null } });
      return await tx.product.delete({ where: { id } });
    });
  }

  async getCategories(): Promise<Category[]> {
    return await this.prisma.category.findMany({
      orderBy: { id: "asc" },
    });
  }

  async createCategory(name: string): Promise<Category> {
    return await this.prisma.category.create({
      data: { name },
    });
  }
}
