import { useMemo, useState, type FormEvent } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  BookOpen,
  Mail,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UsersRound,
} from "lucide-react"

import type { AuthRole, AuthUser } from "@/modules/auth/api/local-auth"
import { adminQueryKeys } from "@/modules/admin/api/admin-query-keys"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/components/ui/alert-dialog"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Checkbox } from "@/shared/components/ui/checkbox"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table"
import { Textarea } from "@/shared/components/ui/textarea"
import { DashboardShell } from "@/shared/components/dashboard-shell"

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
  const [activePage, setActivePage] = useState<"overview" | "users" | "subjects">("overview")
  const [userSearch, setUserSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [subjectSearch, setSubjectSearch] = useState("")
  const [includeInactive, setIncludeInactive] = useState(true)

  const userFilters = { role: roleFilter, search: userSearch }
  const subjectFilters = { includeInactive, search: subjectSearch }
  const usersQuery = useQuery({
    queryKey: adminQueryKeys.users(userFilters),
    queryFn: () => getUsers(userFilters),
  })
  const subjectsQuery = useQuery({
    queryKey: adminQueryKeys.subjects(subjectFilters),
    queryFn: () => getSubjects(subjectFilters),
  })

  const users = usersQuery.data ?? emptyUsers
  const subjects = subjectsQuery.data ?? emptySubjects
  const roleCounts = useMemo(() => countRoles(users), [users])
  const activeSubjects = subjects.filter((subject) => subject.isActive).length
  const inactiveSubjects = subjects.length - activeSubjects
  const recentUsers = [...users]
    .sort((left, right) => Date.parse(right.createdAtUtc) - Date.parse(left.createdAtUtc))
    .slice(0, 5)

  const navItems = [
    {
      content: (
        <div className="space-y-4">
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
        </div>
      ),
      icon: ShieldCheck,
      id: "overview",
      label: "Overview",
    },
    {
      content: (
        <UsersPanel
          roleFilter={roleFilter}
          search={userSearch}
          users={users}
          error={usersQuery.error}
          isLoading={usersQuery.isLoading}
          setRoleFilter={setRoleFilter}
          setSearch={setUserSearch}
        />
      ),
      icon: UsersRound,
      id: "users",
      label: "Users",
    },
    {
      content: (
        <SubjectsPanel
          error={subjectsQuery.error}
          includeInactive={includeInactive}
          isLoading={subjectsQuery.isLoading}
          search={subjectSearch}
          setIncludeInactive={setIncludeInactive}
          setSearch={setSubjectSearch}
          subjects={subjects}
        />
      ),
      icon: BookOpen,
      id: "subjects",
      label: "Subjects",
    },
  ]

  return (
    <DashboardShell
      currentUser={currentUser}
      description="Manage users, roles, and academic subjects."
      activePage={activePage}
      contentClassName="mx-auto w-full max-w-7xl space-y-4 p-4 lg:p-6"
      onPageChange={(page) => setActivePage(page as "overview" | "users" | "subjects")}
      onLogout={onLogout}
      pages={navItems}
      sectionLabel="Admin"
      title="Admin Portal"
    />
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
  const adminCount = users.filter((user) => user.role === "admin").length
  const [draft, setDraft] = useState(defaultUserDraft)
  const [editingUserId, setEditingUserId] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState({ fullName: "", email: "", role: "student" as AuthRole })
  const [mutationError, setMutationError] = useState("")

  const refreshUsers = () => queryClient.invalidateQueries({ queryKey: adminQueryKeys.usersRoot() })
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
            <div className="rounded-lg border">
              <Table className="min-w-[760px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const isEditing = editingUserId === user.id
                    const isOnlyAdmin = user.role === "admin" && adminCount === 1

                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          {isEditing ? (
                            <Input value={editDraft.fullName} onChange={(event) => setEditDraft({ ...editDraft, fullName: event.target.value })} />
                          ) : (
                            <div className="font-medium">{user.fullName}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input type="email" value={editDraft.email} onChange={(event) => setEditDraft({ ...editDraft, email: event.target.value })} />
                          ) : (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="size-4" aria-hidden="true" />
                              {user.email}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
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
                        </TableCell>
                        <TableCell className="text-muted-foreground">{user.studentId ?? "—"}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            {isEditing ? (
                              <>
                                <Button size="sm" disabled={updateMutation.isPending || roleMutation.isPending} onClick={() => void saveUser(user)}>Save</Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingUserId(null)}>Cancel</Button>
                              </>
                            ) : (
                              <>
                                <Button aria-label="Edit user" size="icon-sm" variant="ghost" title="Edit user" onClick={() => startEditing(user)}>
                                  <Pencil className="size-4" aria-hidden="true" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      aria-label={isOnlyAdmin ? "Cannot delete the only admin" : "Delete user"}
                                      size="icon-sm"
                                      variant="destructive"
                                      title={isOnlyAdmin ? "Cannot delete the only admin" : "Delete user"}
                                      disabled={deleteMutation.isPending || isOnlyAdmin}
                                    >
                                      <Trash2 className="size-4" aria-hidden="true" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete {user.fullName}?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This removes the account and cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction variant="destructive" onClick={() => deleteMutation.mutate(user.id)}>
                                        Delete user
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
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

  const refreshSubjects = () => queryClient.invalidateQueries({ queryKey: adminQueryKeys.subjectsRoot() })
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
              <Label className="flex h-11 items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm">
                <Checkbox checked={includeInactive} onCheckedChange={(checked) => setIncludeInactive(checked === true)} />
                Include inactive
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataState isLoading={isLoading} error={error} empty={!subjects.length}>
            <div className="rounded-lg border">
              <Table className="min-w-[760px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjects.map((subject) => {
                    const isEditing = editingSubjectId === subject.id

                    return (
                      <TableRow key={subject.id}>
                        <TableCell>
                          {isEditing ? (
                            <Input value={editDraft.name} onChange={(event) => setEditDraft({ ...editDraft, name: event.target.value })} />
                          ) : (
                            <div className="font-medium">{subject.name}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input value={editDraft.code} onChange={(event) => setEditDraft({ ...editDraft, code: event.target.value })} />
                          ) : (
                            <Badge variant="outline">{subject.code}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          {isEditing ? (
                            <Input value={editDraft.description} onChange={(event) => setEditDraft({ ...editDraft, description: event.target.value })} />
                          ) : (
                            <div className="truncate text-muted-foreground">{subject.description || "No description"}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Label className="flex items-center gap-2">
                              <Checkbox
                                checked={editDraft.isActive}
                                onCheckedChange={(checked) => setEditDraft({ ...editDraft, isActive: checked === true })}
                              />
                              Active
                            </Label>
                          ) : (
                            <Badge variant={subject.isActive ? "secondary" : "outline"}>{subject.isActive ? "Active" : "Inactive"}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            {isEditing ? (
                              <>
                                <Button size="sm" disabled={updateMutation.isPending} onClick={() => updateMutation.mutate({ id: subject.id, ...editDraft })}>Save</Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingSubjectId(null)}>Cancel</Button>
                              </>
                            ) : (
                              <>
                                <Button aria-label="Edit subject" size="icon-sm" variant="ghost" title="Edit subject" onClick={() => startEditing(subject)}>
                                  <Pencil className="size-4" aria-hidden="true" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button aria-label="Deactivate subject" size="icon-sm" variant="destructive" title="Deactivate subject" disabled={deleteMutation.isPending || !subject.isActive}>
                                      <Trash2 className="size-4" aria-hidden="true" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Deactivate {subject.name}?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Existing references stay intact, but the subject will no longer be active.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction variant="destructive" onClick={() => deleteMutation.mutate(subject.id)}>
                                        Deactivate subject
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
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
