import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { ProductRepository } from "./repository/product.repository";
import { ProductWithCategory } from "./types/product.types";
import { CreateCategoryDto, CreateProductDto, QueryProductDto, UpdateProductDto, UpdateCategoryDto, BulkImportProductsDto } from "./dto/product.dto";
import { Category, Product } from "../../generated/prisma/client";

@Injectable()
export class ProductService {
  constructor(private readonly productRepository: ProductRepository) {}

  async findAll(query: QueryProductDto): Promise<ProductWithCategory[]> {
    return await this.productRepository.findAll(query);
  }

  async findPaginated(query: QueryProductDto) {
    return await this.productRepository.findPaginated(query);
  }

  async findById(id: number): Promise<ProductWithCategory> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async findBySku(sku: string): Promise<ProductWithCategory> {
    const product = await this.productRepository.findBySku(sku);
    if (!product) {
      throw new NotFoundException(`Product with SKU ${sku} not found`);
    }
    return product;
  }

  async create(dto: CreateProductDto): Promise<ProductWithCategory> {
    const existing = await this.productRepository.findBySku(dto.sku);
    if (existing) {
      throw new ConflictException(`Product with SKU ${dto.sku} already exists`);
    }
    return await this.productRepository.create(dto);
  }

  async update(id: number, dto: UpdateProductDto): Promise<ProductWithCategory> {
    await this.findById(id);
    return await this.productRepository.update(id, dto);
  }

  async remove(id: number): Promise<Product> {
    await this.findById(id);
    return await this.productRepository.delete(id);
  }

  async getCategories(): Promise<(Category & { _count?: { products: number } })[]> {
    return await this.productRepository.getCategories();
  }

  async createCategory(dto: CreateCategoryDto): Promise<Category> {
    return await this.productRepository.createCategory(dto.name);
  }

  async updateCategory(id: number, dto: UpdateCategoryDto): Promise<Category> {
    return await this.productRepository.updateCategory(id, dto.name);
  }

  async deleteCategory(id: number): Promise<Category> {
    return await this.productRepository.deleteCategory(id);
  }

  async bulkImport(dto: BulkImportProductsDto) {
    return await this.productRepository.bulkUpsertProducts(dto.items);
  }
}
