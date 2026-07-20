"use client";

import { useState, useCallback } from "react";
import { subDays, format } from "date-fns";
import type { AnalyticsFilters } from "../types";

export type DatePreset = "7d" | "30d" | "90d" | "ytd" | "custom";

export interface FiltersState extends AnalyticsFilters {
  preset: DatePreset;
}

function presetToRange(preset: DatePreset): Pick<AnalyticsFilters, "dateFrom" | "dateTo"> {
  const today = new Date();
  const fmt = (d: Date) => format(d, "yyyy-MM-dd");

  switch (preset) {
    case "7d":
      return { dateFrom: fmt(subDays(today, 7)),  dateTo: fmt(today) };
    case "30d":
      return { dateFrom: fmt(subDays(today, 30)), dateTo: fmt(today) };
    case "90d":
      return { dateFrom: fmt(subDays(today, 90)), dateTo: fmt(today) };
    case "ytd":
      return { dateFrom: fmt(new Date(today.getFullYear(), 0, 1)), dateTo: fmt(today) };
    case "custom":
      return {};
  }
}

const DEFAULT_PRESET: DatePreset = "30d";

export function useAnalyticsFilters() {
  const [state, setState] = useState<FiltersState>(() => ({
    preset: DEFAULT_PRESET,
    ...presetToRange(DEFAULT_PRESET),
  }));

  const setPreset = useCallback((preset: DatePreset) => {
    setState((prev) => ({
      ...prev,
      preset,
      ...presetToRange(preset),
    }));
  }, []);

  const setCustomRange = useCallback((dateFrom: string, dateTo: string) => {
    setState((prev) => ({ ...prev, preset: "custom", dateFrom, dateTo }));
  }, []);

  const setUserId = useCallback((userId: string | undefined) => {
    setState((prev) => ({ ...prev, userId }));
  }, []);

  // Shape passed to each hook
  const filters: AnalyticsFilters = {
    dateFrom: state.dateFrom,
    dateTo:   state.dateTo,
    userId:   state.userId,
  };

  return { state, filters, setPreset, setCustomRange, setUserId };
}
