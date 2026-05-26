# Step 2: Content Rendering

Status: `In Progress`

## Goal

Teachers must be able to create question and exam content with Markdown, images, and LaTeX math. Students must see that content rendered safely and consistently.

## Agenda Status

| Agenda Item | Status | Project Evidence | Remaining Work |
| --- | --- | --- | --- |
| Render Markdown | Complete | `MarkdownContent` uses `react-markdown`. | Keep using one shared renderer everywhere. |
| Support GFM | Complete | `remark-gfm` is configured. | Add UI examples for tables/tasks if needed. |
| Support LaTeX math | Complete | `remark-math` and `rehype-katex` are configured. | Expand tests for display math and teacher examples. |
| Sanitize rendered content | Complete | `rehype-sanitize` with a custom math schema is configured. | Review schema if new embedded content is added. |
| Load KaTeX CSS | Complete | KaTeX package is installed and CSS is available in the app styling path. | Verify final rendered styles in browser during QA. |
| Teacher live preview | In Progress | Builder shows live student preview. | Make preview available for full exam, group instructions, attachments, and answer examples. |
| Image support | Complete | Exam attachments can be uploaded and inserted into question Markdown as image or file links. | Add a richer attachment browser later if needed. |

## Acceptance Criteria

- Inline math such as `$x^2 + y^2 = z^2$` renders as math, not code.
- Block math renders through KaTeX.
- Markdown tables, lists, emphasis, and links render correctly.
- Unsafe raw HTML does not execute.
- Teachers can upload or reference images without manually guessing URLs.

## Implementation Notes

The renderer and authoring loop now cover Markdown, LaTeX, and uploaded image/file insertion. Future work should avoid creating additional Markdown renderers because inconsistent rendering between authoring, player, review, and results will create grading disputes.
