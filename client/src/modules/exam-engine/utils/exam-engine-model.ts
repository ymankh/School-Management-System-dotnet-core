import type { Exam, ExamAttempt, ExamQuestion } from "@/modules/exam-engine/types/exam-engine.types"

export function getExamGroups(exam?: Exam | null) {
  return Array.isArray(exam?.groups) ? exam.groups : []
}

export function getGroupQuestions(group?: Exam["groups"][number]) {
  return Array.isArray(group?.questions) ? group.questions : []
}

export function getExamQuestions(exam?: Exam | null) {
  return getExamGroups(exam).flatMap((group) => getGroupQuestions(group))
}

export function getAttemptQuestions(attempt?: ExamAttempt | null) {
  return Array.isArray(attempt?.questions) ? attempt.questions : []
}

export function getQuestionOptions(question: ExamQuestion) {
  return Array.isArray(question.options) ? question.options : []
}

export function getMatchPairs(question: ExamQuestion) {
  return Array.isArray(question.matchPairs) ? question.matchPairs : []
}

export function getOrderingItems(question: ExamQuestion) {
  return Array.isArray(question.orderingItems) ? question.orderingItems : []
}

export function getOrderingAnswer(question: ExamQuestion, answer: ParsedAnswer | null) {
  return Array.isArray(answer?.items) && answer.items.length > 0 ? answer.items : getOrderingItems(question)
}

export type ParsedAnswer = {
  fileName?: string
  items?: string[]
  pairs?: Record<number, string>
  selectedOptionId?: number
  state?: string
  value?: boolean | string
}

export function parseAnswer(answerJson?: string) {
  if (!answerJson) {
    return null
  }

  try {
    return JSON.parse(answerJson) as ParsedAnswer
  } catch {
    return null
  }
}
