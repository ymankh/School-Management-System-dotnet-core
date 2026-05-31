import type { ExamDashboardFilters } from "@/modules/exam-engine/api/exam-engine-api"

const examQueryKeys = {
  all: ["exam-engine"] as const,
  classSubjects: () => [...examQueryKeys.all, "class-subjects"] as const,
  dashboard: (filters: ExamDashboardFilters) => [...examQueryKeys.dashboardRoot(), filters] as const,
  dashboardRoot: () => [...examQueryKeys.all, "dashboard"] as const,
  detail: (examId: number) => [...examQueryKeys.details(), examId] as const,
  details: () => [...examQueryKeys.all, "exam"] as const,
  grading: (examId: number) => [...examQueryKeys.all, "grading", examId] as const,
  questionBank: () => [...examQueryKeys.all, "question-bank"] as const,
  studentAttempt: (studentId: number, examId: number) => [...examQueryKeys.all, "student-attempt", studentId, examId] as const,
  studentExams: (studentId: number) => [...examQueryKeys.studentExamsRoot(), studentId] as const,
  studentExamsRoot: () => [...examQueryKeys.all, "student-exams"] as const,
  subjectSkills: (classSubjectId: number) => [...examQueryKeys.all, "subject-skills", classSubjectId] as const,
}

export { examQueryKeys }
