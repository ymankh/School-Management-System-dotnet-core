import { useEffect, useState, type Dispatch, type SetStateAction } from "react"
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  Navigate,
  Outlet,
  redirect,
  RouterProvider,
  useNavigate,
} from "@tanstack/react-router"

import { getSession, LoginPage, logout, RegisterPage, type AuthUser } from "@/modules/auth"
import { AdminPage } from "@/modules/admin"
import { NotFoundPage, UnauthorizedPage } from "@/modules/errors"
import { LandingPage } from "@/modules/landing"
import { ParentPage } from "@/modules/parent"
import { PrincipalPage } from "@/modules/principal"
import { StudentPage } from "@/modules/student"
import { TeacherPage } from "@/modules/teacher"
import type { StudentPage as StudentPortalPage, TeacherPanel } from "@/modules/exam-engine/types/exam-engine-ui.types"

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
  beforeLoad: requireRole("teacher"),
  component: () => <NavigateToRoute to="/teacher/dashboard" />,
})

const teacherDashboardRoute = createTeacherRoute("/teacher/dashboard", "dashboard")
const teacherBuilderRoute = createTeacherRoute("/teacher/builder", "builder")
const teacherBankRoute = createTeacherRoute("/teacher/bank", "bank")
const teacherGradingRoute = createTeacherRoute("/teacher/grading", "grading")

const studentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/student",
  beforeLoad: requireRole("student"),
  component: () => <NavigateToRoute to="/student/dashboard" />,
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
  return <Outlet />
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
  return <PrincipalPage />
}

function ParentRoute() {
  return <ParentPage />
}

type NavigateToRouteProps = {
  to: "/admin" | "/principal" | "/teacher/dashboard" | "/student/dashboard" | "/parent" | "/login" | "/unauthorized"
}

function NavigateToRoute({ to }: NavigateToRouteProps) {
  return <Navigate to={to} />
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
