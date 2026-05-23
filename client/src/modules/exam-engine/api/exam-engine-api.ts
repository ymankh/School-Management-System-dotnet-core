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

const useDemoFallback = import.meta.env.VITE_EXAM_ENGINE_DEMO === "true"

const demoExam: Exam = {
  id: 1,
  title: "Midterm: Algebra and Functions",
  classSubjectId: 10,
  subject: "Mathematics",
  className: "Grade 10 - A",
  teacherName: "H. Wells",
  mode: "Online",
  startAtUtc: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  endAtUtc: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
  maxMark: 100,
  passingMark: 50,
  isVisible: true,
  isPublished: true,
  markPublished: true,
  status: "Active",
  shuffleGroups: true,
  focusModeEnabled: true,
  instructionsMarkdown:
    "Answer all required questions. Markdown, images, and LaTeX are supported: `$x^2 + y^2 = z^2$`.",
  studyMaterialsMarkdown:
    "Review **quadratic functions** and the formula $$x = {-b \\pm \\sqrt{b^2-4ac} \\over 2a}$$.",
  groups: [
    {
      id: 2,
      examId: 1,
      title: "Core Skills",
      instructionsMarkdown: "These questions cover essential algebra skills.",
      authoringOrder: 1,
      selectionPolicy: "show-all",
      questionsToShow: null,
      shuffleQuestions: true,
      questions: [
        {
          id: 3,
          groupId: 2,
          type: "MultipleChoice",
          bodyMarkdown: "Which expression is equivalent to `$x^2 + 5x + 6$`?",
          referenceMarkdown: "",
          mark: 5,
          authoringOrder: 1,
          isRequired: true,
          difficulty: "Easy",
          tags: ["factorization", "algebra"],
          gradingRule: "auto",
          shuffleOptions: true,
          options: [
            { id: 4, textMarkdown: "`(x + 2)(x + 3)`", isCorrect: true, authoringOrder: 1 },
            { id: 5, textMarkdown: "`(x + 1)(x + 6)`", isCorrect: false, authoringOrder: 2 },
            { id: 6, textMarkdown: "`(x - 2)(x - 3)`", isCorrect: false, authoringOrder: 3 },
          ],
          matchPairs: [],
          orderingItems: [],
          acceptedAnswers: [],
        },
        {
          id: 7,
          groupId: 2,
          type: "TrueFalse",
          bodyMarkdown: "The graph of `$y = x^2$` opens upward.",
          referenceMarkdown: "",
          mark: 3,
          authoringOrder: 2,
          isRequired: true,
          difficulty: "Easy",
          tags: ["graphs"],
          gradingRule: "auto",
          shuffleOptions: false,
          options: [],
          matchPairs: [],
          orderingItems: [],
          acceptedAnswers: ["true"],
        },
        {
          id: 13,
          groupId: 2,
          type: "ShortAnswer",
          bodyMarkdown: "Write the value of `$f(3)$` for `$f(x)=2x+1$`.",
          referenceMarkdown: "",
          mark: 4,
          authoringOrder: 3,
          isRequired: true,
          difficulty: "Easy",
          tags: ["functions"],
          gradingRule: "exact-match",
          shuffleOptions: false,
          options: [],
          matchPairs: [],
          orderingItems: [],
          acceptedAnswers: ["7"],
        },
        {
          id: 14,
          groupId: 2,
          type: "FillInTheBlank",
          bodyMarkdown: "Fill in the blank: the vertex of `$y=(x-2)^2+5$` is `(___, ___)`.",
          referenceMarkdown: "",
          mark: 4,
          authoringOrder: 4,
          isRequired: true,
          difficulty: "Medium",
          tags: ["graphs", "vertex"],
          gradingRule: "exact-match",
          shuffleOptions: false,
          options: [],
          matchPairs: [],
          orderingItems: [],
          acceptedAnswers: ["2,5", "(2,5)", "2, 5"],
        },
      ],
    },
    {
      id: 8,
      examId: 1,
      title: "Extended Response",
      instructionsMarkdown: "Use clear steps and justify your answer.",
      authoringOrder: 2,
      selectionPolicy: "pick-random",
      questionsToShow: 2,
      shuffleQuestions: true,
      questions: [
        {
          id: 9,
          groupId: 8,
          type: "Article",
          bodyMarkdown:
            "Explain how the discriminant `$b^2 - 4ac$` determines the number of roots of a quadratic equation.",
          referenceMarkdown: "Reference: a quadratic has form `$ax^2 + bx + c = 0`.",
          mark: 10,
          authoringOrder: 1,
          isRequired: true,
          difficulty: "Medium",
          tags: ["quadratics", "essay"],
          gradingRule: "manual",
          shuffleOptions: false,
          options: [],
          matchPairs: [],
          orderingItems: [],
          acceptedAnswers: [],
        },
        {
          id: 10,
          groupId: 8,
          type: "FileUpload",
          bodyMarkdown: "Upload your handwritten solution for solving `$2x^2 - 3x - 2 = 0$`.",
          referenceMarkdown: "",
          mark: 8,
          authoringOrder: 2,
          isRequired: true,
          difficulty: "Medium",
          tags: ["upload", "quadratics"],
          gradingRule: "manual",
          shuffleOptions: false,
          options: [],
          matchPairs: [],
          orderingItems: [],
          acceptedAnswers: [],
          fileUploadRule: {
            acceptedContentTypes: ["image/jpeg", "image/png", "application/pdf"],
            maxSizeBytes: 10 * 1024 * 1024,
          },
        },
        {
          id: 15,
          groupId: 8,
          type: "Matching",
          bodyMarkdown: "Match each expression to its simplified value.",
          referenceMarkdown: "",
          mark: 6,
          authoringOrder: 3,
          isRequired: true,
          difficulty: "Medium",
          tags: ["matching", "simplification"],
          gradingRule: "auto",
          shuffleOptions: false,
          options: [],
          matchPairs: [
            { id: 16, leftMarkdown: "`2^3`", rightMarkdown: "`8`", authoringOrder: 1 },
            { id: 17, leftMarkdown: "`\\sqrt{16}`", rightMarkdown: "`4`", authoringOrder: 2 },
            { id: 18, leftMarkdown: "`3^2`", rightMarkdown: "`9`", authoringOrder: 3 },
          ],
          orderingItems: [],
          acceptedAnswers: [],
        },
        {
          id: 19,
          groupId: 8,
          type: "Ordering",
          bodyMarkdown: "Order the steps for solving `$x^2 + 5x + 6 = 0$`.",
          referenceMarkdown: "",
          mark: 6,
          authoringOrder: 4,
          isRequired: true,
          difficulty: "Medium",
          tags: ["ordering", "quadratics"],
          gradingRule: "auto",
          shuffleOptions: false,
          options: [],
          matchPairs: [],
          orderingItems: [
            "Factor the expression",
            "Set each factor equal to zero",
            "Solve each linear equation",
            "Write the two roots",
          ],
          acceptedAnswers: [],
        },
      ],
    },
  ],
}

