import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import { ProductService } from "./product.service";
import {
  CreateCategoryDto,
  CreateProductDto,
  QueryProductDto,
  UpdateProductDto,
  UpdateCategoryDto,
  BulkImportProductsDto,
} from "./dto/product.dto";
import { Public } from "../auth/decorators/public.decorator";
import { Roles } from "../auth/decorators/role.decorator";
import type { ProductWithCategory } from "./types/product.types";
import type { Category, Product } from "../../generated/prisma/client";

@Controller()
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Public()
  @Get("products")
  findAll(@Query() query: QueryProductDto): Promise<unknown> {
    if (query.page !== undefined) {
      return this.productService.findPaginated(query);
    }
    return this.productService.findAll(query);
  }

  @Public()
  @Get("products/:id")
  findOne(@Param("id", ParseIntPipe) id: number): Promise<ProductWithCategory> {
    return this.productService.findById(id);
  }

  @Roles("admin")
  @Post("products")
  create(@Body() dto: CreateProductDto): Promise<ProductWithCategory> {
    return this.productService.create(dto);
  }

  @Roles("admin")
  @Patch("products/:id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto
  ): Promise<ProductWithCategory> {
    return this.productService.update(id, dto);
  }

  @Roles("admin")
  @Delete("products/:id")
  remove(@Param("id", ParseIntPipe) id: number): Promise<Product> {
    return this.productService.remove(id);
  }

  @Public()
  @Get("categories")
  getCategories(): Promise<(Category & { _count?: { products: number } })[]> {
    return this.productService.getCategories();
  }

  @Roles("admin")
  @Post("categories")
  createCategory(@Body() dto: CreateCategoryDto): Promise<Category> {
    return this.productService.createCategory(dto);
  }

  @Roles("admin")
  @Put("categories/:id")
  updateCategory(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto
  ): Promise<Category> {
    return this.productService.updateCategory(id, dto);
  }

  @Roles("admin")
  @Delete("categories/:id")
  deleteCategory(@Param("id", ParseIntPipe) id: number): Promise<Category> {
    return this.productService.deleteCategory(id);
  }

  @Roles("admin")
  @Post("bulk-import")
  bulkImport(@Body() dto: BulkImportProductsDto) {
    return this.productService.bulkImport(dto);
  }
}
