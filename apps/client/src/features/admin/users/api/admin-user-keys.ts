const adminUserKeys = {
  all: ["admin", "users"] as const,
  lists: () => [...adminUserKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...adminUserKeys.lists(), filters] as const,
  details: () => [...adminUserKeys.all, "detail"] as const,
  detail: (id: string) => [...adminUserKeys.details(), id] as const,
};

export default adminUserKeys;
