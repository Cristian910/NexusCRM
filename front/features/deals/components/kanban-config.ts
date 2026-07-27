import type { DealStage, KanbanColumn } from "../types";

// Colors reference the pipeline "temperature scale" defined in globals.css
// (--stage-lead → --stage-lost) so the kanban board, charts, and badges all
// pull from the exact same source of truth as the brand gradient.
export const STAGE_CONFIG: Record<
  DealStage,
  { label: string; color: string; accent: string; probability: number }
> = {
  LEAD: {
    label: "Lead",
    color: "hsl(var(--stage-lead))",
    accent: "hsl(var(--stage-lead) / 0.16)",
    probability: 10,
  },
  CONTACTED: {
    label: "Contacted",
    color: "hsl(var(--stage-contacted))",
    accent: "hsl(var(--stage-contacted) / 0.16)",
    probability: 25,
  },
  NEGOTIATION: {
    label: "Negotiation",
    color: "hsl(var(--stage-negotiation))",
    accent: "hsl(var(--stage-negotiation) / 0.16)",
    probability: 60,
  },
  CLOSED_WON: {
    label: "Won",
    color: "hsl(var(--stage-won))",
    accent: "hsl(var(--stage-won) / 0.16)",
    probability: 100,
  },
  CLOSED_LOST: {
    label: "Lost",
    color: "hsl(var(--stage-lost))",
    accent: "hsl(var(--stage-lost) / 0.16)",
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
