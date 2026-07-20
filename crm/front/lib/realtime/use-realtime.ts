"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/auth-store";
import {
  startNotificationPolling,
  stopNotificationPolling,
  startActivityPolling,
  stopActivityPolling,
} from "./polling-client";

const NOTIF_LIST_KEY    = ["notifications"];
const NOTIF_COUNT_KEY   = ["notifications", "unread-count"];
const ACTIVITY_LIST_KEY = ["activity"];

/**
 * useRealtime — mounts all polling channels.
 *
 * Notification channel: every 5s (lightweight — just a count)
 * Activity channel: every 30s (heavier — invalidate list)
 *
 * When count increases → invalidate lists → React Query re-fetches.
 * Zero extra network calls beyond the count polls.
 */
export function useRealtime() {
  const qc = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const prevCountRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      stopNotificationPolling();
      stopActivityPolling();
      return;
    }

    startNotificationPolling((newCount) => {
      const prev = prevCountRef.current;
      prevCountRef.current = newCount;

      // Seed the unread count query directly (no extra round-trip)
      qc.setQueryData<{ count: number }>(NOTIF_COUNT_KEY, { count: newCount });

      // New notifications arrived → refresh the list
      if (prev !== null && newCount > prev) {
        qc.invalidateQueries({ queryKey: NOTIF_LIST_KEY });
      }
    });

    // PollingClient only invokes onChange when the polled value actually
    // changes, so every call here already means new activity landed.
    startActivityPolling(() => {
      qc.invalidateQueries({ queryKey: ACTIVITY_LIST_KEY });
    });

    return () => {
      stopNotificationPolling();
      stopActivityPolling();
    };
  }, [isAuthenticated, qc]);
}
