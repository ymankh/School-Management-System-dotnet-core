import axios, { type AxiosRequestConfig } from "axios"

import type {
  Exam,
  ExamAttempt,
  ExamDashboard,
  ExamSummary,
  QuestionBankItem,
  StudentAnswer,
} from "@/modules/exam-engine/types/exam-engine.types"

const api = axios.create({
  baseURL: "/api",
})

export type ExamDashboardFilters = {
  status?: string
  search?: string
  className?: string
  subject?: string
  date?: string
  mode?: string
}

async function request<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
  try {
    const response = await api.request<T>({ url: path, ...config })
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const detail = typeof error.response?.data === "string"
        ? error.response.data
        : error.response?.data?.error
      throw new Error(detail ?? `API request failed for ${path}`, { cause: error })
    }

    throw new Error(`API request failed for ${path}`, { cause: error })
  }
}

export async function getExamDashboard(filters: ExamDashboardFilters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== "all") {
      params.set(key, value)
    }
  })
  const query = params.toString()
  return request<ExamDashboard>(`/exams${query ? `?${query}` : ""}`)
}

export async function getStudentExams(studentId: number) {
  return request<ExamSummary[]>(`/students/${studentId}/exams`)
}

export async function getExam(id: number) {
  return request<Exam>(`/exams/${id}`)
}

export async function getQuestionBank() {
  return request<QuestionBankItem[]>("/question-bank")
}

export async function startAttempt(examId: number, studentId: number) {
  return request<ExamAttempt>(`/exams/${examId}/attempts`, {
    method: "POST",
    data: { studentId },
  })
}

export async function saveAnswer(attemptId: number, questionId: number, answerJson: string, flaggedForReview: boolean) {
  return request<StudentAnswer>(`/attempts/${attemptId}/answers/${questionId}`, {
    method: "PUT",
    data: { answerJson, flaggedForReview },
  })
}

export async function uploadAttemptFile(attemptId: number, questionId: number, file: File) {
  const formData = new FormData()
  formData.append("file", file)

  return request<{ fileName: string; contentType: string; sizeBytes: number; url: string; uploadedAtUtc: string }>(
    `/attempts/${attemptId}/answers/${questionId}/files`,
    { method: "POST", data: formData, headers: { "Content-Type": "multipart/form-data" } },
  )
}

export async function uploadExamAttachment(examId: number, file: File) {
  const formData = new FormData()
  formData.append("file", file)

  return request<{ fileName: string; contentType: string; sizeBytes: number; url: string; uploadedAtUtc: string }>(
    `/exams/${examId}/attachments`,
    { method: "POST", data: formData, headers: { "Content-Type": "multipart/form-data" } },
  )
}

export async function updateExam(exam: Exam) {
  return request<Exam>(`/exams/${exam.id}`, {
    method: "PUT",
    data: {
      title: exam.title,
      mode: exam.mode,
      startAtUtc: exam.startAtUtc,
      endAtUtc: exam.endAtUtc,
      maxMark: exam.maxMark,
      passingMark: exam.passingMark,
      isVisible: exam.isVisible,
      shuffleGroups: exam.shuffleGroups,
      focusModeEnabled: exam.focusModeEnabled,
      instructionsMarkdown: exam.instructionsMarkdown,
      studyMaterialsMarkdown: exam.studyMaterialsMarkdown,
      groups: exam.groups,
    },
  })
}

export async function addQuestionGroup(
  examId: number,
  payload: {
    title: string
    instructionsMarkdown: string
    selectionPolicy: string
    questionsToShow: number | null
    shuffleQuestions: boolean
  },
) {
  return request(`/exams/${examId}/groups`, {
    method: "POST",
    data: payload,
  })
}

export async function importQuestionsFromBank(examId: number, groupId: number, questionBankItemIds: number[]) {
  return request(`/exams/${examId}/questions/import-from-bank`, {
    method: "POST",
    data: { groupId, questionBankItemIds },
  })
}

export async function submitAttempt(attemptId: number) {
  return request<ExamAttempt>(`/attempts/${attemptId}/submit`, { method: "POST" })
}

export async function publishExam(examId: number) {
  return request<Exam>(`/exams/${examId}/publish`, { method: "POST" })
}

export async function duplicateExam(examId: number) {
  return request<Exam>(`/exams/${examId}/duplicate`, { method: "POST" })
}

export async function archiveExam(examId: number) {
  return request<Exam>(`/exams/${examId}/archive`, { method: "POST" })
}

export async function publishMarks(examId: number) {
  return request<Exam>(`/exams/${examId}/publish-marks`, { method: "POST" })
}

export async function getGradingAnswers(examId: number) {
  return request<StudentAnswer[]>(`/exams/${examId}/grading`)
}

export async function gradeAnswer(answerId: number, awardedMark: number, teacherFeedback: string) {
  return request<StudentAnswer>(`/answers/${answerId}/grade`, {
    method: "PUT",
    data: { awardedMark, teacherFeedback },
  })
}
