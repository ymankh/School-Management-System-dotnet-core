import type { SubjectFilters, UserFilters } from "@/modules/admin/api/admin-api"

const adminQueryKeys = {
  all: ["admin"] as const,
  subjects: (filters: SubjectFilters) => [...adminQueryKeys.subjectsRoot(), filters] as const,
  subjectsRoot: () => [...adminQueryKeys.all, "subjects"] as const,
  users: (filters: UserFilters) => [...adminQueryKeys.usersRoot(), filters] as const,
  usersRoot: () => [...adminQueryKeys.all, "users"] as const,
}

export { adminQueryKeys }
