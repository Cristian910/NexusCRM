"use client";

import React, { useState } from "react";
import { UserPlus, MoreHorizontal, ShieldCheck, UserX } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, getInitials } from "@/components/ui/avatar";
import { RoleBadge } from "@/components/auth/role-badge";
import { Can } from "@/components/auth/can";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { InviteMemberModal } from "./invite-member-modal";
import { useTeamMembers, useUpdateUserRole, useDeactivateUser } from "@/features/users/hooks/use-users";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { SafeUser, Role } from "@/types";

const ASSIGNABLE_ROLES: Role[] = ["ADMIN", "MEMBER", "VIEWER"];

export function TeamTab() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<SafeUser | null>(null);
  const currentUser = useAuthStore((s) => s.user);

  const { data: team, isLoading } = useTeamMembers();
  const roleMut = useUpdateUserRole();
  const deactivateMut = useDeactivateUser();

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
          {team?.length ?? 0} member{team?.length !== 1 ? "s" : ""} in your organization
        </p>
        <Can permission="users.manage">
          <Button size="sm" className="gap-1.5" onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-3.5 w-3.5" />
            Invite teammate
          </Button>
        </Can>
      </div>

      <Card>
        {isLoading ? (
          <CardContent className="space-y-3 pt-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="skeleton h-9 w-9 rounded-full" />
                <div className="space-y-1.5">
                  <div className="skeleton h-3.5 w-32 rounded" />
                  <div className="skeleton h-2.5 w-40 rounded" />
                </div>
              </div>
            ))}
          </CardContent>
        ) : !team || team.length === 0 ? (
          <EmptyState
            icon={UserPlus}
            title="No teammates yet"
            description="Invite people to collaborate on clients, deals, and tasks together."
          />
        ) : (
          <div className="divide-y" style={{ borderColor: "hsl(var(--border))" }}>
            {team.map((member) => {
              const isSelf = member.id === currentUser?.id;
              return (
                <div key={member.id} className="flex items-center gap-3 px-5 py-3.5">
                  <Avatar size="sm">
                    <AvatarFallback className="text-[11px]">
                      {getInitials(`${member.firstName} ${member.lastName}`)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-sm font-medium truncate" style={{ color: "hsl(var(--foreground))" }}>
                      {member.firstName} {member.lastName}
                      {isSelf && <span style={{ color: "hsl(var(--muted-foreground))" }}>(you)</span>}
                      {!member.isActive && (
                        <span
                          className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                          style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}
                        >
                          Deactivated
                        </span>
                      )}
                    </p>
                    <p className="text-xs truncate" style={{ color: "hsl(var(--muted-foreground))" }}>{member.email}</p>
                  </div>
                  <RoleBadge role={member.role} />

                  <Can permission="users.manage">
                    {!isSelf && member.isActive && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label="Member actions">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel className="text-xs">Change role</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {ASSIGNABLE_ROLES.filter((r) => r !== member.role).map((r) => (
                            <DropdownMenuItem
                              key={r}
                              onClick={() => roleMut.mutate({ id: member.id, payload: { role: r } })}
                            >
                              <ShieldCheck className="h-3.5 w-3.5" />
                              Make {r.charAt(0) + r.slice(1).toLowerCase()}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem destructive onClick={() => setDeactivateTarget(member)}>
                            <UserX className="h-3.5 w-3.5" />
                            Deactivate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </Can>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <InviteMemberModal open={inviteOpen} onClose={() => setInviteOpen(false)} />

      <ConfirmDialog
        open={!!deactivateTarget}
        title={`Deactivate ${deactivateTarget?.firstName}?`}
        description="They'll immediately lose access to this organization. This can be reversed by an admin later."
        confirmLabel="Deactivate"
        onConfirm={() => {
          if (!deactivateTarget) return;
          deactivateMut.mutate(deactivateTarget.id, { onSuccess: () => setDeactivateTarget(null) });
        }}
        onCancel={() => setDeactivateTarget(null)}
        isLoading={deactivateMut.isPending}
      />
    </div>
  );
}
