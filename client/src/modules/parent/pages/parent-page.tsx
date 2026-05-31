import { BookOpen, CalendarDays, LayoutDashboard, UsersRound } from "lucide-react"

import type { AuthUser } from "@/modules/auth"
import { DashboardShell } from "@/shared/components/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"

type ParentPageProps = {
  currentUser: AuthUser
  onLogout: () => void
}

function ParentPage({ currentUser, onLogout }: ParentPageProps) {
  const navItems = [
    { active: true, icon: LayoutDashboard, label: "Overview", onClick: () => undefined },
    { active: false, icon: UsersRound, label: "Children", onClick: () => undefined },
    { active: false, icon: BookOpen, label: "Exams", onClick: () => undefined },
    { active: false, icon: CalendarDays, label: "Schedule", onClick: () => undefined },
  ]

  return (
    <DashboardShell
      currentUser={currentUser}
      description="Linked child academic information will appear here."
      navItems={navItems}
      onLogout={onLogout}
      sectionLabel="Parent"
      title="Parent Portal"
    >
      <div className="p-4 lg:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Family Access</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Parent-specific child selection, classes, exams, and results are not connected yet.
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}

export { ParentPage }
