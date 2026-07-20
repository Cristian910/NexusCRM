"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { useActivity } from "../hooks/use-activity";
import { ACTIVITY_CONFIG, ENTITY_TYPE_CONFIG } from "./activity-config";
import { formatRelative, formatDate } from "@/lib/utils";
import { Avatar, AvatarFallback, getInitials } from "@/components/ui/avatar";
import type { ActivityFilters, Activity } from "@/types/activity";

interface ActivityTableProps {
  filters: ActivityFilters;
}

export function ActivityTable({ filters }: ActivityTableProps) {
  const { data, isLoading } = useActivity(filters);
  const activities = data?.data ?? [];

  if (isLoading) return <ActivitySkeleton />;
  if (!activities.length) return <ActivityEmpty />;

  return (
    <div className="overflow-hidden rounded-xl border" style={{ borderColor: "hsl(var(--border))" }}>
      {/* Header */}
      <div
        className="grid grid-cols-[1fr_2fr_1fr_1fr] gap-4 border-b px-4 py-3 text-xs font-semibold uppercase tracking-wider"
        style={{
          borderColor: "hsl(var(--border))",
          background: "hsl(var(--muted) / 0.4)",
          color: "hsl(var(--muted-foreground))",
        }}
      >
        <span>User</span>
        <span>Action</span>
        <span>Entity</span>
        <span className="text-right">When</span>
      </div>

      {/* Rows */}
      <AnimatePresence initial={false}>
        {activities.map((activity, i) => (
          <ActivityRow key={activity.id} activity={activity} index={i} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ActivityRow({ activity, index }: { activity: Activity; index: number }) {
  const router = useRouter();
  const cfg = ACTIVITY_CONFIG[activity.type];
  const entityCfg = ENTITY_TYPE_CONFIG[activity.entityType];
  const userName = activity.user
    ? `${activity.user.firstName} ${activity.user.lastName}`
    : "System";

  const handleNavigate = () => {
    router.push(cfg.entityRoute(activity.entityId));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.14, delay: index * 0.015 }}
      className="group grid grid-cols-[1fr_2fr_1fr_1fr] items-center gap-4 border-b px-4 py-3 transition-colors last:border-0"
      style={{ borderColor: "hsl(var(--border))" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(var(--muted) / 0.3)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
    >
      {/* User */}
      <div className="flex items-center gap-2 min-w-0">
        <Avatar size="xs">
          <AvatarFallback className="text-[9px]">{getInitials(userName)}</AvatarFallback>
        </Avatar>
        <span className="text-xs truncate" style={{ color: "hsl(var(--foreground))" }}>
          {userName}
        </span>
      </div>

      {/* Action — icon + description */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm shrink-0">{cfg?.icon}</span>
        <div className="min-w-0">
          <span
            className="text-xs font-medium"
            style={{ color: cfg?.color ?? "hsl(var(--foreground))" }}
          >
            {cfg?.label ?? activity.type}
          </span>
          {activity.metadata && Object.keys(activity.metadata).length > 0 && (
            <MetadataHint type={activity.type} metadata={activity.metadata} />
          )}
        </div>
      </div>

      {/* Entity */}
      <div className="flex items-center gap-1.5">
        <span
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium"
          style={{
            background: `${cfg?.color ?? "hsl(var(--muted))"}18`,
            color: cfg?.color ?? "hsl(var(--muted-foreground))",
          }}
        >
          {entityCfg?.label ?? activity.entityType}
        </span>
        <button
          onClick={handleNavigate}
          className="opacity-0 transition-opacity group-hover:opacity-100"
          aria-label="Go to entity"
        >
          <ExternalLink
            className="h-3 w-3"
            style={{ color: "hsl(var(--muted-foreground))" }}
          />
        </button>
      </div>

      {/* When */}
      <div className="text-right">
        <span
          className="text-[11px] tabular-nums"
          title={formatDate(activity.createdAt, "MMM d, yyyy HH:mm")}
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          {formatRelative(activity.createdAt)}
        </span>
      </div>
    </motion.div>
  );
}

// Show contextual metadata (e.g. stage transitions)
function MetadataHint({
  type, metadata,
}: {
  type: Activity["type"];
  metadata: Record<string, unknown>;
}) {
  if (type === "DEAL_STAGE_CHANGED" && metadata.fromStage && metadata.toStage) {
    return (
      <p className="mt-0.5 text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>
        {String(metadata.fromStage).replace("_", " ")} →{" "}
        {String(metadata.toStage).replace("_", " ")}
      </p>
    );
  }
  return null;
}

function ActivitySkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border" style={{ borderColor: "hsl(var(--border))" }}>
      <div
        className="border-b px-4 py-3"
        style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--muted) / 0.4)" }}
      >
        <div className="skeleton h-3 w-48 rounded" />
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="grid grid-cols-[1fr_2fr_1fr_1fr] gap-4 border-b px-4 py-3" style={{ borderColor: "hsl(var(--border))" }}>
          <div className="flex items-center gap-2">
            <div className="skeleton h-6 w-6 rounded-full" />
            <div className="skeleton h-3 w-20 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <div className="skeleton h-4 w-4 rounded" />
            <div className="skeleton h-3 w-32 rounded" />
          </div>
          <div className="skeleton h-5 w-16 rounded" />
          <div className="skeleton h-3 w-16 rounded ml-auto" />
        </div>
      ))}
    </div>
  );
}

function ActivityEmpty() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 rounded-xl border py-16"
      style={{ borderColor: "hsl(var(--border))" }}
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full"
        style={{ background: "hsl(var(--muted))" }}
      >
        <span className="text-2xl">📋</span>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>
          No activity yet
        </p>
        <p className="mt-0.5 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
          Actions across your CRM will appear here
        </p>
      </div>
    </div>
  );
}
