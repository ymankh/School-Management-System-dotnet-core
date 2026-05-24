import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  Archive,
  ArrowDown,
  ArrowUp,
  BookOpen,
  GripVertical,
  CheckCircle2,
  Clock,
  Copy,
  Database,
  Eye,
  FileUp,
  Flag,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  ListChecks,
  Play,
  Plus,
  Save,
  Search,
  Settings,
  Upload,
} from "lucide-react"

import {
  archiveExam,
  duplicateExam,
  getGradingAnswers,
  getExam,
  getExamDashboard,
  getQuestionBank,
  getStudentExams,
  gradeAnswer,
  publishExam,
  publishMarks,
  importQuestionsFromBank,
  saveAnswer,
  startAttempt,
  submitAttempt,
  updateExam,
  uploadExamAttachment,
  uploadAttemptFile,
} from "@/modules/exam-engine/api/exam-engine-api"
import type { ExamDashboardFilters } from "@/modules/exam-engine/api/exam-engine-api"
import { MarkdownContent } from "@/modules/exam-engine/components/markdown-content"
import type {
  Exam,
  ExamAttempt,
  ExamDashboard,
  ExamQuestion,
  ExamSummary,
  QuestionGroup,
  QuestionType,
  QuestionBankItem,
  StudentAnswer,
} from "@/modules/exam-engine/types/exam-engine.types"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Input } from "@/shared/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"
import { ErrorBoundary } from "@/shared/components/error-boundary"
import { cn } from "@/shared/lib/utils"

type MainView = "teacher" | "student"
type TeacherPanel = "dashboard" | "builder" | "bank" | "grading"
type StudentPanel = "list" | "player" | "review" | "results"

const statusTone: Record<string, string> = {
  Active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Draft: "border-slate-200 bg-slate-50 text-slate-700",
  Scheduled: "border-indigo-200 bg-indigo-50 text-indigo-700",
  Completed: "border-blue-200 bg-blue-50 text-blue-700",
  Archived: "border-zinc-200 bg-zinc-50 text-zinc-600",
}

const questionTypes: QuestionType[] = [
  "MultipleChoice",
  "TrueFalse",
  "ShortAnswer",
  "Article",
  "FileUpload",
  "Matching",
  "Ordering",
  "FillInTheBlank",
]

function ExamEnginePage() {
  const [mainView, setMainView] = useState<MainView>("teacher")
  const [teacherPanel, setTeacherPanel] = useState<TeacherPanel>("dashboard")
  const [studentPanel, setStudentPanel] = useState<StudentPanel>("list")
  const [activeExamOverride, setActiveExamOverride] = useState<Exam | null>(null)
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null)
  const [answers, setAnswers] = useState<Record<number, StudentAnswer>>({})
  const [studentIdInput, setStudentIdInput] = useState("")
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
    onSuccess: (exam) => {
      setActiveExamOverride(exam)
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
  const activeExam = activeExamOverride
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
    archiveExamMutation.error
    ?? updateExamMutation.error
    ?? importQuestionsMutation.error
    ?? uploadExamAttachmentMutation.error
    ?? publishMarksMutation.error

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
            <div className="border-b border-destructive/30 bg-red-50 px-4 py-3 text-sm text-red-800 lg:px-6">
              API error: {apiError instanceof Error ? apiError.message : "The exam API request failed."}
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

function SideButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean
  icon: typeof LayoutDashboard
  label: string
  onClick: () => void
}) {
  return (
    <button
      className={cn(
        "mb-1 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground",
        active && "border-l-4 border-primary bg-secondary text-secondary-foreground",
      )}
      type="button"
      onClick={onClick}
    >
      <Icon className="size-4" />
      {label}
    </button>
  )
}

function PanelCrashFallback() {
  return (
    <div className="m-4 rounded-lg border border-destructive/30 bg-red-50 p-4 text-sm text-red-900 lg:m-6">
      <div className="font-medium">This exam section crashed while rendering.</div>
      <p className="mt-1 text-red-800">The rest of the app is still available. Refresh after fixing the data or API response.</p>
    </div>
  )
}

function ApiUnavailable() {
  return (
    <div className="flex-1 p-4 lg:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Exam API is not running</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>The frontend is loaded, but `/api` requests are failing. Start the ASP.NET API, then refresh this page.</p>
          <p>The exam engine no longer uses frontend fallback data. Start the ASP.NET API with a migrated database, then refresh this page.</p>
        </CardContent>
      </Card>
    </div>
  )
}

function TeacherPortal({
  activeExam,
  archiveExam,
  dashboard,
  dashboardFilters,
  duplicateExam,
  importFromBank,
  openExam,
  panel,
  publishExam,
  publishMarks,
  questionBank,
  setDashboardFilters,
  setPanel,
  updateExam,
  uploadAttachment,
}: {
  activeExam: Exam | null
  archiveExam: (examId: number) => void
  dashboard: ExamDashboard | null
  dashboardFilters: Required<ExamDashboardFilters>
  duplicateExam: (examId: number) => void
  importFromBank: (examId: number, groupId: number, itemIds: number[]) => void
  openExam: (examId: number, panel: TeacherPanel) => void
  panel: TeacherPanel
  publishExam: (examId: number) => void
  publishMarks: (examId: number) => void
  questionBank: QuestionBankItem[]
  setDashboardFilters: (filters: Required<ExamDashboardFilters>) => void
  setPanel: (panel: TeacherPanel) => void
  updateExam: (exam: Exam) => void
  uploadAttachment: (examId: number, file: File) => void
}) {
  return (
    <div className="flex-1 overflow-auto p-4 lg:p-6">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Teacher Portal</h2>
          <p className="text-sm text-muted-foreground">Manage exams, reusable questions, settings, scheduling, and grading readiness.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant={panel === "dashboard" ? "default" : "outline"} size="sm" onClick={() => setPanel("dashboard")}>
            <LayoutDashboard className="size-4" />
            Dashboard
          </Button>
          <Button variant={panel === "builder" ? "default" : "outline"} size="sm" onClick={() => setPanel("builder")}>
            <Settings className="size-4" />
            Builder
          </Button>
          <Button variant={panel === "bank" ? "default" : "outline"} size="sm" onClick={() => setPanel("bank")}>
            <Database className="size-4" />
            Question Bank
          </Button>
          <Button variant={panel === "grading" ? "default" : "outline"} size="sm" onClick={() => setPanel("grading")}>
            <ListChecks className="size-4" />
            Grading
          </Button>
        </div>
      </div>

      {panel === "dashboard" && (
        <TeacherDashboard
          archiveExam={archiveExam}
          dashboard={dashboard}
          filters={dashboardFilters}
          duplicateExam={duplicateExam}
          openExam={openExam}
          publishExam={publishExam}
          setFilters={setDashboardFilters}
          setPanel={setPanel}
        />
      )}
      {panel === "builder" && activeExam && (
        <ExamBuilder
          exam={activeExam}
          importFromBank={importFromBank}
          publishExam={publishExam}
          questionBank={questionBank}
          updateExam={updateExam}
          uploadAttachment={uploadAttachment}
        />
      )}
      {panel === "bank" && activeExam && (
        <QuestionBankLibrary
          importFromBank={(itemId) => {
            const firstGroup = getExamGroups(activeExam)[0]
            if (firstGroup) {
              importFromBank(activeExam.id, firstGroup.id, [itemId])
            }
          }}
          questionBank={questionBank}
        />
      )}
      {panel === "grading" && activeExam && <TeacherGrading exam={activeExam} publishMarks={publishMarks} />}
    </div>
  )
}

