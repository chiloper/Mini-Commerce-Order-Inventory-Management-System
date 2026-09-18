import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class CheckoutDto {
  @IsString()
  @IsNotEmpty({ message: "Idempotency key is required" })
  idempotencyKey!: string;

  @IsOptional()
  @IsString()
  promotionCode?: string;

  @IsString()
  @IsNotEmpty({ message: "Payment method is required" })
  paymentMethod!: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  shippingAddress?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class ValidatePromotionDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  subtotal!: number;
}

export class CreatePromotionDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  value!: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  usageLimit!: number;

  @IsDateString()
  expiresAt!: string;
}

export class UpdateOrderStatusDto {
  @IsString()
  @IsNotEmpty()
  status!: string;
}

export class UpdatePromotionDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  value?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  usageLimit?: number;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class ManualOrderItemDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  productId!: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  price?: number;
}

export class CreateManualOrderDto {
  @IsString()
  @IsNotEmpty({ message: "ชื่อลูกค้าจำเป็นต้องกรอก" })
  customerName!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  shippingAddress?: string;

  @IsString()
  @IsNotEmpty({ message: "วิธีชำระเงินจำเป็นต้องระบุ" })
  paymentMethod!: string;

  @IsOptional()
  @IsString()
  statusText?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  shippingFee?: number;

  @IsOptional()
  @IsString()
  promotionCode?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  discountAmount?: number;

  @IsOptional()
  @IsString()
  channel?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ManualOrderItemDto)
  @ArrayMinSize(1, { message: "ต้องระบุสินค้าอย่างน้อย 1 รายการ" })
  items!: ManualOrderItemDto[];
}

export class QueryOrderDto {
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
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class QueryPromotionDto {
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
  search?: string;
}


