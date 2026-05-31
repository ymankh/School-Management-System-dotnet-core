import { useState, type FormEvent, type ReactNode } from "react"
import { ArrowRight, BookOpenCheck, GraduationCap, LockKeyhole, Mail, UserRound } from "lucide-react"

import { loginAccount, registerAccount, type AuthUser } from "@/modules/auth/api/local-auth"
import heroImage from "@/assets/images/education-dashboard-hero.png"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"

type AuthPageProps = {
  onAuthenticated: (user: AuthUser) => void
}

type AuthShellProps = {
  children: ReactNode
  eyebrow: string
  title: string
  description: string
}

function AuthShell({ children, eyebrow, title, description }: AuthShellProps) {
  return (
    <main className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(380px,560px)]">
        <section className="relative hidden overflow-hidden bg-foreground text-background lg:block">
          <img
            alt=""
            className="absolute inset-0 size-full object-cover opacity-70"
            src={heroImage}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-foreground/95 via-foreground/62 to-primary/35" />
          <div className="relative flex min-h-screen flex-col justify-between p-10">
            <a className="flex w-fit items-center gap-2 font-semibold tracking-normal" href="/">
              <GraduationCap className="size-6" aria-hidden="true" />
              EduManager
            </a>
            <div className="max-w-xl pb-8">
              <div className="mb-4 flex w-fit items-center gap-2 rounded-lg bg-background/12 px-3 py-1.5 text-sm">
                <BookOpenCheck className="size-4" aria-hidden="true" />
                School operations workspace
              </div>
              <p className="font-heading text-4xl font-semibold leading-tight tracking-normal">
                Manage exams, classes, and student work from one focused dashboard.
              </p>
              <p className="mt-4 max-w-lg text-base leading-7 text-background/82">
                Sign in or create a database-backed account to explore the exam engine as a student, teacher, or
                administrator.
              </p>
            </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-6 lg:px-10">
          <div className="w-full max-w-md">
            <a className="mb-8 flex w-fit items-center gap-2 font-semibold tracking-normal lg:hidden" href="/">
              <GraduationCap className="size-6 text-primary" aria-hidden="true" />
              EduManager
            </a>

            <div className="mb-6">
              <p className="text-sm font-medium text-primary">{eyebrow}</p>
              <h1 className="mt-2 font-heading text-3xl font-semibold leading-tight tracking-normal">{title}</h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
            </div>

            {children}
          </div>
        </section>
      </div>
    </main>
  )
}

function FieldIcon({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-none absolute left-2.5 top-1/2 flex size-4 -translate-y-1/2 items-center justify-center text-muted-foreground">
      {children}
    </div>
  )
}

function LoginPage({ onAuthenticated }: AuthPageProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      onAuthenticated(await loginAccount({ email, password }))
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Unable to log in.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell
      description="Sign in with an account stored in the application database."
      eyebrow="Welcome back"
      title="Log in to EduManager"
    >
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Account access</CardTitle>
          <CardDescription>Only database-backed accounts can access the dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <div className="relative">
                <FieldIcon>
                  <Mail className="size-4" aria-hidden="true" />
                </FieldIcon>
                <Input
                  aria-invalid={Boolean(error)}
                  autoComplete="email"
                  className="pl-8"
                  id="login-email"
                  inputMode="email"
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  type="email"
                  value={email}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <div className="relative">
                <FieldIcon>
                  <LockKeyhole className="size-4" aria-hidden="true" />
                </FieldIcon>
                <Input
                  aria-invalid={Boolean(error)}
                  autoComplete="current-password"
                  className="pl-8"
                  id="login-password"
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  type="password"
                  value={password}
                />
              </div>
            </div>

            {error && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button className="w-full" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Logging in..." : "Log In"}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Need an account?{" "}
            <a className="font-medium text-primary underline-offset-4 hover:underline" href="/register">
              Create one
            </a>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  )
}

function RegisterPage({ onAuthenticated }: AuthPageProps) {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      onAuthenticated(await registerAccount({ fullName, email, password }))
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Unable to register.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell
      description="Create a database-backed account for the dashboard. Student accounts receive a student profile id."
      eyebrow="Start here"
      title="Create your account"
    >
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Profile details</CardTitle>
          <CardDescription>Public registration creates a student account. Admin role assignment is managed separately.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="register-name">Full name</Label>
              <div className="relative">
                <FieldIcon>
                  <UserRound className="size-4" aria-hidden="true" />
                </FieldIcon>
                <Input
                  autoComplete="name"
                  className="pl-8"
                  id="register-name"
                  onChange={(event) => setFullName(event.target.value)}
                  required
                  value={fullName}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-email">Email</Label>
              <div className="relative">
                <FieldIcon>
                  <Mail className="size-4" aria-hidden="true" />
                </FieldIcon>
                <Input
                  aria-invalid={Boolean(error)}
                  autoComplete="email"
                  className="pl-8"
                  id="register-email"
                  inputMode="email"
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  type="email"
                  value={email}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-password">Password</Label>
              <div className="relative">
                <FieldIcon>
                  <LockKeyhole className="size-4" aria-hidden="true" />
                </FieldIcon>
                <Input
                  aria-invalid={Boolean(error)}
                  autoComplete="new-password"
                  className="pl-8"
                  id="register-password"
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  type="password"
                  value={password}
                />
              </div>
            </div>

            {error && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button className="w-full" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Creating account..." : "Create Account"}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <a className="font-medium text-primary underline-offset-4 hover:underline" href="/login">
              Log in
            </a>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  )
}

export { LoginPage, RegisterPage }
