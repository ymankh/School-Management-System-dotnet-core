import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Archive,
  CheckCircle2,
  Copy,
  Database,
  Eye,
  LayoutDashboard,
  ListChecks,
  Plus,
  Save,
  Search,
  Settings,
  Upload,
} from "lucide-react"

import {
  createSubjectSkill,
  getClassSubjects,
  getGradingAnswers,
  getSubjectSkills,
  gradeAnswer,
} from "@/modules/exam-engine/api/exam-engine-api"
import type { ExamDashboardFilters } from "@/modules/exam-engine/api/exam-engine-api"
import {
  ChecklistItem,
  IconButton,
  MetricCard,
  SettingRow,
  StatusBadge,
} from "@/modules/exam-engine/components/exam-engine-shared"
import { MarkdownContent } from "@/modules/exam-engine/components/markdown-content"
import type {
  ClassSubjectOption,
  Exam,
  ExamDashboard,
  ExamSummary,
  ExamQuestion,
  QuestionBankItem,
  QuestionGroup,
  QuestionType,
  SubjectSkill,
} from "@/modules/exam-engine/types/exam-engine.types"
import type { TeacherPanel } from "@/modules/exam-engine/types/exam-engine-ui.types"
import { durationMinutes, formatDate, matchesDashboardDateFilter, uniqueSorted } from "@/modules/exam-engine/utils/exam-engine-formatters"
import { getExamGroups, getExamQuestions, getGroupQuestions } from "@/modules/exam-engine/utils/exam-engine-model"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Checkbox } from "@/shared/components/ui/checkbox"
import { Input } from "@/shared/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table"
import { Textarea } from "@/shared/components/ui/textarea"

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

type UploadedAttachment = {
  fileName: string
  contentType: string
  sizeBytes: number
  url: string
  uploadedAtUtc: string
}

function toDatetimeLocal(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ""
  }

  const offsetMs = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

function fromDatetimeLocal(value: string) {
  return value ? new Date(value).toISOString() : new Date().toISOString()
}

