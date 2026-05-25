import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { BookOpen, GraduationCap, LayoutDashboard } from "lucide-react"

import {
  archiveExam,
  duplicateExam,
  getExam,
  getExamDashboard,
  getQuestionBank,
  getStudentExamAttempt,
  getStudentExams,
  importQuestionsFromBank,
  publishExam,
  publishMarks,
  saveAnswer,
  startAttempt,
  submitAttempt,
  updateExam,
  uploadAttemptFile,
  uploadExamAttachment,
} from "@/modules/exam-engine/api/exam-engine-api"
import type { ExamDashboardFilters } from "@/modules/exam-engine/api/exam-engine-api"
import {
  ApiUnavailable,
  PanelCrashFallback,
  SideButton,
} from "@/modules/exam-engine/components/exam-engine-shared"
import { StudentPortal } from "@/modules/exam-engine/components/student-portal"
import { TeacherPortal } from "@/modules/exam-engine/components/teacher-portal"
import type { Exam, ExamAttempt, ExamDashboard, ExamQuestion, StudentAnswer } from "@/modules/exam-engine/types/exam-engine.types"
import type { MainView, StudentPanel, TeacherPanel } from "@/modules/exam-engine/types/exam-engine-ui.types"
import { getAttemptQuestions, getExamQuestions } from "@/modules/exam-engine/utils/exam-engine-model"
import { Button } from "@/shared/components/ui/button"
import { ErrorBoundary } from "@/shared/components/error-boundary"

type ExamEnginePageProps = {
  initialStudentId?: number
  initialView?: MainView
}

