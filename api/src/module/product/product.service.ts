import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { ProductRepository } from "./repository/product.repository";
import { CreateCategoryDto, CreateProductDto, QueryProductDto, UpdateProductDto } from "./dto/product.dto";
import { Category, Product } from "../../generated/prisma/client";

@Injectable()
export class ProductService {
  constructor(private readonly productRepository: ProductRepository) {}

  async findAll(query: QueryProductDto): Promise<(Product & { catagory: Category | null })[]> {
    return await this.productRepository.findAll(query);
  }

  async findById(id: number): Promise<Product & { catagory: Category | null }> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async findBySku(sku: string): Promise<Product & { catagory: Category | null }> {
    const product = await this.productRepository.findBySku(sku);
    if (!product) {
      throw new NotFoundException(`Product with SKU ${sku} not found`);
    }
    return product;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const existing = await this.productRepository.findBySku(dto.sku);
    if (existing) {
      throw new ConflictException(`Product with SKU ${dto.sku} already exists`);
    }
    return await this.productRepository.create(dto);
  }

  async update(id: number, dto: UpdateProductDto): Promise<Product> {
    await this.findById(id);
    return await this.productRepository.update(id, dto);
  }

  async remove(id: number): Promise<Product> {
    await this.findById(id);
    return await this.productRepository.delete(id);
  }

  async getCategories(): Promise<Category[]> {
    return await this.productRepository.getCategories();
  }

  async createCategory(dto: CreateCategoryDto): Promise<Category> {
    return await this.productRepository.createCategory(dto.name);
  }
}
