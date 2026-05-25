import type { AuthUser } from "@/modules/auth"
import { ExamPortalPage } from "@/modules/exam-engine"

type TeacherPageProps = {
  currentUser: AuthUser
  onLogout: () => void
}

function TeacherPage({ currentUser, onLogout }: TeacherPageProps) {
  return <ExamPortalPage currentUser={currentUser} initialView="teacher" onLogout={onLogout} />
}

export { TeacherPage }
