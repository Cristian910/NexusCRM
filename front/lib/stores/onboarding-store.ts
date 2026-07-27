import { create } from "zustand";

const STORAGE_KEY = "nexuscrm-onboarding-seen";

interface OnboardingState {
  open: boolean;
  openTour: () => void;
  closeTour: () => void;
  /** Called once on mount — opens the tour automatically the first time only. */
  maybeAutoOpen: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  open: false,
  openTour: () => set({ open: true }),
  closeTour: () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "1");
    }
    set({ open: false });
  },
  maybeAutoOpen: () => {
    if (typeof window === "undefined") return;
    const seen = window.localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      // Small delay so it appears after the dashboard has visibly rendered,
      // rather than slamming a modal over a blank page.
      setTimeout(() => set({ open: true }), 600);
    }
  },
}));
