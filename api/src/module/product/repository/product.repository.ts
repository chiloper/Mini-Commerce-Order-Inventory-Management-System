import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { CreateProductDto, QueryProductDto, UpdateProductDto } from "../dto/product.dto";
import { Category, Product } from "../../../generated/prisma/client";

@Injectable()
export class ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

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

    return await this.prisma.product.findMany({
      where,
      include: {
        catagory: true,
      },
      orderBy: { id: "asc" },
    });
  }

  async findById(id: number): Promise<(Product & { catagory: Category | null }) | null> {
    return await this.prisma.product.findUnique({
      where: { id },
      include: {
        catagory: true,
      },
    });
  }

  async findBySku(sku: string): Promise<(Product & { catagory: Category | null }) | null> {
    return await this.prisma.product.findUnique({
      where: { sku },
      include: {
        catagory: true,
      },
    });
  }

  async create(data: CreateProductDto): Promise<Product> {
    return await this.prisma.product.create({
      data: {
        sku: data.sku,
        name: data.name,
        price: data.price,
        stock: data.stock,
        catagoryId: data.catagoryId ?? null,
        isActive: data.isActive ?? true,
      },
      include: { catagory: true },
    });
  }

  async update(id: number, data: UpdateProductDto): Promise<Product> {
    return await this.prisma.product.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.stock !== undefined && { stock: data.stock }),
        ...(data.catagoryId !== undefined && { catagoryId: data.catagoryId }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: { catagory: true },
    });
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
