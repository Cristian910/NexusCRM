import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { tokenStore } from "./token-store";
import type { ApiError, AuthTokens } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
const API_PREFIX = "/api/v1";

// ── Axios instance ───────────────────────────────────────────────
export const apiClient: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}${API_PREFIX}`,
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});

// ── Request: attach access token ─────────────────────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStore.getAccess();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(normalizeError(error))
);

// ── Response: unwrap backend envelope { success, data, timestamp } ──
// The backend's ResponseInterceptor wraps every payload. We unwrap here
// so that all services can do `const { data } = await apiClient.get(...)` 
// and get the actual payload directly.
apiClient.interceptors.response.use((res) => {
  const body = res.data as { success?: boolean; data?: unknown; timestamp?: string } | undefined;
  if (body && typeof body === "object" && "success" in body && "data" in body) {
    res.data = body.data;
  }
  return res;
});

// ── Response: handle 401 → refresh → retry ───────────────────────
let isRefreshing = false;
type QueueEntry = { resolve: (t: string) => void; reject: (e: unknown) => void };
let queue: QueueEntry[] = [];

function flushQueue(error: unknown, token: string | null = null) {
  queue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  queue = [];
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 401 on any route except /auth/refresh itself
    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes("/auth/refresh")
    ) {
      if (isRefreshing) {
        // Queue callers while refresh is in-flight
        return new Promise<string>((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return apiClient(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = tokenStore.getRefresh();
        if (!refreshToken) throw new Error("no_refresh_token");

        const refreshRes = await axios.post<{ success: boolean; data: AuthTokens; timestamp: string }>(
          `${BASE_URL}${API_PREFIX}/auth/refresh`,
          { refreshToken },
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        // Backend wraps response in { success, data, timestamp }
        const data: AuthTokens = refreshRes.data?.data ?? (refreshRes.data as unknown as AuthTokens);

        tokenStore.setTokens(data);
        flushQueue(null, data.accessToken);

        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(original);
      } catch (refreshError) {
        flushQueue(refreshError, null);
        tokenStore.clearAll();
        // Dispatch a custom event so the auth store can react
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("auth:session-expired"));
        }
        return Promise.reject(normalizeError(refreshError));
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(normalizeError(error));
  }
);

// ── Normalize any error into a typed ApiError ────────────────────
export function normalizeError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Record<string, unknown> | undefined;
    return {
      message:
        typeof data?.message === "string"
          ? data.message
          : Array.isArray(data?.message)
          ? (data.message as string[]).join(", ")
          : error.message ?? "An unexpected error occurred",
      statusCode: error.response?.status ?? 0,
      error: typeof data?.error === "string" ? data.error : undefined,
    };
  }
  if (error instanceof Error) {
    return { message: error.message, statusCode: 0 };
  }
  return { message: "An unexpected error occurred", statusCode: 0 };
}
