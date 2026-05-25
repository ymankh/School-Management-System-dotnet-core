import { useEffect, useMemo, useState, type ReactNode } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Mail,
  NotebookText,
  ShieldCheck,
  UserRound,
} from "lucide-react"

import type { AuthUser } from "@/modules/auth"
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
} from "@/modules/exam-engine/components/exam-engine-shared"
import { StudentPortal } from "@/modules/exam-engine/components/student-portal"
import { TeacherPortal } from "@/modules/exam-engine/components/teacher-portal"
import type { Exam, ExamAttempt, ExamDashboard, ExamQuestion, StudentAnswer } from "@/modules/exam-engine/types/exam-engine.types"
import type { MainView, StudentPage, StudentPanel, TeacherPanel } from "@/modules/exam-engine/types/exam-engine-ui.types"
import { getAttemptQuestions, getExamQuestions } from "@/modules/exam-engine/utils/exam-engine-model"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { ErrorBoundary } from "@/shared/components/error-boundary"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/shared/components/ui/sidebar"
import { TooltipProvider } from "@/shared/components/ui/tooltip"

type ExamPortalPageProps = {
  currentUser?: AuthUser
  initialStudentId?: number
  initialView?: MainView
  onLogout?: () => void
}

type DashboardShellProps = {
  activeView: MainView
  allowedViews: MainView[]
  children: ReactNode
  currentUser?: AuthUser
  onLogout?: () => void
  onSelectStudentPage: (page: StudentPage) => void
  onSelectView: (view: MainView) => void
  studentPage: StudentPage
}

const viewLabels: Record<MainView, string> = {
  admin: "Admin Portal",
  student: "Student Portal",
  teacher: "Teacher Portal",
}

const viewIcons: Record<MainView, typeof LayoutDashboard> = {
  admin: ShieldCheck,
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
  if (role === "student") {
    return ["student"]
  }

  if (role === "teacher") {
    return ["teacher"]
  }

  return ["admin", "teacher", "student"]
}

function getDefaultView(role?: AuthUser["role"], initialView: MainView = "teacher") {
  const allowedViews = getAllowedViews(role)
  return allowedViews.includes(initialView) ? initialView : allowedViews[0]
}

function ExamPortalPage({ currentUser, initialStudentId, initialView = "teacher", onLogout }: ExamPortalPageProps) {
  const allowedViews = useMemo(() => getAllowedViews(currentUser?.role), [currentUser?.role])
  const [mainView, setMainView] = useState<MainView>(() => getDefaultView(currentUser?.role, initialView))
  const [teacherPanel, setTeacherPanel] = useState<TeacherPanel>("dashboard")
  const [studentPanel, setStudentPanel] = useState<StudentPanel>("list")
  const [studentPage, setStudentPage] = useState<StudentPage>("dashboard")
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
  const canUseTeacherPortal = allowedViews.includes("teacher")
  const canUseStudentPortal = allowedViews.includes("student")
  const canEditStudentId = currentUser?.role !== "student"

  useEffect(() => {
    if (!allowedViews.includes(mainView)) {
      setMainView(allowedViews[0])
    }
  }, [allowedViews, mainView])

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
      setSelectedQuestionId((current) => current ?? attemptResult.questions[0]?.questionId ?? null)
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
    if (!canUseTeacherPortal) {
      return
    }

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
    <DashboardShell
      activeView={mainView}
      allowedViews={allowedViews}
      currentUser={currentUser}
      onLogout={onLogout}
      onSelectStudentPage={(page) => {
        setMainView("student")
        setStudentPanel("list")
        setStudentPage(page)
      }}
      onSelectView={setMainView}
      studentPage={studentPage}
    >
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
        ) : mainView === "teacher" && canUseTeacherPortal ? (
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
        ) : mainView === "student" && canUseStudentPortal ? (
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
          <AdminPortal />
        )}
      </ErrorBoundary>
    </DashboardShell>
  )
}

function DashboardShell({
  activeView,
  allowedViews,
  children,
  currentUser,
  onLogout,
  onSelectStudentPage,
  onSelectView,
  studentPage,
}: DashboardShellProps) {
  const navigationItems =
    allowedViews.length === 1 && allowedViews[0] === "student"
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
          ...(
            allowedViews.includes("student")
              ? studentPages.map((page) => ({
                  active: activeView === "student" && studentPage === page,
                  icon: studentPageIcons[page],
                  label: studentPageLabels[page],
                  onClick: () => onSelectStudentPage(page),
                }))
              : []
          ),
        ]

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={false}>
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" tooltip="EduManager">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                    <GraduationCap className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">EduManager</span>
                    <span className="truncate text-xs uppercase text-sidebar-foreground/70">Exam Engine</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            <SidebarTrigger className="ml-auto" />
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => {
                    const Icon = item.icon

                    return (
                      <SidebarMenuItem key={item.label}>
                        <SidebarMenuButton isActive={item.active} tooltip={item.label} onClick={item.onClick}>
                          <Icon className="size-4" />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          {currentUser && (
            <SidebarFooter>
              <SidebarSeparator />
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton size="lg" tooltip={currentUser.fullName}>
                    <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-accent text-sidebar-accent-foreground">
                      <UserRound className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{currentUser.fullName}</span>
                      <span className="truncate text-xs capitalize text-sidebar-foreground/70">{currentUser.role}</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Log Out" onClick={onLogout}>
                    <LogOut className="size-4" />
                    <span>Log Out</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarFooter>
          )}

          <SidebarRail />
        </Sidebar>

        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-card px-4 lg:px-6">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-lg font-semibold">{viewLabels[activeView]}</h1>
                <p className="text-xs text-muted-foreground">Online, paper, grouped, randomized, autosaved exams</p>
              </div>
            </div>
          </header>

          {children}
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}

function AdminPortal() {
  return (
    <div className="flex-1 overflow-auto p-4 lg:p-6">
      <div className="mb-5">
        <h2 className="text-2xl font-semibold">Admin Portal</h2>
        <p className="text-sm text-muted-foreground">System-level dashboards will appear here when admin modules are connected.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Administration</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          No admin modules are available yet.
        </CardContent>
      </Card>
    </div>
  )
}

export { ExamPortalPage }
