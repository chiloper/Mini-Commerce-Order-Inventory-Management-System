import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { CreateProductDto, QueryProductDto, UpdateProductDto } from "../dto/product.dto";
import { Category, Product } from "../../../generated/prisma/client";

@Injectable()
export class ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  private transformProduct(p: any): any {
    if (!p) return p;
    let parsedImages: string[] = [];
    if (p.images) {
      try {
        parsedImages = typeof p.images === "string" ? JSON.parse(p.images) : p.images;
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

  async findAll(query: QueryProductDto): Promise<(Product & { catagory: Category | null })[]> {
    const where: any = {};

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

  async findById(id: number): Promise<(Product & { catagory: Category | null }) | null> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        catagory: true,
      },
    });
    return this.transformProduct(product);
  }

  async findBySku(sku: string): Promise<(Product & { catagory: Category | null }) | null> {
    const product = await this.prisma.product.findUnique({
      where: { sku },
      include: {
        catagory: true,
      },
    });
    return this.transformProduct(product);
  }

  async create(data: CreateProductDto): Promise<Product> {
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

  async update(id: number, data: UpdateProductDto): Promise<Product> {
    let primaryUrl = data.imageUrl;
    let imagesJson: string | undefined = undefined;
    if (data.images !== undefined) {
      if (Array.isArray(data.images)) {
        imagesJson = JSON.stringify(data.images);
        if (primaryUrl === undefined && data.images.length > 0) {
          primaryUrl = data.images[0];
        }
      } else {
        imagesJson = null as any;
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
    return await this.prisma.product.update({
      where: { id },
      data: { isActive: false },
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
