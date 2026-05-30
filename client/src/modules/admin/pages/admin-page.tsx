import { useMemo, useState, type FormEvent } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  BookOpen,
  LogOut,
  Mail,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  UsersRound,
} from "lucide-react"

import type { AuthRole, AuthUser } from "@/modules/auth/api/local-auth"
import {
  createSubject,
  createUser,
  deleteSubject,
  deleteUser,
  getSubjects,
  getUsers,
  updateSubject,
  updateUser,
  updateUserRole,
  type AdminUser,
  type Subject,
} from "@/modules/admin/api/admin-api"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Checkbox } from "@/shared/components/ui/checkbox"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs"
import { Textarea } from "@/shared/components/ui/textarea"

type AdminPageProps = {
  currentUser: AuthUser
  onLogout: () => void
}

const roleOptions: AuthRole[] = ["admin", "principal", "teacher", "student", "parent"]

const defaultUserDraft = {
  fullName: "",
  email: "",
  password: "",
  role: "student" as AuthRole,
}

const defaultSubjectDraft = {
  name: "",
  code: "",
  description: "",
  isActive: true,
}

const emptyUsers: AdminUser[] = []
const emptySubjects: Subject[] = []

function AdminPage({ currentUser, onLogout }: AdminPageProps) {
  const [userSearch, setUserSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [subjectSearch, setSubjectSearch] = useState("")
  const [includeInactive, setIncludeInactive] = useState(true)

  const usersQuery = useQuery({
    queryKey: ["admin-users", roleFilter, userSearch],
    queryFn: () => getUsers({ role: roleFilter, search: userSearch }),
  })
  const subjectsQuery = useQuery({
    queryKey: ["admin-subjects", includeInactive, subjectSearch],
    queryFn: () => getSubjects({ includeInactive, search: subjectSearch }),
  })

  const users = usersQuery.data ?? emptyUsers
  const subjects = subjectsQuery.data ?? emptySubjects
  const roleCounts = useMemo(() => countRoles(users), [users])
  const activeSubjects = subjects.filter((subject) => subject.isActive).length
  const inactiveSubjects = subjects.length - activeSubjects
  const recentUsers = [...users]
    .sort((left, right) => Date.parse(right.createdAtUtc) - Date.parse(left.createdAtUtc))
    .slice(0, 5)

  return (
    <main className="min-h-screen bg-background p-4 lg:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <ShieldCheck className="size-4" aria-hidden="true" />
              Admin workspace
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal">Admin Portal</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage users, roles, and academic subjects.</p>
          </div>
          <div className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserRound className="size-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{currentUser.fullName}</div>
              <div className="truncate text-xs text-muted-foreground">{currentUser.email}</div>
            </div>
            <Button variant="outline" size="sm" onClick={onLogout}>
              <LogOut className="size-4" aria-hidden="true" />
              Logout
            </Button>
          </div>
        </header>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="w-full justify-start sm:w-fit">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard icon={UsersRound} label="Total Users" value={users.length} />
              <MetricCard icon={ShieldCheck} label="Admins" value={roleCounts.admin ?? 0} />
              <MetricCard icon={BookOpen} label="Active Subjects" value={activeSubjects} />
              <MetricCard icon={RefreshCw} label="Inactive Subjects" value={inactiveSubjects} />
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
              <Card>
                <CardHeader>
                  <CardTitle>Role Distribution</CardTitle>
                  <CardDescription>Current user count by portal role.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-2">
                    {roleOptions.map((role) => (
                      <div key={role} className="rounded-lg border bg-background p-3">
                        <div className="text-xs uppercase text-muted-foreground">{formatRole(role)}</div>
                        <div className="mt-2 text-2xl font-semibold">{roleCounts[role] ?? 0}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Users</CardTitle>
                  <CardDescription>Newest accounts in the system.</CardDescription>
                </CardHeader>
                <CardContent>
                  <DataState isLoading={usersQuery.isLoading} error={usersQuery.error} empty={!recentUsers.length}>
                    <div className="space-y-3">
                      {recentUsers.map((user) => (
                        <div key={user.id} className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate font-medium">{user.fullName}</div>
                            <div className="truncate text-xs text-muted-foreground">{user.email}</div>
                          </div>
                          <RoleBadge role={user.role} />
                        </div>
                      ))}
                    </div>
                  </DataState>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <UsersPanel
              roleFilter={roleFilter}
              search={userSearch}
              users={users}
              error={usersQuery.error}
              isLoading={usersQuery.isLoading}
              setRoleFilter={setRoleFilter}
              setSearch={setUserSearch}
            />
          </TabsContent>

          <TabsContent value="subjects">
            <SubjectsPanel
              error={subjectsQuery.error}
              includeInactive={includeInactive}
              isLoading={subjectsQuery.isLoading}
              search={subjectSearch}
              setIncludeInactive={setIncludeInactive}
              setSearch={setSubjectSearch}
              subjects={subjects}
            />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}

function UsersPanel({
  error,
  isLoading,
  roleFilter,
  search,
  setRoleFilter,
  setSearch,
  users,
}: {
  error: unknown
  isLoading: boolean
  roleFilter: string
  search: string
  setRoleFilter: (value: string) => void
  setSearch: (value: string) => void
  users: AdminUser[]
}) {
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState(defaultUserDraft)
  const [editingUserId, setEditingUserId] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState({ fullName: "", email: "", role: "student" as AuthRole })
  const [mutationError, setMutationError] = useState("")

  const refreshUsers = () => queryClient.invalidateQueries({ queryKey: ["admin-users"] })
  const createMutation = useMutation({
    mutationFn: createUser,
    onError: (nextError) => setMutationError(toErrorMessage(nextError)),
    onSuccess: () => {
      setDraft(defaultUserDraft)
      setMutationError("")
      void refreshUsers()
    },
  })
  const updateMutation = useMutation({
    mutationFn: updateUser,
    onError: (nextError) => setMutationError(toErrorMessage(nextError)),
  })
  const roleMutation = useMutation({
    mutationFn: updateUserRole,
    onError: (nextError) => setMutationError(toErrorMessage(nextError)),
  })
  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onError: (nextError) => setMutationError(toErrorMessage(nextError)),
    onSuccess: () => {
      setMutationError("")
      void refreshUsers()
    },
  })

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMutationError("")
    createMutation.mutate(draft)
  }

  function startEditing(user: AdminUser) {
    setEditingUserId(user.id)
    setEditDraft({ fullName: user.fullName, email: user.email, role: user.role })
    setMutationError("")
  }

  async function saveUser(user: AdminUser) {
    setMutationError("")

    try {
      await updateMutation.mutateAsync({ id: user.id, fullName: editDraft.fullName, email: editDraft.email })
      if (editDraft.role !== user.role) {
        await roleMutation.mutateAsync({ id: user.id, role: editDraft.role })
      }
      setEditingUserId(null)
      await refreshUsers()
    } catch {
      // Mutation handlers render the API error.
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(360px,420px)_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Create User</CardTitle>
          <CardDescription>Add an account and assign its portal role.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleCreateUser}>
            <Field label="Full name" id="new-user-name">
              <Input id="new-user-name" required value={draft.fullName} onChange={(event) => setDraft({ ...draft, fullName: event.target.value })} />
            </Field>
            <Field label="Email" id="new-user-email">
              <Input id="new-user-email" required type="email" value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} />
            </Field>
            <Field label="Temporary password" id="new-user-password">
              <Input id="new-user-password" required minLength={8} type="password" value={draft.password} onChange={(event) => setDraft({ ...draft, password: event.target.value })} />
            </Field>
            <Field label="Role" id="new-user-role">
              <Select value={draft.role} onValueChange={(value) => setDraft({ ...draft, role: value as AuthRole })}>
                <SelectTrigger id="new-user-role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((role) => (
                    <SelectItem key={role} value={role}>{formatRole(role)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {mutationError && <ErrorMessage message={mutationError} />}
            <Button disabled={createMutation.isPending} type="submit" className="w-full">
              <Plus className="size-4" aria-hidden="true" />
              {createMutation.isPending ? "Creating..." : "Create User"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Search, edit, assign roles, and remove accounts.</CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-2.5 top-2 size-4 text-muted-foreground" aria-hidden="true" />
                <Input className="pl-8 sm:w-64" placeholder="Search users" value={search} onChange={(event) => setSearch(event.target.value)} />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  {roleOptions.map((role) => (
                    <SelectItem key={role} value={role}>{formatRole(role)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataState isLoading={isLoading} error={error} empty={!users.length}>
            <div className="overflow-auto rounded-lg border">
              <table className="w-full min-w-[760px] border-collapse text-sm">
                <thead className="bg-muted text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Student ID</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const isEditing = editingUserId === user.id

                    return (
                      <tr key={user.id} className="border-t bg-card">
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <Input value={editDraft.fullName} onChange={(event) => setEditDraft({ ...editDraft, fullName: event.target.value })} />
                          ) : (
                            <div className="font-medium">{user.fullName}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <Input type="email" value={editDraft.email} onChange={(event) => setEditDraft({ ...editDraft, email: event.target.value })} />
                          ) : (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="size-4" aria-hidden="true" />
                              {user.email}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <Select value={editDraft.role} onValueChange={(value) => setEditDraft({ ...editDraft, role: value as AuthRole })}>
                              <SelectTrigger className="w-36">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {roleOptions.map((role) => (
                                  <SelectItem key={role} value={role}>{formatRole(role)}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <RoleBadge role={user.role} />
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{user.studentId ?? "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            {isEditing ? (
                              <>
                                <Button size="sm" disabled={updateMutation.isPending || roleMutation.isPending} onClick={() => void saveUser(user)}>Save</Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingUserId(null)}>Cancel</Button>
                              </>
                            ) : (
                              <>
                                <Button size="icon-sm" variant="ghost" title="Edit user" onClick={() => startEditing(user)}>
                                  <Pencil className="size-4" aria-hidden="true" />
                                </Button>
                                <Button size="icon-sm" variant="destructive" title="Delete user" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(user.id)}>
                                  <Trash2 className="size-4" aria-hidden="true" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </DataState>
        </CardContent>
      </Card>
    </div>
  )
}

function SubjectsPanel({
  error,
  includeInactive,
  isLoading,
  search,
  setIncludeInactive,
  setSearch,
  subjects,
}: {
  error: unknown
  includeInactive: boolean
  isLoading: boolean
  search: string
  setIncludeInactive: (value: boolean) => void
  setSearch: (value: string) => void
  subjects: Subject[]
}) {
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState(defaultSubjectDraft)
  const [editingSubjectId, setEditingSubjectId] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState(defaultSubjectDraft)
  const [mutationError, setMutationError] = useState("")

  const refreshSubjects = () => queryClient.invalidateQueries({ queryKey: ["admin-subjects"] })
  const createMutation = useMutation({
    mutationFn: createSubject,
    onError: (nextError) => setMutationError(toErrorMessage(nextError)),
    onSuccess: () => {
      setDraft(defaultSubjectDraft)
      setMutationError("")
      void refreshSubjects()
    },
  })
  const updateMutation = useMutation({
    mutationFn: updateSubject,
    onError: (nextError) => setMutationError(toErrorMessage(nextError)),
    onSuccess: () => {
      setEditingSubjectId(null)
      setMutationError("")
      void refreshSubjects()
    },
  })
  const deleteMutation = useMutation({
    mutationFn: deleteSubject,
    onError: (nextError) => setMutationError(toErrorMessage(nextError)),
    onSuccess: () => {
      setMutationError("")
      void refreshSubjects()
    },
  })

  function handleCreateSubject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMutationError("")
    createMutation.mutate(draft)
  }

  function startEditing(subject: Subject) {
    setEditingSubjectId(subject.id)
    setEditDraft({
      name: subject.name,
      code: subject.code,
      description: subject.description,
      isActive: subject.isActive,
    })
    setMutationError("")
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(360px,420px)_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Create Subject</CardTitle>
          <CardDescription>Add a subject that teachers can use for exams.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleCreateSubject}>
            <Field label="Subject name" id="new-subject-name">
              <Input id="new-subject-name" required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
            </Field>
            <Field label="Code" id="new-subject-code">
              <Input id="new-subject-code" required value={draft.code} onChange={(event) => setDraft({ ...draft, code: event.target.value })} />
            </Field>
            <Field label="Description" id="new-subject-description">
              <Textarea
                className="min-h-20"
                id="new-subject-description"
                value={draft.description}
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
              />
            </Field>
            {mutationError && <ErrorMessage message={mutationError} />}
            <Button disabled={createMutation.isPending} type="submit" className="w-full">
              <Plus className="size-4" aria-hidden="true" />
              {createMutation.isPending ? "Creating..." : "Create Subject"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Subject Management</CardTitle>
              <CardDescription>Maintain active and inactive academic subjects.</CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="absolute left-2.5 top-2 size-4 text-muted-foreground" aria-hidden="true" />
                <Input className="pl-8 sm:w-64" placeholder="Search subjects" value={search} onChange={(event) => setSearch(event.target.value)} />
              </div>
              <label className="flex h-8 items-center gap-2 rounded-lg border px-3 text-sm">
                <Checkbox checked={includeInactive} onCheckedChange={(checked) => setIncludeInactive(checked === true)} />
                Include inactive
              </label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataState isLoading={isLoading} error={error} empty={!subjects.length}>
            <div className="overflow-auto rounded-lg border">
              <table className="w-full min-w-[760px] border-collapse text-sm">
                <thead className="bg-muted text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Subject</th>
                    <th className="px-4 py-3 font-medium">Code</th>
                    <th className="px-4 py-3 font-medium">Description</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((subject) => {
                    const isEditing = editingSubjectId === subject.id

                    return (
                      <tr key={subject.id} className="border-t bg-card">
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <Input value={editDraft.name} onChange={(event) => setEditDraft({ ...editDraft, name: event.target.value })} />
                          ) : (
                            <div className="font-medium">{subject.name}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <Input value={editDraft.code} onChange={(event) => setEditDraft({ ...editDraft, code: event.target.value })} />
                          ) : (
                            <Badge variant="outline">{subject.code}</Badge>
                          )}
                        </td>
                        <td className="max-w-xs px-4 py-3">
                          {isEditing ? (
                            <Input value={editDraft.description} onChange={(event) => setEditDraft({ ...editDraft, description: event.target.value })} />
                          ) : (
                            <div className="truncate text-muted-foreground">{subject.description || "No description"}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <label className="flex items-center gap-2">
                              <Checkbox
                                checked={editDraft.isActive}
                                onCheckedChange={(checked) => setEditDraft({ ...editDraft, isActive: checked === true })}
                              />
                              Active
                            </label>
                          ) : (
                            <Badge variant={subject.isActive ? "secondary" : "outline"}>{subject.isActive ? "Active" : "Inactive"}</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            {isEditing ? (
                              <>
                                <Button size="sm" disabled={updateMutation.isPending} onClick={() => updateMutation.mutate({ id: subject.id, ...editDraft })}>Save</Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingSubjectId(null)}>Cancel</Button>
                              </>
                            ) : (
                              <>
                                <Button size="icon-sm" variant="ghost" title="Edit subject" onClick={() => startEditing(subject)}>
                                  <Pencil className="size-4" aria-hidden="true" />
                                </Button>
                                <Button size="icon-sm" variant="destructive" title="Deactivate subject" disabled={deleteMutation.isPending || !subject.isActive} onClick={() => deleteMutation.mutate(subject.id)}>
                                  <Trash2 className="size-4" aria-hidden="true" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </DataState>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({ icon: Icon, label, value }: { icon: typeof UsersRound; label: string; value: number }) {
  return (
    <Card size="sm">
      <CardContent>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="mt-2 text-3xl font-semibold">{value}</div>
          </div>
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-5" aria-hidden="true" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function Field({ children, id, label }: { children: React.ReactNode; id: string; label: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  )
}

function RoleBadge({ role }: { role: AuthRole }) {
  return <Badge variant={role === "admin" ? "default" : "secondary"}>{formatRole(role)}</Badge>
}

function DataState({
  children,
  empty,
  error,
  isLoading,
}: {
  children: React.ReactNode
  empty: boolean
  error: unknown
  isLoading: boolean
}) {
  if (isLoading) {
    return <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">Loading data...</div>
  }

  if (error) {
    return <ErrorMessage message={toErrorMessage(error)} />
  }

  if (empty) {
    return <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">No records found.</div>
  }

  return children
}

function ErrorMessage({ message }: { message: string }) {
  return <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{message}</div>
}

function countRoles(users: AdminUser[]) {
  return users.reduce<Record<AuthRole, number>>(
    (counts, user) => {
      counts[user.role] += 1
      return counts
    },
    { admin: 0, principal: 0, teacher: 0, student: 0, parent: 0 },
  )
}

function formatRole(role: AuthRole) {
  return role.charAt(0).toUpperCase() + role.slice(1)
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong."
}

export { AdminPage }
