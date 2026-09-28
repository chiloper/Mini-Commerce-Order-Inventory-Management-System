import { API_BASE_URL } from "./auth/config";
import { readAccesToken, readRefreshToken, writeSession } from "./auth/session";
import { needsRefresh } from "./auth/tokens";
import { refreshSession } from "./auth/refresh";
import type {
  ApiResponse,
  Product,
  Category,
  CreateProductInput,
  UpdateProductInput,
  Cart,
  CartItem,
  Promotion,
  CreatePromotionInput,
  UpdatePromotionInput,
  ValidatePromotionResult,
  CheckoutInput,
  CreateManualOrderInput,
  Order,
  DashboardStats,
  PaginatedResult,
} from "@/types/ecommerce";

async function getValidToken(): Promise<string | null> {
  let at = await readAccesToken();
  const rt = await readRefreshToken();
  if (!at || needsRefresh(at)) {
    if (rt) {
      const refreshed = await refreshSession(rt);
      if (refreshed.ok) {
        await writeSession(refreshed.data);
        at = refreshed.data.accessToken;
      }
    }
  }
  return at || null;
}

async function apiRequest<T>(
  path: string,
  init: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = await getValidToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      cache: "no-store",
    });

    if (res.status === 204) {
      return { ok: true };
    }

    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      return {
        ok: false,
        error: (body.message as string) || "Request failed",
      };
    }

    return { ok: true, data: body as unknown as T };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Cannot connect to server";
    return { ok: false, error: message };
  }
}

// 1. Products & Categories
export async function getProducts(query?: {
  search?: string;
  category?: string;
}): Promise<Product[]> {
  const params = new URLSearchParams();
  if (query?.search) params.append("search", query.search);
  if (query?.category) params.append("category", query.category);

  const qs = params.toString() ? `?${params.toString()}` : "";
  const res = await apiRequest<Product[]>(`/products${qs}`);
  return res.data || [];
}

export async function getPaginatedProducts(query: {
  page: number;
  limit?: number;
  search?: string;
  category?: string;
  stockFilter?: string;
}): Promise<PaginatedResult<Product>> {
  const params = new URLSearchParams();
  params.append("page", String(query.page));
  if (query.limit) params.append("limit", String(query.limit));
  if (query.search) params.append("search", query.search);
  if (query.category) params.append("category", query.category);
  if (query.stockFilter) params.append("stockFilter", query.stockFilter);

  const res = await apiRequest<PaginatedResult<Product>>(`/products?${params.toString()}`);
  return (
    res.data || {
      data: [],
      total: 0,
      page: query.page,
      limit: query.limit || 10,
      totalPages: 1,
    }
  );
}

export async function getProductById(id: number): Promise<Product | null> {
  const res = await apiRequest<Product>(`/products/${id}`);
  return res.data || null;
}

export async function getCategories(): Promise<Category[]> {
  const res = await apiRequest<Category[]>(`/categories`);
  return res.data || [];
}

export async function createCategoryAction(name: string): Promise<ApiResponse<Category>> {
  return await apiRequest<Category>(`/categories`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function updateCategoryAction(id: number, name: string): Promise<ApiResponse<Category>> {
  return await apiRequest<Category>(`/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify({ name }),
  });
}

export async function deleteCategoryAction(id: number): Promise<ApiResponse<void>> {
  return await apiRequest<void>(`/categories/${id}`, {
    method: "DELETE",
  });
}

export interface BulkImportResult {
  totalRows: number;
  successCount: number;
  createdCount: number;
  updatedCount: number;
  failedCount: number;
  errors: Array<{ row: number; sku?: string; name?: string; message: string }>;
}

export async function bulkImportProductsAction(items: Array<{
  sku: string;
  name: string;
  categoryName?: string;
  price: number;
  stock: number;
  isActive?: boolean;
  imageUrl?: string;
}>): Promise<ApiResponse<BulkImportResult>> {
  return await apiRequest<BulkImportResult>(`/bulk-import`, {
    method: "POST",
    body: JSON.stringify({ items }),
  });
}

export async function createProductAction(
  data: CreateProductInput
): Promise<ApiResponse<Product>> {
  return await apiRequest<Product>(`/products`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateProductAction(
  id: number,
  data: UpdateProductInput
): Promise<ApiResponse<Product>> {
  return await apiRequest<Product>(`/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteProductAction(
  id: number
): Promise<ApiResponse<void>> {
  return await apiRequest<void>(`/products/${id}`, {
    method: "DELETE",
  });
}

// 2. Cart (Support both Authenticated User API and Guest Cookie Cart)
const GUEST_CART_COOKIE = "mc_guest_cart";

export interface GuestCartEntry {
  productId: number;
  quantity: number;
}

export async function getGuestCartEntries(): Promise<GuestCartEntry[]> {
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(GUEST_CART_COOKIE);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (it) => typeof it.productId === "number" && typeof it.quantity === "number" && it.quantity > 0
        );
      }
    } catch {
      // ignore
    }
  }
  return [];
}

