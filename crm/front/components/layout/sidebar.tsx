"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, TrendingUp, CheckSquare,
  BarChart2, Settings, Bell, ChevronLeft, ChevronRight,
  Zap, Activity, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui";

const NAV_ITEMS = [
  { label: "Dashboard",     href: "/dashboard",     icon: LayoutDashboard },
  { label: "Clients",       href: "/clients",        icon: Users           },
  { label: "Deals",         href: "/deals",          icon: TrendingUp      },
  { label: "Tasks",         href: "/tasks",          icon: CheckSquare     },
  { label: "Analytics",     href: "/analytics",      icon: BarChart2       },
  { label: "Notifications", href: "/notifications",  icon: Bell            },
  { label: "Activity",      href: "/activity",       icon: Activity        },
] as const;

const BOTTOM_ITEMS = [
  { label: "Settings", href: "/settings", icon: Settings },
] as const;

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  /** Mobile off-canvas drawer state (sidebar is always full-width on mobile) */
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <TooltipProvider delayDuration={0}>
      {/* ── Desktop sidebar — part of the flex layout, collapsible ─── */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className="relative hidden h-screen shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar lg:flex z-20"
      >
        <SidebarContents
          collapsed={collapsed}
          isActive={isActive}
        />

        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          className="absolute -right-3 top-[72px] z-30 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card shadow-card text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      </motion.aside>

      {/* ── Mobile drawer — off-canvas, backdrop, full width ────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="sidebar-backdrop"
              className="fixed inset-0 z-40 lg:hidden"
              style={{ background: "hsl(0 0% 0% / 0.55)" }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={onMobileClose}
            />
            <motion.aside
              key="sidebar-drawer"
              className="fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-sidebar-border bg-sidebar lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <SidebarContents
                collapsed={false}
                isActive={isActive}
                onNavigate={onMobileClose}
                closeButton={
                  <button
                    onClick={onMobileClose}
                    className="ml-auto rounded-md p-1.5 text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent"
                    aria-label="Close menu"
                  >
                    <X className="h-4 w-4" />
                  </button>
                }
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </TooltipProvider>
  );
}

interface SidebarContentsProps {
  collapsed: boolean;
  isActive: (href: string) => boolean;
  onNavigate?: () => void;
  closeButton?: React.ReactNode;
}

function SidebarContents({ collapsed, isActive, onNavigate, closeButton }: SidebarContentsProps) {
  return (
    <>
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-sidebar-border px-4 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0" onClick={onNavigate}>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                key="logo-text"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                className="text-sm font-semibold text-sidebar-foreground whitespace-nowrap overflow-hidden"
              >
                NexusCRM
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
        {closeButton}
      </div>

      {/* Main nav */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2 py-3">
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.href} item={item} active={isActive(item.href)} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="border-t border-sidebar-border p-2 py-3 space-y-0.5">
        {BOTTOM_ITEMS.map((item) => (
          <NavItem key={item.href} item={item} active={isActive(item.href)} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </div>
    </>
  );
}

interface NavItemProps {
  item: { label: string; href: string; icon: React.ElementType };
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}

function NavItem({ item, active, collapsed, onNavigate }: NavItemProps) {
  const Icon = item.icon;

  const linkContent = (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group relative flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-all duration-150",
        active
          ? "bg-sidebar-accent text-sidebar-primary"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      {active && (
        <motion.div
          layoutId="active-nav"
          className="absolute inset-0 rounded-md bg-sidebar-accent"
          transition={{ type: "spring", stiffness: 500, damping: 40 }}
        />
      )}
      <Icon
        className={cn(
          "relative z-10 h-4 w-4 shrink-0 transition-colors",
          active ? "text-sidebar-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-accent-foreground"
        )}
      />
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.15 }}
            className="relative z-10 whitespace-nowrap overflow-hidden"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    );
  }
  return linkContent;
}
