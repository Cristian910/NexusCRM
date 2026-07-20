export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  clients: {
    all:    ["clients"] as const,
    list:   (params?: object) => ["clients", "list", params] as const,
    detail: (id: string)      => ["clients", id] as const,
  },
  deals: {
    all:    ["deals"] as const,
    list:   (params?: object) => ["deals", "list", params] as const,
    detail: (id: string)      => ["deals", id] as const,
  },
  tasks: {
    all:    ["tasks"] as const,
    list:   (params?: object) => ["tasks", "list", params] as const,
    detail: (id: string)      => ["tasks", id] as const,
  },
  notifications: {
    all:         ["notifications"] as const,
    list:        (params?: object) => ["notifications", "list", params] as const,
    unreadCount: ["notifications", "unread-count"] as const,
  },
  analytics: {
    overview:       ["analytics", "overview"] as const,
    dealsByStage:   ["analytics", "deals-by-stage"] as const,
    revenueOverTime: (period?: string) => ["analytics", "revenue-over-time", period] as const,
    topClients:     ["analytics", "top-clients"] as const,
  },
} as const;
