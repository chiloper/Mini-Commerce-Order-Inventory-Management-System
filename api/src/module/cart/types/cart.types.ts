export interface CartItemDetail {
  id: number;
  productId: number | null;
  productName: string;
  sku: string;
  price: number;
  quantity: number;
  totalPrice: number;
  stock: number;
  isOverStock: boolean;
  category: string;
  imageUrl?: string | null;
  images?: string | null;
}

export interface CartSummary {
  id: number;
  userId: number | null;
  items: CartItemDetail[];
  totalQuantity: number;
  subtotal: number;
}
