// Service
export { clientsService } from "./clients.service";

// Hooks
export {
  useClients, useClient, useCreateClient,
  useUpdateClient, useArchiveClient, useDeleteClient,
  clientKeys,
} from "./hooks/use-clients";

// Components
export { ClientsTable }       from "./components/clients-table";
export { ClientsToolbar }     from "./components/clients-toolbar";
export { Pagination as ClientsPagination } from "@/components/ui/pagination";
export { ClientModal }        from "./components/client-modal";
export { ClientForm }         from "./components/client-form";
export { ConfirmDialog }      from "@/components/ui/confirm-dialog";
export { ClientStatusBadge }  from "./components/client-status-badge";

// Schemas
export { createClientSchema, updateClientSchema } from "./schemas/client.schema";
export type { CreateClientValues, UpdateClientValues } from "./schemas/client.schema";

// Types
export type {
  Client, ClientStatus, ClientFilters,
  CreateClientPayload, UpdateClientPayload, ClientsPage,
} from "./types";
