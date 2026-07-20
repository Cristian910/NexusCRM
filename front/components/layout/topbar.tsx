"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, getInitials } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useLogout } from "@/features/auth/hooks/use-auth";
import { cn } from "@/lib/utils";

interface TopbarProps {
  className?: string;
  onMenuClick?: () => void;
}

export function Topbar({ className, onMenuClick }: TopbarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-10 flex h-14 items-center gap-3 border-b px-4 backdrop-blur-md",
        className
      )}
      style={{
        borderColor: "hsl(var(--border))",
        background: "hsl(var(--background) / 0.85)",
      }}
    >
      <button
        onClick={onMenuClick}
        className="-ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-accent lg:hidden"
        style={{ color: "hsl(var(--muted-foreground))" }}
        aria-label="Open menu"
      >
        <Menu className="h-4.5 w-4.5" />
      </button>

      <div className="flex-1 max-w-md">
        <SearchBar />
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <Button size="sm" className="gap-1.5 hidden sm:inline-flex">
          <Plus className="h-3.5 w-3.5" />
          New
        </Button>
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}

function SearchBar() {
  const [focused, setFocused] = React.useState(false);

  return (
    <Input
      placeholder="Search clients, deals, tasks…"
      startIcon={<Search className="h-3.5 w-3.5" />}
      endIcon={
        !focused ? (
          <kbd
            className="hidden sm:inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px]"
            style={{
              borderColor: "hsl(var(--border))",
              background: "hsl(var(--muted))",
              color: "hsl(var(--muted-foreground))",
            }}
          >
            ⌘K
          </kbd>
        ) : undefined
      }
      className="h-8 text-sm"
      style={{ background: "hsl(var(--muted) / 0.5)", borderColor: "transparent" }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      readOnly
    />
  );
}

function UserMenu() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { mutate: logout, isPending } = useLogout();

  const displayName = user ? `${user.firstName} ${user.lastName}` : "Loading…";
  const email = user?.email ?? "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-md p-1 transition-colors focus:outline-none focus:ring-2">
          <Avatar size="sm">
            <AvatarFallback>{user ? getInitials(displayName) : "…"}</AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium md:block">{user?.firstName ?? ""}</span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="pb-1">
          <p className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>
            {displayName}
          </p>
          <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            {email}
          </p>
          {user?.role && (
            <span
              className="mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium"
              style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}
            >
              {user.role}
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/settings?tab=profile")}>Profile</DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/settings?tab=team")}>Team settings</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive disabled={isPending} onClick={() => logout()}>
          {isPending ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
