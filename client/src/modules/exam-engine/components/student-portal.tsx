import { useEffect, useRef, useState } from "react"
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
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  FileUp,
  Flag,
  GripVertical,
  ListChecks,
  Play,
  Save,
  Upload,
} from "lucide-react"

import { MetricCard, StatusBadge } from "@/modules/exam-engine/components/exam-engine-shared"
import { MarkdownContent } from "@/modules/exam-engine/components/markdown-content"
import type {
  Exam,
  ExamAttempt,
  ExamQuestion,
  ExamSummary,
  StudentAnswer,
} from "@/modules/exam-engine/types/exam-engine.types"
import type { StudentPage, StudentPanel } from "@/modules/exam-engine/types/exam-engine-ui.types"
import { durationMinutes, formatDate, formatRemainingTime, formatTime } from "@/modules/exam-engine/utils/exam-engine-formatters"
import {
  getMatchPairs,
  getOrderingAnswer,
  getAttemptQuestions,
  getQuestionOptions,
  parseAnswer,
} from "@/modules/exam-engine/utils/exam-engine-model"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Checkbox } from "@/shared/components/ui/checkbox"
import { Label } from "@/shared/components/ui/label"
import { Input } from "@/shared/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"
import { Textarea } from "@/shared/components/ui/textarea"
import { cn } from "@/shared/lib/utils"

