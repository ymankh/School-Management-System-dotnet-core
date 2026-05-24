# Exam Engine Implementation Progress

This file tracks exam-engine work against `documentation/exam-engine/README.md` so future sessions can resume without re-reading the whole codebase.

## Working Rules

- Keep implementation inside the owning module:
  - Frontend: `client/src/modules/exam-engine`
  - Backend: `server/Modules/Exams`
  - Tests: `tests/SchoolSystemTask.Tests/Modules/Exams` and focused frontend tests
- Keep routes/controllers thin. Business rules stay in module application/domain code.
- After each completed feature slice, run a review agent and record the result here.
- Do not overwrite unrelated working-tree changes.

## Requirement Status

| Area | Requirement | Status | Notes |
| --- | --- | --- | --- |
| Content | Markdown, GFM, math, KaTeX, sanitize | Done | `MarkdownContent` component and tests exist. |
| Data model | Exams, groups, questions, options, attempts, answers | Partial | Exam engine now uses EF Core `ApplicationDbContext` tables with a checked-in migration schema path. |
| Teacher dashboard | Search, filters, metrics, statuses, actions | Partial | Search covers teacher metadata; status/class/subject/date/type filters and selected-row actions are implemented. Remaining work: richer preview behavior and frontend interaction tests. |
| Exam builder | Multi-step content/settings/review, navigator, preview, settings | Partial | Builder UI exists; completeness review still needed. |
| Question groups | Title, instructions, selection policy, shuffle, summary | Partial | Backend and UI support basic groups. |
| Question bank | Search/filter reusable questions, import/duplicate | Partial | Bank API/UI exists; filters and modal flow need review. |
| Settings/scheduling | Mode, dates, duration, visibility, publishing, shuffle, uploads, security | Partial | Core settings exist; duration/security policy still need review. |
| Student exams | Upcoming/active/completed tabs and cards | Partial | Student portal loads exams for an entered student ID from DB-backed assignments/attempts; exact tab/status behavior needs review. |
| Exam player | Timer, save/exit, map, answer states, autosave, lock | Partial | Player exists; locking/expiry and UX completeness need review. |
| Focus mode | Reduced navigation, split layout, same autosave | Partial | Focus mode UI exists; behavior needs review. |
| File upload answer | Empty/uploading/uploaded/failed/replaced/removed states | Partial | Upload exists; full explicit state workflow needs review. |
| Review/submit | Summary, continue, confirmation, lock attempt | Partial | Review page exists; confirmation/lock behavior needs review. |
| Results | Published marks only, score, feedback, breakdown | Partial | Results exist; visibility and feedback completeness need review. |
| Randomization | Freeze delivered order and option order per attempt | Partial | EF-backed store builds and persists attempt order; tests need expansion. |
| Grading | Auto/manual grading and mark publishing | Partial | Store grading exists; edge-case tests need expansion. |
| Frontend architecture | Thin pages, module components, module utilities/types | Partial | `ExamEnginePage` is now orchestration-only; teacher/student/shared UI and helpers are split into module folders. More granular builder subcomponents may still be useful as the builder grows. |

## Completed Feature Slices

- 2026-05-24: Completed teacher dashboard filter slice.
  - Added dashboard filtering by class, subject, date, and exam type in the teacher UI.
  - Added backend dashboard query filters for class, subject, UTC date bucket, and exam mode.
  - Extended dashboard search to include teacher metadata.
  - Fixed dashboard row actions so edit/preview/results load the selected exam before switching panels.
  - Added backend store coverage for combined dashboard filters and teacher metadata search.
