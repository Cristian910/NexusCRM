// Service
export { tasksService } from "./tasks.service";

// Hooks
export {
  useTasks, useCreateTask, useUpdateTask,
  useCompleteTask, useCancelTask, useDeleteTask,
  taskKeys,
} from "./hooks/use-tasks";

// Components
export { TasksTable }       from "./components/tasks-table";
export { TasksToolbar }     from "./components/tasks-toolbar";
export { TaskModal }        from "./components/task-modal";
export { TaskForm }         from "./components/task-form";
export { TaskStatusBadge }  from "./components/task-status-badge";

// Schemas
export { taskFormSchema } from "./schemas/task.schema";
export type { TaskFormValues } from "./schemas/task.schema";

// Types
export type {
  Task, TaskStatus, TaskFilters,
  CreateTaskPayload, UpdateTaskPayload, TasksPage,
} from "./types";
