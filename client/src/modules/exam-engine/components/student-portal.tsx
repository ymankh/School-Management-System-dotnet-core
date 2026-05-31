import { useEffect, useRef, useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Flag,
  ListChecks,
  Play,
  Save,
} from "lucide-react"

import { MetricCard, StatusBadge } from "@/modules/exam-engine/components/exam-engine-shared"
import { MarkdownContent } from "@/modules/exam-engine/components/markdown-content"
import { QuestionAnswerInput } from "@/modules/exam-engine/components/student-answer-input"
import type {
  Exam,
  ExamAttempt,
  ExamQuestion,
  ExamSummary,
  StudentAnswer,
} from "@/modules/exam-engine/types/exam-engine.types"
import type { StudentPage, StudentPanel } from "@/modules/exam-engine/types/exam-engine-ui.types"
import { durationMinutes, formatDate, formatRemainingTime, formatTime } from "@/modules/exam-engine/utils/exam-engine-formatters"
import { getAttemptQuestions } from "@/modules/exam-engine/utils/exam-engine-model"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Checkbox } from "@/shared/components/ui/checkbox"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
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
          <Badge aria-live="polite" className="gap-1 border-destructive/30 bg-destructive/10 text-destructive" role="timer" variant="outline"><Clock className="size-3" /> {remainingTime}</Badge>
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
              <span aria-live="polite">Autosave: {answer ? `saved ${formatTime(answer.savedAtUtc)}` : "not saved yet"}</span>
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
            <Button
              key={question.id}
              className={cn(
                "size-11 shrink-0",
                answers[question.id] && "bg-primary text-primary-foreground hover:bg-primary/90",
                answers[question.id]?.flaggedForReview && "bg-accent text-accent-foreground hover:bg-accent/80",
                selectedQuestionId === question.id && "ring-2 ring-ring",
              )}
              size="icon-sm"
              type="button"
              variant="outline"
              onClick={() => onSelectQuestion(question.id)}
            >
              {index + 1}
            </Button>
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
              <Badge className={answers[question.id]?.flaggedForReview ? "border-accent bg-accent text-accent-foreground" : ""} variant="outline">
                {answers[question.id]?.flaggedForReview ? "Flagged for Review" : answers[question.id] ? "Answered" : "Unanswered"}
              </Badge>
            </div>
          ))}
        </div>
        <Label className="flex items-start gap-3 rounded-md border bg-muted/40 p-3 text-sm font-normal">
          <Checkbox className="mt-1" checked={confirmed} onCheckedChange={(checked) => setConfirmed(checked === true)} />
          <span>
            <span className="block font-medium">I understand this is the final submission.</span>
            <span className="text-muted-foreground">After submitting, answers are locked and unanswered questions are submitted blank.</span>
          </span>
        </Label>
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
