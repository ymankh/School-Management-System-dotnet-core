# Exam Engine Project Status Scan

Scan date: 2026-05-26

## Scope

This scan reviewed the current project files under:

- `client/src/modules/exam-engine`
- `server/Modules/Exams`
- `server/Data/ApplicationDbContext.cs`
- `server/Migrations`
- `tests/SchoolSystemTask.Tests/Modules/Exams`
- `documentation/exam-engine`

## Frontend Evidence

| Area | Evidence | Status |
| --- | --- | --- |
| Active exam module | `client/src/modules/exam-engine/index.ts` exports `ExamPortalPage`. | Complete |
| Portal orchestration | `pages/exam-portal-page.tsx` uses React Query queries/mutations and routes teacher/student panels. | Complete |
| Teacher portal | `components/teacher-portal.tsx` contains dashboard, builder, bank, and grading views. | In Progress |
| Student portal | `components/student-portal.tsx` contains overview, exam list, player, review, upload answer, and results. | In Progress |
| Markdown and LaTeX | `components/markdown-content.tsx` uses `react-markdown`, `remark-gfm`, `remark-math`, `rehype-katex`, and `rehype-sanitize`. | Complete |
| Error boundaries | `client/src/shared/components/error-boundary.tsx` exists and exam portal imports `ErrorBoundary`. | Complete |
| Safe model helpers | `utils/exam-engine-model.ts` provides safe accessors for groups, questions, options, matching pairs, and answers. | Complete |
| Axios API client | `api/exam-engine-api.ts` uses axios with a request wrapper. | Complete |
| React Query | `exam-portal-page.tsx` uses `useQuery`, `useMutation`, and `useQueryClient`. | Complete |

## Backend Evidence

| Area | Evidence | Status |
| --- | --- | --- |
| Domain entities | `server/Modules/Exams/Domain/ExamModels.cs` defines exams, groups, questions, options, match pairs, attachments, attempts, answers, and bank items. | Complete |
| All v1 types | `QuestionType` enum includes multiple choice, true/false, short answer, article, file upload, matching, ordering, and fill in the blank. | Complete |
| API endpoints | `server/Modules/Exams/Api/ExamsController.cs` exposes dashboard, exam CRUD/update, groups, import, attachments, preview, publish, archive, duplicate, attempts, answers, upload, submit, grading, and mark publishing. | Complete |
| Question bank API | `server/Modules/Exams/Api/QuestionBankController.cs` exists. | Complete |
| Persistence | `server/Migrations/20260525003753_AddExamEngineTables.cs` exists for the exam engine. | Complete |
| Autosave | `SaveAnswer` and answer endpoint save one question answer at a time. | Complete |
| Randomization freeze | `AttemptQuestion` stores delivered order and option order. | Complete |
| Upload validation | Attempt file endpoint checks content type and max size from DB-backed file rule. | Complete |
| Grading | Store has auto-grading, manual grading, and mark publishing paths. | In Progress |

## Test Evidence

| Area | Evidence | Status |
| --- | --- | --- |
| Backend exam tests | `tests/SchoolSystemTask.Tests/Modules/Exams/ExamEngineStoreTests.cs` exists. | In Progress |
| Dashboard filter coverage | Test `GetDashboard_AppliesTeacherDashboardFilters` exists. | Complete |
| Exam update coverage | Test `UpdateExam_PersistsSubmittedQuestionDrafts` exists. | Complete |
| Markdown/math tests | `client/src/modules/exam-engine/components/markdown-content.test.ts` exists and passes. | Complete |
| Attempt locking coverage | Submitted and expired save locking tests exist. | Complete |
| Randomization freeze coverage | Tests verify resume order and independent student attempt orders. | Complete |
| File upload validation coverage | Store-level upload metadata locking test exists; controller validation tests remain. | In Progress |

## Current Gap List

1. Complete frontend interaction tests for teacher dashboard filters, builder edits, bank import, student player, review submit, and results visibility.
2. Add backend tests for randomization freeze, attempt resume, submitted/expired locking, auto-submit expiry, and mark visibility.
3. Strengthen file-upload UX with drag/drop, explicit replaced state, progress display, and tests for invalid type and oversize.
4. Make the teacher builder a stricter multi-step workflow instead of mostly a dense all-in-one editor.
5. Replace temporary student ID entry with authenticated student context once auth integration is ready.
6. Add richer attempt policy and security/focus settings, including explicit duration and expiry behavior.
