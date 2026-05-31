import { lazy, Suspense, useEffect, useState, type Dispatch, type SetStateAction } from "react"
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  Outlet,
  redirect,
  RouterProvider,
  useNavigate,
} from "@tanstack/react-router"

import { getSession, logout, type AuthUser } from "@/modules/auth/api/local-auth"
import { NotFoundPage, UnauthorizedPage } from "@/modules/errors"
import type { StudentPage as StudentPortalPage, TeacherPanel } from "@/modules/exam-engine/types/exam-engine-ui.types"

const AdminPage = lazy(() => import("@/modules/admin").then((module) => ({ default: module.AdminPage })))
const LandingPage = lazy(() => import("@/modules/landing").then((module) => ({ default: module.LandingPage })))
const LoginPage = lazy(() => import("@/modules/auth").then((module) => ({ default: module.LoginPage })))
const ParentPage = lazy(() => import("@/modules/parent").then((module) => ({ default: module.ParentPage })))
const PrincipalPage = lazy(() => import("@/modules/principal").then((module) => ({ default: module.PrincipalPage })))
const RegisterPage = lazy(() => import("@/modules/auth").then((module) => ({ default: module.RegisterPage })))
const StudentPage = lazy(() => import("@/modules/student").then((module) => ({ default: module.StudentPage })))
const TeacherPage = lazy(() => import("@/modules/teacher").then((module) => ({ default: module.TeacherPage })))

type AppRouterContext = {
  isSessionLoading: boolean
  setUser: Dispatch<SetStateAction<AuthUser | null>>
  user: AuthUser | null
}

const rootRoute = createRootRouteWithContext<AppRouterContext>()({
  component: RootRoute,
  notFoundComponent: NotFoundPage,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginRoute,
})

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: RegisterRoute,
})

const examRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/exam",
  beforeLoad: ({ context }) => {
    if (!context.user) {
      throw redirect({ to: "/login" })
    }

    throw redirect({ to: getPortalPath(context.user.role) })
  },
  component: ExamRoute,
})

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  beforeLoad: requireRole("admin"),
  component: AdminRoute,
})

const principalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/principal",
  beforeLoad: requireRole("principal"),
  component: PrincipalRoute,
})

const teacherRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/teacher",
  beforeLoad: requireRoleRedirect("teacher", "/teacher/dashboard"),
})

const teacherDashboardRoute = createTeacherRoute("/teacher/dashboard", "dashboard")
const teacherBuilderRoute = createTeacherRoute("/teacher/builder", "builder")
const teacherBankRoute = createTeacherRoute("/teacher/bank", "bank")
const teacherGradingRoute = createTeacherRoute("/teacher/grading", "grading")

const studentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/student",
  beforeLoad: requireRoleRedirect("student", "/student/dashboard"),
})

const studentDashboardRoute = createStudentRoute("/student/dashboard", "dashboard")
const studentScheduleRoute = createStudentRoute("/student/schedule", "schedule")
const studentHomeworkRoute = createStudentRoute("/student/homework", "homework")
const studentExamsRoute = createStudentRoute("/student/exams", "exams")
const studentMessagesRoute = createStudentRoute("/student/messages", "messages")
const studentProfileRoute = createStudentRoute("/student/profile", "profile")
const studentSettingsRoute = createStudentRoute("/student/settings", "settings")

const parentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/parent",
  beforeLoad: requireRole("parent"),
  component: ParentRoute,
})

const unauthorizedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/unauthorized",
  component: UnauthorizedPage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  examRoute,
  adminRoute,
  principalRoute,
  teacherRoute,
  teacherDashboardRoute,
  teacherBuilderRoute,
  teacherBankRoute,
  teacherGradingRoute,
  studentRoute,
  studentDashboardRoute,
  studentScheduleRoute,
  studentHomeworkRoute,
  studentExamsRoute,
  studentMessagesRoute,
  studentProfileRoute,
  studentSettingsRoute,
  parentRoute,
  unauthorizedRoute,
])
const router = createRouter({
  context: {
    isSessionLoading: true,
    setUser: () => undefined,
    user: null,
  },
  routeTree,
})

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

