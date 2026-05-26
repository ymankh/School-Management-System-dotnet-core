# Step 7: File Uploads

Status: `In Progress`

## Goal

Support file-upload questions and exam attachments with clear validation, recoverable UI states, and saved metadata.

## Agenda Status

| Agenda Item | Status | Project Evidence | Remaining Work |
| --- | --- | --- | --- |
| Exam attachment endpoint | Complete | `POST /api/exams/{id}/attachments` exists. | Add list/remove and Markdown insert support. |
| Attempt answer file endpoint | Complete | `POST /api/attempts/{attemptId}/answers/{questionId}/files` exists and metadata saves are locked after submit. | Add controller-level invalid type/oversize tests later. |
| Empty state | Complete | Student upload state starts as `empty`. | None for v1. |
| Uploading state | Complete | UI sets `uploading` while promise is pending. | Add visual progress percentage if upload progress is wired. |
| Uploaded state | Complete | UI saves uploaded metadata with `state: "uploaded"`. | Add uploaded timestamp display polish. |
| Failed state | Complete | UI sets `failed` on upload error. | Surface backend error message, not only generic failure. |
| Removed state | Complete | UI saves `state: "removed"`. | Decide whether server-side file cleanup is required. |
| Replaced state | Complete | Selecting another file marks the answer as replaced in the UI. | Add server cleanup only if required. |
| Drag/drop | Complete | File-upload questions support drag/drop with accepted type and size messaging. | None for v1. |
| Server content-type validation | Complete | Backend validates against `FileUploadRule.AcceptedContentTypes`. | Add tests. |
| Server size validation | Complete | Backend validates against `FileUploadRule.MaxSizeBytes`. | Add tests. |

## Acceptance Criteria

- Students see accepted file types and maximum size before uploading.
- Invalid type and oversized files are rejected clearly.
- Replacing and removing files updates the saved answer metadata.
- Submitted or expired attempts cannot upload replacement files.

## Implementation Notes

The backend is stronger than the frontend here. The next work should make the UI states explicit and testable.