function TeacherDashboard({
  archiveExam,
  dashboard,
  duplicateExam,
  filters,
  openExam,
  publishExam,
  setFilters,
  setPanel,
}: {
  archiveExam: (examId: number) => void
  dashboard: ExamDashboard | null
  duplicateExam: (examId: number) => void
  filters: Required<ExamDashboardFilters>
  openExam: (examId: number, panel: TeacherPanel) => void
  publishExam: (examId: number) => void
  setFilters: (filters: Required<ExamDashboardFilters>) => void
  setPanel: (panel: TeacherPanel) => void
}) {
  const exams = useMemo(() => dashboard?.exams ?? [], [dashboard])
  const classOptions = useMemo(() => uniqueSorted(exams.map((exam) => exam.className)), [exams])
  const subjectOptions = useMemo(() => uniqueSorted(exams.map((exam) => exam.subject)), [exams])
  const updateFilter = (key: keyof Required<ExamDashboardFilters>, value: string) => {
    setFilters({ ...filters, [key]: value })
  }
  const filteredExams = exams.filter((exam) => {
    const matchesSearch = `${exam.title} ${exam.subject} ${exam.className} ${exam.teacherName}`.toLowerCase().includes(filters.search.toLowerCase())
    const matchesStatus = filters.status === "all" || exam.status === filters.status
    const matchesClass = filters.className === "all" || exam.className === filters.className
    const matchesSubject = filters.subject === "all" || exam.subject === filters.subject
    const matchesMode = filters.mode === "all" || exam.mode === filters.mode
    const matchesDate = matchesDashboardDateFilter(exam, filters.date)
    return matchesSearch && matchesStatus && matchesClass && matchesSubject && matchesMode && matchesDate
  })

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Active Exams" value={dashboard?.activeExams ?? 0} />
        <MetricCard label="Drafts" value={dashboard?.drafts ?? 0} />
        <MetricCard label="Submissions" value={dashboard?.submissions ?? 0} />
        <MetricCard label="Average Score" value={`${dashboard?.averageScore ?? 0}%`} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle>Exam Management</CardTitle>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2 size-4 text-muted-foreground" />
                <Input className="w-64 pl-8" placeholder="Search exams..." value={filters.search} onChange={(event) => updateFilter("search", event.target.value)} />
              </div>
              <Select value={filters.status} onValueChange={(value) => updateFilter("status", value)}>
                <SelectTrigger className="w-36" size="default">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.className} onValueChange={(value) => updateFilter("className", value)}>
                <SelectTrigger className="w-44" size="default">
                  <SelectValue placeholder="All classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All classes</SelectItem>
                  {classOptions.map((className) => (
                    <SelectItem key={className} value={className}>{className}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filters.subject} onValueChange={(value) => updateFilter("subject", value)}>
                <SelectTrigger className="w-40" size="default">
                  <SelectValue placeholder="All subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All subjects</SelectItem>
                  {subjectOptions.map((subject) => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filters.date} onValueChange={(value) => updateFilter("date", value)}>
                <SelectTrigger className="w-36" size="default">
                  <SelectValue placeholder="All dates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.mode} onValueChange={(value) => updateFilter("mode", value)}>
                <SelectTrigger className="w-36" size="default">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="Online">Online</SelectItem>
                  <SelectItem value="Paper">Paper</SelectItem>
                  <SelectItem value="Mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" onClick={() => setPanel("builder")}><Plus className="size-4" /> New Exam</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-md border">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Exam Name</th>
                  <th className="px-4 py-3 font-medium">Subject</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Questions</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExams.map((exam) => (
                  <tr key={exam.id} className="border-t bg-card">
                    <td className="px-4 py-3">
                      <div className="font-medium">{exam.title}</div>
                      <div className="text-xs text-muted-foreground">{exam.className} • {formatDate(exam.startAtUtc)}</div>
                    </td>
                    <td className="px-4 py-3">{exam.subject}</td>
                    <td className="px-4 py-3">{exam.mode}</td>
                    <td className="px-4 py-3"><StatusBadge status={exam.status} /></td>
                    <td className="px-4 py-3">{exam.questionCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <IconButton title="Preview" icon={Eye} onClick={() => openExam(exam.id, "builder")} />
                        <IconButton title="Edit" icon={Settings} onClick={() => openExam(exam.id, "builder")} />
                        <IconButton title="Publish" icon={CheckCircle2} onClick={() => publishExam(exam.id)} />
                        <IconButton title="Duplicate" icon={Copy} onClick={() => duplicateExam(exam.id)} />
                        <IconButton title="Archive" icon={Archive} onClick={() => archiveExam(exam.id)} />
                        <IconButton title="Results" icon={ListChecks} onClick={() => openExam(exam.id, "grading")} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ExamBuilder({
  exam,
  importFromBank,
  publishExam,
  questionBank,
  updateExam,
  uploadAttachment,
}: {
  exam: Exam
  importFromBank: (examId: number, groupId: number, itemIds: number[]) => void
  publishExam: (examId: number) => void
  questionBank: QuestionBankItem[]
  updateExam: (exam: Exam) => void
  uploadAttachment: (examId: number, file: File) => void
}) {
  const groups = getExamGroups(exam)
  const [editableGroups, setEditableGroups] = useState<QuestionGroup[]>(groups)
  const [selectedBankItems, setSelectedBankItems] = useState<number[]>([])
  const [attachment, setAttachment] = useState<File | null>(null)

  useEffect(() => {
    setEditableGroups(groups)
  }, [exam.id, groups])

  const addGroupDraft = () => {
    const title = window.prompt("Group title")
    if (!title?.trim()) {
      return
    }

    const instructionsMarkdown = window.prompt("Group instructions Markdown") ?? ""
    const selectionPolicyInput = window.prompt("Selection policy: show-all or pick-random")
    const selectionPolicy = selectionPolicyInput === "pick-random" ? "pick-random" : "show-all"
    const questionsToShowInput = selectionPolicy === "pick-random" ? window.prompt("Questions to show") : null
    const parsedQuestionsToShow = questionsToShowInput ? Number.parseInt(questionsToShowInput, 10) : Number.NaN
    const shuffleQuestions = window.confirm("Shuffle questions in this group?")

    setEditableGroups((currentGroups) => [
      ...currentGroups,
      {
        id: -Date.now(),
        examId: exam.id,
        title: title.trim(),
        instructionsMarkdown,
        authoringOrder: currentGroups.length + 1,
        selectionPolicy,
        questionsToShow: Number.isInteger(parsedQuestionsToShow) && parsedQuestionsToShow > 0 ? parsedQuestionsToShow : null,
        shuffleQuestions,
        questions: [],
      },
    ])
  }

  const updateQuestionDraft = (groupId: number, questionId: number, patch: Partial<ExamQuestion>) => {
    setEditableGroups((currentGroups) =>
      currentGroups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              questions: getGroupQuestions(group).map((question) =>
                question.id === questionId ? { ...question, ...patch } : question,
              ),
            }
          : group,
      ),
    )
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
      <Card className="xl:sticky xl:top-20 xl:self-start">
        <CardHeader>
          <CardTitle>Groups</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {editableGroups.map((group) => (
            <div key={group.id} className="rounded-md border bg-muted/30 p-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">{group.title}</div>
                <Badge variant="secondary">{getGroupQuestions(group).length}</Badge>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {group.selectionPolicy === "pick-random" ? `Pick ${group.questionsToShow}` : "Show all"} • {group.shuffleQuestions ? "Shuffle" : "Fixed"}
              </div>
              <div className="mt-3 space-y-1">
                {getGroupQuestions(group).map((question) => (
                  <div key={question.id} className="rounded border bg-card px-2 py-1 text-xs">
                    {question.authoringOrder}. {question.type} • {question.mark} marks
                  </div>
                ))}
              </div>
            </div>
          ))}
          <Button className="w-full" variant="outline" size="sm" onClick={addGroupDraft}><Plus className="size-4" /> Add Group</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>{exam.title}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Step 1: content and questions • Step 2: settings • Step 3: review and publish</p>
            </div>
            <StatusBadge status={exam.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <section className="rounded-md border p-4">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h3 className="font-medium">Questions</h3>
                <p className="mt-1 text-sm text-muted-foreground">Edit every question for the exam from this page.</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => updateExam({ ...exam, groups: editableGroups })}><Save className="size-4" /> Save Draft</Button>
            </div>

            <div className="space-y-5">
              {editableGroups.map((group) => (
                <div key={group.id} className="rounded-md border bg-muted/20 p-3">
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h4 className="font-medium">{group.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {group.selectionPolicy === "pick-random" ? `Pick ${group.questionsToShow}` : "Show all"} • {getGroupQuestions(group).length} questions
                      </p>
                    </div>
                    <Badge variant="outline">Use Question Bank to add questions</Badge>
                  </div>

                  <div className="space-y-4">
                    {getGroupQuestions(group).map((question) => (
                      <div key={question.id} className="rounded-md border bg-card p-4">
                        <div className="mb-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_160px_120px]">
                          <div>
                            <div className="text-sm font-medium">Question {question.authoringOrder}</div>
                            <div className="text-xs text-muted-foreground">{question.difficulty} • {question.isRequired ? "Required" : "Optional"}</div>
                          </div>
                          <Select
                            value={question.type}
                            onValueChange={(value) =>
                              updateQuestionDraft(group.id, question.id, { type: value as QuestionType })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {questionTypes.map((type) => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            min={0}
                            step={0.5}
                            type="number"
                            value={question.mark}
                            onChange={(event) =>
                              updateQuestionDraft(group.id, question.id, { mark: Number(event.target.value) })
                            }
                          />
                        </div>

                        <div className="grid gap-4 lg:grid-cols-2">
                          <div>
                            <div className="mb-2 text-sm font-medium">Markdown and LaTeX Editor</div>
                            <textarea
                              className="min-h-40 w-full rounded-md border bg-background p-3 font-mono text-sm outline-none focus:ring-2 focus:ring-ring/30"
                              value={question.bodyMarkdown}
                              onChange={(event) =>
                                updateQuestionDraft(group.id, question.id, { bodyMarkdown: event.target.value })
                              }
                            />
                          </div>
                          <div>
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-sm font-medium">Live Student Preview</span>
                              <Badge variant="secondary">KaTeX enabled</Badge>
                            </div>
                            <div className="min-h-40 rounded-md border bg-background p-3">
                              <MarkdownContent content={question.bodyMarkdown} />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {getGroupQuestions(group).length === 0 && (
                      <div className="rounded-md border border-dashed bg-background p-6 text-center text-sm text-muted-foreground">
                        This group has no questions yet.
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {editableGroups.length === 0 && (
                <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Add a group before adding questions.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-md border p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-medium">Add From Question Bank</h3>
              <Button
                disabled={selectedBankItems.length === 0 || !editableGroups[0]}
                size="sm"
                onClick={() => editableGroups[0] && importFromBank(exam.id, editableGroups[0].id, selectedBankItems)}
              >
                <Database className="size-4" /> Add Selected ({selectedBankItems.length})
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {questionBank.map((item) => (
                <label key={item.id} className="flex gap-3 rounded-md border p-3 text-sm">
                  <input
                    checked={selectedBankItems.includes(item.id)}
                    type="checkbox"
                    onChange={(event) =>
                      setSelectedBankItems((current) =>
                        event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id),
                      )
                    }
                  />
                  <span>
                    <span className="block font-medium">{item.question.type} • {item.question.difficulty}</span>
                    <span className="line-clamp-2 text-muted-foreground">{item.question.bodyMarkdown}</span>
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-md border p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-medium">Exam Attachments</h3>
              <Badge variant="outline">Images, PDF, answer key</Badge>
            </div>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed p-6 text-center text-sm hover:bg-muted/50">
              <Upload className="mb-2 size-7 text-muted-foreground" />
              <span className="font-medium">{attachment ? attachment.name : "Upload exam image or attachment"}</span>
              <span className="mt-1 text-xs text-muted-foreground">Files are stored as exam attachments and can be inserted into Markdown.</span>
              <input
                className="sr-only"
                type="file"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null
                  setAttachment(file)
                  if (file) {
                    uploadAttachment(exam.id, file)
                  }
                }}
              />
            </label>
          </section>
        </CardContent>
      </Card>

      <Card className="xl:sticky xl:top-20 xl:self-start">
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <SettingRow label="Mode" value={exam.mode} />
          <SettingRow label="Date" value={formatDate(exam.startAtUtc)} />
          <SettingRow label="Duration" value={`${durationMinutes(exam.startAtUtc, exam.endAtUtc)} minutes`} />
          <SettingRow label="Total marks" value={String(exam.maxMark)} />
          <SettingRow label="Shuffle groups" value={exam.shuffleGroups ? "Enabled" : "Disabled"} />
          <SettingRow label="Focus mode" value={exam.focusModeEnabled ? "Enabled" : "Disabled"} />
          <div className="rounded-md border bg-muted/40 p-3 text-xs leading-5 text-muted-foreground">
            Publishing validates schedule, marks, group randomization, upload limits, and at least one question per visible group.
          </div>
          <Button className="w-full" onClick={() => publishExam(exam.id)}><CheckCircle2 className="size-4" /> Publish Exam</Button>
        </CardContent>
      </Card>
    </div>
  )
}

function QuestionBankLibrary({
  importFromBank,
  questionBank,
}: {
  importFromBank: (itemId: number) => void
  questionBank: QuestionBankItem[]
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle>Question Bank</CardTitle>
          <div className="relative">
            <Search className="absolute left-2.5 top-2 size-4 text-muted-foreground" />
            <Input className="w-72 pl-8" placeholder="Search questions..." />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 lg:grid-cols-3">
          {questionBank.map((item) => (
            <div key={item.id} className="rounded-md border bg-card p-4">
              <div className="mb-2 flex items-center justify-between">
                <Badge variant="secondary">{item.subject}</Badge>
                <span className="text-xs text-muted-foreground">{item.ownerName}</span>
              </div>
              <MarkdownContent content={item.question.bodyMarkdown} />
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="outline">{item.question.type}</Badge>
                <Badge variant="outline">{item.question.difficulty}</Badge>
                <Badge variant="outline">{item.question.mark} marks</Badge>
              </div>
              <Button className="mt-4 w-full" variant="outline" size="sm" onClick={() => importFromBank(item.id)}><Plus className="size-4" /> Add to Exam</Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function TeacherGrading({ exam, publishMarks }: { exam: Exam; publishMarks: (examId: number) => void }) {
  const questions = getExamQuestions(exam)
  const gradingAnswersQuery = useQuery({ queryKey: ["exam-grading", exam.id], queryFn: () => getGradingAnswers(exam.id) })
  const queryClient = useQueryClient()
  const gradeMutation = useMutation({
    mutationFn: ({ answerId, awardedMark, feedback }: { answerId: number; awardedMark: number; feedback: string }) =>
      gradeAnswer(answerId, awardedMark, feedback),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["exam-grading", exam.id] })
    },
  })
  const manualQuestions = questions.filter((question) =>
    question.type === "Article" || question.type === "FileUpload" || (question.type === "ShortAnswer" && question.gradingRule !== "exact-match"),
  )
  const gradingAnswers = gradingAnswersQuery.data ?? []

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Card>
        <CardHeader>
          <CardTitle>Manual Grading Queue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {manualQuestions.map((question, index) => {
            const answer = gradingAnswers.find((item) => item.questionId === question.id)
            return (
            <div key={question.id} className="rounded-md border p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium">Student #{index + 1} • {question.type}</div>
                  <div className="text-xs text-muted-foreground">{question.mark} max marks • {question.difficulty}</div>
                </div>
                <Badge variant="outline">NeedsManualGrading</Badge>
              </div>
              <MarkdownContent content={question.bodyMarkdown} />
              <div className="mt-4 grid gap-3 md:grid-cols-[120px_minmax(0,1fr)_auto]">
                <Input id={`mark-${question.id}`} placeholder="Mark" type="number" />
                <Input id={`feedback-${question.id}`} placeholder="Teacher feedback" />
                <Button
                  disabled={!answer}
                  size="sm"
                  onClick={() => {
                    const markInput = document.getElementById(`mark-${question.id}`) as HTMLInputElement | null
                    const feedbackInput = document.getElementById(`feedback-${question.id}`) as HTMLInputElement | null
                    if (answer) {
                      gradeMutation.mutate({
                        answerId: answer.id,
                        awardedMark: Number(markInput?.value ?? 0),
                        feedback: feedbackInput?.value ?? "",
                      })
                    }
                  }}
                >
                  Save Grade
                </Button>
              </div>
            </div>
          )})}
          {manualQuestions.length === 0 && <div className="text-sm text-muted-foreground">No manual grading items are available.</div>}
        </CardContent>
      </Card>

      <Card className="xl:sticky xl:top-20 xl:self-start">
        <CardHeader>
          <CardTitle>Publishing Checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <ChecklistItem done label="Objective questions auto-graded" />
          <ChecklistItem done={manualQuestions.length === 0} label="Manual answers reviewed" />
          <ChecklistItem done={exam.markPublished} label="Marks published to students" />
          <Button className="w-full" variant="outline" onClick={() => publishMarks(exam.id)}>Publish Marks</Button>
        </CardContent>
      </Card>
    </div>
  )
}

function ChecklistItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border p-2">
      <CheckCircle2 className={cn("size-4", done ? "text-emerald-600" : "text-muted-foreground")} />
      <span>{label}</span>
    </div>
  )
}

function StudentPortal({
  activeExam,
  answers,
  attempt,
  onSaveAnswer,
  onSelectQuestion,
  onStartExam,
  onSubmitAttempt,
  onUploadFile,
  panel,
  questions,
  selectedQuestion,
  setPanel,
  setStudentIdInput,
  studentIdInput,
  studentExams,
}: {
  activeExam: Exam | null
  answers: Record<number, StudentAnswer>
  attempt: ExamAttempt | null
  onSaveAnswer: (questionId: number, answerJson: string, flaggedForReview?: boolean) => Promise<void>
  onSelectQuestion: (questionId: number) => void
  onStartExam: (examId: number) => Promise<void>
  onSubmitAttempt: () => Promise<void>
  onUploadFile: (questionId: number, file: File) => Promise<void>
  panel: StudentPanel
  questions: ExamQuestion[]
  selectedQuestion?: ExamQuestion
  setPanel: (panel: StudentPanel) => void
  setStudentIdInput: (value: string) => void
  studentIdInput: string
  studentExams: ExamSummary[]
}) {
  return (
    <div className="flex-1 overflow-auto p-4 lg:p-6">
      {panel === "list" && (
        <StudentExamList
          exams={studentExams}
          onShowResults={() => setPanel("results")}
          onStartExam={onStartExam}
          setStudentIdInput={setStudentIdInput}
          studentIdInput={studentIdInput}
        />
      )}
      {panel === "player" && activeExam && selectedQuestion && (
        <ExamPlayer
          attempt={attempt}
          answers={answers}
          exam={activeExam}
          onSaveAnswer={onSaveAnswer}
          onSelectQuestion={onSelectQuestion}
          onShowReview={() => setPanel("review")}
          onUploadFile={onUploadFile}
          questions={questions}
          selectedQuestion={selectedQuestion}
        />
      )}
      {panel === "review" && activeExam && (
        <ReviewSubmit attempt={attempt} answers={answers} onContinue={() => setPanel("player")} onSubmit={onSubmitAttempt} questions={questions} />
      )}
      {panel === "results" && activeExam && <ResultsFeedback answers={answers} attempt={attempt} exam={activeExam} questions={questions} />}
    </div>
  )
}

function StudentExamList({
  exams,
  onShowResults,
  onStartExam,
  setStudentIdInput,
  studentIdInput,
}: {
  exams: ExamSummary[]
  onShowResults: () => void
  onStartExam: (examId: number) => Promise<void>
  setStudentIdInput: (value: string) => void
  studentIdInput: string
}) {
  const [tab, setTab] = useState<"upcoming" | "active" | "completed">("active")
  const hasStudentId = Number.isInteger(Number.parseInt(studentIdInput, 10)) && Number.parseInt(studentIdInput, 10) > 0
  const filteredExams = exams.filter((exam) => {
    if (tab === "active") {
      return exam.status === "Active"
    }

    if (tab === "completed") {
      return exam.status === "Completed"
    }

    return exam.status === "Scheduled"
  })

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold">Exams and Quizzes</h2>
        <p className="text-sm text-muted-foreground">Track upcoming, active, and completed exams.</p>
      </div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-2">
          {(["upcoming", "active", "completed"] as const).map((item) => (
            <Button key={item} variant={tab === item ? "default" : "outline"} size="sm" onClick={() => setTab(item)}>
              {item[0].toUpperCase() + item.slice(1)}
            </Button>
          ))}
        </div>
        <Input
          className="w-full lg:w-56"
          inputMode="numeric"
          placeholder="Student ID"
          value={studentIdInput}
          onChange={(event) => setStudentIdInput(event.target.value)}
        />
      </div>
      <Card>
        <CardContent className="grid gap-3 py-4 lg:grid-cols-3">
          {!hasStudentId && <div className="text-sm text-muted-foreground">Enter a student ID to load assigned exams.</div>}
          {hasStudentId && filteredExams.length === 0 && <div className="text-sm text-muted-foreground">No exams in this tab.</div>}
          {filteredExams.map((exam) => (
            <div key={`${tab}-${exam.id}`} className="rounded-md border p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{exam.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{exam.subject} • {exam.teacherName}</div>
                </div>
                <StatusBadge status={exam.status} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <span><Clock className="mr-1 inline size-3" /> {durationMinutes(exam.startAtUtc, exam.endAtUtc)} min</span>
                <span>{exam.maxMark} marks</span>
              </div>
              <Button className="mt-4 w-full" size="sm" onClick={() => exam.status === "Completed" ? onShowResults() : void onStartExam(exam.id)}>
                <Play className="size-4" />
                {exam.status === "Completed" ? (exam.markPublished ? "View Result" : "Submitted") : "Start Exam"}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function ExamPlayer({
  attempt,
  answers,
  exam,
  onSaveAnswer,
  onSelectQuestion,
  onShowReview,
  onUploadFile,
  questions,
  selectedQuestion,
}: {
  attempt: ExamAttempt | null
  answers: Record<number, StudentAnswer>
  exam: Exam
  onSaveAnswer: (questionId: number, answerJson: string, flaggedForReview?: boolean) => Promise<void>
  onSelectQuestion: (questionId: number) => void
  onShowReview: () => void
  onUploadFile: (questionId: number, file: File) => Promise<void>
  questions: ExamQuestion[]
  selectedQuestion: ExamQuestion
}) {
  const [textAnswer, setTextAnswer] = useState("")
  const answer = answers[selectedQuestion.id]
  const locked = attempt ? attempt.status !== "InProgress" : false
  const deliveredOptionOrder = attempt?.questions.find((question) => question.questionId === selectedQuestion.id)?.deliveredOptionOrder ?? []
  const selectedQuestionIndex = Math.max(
    questions.findIndex((question) => question.id === selectedQuestion.id),
    0,
  )
  const previousQuestion = questions[selectedQuestionIndex - 1]
  const nextQuestion = questions[selectedQuestionIndex + 1]
  const questionPosition = questions.length > 0 ? selectedQuestionIndex + 1 : 0
  const showManualSave = ["Article", "ShortAnswer", "FillInTheBlank"].includes(selectedQuestion.type)
  const remainingTime = formatRemainingTime(exam.endAtUtc)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-md border bg-card p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold">{exam.title}</h2>
          <p className="text-sm text-muted-foreground">{exam.teacherName} • {exam.subject}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {exam.focusModeEnabled && <Badge className="gap-1" variant="secondary"><Eye className="size-3" /> Focus Mode Active</Badge>}
          <Badge className="gap-1 border-red-200 bg-red-50 text-red-700" variant="outline"><Clock className="size-3" /> {remainingTime}</Badge>
          <Button variant="outline" size="sm" onClick={onShowReview}><ListChecks className="size-4" /> Review</Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{selectedQuestion.type} • {selectedQuestion.mark} marks</CardTitle>
              <Button
                variant="outline"
                size="sm"
                disabled={locked}
                onClick={() => void onSaveAnswer(selectedQuestion.id, answer?.answerJson ?? "{}", !answer?.flaggedForReview)}
              >
                <Flag className="size-4" />
                {answer?.flaggedForReview ? "Unflag" : "Flag"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {selectedQuestion.referenceMarkdown && (
              <div className="rounded-md border bg-muted/40 p-4">
                <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Reference Material</div>
                <MarkdownContent content={selectedQuestion.referenceMarkdown} />
              </div>
            )}

            <MarkdownContent className="text-base" content={selectedQuestion.bodyMarkdown} />

            <QuestionAnswerInput
              answer={answer}
              onChangeText={setTextAnswer}
              locked={locked}
              onSaveAnswer={onSaveAnswer}
              onUploadFile={onUploadFile}
              optionOrder={deliveredOptionOrder}
              question={selectedQuestion}
              textAnswer={textAnswer}
            />

            <div className="flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
              <span>Autosave: {answer ? `saved ${formatTime(answer.savedAtUtc)}` : "not saved yet"}</span>
              {showManualSave && (
                <Button disabled={locked} size="sm" onClick={() => void onSaveAnswer(selectedQuestion.id, JSON.stringify({ value: textAnswer }), answer?.flaggedForReview)}>
                  <Save className="size-4" />
                  Save Answer
                </Button>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <Button
                disabled={!previousQuestion}
                type="button"
                variant="outline"
                onClick={() => previousQuestion && onSelectQuestion(previousQuestion.id)}
              >
                <ChevronLeft className="size-4" />
                Back
              </Button>
              <span className="text-center text-xs font-medium text-muted-foreground">
                Question {questionPosition} of {questions.length}
              </span>
              {nextQuestion ? (
                <Button type="button" onClick={() => onSelectQuestion(nextQuestion.id)}>
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              ) : (
                <Button type="button" onClick={onShowReview}>
                  Review
                  <ListChecks className="size-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <QuestionMap answers={answers} onSelectQuestion={onSelectQuestion} questions={questions} selectedQuestionId={selectedQuestion.id} />
      </div>
    </div>
  )
}

function QuestionAnswerInput({
  answer,
  locked,
  onChangeText,
  onSaveAnswer,
  onUploadFile,
  optionOrder,
  question,
  textAnswer,
}: {
  answer?: StudentAnswer
  locked: boolean
  onChangeText: (value: string) => void
  onSaveAnswer: (questionId: number, answerJson: string, flaggedForReview?: boolean) => Promise<void>
  onUploadFile: (questionId: number, file: File) => Promise<void>
  optionOrder: number[]
  question: ExamQuestion
  textAnswer: string
}) {
  const parsedAnswer = parseAnswer(answer?.answerJson)
  const [uploadState, setUploadState] = useState<"empty" | "uploading" | "uploaded" | "failed" | "removed">("empty")
  const [matchingAnswers, setMatchingAnswers] = useState<Record<number, string>>(() => parsedAnswer?.pairs ?? {})
  const [orderingAnswer, setOrderingAnswer] = useState<string[]>(() => getOrderingAnswer(question, parsedAnswer))
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  useEffect(() => {
    setMatchingAnswers(parsedAnswer?.pairs ?? {})
    setOrderingAnswer(getOrderingAnswer(question, parsedAnswer))
  }, [question.id, answer?.answerJson])

  if (question.type === "MultipleChoice") {
    const orderedOptions = optionOrder.length > 0
      ? optionOrder
          .map((optionId) => getQuestionOptions(question).find((option) => option.id === optionId))
          .filter((option): option is ExamQuestion["options"][number] => Boolean(option))
      : getQuestionOptions(question)

    return (
      <div className="space-y-2">
        {orderedOptions.map((option) => {
          const selected = parsedAnswer?.selectedOptionId === option.id

          return (
            <button
              key={option.id}
              aria-pressed={selected}
              className={cn(
                "flex w-full items-center gap-3 rounded-md border p-3 text-left text-sm transition hover:bg-muted",
                selected && "border-primary bg-primary/10 ring-2 ring-ring ring-offset-2 ring-offset-background",
              )}
              disabled={locked}
              type="button"
              onClick={() => void onSaveAnswer(question.id, JSON.stringify({ selectedOptionId: option.id }), answer?.flaggedForReview)}
            >
              <span
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center rounded-full border",
                  selected && "border-primary bg-primary text-primary-foreground",
                )}
              >
                {selected && <CheckCircle2 className="size-3" />}
              </span>
              <MarkdownContent content={option.textMarkdown} />
            </button>
          )
        })}
      </div>
    )
  }

  if (question.type === "TrueFalse") {
    return (
      <div className="flex gap-2">
        {[true, false].map((value) => {
          const selected = parsedAnswer?.value === value

          return (
            <Button
              key={String(value)}
              aria-pressed={selected}
              className={cn(
                "min-w-24 justify-center",
                selected && "ring-2 ring-ring ring-offset-2 ring-offset-background",
              )}
              disabled={locked}
              variant={selected ? "default" : "outline"}
              onClick={() => void onSaveAnswer(question.id, JSON.stringify({ value }), answer?.flaggedForReview)}
            >
              {selected && <CheckCircle2 className="size-4" />}
              {value ? "True" : "False"}
            </Button>
          )
        })}
      </div>
    )
  }

  if (question.type === "FileUpload") {
    const acceptedTypes = question.fileUploadRule?.acceptedContentTypes ?? []
    const maxSizeBytes = question.fileUploadRule?.maxSizeBytes ?? 0
    const acceptExtensions = acceptedTypes.join(",")
    const canUpload = acceptedTypes.length > 0 && maxSizeBytes > 0

    return (
      <div className="rounded-md border border-dashed p-6 text-center">
        <Upload className="mx-auto mb-2 size-8 text-muted-foreground" />
        <div className="font-medium">Drag and drop files here or browse</div>
        <div className="mt-1 text-xs text-muted-foreground">
          {canUpload
            ? `Accepted: ${acceptedTypes.join(", ")} • Max ${Math.round(maxSizeBytes / 1024 / 1024)}MB`
            : "Upload rules are not configured for this question."}
        </div>
        <label className="mt-4 inline-flex h-8 cursor-pointer items-center justify-center gap-2 rounded-lg border border-input px-3 text-sm font-medium hover:bg-muted">
          <FileUp className="size-4" />
          Choose File
          <input
            accept={acceptExtensions}
            className="sr-only"
            disabled={locked || !canUpload}
            type="file"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (!file) {
                return
              }

              if (!acceptedTypes.includes(file.type) || file.size > maxSizeBytes) {
                setUploadState("failed")
                return
              }

              setUploadState("uploading")
              void onUploadFile(question.id, file)
                .then(() => setUploadState("uploaded"))
                .catch(() => setUploadState("failed"))
            }}
          />
        </label>
        <div className="mt-4 rounded-md border bg-muted/40 p-3 text-left text-xs">
          <div className="font-medium">Upload state: {parsedAnswer?.state ?? uploadState}</div>
          {parsedAnswer?.fileName && <div className="mt-1 text-muted-foreground">Current file: {parsedAnswer.fileName}</div>}
          {uploadState === "failed" && <div className="mt-1 text-destructive">Upload failed. Select the file again.</div>}
          {parsedAnswer?.fileName && (
              <Button
                className="mt-3"
                disabled={locked}
                size="sm"
              variant="outline"
              onClick={() => {
                setUploadState("removed")
                void onSaveAnswer(question.id, JSON.stringify({ state: "removed" }), answer?.flaggedForReview)
              }}
            >
              Remove File
            </Button>
          )}
        </div>
      </div>
    )
  }

  if (question.type === "Matching") {
    const matchPairs = getMatchPairs(question)
    const rightValues = matchPairs.map((pair) => pair.rightMarkdown)

    return (
      <div className="space-y-3">
        {matchPairs.map((pair) => (
          <div key={pair.id} className="grid gap-3 rounded-md border p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <MarkdownContent content={pair.leftMarkdown} />
            <Select
              disabled={locked}
              value={matchingAnswers[pair.id] ?? ""}
              onValueChange={(value) => {
                const next = { ...matchingAnswers, [pair.id]: value }
                setMatchingAnswers(next)
                void onSaveAnswer(question.id, JSON.stringify({ pairs: next }), answer?.flaggedForReview)
              }}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Choose match..." />
              </SelectTrigger>
              <SelectContent>
                {rightValues.map((value) => (
                  <SelectItem key={`${pair.id}-${value}`} value={value}>
                    {value.replaceAll("`", "")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    )
  }

  if (question.type === "Ordering") {
    function saveOrderingAnswer(next: string[]) {
      setOrderingAnswer(next)
      void onSaveAnswer(question.id, JSON.stringify({ items: next }), answer?.flaggedForReview)
    }

    function handleOrderingDragEnd(event: DragEndEvent) {
      const { active, over } = event
      if (!over || active.id === over.id) {
        return
      }

      const oldIndex = orderingAnswer.indexOf(String(active.id))
      const newIndex = orderingAnswer.indexOf(String(over.id))
      if (oldIndex < 0 || newIndex < 0) {
        return
      }

      const next = arrayMove(orderingAnswer, oldIndex, newIndex)
      saveOrderingAnswer(next)
    }

    function moveOrderingItem(index: number, direction: -1 | 1) {
      const targetIndex = index + direction
      if (targetIndex < 0 || targetIndex >= orderingAnswer.length) {
        return
      }

      saveOrderingAnswer(arrayMove(orderingAnswer, index, targetIndex))
    }

    return (
      <DndContext
        collisionDetection={closestCenter}
        sensors={sensors}
        onDragEnd={handleOrderingDragEnd}
      >
        <SortableContext items={orderingAnswer} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {orderingAnswer.map((item, index) => (
              <SortableOrderingItem
                key={item}
                disabled={locked}
                index={index}
                item={item}
                itemCount={orderingAnswer.length}
                onMove={moveOrderingItem}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    )
  }

  if (question.type === "FillInTheBlank") {
    return (
      <Input
        placeholder="Type the missing value..."
        disabled={locked}
        value={textAnswer}
        onBlur={() => void onSaveAnswer(question.id, JSON.stringify({ value: textAnswer }), answer?.flaggedForReview)}
        onChange={(event) => onChangeText(event.target.value)}
      />
    )
  }

  return (
    <textarea
      className="min-h-48 w-full rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
      disabled={locked}
      placeholder="Type your answer..."
      value={textAnswer}
      onBlur={() => void onSaveAnswer(question.id, JSON.stringify({ value: textAnswer }), answer?.flaggedForReview)}
      onChange={(event) => onChangeText(event.target.value)}
    />
  )
}

function QuestionMap({
  answers,
  onSelectQuestion,
  questions,
  selectedQuestionId,
}: {
  answers: Record<number, StudentAnswer>
  onSelectQuestion: (questionId: number) => void
  questions: ExamQuestion[]
  selectedQuestionId: number
}) {
  const answered = questions.filter((question) => answers[question.id]).length
  const flagged = questions.filter((question) => answers[question.id]?.flaggedForReview).length

  return (
    <Card className="xl:sticky xl:top-20 xl:self-start">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Question Map</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-md border px-2 py-1.5"><div className="font-semibold leading-none">{answered}</div><div className="mt-1 text-muted-foreground">Answered</div></div>
          <div className="rounded-md border px-2 py-1.5"><div className="font-semibold leading-none">{flagged}</div><div className="mt-1 text-muted-foreground">Flagged</div></div>
          <div className="rounded-md border px-2 py-1.5"><div className="font-semibold leading-none">{questions.length - answered}</div><div className="mt-1 text-muted-foreground">Open</div></div>
        </div>
        <div className="flex flex-wrap gap-2">
          {questions.map((question, index) => (
            <button
              key={question.id}
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-md border text-sm font-medium transition hover:bg-muted sm:size-11 xl:size-10",
                answers[question.id] && "bg-primary text-primary-foreground",
                answers[question.id]?.flaggedForReview && "bg-amber-100 text-amber-900",
                selectedQuestionId === question.id && "ring-2 ring-ring",
              )}
              type="button"
              onClick={() => onSelectQuestion(question.id)}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function SortableOrderingItem({
  disabled,
  index,
  item,
  itemCount,
  onMove,
}: {
  disabled: boolean
  index: number
  item: string
  itemCount: number
  onMove: (index: number, direction: -1 | 1) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item, disabled })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      className={cn("grid grid-cols-[2rem_minmax(0,1fr)] items-center gap-3", isDragging && "relative z-10 opacity-80")}
      style={style}
    >
      <span className="flex size-8 items-center justify-center rounded-full bg-muted font-mono text-xs font-medium text-muted-foreground">
        {index + 1}
      </span>
      <div
        className={cn(
          "flex items-center gap-3 rounded-md border bg-card p-3 text-sm shadow-sm",
          isDragging && "ring-2 ring-ring",
        )}
      >
        <button
          aria-label={`Drag to reorder ${item}`}
          className="flex size-8 shrink-0 cursor-grab items-center justify-center rounded-md border text-muted-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled}
          type="button"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
        <span className="min-w-0 flex-1">{item}</span>
        <div className="flex shrink-0 gap-1">
          <Button
            aria-label={`Move ${item} up`}
            disabled={disabled || index === 0}
            size="sm"
            type="button"
            variant="outline"
            onClick={() => onMove(index, -1)}
          >
            <ArrowUp className="size-4" />
          </Button>
          <Button
            aria-label={`Move ${item} down`}
            disabled={disabled || index === itemCount - 1}
            size="sm"
            type="button"
            variant="outline"
            onClick={() => onMove(index, 1)}
          >
            <ArrowDown className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function ReviewSubmit({
  attempt,
  answers,
  onContinue,
  onSubmit,
  questions,
}: {
  attempt: ExamAttempt | null
  answers: Record<number, StudentAnswer>
  onContinue: () => void
  onSubmit: () => Promise<void>
  questions: ExamQuestion[]
}) {
  const [confirmed, setConfirmed] = useState(false)
  const locked = attempt ? attempt.status !== "InProgress" : false
  const answered = questions.filter((question) => answers[question.id])
  const flagged = questions.filter((question) => answers[question.id]?.flaggedForReview)
  const unanswered = questions.filter((question) => !answers[question.id])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Your Exam</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-3">
          <MetricCard label="Answered" value={answered.length} />
          <MetricCard label="Flagged" value={flagged.length} />
          <MetricCard label="Unanswered" value={unanswered.length} />
        </div>
        <div className="space-y-2">
          {questions.map((question, index) => (
            <div key={question.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
              <span>Question {index + 1} • {question.type}</span>
              <Badge className={answers[question.id]?.flaggedForReview ? "border-amber-200 bg-amber-50 text-amber-800" : ""} variant="outline">
                {answers[question.id]?.flaggedForReview ? "Flagged for Review" : answers[question.id] ? "Answered" : "Unanswered"}
              </Badge>
            </div>
          ))}
        </div>
        <label className="flex items-start gap-3 rounded-md border bg-muted/40 p-3 text-sm">
          <input className="mt-1" checked={confirmed} type="checkbox" onChange={(event) => setConfirmed(event.target.checked)} />
          <span>
            <span className="block font-medium">I understand this is the final submission.</span>
            <span className="text-muted-foreground">After submitting, answers are locked and unanswered questions are submitted blank.</span>
          </span>
        </label>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onContinue}>Continue Reviewing</Button>
          <Button disabled={!confirmed || locked} onClick={() => void onSubmit()}>Submit Final Exam</Button>
        </div>
      </CardContent>
    </Card>
  )
}

function ResultsFeedback({
  answers,
  attempt,
  exam,
  questions,
}: {
  answers: Record<number, StudentAnswer>
  attempt: ExamAttempt | null
  exam: Exam
  questions: ExamQuestion[]
}) {
  const completedAt = attempt?.submittedAtUtc ? formatDate(attempt.submittedAtUtc) : "Not submitted"
  const timeTaken = attempt?.submittedAtUtc
    ? `${durationMinutes(attempt.startedAtUtc, attempt.submittedAtUtc)} minutes`
    : "In progress"
  const feedbackItems = questions
    .map((question) => answers[question.id]?.teacherFeedback)
    .filter((feedback): feedback is string => Boolean(feedback?.trim()))

  if (!exam.markPublished) {
    return (
      <Card>
        <CardContent className="py-8">
          <h2 className="text-2xl font-semibold">Exam Submitted</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your attempt has been submitted and locked. Scores, feedback, and question breakdown will appear after the teacher publishes marks.
          </p>
          <div className="mt-4 rounded-md border bg-muted/40 p-4 text-sm">
            Status: {attempt?.status ?? "Submitted"}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="grid gap-4 py-6 md:grid-cols-[220px_minmax(0,1fr)]">
          <div className="rounded-md bg-primary p-5 text-primary-foreground">
            <div className="text-xs uppercase tracking-wide opacity-80">Total Score</div>
            <div className="mt-2 text-4xl font-semibold">{attempt?.totalMark ?? 0}/{exam.maxMark}</div>
          </div>
          <div>
            <h2 className="text-2xl font-semibold">{exam.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">Time taken: {timeTaken} • Completed: {completedAt}</p>
            <div className="mt-4 rounded-md border bg-muted/40 p-4">
              <div className="mb-1 font-medium">Teacher Feedback</div>
              {feedbackItems.length > 0 ? (
                <div className="space-y-1 text-sm text-muted-foreground">
                  {feedbackItems.map((feedback, index) => <p key={`${feedback}-${index}`}>{feedback}</p>)}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No teacher feedback has been published for this attempt.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Question Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {questions.map((question, index) => (
            <div key={question.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
              <span>Q{index + 1}: {question.type} • {question.mark} marks</span>
              <Badge variant="outline">{answers[question.id]?.gradingStatus ?? "NeedsManualGrading"}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="mt-1 text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: string }) {
  return <Badge className={cn("border", statusTone[status])} variant="outline">{status}</Badge>
}

function IconButton({ icon: Icon, onClick, title }: { icon: typeof Eye; onClick?: () => void; title: string }) {
  return (
    <Button title={title} variant="ghost" size="icon" onClick={onClick}>
      <Icon className="size-4" />
    </Button>
  )
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b pb-2 last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
}

function matchesDashboardDateFilter(exam: ExamSummary, filter: string) {
  if (filter === "all") {
    return true
  }

  const today = utcDateKey(new Date().toISOString())
  const start = utcDateKey(exam.startAtUtc)
  const end = utcDateKey(exam.endAtUtc)

  if (filter === "today") {
    return start === today
  }

  if (filter === "upcoming") {
    return start > today
  }

  if (filter === "past") {
    return end < today
  }

  return true
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((left, right) => left.localeCompare(right))
}

function utcDateKey(value: string) {
  return new Date(value).toISOString().slice(0, 10)
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(new Date(value))
}

function durationMinutes(start: string, end: string) {
  return Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000))
}

function formatRemainingTime(end: string) {
  const remainingMs = Math.max(0, new Date(end).getTime() - Date.now())
  const totalSeconds = Math.floor(remainingMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")} remaining`
}

function getExamGroups(exam?: Exam | null) {
  return Array.isArray(exam?.groups) ? exam.groups : []
}

function getGroupQuestions(group?: Exam["groups"][number]) {
  return Array.isArray(group?.questions) ? group.questions : []
}

function getExamQuestions(exam?: Exam | null) {
  return getExamGroups(exam).flatMap((group) => getGroupQuestions(group))
}

function getAttemptQuestions(attempt?: ExamAttempt | null) {
  return Array.isArray(attempt?.questions) ? attempt.questions : []
}

function getQuestionOptions(question: ExamQuestion) {
  return Array.isArray(question.options) ? question.options : []
}

function getMatchPairs(question: ExamQuestion) {
  return Array.isArray(question.matchPairs) ? question.matchPairs : []
}

function getOrderingItems(question: ExamQuestion) {
  return Array.isArray(question.orderingItems) ? question.orderingItems : []
}

function getOrderingAnswer(question: ExamQuestion, answer: ParsedAnswer | null) {
  return Array.isArray(answer?.items) && answer.items.length > 0 ? answer.items : getOrderingItems(question)
}

type ParsedAnswer = {
  fileName?: string
  items?: string[]
  pairs?: Record<number, string>
  selectedOptionId?: number
  state?: string
  value?: boolean | string
}

function parseAnswer(answerJson?: string) {
  if (!answerJson) {
    return null
  }

  try {
    return JSON.parse(answerJson) as ParsedAnswer
  } catch {
    return null
  }
}

export { ExamEnginePage }
