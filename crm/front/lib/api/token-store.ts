/**
 * Token storage strategy:
 *  - accessToken  → in-memory only (never touches disk, XSS-safe)
 *  - refreshToken → HttpOnly-equivalent via cookie with SameSite=Strict
 *
 * The refresh token cookie is set client-side here because the backend
 * doesn't set it via Set-Cookie headers (stateless JWT architecture).
 * In a future hardening pass this could be moved to a BFF endpoint.
 */

import Cookies from "js-cookie";
import type { AuthTokens } from "@/types";

const REFRESH_COOKIE = "crm_rt";
const COOKIE_OPTIONS: Cookies.CookieAttributes = {
  expires: 7,          // 7 days
  sameSite: "Strict",
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

// In-memory access token — cleared on page unload
let _accessToken: string | null = null;

export const tokenStore = {
  // ── access token (memory) ────────────────────────────────────
  getAccess(): string | null {
    return _accessToken;
  },
  setAccess(token: string) {
    _accessToken = token;
  },
  clearAccess() {
    _accessToken = null;
  },

  // ── refresh token (cookie) ───────────────────────────────────
  getRefresh(): string | null {
    return Cookies.get(REFRESH_COOKIE) ?? null;
  },
  setRefresh(token: string) {
    Cookies.set(REFRESH_COOKIE, token, COOKIE_OPTIONS);
  },
  clearRefresh() {
    Cookies.remove(REFRESH_COOKIE, { path: "/" });
  },

  // ── combined helpers ─────────────────────────────────────────
  setTokens(tokens: AuthTokens) {
    this.setAccess(tokens.accessToken);
    this.setRefresh(tokens.refreshToken);
  },
  clearAll() {
    this.clearAccess();
    this.clearRefresh();
  },
  hasSession(): boolean {
    // Refresh cookie surviving the page reload means we have a session
    return this.getRefresh() !== null;
  },
};
