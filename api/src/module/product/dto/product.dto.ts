import { IsArray, IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator";
import { Type } from "class-transformer";

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  sku!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  price!: number;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  stock!: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  catagoryId?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsArray()
  images?: string[];
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  price?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  stock?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  catagoryId?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsArray()
  images?: string[];
}

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}

export class QueryProductDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  catagoryId?: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  activeOnly?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsString()
  stockFilter?: "all" | "low" | "out";
}
