import { useState, type FormEvent } from "react"
import { BookOpenCheck, GraduationCap, LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react"

import { loginAccount, registerAccount, type AuthRole, type AuthUser } from "@/modules/auth/api/local-auth"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"

type AuthPageProps = {
  onAuthenticated: (user: AuthUser) => void
}

function LoginPage({ onAuthenticated }: AuthPageProps) {
  const [email, setEmail] = useState("teacher@edumanager.test")
  const [password, setPassword] = useState("Teacher123!")
  const [error, setError] = useState("")

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    try {
      onAuthenticated(loginAccount({ email, password }))
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Unable to log in.")
    }
  }

  return (
    <AuthLayout
      eyebrow="Secure workspace"
      mode="login"
      title="Log in to EduManager"
      description="Use your staff or student account to open the academic dashboard."
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <AuthField icon={<Mail className="size-4" />} label="Email" htmlFor="email">
          <Input
            id="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@school.edu"
            required
            type="email"
          />
        </AuthField>
        <AuthField icon={<LockKeyhole className="size-4" />} label="Password" htmlFor="password">
          <Input
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            required
            type="password"
          />
        </AuthField>
        {error && <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        <Button className="h-10 w-full" type="submit">
          Log In
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Need an account?{" "}
        <a className="font-medium text-primary hover:underline" href="/register">
          Register
        </a>
      </p>
    </AuthLayout>
  )
}

function RegisterPage({ onAuthenticated }: AuthPageProps) {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<AuthRole>("student")
  const [error, setError] = useState("")

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    try {
      onAuthenticated(registerAccount({ fullName, email, password, role }))
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Unable to register.")
    }
  }

  return (
    <AuthLayout
      eyebrow="Account setup"
      mode="register"
      title="Create your EduManager account"
      description="Register a role-based account and continue into the exam workspace."
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <AuthField icon={<UserRound className="size-4" />} label="Full name" htmlFor="fullName">
          <Input
            id="fullName"
            autoComplete="name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Your full name"
            required
          />
        </AuthField>
        <AuthField icon={<Mail className="size-4" />} label="Email" htmlFor="registerEmail">
          <Input
            id="registerEmail"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@school.edu"
            required
            type="email"
          />
        </AuthField>
        <AuthField icon={<LockKeyhole className="size-4" />} label="Password" htmlFor="registerPassword">
          <Input
            id="registerPassword"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
            required
            type="password"
          />
        </AuthField>
        <div className="grid gap-2">
          <Label htmlFor="role">Role</Label>
          <Select value={role} onValueChange={(value) => setRole(value as AuthRole)}>
            <SelectTrigger className="h-10 w-full" id="role">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="teacher">Teacher</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {error && <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        <Button className="h-10 w-full" type="submit">
          Create Account
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <a className="font-medium text-primary hover:underline" href="/login">
          Log in
        </a>
      </p>
    </AuthLayout>
  )
}

type AuthLayoutProps = {
  children: React.ReactNode
  description: string
  eyebrow: string
  mode: "login" | "register"
  title: string
}

function AuthLayout({ children, description, eyebrow, mode, title }: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(420px,520px)]">
        <section className="hidden border-r bg-sidebar px-8 py-7 lg:flex lg:flex-col">
          <a className="flex w-fit items-center gap-3 text-base font-semibold" href="/login">
            <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GraduationCap className="size-5" aria-hidden="true" />
            </span>
            EduManager
          </a>
          <div className="flex flex-1 items-center">
            <div className="max-w-xl">
              <div className="mb-5 flex w-fit items-center gap-2 rounded-full border bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
                <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
                Academic Precision
              </div>
              <h1 className="max-w-lg text-3xl font-semibold leading-tight tracking-normal text-foreground">
                Quiet tools for exams, grading, and student progress.
              </h1>
              <div className="mt-8 grid max-w-lg gap-3">
                {[
                  ["Role-based access", "Students, teachers, and administrators enter the same structured workspace."],
                  ["Exam continuity", "Session state is preserved locally until backend authentication is connected."],
                  ["Dashboard density", "Layouts follow the temporary academic reference with precise spacing and muted surfaces."],
                ].map(([itemTitle, itemDescription]) => (
                  <div className="rounded-lg border bg-card p-4" key={itemTitle}>
                    <div className="flex items-center gap-3">
                      <BookOpenCheck className="size-4 text-primary" aria-hidden="true" />
                      <h2 className="text-sm font-semibold">{itemTitle}</h2>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{itemDescription}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Demo: teacher@edumanager.test / Teacher123!</p>
        </section>
        <section className="flex min-h-screen items-center justify-center px-5 py-8">
          <div className="w-full max-w-md">
            <a className="mb-8 flex items-center gap-3 text-base font-semibold lg:hidden" href="/login">
              <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <GraduationCap className="size-5" aria-hidden="true" />
              </span>
              EduManager
            </a>
            <Card className="rounded-lg border bg-card shadow-sm">
              <CardHeader className="gap-2 px-6 pt-6">
                <div className="mb-1 w-fit rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">{eyebrow}</div>
                <CardTitle className="text-2xl font-semibold tracking-normal">{title}</CardTitle>
                <CardDescription className="leading-6">{description}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5 px-6 pb-6">{children}</CardContent>
            </Card>
            <div className="mt-4 flex justify-center gap-3 text-sm">
              <a className={mode === "login" ? "font-medium text-primary" : "text-muted-foreground hover:text-foreground"} href="/login">
                Login
              </a>
              <span className="text-border">/</span>
              <a className={mode === "register" ? "font-medium text-primary" : "text-muted-foreground hover:text-foreground"} href="/register">
                Register
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

type AuthFieldProps = {
  children: React.ReactNode
  htmlFor: string
  icon: React.ReactNode
  label: string
}

function AuthField({ children, htmlFor, icon, label }: AuthFieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor}>
        <span className="text-muted-foreground">{icon}</span>
        {label}
      </Label>
      {children}
    </div>
  )
}

export { LoginPage, RegisterPage }
