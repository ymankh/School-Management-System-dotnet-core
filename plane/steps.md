# Exam Engine Step Plan

## Step 1: Product Scope And Exam Modes

Status: `In Progress`

Goal: define and support online, paper, and mixed exams for teachers and students.

Agenda:

| Item | Status | Notes |
| --- | --- | --- |
| Online exam mode | Complete | `ExamMode.Online` exists in backend and frontend types. |
| Paper exam mode | Complete | `ExamMode.Paper` exists and dashboard filters include mode. |
| Mixed exam mode | Complete | `ExamMode.Mixed` exists in backend and frontend types. |
| Teacher role flow | In Progress | Teacher portal exists; full role/auth integration still needs assessment. |
| Student role flow | Complete | Student portal uses authenticated `studentId` when available and falls back to numeric auth ID for older records. |
| Full product documentation | Complete | `documentation/exam-engine/README.md` and this folder store the plan. |

Detail file: `steps/01-product-scope.md`

## Step 2: Content Rendering

Status: `In Progress`

Goal: allow teachers to author exam content with Markdown, images, and LaTeX math, and display it safely to students.

Agenda:

| Item | Status | Notes |
| --- | --- | --- |
| React Markdown package usage | Complete | `react-markdown`, `remark-gfm`, `remark-math`, `rehype-katex`, and `rehype-sanitize` are used. |
| KaTeX CSS loaded | Complete | `katex/dist/katex.min.css` is present in frontend styling path. |
| Markdown rendering component | Complete | `MarkdownContent` renders Markdown and math. |
| Sanitized rendering | Complete | `rehype-sanitize` with schema is used. |
| Teacher live preview | In Progress | Builder has live student preview; authoring controls need more polish. |
| Image/attachment insert workflow | Complete | Exam attachment upload returns a URL, shows the Markdown snippet, and can insert image/link Markdown into questions. |

Detail file: `steps/02-content-rendering.md`

## Step 3: Data Model And Persistence

Status: `In Progress`

Goal: persist exams, groups, questions, attempts, answers, attachments, and question-bank items.

Agenda:

| Item | Status | Notes |
| --- | --- | --- |
| Exam entity | Complete | Backend `Exam` model exists. |
| Question groups | Complete | Backend and frontend group models exist. |
| All v1 question types | Complete | Enum/types include all requested v1 types. |
| Attempt questions freeze order | Complete | `AttemptQuestion` stores delivered order and option order. |
| Student answers | Complete | `StudentAnswer` stores answer JSON, marks, status, flag, feedback, and save time. |
| Attachments and file rules | Complete | `ExamAttachment` and `FileUploadRule` exist. |
| EF Core persistence | Complete | Exam migration and `ApplicationDbContext` integration exist. |
| Rich policy fields | In Progress | Some scheduling/security/attempt policy fields are still light. |

Detail file: `steps/03-data-model.md`

## Step 4: Teacher Portal

Status: `In Progress`

Goal: give teachers a dashboard, builder, question bank, preview, publishing, and grading workflow.

Agenda:

| Item | Status | Notes |
| --- | --- | --- |
| Exam dashboard metrics | Complete | Active exams, drafts, submissions, and average score are displayed. |
| Dashboard filters | Complete | Search, status, class, subject, date, and mode filters exist. |
| Dashboard actions | Complete | Preview/edit, duplicate, archive, publish, and results/grading actions exist. |
| Multi-step builder | In Progress | Builder shows steps and panels, but needs stronger step-state workflow. |
| Left group/question navigator | Complete | Builder lists groups and questions. |
| Center editor and preview | Complete | Question editing, live preview, image insertion, and per-type answer-key editing exist. |
| Right settings panel | Complete | Builder can edit title, mode, schedule, marks, visibility, shuffle, and focus settings. |
| Question bank module | Complete | Bank import includes search, type/difficulty filters, target group selection, and selected count. |
| Add-from-bank modal | In Progress | Import flow is complete as an inline builder panel; slide-over/modal presentation is still optional polish. |
| Grading and mark publishing | Complete | Teacher grading and mark publishing exist. |

Detail file: `steps/04-teacher-portal.md`

## Step 5: Student Portal

Status: `In Progress`

Goal: let students find exams, take/resume attempts, review, submit, and view feedback after marks are published.

Agenda:

