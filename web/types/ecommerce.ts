// Type and Interface definitions for the e-commerce system

export interface Category {
  id: number;
  name: string;
  _count?: {
    products?: number;
  };
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  price: number;
  stock: number;
  held?: number;
  catagoryId?: number | null;
  isActive: boolean;
  imageUrl?: string | null;
  images?: string[] | string | null;
  catagory?: Category | null;
  category?: Category | null;
  description?: string | null;
}

export interface CreateProductInput {
  sku: string;
  name: string;
  price: number;
  stock: number;
  catagoryId?: number;
  imageUrl?: string;
  images?: string[];
  isActive?: boolean;
  description?: string;
}

export interface UpdateProductInput {
  sku?: string;
  name?: string;
  price?: number;
  stock?: number;
  catagoryId?: number;
  imageUrl?: string;
  images?: string[];
  isActive?: boolean;
  description?: string;
}

export interface CartItem {
  id: number;
  cartId?: number | null;
  productId: number;
  quantity: number;
  productName?: string;
  sku?: string;
  price?: number;
  totalPrice?: number;
  stock?: number;
  isOverStock?: boolean;
  category?: string;
  imageUrl?: string | null;
  images?: string | string[] | null;
  product?: Product;
}

export interface Cart {
  id?: number;
  userId?: number | null;
  status?: boolean;
  items: CartItem[];
  totalQuantity: number;
  subtotal: number;
}

export type PromotionType = "fixed" | "percentage" | string;

export interface Promotion {
  id: number;
  code: string;
  type: PromotionType;
  value: number;
  usageLimit: number;
  usedCount: number;
  expiresAt: string | Date;
  isActive?: boolean;
  discountType?: string;
  discountValue?: number;
  minOrderAmount?: number;
}

export interface CreatePromotionInput {
  code: string;
  type: PromotionType;
  value: number;
  usageLimit: number;
  expiresAt: string;
  isActive?: boolean;
  discountType?: string;
  discountValue?: number;
  minOrderAmount?: number;
}

export interface UpdatePromotionInput {
  code?: string;
  type?: PromotionType;
  value?: number;
  usageLimit?: number;
  expiresAt?: string;
  isActive?: boolean;
  discountType?: string;
  discountValue?: number;
  minOrderAmount?: number;
}

export interface ValidatePromotionResult {
  id?: number;
  code?: string;
  type?: string;
  value?: number;
  valid?: boolean;
  promotion?: Promotion;
  discountAmount?: number;
  discount?: number;
  description?: string;
  message?: string;
}

export type OrderStatus = "wait" | "paid" | "shipped" | "cancelled" | string;

export interface DiscountBreakdownItem {
  productId?: number | null;
  name?: string;
  sku?: string;
  price?: number;
  quantity?: number;
  product?: { name?: string; price?: number };
}

export interface DiscountBreakdown {
  subtotal?: number;
  discountAmount?: number;
  shippingFee?: number;
  promoCode?: string | null;
  promoDescription?: string | null;
  paymentMethod?: string;
  customerName?: string;
  shippingAddress?: string;
  phone?: string;
  channel?: string;
  isManual?: boolean;
  note?: string;
  statusText?: OrderStatus;
  items?: DiscountBreakdownItem[];
}

export interface OrderItem {
  id: number;
  orderId?: number | null;
  productId?: number | null;
  product?: Product;
}

export interface Order {
  id: number;
  userId?: number | null;
  status: boolean;
  total: number;
  totalAmount?: number;
  customerName?: string;
  items?: DiscountBreakdownItem[];
  promotionId?: number | null;
  discountBreakdown: DiscountBreakdown;
  createdAt: string | Date;
  orderItems?: OrderItem[];
  promotion?: Promotion | null;
  user?: { id?: number; email: string } | null;
}

export interface CheckoutInput {
  idempotencyKey: string;
  promotionCode?: string;
  paymentMethod: string;
  customerName?: string;
  shippingAddress?: string;
  phone?: string;
}

export interface ManualOrderItemInput {
  productId: number;
  quantity: number;
  price?: number;
}

export interface CreateManualOrderInput {
  customerName: string;
  phone?: string;
  shippingAddress?: string;
  paymentMethod: string;
  statusText?: string;
  shippingFee?: number;
  discountAmount?: number;
  promotionCode?: string;
  channel?: string;
  note?: string;
  items: ManualOrderItemInput[];
}

export interface MetricCard {
  label: string;
  value: string;
  note: string;
  noteColor?: string;
}

export interface StockMovementLog {
  time: string;
  text: string;
  delta: string;
  color: string;
}

export interface DailyRevenuePoint {
  date: string;
  label: string;
  dayName: string;
  revenue: number;
  ordersCount: number;
}

export interface DashboardStats {
  stats: MetricCard[];
  lowStockProducts: Product[];
  recentOrders: Order[];
  stockLog: StockMovementLog[];
  dailyRevenue?: DailyRevenuePoint[];
}

export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
