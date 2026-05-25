import { useEffect, useState, type Dispatch, type SetStateAction } from "react"
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
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
  component: TeacherRoute,
})

const studentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/student",
  beforeLoad: requireRole("student"),
  component: StudentRoute,
})

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
  studentRoute,
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
  return <AdminPage />
}

function PrincipalRoute() {
  return <PrincipalPage />
}

function TeacherRoute() {
  const { user } = rootRoute.useRouteContext()
  return <TeacherPage currentUser={user!} onLogout={useLogout()} />
}

function StudentRoute() {
  const { user } = rootRoute.useRouteContext()
  return <StudentPage currentUser={user!} onLogout={useLogout()} />
}

function ParentRoute() {
  return <ParentPage />
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

function getPortalPath(role: AuthUser["role"]): "/admin" | "/principal" | "/teacher" | "/student" | "/parent" {
  switch (role) {
    case "admin":
      return "/admin"
    case "principal":
      return "/principal"
    case "teacher":
      return "/teacher"
    case "student":
      return "/student"
    case "parent":
      return "/parent"
  }
}

export { App }
