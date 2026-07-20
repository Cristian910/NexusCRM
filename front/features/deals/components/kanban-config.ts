import type { DealStage, KanbanColumn } from "../types";

export const STAGE_CONFIG: Record<
  DealStage,
  { label: string; color: string; accent: string; probability: number }
> = {
  LEAD: {
    label: "Lead",
    color: "hsl(238 76% 65%)",
    accent: "hsl(238 76% 65% / 0.2)",
    probability: 10,
  },
  CONTACTED: {
    label: "Contacted",
    color: "hsl(262 73% 62%)",
    accent: "hsl(262 73% 62% / 0.2)",
    probability: 25,
  },
  NEGOTIATION: {
    label: "Negotiation",
    color: "hsl(43 96% 56%)",
    accent: "hsl(43 96% 56% / 0.2)",
    probability: 60,
  },
  CLOSED_WON: {
    label: "Won",
    color: "hsl(142 71% 45%)",
    accent: "hsl(142 71% 45% / 0.2)",
    probability: 100,
  },
  CLOSED_LOST: {
    label: "Lost",
    color: "hsl(0 72% 51%)",
    accent: "hsl(0 72% 51% / 0.2)",
    probability: 0,
  },
};

export const ORDERED_STAGES: DealStage[] = [
  "LEAD", "CONTACTED", "NEGOTIATION", "CLOSED_WON", "CLOSED_LOST",
];

export function buildKanbanColumns(deals: import("../types").Deal[]): KanbanColumn[] {
  return ORDERED_STAGES.map((stage) => {
    const stageDeals = deals.filter((d) => d.stage === stage);
    const cfg = STAGE_CONFIG[stage];
    return {
      stage,
      label: cfg.label,
      color: cfg.color,
      accent: cfg.accent,
      deals: stageDeals,
      totalValue: stageDeals.reduce((sum, d) => sum + (d.value ?? 0), 0),
    };
  });
}