export function TeacherPortal({
  activeExam,
  archiveExam,
  createDraftExam,
  dashboard,
  dashboardFilters,
  duplicateExam,
  importFromBank,
  openExam,
  panel,
  publishExam,
  publishingExamId,
  publishMarks,
  questionBank,
  setDashboardFilters,
  setPanel,
  updateExam,
  uploadAttachment,
}: {
  activeExam: Exam | null
  archiveExam: (examId: number) => void
  createDraftExam: (classSubject?: ClassSubjectOption) => void
  dashboard: ExamDashboard | null
  dashboardFilters: Required<ExamDashboardFilters>
  duplicateExam: (examId: number) => void
  importFromBank: (examId: number, groupId: number, itemIds: number[]) => void
  openExam: (examId: number, panel: TeacherPanel) => void
  panel: TeacherPanel
  publishExam: (examId: number) => void
  publishingExamId?: number | null
  publishMarks: (examId: number) => void
  questionBank: QuestionBankItem[]
  setDashboardFilters: (filters: Required<ExamDashboardFilters>) => void
  setPanel: (panel: TeacherPanel) => void
  updateExam: (exam: Exam) => void
  uploadAttachment: (examId: number, file: File) => Promise<UploadedAttachment>
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
          publishingExamId={publishingExamId}
          setFilters={setDashboardFilters}
          setPanel={setPanel}
        />
      )}
      {panel === "builder" && activeExam && (
        <ExamBuilder
          key={activeExam.id}
          exam={activeExam}
          importFromBank={importFromBank}
          publishExam={publishExam}
          isPublishing={publishingExamId === activeExam.id}
          questionBank={questionBank}
          updateExam={updateExam}
          uploadAttachment={uploadAttachment}
        />
      )}
      {panel === "builder" && !activeExam && (
        <BuilderEmptyState
          createDraftExam={createDraftExam}
          dashboard={dashboard}
          openExam={(examId) => openExam(examId, "builder")}
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

function BuilderEmptyState({
  createDraftExam,
  dashboard,
  openExam,
}: {
  createDraftExam: (classSubject?: ClassSubjectOption) => void
  dashboard: ExamDashboard | null
  openExam: (examId: number) => void
}) {
  const exams = dashboard?.exams ?? []
  const editableExams = exams.filter((exam) => exam.status !== "Archived")
  const classSubjectsQuery = useQuery({ queryKey: ["class-subject-options"], queryFn: getClassSubjects })
  const classSubjects = classSubjectsQuery.data ?? []
  const [selectedClassSubjectId, setSelectedClassSubjectId] = useState("")
  const selectedClassSubject =
    classSubjects.find((option) => option.id.toString() === selectedClassSubjectId) ?? classSubjects[0]

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Choose An Exam To Build</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Select an existing draft or create a new exam to open the builder workspace.
              </p>
            </div>
            <Button onClick={() => createDraftExam(selectedClassSubject)}>
              <Plus className="size-4" />
              New Draft
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {editableExams.map((exam) => (
            <button
              key={exam.id}
              className="flex w-full flex-col gap-3 rounded-md border bg-background p-4 text-left transition hover:border-primary hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
              type="button"
              onClick={() => openExam(exam.id)}
            >
              <span>
                <span className="block font-medium">{exam.title}</span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {exam.subject} • {exam.className} • {formatDate(exam.startAtUtc)}
                </span>
              </span>
              <span className="flex items-center gap-2">
                <StatusBadge status={exam.status} />
                <Badge variant="outline">{exam.mode}</Badge>
              </span>
            </button>
          ))}
          {editableExams.length === 0 && (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              No editable exams are available yet. Create a new draft to start building.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="self-start">
        <CardHeader>
          <CardTitle>Builder Starts Here</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <label className="block text-xs font-medium text-foreground">
            Class and subject for new draft
            <Select value={selectedClassSubject?.id.toString() ?? ""} onValueChange={setSelectedClassSubjectId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Choose class subject" />
              </SelectTrigger>
              <SelectContent>
                {classSubjects.map((option) => (
                  <SelectItem key={option.id} value={option.id.toString()}>
                    {option.className} / {option.subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <p>After selecting an exam, the builder shows groups, question editing, live Markdown and LaTeX preview, settings, attachments, and publishing controls.</p>
          <div className="rounded-md border bg-muted/40 p-3">
            Drafts are hidden from students until they are saved, made visible, and published.
          </div>
        </CardContent>
      </Card>
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
  publishingExamId,
  setFilters,
  setPanel,
}: {
  archiveExam: (examId: number) => void
  dashboard: ExamDashboard | null
  duplicateExam: (examId: number) => void
  filters: Required<ExamDashboardFilters>
  openExam: (examId: number, panel: TeacherPanel) => void
  publishExam: (examId: number) => void
  publishingExamId?: number | null
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

  function confirmPublishExam(exam: ExamSummary) {
    const confirmed = window.confirm(`Publish "${exam.title}"? Students assigned to this exam will be able to access it according to its schedule.`)

    if (confirmed) {
      publishExam(exam.id)
    }
  }

  function confirmArchiveExam(exam: ExamSummary) {
    const confirmed = window.confirm(`Archive "${exam.title}"? Archived exams are hidden from the active management list.`)

    if (confirmed) {
      archiveExam(exam.id)
    }
  }


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
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exam Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExams.map((exam) => (
                  <TableRow key={exam.id}>
                    <TableCell>
                      <div className="font-medium">{exam.title}</div>
                      <div className="text-xs text-muted-foreground">{exam.className} • {formatDate(exam.startAtUtc)}</div>
                    </TableCell>
                    <TableCell>{exam.subject}</TableCell>
                    <TableCell>{exam.mode}</TableCell>
                    <TableCell><StatusBadge status={exam.status} /></TableCell>
                    <TableCell>{exam.questionCount}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <IconButton title="Preview" icon={Eye} onClick={() => openExam(exam.id, "builder")} />
                        <IconButton title="Edit" icon={Settings} onClick={() => openExam(exam.id, "builder")} />
                        <IconButton
                          disabled={publishingExamId === exam.id || exam.isPublished}
                          title={exam.isPublished ? "Published" : "Publish"}
                          icon={CheckCircle2}
                          onClick={() => confirmPublishExam(exam)}
                        />
                        <IconButton title="Duplicate" icon={Copy} onClick={() => duplicateExam(exam.id)} />
                        <IconButton title="Archive" icon={Archive} onClick={() => confirmArchiveExam(exam)} />
                        <IconButton title="Results" icon={ListChecks} onClick={() => openExam(exam.id, "grading")} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
  isPublishing,
  questionBank,
  updateExam,
  uploadAttachment,
}: {
  exam: Exam
  importFromBank: (examId: number, groupId: number, itemIds: number[]) => void
  publishExam: (examId: number) => void
  isPublishing?: boolean
  questionBank: QuestionBankItem[]
  updateExam: (exam: Exam) => void
  uploadAttachment: (examId: number, file: File) => Promise<UploadedAttachment>
}) {
  const defaultSkillDraft = {
    name: "",
    descriptionMarkdown: "",
    displayOrder: "",
  }
  const [editableExam, setEditableExam] = useState<Exam>(() => exam)
  const [editableGroups, setEditableGroups] = useState<QuestionGroup[]>(() => getExamGroups(exam))
  const [selectedBankItems, setSelectedBankItems] = useState<number[]>([])
  const [bankSearch, setBankSearch] = useState("")
  const [bankTypeFilter, setBankTypeFilter] = useState<QuestionType | "all">("all")
  const [bankDifficultyFilter, setBankDifficultyFilter] = useState("all")
  const [targetGroupId, setTargetGroupId] = useState<number | null>(() => getExamGroups(exam)[0]?.id ?? null)
  const [attachment, setAttachment] = useState<File | null>(null)
  const [uploadedAttachment, setUploadedAttachment] = useState<UploadedAttachment | null>(null)
  const [attachmentUploadError, setAttachmentUploadError] = useState<string | null>(null)
  const [isSkillSheetOpen, setIsSkillSheetOpen] = useState(false)
  const [skillDraft, setSkillDraft] = useState(defaultSkillDraft)
  const [groupSkillDraft, setGroupSkillDraft] = useState<{
    skill: SubjectSkill
    selectionPolicy: QuestionGroup["selectionPolicy"]
    questionsToShow: string
    shuffleQuestions: boolean
  } | null>(null)
  const queryClient = useQueryClient()
  const subjectSkillsQuery = useQuery({
    queryKey: ["subject-skills", exam.classSubjectId],
    queryFn: () => getSubjectSkills(exam.classSubjectId),
  })
  const createSubjectSkillMutation = useMutation({
    mutationFn: createSubjectSkill,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["subject-skills", exam.classSubjectId] })
      setIsSkillSheetOpen(false)
      setSkillDraft(defaultSkillDraft)
    },
  })
  const subjectSkills = subjectSkillsQuery.data ?? []
  const skillName = skillDraft.name.trim()
  const skillDisplayOrder = skillDraft.displayOrder ? Number.parseInt(skillDraft.displayOrder, 10) : subjectSkills.length + 1
  const isSkillDraftValid = skillName.length > 0 && Number.isInteger(skillDisplayOrder) && skillDisplayOrder > 0

  const bankDifficultyOptions = useMemo(
    () => uniqueSorted(questionBank.map((item) => item.question.difficulty).filter(Boolean)),
    [questionBank],
  )
  const filteredQuestionBank = useMemo(() => {
    const search = bankSearch.trim().toLowerCase()

    return questionBank.filter((item) => {
      const question = item.question
      const matchesSearch =
        search.length === 0 ||
        `${item.subject} ${item.ownerName} ${question.type} ${question.difficulty} ${question.tags.join(" ")} ${question.bodyMarkdown}`
          .toLowerCase()
          .includes(search)
      const matchesType = bankTypeFilter === "all" || question.type === bankTypeFilter
      const matchesDifficulty = bankDifficultyFilter === "all" || question.difficulty === bankDifficultyFilter

      return matchesSearch && matchesType && matchesDifficulty
    })
  }, [bankDifficultyFilter, bankSearch, bankTypeFilter, questionBank])

  const saveSkill = () => {
    if (!isSkillDraftValid) {
      return
    }

    createSubjectSkillMutation.mutate({
      classSubjectId: exam.classSubjectId,
      subject: exam.subject,
      name: skillName,
      descriptionMarkdown: skillDraft.descriptionMarkdown,
      displayOrder: skillDisplayOrder,
    })
  }

  function confirmPublishCurrentExam() {
    const confirmed = window.confirm(`Publish "${exam.title}"? Students assigned to this exam will be able to access it according to its schedule.`)

    if (confirmed) {
      publishExam(exam.id)
    }
  }

  const openGroupFromSkillSheet = (skill: SubjectSkill) => {
    setGroupSkillDraft({
      skill,
      selectionPolicy: "show-all",
      questionsToShow: "1",
      shuffleQuestions: true,
    })
  }

  const addGroupFromSkill = () => {
    if (!groupSkillDraft) {
      return
    }

    const parsedQuestionsToShow = Number.parseInt(groupSkillDraft.questionsToShow, 10)

    setEditableGroups((currentGroups) => [
      ...currentGroups,
      {
        id: -Date.now(),
        examId: exam.id,
        title: groupSkillDraft.skill.name,
        instructionsMarkdown: groupSkillDraft.skill.descriptionMarkdown,
        authoringOrder: currentGroups.length + 1,
        selectionPolicy: groupSkillDraft.selectionPolicy,
        questionsToShow:
          groupSkillDraft.selectionPolicy === "pick-random" && Number.isInteger(parsedQuestionsToShow) && parsedQuestionsToShow > 0
            ? parsedQuestionsToShow
            : null,
        shuffleQuestions: groupSkillDraft.shuffleQuestions,
        questions: [],
      },
    ])
    setGroupSkillDraft(null)
  }

  const addQuestionToGroup = (groupId: number) => {
    setEditableGroups((currentGroups) =>
      currentGroups.map((group) => {
        if (group.id !== groupId) {
          return group
        }

        const questions = getGroupQuestions(group)
        const nextOrder = questions.length + 1
        const question: ExamQuestion = {
          id: -Date.now(),
          groupId,
          type: "MultipleChoice",
          bodyMarkdown: "",
          referenceMarkdown: "",
          mark: 1,
          authoringOrder: nextOrder,
          isRequired: true,
          difficulty: "Medium",
          tags: [],
          gradingRule: "auto",
          shuffleOptions: true,
          options: [
            { id: -Date.now() - 1, textMarkdown: "Option A", isCorrect: true, authoringOrder: 1 },
            { id: -Date.now() - 2, textMarkdown: "Option B", isCorrect: false, authoringOrder: 2 },
          ],
          matchPairs: [],
          orderingItems: [],
          acceptedAnswers: [],
          fileUploadRule: null,
        }

        return { ...group, questions: [...questions, question] }
      }),
    )
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

  const insertAttachmentIntoQuestion = (groupId: number, question: ExamQuestion) => {
    if (!uploadedAttachment) {
      return
    }

    const markdown = uploadedAttachment.contentType.startsWith("image/")
      ? `![${uploadedAttachment.fileName}](${uploadedAttachment.url})`
      : `[${uploadedAttachment.fileName}](${uploadedAttachment.url})`
    const separator = question.bodyMarkdown.trim().length > 0 ? "\n\n" : ""
    updateQuestionDraft(groupId, question.id, {
      bodyMarkdown: `${question.bodyMarkdown}${separator}${markdown}`,
    })
  }

  return (
    <>
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
          <div className="rounded-md border bg-background p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="text-sm font-medium">Subject Skills</div>
              <Button variant="outline" size="sm" onClick={() => setIsSkillSheetOpen(true)}><Plus className="size-4" /> Subject Skill</Button>
            </div>
            <div className="space-y-2">
              {subjectSkills.map((skill) => (
                <button
                  key={skill.id}
                  className="w-full rounded border px-2 py-1 text-left text-xs hover:bg-muted"
                  type="button"
                  onClick={() => openGroupFromSkillSheet(skill)}
                >
                  <span className="font-medium">{skill.name}</span>
                  {skill.descriptionMarkdown && <span className="block text-muted-foreground">{skill.descriptionMarkdown}</span>}
                </button>
              ))}
              {subjectSkills.length === 0 && (
                <div className="text-xs text-muted-foreground">No skills are defined for this subject yet.</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>{editableExam.title}</CardTitle>
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
              <Button variant="outline" size="sm" onClick={() => updateExam({ ...editableExam, groups: editableGroups })}><Save className="size-4" /> Save Draft</Button>
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
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">Question Bank optional</Badge>
                      <Button size="sm" type="button" onClick={() => addQuestionToGroup(group.id)}>
                        <Plus className="size-4" />
                        Add Question
                      </Button>
                    </div>
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
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <span className="text-sm font-medium">Markdown and LaTeX Editor</span>
                              <Button
                                disabled={!uploadedAttachment}
                                size="sm"
                                type="button"
                                variant="outline"
                                onClick={() => insertAttachmentIntoQuestion(group.id, question)}
                              >
                                <Upload className="size-4" />
                                Insert file
                              </Button>
                            </div>
                            <Textarea
                              className="min-h-40 font-mono"
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

                        <QuestionAnswerKeyEditor
                          question={question}
                          updateQuestion={(patch) => updateQuestionDraft(group.id, question.id, patch)}
                        />
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
            <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h3 className="font-medium">Add From Question Bank</h3>
                <p className="mt-1 text-sm text-muted-foreground">Search reusable questions, select a target group, then import the selected items.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Select
                  value={targetGroupId?.toString() ?? ""}
                  onValueChange={(value) => setTargetGroupId(Number.parseInt(value, 10))}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Target group" />
                  </SelectTrigger>
                  <SelectContent>
                    {editableGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id.toString()}>{group.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  disabled={selectedBankItems.length === 0 || !targetGroupId}
                  size="sm"
                  onClick={() => {
                    if (!targetGroupId) {
                      return
                    }

                    importFromBank(exam.id, targetGroupId, selectedBankItems)
                    setSelectedBankItems([])
                  }}
                >
                  <Database className="size-4" /> Add Selected ({selectedBankItems.length})
                </Button>
              </div>
            </div>

            <div className="mb-3 grid gap-2 lg:grid-cols-[minmax(0,1fr)_180px_180px]">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Search question text, tags, subject, or owner..."
                  value={bankSearch}
                  onChange={(event) => setBankSearch(event.target.value)}
                />
              </div>
              <Select value={bankTypeFilter} onValueChange={(value) => setBankTypeFilter(value as QuestionType | "all")}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {questionTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={bankDifficultyFilter} onValueChange={setBankDifficultyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All difficulties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All difficulties</SelectItem>
                  {bankDifficultyOptions.map((difficulty) => (
                    <SelectItem key={difficulty} value={difficulty}>{difficulty}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {filteredQuestionBank.map((item) => (
                <label key={item.id} className="flex gap-3 rounded-md border p-3 text-sm">
                  <Checkbox
                    checked={selectedBankItems.includes(item.id)}
                    onCheckedChange={(checked) =>
                      setSelectedBankItems((current) =>
                        checked === true ? [...current, item.id] : current.filter((id) => id !== item.id),
                      )
                    }
                  />
                  <span>
                    <span className="block font-medium">{item.question.type} • {item.question.difficulty}</span>
                    <span className="mb-1 block text-xs text-muted-foreground">{item.subject} • {item.ownerName}</span>
                    <span className="line-clamp-2 text-muted-foreground">{item.question.bodyMarkdown}</span>
                  </span>
                </label>
              ))}
              {filteredQuestionBank.length === 0 && (
                <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground md:col-span-2">
                  No bank questions match the current filters.
                </div>
              )}
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
                  setAttachmentUploadError(null)
                  if (file) {
                    uploadAttachment(exam.id, file)
                      .then((result) => setUploadedAttachment(result))
                      .catch((error: unknown) => {
                        setUploadedAttachment(null)
                        setAttachmentUploadError(error instanceof Error ? error.message : "Attachment upload failed.")
                      })
                  }
                }}
              />
            </label>
            {uploadedAttachment && (
              <div className="mt-3 rounded-md border bg-muted/30 p-3 text-xs">
                <div className="font-medium">Ready to insert</div>
                <code className="mt-1 block overflow-x-auto rounded bg-background px-2 py-1">
                  {uploadedAttachment.contentType.startsWith("image/")
                    ? `![${uploadedAttachment.fileName}](${uploadedAttachment.url})`
                    : `[${uploadedAttachment.fileName}](${uploadedAttachment.url})`}
                </code>
              </div>
            )}
            {attachmentUploadError && (
              <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                {attachmentUploadError}
              </div>
            )}
          </section>
        </CardContent>
      </Card>

      <Card className="xl:sticky xl:top-20 xl:self-start">
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <label className="block text-xs font-medium">
            Title
            <Input
              className="mt-1"
              value={editableExam.title}
              onChange={(event) => setEditableExam((current) => ({ ...current, title: event.target.value }))}
            />
          </label>
          <label className="block text-xs font-medium">
            Mode
            <Select
              value={editableExam.mode}
              onValueChange={(value) => setEditableExam((current) => ({ ...current, mode: value as Exam["mode"] }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Online">Online</SelectItem>
                <SelectItem value="Paper">Paper</SelectItem>
                <SelectItem value="Mixed">Mixed</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <label className="block text-xs font-medium">
            Start time
            <Input
              className="mt-1"
              type="datetime-local"
              value={toDatetimeLocal(editableExam.startAtUtc)}
              onChange={(event) => setEditableExam((current) => ({ ...current, startAtUtc: fromDatetimeLocal(event.target.value) }))}
            />
          </label>
          <label className="block text-xs font-medium">
            End time
            <Input
              className="mt-1"
              type="datetime-local"
              value={toDatetimeLocal(editableExam.endAtUtc)}
              onChange={(event) => setEditableExam((current) => ({ ...current, endAtUtc: fromDatetimeLocal(event.target.value) }))}
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs font-medium">
              Total marks
              <Input
                className="mt-1"
                min={0}
                type="number"
                value={editableExam.maxMark}
                onChange={(event) => setEditableExam((current) => ({ ...current, maxMark: Number.parseInt(event.target.value, 10) || 0 }))}
              />
            </label>
            <label className="block text-xs font-medium">
              Passing marks
              <Input
                className="mt-1"
                min={0}
                type="number"
                value={editableExam.passingMark}
                onChange={(event) => setEditableExam((current) => ({ ...current, passingMark: Number.parseInt(event.target.value, 10) || 0 }))}
              />
            </label>
          </div>
          <label className="flex items-center justify-between gap-3 rounded-md border bg-background p-3 text-xs font-medium">
            Visible to students
            <Checkbox
              checked={editableExam.isVisible}
              onCheckedChange={(checked) => setEditableExam((current) => ({ ...current, isVisible: checked === true }))}
            />
          </label>
          <label className="flex items-center justify-between gap-3 rounded-md border bg-background p-3 text-xs font-medium">
            Shuffle groups
            <Checkbox
              checked={editableExam.shuffleGroups}
              onCheckedChange={(checked) => setEditableExam((current) => ({ ...current, shuffleGroups: checked === true }))}
            />
          </label>
          <label className="flex items-center justify-between gap-3 rounded-md border bg-background p-3 text-xs font-medium">
            Focus mode
            <Checkbox
              checked={editableExam.focusModeEnabled}
              onCheckedChange={(checked) => setEditableExam((current) => ({ ...current, focusModeEnabled: checked === true }))}
            />
          </label>
          <SettingRow label="Duration" value={`${durationMinutes(editableExam.startAtUtc, editableExam.endAtUtc)} minutes`} />
          <SettingRow label="Date" value={formatDate(editableExam.startAtUtc)} />
          <div className="rounded-md border bg-muted/40 p-3 text-xs leading-5 text-muted-foreground">
            Publishing validates schedule, marks, group randomization, upload limits, and at least one question per visible group.
          </div>
          <Button className="w-full" variant="outline" onClick={() => updateExam({ ...editableExam, groups: editableGroups })}>
            <Save className="size-4" />
            Save Settings
          </Button>
          <Button className="w-full" disabled={isPublishing || exam.isPublished} onClick={confirmPublishCurrentExam}>
            <CheckCircle2 className="size-4" />
            {exam.isPublished ? "Published" : isPublishing ? "Publishing..." : "Publish Exam"}
          </Button>
        </CardContent>
      </Card>
    </div>

    <Sheet open={isSkillSheetOpen} onOpenChange={setIsSkillSheetOpen}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Add Skill To Subject</SheetTitle>
          <SheetDescription>
            Skills become reusable grouping anchors for {exam.subject} exams.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 px-4">
          <label className="block text-xs font-medium">
            Skill name
            <Input
              className="mt-1"
              placeholder="Linear equations"
              value={skillDraft.name}
              onChange={(event) => setSkillDraft((current) => ({ ...current, name: event.target.value }))}
            />
          </label>
          <label className="block text-xs font-medium">
            Description Markdown
            <Textarea
              className="mt-1 min-h-28 font-mono"
              placeholder="Optional instructions or scope for this skill..."
              value={skillDraft.descriptionMarkdown}
              onChange={(event) => setSkillDraft((current) => ({ ...current, descriptionMarkdown: event.target.value }))}
            />
          </label>
          <label className="block text-xs font-medium">
            Display order
            <Input
              className="mt-1"
              min={1}
              type="number"
              value={skillDraft.displayOrder}
              placeholder={(subjectSkills.length + 1).toString()}
              onChange={(event) => setSkillDraft((current) => ({ ...current, displayOrder: event.target.value }))}
            />
          </label>
          {!isSkillDraftValid && (
            <div className="rounded-md border border-muted bg-muted/40 p-3 text-xs text-muted-foreground">
              Add a skill name and a positive display order.
            </div>
          )}
        </div>
        <SheetFooter>
          <Button
            disabled={!isSkillDraftValid || createSubjectSkillMutation.isPending}
            onClick={saveSkill}
          >
            <Plus className="size-4" />
            {createSubjectSkillMutation.isPending ? "Saving..." : "Add Skill"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setIsSkillSheetOpen(false)
              setSkillDraft(defaultSkillDraft)
            }}
          >
            Cancel
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>

    <Sheet open={Boolean(groupSkillDraft)} onOpenChange={(open) => !open && setGroupSkillDraft(null)}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Create Group From Skill</SheetTitle>
          <SheetDescription>
            Configure how questions in this skill group are delivered to students.
          </SheetDescription>
        </SheetHeader>
        {groupSkillDraft && (
          <div className="space-y-4 px-4">
            <div className="rounded-md border bg-muted/30 p-3">
              <div className="font-medium">{groupSkillDraft.skill.name}</div>
              {groupSkillDraft.skill.descriptionMarkdown && (
                <div className="mt-1 text-xs text-muted-foreground">{groupSkillDraft.skill.descriptionMarkdown}</div>
              )}
            </div>
            <label className="block text-xs font-medium">
              Selection policy
              <Select
                value={groupSkillDraft.selectionPolicy}
                onValueChange={(value) =>
                  setGroupSkillDraft((current) =>
                    current ? { ...current, selectionPolicy: value as QuestionGroup["selectionPolicy"] } : current,
                  )
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="show-all">Show all questions</SelectItem>
                  <SelectItem value="pick-random">Pick random questions</SelectItem>
                </SelectContent>
              </Select>
            </label>
            {groupSkillDraft.selectionPolicy === "pick-random" && (
              <label className="block text-xs font-medium">
                Questions to show
                <Input
                  className="mt-1"
                  min={1}
                  type="number"
                  value={groupSkillDraft.questionsToShow}
                  onChange={(event) =>
                    setGroupSkillDraft((current) => current ? { ...current, questionsToShow: event.target.value } : current)
                  }
                />
              </label>
            )}
            <label className="flex items-start gap-3 rounded-md border p-3 text-sm">
              <Checkbox
                checked={groupSkillDraft.shuffleQuestions}
                className="mt-1"
                onCheckedChange={(checked) =>
                  setGroupSkillDraft((current) => current ? { ...current, shuffleQuestions: checked === true } : current)
                }
              />
              <span>
                <span className="block font-medium">Shuffle questions for students</span>
                <span className="text-xs text-muted-foreground">The teacher authoring order stays intact, while each attempt stores its delivered order.</span>
              </span>
            </label>
          </div>
        )}
        <SheetFooter>
          <Button onClick={addGroupFromSkill}>
            <Plus className="size-4" />
            Add Group
          </Button>
          <Button variant="outline" onClick={() => setGroupSkillDraft(null)}>
            Cancel
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
    </>
  )
}

function QuestionAnswerKeyEditor({
  question,
  updateQuestion,
}: {
  question: ExamQuestion
  updateQuestion: (patch: Partial<ExamQuestion>) => void
}) {
  const updateOption = (optionId: number, patch: Partial<ExamQuestion["options"][number]>) => {
    updateQuestion({
      options: question.options.map((option) => (option.id === optionId ? { ...option, ...patch } : option)),
    })
  }

  const addOption = () => {
    const nextOrder = question.options.length + 1
    updateQuestion({
      options: [
        ...question.options,
        {
          id: -Date.now(),
          textMarkdown: `Option ${nextOrder}`,
          isCorrect: false,
          authoringOrder: nextOrder,
        },
      ],
    })
  }

  const ensureTrueFalseOptions = (correctValue: "true" | "false") => {
    updateQuestion({
      options: [
        { id: question.options[0]?.id ?? -Date.now(), textMarkdown: "True", isCorrect: correctValue === "true", authoringOrder: 1 },
        { id: question.options[1]?.id ?? -(Date.now() + 1), textMarkdown: "False", isCorrect: correctValue === "false", authoringOrder: 2 },
      ],
    })
  }

  const updatePair = (pairId: number, patch: Partial<ExamQuestion["matchPairs"][number]>) => {
    updateQuestion({
      matchPairs: question.matchPairs.map((pair) => (pair.id === pairId ? { ...pair, ...patch } : pair)),
    })
  }

  const addPair = () => {
    const nextOrder = question.matchPairs.length + 1
    updateQuestion({
      matchPairs: [
        ...question.matchPairs,
        {
          id: -Date.now(),
          leftMarkdown: `Prompt ${nextOrder}`,
          rightMarkdown: `Match ${nextOrder}`,
          authoringOrder: nextOrder,
        },
      ],
    })
  }

  return (
    <div className="mt-4 rounded-md border bg-muted/20 p-3">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-medium">Answer Key And Grading</div>
          <div className="text-xs text-muted-foreground">Configure the data used for auto-grading or manual review.</div>
        </div>
        <Select
          value={question.difficulty}
          onValueChange={(value) => updateQuestion({ difficulty: value })}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Easy">Easy</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Hard">Hard</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mb-3 grid gap-3 md:grid-cols-2">
        <label className="text-xs font-medium">
          Tags
          <Input
            className="mt-1"
            placeholder="algebra, proofs, chapter-2"
            value={question.tags.join(", ")}
            onChange={(event) =>
              updateQuestion({
                tags: event.target.value
                  .split(",")
                  .map((tag) => tag.trim())
                  .filter(Boolean),
              })
            }
          />
        </label>
        <label className="text-xs font-medium">
          Grading rule
          <Input
            className="mt-1"
            value={question.gradingRule}
            onChange={(event) => updateQuestion({ gradingRule: event.target.value })}
          />
        </label>
      </div>

      {question.type === "MultipleChoice" && (
        <div className="space-y-2">
          {question.options.map((option) => (
            <div key={option.id} className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <Input
                value={option.textMarkdown}
                onChange={(event) => updateOption(option.id, { textMarkdown: event.target.value })}
              />
              <label className="flex items-center gap-2 rounded-md border bg-background px-3 text-xs">
                <Checkbox
                  checked={option.isCorrect}
                  onCheckedChange={(checked) => updateOption(option.id, { isCorrect: checked === true })}
                />
                Correct
              </label>
            </div>
          ))}
          <Button size="sm" type="button" variant="outline" onClick={addOption}>
            <Plus className="size-4" />
            Add option
          </Button>
        </div>
      )}

      {question.type === "TrueFalse" && (
        <Select
          value={question.options.find((option) => option.isCorrect)?.textMarkdown.toLowerCase() === "false" ? "false" : "true"}
          onValueChange={(value) => ensureTrueFalseOptions(value as "true" | "false")}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">True is correct</SelectItem>
            <SelectItem value="false">False is correct</SelectItem>
          </SelectContent>
        </Select>
      )}

      {(question.type === "ShortAnswer" || question.type === "FillInTheBlank") && (
        <label className="text-xs font-medium">
          Accepted answers
          <Textarea
            className="mt-1 min-h-24"
            placeholder="One accepted answer per line"
            value={question.acceptedAnswers.join("\n")}
            onChange={(event) =>
              updateQuestion({
                acceptedAnswers: event.target.value
                  .split("\n")
                  .map((answer) => answer.trim())
                  .filter(Boolean),
              })
            }
          />
        </label>
      )}

      {question.type === "Matching" && (
        <div className="space-y-2">
          {question.matchPairs.map((pair) => (
            <div key={pair.id} className="grid gap-2 sm:grid-cols-2">
              <Input value={pair.leftMarkdown} onChange={(event) => updatePair(pair.id, { leftMarkdown: event.target.value })} />
              <Input value={pair.rightMarkdown} onChange={(event) => updatePair(pair.id, { rightMarkdown: event.target.value })} />
            </div>
          ))}
          <Button size="sm" type="button" variant="outline" onClick={addPair}>
            <Plus className="size-4" />
            Add pair
          </Button>
        </div>
      )}

      {question.type === "Ordering" && (
        <label className="text-xs font-medium">
          Correct order
          <Textarea
            className="mt-1 min-h-24"
            placeholder="One item per line in the correct order"
            value={question.orderingItems.join("\n")}
            onChange={(event) =>
              updateQuestion({
                orderingItems: event.target.value
                  .split("\n")
                  .map((item) => item.trim())
                  .filter(Boolean),
              })
            }
          />
        </label>
      )}

      {question.type === "FileUpload" && (
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-xs font-medium">
            Accepted MIME types
            <Input
              className="mt-1"
              placeholder="application/pdf, image/png"
              value={question.fileUploadRule?.acceptedContentTypes.join(", ") ?? ""}
              onChange={(event) =>
                updateQuestion({
                  fileUploadRule: {
                    acceptedContentTypes: event.target.value
                      .split(",")
                      .map((type) => type.trim())
                      .filter(Boolean),
                    maxSizeBytes: question.fileUploadRule?.maxSizeBytes ?? 10_485_760,
                  },
                })
              }
            />
          </label>
          <label className="text-xs font-medium">
            Max size bytes
            <Input
              className="mt-1"
              min={1}
              type="number"
              value={question.fileUploadRule?.maxSizeBytes ?? 10_485_760}
              onChange={(event) =>
                updateQuestion({
                  fileUploadRule: {
                    acceptedContentTypes: question.fileUploadRule?.acceptedContentTypes ?? ["application/pdf"],
                    maxSizeBytes: Number.parseInt(event.target.value, 10) || 10_485_760,
                  },
                })
              }
            />
          </label>
        </div>
      )}

      {question.type === "Article" && (
        <div className="rounded-md border bg-background p-3 text-xs text-muted-foreground">
          Article questions are manually graded. Use the grading rule field for rubric notes.
        </div>
      )}
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


  function confirmPublishMarks() {
    const confirmed = window.confirm(`Publish marks for "${exam.title}"? Students will be able to view their results.`)

    if (confirmed) {
      publishMarks(exam.id)
    }
  }

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
                  <Input aria-label={`Awarded mark for question ${index + 1}`} id={`mark-${question.id}`} placeholder="Mark" type="number" />
                  <Input aria-label={`Teacher feedback for question ${index + 1}`} id={`feedback-${question.id}`} placeholder="Teacher feedback" />
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
            )
          })}
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
          <Button className="w-full" variant="outline" onClick={confirmPublishMarks}>Publish Marks</Button>
        </CardContent>
      </Card>
    </div>
  )
}
