# Exam Engine Plane

This folder stores the working plane for the exam engine. It is intentionally separate from `documentation/exam-engine` so future assessment can compare the original design, the execution steps, and the current implementation status.

## Files

- `steps.md`: the step-by-step agenda and current status summary.
- `status-scan.md`: project scan with evidence from current frontend, backend, tests, and documentation.
- `steps/01-product-scope.md`: scope, modes, roles, and high-level behavior.
- `steps/02-content-rendering.md`: Markdown, images, LaTeX, and content safety.
- `steps/03-data-model.md`: backend entities, DTOs, persistence, and migrations.
- `steps/04-teacher-portal.md`: dashboard, builder, question bank, publishing, and grading.
- `steps/05-student-portal.md`: exam list, player, focus mode, review, submit, and results.
- `steps/06-attempts-autosave-randomization.md`: autosave, resume, locking, and shuffled delivery.
- `steps/07-file-uploads.md`: exam attachments and file-upload answers.
- `steps/08-api-and-react-query.md`: API surface, axios client, and React Query usage.
- `steps/09-testing-and-release.md`: validation, tests, remaining risks, and release readiness.

## Status Legend

- `Complete`: implemented in the project with clear evidence.
- `In Progress`: partially implemented, but missing polish, coverage, or edge-case handling.
- `Not Started`: no clear implementation found in the current scan.

## Current Overall Status

The exam engine is `In Progress`.

The project has a real frontend module, backend module, database-backed domain model, React Query with axios, Markdown/KaTeX rendering, attempt autosave, randomization, file upload endpoints, teacher and student portals, grading, and mark publishing. Remaining work is mostly hardening: stronger tests, complete builder workflows, upload edge-state validation, attempt expiry/locking coverage, and replacement of temporary student ID entry with authenticated user context.
