import { useState } from "react"
import { LayoutDashboard } from "lucide-react"

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
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{currentUser.fullName} is signed in with principal access for {currentUser.email}.</p>
            <p>Use this portal as the principal entry point for academic oversight while class, teacher, and subject administration remain in the admin and teacher workspaces.</p>
          </CardContent>
        </Card>
      ),
      icon: LayoutDashboard,
      id: "overview",
      label: "Overview",
    },

  ]

  return (
    <DashboardShell
      currentUser={currentUser}
      description="Academic oversight entry point for principal users."
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


export { PrincipalPage }
