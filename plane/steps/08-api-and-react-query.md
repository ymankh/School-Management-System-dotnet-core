# Step 8: API Surface, Axios, And React Query

Status: `Complete`

## Goal

All exam-engine database interactions should go through API functions backed by axios and consumed through React Query queries and mutations.

## Agenda Status

| Agenda Item | Status | Project Evidence | Remaining Work |
| --- | --- | --- | --- |
| Axios client | Complete | `client/src/modules/exam-engine/api/exam-engine-api.ts` creates an axios instance. | None for v1. |
| Request error wrapper | Complete | API wrapper converts axios failures to `Error` and normalizes missing arrays before the UI reads them. | Improve user-facing error panels over time. |
| React Query provider | Complete | App providers include React Query. | None for v1. |
| Teacher dashboard query | Complete | `getExamDashboard` is used with `useQuery`. | None for v1. |
| Student exams query | Complete | `getStudentExams` is used with `useQuery`. | None for v1. |
| Question bank query | Complete | `getQuestionBank` is used with `useQuery`. | None for v1. |
| Mutations | Complete | Attempts, answers, upload, update, import, publish, archive, duplicate, grade, and marks publishing use mutation functions. | None for v1. |
| API endpoint coverage | Complete | Backend endpoints match the design API surface. | Add OpenAPI docs later if desired. |
| Error boundary protection | Complete | Shared `ErrorBoundary` exists and is used by app/exam page. | Add smaller component-level boundaries as needed. |

## Acceptance Criteria

- No exam-engine frontend feature depends on static demo data.
- Fetching and mutations are centralized in the module API file.
- Server failures do not crash the full app.
- API responses are invalidated or patched in React Query after mutations.

## Implementation Notes

This step is marked complete for the current plan. Future cleanup may normalize API responses more defensively, but the requested axios and React Query foundation is present.
