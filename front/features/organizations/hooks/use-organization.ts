"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { organizationsService } from "../organizations.service";
import type { Organization, UpdateOrganizationPayload } from "../types";
import type { ApiError } from "@/types";
import { toast } from "@/lib/stores/toast-store";
import { t } from "@/lib/i18n/context";

export const orgKeys = {
  me: () => ["organization", "me"] as const,
};

export function useOrganization() {
  return useQuery({
    queryKey: orgKeys.me(),
    queryFn: organizationsService.getMe,
    staleTime: 60_000,
  });
}

export function useUpdateOrganization() {
  const qc = useQueryClient();

  return useMutation<Organization, ApiError, UpdateOrganizationPayload>({
    mutationFn: organizationsService.update,
    onSuccess: (updated) => {
      qc.setQueryData(orgKeys.me(), updated);
      toast.success(t("toasts.orgUpdated"));
    },
    onError: (err) => toast.error(t("toasts.orgUpdateFailed"), err.message),
  });
}
