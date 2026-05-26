# Step 9: Testing, Review, And Release Readiness

Status: `In Progress`

## Goal

Before production use, prove the engine satisfies the plan with automated tests and a manual QA checklist.

## Agenda Status

| Agenda Item | Status | Project Evidence | Remaining Work |
| --- | --- | --- | --- |
| Backend dashboard tests | Complete | `GetDashboard_AppliesTeacherDashboardFilters` exists. | None for this slice. |
| Backend update persistence tests | Complete | `UpdateExam_PersistsSubmittedQuestionDrafts` exists. | None for this slice. |
| Markdown/math tests | Complete | `markdown-content.test.ts` exists. | Add more display-math cases. |
| Randomization freeze tests | Complete | Tests verify delivered question order is preserved on resume and each student has an independent attempt order. | None for v1. |
| Autosave/resume tests | Complete | Backend test verifies saved progress survives `StartOrResumeAttempt`. | Add frontend resume interaction test later. |
| Attempt lock tests | Complete | Backend tests verify submitted and expired attempts reject later saves. | None for v1. |
| File upload tests | In Progress | Backend test verifies file metadata cannot be saved after submit. | Add controller-level valid upload, invalid type, oversize, replace, and remove tests. |
| Frontend interaction tests | In Progress | Markdown/math unit tests pass. | Add dashboard, builder, player, review, and results tests. |
| Manual QA checklist | In Progress | Automated frontend/backend checks pass. | Run full browser QA before production release. |

## Release Checklist

- Build backend successfully. Done with `dotnet build SchoolSystemTask.slnx --no-restore`.
- Build frontend successfully. Done with `npm run build`.
- Run backend tests. Done with `dotnet test tests\SchoolSystemTask.Tests\SchoolSystemTask.Tests.csproj`.
- Run frontend lint/tests. Done with `npm run lint` and `TMPDIR=/tmp npm test`.
- Manually verify teacher dashboard filters and actions.
- Manually verify Markdown, images, and LaTeX display in builder and player.
- Manually verify start, autosave, refresh/resume, review, submit, and result visibility.
- Manually verify upload success, invalid type, oversize, replace, remove, and submit lock.
- Confirm no static demo data is required for normal flows.

## Implementation Notes

The plan is documented, but release readiness is not complete until the missing test areas are covered.