const demoAttempt: ExamAttempt = {
  id: 100,
  examId: 1,
  studentId: 1,
  status: "InProgress",
  startedAtUtc: new Date().toISOString(),
  submittedAtUtc: null,
  totalMark: 0,
  questions: demoExam.groups.flatMap((group) =>
    group.questions.map((question, index) => ({
      questionId: question.id,
      deliveredOrder: index + 1,
      deliveredOptionOrder: question.options.map((option) => option.id),
    })),
  ),
  answers: [],
}

const demoQuestionBank: QuestionBankItem[] = [
  { id: 11, subject: "Mathematics", ownerName: "H. Wells", question: demoExam.groups[0].questions[0] },
  { id: 12, subject: "Mathematics", ownerName: "H. Wells", question: demoExam.groups[1].questions[0] },
]

async function request<T>(path: string, config?: AxiosRequestConfig, fallback?: T): Promise<T> {
  try {
    const response = await api.request<T>({ url: path, ...config })
    return response.data
  } catch {
    if (useDemoFallback && fallback !== undefined) {
      return fallback
    }

    throw new Error(`API request failed for ${path}`)
  }
}

function toDashboard(exam: Exam): ExamDashboard {
  const summary: ExamSummary = {
    id: exam.id,
    title: exam.title,
    subject: exam.subject,
    className: exam.className,
    teacherName: exam.teacherName,
    mode: exam.mode,
    status: exam.status,
    startAtUtc: exam.startAtUtc,
    endAtUtc: exam.endAtUtc,
    maxMark: exam.maxMark,
    isVisible: exam.isVisible,
    isPublished: exam.isPublished,
    markPublished: exam.markPublished,
    questionCount: exam.groups.reduce((count, group) => count + group.questions.length, 0),
    submissionCount: 18,
  }

  return {
    activeExams: 1,
    drafts: 2,
    submissions: 18,
    averageScore: 84,
    exams: [
      summary,
      { ...summary, id: 20, title: "Biology Lab Safety Quiz", subject: "Biology", status: "Draft", submissionCount: 0 },
      { ...summary, id: 21, title: "World History Essay", subject: "History", status: "Completed", submissionCount: 24 },
    ],
  }
}