function App() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isSessionLoading, setIsSessionLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    getSession().then((session) => {
      if (isMounted) {
        setUser(session)
        setIsSessionLoading(false)
      }
    })

    return () => {
      isMounted = false
    }
  }, [])

  if (isSessionLoading) {
    return <main className="min-h-screen bg-background" />
  }

  return <RouterProvider router={router} context={{ isSessionLoading, setUser, user }} />
}

function RootRoute() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Outlet />
    </Suspense>
  )
}

function RouteFallback() {
  return <main className="min-h-screen bg-background" />
}

function LoginRoute() {
  const navigate = useNavigate()
  const { setUser } = rootRoute.useRouteContext()

  function handleAuthenticated(nextUser: AuthUser) {
    setUser(nextUser)
    void navigate({ to: getPortalPath(nextUser.role) })
  }

  return <LoginPage onAuthenticated={handleAuthenticated} />
}

function RegisterRoute() {
  const navigate = useNavigate()
  const { setUser } = rootRoute.useRouteContext()

  function handleAuthenticated(nextUser: AuthUser) {
    setUser(nextUser)
    void navigate({ to: getPortalPath(nextUser.role) })
  }

  return <RegisterPage onAuthenticated={handleAuthenticated} />
}

function ExamRoute() {
  return null
}

function AdminRoute() {
  const { user } = rootRoute.useRouteContext()
  return <AdminPage currentUser={user!} onLogout={useLogout()} />
}

function PrincipalRoute() {
  const { user } = rootRoute.useRouteContext()
  return <PrincipalPage currentUser={user!} onLogout={useLogout()} />
}

function ParentRoute() {
  const { user } = rootRoute.useRouteContext()
  return <ParentPage currentUser={user!} onLogout={useLogout()} />
}


function createTeacherRoute(path: "/teacher/dashboard" | "/teacher/builder" | "/teacher/bank" | "/teacher/grading", panel: TeacherPanel) {
  return createRoute({
    getParentRoute: () => rootRoute,
    path,
    beforeLoad: requireRole("teacher"),
    component: () => <TeacherRoute panel={panel} />,
  })
}

function createStudentRoute(
  path:
    | "/student/dashboard"
    | "/student/schedule"
    | "/student/homework"
    | "/student/exams"
    | "/student/messages"
    | "/student/profile"
    | "/student/settings",
  page: StudentPortalPage,
) {
  return createRoute({
    getParentRoute: () => rootRoute,
    path,
    beforeLoad: requireRole("student"),
    component: () => <StudentRoute page={page} />,
  })
}

function TeacherRoute({ panel }: { panel: TeacherPanel }) {
  const { user } = rootRoute.useRouteContext()
  return <TeacherPage currentUser={user!} panel={panel} onLogout={useLogout()} />
}

function StudentRoute({ page }: { page: StudentPortalPage }) {
  const { user } = rootRoute.useRouteContext()
  return <StudentPage currentUser={user!} page={page} onLogout={useLogout()} />
}

function useLogout() {
  const navigate = useNavigate()
  const { setUser } = rootRoute.useRouteContext()

  return () => {
    logout()
    setUser(null)
    void navigate({ to: "/login" })
  }
}

function requireRole(role: AuthUser["role"]) {
  return ({ context }: { context: AppRouterContext }) => {
    if (!context.user) {
      throw redirect({ to: "/login" })
    }

    if (context.user.role !== role) {
      throw redirect({ to: "/unauthorized" })
    }
  }
}

function requireRoleRedirect(role: AuthUser["role"], to: "/teacher/dashboard" | "/student/dashboard") {
  return ({ context }: { context: AppRouterContext }) => {
    requireRole(role)({ context })
    throw redirect({ to })
  }
}

function getPortalPath(role: AuthUser["role"]): "/admin" | "/principal" | "/teacher/dashboard" | "/student/dashboard" | "/parent" {
  switch (role) {
    case "admin":
      return "/admin"
    case "principal":
      return "/principal"
    case "teacher":
      return "/teacher/dashboard"
    case "student":
      return "/student/dashboard"
    case "parent":
      return "/parent"
  }
}

export { App }
