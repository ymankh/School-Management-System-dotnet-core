import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  BookOpen,
  CalendarDays,
  LayoutDashboard,
  Mail,
  NotebookText,
  ShieldCheck,
  UserRound,
} from "lucide-react"

import type { AuthUser } from "@/modules/auth"
import {
  archiveExam,
  createExam,
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
} from "@/modules/exam-engine/components/exam-engine-shared"
import { StudentPortal } from "@/modules/exam-engine/components/student-portal"
import { TeacherPortal } from "@/modules/exam-engine/components/teacher-portal"
import type { ClassSubjectOption, Exam, ExamAttempt, ExamDashboard, ExamQuestion, StudentAnswer } from "@/modules/exam-engine/types/exam-engine.types"
import type { MainView, StudentPage, StudentPanel, TeacherPanel } from "@/modules/exam-engine/types/exam-engine-ui.types"
import { getAttemptQuestions, getExamQuestions } from "@/modules/exam-engine/utils/exam-engine-model"
import { DashboardShell, type DashboardNavItem } from "@/shared/components/dashboard-shell"
import { ErrorBoundary } from "@/shared/components/error-boundary"

type ExamPortalPageProps = {
  currentUser?: AuthUser
  initialStudentId?: number
  initialStudentPage?: StudentPage
  initialTeacherPanel?: TeacherPanel
  initialView?: MainView
  onLogout?: () => void
  onStudentPageChange?: (page: StudentPage) => void
  onTeacherPanelChange?: (panel: TeacherPanel) => void
}

const viewLabels: Record<MainView, string> = {
  student: "Student Portal",
  teacher: "Teacher Portal",
}

const viewIcons: Record<MainView, typeof LayoutDashboard> = {
  student: BookOpen,
  teacher: LayoutDashboard,
}

const studentPageLabels: Record<StudentPage, string> = {
  dashboard: "Dashboard",
  exams: "Exams",
  homework: "Homework",
  messages: "Messages",
  profile: "Profile",
  schedule: "Schedule",
  settings: "Settings",
}

const studentPageIcons: Record<StudentPage, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  exams: BookOpen,
  homework: NotebookText,
  messages: Mail,
  profile: UserRound,
  schedule: CalendarDays,
  settings: ShieldCheck,
}

const studentPages: StudentPage[] = ["dashboard", "schedule", "homework", "exams", "messages", "profile", "settings"]

function getAllowedViews(role?: AuthUser["role"]): MainView[] {
  if (role === "teacher" || role === "student") {
    return [role]
  }

  return []
}

function getDefaultView(role?: AuthUser["role"], initialView: MainView = "teacher") {
  const allowedViews = getAllowedViews(role)
  return allowedViews.includes(initialView) ? initialView : allowedViews[0]
}

