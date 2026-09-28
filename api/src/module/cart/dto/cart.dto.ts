import { IsArray, IsInt, Min, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class AddToCartDto {
  @IsInt()
  @Type(() => Number)
  productId!: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity!: number;
}

export class UpdateCartItemDto {
  @IsInt()
  @Min(0)
  @Type(() => Number)
  quantity!: number;
}

export class MergeCartItemDto {
  @IsInt()
  @Type(() => Number)
  productId!: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity!: number;
}

export class MergeCartDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MergeCartItemDto)
  items!: MergeCartItemDto[];
}

