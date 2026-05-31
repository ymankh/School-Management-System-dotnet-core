import { useState } from "react"
import { LayoutDashboard } from "lucide-react"

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
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{currentUser.fullName} is signed in with parent access for {currentUser.email}.</p>
            <p>Use this portal as the family entry point for academic updates. Linked-child exam details remain available through the student exam workspace when a student profile is selected.</p>
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
      description="Family access entry point for parent users."
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


export { ParentPage }