function ExamPortalPage({
  currentUser,
  initialStudentId,
  initialStudentPage = "dashboard",
  initialTeacherPanel = "dashboard",
  initialView = "teacher",
  onLogout,
  onStudentPageChange,
  onTeacherPanelChange,
}: ExamPortalPageProps) {
  const resolvedInitialStudentId =
    initialStudentId ??
    (currentUser?.role === "student" ? Number.parseInt(currentUser.id, 10) : undefined)
  const allowedViews = useMemo(() => getAllowedViews(currentUser?.role), [currentUser?.role])
  const [mainView, setMainView] = useState<MainView>(() => getDefaultView(currentUser?.role, initialView))
  const [teacherPanel, setTeacherPanel] = useState<TeacherPanel>(initialTeacherPanel)
  const [studentPanel, setStudentPanel] = useState<StudentPanel>("list")
  const [studentPage, setStudentPage] = useState<StudentPage>(initialStudentPage)
  const [activeExamOverride, setActiveExamOverride] = useState<Exam | null>(null)
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null)
  const [answers, setAnswers] = useState<Record<number, StudentAnswer>>({})
  const [studentIdInput, setStudentIdInput] = useState(resolvedInitialStudentId?.toString() ?? "")
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
  const canUseTeacherPortal = allowedViews.includes("teacher")
  const canUseStudentPortal = allowedViews.includes("student")
  const canEditStudentId = currentUser?.role !== "student"

  const activeMainView = allowedViews.includes(mainView) ? mainView : allowedViews[0] ?? "teacher"

  const dashboardQuery = useQuery({
    enabled: canUseTeacherPortal,
    queryKey: ["exam-dashboard", dashboardFilters],
    queryFn: () => getExamDashboard(dashboardFilters),
  })
  const studentExamsQuery = useQuery({
    enabled: canUseStudentPortal && hasStudentId,
    queryKey: ["student-exams", studentId],
    queryFn: () => getStudentExams(studentId),
  })
  const questionBankQuery = useQuery({ enabled: canUseTeacherPortal, queryKey: ["question-bank"], queryFn: getQuestionBank })

  const startAttemptMutation = useMutation({
    mutationFn: ({ examId, studentId }: { examId: number; studentId: number }) => startAttempt(examId, studentId),
    onSuccess: (attemptResult) => {
      setAttempt(attemptResult)
      setAnswers(Object.fromEntries(attemptResult.answers.map((answer) => [answer.questionId, answer])))
      setSelectedQuestionId((current) => current ?? getAttemptQuestions(attemptResult)[0]?.questionId ?? null)
      if (canUseStudentPortal) {
        setMainView("student")
      }
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
    mutationFn: ({ attemptId, expired = false }: { attemptId: number; expired?: boolean }) => submitAttempt(attemptId, expired),
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

  const createExamMutation = useMutation({
    mutationFn: createExam,
    onSuccess: (exam) => {
      setActiveExamOverride(exam)
      handleTeacherPanelChange("builder")
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
    createExamMutation.error ??
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
    if (!canUseTeacherPortal) {
      return
    }

    const examResult = await queryClient.fetchQuery({ queryKey: ["exam", examId], queryFn: () => getExam(examId) })
    setActiveExamOverride(examResult)
    handleTeacherPanelChange(panel)
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

  async function handleSubmitAttempt(expired = false) {
    if (!attempt) {
      return
    }

    await submitAttemptMutation.mutateAsync({ attemptId: attempt.id, expired })
  }

  function handleTeacherPanelChange(panel: TeacherPanel) {
    setTeacherPanel(panel)
    onTeacherPanelChange?.(panel)
  }

  function handleStudentPageChange(page: StudentPage) {
    setStudentPage(page)
    onStudentPageChange?.(page)
  }

  return (
    <DashboardShell
      currentUser={currentUser}
      description="Online, paper, grouped, randomized, autosaved exams"
      navItems={getExamNavigationItems({
        activeView: activeMainView,
        allowedViews,
        onSelectStudentPage: (page) => {
          setMainView("student")
          setStudentPanel("list")
          handleStudentPageChange(page)
        },
        onSelectView: setMainView,
        studentPage,
      })}
      onLogout={onLogout}
      sectionLabel="Exam Engine"
      title={viewLabels[activeMainView]}
    >
      {apiError && (
        <div className="border-b border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive lg:px-6">
          API error: {apiError instanceof Error ? apiError.message : "The exam API request failed."}
        </div>
      )}
      {teacherNotice && activeMainView === "teacher" && (
        <div className="border-b border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary lg:px-6">
          {teacherNotice}
        </div>
      )}

      <ErrorBoundary fallback={<PanelCrashFallback />}>
        {apiError && !activeExam && dashboardQuery.isError ? (
          <ApiUnavailable />
        ) : activeMainView === "teacher" && canUseTeacherPortal ? (
          <TeacherPortal
            activeExam={activeExam}
            archiveExam={(examId) => archiveExamMutation.mutate(examId)}
            createDraftExam={(classSubject?: ClassSubjectOption) => {
              const start = new Date(Date.now() + 60 * 60 * 1000)
              const end = new Date(start.getTime() + 60 * 60 * 1000)
              createExamMutation.mutate({
                title: classSubject ? `${classSubject.subject} Exam` : "Untitled Exam",
                classSubjectId: classSubject?.id ?? 0,
                subject: classSubject?.subject ?? "General",
                className: classSubject?.className ?? "Unassigned",
                teacherName: currentUser?.fullName ?? "Teacher",
                mode: "Online",
                startAtUtc: start.toISOString(),
                endAtUtc: end.toISOString(),
                maxMark: 100,
                passingMark: 50,
                instructionsMarkdown: "Write exam instructions here.",
              })
            }}
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
            setPanel={handleTeacherPanelChange}
            updateExam={(exam) => updateExamMutation.mutate(exam)}
            uploadAttachment={(examId, file) => uploadExamAttachmentMutation.mutateAsync({ examId, file })}
          />
        ) : activeMainView === "student" && canUseStudentPortal ? (
          <StudentPortal
            activeExam={activeExam}
            answers={answers}
            attempt={attempt}
            canEditStudentId={canEditStudentId}
            onSaveAnswer={handleSaveAnswer}
            onSelectQuestion={setSelectedQuestionId}
            onShowResults={handleShowResults}
            onStartExam={handleStartExam}
            onSubmitAttempt={handleSubmitAttempt}
            onUploadFile={handleUploadFile}
            page={studentPage}
            panel={studentPanel}
            questions={questions}
            selectedQuestion={selectedQuestion}
            setPanel={setStudentPanel}
            setStudentIdInput={setStudentIdInput}
            studentIdInput={studentIdInput}
            studentExams={studentExams}
          />
        ) : (
          <ApiUnavailable />
        )}
      </ErrorBoundary>
    </DashboardShell>
  )
}

function getExamNavigationItems({
  activeView,
  allowedViews,
  onSelectStudentPage,
  onSelectView,
  studentPage,
}: {
  activeView: MainView
  allowedViews: MainView[]
  onSelectStudentPage: (page: StudentPage) => void
  onSelectView: (view: MainView) => void
  studentPage: StudentPage
}): DashboardNavItem[] {
  return allowedViews.length === 1 && allowedViews[0] === "student"
    ? studentPages.map((page) => ({
        active: activeView === "student" && studentPage === page,
        icon: studentPageIcons[page],
        label: studentPageLabels[page],
        onClick: () => onSelectStudentPage(page),
      }))
    : [
        ...allowedViews
          .filter((view) => view !== "student")
          .map((view) => ({
            active: activeView === view,
            icon: viewIcons[view],
            label: viewLabels[view],
            onClick: () => onSelectView(view),
          })),
        ...(allowedViews.includes("student")
          ? studentPages.map((page) => ({
              active: activeView === "student" && studentPage === page,
              icon: studentPageIcons[page],
              label: studentPageLabels[page],
              onClick: () => onSelectStudentPage(page),
            }))
          : []),
      ]
}


export { ExamPortalPage }
