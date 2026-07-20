import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { SafeUser } from "@/types";
import { tokenStore } from "@/lib/api/token-store";

interface AuthState {
  user: SafeUser | null;
  isAuthenticated: boolean;
  isInitializing: boolean;

  setUser: (user: SafeUser) => void;
  clearAuth: () => void;
  setInitializing: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  subscribeWithSelector((set) => ({
    user: null,
    isAuthenticated: false,
    isInitializing: true,

    setUser: (user) => set({ user, isAuthenticated: true }),

    clearAuth: () => {
      tokenStore.clearAll();
      set({ user: null, isAuthenticated: false });
    },

    setInitializing: (v) => set({ isInitializing: v }),
  }))
);

// React to session expiry emitted by the API interceptor
if (typeof window !== "undefined") {
  window.addEventListener("auth:session-expired", () => {
    useAuthStore.getState().clearAuth();
  });
}
