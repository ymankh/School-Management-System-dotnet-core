import { BookOpen, GraduationCap, LayoutDashboard, UsersRound } from "lucide-react"

import type { AuthUser } from "@/modules/auth"
import { DashboardShell } from "@/shared/components/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"

type PrincipalPageProps = {
  currentUser: AuthUser
  onLogout: () => void
}

function PrincipalPage({ currentUser, onLogout }: PrincipalPageProps) {
  const navItems = [
    { active: true, icon: LayoutDashboard, label: "Overview", onClick: () => undefined },
    { active: false, icon: GraduationCap, label: "Classes", onClick: () => undefined },
    { active: false, icon: UsersRound, label: "Teachers", onClick: () => undefined },
    { active: false, icon: BookOpen, label: "Subjects", onClick: () => undefined },
  ]

  return (
    <DashboardShell
      currentUser={currentUser}
      description="Academic management modules will appear here."
      navItems={navItems}
      onLogout={onLogout}
      sectionLabel="Principal"
      title="Principal Portal"
    >
      <div className="p-4 lg:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Academic Management</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Principal-specific class, teacher, student, and subject tools are not connected yet.
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}

export { PrincipalPage }
