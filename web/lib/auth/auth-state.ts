"use client";

import { PublicUser } from "./type";

const USER_SESSION_STORAGE_KEY = "mc_user_session";
const AUTH_EVENT_NAME = "mc-auth-state-changed";

let memoryUser: PublicUser | null = null;
let initialized = false;

/**
 * Synchronously retrieves the cached user profile from localStorage if available.
 * Keeps an in-memory reference to prevent redundant JSON.parse calls across components.
 */
export function getCachedUser(): PublicUser | null {
  if (typeof window === "undefined") return null;
  if (!initialized) {
    initialized = true;
    try {
      const raw = localStorage.getItem(USER_SESSION_STORAGE_KEY);
      memoryUser = raw ? (JSON.parse(raw) as PublicUser) : null;
    } catch {
      memoryUser = null;
    }
  }
  return memoryUser;
}

/**
 * Updates the client-side user cache in localStorage and notifies all mounted components.
 */
export function setCachedUser(user: PublicUser | null): void {
  memoryUser = user;
  initialized = true;
  if (typeof window === "undefined") return;
  try {
    if (user) {
      localStorage.setItem(USER_SESSION_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_SESSION_STORAGE_KEY);
    }
  } catch {
    // Ignore storage quota errors
  }
  window.dispatchEvent(new CustomEvent(AUTH_EVENT_NAME, { detail: user }));
}

/**
 * Subscribes to cross-component authentication state changes (e.g. login, logout, session refresh).
 */
export function subscribeAuthState(callback: (user: PublicUser | null) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (e: Event) => {
    const detail = (e as CustomEvent<PublicUser | null>).detail;
    callback(detail ?? null);
  };
  window.addEventListener(AUTH_EVENT_NAME, handler);
  return () => window.removeEventListener(AUTH_EVENT_NAME, handler);
}
