import { create } from "zustand";

export type QuickCreateType = "deal" | "client" | "task" | null;

interface QuickCreateState {
  openType: QuickCreateType;
  open: (type: Exclude<QuickCreateType, null>) => void;
  close: () => void;
}

/**
 * Backs the "New" button in the topbar, which is visible on every dashboard
 * page. It previously had no onClick at all — this store lets DashboardShell
 * mount the three creation modals once, globally, so "New" works no matter
 * which page you're on instead of only inside Deals/Clients/Tasks.
 */
export const useQuickCreateStore = create<QuickCreateState>((set) => ({
  openType: null,
  open: (type) => set({ openType: type }),
  close: () => set({ openType: null }),
}));
