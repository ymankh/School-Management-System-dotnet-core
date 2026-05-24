import type { ExamSummary } from "@/modules/exam-engine/types/exam-engine.types"

export function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
}

export function matchesDashboardDateFilter(exam: ExamSummary, filter: string) {
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

export function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((left, right) => left.localeCompare(right))
}

function utcDateKey(value: string) {
  return new Date(value).toISOString().slice(0, 10)
}

export function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(new Date(value))
}

export function durationMinutes(start: string, end: string) {
  return Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000))
}

export function formatRemainingTime(end: string) {
  const remainingMs = Math.max(0, new Date(end).getTime() - Date.now())
  const totalSeconds = Math.floor(remainingMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")} remaining`
}
