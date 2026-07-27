"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Menu, Briefcase, Users, CheckSquare, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, getInitials } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { LanguageSwitcher } from "./language-switcher";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useLogout } from "@/features/auth/hooks/use-auth";
import { useQuickCreateStore } from "@/lib/stores/quick-create-store";
import { useOnboardingStore } from "@/lib/stores/onboarding-store";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

interface TopbarProps {
  className?: string;
  onMenuClick?: () => void;
}

export function Topbar({ className, onMenuClick }: TopbarProps) {
  const { t } = useTranslation();

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
        aria-label={t("topbar.openMenu")}
      >
        <Menu className="h-4.5 w-4.5" />
      </button>

      <div className="flex-1 max-w-md">
        <SearchBar />
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <NewMenu />
        <HelpButton />
        <LanguageSwitcher />
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}

function HelpButton() {
  const { t } = useTranslation();
  const openTour = useOnboardingStore((s) => s.openTour);
  return (
    <button
      onClick={openTour}
      className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-accent"
      style={{ color: "hsl(var(--muted-foreground))" }}
      aria-label={t("onboarding.helpButtonLabel")}
      title={t("onboarding.helpButtonLabel")}
    >
      <HelpCircle className="h-4 w-4" />
    </button>
  );
}

/**
 * Global quick-create — previously a decorative button with no onClick.
 * Now opens the right modal from anywhere via useQuickCreateStore, mounted
 * once in DashboardShell so it works regardless of which page you're on.
 */
function NewMenu() {
  const { t } = useTranslation();
  const open = useQuickCreateStore((s) => s.open);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className="gap-1.5 hidden sm:inline-flex">
          <Plus className="h-3.5 w-3.5" />
          {t("common.new")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => open("deal")} className="gap-2">
          <Briefcase className="h-3.5 w-3.5" />
          {t("common.newDeal")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => open("client")} className="gap-2">
          <Users className="h-3.5 w-3.5" />
          {t("common.newClient")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => open("task")} className="gap-2">
          <CheckSquare className="h-3.5 w-3.5" />
          {t("common.newTask")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SearchBar() {
  const { t } = useTranslation();
  const [focused, setFocused] = React.useState(false);

  return (
    <Input
      placeholder={t("topbar.searchPlaceholder")}
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
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { mutate: logout, isPending } = useLogout();

  const displayName = user ? `${user.firstName} ${user.lastName}` : "…";
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
        <DropdownMenuItem onClick={() => router.push("/settings?tab=profile")}>{t("topbar.profile")}</DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/settings?tab=team")}>{t("topbar.teamSettings")}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive disabled={isPending} onClick={() => logout()}>
          {isPending ? t("topbar.signingOut") : t("topbar.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