function ExamEnginePage({ initialStudentId, initialView = "teacher" }: ExamEnginePageProps) {
  const [mainView, setMainView] = useState<MainView>(initialView)
  const [teacherPanel, setTeacherPanel] = useState<TeacherPanel>("dashboard")
  const [studentPanel, setStudentPanel] = useState<StudentPanel>("list")
  const [activeExamOverride, setActiveExamOverride] = useState<Exam | null>(null)
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null)
  const [answers, setAnswers] = useState<Record<number, StudentAnswer>>({})
  const [studentIdInput, setStudentIdInput] = useState(initialStudentId?.toString() ?? "")
  const [teacherNotice, setTeacherNotice] = useState<string | null>(null)
  const [dashboardFilters, setDashboardFilters] = useState<Required<ExamDashboardFilters>>({
    className: "all",
    date: "all",
    mode: "all",
    search: "",
    status: "all",
    subject: "all",
  })
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null)
  const queryClient = useQueryClient()
  const studentId = Number.parseInt(studentIdInput, 10)
  const hasStudentId = Number.isInteger(studentId) && studentId > 0

  const dashboardQuery = useQuery({
    queryKey: ["exam-dashboard", dashboardFilters],
    queryFn: () => getExamDashboard(dashboardFilters),
  })
  const studentExamsQuery = useQuery({
    enabled: hasStudentId,
    queryKey: ["student-exams", studentId],
    queryFn: () => getStudentExams(studentId),
  })
  const questionBankQuery = useQuery({ queryKey: ["question-bank"], queryFn: getQuestionBank })

  const startAttemptMutation = useMutation({
    mutationFn: ({ examId, studentId }: { examId: number; studentId: number }) => startAttempt(examId, studentId),
    onSuccess: (attemptResult) => {
      setAttempt(attemptResult)
      setAnswers(Object.fromEntries(attemptResult.answers.map((answer) => [answer.questionId, answer])))
      setSelectedQuestionId((current) => current ?? attemptResult.questions[0]?.questionId ?? null)
      setMainView("student")
      setStudentPanel("player")
    },
  })

  const saveAnswerMutation = useMutation({
    mutationFn: ({
      answerJson,
      attemptId,
      flaggedForReview,
      questionId,
    }: {
      answerJson: string
      attemptId: number
      flaggedForReview: boolean
      questionId: number
    }) => saveAnswer(attemptId, questionId, answerJson, flaggedForReview),
    onSuccess: (answer) => {
      setAnswers((current) => ({ ...current, [answer.questionId]: answer }))
    },
  })

  const uploadFileMutation = useMutation({
    mutationFn: ({ attemptId, file, questionId }: { attemptId: number; file: File; questionId: number }) =>
      uploadAttemptFile(attemptId, questionId, file),
    onSuccess: (fileResult, variables) => {
      void saveAnswerMutation.mutateAsync({
        answerJson: JSON.stringify({ ...fileResult, state: "uploaded" }),
        attemptId: variables.attemptId,
        flaggedForReview: answers[variables.questionId]?.flaggedForReview ?? false,
        questionId: variables.questionId,
      })
    },
  })

  const submitAttemptMutation = useMutation({
    mutationFn: submitAttempt,
    onSuccess: (submitted) => {
      setAttempt(submitted)
      setAnswers(Object.fromEntries(submitted.answers.map((answer) => [answer.questionId, answer])))
      setStudentPanel("results")
    },
  })

  const publishExamMutation = useMutation({
    mutationFn: publishExam,
    onMutate: () => {
      setTeacherNotice(null)
    },
    onSuccess: (exam) => {
      setActiveExamOverride(exam)
      setTeacherNotice(`${exam.title} is now ${exam.status}.`)
      queryClient.setQueriesData<ExamDashboard>({ queryKey: ["exam-dashboard"] }, (dashboard) => {
        if (!dashboard) {
          return dashboard
        }

        const exams = dashboard.exams.map((summary) =>
          summary.id === exam.id
            ? {
                ...summary,
                isPublished: exam.isPublished,
                isVisible: exam.isVisible,
                markPublished: exam.markPublished,
                status: exam.status,
              }
            : summary,
        )

        return {
          ...dashboard,
          activeExams: exams.filter((summary) => summary.status === "Active").length,
          drafts: exams.filter((summary) => summary.status === "Draft").length,
          exams,
        }
      })
      void queryClient.invalidateQueries({ queryKey: ["exam-dashboard"] })
      void queryClient.invalidateQueries({ queryKey: ["student-exams"] })
    },
  })

  const duplicateExamMutation = useMutation({
    mutationFn: duplicateExam,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["exam-dashboard"] })
    },
  })

  const archiveExamMutation = useMutation({
    mutationFn: archiveExam,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["exam-dashboard"] })
    },
  })

  const updateExamMutation = useMutation({
    mutationFn: updateExam,
    onSuccess: (exam) => {
      setActiveExamOverride(exam)
      void queryClient.invalidateQueries({ queryKey: ["exam", exam.id] })
      void queryClient.invalidateQueries({ queryKey: ["exam-dashboard"] })
    },
  })

  const activeExam = activeExamOverride
  const importQuestionsMutation = useMutation({
    mutationFn: ({ examId, groupId, itemIds }: { examId: number; groupId: number; itemIds: number[] }) =>
      importQuestionsFromBank(examId, groupId, itemIds),
    onSuccess: () => {
      if (activeExam) {
        void queryClient.invalidateQueries({ queryKey: ["exam", activeExam.id] })
      }
    },
  })

  const uploadExamAttachmentMutation = useMutation({
    mutationFn: ({ examId, file }: { examId: number; file: File }) => uploadExamAttachment(examId, file),
  })

  const publishMarksMutation = useMutation({
    mutationFn: publishMarks,
    onSuccess: (exam) => {
      setActiveExamOverride(exam)
      void queryClient.invalidateQueries({ queryKey: ["exam", exam.id] })
    },
  })

  const dashboard = dashboardQuery.data ?? null
  const studentExams = studentExamsQuery.data ?? []
  const questionBank = questionBankQuery.data ?? []
  const apiError =
    dashboardQuery.error ??
    (hasStudentId ? studentExamsQuery.error : null) ??
    questionBankQuery.error ??
    startAttemptMutation.error ??
    saveAnswerMutation.error ??
    uploadFileMutation.error ??
    submitAttemptMutation.error ??
    publishExamMutation.error ??
    duplicateExamMutation.error ??
    archiveExamMutation.error ??
    updateExamMutation.error ??
    importQuestionsMutation.error ??
    uploadExamAttachmentMutation.error ??
    publishMarksMutation.error

  const questions = useMemo(() => {
    const authoredQuestions = getExamQuestions(activeExam)
    if (!attempt) {
      return authoredQuestions
    }

    const byId = new Map(authoredQuestions.map((question) => [question.id, question]))
    return getAttemptQuestions(attempt)
      .slice()
      .sort((left, right) => left.deliveredOrder - right.deliveredOrder)
      .map((attemptQuestion) => byId.get(attemptQuestion.questionId))
      .filter((question): question is ExamQuestion => Boolean(question))
  }, [activeExam, attempt])
  const selectedQuestion = questions.find((question) => question.id === selectedQuestionId) ?? questions[0]

  async function handleStartExam(examId: number) {
    if (!hasStudentId) {
      return
    }

    const examResult = await queryClient.fetchQuery({ queryKey: ["exam", examId], queryFn: () => getExam(examId) })
    setActiveExamOverride(examResult)
    setSelectedQuestionId(getExamQuestions(examResult)[0]?.id ?? null)
    startAttemptMutation.mutate({ examId, studentId })
  }

  async function handleShowResults(examId: number) {
    if (!hasStudentId) {
      return
    }

    const [examResult, attemptResult] = await Promise.all([
      queryClient.fetchQuery({ queryKey: ["exam", examId], queryFn: () => getExam(examId) }),
      queryClient.fetchQuery({
        queryKey: ["student-exam-attempt", studentId, examId],
        queryFn: () => getStudentExamAttempt(studentId, examId),
      }),
    ])
    setActiveExamOverride(examResult)
    setAttempt(attemptResult)
    setAnswers(Object.fromEntries(attemptResult.answers.map((answer) => [answer.questionId, answer])))
    setSelectedQuestionId(getExamQuestions(examResult)[0]?.id ?? null)
    setMainView("student")
    setStudentPanel("results")
  }

  async function handleOpenTeacherExam(examId: number, panel: TeacherPanel) {
    const examResult = await queryClient.fetchQuery({ queryKey: ["exam", examId], queryFn: () => getExam(examId) })
    setActiveExamOverride(examResult)
    setTeacherPanel(panel)
  }

  async function handleSaveAnswer(questionId: number, answerJson: string, flaggedForReview = false) {
    if (!attempt) {
      return
    }

    await saveAnswerMutation.mutateAsync({ answerJson, attemptId: attempt.id, flaggedForReview, questionId })
  }

  async function handleUploadFile(questionId: number, file: File) {
    if (!attempt) {
      return
    }

    await uploadFileMutation.mutateAsync({ attemptId: attempt.id, file, questionId })
  }

  async function handleSubmitAttempt() {
    if (!attempt) {
      return
    }

    await submitAttemptMutation.mutateAsync(attempt.id)
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r bg-card p-4 lg:block">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GraduationCap className="size-5" />
            </div>
            <div>
              <div className="text-base font-semibold">EduManager</div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Exam Engine</div>
            </div>
          </div>

          <SideButton active={mainView === "teacher"} icon={LayoutDashboard} label="Teacher Portal" onClick={() => setMainView("teacher")} />
          <SideButton active={mainView === "student"} icon={BookOpen} label="Student Portal" onClick={() => setMainView("student")} />

          <div className="mt-8 border-t pt-4">
            <div className="mb-2 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Documentation-backed</div>
            <div className="rounded-md border bg-muted/40 p-3 text-xs leading-5 text-muted-foreground">
              Supports grouped questions, Markdown, LaTeX, autosave, review, grading, and published results.
            </div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-card px-4 lg:px-6">
            <div>
              <h1 className="text-lg font-semibold">Exam Engine</h1>
              <p className="text-xs text-muted-foreground">Online, paper, grouped, randomized, autosaved exams</p>
            </div>
            <div className="flex gap-2">
              <Button variant={mainView === "teacher" ? "default" : "outline"} size="sm" onClick={() => setMainView("teacher")}>
                Teacher
              </Button>
              <Button variant={mainView === "student" ? "default" : "outline"} size="sm" onClick={() => setMainView("student")}>
                Student
              </Button>
            </div>
          </header>

          {apiError && (
            <div className="border-b border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive lg:px-6">
              API error: {apiError instanceof Error ? apiError.message : "The exam API request failed."}
            </div>
          )}
          {teacherNotice && mainView === "teacher" && (
            <div className="border-b border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary lg:px-6">
              {teacherNotice}
            </div>
          )}

          <ErrorBoundary fallback={<PanelCrashFallback />}>
            {apiError && !activeExam && dashboardQuery.isError ? (
              <ApiUnavailable />
            ) : mainView === "teacher" ? (
              <TeacherPortal
                activeExam={activeExam}
                archiveExam={(examId) => archiveExamMutation.mutate(examId)}
                dashboard={dashboard}
                dashboardFilters={dashboardFilters}
                duplicateExam={(examId) => duplicateExamMutation.mutate(examId)}
                importFromBank={(examId, groupId, itemIds) => importQuestionsMutation.mutate({ examId, groupId, itemIds })}
                openExam={handleOpenTeacherExam}
                panel={teacherPanel}
                publishExam={(examId) => publishExamMutation.mutate(examId)}
                publishingExamId={publishExamMutation.isPending ? publishExamMutation.variables : null}
                publishMarks={(examId) => publishMarksMutation.mutate(examId)}
                questionBank={questionBank}
                setDashboardFilters={setDashboardFilters}
                setPanel={setTeacherPanel}
                updateExam={(exam) => updateExamMutation.mutate(exam)}
                uploadAttachment={(examId, file) => uploadExamAttachmentMutation.mutate({ examId, file })}
              />
            ) : (
              <StudentPortal
                activeExam={activeExam}
                answers={answers}
                attempt={attempt}
                onSaveAnswer={handleSaveAnswer}
                onSelectQuestion={setSelectedQuestionId}
                onShowResults={handleShowResults}
                onStartExam={handleStartExam}
                onSubmitAttempt={handleSubmitAttempt}
                onUploadFile={handleUploadFile}
                panel={studentPanel}
                questions={questions}
                selectedQuestion={selectedQuestion}
                setPanel={setStudentPanel}
                setStudentIdInput={setStudentIdInput}
                studentIdInput={studentIdInput}
                studentExams={studentExams}
              />
            )}
          </ErrorBoundary>
        </section>
      </div>
    </main>
  )
}

export { ExamEnginePage }
