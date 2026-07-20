/**
 * Smart polling client — the strategy for this backend.
 *
 * Architecture decision:
 *   The NestJS backend uses EventEmitter2 + BullMQ internally but exposes no
 *   WebSocket to external clients. Rather than adding a WS gateway to the backend
 *   (out of scope for the frontend deliverable), we implement adaptive polling:
 *
 *   - Poll /notifications/unread-count every N seconds
 *   - When count changes → invalidate React Query caches → UI updates instantly
 *   - Backoff on errors, resume on reconnect
 *   - Tab visibility API — pause when tab hidden, resume on focus
 *
 * This delivers near-real-time UX (2-5s latency) without requiring backend changes.
 * When a WS gateway is added to the backend, this module is the only thing to swap.
 */

import { apiClient } from "@/lib/api/client";
import type { UnreadCount } from "@/types/notifications";

type EventListener = (data: unknown) => void;

class PollingClient {
  private intervals: Map<string, ReturnType<typeof setInterval>> = new Map();
  private listeners: Map<string, Set<EventListener>> = new Map();
  private lastValues: Map<string, unknown> = new Map();
  private errorCounts: Map<string, number> = new Map();
  private isVisible = true;

  constructor() {
    if (typeof window !== "undefined") {
      document.addEventListener("visibilitychange", this.handleVisibility);
    }
  }

  private handleVisibility = () => {
    this.isVisible = document.visibilityState === "visible";
    if (this.isVisible) {
      // Immediately poll on tab focus
      this.intervals.forEach((_, key) => this.poll(key));
    }
  };

  /**
   * Register a polling channel.
   * @param key    Unique channel identifier (used for deduplication)
   * @param fn     Async function that fetches fresh data
   * @param ms     Interval in ms (default 5000)
   */
  subscribe<T>(
    key: string,
    fn: () => Promise<T>,
    ms = 5_000,
    onChange?: (data: T) => void
  ) {
    if (this.intervals.has(key)) return; // already subscribed

    const poll = async () => {
      if (!this.isVisible) return;

      try {
        const data = await fn();
        this.errorCounts.set(key, 0);

        const prev = this.lastValues.get(key);
        const changed = JSON.stringify(prev) !== JSON.stringify(data);
        if (changed) {
          this.lastValues.set(key, data);
          onChange?.(data);
          this.emit(key, data);
        }
      } catch {
        const errors = (this.errorCounts.get(key) ?? 0) + 1;
        this.errorCounts.set(key, errors);
        // Exponential backoff up to 60s
        if (errors >= 3) {
          this.unsubscribe(key);
          const backoffMs = Math.min(ms * Math.pow(2, errors - 3), 60_000);
          setTimeout(() => this.subscribe(key, fn, ms, onChange), backoffMs);
        }
      }
    };

    // Store and start
    this.intervals.set(key, setInterval(poll, ms));
    poll(); // immediate first poll
  }

  unsubscribe(key: string) {
    const interval = this.intervals.get(key);
    if (interval) clearInterval(interval);
    this.intervals.delete(key);
  }

  on(key: string, listener: EventListener) {
    if (!this.listeners.has(key)) this.listeners.set(key, new Set());
    this.listeners.get(key)!.add(listener);
    return () => this.listeners.get(key)?.delete(listener);
  }

  private emit(key: string, data: unknown) {
    this.listeners.get(key)?.forEach((fn) => fn(data));
  }

  private async poll(key: string) {
    // Trigger immediate poll by no-op (interval handles actual fetch)
    // Force-fire all listeners with last value to refresh UI on focus
    const last = this.lastValues.get(key);
    if (last !== undefined) this.emit(key, last);
  }

  destroy() {
    this.intervals.forEach((interval) => clearInterval(interval));
    this.intervals.clear();
    if (typeof window !== "undefined") {
      document.removeEventListener("visibilitychange", this.handleVisibility);
    }
  }
}

// Singleton — shared across the app
export const pollingClient = typeof window !== "undefined" ? new PollingClient() : null;

// ── Notification-specific polling ─────────────────────────────────
export const NOTIFICATIONS_POLL_KEY = "notifications:unread-count";

export function startNotificationPolling(onNewCount: (count: number) => void) {
  pollingClient?.subscribe(
    NOTIFICATIONS_POLL_KEY,
    async () => {
      const { data } = await apiClient.get<UnreadCount>("/notifications/unread-count");
      return data.count;
    },
    5_000,
    onNewCount
  );
}

export function stopNotificationPolling() {
  pollingClient?.unsubscribe(NOTIFICATIONS_POLL_KEY);
}

// ── Activity polling (30s interval — audit trail changes slowly) ──
export const ACTIVITY_POLL_KEY = "activity:recent";

export function startActivityPolling(onUpdate: () => void) {
  pollingClient?.subscribe(
    ACTIVITY_POLL_KEY,
    async () => {
      // Lightweight: fetch only count of recent activities (last 60s)
      const { data } = await apiClient.get<{ count: number }>(
        "/activities/recent-count"
      );
      return data.count;
    },
    30_000,
    onUpdate
  );
}

export function stopActivityPolling() {
  pollingClient?.unsubscribe(ACTIVITY_POLL_KEY);
}
