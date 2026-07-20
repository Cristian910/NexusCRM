"use client";

import { useRealtime } from "@/lib/realtime/use-realtime";

/**
 * Mounts the realtime polling channel.
 * Rendered inside Providers — runs once after auth is established.
 */
export function RealtimeInitializer() {
  useRealtime();
  return null;
}
