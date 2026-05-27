import axios, { type AxiosRequestConfig } from "axios"

import type {
  ClassSubjectOption,
  Exam,
  ExamMode,
  ExamAttempt,
  ExamDashboard,
  ExamSummary,
  QuestionBankItem,
  StudentAnswer,
  SubjectSkill,
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

function normalizeExam(exam: Exam): Exam {
  return {
    ...exam,
    groups: Array.isArray(exam.groups)
      ? exam.groups.map((group) => ({
          ...group,
          questions: Array.isArray(group.questions)
            ? group.questions.map(normalizeQuestion)
            : [],
        }))
      : [],
  }
}

function normalizeQuestion<T extends QuestionBankItem["question"]>(question: T): T {
  return {
    ...question,
    acceptedAnswers: Array.isArray(question.acceptedAnswers) ? question.acceptedAnswers : [],
    matchPairs: Array.isArray(question.matchPairs) ? question.matchPairs : [],
    options: Array.isArray(question.options) ? question.options : [],
    orderingItems: Array.isArray(question.orderingItems) ? question.orderingItems : [],
    tags: Array.isArray(question.tags) ? question.tags : [],
  }
}

function normalizeAttempt(attempt: ExamAttempt): ExamAttempt {
  return {
    ...attempt,
    answers: Array.isArray(attempt.answers) ? attempt.answers : [],
    questions: Array.isArray(attempt.questions) ? attempt.questions : [],
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
  const dashboard = await request<ExamDashboard>(`/exams${query ? `?${query}` : ""}`)
  return { ...dashboard, exams: Array.isArray(dashboard.exams) ? dashboard.exams : [] }
}

export async function getStudentExams(studentId: number) {
  const exams = await request<ExamSummary[]>(`/students/${studentId}/exams`)
  return Array.isArray(exams) ? exams : []
}

export async function getExam(id: number) {
  return normalizeExam(await request<Exam>(`/exams/${id}`))
}

export async function createExam(payload: {
  title: string
  classSubjectId: number
  subject: string
  className: string
  teacherName: string
  mode: ExamMode
  startAtUtc: string
  endAtUtc: string
  maxMark: number
  passingMark: number
  instructionsMarkdown: string
}) {
  return normalizeExam(await request<Exam>("/exams", {
    method: "POST",
    data: payload,
  }))
}

export async function getStudentExamAttempt(studentId: number, examId: number) {
  return normalizeAttempt(await request<ExamAttempt>(`/students/${studentId}/exams/${examId}/attempt`))
}

export async function getQuestionBank() {
  const items = await request<QuestionBankItem[]>("/question-bank")
  return Array.isArray(items)
    ? items.map((item) => ({ ...item, question: normalizeQuestion(item.question) }))
    : []
}

export async function getSubjectSkills(classSubjectId: number) {
  const skills = await request<SubjectSkill[]>(`/class-subjects/${classSubjectId}/skills`)
  return Array.isArray(skills) ? skills : []
}

export async function getClassSubjects() {
  const options = await request<ClassSubjectOption[]>("/class-subjects")
  return Array.isArray(options) ? options : []
}

export async function createSubjectSkill(payload: {
  classSubjectId: number
  subject: string
  name: string
  descriptionMarkdown: string
  displayOrder: number
}) {
  return request<SubjectSkill>(`/class-subjects/${payload.classSubjectId}/skills`, {
    method: "POST",
    data: payload,
  })
}

export async function startAttempt(examId: number, studentId: number) {
  return normalizeAttempt(await request<ExamAttempt>(`/exams/${examId}/attempts`, {
    method: "POST",
    data: { studentId },
  }))
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
  return normalizeExam(await request<Exam>(`/exams/${exam.id}`, {
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
  }))
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

export async function submitAttempt(attemptId: number, expired = false) {
  return normalizeAttempt(await request<ExamAttempt>(`/attempts/${attemptId}/submit${expired ? "?expired=true" : ""}`, { method: "POST" }))
}

export async function publishExam(examId: number) {
  return normalizeExam(await request<Exam>(`/exams/${examId}/publish`, { method: "POST" }))
}

export async function duplicateExam(examId: number) {
  return normalizeExam(await request<Exam>(`/exams/${examId}/duplicate`, { method: "POST" }))
}

export async function archiveExam(examId: number) {
  return normalizeExam(await request<Exam>(`/exams/${examId}/archive`, { method: "POST" }))
}

export async function publishMarks(examId: number) {
  return normalizeExam(await request<Exam>(`/exams/${examId}/publish-marks`, { method: "POST" }))
}

export async function getGradingAnswers(examId: number) {
  const answers = await request<StudentAnswer[]>(`/exams/${examId}/grading`)
  return Array.isArray(answers) ? answers : []
}

export async function gradeAnswer(answerId: number, awardedMark: number, teacherFeedback: string) {
  return request<StudentAnswer>(`/answers/${answerId}/grade`, {
    method: "PUT",
    data: { awardedMark, teacherFeedback },
  })
}
