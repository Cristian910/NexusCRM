"use client";

import React from "react";
import { ArrowLeft, Mail, Phone, Globe, Building2, Archive, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useClient } from "@/features/clients/hooks/use-clients";
import { ClientStatusBadge } from "@/features/clients/components/client-status-badge";
import { PageHeader } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SkeletonCard } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";

export function ClientDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { data: client, isLoading, isError } = useClient(id);

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
          Client not found or could not be loaded.
        </p>
        <Button variant="outline" size="sm" onClick={() => router.push("/clients")}>
          Back to clients
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      <PageHeader
        title={client.name}
        description={client.company ?? "Individual contact"}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => router.push("/clients")}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Archive className="h-3.5 w-3.5" />
              Archive
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Contact info card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="text-sm">Contact info</CardTitle>
              <ClientStatusBadge status={client.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {[
              { icon: Mail,      label: "Email",   value: client.email   },
              { icon: Phone,     label: "Phone",   value: client.phone   },
              { icon: Building2, label: "Company", value: client.company },
              { icon: Globe,     label: "Website", value: client.website },
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
              Created {formatDate(client.createdAt, "MMM d, yyyy")}
            </div>
          </CardContent>
        </Card>

        {/* Deals + tasks placeholder */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Deals</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                Deals integration coming in E5 (Deals module).
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                Tasks integration coming in E6 (Tasks module).
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
