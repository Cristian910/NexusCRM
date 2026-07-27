"use client";

import React, { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import {
  ArrowLeft, Mail, Phone, Globe, Building2, Archive, Pencil,
  Briefcase, CheckSquare, ArrowRight, Circle, CheckCircle2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useClient, useArchiveClient } from "@/features/clients/hooks/use-clients";
import { useDealsKanban } from "@/features/deals/hooks/use-deals";
import { tasksService } from "@/features/tasks/tasks.service";
import { taskKeys } from "@/features/tasks/hooks/use-tasks";
import { ClientStatusBadge } from "@/features/clients/components/client-status-badge";
import { ClientModal } from "@/features/clients/components/client-modal";
import { DealModal } from "@/features/deals/components/deal-modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PageHeader } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SkeletonCard } from "@/components/ui/skeleton";
import { STAGE_CONFIG } from "@/features/deals/components/kanban-config";
import { formatDate, formatCurrency, cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";
import type { Deal } from "@/features/deals/types";

export function ClientDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: client, isLoading, isError } = useClient(id);
  const [editOpen, setEditOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [newDealOpen, setNewDealOpen] = useState(false);
  const archiveMut = useArchiveClient();

  // Deals for this client — the deals API already supports filtering by clientId natively.
  const { data: deals = [], isLoading: dealsLoading } = useDealsKanban({ clientId: id });

  // Tasks aren't filterable by clientId on the backend (only by dealId), so we
  // fan out one request per deal and merge — fine at this scale (a handful of
  // deals per client) and avoids a backend/schema change for a detail-page view.
  const dealIds = deals.map((d) => d.id);
  const taskQueries = useQueries({
    queries: dealIds.map((dealId) => ({
      queryKey: taskKeys.list({ dealId }),
      queryFn: () => tasksService.list({ dealId, limit: 50 }),
      enabled: dealIds.length > 0,
      staleTime: 30_000,
    })),
  });
  const tasksLoading = dealIds.length > 0 && taskQueries.some((q) => q.isLoading);
  const tasks = taskQueries
    .flatMap((q) => q.data?.data ?? [])
    .sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"))
    .slice(0, 6);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (isError || !client) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
          {t("clients.notFound")}
        </p>
        <Button variant="outline" size="sm" onClick={() => router.push("/clients")}>
          {t("clients.backToClients")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      <PageHeader
        title={client.name}
        description={client.company ?? t("clients.individualContact")}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => router.push("/clients")}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t("clients.back")}
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditOpen(true)}>
              <Pencil className="h-3.5 w-3.5" />
              {t("clients.edit")}
            </Button>
            {client.status !== "ARCHIVED" && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setArchiveOpen(true)}>
                <Archive className="h-3.5 w-3.5" />
                {t("clients.archive")}
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Contact info card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="text-sm">{t("clients.contactInfo")}</CardTitle>
              <ClientStatusBadge status={client.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {[
              { icon: Mail,      label: t("clients.emailLabel"),   value: client.email   },
              { icon: Phone,     label: t("clients.phoneLabel"),   value: client.phone   },
              { icon: Building2, label: t("clients.companyLabel"), value: client.company },
              { icon: Globe,     label: t("clients.websiteLabel"), value: client.website },
            ].map(({ icon: Icon, label, value }) =>
              value ? (
                <div key={label} className="flex items-start gap-2.5">
                  <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: "hsl(var(--muted-foreground))" }} />
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {label}
                    </p>
                    <p className="text-sm truncate" style={{ color: "hsl(var(--foreground))" }}>
                      {value}
                    </p>
                  </div>
                </div>
              ) : null
            )}

            <div
              className="border-t pt-3 text-xs"
              style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
            >
              {t("clients.created", { date: formatDate(client.createdAt, "MMM d, yyyy") })}
            </div>
          </CardContent>
        </Card>

        {/* Deals + tasks — real data, filtered to this client */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5" style={{ color: "hsl(var(--muted-foreground))" }} />
                  {t("clients.dealsCard")}
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setNewDealOpen(true)}>
                  {t("common.newDeal")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {dealsLoading ? (
                <div className="space-y-2">
                  <div className="skeleton h-10 rounded-lg" />
                  <div className="skeleton h-10 rounded-lg" />
                </div>
              ) : deals.length === 0 ? (
                <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {t("clients.noDealsYet")}
                </p>
              ) : (
                <div className="space-y-1.5">
                  {deals.slice(0, 6).map((deal: Deal) => {
                    const cfg = STAGE_CONFIG[deal.stage];
                    return (
                      <button
                        key={deal.id}
                        onClick={() => router.push("/deals")}
                        className="flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition-colors hover:bg-accent"
                        style={{ borderColor: "hsl(var(--border))" }}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>
                            {deal.title}
                          </p>
                          <span
                            className="mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                            style={{ background: `${cfg.color}18`, color: cfg.color }}
                          >
                            {t(`deals.stages.${deal.stage}`)}
                          </span>
                        </div>
                        <span className="shrink-0 text-sm font-semibold tabular-nums" style={{ color: "hsl(var(--foreground))" }}>
                          {formatCurrency(deal.value ?? 0)}
                        </span>
                      </button>
                    );
                  })}
                  {deals.length > 0 && (
                    <button
                      onClick={() => router.push("/deals")}
                      className="flex items-center gap-1 pt-1 text-xs font-medium transition-colors"
                      style={{ color: "hsl(var(--primary))" }}
                    >
                      {t("clients.viewAllInPipeline")}
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-1.5">
                <CheckSquare className="h-3.5 w-3.5" style={{ color: "hsl(var(--muted-foreground))" }} />
                {t("clients.tasksCard")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tasksLoading ? (
                <div className="space-y-2">
                  <div className="skeleton h-8 rounded-lg" />
                  <div className="skeleton h-8 rounded-lg" />
                </div>
              ) : tasks.length === 0 ? (
                <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {t("clients.noTasksYet")}
                </p>
              ) : (
                <div className="space-y-1.5">
                  {tasks.map((task) => {
                    const done = task.status === "COMPLETED";
                    return (
                      <div key={task.id} className="flex items-center gap-2.5 rounded-lg px-1 py-1.5">
                        {done ? (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: "hsl(var(--success))" }} />
                        ) : (
                          <Circle className="h-3.5 w-3.5 shrink-0" style={{ color: "hsl(var(--muted-foreground))" }} />
                        )}
                        <span
                          className={cn("truncate text-sm", done && "line-through")}
                          style={{ color: done ? "hsl(var(--muted-foreground))" : "hsl(var(--foreground))" }}
                        >
                          {task.title}
                        </span>
                        {task.dueDate && (
                          <span className="ml-auto shrink-0 text-xs tabular-nums" style={{ color: "hsl(var(--muted-foreground))" }}>
                            {formatDate(task.dueDate, "MMM d")}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ClientModal open={editOpen} onClose={() => setEditOpen(false)} mode="edit" client={client} />
      <DealModal open={newDealOpen} onClose={() => setNewDealOpen(false)} mode="create" defaultClientId={client.id} />

      <ConfirmDialog
        open={archiveOpen}
        title={t("clients.archiveTitle", { name: client.name })}
        description={t("clients.archiveDescription")}
        confirmLabel={t("clients.archiveConfirm")}
        confirmVariant="default"
        onConfirm={() => archiveMut.mutate(client.id, { onSuccess: () => setArchiveOpen(false) })}
        onCancel={() => setArchiveOpen(false)}
        isLoading={archiveMut.isPending}
      />
    </div>
  );
}
