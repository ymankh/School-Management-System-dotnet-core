import type { AuthUser } from "@/modules/auth"
import { ExamPortalPage } from "@/modules/exam-engine"

type StudentPageProps = {
  currentUser: AuthUser
  onLogout: () => void
}

function StudentPage({ currentUser, onLogout }: StudentPageProps) {
  return (
    <ExamPortalPage
      currentUser={currentUser}
      initialStudentId={currentUser.studentId}
      initialView="student"
      onLogout={onLogout}
    />
  )
}

export { StudentPage }
