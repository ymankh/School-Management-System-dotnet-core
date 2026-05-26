# Step 5: Student Portal

Status: `In Progress`

## Goal

Students need a reliable exam-taking experience that makes status clear, saves progress, prevents accidental loss, and shows results only when allowed.

## Agenda Status

| Agenda Item | Status | Project Evidence | Remaining Work |
| --- | --- | --- | --- |
| Exams page tabs | Complete | Student exam list supports upcoming, active, and completed tabs. | Add tests for tab filtering. |
| Exam metadata cards | Complete | Cards show title, subject, class, teacher, date, duration, marks, status. | Improve empty/loading states if needed. |
| Start/resume action | In Progress | Start action calls backend attempt endpoint. | Prove resume flow with tests and authenticated student context. |
| Active player | Complete | Player shows timer, question map, marks/type labels, save/review actions. | Add keyboard/accessibility polish later. |
| Question status indicators | Complete | Answered, unanswered, and flagged states are shown. | Add tests. |
| Focus mode | In Progress | Focus mode badge and reference layout exist. | Define exact restricted-navigation behavior. |
| Review page | Complete | Summary and confirmation-before-submit exist. | Add tests for disabled submit until confirmed. |
| Results page | Complete | Score, time, completion date, feedback, and breakdown exist with hidden marks before publish; backend visibility test covers the rule. | Add richer study-material link display later if needed. |

## Acceptance Criteria

- Students can start or resume without losing already saved answers.
- A browser close or refresh does not erase submitted answers.
- Final submit requires explicit confirmation.
- Results do not reveal grades or feedback until marks are published.

## Implementation Notes

The current student portal meets the main shape of the design. Resume, expiry, and authenticated student context should be prioritized before production use.
