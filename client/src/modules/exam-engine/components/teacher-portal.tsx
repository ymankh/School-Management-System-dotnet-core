import { useEffect, useMemo, useState } from "react"
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
  Exam,
  ExamDashboard,
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
import { Input } from "@/shared/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"

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

export function TeacherPortal({
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
  const groups = useMemo(() => getExamGroups(exam), [exam.groups])
  const [editableGroups, setEditableGroups] = useState<QuestionGroup[]>(() => getExamGroups(exam))
  const [selectedBankItems, setSelectedBankItems] = useState<number[]>([])
  const [attachment, setAttachment] = useState<File | null>(null)
  const queryClient = useQueryClient()
  const subjectSkillsQuery = useQuery({
    queryKey: ["subject-skills", exam.classSubjectId],
    queryFn: () => getSubjectSkills(exam.classSubjectId),
  })
  const createSubjectSkillMutation = useMutation({
    mutationFn: createSubjectSkill,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["subject-skills", exam.classSubjectId] })
    },
  })
  const subjectSkills = subjectSkillsQuery.data ?? []

  useEffect(() => {
    setEditableGroups(groups)
  }, [exam.id, groups])

  const addSkill = () => {
    const name = window.prompt(`${exam.subject} skill name`)
    if (!name?.trim()) {
      return
    }

    const descriptionMarkdown = window.prompt("Skill description Markdown") ?? ""
    const displayOrderInput = window.prompt("Display order")
    const displayOrder = displayOrderInput ? Number.parseInt(displayOrderInput, 10) : subjectSkills.length + 1

    createSubjectSkillMutation.mutate({
      classSubjectId: exam.classSubjectId,
      subject: exam.subject,
      name: name.trim(),
      descriptionMarkdown,
      displayOrder: Number.isInteger(displayOrder) ? displayOrder : subjectSkills.length + 1,
    })
  }

  const addGroupFromSkill = (skill: SubjectSkill) => {
    const selectionPolicyInput = window.prompt(`Selection policy for ${skill.name}: show-all or pick-random`)
    const selectionPolicy = selectionPolicyInput === "pick-random" ? "pick-random" : "show-all"
    const questionsToShowInput = selectionPolicy === "pick-random" ? window.prompt("Questions to show") : null
    const parsedQuestionsToShow = questionsToShowInput ? Number.parseInt(questionsToShowInput, 10) : Number.NaN
    const shuffleQuestions = window.confirm(`Shuffle questions in ${skill.name}?`)

    setEditableGroups((currentGroups) => [
      ...currentGroups,
      {
        id: -Date.now(),
        examId: exam.id,
        title: skill.name,
        instructionsMarkdown: skill.descriptionMarkdown,
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
          <div className="rounded-md border bg-background p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="text-sm font-medium">Subject Skills</div>
              <Button variant="outline" size="sm" onClick={addSkill}><Plus className="size-4" /> Skill</Button>
            </div>
            <div className="space-y-2">
              {subjectSkills.map((skill) => (
                <button
                  key={skill.id}
                  className="w-full rounded border px-2 py-1 text-left text-xs hover:bg-muted"
                  type="button"
                  onClick={() => addGroupFromSkill(skill)}
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
          <Button className="w-full" variant="outline" onClick={() => publishMarks(exam.id)}>Publish Marks</Button>
        </CardContent>
      </Card>
    </div>
  )
}
