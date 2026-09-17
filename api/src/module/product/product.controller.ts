import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ProductService } from "./product.service";
import {
  CreateCategoryDto,
  CreateProductDto,
  QueryProductDto,
  UpdateProductDto,
} from "./dto/product.dto";
import { Public } from "../auth/decorators/public.decorator";
import { Roles } from "../auth/decorators/role.decorator";

@Controller()
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Public()
  @Get("products")
  findAll(@Query() query: QueryProductDto) {
    return this.productService.findAll(query);
  }

  @Public()
  @Get("products/:id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.productService.findById(id);
  }

  @Roles("admin")
  @Post("products")
  create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }

  @Roles("admin")
  @Patch("products/:id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto
  ) {
    return this.productService.update(id, dto);
  }

  @Roles("admin")
  @Delete("products/:id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.productService.remove(id);
  }

  @Public()
  @Get("categories")
  getCategories() {
    return this.productService.getCategories();
  }

  @Roles("admin")
  @Post("categories")
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.productService.createCategory(dto);
  }
}