- 2026-05-25: Removed static/demo exam-engine data sources.
  - Removed frontend demo exam, attempt, dashboard, question-bank, and mutation fallbacks.
  - Replaced singleton seeded `ExamEngineStore` with scoped EF-backed access through `ApplicationDbContext`.
  - Added exam-engine DbSets/model configuration for exams, groups, questions, attempts, answers, assignments, attachments, and question bank items.
  - Removed automatic frontend fetch of hardcoded exam `1`.
  - Replaced hardcoded student `1` calls with student ID supplied through UI state.
  - Replaced server-generated teacher/owner metadata with request-owned values.
  - Made file answer upload validation use the question's DB-backed `FileUploadRule`.
  - Removed hardcoded result feedback/time text and now renders attempt timestamps plus stored answer feedback.
- 2026-05-25: Split the massive exam-engine page into module-owned frontend files.
  - Reduced `client/src/modules/exam-engine/pages/exam-engine-page.tsx` from 2137 lines to 342 lines.
  - Moved teacher dashboard, builder, question bank, grading, and subject-skill UI into `components/teacher-portal.tsx`.
  - Moved student exam list, player, answer inputs, review, and results into `components/student-portal.tsx`.
  - Moved shared UI primitives into `components/exam-engine-shared.tsx`.
  - Moved date/time/filter helpers into `utils/exam-engine-formatters.ts`.
  - Moved safe exam/attempt/question accessors and answer parsing into `utils/exam-engine-model.ts`.
  - Moved page-panel route state aliases into `types/exam-engine-ui.types.ts`.
  - Added a DB-backed completed-attempt read endpoint so completed student result cards load stored exam/attempt data instead of relying on in-memory state.
  - Verified with `npm run build` and `TMPDIR=/tmp npm test`.
  - Backend build could not be completed from WSL because Windows `dotnet.exe` failed before MSBuild with `UtilBindVsockAnyPort: socket failed 1`.

## Next Feature Queue

1. Review and tighten exam-builder requirements against the design document.
2. Add missing backend tests for attempt locking, randomization freeze, and grading.
3. Complete explicit file-upload answer state transitions.
4. Complete student result visibility around `markPublished`.
5. Add frontend interaction tests for teacher dashboard filters and row actions.
6. Replace temporary student-ID entry with authenticated student context once authentication is wired into the exam engine.

## Review Log

- 2026-05-24: Review agent `McClintock` failed the first dashboard-filter pass.
  - Findings: row actions opened the wrong active exam, backend search missed teacher metadata, frontend/backend date filters used different day bases, and this progress file was stale.
  - Fixes applied in the same slice.
- 2026-05-24: Review agent `Gibbs` failed the second dashboard-filter pass.
  - Finding: dashboard filter UI still filtered locally instead of driving the backend filter API.
  - Fix applied by lifting filter state into the page query and calling `getExamDashboard(dashboardFilters)`.
- 2026-05-24: Review agent `Wegener` passed the final dashboard-filter review with no remaining scoped findings.
- 2026-05-25: Review agent `Linnaeus` failed the first static-data removal pass.
  - Findings: hardcoded exam `1`, hardcoded student `1`, server-generated teacher/owner metadata, no schema path, hardcoded results content, hardcoded file upload rules, and stale progress docs.
  - Fixes applied in the same slice; final re-review pending.
- 2026-05-25: Review agent `Newton` failed the second static-data removal pass.
  - Findings: hardcoded countdown, client-expanded file picker rules, static add-group payload, static local question draft defaults, runtime-only schema path, and stale progress docs.
  - Fixes applied by deriving countdown from exam end time, using DB MIME rules directly, removing static add-group/question draft persistence paths, adding a checked-in migration, and updating this progress file.
- 2026-05-25: Review agent `Volta` passed the final static-data removal review with no remaining scoped findings.
- 2026-05-25: Review agent `Helmholtz` passed the frontend architecture split direction and found two scoped risks.
  - Findings: `ExamBuilder` used a fresh fallback `groups` array as an effect dependency, and completed student result cards switched panels without loading stored exam/attempt data.
  - Fixes applied in the same slice by memoizing exam groups and adding `GET /api/students/{studentId}/exams/{id}/attempt` plus frontend result loading.
