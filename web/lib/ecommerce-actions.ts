"use server";

import { API_BASE_URL } from "./auth/config";
import { readAccesToken, readRefreshToken, writeSession } from "./auth/session";
import { needsRefresh } from "./auth/tokens";
import { refreshSession } from "./auth/refresh";

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
): Promise<{ ok: boolean; data?: T; error?: string }> {
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

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: body.message || "Request failed" };
    }

    return { ok: true, data: body as T };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Cannot connect to server" };
  }
}

// 1. Products & Categories
export async function getProducts(query?: { search?: string; category?: string }) {
  const params = new URLSearchParams();
  if (query?.search) params.append("search", query.search);
  if (query?.category) params.append("category", query.category);

  const qs = params.toString() ? `?${params.toString()}` : "";
  const res = await apiRequest<any[]>(`/products${qs}`);
  return res.data || [];
}

export async function getProductById(id: number) {
  const res = await apiRequest<any>(`/products/${id}`);
  return res.data || null;
}

export async function getCategories() {
  const res = await apiRequest<any[]>(`/categories`);
  return res.data || [];
}

export async function createProductAction(data: any) {
  return await apiRequest(`/products`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateProductAction(id: number, data: any) {
  return await apiRequest(`/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteProductAction(id: number) {
  return await apiRequest(`/products/${id}`, {
    method: "DELETE",
  });
}

// 2. Cart
export async function getCart() {
  const res = await apiRequest<any>(`/cart`);
  return res.data || { items: [], totalQuantity: 0, subtotal: 0 };
}

export async function addToCart(productId: number, quantity: number = 1) {
  return await apiRequest(`/cart/items`, {
    method: "POST",
    body: JSON.stringify({ productId, quantity }),
  });
}

export async function updateCartItem(itemId: number, quantity: number) {
  return await apiRequest(`/cart/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  });
}

export async function removeCartItem(itemId: number) {
  return await apiRequest(`/cart/items/${itemId}`, {
    method: "DELETE",
  });
}

export async function clearCart() {
  return await apiRequest(`/cart`, {
    method: "DELETE",
  });
}

// 3. Promotions
export async function validatePromotion(code: string, subtotal: number) {
  return await apiRequest<any>(`/promotions/validate`, {
    method: "POST",
    body: JSON.stringify({ code, subtotal }),
  });
}

export async function getPromotions() {
  const res = await apiRequest<any[]>(`/promotions`);
  return res.data || [];
}

export async function createPromotionAction(data: any) {
  return await apiRequest(`/promotions`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updatePromotionAction(id: number, data: any) {
  return await apiRequest(`/promotions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deletePromotionAction(id: number) {
  return await apiRequest(`/promotions/${id}`, {
    method: "DELETE",
  });
}

// 4. Orders & Checkout
export async function checkoutAction(payload: {
  idempotencyKey: string;
  promotionCode?: string;
  paymentMethod: string;
  customerName?: string;
  shippingAddress?: string;
  phone?: string;
}) {
  return await apiRequest<any>(`/orders`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getOrders() {
  const res = await apiRequest<any[]>(`/orders`);
  return res.data || [];
}

export async function getOrderById(id: number) {
  const res = await apiRequest<any>(`/orders/${id}`);
  return res.data || null;
}

export async function updateOrderStatus(orderId: number, status: string) {
  return await apiRequest(`/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// 5. Admin Dashboard
export async function getDashboardStats() {
  const res = await apiRequest<any>(`/dashboard/stats`);
  return res.data || null;
}
