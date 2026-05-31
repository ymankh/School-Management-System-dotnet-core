import { useState } from "react"
import { BookOpen, CalendarDays, LayoutDashboard, UsersRound } from "lucide-react"

import type { AuthUser } from "@/modules/auth"
import { DashboardShell } from "@/shared/components/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"

type ParentPageProps = {
  currentUser: AuthUser
  onLogout: () => void
}

function ParentPage({ currentUser, onLogout }: ParentPageProps) {
  const [activePage, setActivePage] = useState("overview")
  const pages = [
    {
      content: (
        <Card>
          <CardHeader>
            <CardTitle>Family Access</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Parent-specific child selection, classes, exams, and results are not connected yet.
          </CardContent>
        </Card>
      ),
      icon: LayoutDashboard,
      id: "overview",
      label: "Overview",
    },
    { content: <Placeholder title="Children" />, icon: UsersRound, id: "children", label: "Children" },
    { content: <Placeholder title="Exams" />, icon: BookOpen, id: "exams", label: "Exams" },
    { content: <Placeholder title="Schedule" />, icon: CalendarDays, id: "schedule", label: "Schedule" },
  ]

  return (
    <DashboardShell
      currentUser={currentUser}
      description="Linked child academic information will appear here."
      activePage={activePage}
      contentClassName="p-4 lg:p-6"
      onPageChange={setActivePage}
      onLogout={onLogout}
      pages={pages}
      sectionLabel="Parent"
      title="Parent Portal"
    />
  )
}

function Placeholder({ title }: { title: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">This page is not connected yet.</CardContent>
    </Card>
  )
}

export { ParentPage }
