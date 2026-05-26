import { useNavigate } from "@tanstack/react-router"

import type { AuthUser } from "@/modules/auth"
import { ExamPortalPage } from "@/modules/exam-engine"
import type { TeacherPanel } from "@/modules/exam-engine/types/exam-engine-ui.types"

type TeacherPageProps = {
  currentUser: AuthUser
  onLogout: () => void
  panel: TeacherPanel
}

function TeacherPage({ currentUser, onLogout, panel }: TeacherPageProps) {
  const navigate = useNavigate()

  function handlePanelChange(nextPanel: TeacherPanel) {
    const path = getTeacherPanelPath(nextPanel)
    void navigate({ to: path })
  }

  return (
    <ExamPortalPage
      currentUser={currentUser}
      initialTeacherPanel={panel}
      initialView="teacher"
      onLogout={onLogout}
      onTeacherPanelChange={handlePanelChange}
    />
  )
}

function getTeacherPanelPath(panel: TeacherPanel) {
  switch (panel) {
    case "dashboard":
      return "/teacher/dashboard"
    case "builder":
      return "/teacher/builder"
    case "bank":
      return "/teacher/bank"
    case "grading":
      return "/teacher/grading"
  }
}

export { TeacherPage }
