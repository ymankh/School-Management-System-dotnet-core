import { useEffect, useState } from "react"

import { getSession, LoginPage, logout, RegisterPage, type AuthUser } from "@/modules/auth"
import { ExamPortalPage } from "@/modules/exam-engine"
import { LandingPage } from "@/modules/landing"

function App() {
  const [path, setPath] = useState(() => window.location.pathname)
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

    function handlePopState() {
      setPath(window.location.pathname)
      void getSession().then((session) => {
        if (isMounted) {
          setUser(session)
        }
      })
    }

    window.addEventListener("popstate", handlePopState)
    return () => {
      isMounted = false
      window.removeEventListener("popstate", handlePopState)
    }
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

  function getInitialView(nextUser: AuthUser) {
    if (nextUser.role === "student") {
      return "student"
    }

    if (nextUser.role === "admin") {
      return "admin"
    }

    return "teacher"
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

  if (isSessionLoading) {
    return <main className="min-h-screen bg-background" />
  }

  if (!user) {
    return <LoginPage onAuthenticated={handleAuthenticated} />
  }

  return (
    <ExamPortalPage
      currentUser={user}
      initialStudentId={user.studentId}
      initialView={getInitialView(user)}
      onLogout={handleLogout}
    />
  )
}

export { App }