export async function setGuestCartEntries(entries: GuestCartEntry[]): Promise<void> {
  if (typeof window !== "undefined") {
    if (entries.length === 0) {
      localStorage.removeItem(GUEST_CART_COOKIE);
    } else {
      localStorage.setItem(GUEST_CART_COOKIE, JSON.stringify(entries));
    }
  }
}

export async function getCart(): Promise<Cart> {
  const token = await getValidToken();
  if (token) {
    const res = await apiRequest<Cart>(`/cart`);
    return res.data || { items: [], totalQuantity: 0, subtotal: 0 };
  }

  // Guest Cart hydration
  const entries = await getGuestCartEntries();
  if (entries.length === 0) {
    return { items: [], totalQuantity: 0, subtotal: 0 };
  }

  const products = await getProducts();
  const productMap = new Map<number, Product>();
  products.forEach((p) => productMap.set(p.id, p));

  const items: CartItem[] = [];
  let totalQuantity = 0;
  let subtotal = 0;

  for (const entry of entries) {
    const p = productMap.get(entry.productId);
    if (!p || p.isActive === false) continue;

    const availableStock = p.stock || 0;
    const qty = Math.max(1, entry.quantity);
    const isOverStock = qty > availableStock;
    const lineTotal = (p.price || 0) * qty;

    items.push({
      id: entry.productId,
      productId: entry.productId,
      productName: p.name,
      sku: p.sku,
      price: p.price,
      quantity: qty,
      totalPrice: lineTotal,
      stock: availableStock,
      isOverStock,
      category: p.catagory?.name || "",
      imageUrl: p.imageUrl || null,
      images: p.images || null,
      product: p,
    });

    totalQuantity += qty;
    subtotal += lineTotal;
  }

  return {
    id: 0,
    userId: null,
    items,
    totalQuantity,
    subtotal,
  };
}

export async function addToCart(
  productId: number,
  quantity: number = 1
): Promise<ApiResponse<CartItem>> {
  const token = await getValidToken();
  if (token) {
    return await apiRequest<CartItem>(`/cart/items`, {
      method: "POST",
      body: JSON.stringify({ productId, quantity }),
    });
  }

  // Guest Cart Add
  const entries = await getGuestCartEntries();
  const existingIdx = entries.findIndex((e) => e.productId === productId);

  const products = await getProducts();
  const product = products.find((p) => p.id === productId);
  if (!product) {
    return { ok: false, error: "ไม่พบสินค้าในระบบ" };
  }
  if (!product.isActive) {
    return { ok: false, error: "สินค้านี้ไม่พร้อมจำหน่าย" };
  }

  const currentQty = existingIdx >= 0 ? entries[existingIdx].quantity : 0;
  const newQty = currentQty + quantity;

  if (newQty > product.stock) {
    return {
      ok: false,
      error: `ไม่สามารถเพิ่มสินค้าได้ สต็อกคงเหลือ ${product.stock} ชิ้น (ในตะกร้ามี ${currentQty} ชิ้น)`,
    };
  }

  if (existingIdx >= 0) {
    entries[existingIdx].quantity = newQty;
  } else {
    entries.push({ productId, quantity: newQty });
  }

  await setGuestCartEntries(entries);

  const cartItem: CartItem = {
    id: productId,
    productId,
    productName: product.name,
    sku: product.sku,
    price: product.price,
    quantity: newQty,
    totalPrice: (product.price || 0) * newQty,
    stock: product.stock,
    isOverStock: false,
    category: product.catagory?.name || "",
    imageUrl: product.imageUrl || null,
    images: product.images || null,
    product,
  };

  return { ok: true, data: cartItem };
}

export async function updateCartItem(
  itemId: number,
  quantity: number
): Promise<ApiResponse<CartItem>> {
  const token = await getValidToken();
  if (token) {
    return await apiRequest<CartItem>(`/cart/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
    });
  }

  // For guest, itemId is productId
  const entries = await getGuestCartEntries();
  const idx = entries.findIndex((e) => e.productId === itemId);
  if (idx < 0) {
    return { ok: false, error: "ไม่พบรายการสินค้านี้ในตะกร้า" };
  }

  if (quantity <= 0) {
    entries.splice(idx, 1);
    await setGuestCartEntries(entries);
    return { ok: true };
  }

  const products = await getProducts();
  const product = products.find((p) => p.id === itemId);
  if (product && quantity > product.stock) {
    return {
      ok: false,
      error: `จำนวนสินค้าเกินสต็อกคงเหลือ (${product.stock} ชิ้น)`,
    };
  }

  entries[idx].quantity = quantity;
  await setGuestCartEntries(entries);
  return { ok: true };
}

export async function removeCartItem(
  itemId: number
): Promise<ApiResponse<void>> {
  const token = await getValidToken();
  if (token) {
    return await apiRequest<void>(`/cart/items/${itemId}`, {
      method: "DELETE",
    });
  }

  const entries = await getGuestCartEntries();
  const filtered = entries.filter((e) => e.productId !== itemId);
  await setGuestCartEntries(filtered);
  return { ok: true };
}

export async function clearCart(): Promise<ApiResponse<void>> {
  const token = await getValidToken();
  if (token) {
    return await apiRequest<void>(`/cart`, {
      method: "DELETE",
    });
  }

  await setGuestCartEntries([]);
  return { ok: true };
}

export async function mergeGuestCart(token: string): Promise<void> {
  const entries = await getGuestCartEntries();
  if (entries.length === 0) return;

  try {
    const res = await fetch(`${API_BASE_URL}/cart/merge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ items: entries }),
      cache: "no-store",
    });
    if (res.ok) {
      await setGuestCartEntries([]);
    }
  } catch {
    // ignore
  }
}

