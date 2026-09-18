import { Category, Product } from "../../../generated/prisma/client";

export type ProductWithCategory = Omit<Product, "images"> & {
  catagory: Category | null;
  images: string[];
};

export interface ProductSummary {
  id: number;
  sku: string;
  name: string;
  price: number;
  stock: number;
  isActive: boolean;
  imageUrl?: string | null;
  images: string[];
  catagory?: Category | null;
}
