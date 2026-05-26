import { useNavigate } from "@tanstack/react-router"

import type { AuthUser } from "@/modules/auth"
import { ExamPortalPage } from "@/modules/exam-engine"
import type { StudentPage as StudentPortalPage } from "@/modules/exam-engine/types/exam-engine-ui.types"

type StudentPageProps = {
  currentUser: AuthUser
  onLogout: () => void
  page: StudentPortalPage
}

function StudentPage({ currentUser, onLogout, page }: StudentPageProps) {
  const navigate = useNavigate()

  function handlePageChange(nextPage: StudentPortalPage) {
    const path = getStudentPagePath(nextPage)
    void navigate({ to: path })
  }

  return (
    <ExamPortalPage
      currentUser={currentUser}
      initialStudentId={currentUser.studentId}
      initialStudentPage={page}
      initialView="student"
      onLogout={onLogout}
      onStudentPageChange={handlePageChange}
    />
  )
}

function getStudentPagePath(page: StudentPortalPage) {
  switch (page) {
    case "dashboard":
      return "/student/dashboard"
    case "schedule":
      return "/student/schedule"
    case "homework":
      return "/student/homework"
    case "exams":
      return "/student/exams"
    case "messages":
      return "/student/messages"
    case "profile":
      return "/student/profile"
    case "settings":
      return "/student/settings"
  }
}

export { StudentPage }
