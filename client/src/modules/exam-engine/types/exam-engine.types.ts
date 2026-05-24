export type ExamMode = "Online" | "Paper" | "Mixed"

export type ExamStatus = "Draft" | "Scheduled" | "Active" | "Completed" | "Archived"

export type QuestionType =
  | "MultipleChoice"
  | "TrueFalse"
  | "ShortAnswer"
  | "Article"
  | "FileUpload"
  | "Matching"
  | "Ordering"
  | "FillInTheBlank"

export type GradingStatus =
  | "NotGraded"
  | "AutoGraded"
  | "NeedsManualGrading"
  | "PartiallyGraded"
  | "Graded"

export type AttemptStatus =
  | "InProgress"
  | "Submitted"
  | "Expired"
  | "PartiallyGraded"
  | "Graded"
  | "MarksPublished"

export type QuestionOption = {
  id: number
  textMarkdown: string
  isCorrect: boolean
  authoringOrder: number
}

export type QuestionMatchPair = {
  id: number
  leftMarkdown: string
  rightMarkdown: string
  authoringOrder: number
}

export type FileUploadRule = {
  acceptedContentTypes: string[]
  maxSizeBytes: number
}

export type ExamQuestion = {
  id: number
  groupId: number
  type: QuestionType
  bodyMarkdown: string
  referenceMarkdown: string
  mark: number
  authoringOrder: number
  isRequired: boolean
  difficulty: string
  tags: string[]
  gradingRule: string
  shuffleOptions: boolean
  options: QuestionOption[]
  matchPairs: QuestionMatchPair[]
  orderingItems: string[]
  acceptedAnswers: string[]
  fileUploadRule?: FileUploadRule | null
}

export type QuestionGroup = {
  id: number
  examId: number
  title: string
  instructionsMarkdown: string
  authoringOrder: number
  selectionPolicy: string
  questionsToShow?: number | null
  shuffleQuestions: boolean
  questions: ExamQuestion[]
}

export type SubjectSkill = {
  id: number
  classSubjectId: number
  subject: string
  name: string
  descriptionMarkdown: string
  displayOrder: number
}

export type Exam = {
  id: number
  title: string
  classSubjectId: number
  subject: string
  className: string
  teacherName: string
  mode: ExamMode
  startAtUtc: string
  endAtUtc: string
  maxMark: number
  passingMark: number
  isVisible: boolean
  isPublished: boolean
  markPublished: boolean
  status: ExamStatus
  shuffleGroups: boolean
  focusModeEnabled: boolean
  instructionsMarkdown: string
  studyMaterialsMarkdown: string
  groups: QuestionGroup[]
}

export type ExamSummary = {
  id: number
  title: string
  subject: string
  className: string
  teacherName: string
  mode: ExamMode
  status: ExamStatus
  startAtUtc: string
  endAtUtc: string
  maxMark: number
  isVisible: boolean
  isPublished: boolean
  markPublished: boolean
  questionCount: number
  submissionCount: number
}

export type ExamDashboard = {
  activeExams: number
  drafts: number
  submissions: number
  averageScore: number
  exams: ExamSummary[]
}

export type AttemptQuestion = {
  questionId: number
  deliveredOrder: number
  deliveredOptionOrder: number[]
}

export type StudentAnswer = {
  id: number
  questionId: number
  answerJson: string
  awardedMark: number
  gradingStatus: GradingStatus
  flaggedForReview: boolean
  savedAtUtc: string
  teacherFeedback: string
}

export type ExamAttempt = {
  id: number
  examId: number
  studentId: number
  status: AttemptStatus
  startedAtUtc: string
  submittedAtUtc?: string | null
  totalMark: number
  questions: AttemptQuestion[]
  answers: StudentAnswer[]
}

export type QuestionBankItem = {
  id: number
  subject: string
  ownerName: string
  question: ExamQuestion
}
