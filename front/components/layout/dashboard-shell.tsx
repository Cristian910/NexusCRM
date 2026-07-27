"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { cn } from "@/lib/utils";
import { useQuickCreateStore } from "@/lib/stores/quick-create-store";
import { useOnboardingStore } from "@/lib/stores/onboarding-store";
import { DealModal } from "@/features/deals/components/deal-modal";
import { ClientModal } from "@/features/clients/components/client-modal";
import { TaskModal } from "@/features/tasks/components/task-modal";
import { OnboardingTour } from "@/components/onboarding/onboarding-tour";

const SIDEBAR_KEY = "crm_sidebar_collapsed";

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { openType, close } = useQuickCreateStore();
  const maybeAutoOpen = useOnboardingStore((s) => s.maybeAutoOpen);

  useEffect(() => {
    maybeAutoOpen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restore preference from localStorage. This one-time read has to happen
  // in an effect (localStorage isn't available during SSR/first paint), and
  // the resulting extra client-only render is the intentional trade-off that
  // keeps server and client markup identical on first paint — the
  // alternative (a lazy useState initializer) would read localStorage during
  // render and cause a hydration mismatch instead.
  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored !== null) setCollapsed(stored === "true");
    setMounted(true);
  }, []);

  const handleToggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_KEY, String(next));
      return next;
    });
  };

  // Avoid layout shift on SSR
  if (!mounted) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <Sidebar
        collapsed={collapsed}
        onToggle={handleToggle}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* ── Main area ───────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Topbar onMenuClick={() => setMobileOpen(true)} />

        {/* ── Page content ──────────────────────────────────────── */}
        <motion.main
          key="main-content"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className={cn(
            "flex-1 overflow-y-auto",
            "px-4 py-5 sm:px-6 lg:px-8"
          )}
        >
          {children}
        </motion.main>
      </div>

      {/* Global quick-create — opened from the topbar's "New" button, works from any page */}
      <DealModal open={openType === "deal"} onClose={close} mode="create" />
      <ClientModal open={openType === "client"} onClose={close} mode="create" />
      <TaskModal open={openType === "task"} onClose={close} mode="create" />

      {/* First-run product tour — also reopenable from the topbar's "?" button */}
      <OnboardingTour />
    </div>
  );
}
