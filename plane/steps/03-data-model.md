# Step 3: Data Model And Persistence

Status: `In Progress`

## Goal

Store all exam engine data in a durable schema that supports authoring, attempts, autosave, grading, uploads, and reusable question-bank content.

## Agenda Status

| Agenda Item | Status | Project Evidence | Remaining Work |
| --- | --- | --- | --- |
| Exam model | Complete | Backend `Exam` has title, class subject, mode, time window, marks, publish flags, status, shuffle, focus, instructions, materials. | Add richer attempt/security policy fields. |
| Question groups | Complete | `QuestionGroup` has instructions, authoring order, selection policy, questions-to-show, shuffle. | Validate possible mark totals for random subsets. |
| Question model | Complete | `ExamQuestion` supports type, Markdown, reference, mark, required flag, difficulty, tags, grading rule, options, pairs, ordering, accepted answers, upload rule. | Add rubric model if manual grading grows. |
| Question bank | Complete | `QuestionBankItem` stores subject, owner, and reusable question. | Decide shared-edit versus import-copy behavior long term. |
| Attachments | Complete | `ExamAttachment` model exists. | Add attachment ownership/access policy. |
| Attempt model | Complete | `ExamAttempt` stores status, timestamps, total mark, delivered questions, and answers. | Add explicit duration/expiry policy fields if needed. |
| Answer model | Complete | `StudentAnswer` stores answer JSON, awarded mark, grading status, flag, saved time, feedback. | Add answer version/history only if audit requirements demand it. |
| Database migration | Complete | Exam engine migration exists under `server/Migrations`. | Add migration tests or schema checks if project adopts them. |

## Acceptance Criteria

- No exam attempt depends on frontend memory to preserve question order or answers.
- Every answer can be saved independently.
- The exact delivered order can be reconstructed later for review, grading, and disputes.
- Uploaded file metadata is stored with the answer, not only on disk.

## Implementation Notes

The current model already matches the major design. Remaining model work is policy depth, not basic exam storage.