export async function getExamDashboard() {
  return request<ExamDashboard>("/exams", undefined, toDashboard(demoExam))
}

export async function getStudentExams() {
  return request<ExamSummary[]>("/students/me/exams?studentId=1", undefined, toDashboard(demoExam).exams)
}

export async function getExam(id: number) {
  const fallback = id === demoExam.id ? demoExam : { ...demoExam, id }
  return request<Exam>(`/exams/${id}`, undefined, fallback)
}

export async function getQuestionBank() {
  return request<QuestionBankItem[]>("/question-bank", undefined, demoQuestionBank)
}

export async function startAttempt(examId: number) {
  return request<ExamAttempt>(
    `/exams/${examId}/attempts`,
    { method: "POST", data: { studentId: 1 } },
    { ...demoAttempt, examId },
  )
}

export async function saveAnswer(attemptId: number, questionId: number, answerJson: string, flaggedForReview: boolean) {
  return request<StudentAnswer>(
    `/attempts/${attemptId}/answers/${questionId}`,
    { method: "PUT", data: { answerJson, flaggedForReview } },
    {
      id: Date.now(),
      questionId,
      answerJson,
      awardedMark: 0,
      gradingStatus: "NotGraded",
      flaggedForReview,
      savedAtUtc: new Date().toISOString(),
      teacherFeedback: "",
    },
  )
}

export async function uploadAttemptFile(attemptId: number, questionId: number, file: File) {
  const formData = new FormData()
  formData.append("file", file)

  return request<{ fileName: string; contentType: string; sizeBytes: number; url: string; uploadedAtUtc: string }>(
    `/attempts/${attemptId}/answers/${questionId}/files`,
    { method: "POST", data: formData, headers: { "Content-Type": "multipart/form-data" } },
    {
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      url: URL.createObjectURL(file),
      uploadedAtUtc: new Date().toISOString(),
    },
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
    },
  })
}

export async function addQuestionGroup(examId: number) {
  return request(`/exams/${examId}/groups`, {
    method: "POST",
    data: {
      title: "New Question Group",
      instructionsMarkdown: "Add group instructions.",
      selectionPolicy: "show-all",
      questionsToShow: null,
      shuffleQuestions: true,
    },
  })
}

export async function importQuestionsFromBank(examId: number, groupId: number, questionBankItemIds: number[]) {
  return request(`/exams/${examId}/questions/import-from-bank`, {
    method: "POST",
    data: { groupId, questionBankItemIds },
  })
}

export async function submitAttempt(attemptId: number) {
  return request<ExamAttempt>(
    `/attempts/${attemptId}/submit`,
    { method: "POST" },
    { ...demoAttempt, id: attemptId, status: "PartiallyGraded", submittedAtUtc: new Date().toISOString(), totalMark: 8 },
  )
}

export async function publishExam(examId: number) {
  return request<Exam>(`/exams/${examId}/publish`, { method: "POST" }, { ...demoExam, id: examId, status: "Active", isPublished: true, isVisible: true })
}

export async function duplicateExam(examId: number) {
  return request<Exam>(`/exams/${examId}/duplicate`, { method: "POST" }, { ...demoExam, id: Date.now(), title: `${demoExam.title} Copy`, status: "Draft" })
}

export async function archiveExam(examId: number) {
  return request<Exam>(`/exams/${examId}/archive`, { method: "POST" }, { ...demoExam, id: examId, status: "Archived" })
}

export async function publishMarks(examId: number) {
  return request<Exam>(`/exams/${examId}/publish-marks`, { method: "POST" })
}