// 3. Promotions
export async function validatePromotion(
  code: string,
  subtotal: number
): Promise<ApiResponse<ValidatePromotionResult>> {
  return await apiRequest<ValidatePromotionResult>(`/promotions/validate`, {
    method: "POST",
    body: JSON.stringify({ code, subtotal }),
  });
}

export async function getPromotions(): Promise<Promotion[]> {
  const res = await apiRequest<Promotion[]>(`/promotions`);
  return res.data || [];
}

export async function getPaginatedPromotions(query: {
  page: number;
  limit?: number;
  search?: string;
}): Promise<PaginatedResult<Promotion>> {
  const params = new URLSearchParams();
  params.append("page", String(query.page));
  if (query.limit) params.append("limit", String(query.limit));
  if (query.search) params.append("search", query.search);

  const res = await apiRequest<PaginatedResult<Promotion>>(`/promotions?${params.toString()}`);
  return (
    res.data || {
      data: [],
      total: 0,
      page: query.page,
      limit: query.limit || 10,
      totalPages: 1,
    }
  );
}

export async function createPromotionAction(
  data: CreatePromotionInput
): Promise<ApiResponse<Promotion>> {
  return await apiRequest<Promotion>(`/promotions`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updatePromotionAction(
  id: number,
  data: UpdatePromotionInput
): Promise<ApiResponse<Promotion>> {
  return await apiRequest<Promotion>(`/promotions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deletePromotionAction(
  id: number
): Promise<ApiResponse<void>> {
  return await apiRequest<void>(`/promotions/${id}`, {
    method: "DELETE",
  });
}

// 4. Orders & Checkout
export async function checkoutAction(
  payload: CheckoutInput
): Promise<ApiResponse<Order>> {
  return await apiRequest<Order>(`/orders`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createManualOrderAction(
  payload: CreateManualOrderInput
): Promise<ApiResponse<Order>> {
  return await apiRequest<Order>(`/admin/orders`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getOrders(): Promise<Order[]> {
  const res = await apiRequest<Order[]>(`/orders`);
  return res.data || [];
}

export async function getPaginatedOrders(query: {
  page: number;
  limit?: number;
  search?: string;
  status?: string;
  dateRange?: string;
}): Promise<PaginatedResult<Order>> {
  const params = new URLSearchParams();
  params.append("page", String(query.page));
  if (query.limit) params.append("limit", String(query.limit));
  if (query.search) params.append("search", query.search);
  if (query.status && query.status !== "all") params.append("status", query.status);
  if (query.dateRange && query.dateRange !== "all") params.append("dateRange", query.dateRange);

  const res = await apiRequest<PaginatedResult<Order>>(`/orders?${params.toString()}`);
  return (
    res.data || {
      data: [],
      total: 0,
      page: query.page,
      limit: query.limit || 10,
      totalPages: 1,
    }
  );
}

export async function exportOrdersAction(query: {
  search?: string;
  status?: string;
  dateRange?: string;
}): Promise<Order[]> {
  const params = new URLSearchParams();
  params.append("page", "1");
  params.append("limit", "10000");
  if (query.search) params.append("search", query.search);
  if (query.status && query.status !== "all") params.append("status", query.status);
  if (query.dateRange && query.dateRange !== "all") params.append("dateRange", query.dateRange);

  const res = await apiRequest<PaginatedResult<Order>>(`/orders?${params.toString()}`);
  return res.data?.data || [];
}

export async function getOrderById(id: number): Promise<Order | null> {
  const res = await apiRequest<Order>(`/orders/${id}`);
  return res.data || null;
}

export async function updateOrderStatus(
  orderId: number,
  status: string
): Promise<ApiResponse<Order>> {
  return await apiRequest<Order>(`/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// 5. Admin Dashboard
export async function getDashboardStats(): Promise<DashboardStats | null> {
  const res = await apiRequest<DashboardStats>(`/dashboard/stats`);
  return res.data || null;
}
