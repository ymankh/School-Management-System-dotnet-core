import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Archive,
  BookOpen,
  CheckCircle2,
  Clock,
  Copy,
  Database,
  Eye,
  FileUp,
  Flag,
  GraduationCap,
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
  addQuestionGroup,
  archiveExam,
  duplicateExam,
  getExam,
  getExamDashboard,
  getQuestionBank,
  getStudentExams,
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
import { MarkdownContent } from "@/modules/exam-engine/components/markdown-content"
import type {
  Exam,
  ExamAttempt,
  ExamDashboard,
  ExamQuestion,
  ExamSummary,
  QuestionBankItem,
  StudentAnswer,
} from "@/modules/exam-engine/types/exam-engine.types"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Input } from "@/shared/components/ui/input"
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

function ExamEnginePage() {
  const [mainView, setMainView] = useState<MainView>("teacher")
  const [teacherPanel, setTeacherPanel] = useState<TeacherPanel>("dashboard")
  const [studentPanel, setStudentPanel] = useState<StudentPanel>("list")
  const [activeExamOverride, setActiveExamOverride] = useState<Exam | null>(null)
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null)
  const [answers, setAnswers] = useState<Record<number, StudentAnswer>>({})
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null)
  const queryClient = useQueryClient()

  const dashboardQuery = useQuery({ queryKey: ["exam-dashboard"], queryFn: getExamDashboard })
  const studentExamsQuery = useQuery({ queryKey: ["student-exams"], queryFn: getStudentExams })
  const questionBankQuery = useQuery({ queryKey: ["question-bank"], queryFn: getQuestionBank })
  const activeExamQuery = useQuery({ queryKey: ["exam", 1], queryFn: () => getExam(1) })

  const startAttemptMutation = useMutation({
    mutationFn: startAttempt,
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

  const addQuestionGroupMutation = useMutation({
    mutationFn: addQuestionGroup,
    onSuccess: () => {
      if (activeExam) {
        void queryClient.invalidateQueries({ queryKey: ["exam", activeExam.id] })
      }
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
  const activeExam = activeExamOverride ?? activeExamQuery.data ?? null
  const apiError =
    dashboardQuery.error ??
    studentExamsQuery.error ??
    questionBankQuery.error ??
    activeExamQuery.error ??
    startAttemptMutation.error ??
    saveAnswerMutation.error ??
    uploadFileMutation.error ??
    submitAttemptMutation.error ??
    publishExamMutation.error ??
    duplicateExamMutation.error ??
    archiveExamMutation.error
    ?? updateExamMutation.error
    ?? addQuestionGroupMutation.error
    ?? importQuestionsMutation.error
    ?? uploadExamAttachmentMutation.error
    ?? publishMarksMutation.error

  const questions = useMemo(() => {
    const authoredQuestions = activeExam?.groups.flatMap((group) => group.questions) ?? []
    if (!attempt) {
      return authoredQuestions
    }

    const byId = new Map(authoredQuestions.map((question) => [question.id, question]))
    return attempt.questions
      .slice()
      .sort((left, right) => left.deliveredOrder - right.deliveredOrder)
      .map((attemptQuestion) => byId.get(attemptQuestion.questionId))
      .filter((question): question is ExamQuestion => Boolean(question))
  }, [activeExam, attempt])
  const selectedQuestion = questions.find((question) => question.id === selectedQuestionId) ?? questions[0]

  async function handleStartExam(examId: number) {
    const examResult = await queryClient.fetchQuery({ queryKey: ["exam", examId], queryFn: () => getExam(examId) })
    setActiveExamOverride(examResult)
    setSelectedQuestionId(examResult.groups[0]?.questions[0]?.id ?? null)
    startAttemptMutation.mutate(examId)
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

          {mainView === "teacher" ? (
            <TeacherPortal
              activeExam={activeExam}
              addGroup={(examId) => addQuestionGroupMutation.mutate(examId)}
              archiveExam={(examId) => archiveExamMutation.mutate(examId)}
              dashboard={dashboard}
              duplicateExam={(examId) => duplicateExamMutation.mutate(examId)}
              importFromBank={(examId, groupId, itemIds) => importQuestionsMutation.mutate({ examId, groupId, itemIds })}
              panel={teacherPanel}
              publishExam={(examId) => publishExamMutation.mutate(examId)}
              publishMarks={(examId) => publishMarksMutation.mutate(examId)}
              questionBank={questionBank}
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
              studentExams={studentExams}
            />
          )}
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

function TeacherPortal({
  activeExam,
  addGroup,
  archiveExam,
  dashboard,
  duplicateExam,
  importFromBank,
  panel,
  publishExam,
  publishMarks,
  questionBank,
  setPanel,
  updateExam,
  uploadAttachment,
}: {
  activeExam: Exam | null
  addGroup: (examId: number) => void
  archiveExam: (examId: number) => void
  dashboard: ExamDashboard | null
  duplicateExam: (examId: number) => void
  importFromBank: (examId: number, groupId: number, itemIds: number[]) => void
  panel: TeacherPanel
  publishExam: (examId: number) => void
  publishMarks: (examId: number) => void
  questionBank: QuestionBankItem[]
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
          duplicateExam={duplicateExam}
          editExam={() => setPanel("builder")}
          publishExam={publishExam}
          setPanel={setPanel}
        />
      )}
      {panel === "builder" && activeExam && (
        <ExamBuilder
          addGroup={addGroup}
          exam={activeExam}
          importFromBank={importFromBank}
          publishExam={publishExam}
          questionBank={questionBank}
          updateExam={updateExam}
          uploadAttachment={uploadAttachment}
        />
      )}
      {panel === "bank" && <QuestionBankLibrary questionBank={questionBank} />}
      {panel === "grading" && activeExam && <TeacherGrading exam={activeExam} publishMarks={publishMarks} />}
    </div>
  )
}

function TeacherDashboard({
  archiveExam,
  dashboard,
  duplicateExam,
  editExam,
  publishExam,
  setPanel,
}: {
  archiveExam: (examId: number) => void
  dashboard: ExamDashboard | null
  duplicateExam: (examId: number) => void
  editExam: (examId: number) => void
  publishExam: (examId: number) => void
  setPanel: (panel: TeacherPanel) => void
}) {
  const exams = dashboard?.exams ?? []
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<string>("all")
  const filteredExams = exams.filter((exam) => {
    const matchesSearch = `${exam.title} ${exam.subject} ${exam.className}`.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = status === "all" || exam.status === status
    return matchesSearch && matchesStatus
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
                <Input className="w-64 pl-8" placeholder="Search exams..." value={search} onChange={(event) => setSearch(event.target.value)} />
              </div>
              <select className="h-8 rounded-md border bg-background px-2 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="all">All statuses</option>
                <option value="Draft">Draft</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Archived">Archived</option>
              </select>
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
                    <td className="px-4 py-3"><StatusBadge status={exam.status} /></td>
                    <td className="px-4 py-3">{exam.questionCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <IconButton title="Preview" icon={Eye} />
                        <IconButton title="Edit" icon={Settings} onClick={() => editExam(exam.id)} />
                        <IconButton title="Publish" icon={CheckCircle2} onClick={() => publishExam(exam.id)} />
                        <IconButton title="Duplicate" icon={Copy} onClick={() => duplicateExam(exam.id)} />
                        <IconButton title="Archive" icon={Archive} onClick={() => archiveExam(exam.id)} />
                        <IconButton title="Results" icon={ListChecks} onClick={() => setPanel("grading")} />
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
  addGroup,
  exam,
  importFromBank,
  publishExam,
  questionBank,
  updateExam,
  uploadAttachment,
}: {
  addGroup: (examId: number) => void
  exam: Exam
  importFromBank: (examId: number, groupId: number, itemIds: number[]) => void
  publishExam: (examId: number) => void
  questionBank: QuestionBankItem[]
  updateExam: (exam: Exam) => void
  uploadAttachment: (examId: number, file: File) => void
}) {
  const firstQuestion = exam.groups[0]?.questions[0]
  const [selectedBankItems, setSelectedBankItems] = useState<number[]>([])
  const [attachment, setAttachment] = useState<File | null>(null)

  return (
    <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
      <Card className="xl:sticky xl:top-20 xl:self-start">
        <CardHeader>
          <CardTitle>Groups</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {exam.groups.map((group) => (
            <div key={group.id} className="rounded-md border bg-muted/30 p-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">{group.title}</div>
                <Badge variant="secondary">{group.questions.length}</Badge>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {group.selectionPolicy === "pick-random" ? `Pick ${group.questionsToShow}` : "Show all"} • {group.shuffleQuestions ? "Shuffle" : "Fixed"}
              </div>
              <div className="mt-3 space-y-1">
                {group.questions.map((question) => (
                  <div key={question.id} className="rounded border bg-card px-2 py-1 text-xs">
                    {question.authoringOrder}. {question.type} • {question.mark} marks
                  </div>
                ))}
              </div>
            </div>
          ))}
          <Button className="w-full" variant="outline" size="sm" onClick={() => addGroup(exam.id)}><Plus className="size-4" /> Add Group</Button>
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
              <h3 className="font-medium">Markdown and LaTeX Editor</h3>
              <Button variant="outline" size="sm" onClick={() => updateExam(exam)}><Save className="size-4" /> Save Draft</Button>
            </div>
            <textarea
              className="min-h-32 w-full rounded-md border bg-background p-3 font-mono text-sm outline-none focus:ring-2 focus:ring-ring/30"
              defaultValue={`${firstQuestion?.bodyMarkdown ?? ""}\n\nBlock math example:\n$$\nx = {-b \\pm \\sqrt{b^2-4ac} \\over 2a}\n$$`}
            />
          </section>

          <section className="rounded-md border p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-medium">Live Student Preview</h3>
              <Badge variant="secondary">KaTeX enabled</Badge>
            </div>
            <MarkdownContent content={`${firstQuestion?.bodyMarkdown ?? ""}\n\n$$\nx = {-b \\pm \\sqrt{b^2-4ac} \\over 2a}\n$$`} />
          </section>

          <section className="rounded-md border p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-medium">Add From Question Bank</h3>
              <Button
                disabled={selectedBankItems.length === 0 || !exam.groups[0]}
                size="sm"
                onClick={() => exam.groups[0] && importFromBank(exam.id, exam.groups[0].id, selectedBankItems)}
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

function QuestionBankLibrary({ questionBank }: { questionBank: QuestionBankItem[] }) {
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
              <Button className="mt-4 w-full" variant="outline" size="sm"><Plus className="size-4" /> Add to Exam</Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function TeacherGrading({ exam, publishMarks }: { exam: Exam; publishMarks: (examId: number) => void }) {
  const questions = exam.groups.flatMap((group) => group.questions)
  const manualQuestions = questions.filter((question) =>
    question.type === "Article" || question.type === "FileUpload" || (question.type === "ShortAnswer" && question.gradingRule !== "exact-match"),
  )

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Card>
        <CardHeader>
          <CardTitle>Manual Grading Queue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {manualQuestions.map((question, index) => (
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
                <Input placeholder="Mark" type="number" />
                <Input placeholder="Teacher feedback" />
                <Button size="sm">Save Grade</Button>
              </div>
            </div>
          ))}
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
  studentExams: ExamSummary[]
}) {
  return (
    <div className="flex-1 overflow-auto p-4 lg:p-6">
      {panel === "list" && <StudentExamList exams={studentExams} onShowResults={() => setPanel("results")} onStartExam={onStartExam} />}
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
}: {
  exams: ExamSummary[]
  onShowResults: () => void
  onStartExam: (examId: number) => Promise<void>
}) {
  const [tab, setTab] = useState<"upcoming" | "active" | "completed">("active")
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
      <div className="flex gap-2">
        {(["upcoming", "active", "completed"] as const).map((item) => (
          <Button key={item} variant={tab === item ? "default" : "outline"} size="sm" onClick={() => setTab(item)}>
            {item[0].toUpperCase() + item.slice(1)}
          </Button>
        ))}
      </div>
      <Card>
        <CardContent className="grid gap-3 py-4 lg:grid-cols-3">
          {filteredExams.length === 0 && <div className="text-sm text-muted-foreground">No exams in this tab.</div>}
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-md border bg-card p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold">{exam.title}</h2>
          <p className="text-sm text-muted-foreground">{exam.teacherName} • {exam.subject}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {exam.focusModeEnabled && <Badge className="gap-1" variant="secondary"><Eye className="size-3" /> Focus Mode Active</Badge>}
          <Badge className="gap-1 border-red-200 bg-red-50 text-red-700" variant="outline"><Clock className="size-3" /> 01:14:22 remaining</Badge>
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
              <Button disabled={locked} size="sm" onClick={() => void onSaveAnswer(selectedQuestion.id, JSON.stringify({ value: textAnswer }), answer?.flaggedForReview)}>
                <Save className="size-4" />
                Save Answer
              </Button>
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
  const [uploadState, setUploadState] = useState<"empty" | "uploading" | "uploaded" | "failed" | "removed">("empty")
  const [matchingAnswers, setMatchingAnswers] = useState<Record<number, string>>({})
  const [orderingAnswer, setOrderingAnswer] = useState<string[]>(question.orderingItems)
  const parsedAnswer = parseAnswer(answer?.answerJson)

  if (question.type === "MultipleChoice") {
    const orderedOptions = optionOrder.length > 0
      ? optionOrder
          .map((optionId) => question.options.find((option) => option.id === optionId))
          .filter((option): option is ExamQuestion["options"][number] => Boolean(option))
      : question.options

    return (
      <div className="space-y-2">
        {orderedOptions.map((option) => (
          <button
            key={option.id}
            className="flex w-full items-center gap-3 rounded-md border p-3 text-left text-sm transition hover:bg-muted"
            disabled={locked}
            type="button"
            onClick={() => void onSaveAnswer(question.id, JSON.stringify({ selectedOptionId: option.id }), answer?.flaggedForReview)}
          >
            <span className="size-3 rounded-full border" />
            <MarkdownContent content={option.textMarkdown} />
          </button>
        ))}
      </div>
    )
  }

  if (question.type === "TrueFalse") {
    return (
      <div className="flex gap-2">
        {[true, false].map((value) => (
          <Button key={String(value)} disabled={locked} variant="outline" onClick={() => void onSaveAnswer(question.id, JSON.stringify({ value }), answer?.flaggedForReview)}>
            {String(value)}
          </Button>
        ))}
      </div>
    )
  }

  if (question.type === "FileUpload") {
    const acceptedTypes = question.fileUploadRule?.acceptedContentTypes ?? ["image/jpeg", "image/png", "application/pdf"]
    const maxSizeBytes = question.fileUploadRule?.maxSizeBytes ?? 10 * 1024 * 1024
    const acceptExtensions = acceptedTypes.includes("application/pdf") ? ".jpg,.jpeg,.png,.pdf" : acceptedTypes.join(",")

    return (
      <div className="rounded-md border border-dashed p-6 text-center">
        <Upload className="mx-auto mb-2 size-8 text-muted-foreground" />
        <div className="font-medium">Drag and drop files here or browse</div>
        <div className="mt-1 text-xs text-muted-foreground">Accepted: {acceptedTypes.join(", ")} • Max {Math.round(maxSizeBytes / 1024 / 1024)}MB</div>
        <label className="mt-4 inline-flex h-8 cursor-pointer items-center justify-center gap-2 rounded-lg border border-input px-3 text-sm font-medium hover:bg-muted">
          <FileUp className="size-4" />
          Choose File
          <input
            accept={acceptExtensions}
            className="sr-only"
            disabled={locked}
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
    const rightValues = question.matchPairs.map((pair) => pair.rightMarkdown)

    return (
      <div className="space-y-3">
        {question.matchPairs.map((pair) => (
          <div key={pair.id} className="grid gap-3 rounded-md border p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <MarkdownContent content={pair.leftMarkdown} />
            <select
              className="h-9 rounded-md border bg-background px-2 text-sm"
              disabled={locked}
              value={matchingAnswers[pair.id] ?? ""}
              onChange={(event) => {
                const next = { ...matchingAnswers, [pair.id]: event.target.value }
                setMatchingAnswers(next)
                void onSaveAnswer(question.id, JSON.stringify({ pairs: next }), answer?.flaggedForReview)
              }}
            >
              <option value="">Choose match...</option>
              {rightValues.map((value) => (
                <option key={`${pair.id}-${value}`} value={value}>
                  {value.replaceAll("`", "")}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    )
  }

  if (question.type === "Ordering") {
    function moveItem(index: number, direction: -1 | 1) {
      const next = [...orderingAnswer]
      const target = index + direction
      if (target < 0 || target >= next.length) {
        return
      }

      const [item] = next.splice(index, 1)
      next.splice(target, 0, item)
      setOrderingAnswer(next)
      void onSaveAnswer(question.id, JSON.stringify({ items: next }), answer?.flaggedForReview)
    }

    return (
      <div className="space-y-2">
        {orderingAnswer.map((item, index) => (
          <div key={item} className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm">
            <span><span className="mr-2 font-mono text-xs text-muted-foreground">{index + 1}</span>{item}</span>
            <span className="flex gap-1">
              <Button disabled={locked || index === 0} size="sm" variant="outline" onClick={() => moveItem(index, -1)}>Up</Button>
              <Button disabled={locked || index === orderingAnswer.length - 1} size="sm" variant="outline" onClick={() => moveItem(index, 1)}>Down</Button>
            </span>
          </div>
        ))}
      </div>
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
      <CardHeader>
        <CardTitle>Question Map</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded border p-2"><div className="font-semibold">{answered}</div><div className="text-muted-foreground">Answered</div></div>
          <div className="rounded border p-2"><div className="font-semibold">{flagged}</div><div className="text-muted-foreground">Flagged</div></div>
          <div className="rounded border p-2"><div className="font-semibold">{questions.length - answered}</div><div className="text-muted-foreground">Open</div></div>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {questions.map((question, index) => (
            <button
              key={question.id}
              className={cn(
                "flex aspect-square items-center justify-center rounded-md border text-sm",
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
            <p className="mt-2 text-sm text-muted-foreground">Time taken: 45 minutes • Completed: today</p>
            <div className="mt-4 rounded-md border bg-muted/40 p-4">
              <div className="mb-1 font-medium">Teacher Feedback</div>
              <p className="text-sm text-muted-foreground">
                Strong work on objective questions. Review the quadratic explanation feedback before the final.
              </p>
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

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(new Date(value))
}

function durationMinutes(start: string, end: string) {
  return Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000))
}

function parseAnswer(answerJson?: string) {
  if (!answerJson) {
    return null
  }

  try {
    return JSON.parse(answerJson) as { fileName?: string; state?: string }
  } catch {
    return null
  }
}

export { ExamEnginePage }
