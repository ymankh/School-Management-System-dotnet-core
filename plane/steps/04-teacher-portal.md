# Step 4: Teacher Portal

Status: `In Progress`

## Goal

Teachers need a complete operational workspace for managing exams from draft to published marks.

## Agenda Status

| Agenda Item | Status | Project Evidence | Remaining Work |
| --- | --- | --- | --- |
| Dashboard metrics | Complete | `MetricCard` displays active exams, drafts, submissions, average score. | Add trend/period metrics later if requested. |
| Search and filters | Complete | Dashboard filters cover search, status, class, subject, date, and mode. | Add frontend interaction tests. |
| Status badges | Complete | Status badge component is used. | None for v1. |
| Dashboard actions | Complete | Preview/edit, duplicate, archive, publish, grading/results actions exist. | Add confirmation for destructive/archive action if needed. |
| Multi-step builder | In Progress | Builder labels steps for content, settings, review. | Make step navigation strict and persist partial draft state clearly. |
| Group/question navigator | Complete | Left area lists groups and questions. | Add reorder UI if required. |
| Question editor | Complete | Body, type, marks, difficulty, tags, grading rule, preview, and per-type answer keys are editable. | Add richer rubric tooling later if needed. |
| Settings panel | Complete | Scheduling, mode, marks, visibility, shuffle, and focus settings are editable. | Add deeper security policy controls later if needed. |
| Question bank | Complete | Bank import has search, type/difficulty filters, target group selection, selected count, and clear import behavior. | Add duplicate behavior tests. |
| Add-from-bank modal | In Progress | Builder has a complete inline add-from-bank panel. | Convert to slide-over/modal presentation if the final design requires it. |
| Exam attachments | In Progress | Attachment upload exists. | Add attachment list, remove action, and insert into Markdown. |
| Grading | Complete | Teacher grading view and `publishMarks` action exist. | Add grading edge-case tests. |

## Acceptance Criteria

- A teacher can create a draft, add groups, add/import questions, configure settings, preview, publish, grade, and publish marks without editing code or static data.
- The builder supports all v1 question types.
- Teacher preview uses the same Markdown/math renderer as the student player.

## Implementation Notes

The teacher portal is functionally broad but still needs UX hardening. The biggest missing pieces are a complete answer-key editor for every type and a real add-from-bank modal workflow.
