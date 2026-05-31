import { useState } from "react"
import { BookOpen, GraduationCap, LayoutDashboard, UsersRound } from "lucide-react"

import type { AuthUser } from "@/modules/auth"
import { DashboardShell } from "@/shared/components/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"

type PrincipalPageProps = {
  currentUser: AuthUser
  onLogout: () => void
}

function PrincipalPage({ currentUser, onLogout }: PrincipalPageProps) {
  const [activePage, setActivePage] = useState("overview")
  const pages = [
    {
      content: (
        <Card>
          <CardHeader>
            <CardTitle>Academic Management</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Principal-specific class, teacher, student, and subject tools are not connected yet.
          </CardContent>
        </Card>
      ),
      icon: LayoutDashboard,
      id: "overview",
      label: "Overview",
    },
    { content: <Placeholder title="Classes" />, icon: GraduationCap, id: "classes", label: "Classes" },
    { content: <Placeholder title="Teachers" />, icon: UsersRound, id: "teachers", label: "Teachers" },
    { content: <Placeholder title="Subjects" />, icon: BookOpen, id: "subjects", label: "Subjects" },
  ]

  return (
    <DashboardShell
      currentUser={currentUser}
      description="Academic management modules will appear here."
      activePage={activePage}
      contentClassName="p-4 lg:p-6"
      onPageChange={setActivePage}
      onLogout={onLogout}
      pages={pages}
      sectionLabel="Principal"
      title="Principal Portal"
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

export { PrincipalPage }
