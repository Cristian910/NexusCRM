export { dealsService }           from "./deals.service";
export {
  useDeals, useDealsKanban, useDeal,
  useCreateDeal, useUpdateDealStage, useUpdateDeal, useDeleteDeal,
  dealKeys,
} from "./hooks/use-deals";
export { KanbanBoard }            from "./components/kanban-board";
export { KanbanColumn }           from "./components/kanban-column";
export { DealCard, DealCardOverlay } from "./components/deal-card";
export { DealModal }              from "./components/deal-modal";
export { DealDrawer }             from "./components/deal-drawer";
export { DealForm }               from "./components/deal-form";
export { DealsToolbar }           from "./components/deals-toolbar";
export { PipelineMetrics }        from "./components/pipeline-metrics";
export { KanbanSkeleton }         from "./components/kanban-skeleton";
export { STAGE_CONFIG, ORDERED_STAGES, buildKanbanColumns } from "./components/kanban-config";
export { createDealSchema, updateDealSchema } from "./schemas/deal.schema";
export type { CreateDealValues, UpdateDealValues } from "./schemas/deal.schema";
export type {
  Deal, DealStage, DealFilters,
  CreateDealPayload, UpdateDealPayload, KanbanColumn as KanbanColumnType,
} from "./types";
