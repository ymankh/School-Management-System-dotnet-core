import { useEffect, useState } from "react"
import { GraduationCap, LogOut } from "lucide-react"

import { getSession, LoginPage, logout, RegisterPage, type AuthUser } from "@/modules/auth"
import { ExamEnginePage } from "@/modules/exam-engine"
import { LandingPage } from "@/modules/landing"
import { Button } from "@/shared/components/ui/button"

function App() {
  const [path, setPath] = useState(() => window.location.pathname)
  const [user, setUser] = useState<AuthUser | null>(() => getSession())

  useEffect(() => {
    function handlePopState() {
      setPath(window.location.pathname)
      setUser(getSession())
    }

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  function navigate(nextPath: string) {
    window.history.pushState(null, "", nextPath)
    setPath(nextPath)
  }

  function handleAuthenticated(nextUser: AuthUser) {
    setUser(nextUser)
    navigate("/exam")
  }

  function handleLogout() {
    logout()
    setUser(null)
    navigate("/login")
  }

  if (path === "/register") {
    return <RegisterPage onAuthenticated={handleAuthenticated} />
  }

  if (path === "/login") {
    return <LoginPage onAuthenticated={handleAuthenticated} />
  }

  if (path === "/") {
    return <LandingPage />
  }

  if (!user) {
    return <LoginPage onAuthenticated={handleAuthenticated} />
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
          <a className="flex items-center gap-2 font-semibold tracking-normal" href="/exam">
            <GraduationCap className="size-5 text-primary" aria-hidden="true" />
            EduManager
          </a>
          <div className="flex items-center gap-3">
            <div className="hidden text-right text-sm sm:block">
              <div className="font-medium">{user.fullName}</div>
              <div className="capitalize text-muted-foreground">{user.role}</div>
            </div>
            <Button size="sm" variant="outline" onClick={handleLogout}>
              <LogOut className="size-4" aria-hidden="true" />
              Log Out
            </Button>
          </div>
        </div>
      </header>
      <ExamEnginePage initialStudentId={user.studentId} initialView={user.role === "student" ? "student" : "teacher"} />
    </main>
  )
}

export { App }
