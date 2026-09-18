"use server";

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

export async function getProductById(id: number): Promise<Product | null> {
  const res = await apiRequest<Product>(`/products/${id}`);
  return res.data || null;
}

export async function getCategories(): Promise<Category[]> {
  const res = await apiRequest<Category[]>(`/categories`);
  return res.data || [];
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

// 2. Cart
export async function getCart(): Promise<Cart> {
  const res = await apiRequest<Cart>(`/cart`);
  return res.data || { items: [], totalQuantity: 0, subtotal: 0 };
}

export async function addToCart(
  productId: number,
  quantity: number = 1
): Promise<ApiResponse<CartItem>> {
  return await apiRequest<CartItem>(`/cart/items`, {
    method: "POST",
    body: JSON.stringify({ productId, quantity }),
  });
}

export async function updateCartItem(
  itemId: number,
  quantity: number
): Promise<ApiResponse<CartItem>> {
  return await apiRequest<CartItem>(`/cart/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  });
}

export async function removeCartItem(
  itemId: number
): Promise<ApiResponse<void>> {
  return await apiRequest<void>(`/cart/items/${itemId}`, {
    method: "DELETE",
  });
}

export async function clearCart(): Promise<ApiResponse<void>> {
  return await apiRequest<void>(`/cart`, {
    method: "DELETE",
  });
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
