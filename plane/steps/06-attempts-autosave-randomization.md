# Step 6: Attempts, Autosave, Randomization, And Locking

Status: `In Progress`

## Goal

Student attempts must be durable and fair. Randomized delivery should reduce cheating while preserving each student's exact delivered order for grading and review.

## Agenda Status

| Agenda Item | Status | Project Evidence | Remaining Work |
| --- | --- | --- | --- |
| Create or resume attempt | Complete | Backend `StartOrResumeAttempt` exists. | Add tests proving resumed attempt keeps saved state. |
| Autosave one answer at a time | Complete | `SaveAnswer` endpoint stores by attempt and question. | Add frontend retry/offline messaging later. |
| Persist saved answers | Complete | `StudentAnswer` persists answer JSON and save timestamp. | Add answer conflict policy if multiple tabs are supported. |
| Freeze question order | Complete | `AttemptQuestion` stores delivered order, and tests verify resume keeps each attempt order. | None for v1. |
| Freeze option order | Complete | `DeliveredOptionOrder` stores delivered option order. | Add deeper option-order tests later if needed. |
| Shuffle groups/questions/options | Complete | Backend randomization helper methods exist and attempt-order invariants are covered. | None for v1. |
| Flag for review | Complete | `flaggedForReview` is saved and displayed. | Add tests. |
| Lock submitted attempts | Complete | `CanSaveAnswer` and `SaveAnswer` reject submitted attempts, with backend test coverage. | None for v1. |
| Lock expired attempts | Complete | Expired submit status, frontend auto-submit, and backend expired-save locking test exist. | None for v1. |

## Acceptance Criteria

- Saving one question does not require posting the full exam.
- Submitted and expired attempts reject later answer changes.
- Randomization never changes a student's delivered exam after the attempt starts.
- Review and results use delivered order, not teacher authoring order.

## Implementation Notes

The core persistence logic is present. The status stays `In Progress` because the most important protection rules need focused tests.