| Item | Status | Notes |
| --- | --- | --- |
| Upcoming/active/completed exam tabs | Complete | Student exam list has these tabs. |
| Exam cards with metadata | Complete | Cards show title, subject, class, teacher, date, duration, marks, and status. |
| Start/resume | In Progress | Start flow exists; resume behavior depends on backend attempt lookup. |
| Active player | Complete | Player has timer, map, save/exit/review controls, labels, and autosave actions. |
| Focus mode | In Progress | Focus badge and split/reference layout exist; behavior needs review. |
| Review before submit | Complete | Review page requires confirmation before final submit. |
| Results visibility | Complete | Results hide marks until `markPublished`. |
| Results breakdown | Complete | Breakdown and feedback exist, and backend tests prove marks are hidden until published. |

Detail file: `steps/05-student-portal.md`

## Step 6: Attempts, Autosave, Randomization, And Locking

Status: `In Progress`

Goal: protect student progress and prevent question-order cheating.

Agenda:

| Item | Status | Notes |
| --- | --- | --- |
| Autosave per question | Complete | `PUT /api/attempts/{attemptId}/answers/{questionId}` exists and frontend calls it. |
| Progress survives refresh/reconnect | In Progress | Backend persists answers; frontend resume path needs more coverage. |
| Freeze delivered question order | Complete | Backend stores attempt question order. |
| Shuffle groups/questions/options | Complete | Backend randomization helpers exist. |
| Flag for review | Complete | Student answers store and display flagged state. |
| Submitted/expired lock | In Progress | Lock checks exist, but tests and expiry UX need completion. |
| Auto-submit on expiry | Complete | Player has a live countdown and submits with `expired=true` when the time window ends. |

Detail file: `steps/06-attempts-autosave-randomization.md`

## Step 7: File Uploads

Status: `In Progress`

Goal: support exam attachments and file-upload answers with safe validation and recoverable UI states.

Agenda:

| Item | Status | Notes |
| --- | --- | --- |
| Exam attachment upload | Complete | `POST /api/exams/{id}/attachments` exists. |
| Attempt file answer upload | Complete | `POST /api/attempts/{attemptId}/answers/{questionId}/files` exists. |
| Server validation by question rule | Complete | Backend checks accepted content types and max size. |
| Empty/uploading/uploaded/failed/removed states | Complete | UI shows empty, uploading, uploaded, failed, replaced, and removed states. |
| Drag/drop upload | Complete | File-upload answers accept drag/drop and browse upload. |
| Replace/remove states | Complete | Selecting a new file marks replacement and remove saves a removed answer state. |

Detail file: `steps/07-file-uploads.md`

## Step 8: API Surface, Axios, And React Query

Status: `Complete`

Goal: fetch and mutate exam data using axios and React Query.

Agenda:

| Item | Status | Notes |
| --- | --- | --- |
| Axios client | Complete | `exam-engine-api.ts` uses axios. |
| React Query provider | Complete | `client/src/app/providers.tsx` wires QueryClient. |
| Dashboard query | Complete | Teacher dashboard uses `useQuery`. |
| Student exams query | Complete | Student exams use `useQuery`. |
| Mutations | Complete | Attempts, answers, uploads, publish, archive, duplicate, grading, and marks use `useMutation`. |
| API error handling | Complete | Request wrapper converts axios errors and response normalizers prevent missing arrays from crashing the UI. |
| Error boundaries | Complete | Shared `ErrorBoundary` exists and active exam page imports it. |

Detail file: `steps/08-api-and-react-query.md`

## Step 9: Testing, Review, And Release Readiness

Status: `In Progress`

Goal: prove the engine meets the requirements and can be changed safely.

Agenda:

| Item | Status | Notes |
| --- | --- | --- |
| Backend store tests | In Progress | Current tests cover dashboard filters and update persistence. |
| Markdown/math tests | Complete | `markdown-content.test.ts` exists. |
| Randomization tests | Complete | Tests verify resumed attempts preserve the frozen delivered order and each student attempt keeps its own order. |
| Attempt locking tests | Complete | Submitted and expired attempts reject later answer saves. |
| File upload tests | In Progress | File-upload metadata save is locked after submit. Controller-level invalid type/oversize tests remain. |
| Frontend interaction tests | In Progress | Markdown/math unit tests pass. Dashboard, builder, player, and submit interaction tests remain. |
| Release checklist | In Progress | Frontend lint/build/tests and backend build/tests pass; manual browser QA remains. |

Detail file: `steps/09-testing-and-release.md`