export function StudentPortal({
  activeExam,
  answers,
  attempt,
  canEditStudentId = true,
  onSaveAnswer,
  onSelectQuestion,
  onShowResults,
  onStartExam,
  onSubmitAttempt,
  onUploadFile,
  page,
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
  canEditStudentId?: boolean
  onSaveAnswer: (questionId: number, answerJson: string, flaggedForReview?: boolean) => Promise<void>
  onSelectQuestion: (questionId: number) => void
  onShowResults: (examId: number) => Promise<void>
  onStartExam: (examId: number) => Promise<void>
  onSubmitAttempt: (expired?: boolean) => Promise<void>
  onUploadFile: (questionId: number, file: File) => Promise<void>
  page: StudentPage
  panel: StudentPanel
  questions: ExamQuestion[]
  selectedQuestion?: ExamQuestion
  setPanel: (panel: StudentPanel) => void
  setStudentIdInput: (value: string) => void
  studentIdInput: string
  studentExams: ExamSummary[]
}) {
  if (panel !== "list") {
    return (
      <div className="flex-1 overflow-auto p-4 lg:p-6">
        {panel === "player" && activeExam && selectedQuestion && (
          <ExamPlayer
            attempt={attempt}
            answers={answers}
            exam={activeExam}
            onSaveAnswer={onSaveAnswer}
            onSelectQuestion={onSelectQuestion}
            onShowReview={() => setPanel("review")}
            onSubmitExpired={() => onSubmitAttempt(true)}
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

  return (
    <div className="flex-1 overflow-auto p-4 lg:p-6">
      {page === "dashboard" && <StudentOverview exams={studentExams} />}
      {page === "exams" && (
        <StudentExamList
          exams={studentExams}
          canEditStudentId={canEditStudentId}
          onShowResults={onShowResults}
          onStartExam={onStartExam}
          setStudentIdInput={setStudentIdInput}
          studentIdInput={studentIdInput}
        />
      )}
      {page === "schedule" && <StudentSchedule exams={studentExams} />}
      {page === "homework" && <ReadOnlyStudentPage title="Homework" emptyText="No homework records are available." />}
      {page === "messages" && <ReadOnlyStudentPage title="Messages" emptyText="No messages are available." />}
      {page === "profile" && <ReadOnlyStudentPage title="Profile" emptyText="Profile details will appear here." />}
      {page === "settings" && <ReadOnlyStudentPage title="Settings" emptyText="Student settings will appear here." />}
    </div>
  )
}

function StudentOverview({ exams }: { exams: ExamSummary[] }) {
  const activeExams = exams.filter((exam) => exam.status === "Active")
  const scheduledExams = exams.filter((exam) => exam.status === "Scheduled")
  const completedExams = exams.filter((exam) => exam.status === "Completed")
  const nextExam = [...activeExams, ...scheduledExams].sort(
    (left, right) => new Date(left.startAtUtc).getTime() - new Date(right.startAtUtc).getTime(),
  )[0]

  return (
    <div className="space-y-5">
      <div className="grid gap-3 lg:grid-cols-4">
        <MetricCard label="Active Exams" value={activeExams.length} />
        <MetricCard label="Upcoming" value={scheduledExams.length} />
        <MetricCard label="Completed" value={completedExams.length} />
        <MetricCard label="Assigned" value={exams.length} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Next Exam</CardTitle>
        </CardHeader>
        <CardContent>
          {nextExam ? (
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="font-medium">{nextExam.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {nextExam.subject} • {formatDate(nextExam.startAtUtc)} • {durationMinutes(nextExam.startAtUtc, nextExam.endAtUtc)} min
                </div>
              </div>
              <StatusBadge status={nextExam.status} />
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No active or upcoming exams.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StudentSchedule({ exams }: { exams: ExamSummary[] }) {
  const scheduledExams = exams
    .filter((exam) => exam.status === "Scheduled" || exam.status === "Active")
    .sort((left, right) => new Date(left.startAtUtc).getTime() - new Date(right.startAtUtc).getTime())

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedule</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {scheduledExams.length === 0 && <div className="text-sm text-muted-foreground">No scheduled exams are available.</div>}
        {scheduledExams.map((exam) => (
          <div key={`schedule-${exam.id}`} className="flex flex-col gap-3 rounded-md border p-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="font-medium">{exam.title}</div>
              <div className="mt-1 text-sm text-muted-foreground">
                {exam.subject} • {formatDate(exam.startAtUtc)} • {formatTime(exam.startAtUtc)}
              </div>
            </div>
            <StatusBadge status={exam.status} />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function ReadOnlyStudentPage({ emptyText, title }: { emptyText: string; title: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{emptyText}</CardContent>
    </Card>
  )
}

function StudentExamList({
  canEditStudentId,
  exams,
  onShowResults,
  onStartExam,
  setStudentIdInput,
  studentIdInput,
}: {
  canEditStudentId: boolean
  exams: ExamSummary[]
  onShowResults: (examId: number) => Promise<void>
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
        {canEditStudentId && (
          <div className="grid gap-1 lg:w-56">
            <Label htmlFor="student-id-filter">Student ID</Label>
            <Input
              className="w-full"
              id="student-id-filter"
              inputMode="numeric"
              placeholder="Student ID"
              value={studentIdInput}
              onChange={(event) => setStudentIdInput(event.target.value)}
            />
          </div>
        )}
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
              <Button className="mt-4 w-full" size="sm" onClick={() => exam.status === "Completed" ? void onShowResults(exam.id) : void onStartExam(exam.id)}>
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
  onSubmitExpired,
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
  onSubmitExpired: () => Promise<void>
  onUploadFile: (questionId: number, file: File) => Promise<void>
  questions: ExamQuestion[]
  selectedQuestion: ExamQuestion
}) {
  const [textAnswer, setTextAnswer] = useState("")
  const [now, setNow] = useState(() => Date.now())
  const expiredSubmittedRef = useRef(false)
  const answer = answers[selectedQuestion.id]
  const locked = attempt ? attempt.status !== "InProgress" : false
  const deliveredOptionOrder = getAttemptQuestions(attempt).find((question) => question.questionId === selectedQuestion.id)?.deliveredOptionOrder ?? []
  const selectedQuestionIndex = Math.max(
    questions.findIndex((question) => question.id === selectedQuestion.id),
    0,
  )
  const previousQuestion = questions[selectedQuestionIndex - 1]
  const nextQuestion = questions[selectedQuestionIndex + 1]
  const questionPosition = questions.length > 0 ? selectedQuestionIndex + 1 : 0
  const showManualSave = ["Article", "ShortAnswer", "FillInTheBlank"].includes(selectedQuestion.type)
  const remainingMs = new Date(exam.endAtUtc).getTime() - now
  const remainingTime = formatRemainingTime(exam.endAtUtc, now)

  useEffect(() => {
    const timerId = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timerId)
  }, [])

  useEffect(() => {
    if (locked || expiredSubmittedRef.current || remainingMs > 0) {
      return
    }

    expiredSubmittedRef.current = true
    void onSubmitExpired()
  }, [locked, onSubmitExpired, remainingMs])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-md border bg-card p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold">{exam.title}</h2>
          <p className="text-sm text-muted-foreground">{exam.teacherName} • {exam.subject}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {exam.focusModeEnabled && <Badge className="gap-1" variant="secondary"><Eye className="size-3" /> Focus Mode Active</Badge>}
          <Badge className="gap-1 border-destructive/30 bg-destructive/10 text-destructive" variant="outline"><Clock className="size-3" /> {remainingTime}</Badge>
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
              key={selectedQuestion.id}
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
  const [uploadState, setUploadState] = useState<"empty" | "uploading" | "uploaded" | "failed" | "replaced" | "removed">("empty")
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [matchingAnswers, setMatchingAnswers] = useState<Record<number, string>>(() => parsedAnswer?.pairs ?? {})
  const [orderingAnswer, setOrderingAnswer] = useState<string[]>(() => getOrderingAnswer(question, parsedAnswer))
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  if (question.type === "MultipleChoice") {
    const orderedOptions = optionOrder.length > 0
      ? optionOrder
          .map((optionId) => getQuestionOptions(question).find((option) => option.id === optionId))
          .filter((option): option is ExamQuestion["options"][number] => Boolean(option))
      : getQuestionOptions(question)

    return (
      <div aria-label="Multiple choice answer options" className="space-y-2" role="radiogroup">
        {orderedOptions.map((option) => {
          const selected = parsedAnswer?.selectedOptionId === option.id

          return (
            <button
              key={option.id}
              aria-checked={selected}
              role="radio"
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
      <div aria-label="True or false answer options" className="flex gap-2" role="radiogroup">
        {[true, false].map((value) => {
          const selected = parsedAnswer?.value === value

          return (
            <Button
              key={String(value)}
              aria-checked={selected}
              role="radio"
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
    const currentUploadState = uploadState !== "empty" ? uploadState : parsedAnswer?.state ?? "empty"

    const uploadSelectedFile = (file: File) => {
      setUploadError(null)

      if (!canUpload) {
        setUploadState("failed")
        setUploadError("Upload rules are not configured for this question.")
        return
      }

      if (!acceptedTypes.includes(file.type)) {
        setUploadState("failed")
        setUploadError("This file type is not accepted for this question.")
        return
      }

      if (file.size > maxSizeBytes) {
        setUploadState("failed")
        setUploadError(`File size cannot exceed ${Math.round(maxSizeBytes / 1024 / 1024)}MB.`)
        return
      }

      setUploadState("uploading")
      void onUploadFile(question.id, file)
        .then(() => setUploadState(parsedAnswer?.fileName ? "replaced" : "uploaded"))
        .catch((error: unknown) => {
          setUploadState("failed")
          setUploadError(error instanceof Error ? error.message : "Upload failed. Select the file again.")
        })
    }

    return (
      <div
        className={cn(
          "rounded-md border border-dashed p-6 text-center transition",
          !locked && canUpload && "hover:border-primary hover:bg-muted/40",
        )}
        onDragOver={(event) => {
          if (locked || !canUpload) {
            return
          }

          event.preventDefault()
        }}
        onDrop={(event) => {
          if (locked || !canUpload) {
            return
          }

          event.preventDefault()
          const file = event.dataTransfer.files[0]
          if (file) {
            uploadSelectedFile(file)
          }
        }}
      >
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

              uploadSelectedFile(file)
            }}
          />
        </label>
        <div className="mt-4 rounded-md border bg-muted/40 p-3 text-left text-xs">
          <div className="font-medium">Upload state: {currentUploadState}</div>
          {parsedAnswer?.fileName && <div className="mt-1 text-muted-foreground">Current file: {parsedAnswer.fileName}</div>}
          {uploadState === "uploading" && <div className="mt-1 text-muted-foreground">Uploading file...</div>}
          {uploadState === "replaced" && <div className="mt-1 text-muted-foreground">Previous file was replaced.</div>}
          {uploadState === "failed" && <div className="mt-1 text-destructive">{uploadError ?? "Upload failed. Select the file again."}</div>}
          {parsedAnswer?.fileName && (
            <Button
              className="mt-3"
              disabled={locked}
              size="sm"
              variant="outline"
              onClick={() => {
                setUploadState("removed")
                setUploadError(null)
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
        aria-label="Fill in the blank answer"
        disabled={locked}
        placeholder="Type the missing value..."
        value={textAnswer}
        onBlur={() => void onSaveAnswer(question.id, JSON.stringify({ value: textAnswer }), answer?.flaggedForReview)}
        onChange={(event) => onChangeText(event.target.value)}
      />
    )
  }

  return (
    <Textarea
      aria-label="Written answer"
      className="min-h-48"
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
                answers[question.id]?.flaggedForReview && "bg-accent text-accent-foreground",
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
              <Badge className={answers[question.id]?.flaggedForReview ? "border-accent bg-accent text-accent-foreground" : ""} variant="outline">
                {answers[question.id]?.flaggedForReview ? "Flagged for Review" : answers[question.id] ? "Answered" : "Unanswered"}
              </Badge>
            </div>
          ))}
        </div>
        <label className="flex items-start gap-3 rounded-md border bg-muted/40 p-3 text-sm">
          <Checkbox className="mt-1" checked={confirmed} onCheckedChange={(checked) => setConfirmed(checked === true)} />
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
