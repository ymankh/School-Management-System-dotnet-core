# Step 1: Product Scope And Exam Modes

Status: `In Progress`

## Goal

Create an exam engine that supports teacher-created online, paper, and mixed exams, and student attempt workflows that protect progress and support grading.

## Agenda Status

| Agenda Item | Status | Project Evidence | Remaining Work |
| --- | --- | --- | --- |
| Support online exams | Complete | `ExamMode.Online` exists in backend and frontend types. | Add more end-to-end attempt tests. |
| Support paper exams | Complete | `ExamMode.Paper` exists and dashboard filters support mode. | Add print/export workflow later if required. |
| Support mixed exams | Complete | `ExamMode.Mixed` exists. | Define exact mixed-mode operational rules. |
| Teacher can manage exams | In Progress | Teacher portal has dashboard, builder, bank, grading. | Improve builder completeness and interaction tests. |
| Student can take exams | Complete | Student portal has list, player, review, submit, results, and uses the auth-owned student context. | Keep legacy numeric auth-ID fallback only for older records. |
| Marks are controlled by teacher | Complete | `markPublished` exists and results hide marks before publish. | Add backend visibility tests. |

## Acceptance Criteria

- Teachers can create, edit, preview, publish, archive, duplicate, grade, and publish marks.
- Students can see assigned exams, start/resume attempts, autosave answers, submit, and view published results.
- Paper and mixed exams appear in scheduling and management workflows even if online attempt features apply only to online parts.

## Notes

The current implementation has the core model and UI coverage. The biggest product-scope gap is defining exact mixed-mode behavior for schools that combine paper and online exam sections.
