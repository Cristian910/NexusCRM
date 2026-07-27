"use client";

import React, { useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { User, Building2, Users } from "lucide-react";
import { PageHeader } from "@/components/layout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import { Can } from "@/components/auth/can";
import { ProfileTab } from "@/features/settings/components/profile-tab";
import { OrganizationTab } from "@/features/settings/components/organization-tab";
import { TeamTab } from "@/features/settings/components/team-tab";
import { usePermissions } from "@/lib/hooks/use-permissions";
import { useTranslation } from "@/lib/i18n/context";

export function SettingsClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { can } = usePermissions();
  const { t } = useTranslation();

  const allTabs: (TabItem & { requires?: "organization.manage" | "users.read" })[] = [
    { value: "profile",      label: t("settings.tabProfile"),      icon: User      },
    { value: "organization", label: t("settings.tabOrganization"), icon: Building2, requires: "organization.manage" },
    { value: "team",         label: t("settings.tabTeam"),         icon: Users,     requires: "users.read" },
  ];

  const tabs = allTabs.filter((tabItem) => !tabItem.requires || can(tabItem.requires));
  const requested = searchParams.get("tab");
  const activeTab = tabs.some((tabItem) => tabItem.value === requested) ? requested! : tabs[0].value;

  const [tab, setTab] = useState(activeTab);

  function handleTabChange(value: string) {
    setTab(value);
    router.replace(`${pathname}?tab=${value}`, { scroll: false });
  }

  return (
    <ProtectedRoute permission="settings.read">
      <div className="space-y-5 pb-8">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <PageHeader title={t("settings.pageTitle")} description={t("settings.pageDescription")} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.04 }}>
          <Tabs items={tabs} value={tab} onChange={handleTabChange} layoutId="settings-tab-underline" />
        </motion.div>

        <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
          {tab === "profile" && <ProfileTab />}
          {tab === "organization" && (
            <Can permission="organization.manage">
              <OrganizationTab />
            </Can>
          )}
          {tab === "team" && (
            <Can permission="users.read">
              <TeamTab />
            </Can>
          )}
        </motion.div>
      </div>
    </ProtectedRoute>
  );
}
