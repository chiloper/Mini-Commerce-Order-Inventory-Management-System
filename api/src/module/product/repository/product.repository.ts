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

  async getCategories(): Promise<(Category & { _count?: { products: number } })[]> {
    return await this.prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { id: "asc" },
    });
  }

  async createCategory(name: string): Promise<Category> {
    return await this.prisma.category.create({
      data: { name },
    });
  }

  async updateCategory(id: number, name: string): Promise<Category> {
    return await this.prisma.category.update({
      where: { id },
      data: { name },
    });
  }

  async deleteCategory(id: number): Promise<Category> {
    return await this.prisma.$transaction(async (tx) => {
      // Unlink products assigned to this category before deleting
      await tx.product.updateMany({
        where: { catagoryId: id },
        data: { catagoryId: null },
      });
      return await tx.category.delete({
        where: { id },
      });
    });
  }

  async bulkUpsertProducts(items: Array<{
    sku: string;
    name: string;
    categoryName?: string;
    price: number;
    stock: number;
    isActive?: boolean;
    imageUrl?: string;
  }>) {
    const allCategories = await this.prisma.category.findMany();
    const categoryMap = new Map<string, number>();
    for (const cat of allCategories) {
      categoryMap.set(cat.name.trim().toLowerCase(), cat.id);
    }

    let createdCount = 0;
    let updatedCount = 0;
    let failedCount = 0;
    const errors: Array<{ row: number; sku?: string; name?: string; message: string }> = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const rowNum = i + 1;

      // 1. Validation
      const sku = (item.sku || "").trim();
      const name = (item.name || "").trim();

      if (!sku) {
        errors.push({ row: rowNum, message: "รหัสสินค้า (SKU) ห้ามเว้นว่าง" });
        failedCount++;
        continue;
      }

      if (!name) {
        errors.push({ row: rowNum, sku, message: "ชื่อสินค้าห้ามเว้นว่าง" });
        failedCount++;
        continue;
      }

      const price = Number(item.price);
      if (isNaN(price) || price < 0) {
        errors.push({ row: rowNum, sku, name, message: "ราคาขายต้องเป็นตัวเลขที่ไม่ติดลบ" });
        failedCount++;
        continue;
      }

      const stock = Number(item.stock);
      if (isNaN(stock) || stock < 0) {
        errors.push({ row: rowNum, sku, name, message: "จำนวนสต็อกต้องเป็นตัวเลขที่ไม่ติดลบ" });
        failedCount++;
        continue;
      }

      // 2. Category validation (User requested: Error case if category not found in DB)
      let matchedCategoryId: number | null = null;
      if (item.categoryName && item.categoryName.trim()) {
        const catNameKey = item.categoryName.trim().toLowerCase();
        const foundId = categoryMap.get(catNameKey);
        if (!foundId) {
          errors.push({
            row: rowNum,
            sku,
            name,
            message: `ไม่พบหมวดหมู่ "${item.categoryName.trim()}" ในระบบ กรุณาสร้างหมวดหมู่นี้ในระบบก่อนนำเข้า`,
          });
          failedCount++;
          continue;
        }
        matchedCategoryId = foundId;
      }

      // 3. Upsert
      try {
        const existing = await this.prisma.product.findUnique({
          where: { sku },
        });

        const img = item.imageUrl ? item.imageUrl.trim() : null;
        const imagesStr = img ? JSON.stringify([img]) : null;

        if (existing) {
          // Overwrite stock and fields per user's decision
          await this.prisma.product.update({
            where: { id: existing.id },
            data: {
              name,
              price: Math.round(price),
              stock: Math.round(stock),
              catagoryId: matchedCategoryId !== null ? matchedCategoryId : existing.catagoryId,
              isActive: item.isActive !== undefined ? item.isActive : existing.isActive,
              ...(img ? { imageUrl: img, images: imagesStr } : {}),
            },
          });
          updatedCount++;
        } else {
          await this.prisma.product.create({
            data: {
              sku,
              name,
              price: Math.round(price),
              stock: Math.round(stock),
              catagoryId: matchedCategoryId,
              isActive: item.isActive !== undefined ? item.isActive : true,
              imageUrl: img,
              images: imagesStr,
            },
          });
          createdCount++;
        }
      } catch (err: any) {
        errors.push({
          row: rowNum,
          sku,
          name,
          message: err?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
        });
        failedCount++;
      }
    }

    return {
      totalRows: items.length,
      successCount: createdCount + updatedCount,
      createdCount,
      updatedCount,
      failedCount,
      errors,
    };
  }
}
