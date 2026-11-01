const adminOrderKeys = {
  all: ["admin", "orders"] as const,
  lists: () => [...adminOrderKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...adminOrderKeys.lists(), filters] as const,
  details: () => [...adminOrderKeys.all, "detail"] as const,
  detail: (id: string) => [...adminOrderKeys.details(), id] as const,
};

export default adminOrderKeys;
