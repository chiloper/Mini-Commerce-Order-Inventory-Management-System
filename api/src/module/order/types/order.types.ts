import { Order, OrderItem, Product, Promotion, User } from "../../../generated/prisma/client";

export interface DiscountBreakdownItemData {
  productId?: number | null;
  name?: string;
  sku?: string;
  price?: number;
  quantity?: number;
}

export interface DiscountBreakdownData {
  subtotal?: number;
  discountAmount?: number;
  shippingFee?: number;
  promoCode?: string | null;
  promoDescription?: string;
  paymentMethod?: string;
  customerName?: string;
  shippingAddress?: string;
  phone?: string;
  statusText?: string;
  items?: DiscountBreakdownItemData[];
}

export interface ValidatePromotionResult {
  id: number;
  code: string;
  type: string;
  value: number;
  discountAmount: number;
  description: string;
  valid?: boolean;
  discount?: number;
  promotion?: Promotion;
}

export interface MetricCard {
  label: string;
  value: string;
  note: string;
  noteColor?: string;
}

export interface StockLogEntry {
  time: string;
  text: string;
  delta: string;
  color: string;
}

export type OrderItemWithProduct = OrderItem & {
  product?: Product | null;
};

export type OrderWithRelations = Order & {
  user?: Pick<User, "id" | "email"> | { email: string } | null;
  promotion?: Promotion | null;
  orderItems?: OrderItemWithProduct[];
};

export interface DashboardStatsResult {
  stats: MetricCard[];
  lowStockProducts: Product[];
  recentOrders: OrderWithRelations[];
  stockLog: StockLogEntry[];
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
