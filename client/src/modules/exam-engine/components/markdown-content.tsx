import Markdown from "react-markdown"
import rehypeKatex from "rehype-katex"
import rehypeSanitize, { defaultSchema } from "rehype-sanitize"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"

import { cn } from "@/shared/lib/utils"

type MarkdownContentProps = {
  content: string
  className?: string
}

const mathSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [
      ...(defaultSchema.attributes?.code ?? []),
      ["className", "language-math", "math-inline", "math-display"],
    ],
    span: [
      ...(defaultSchema.attributes?.span ?? []),
      ["className", "katex", "katex-mathml", "katex-html"],
      "aria-hidden",
      "style",
    ],
  },
}

function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <div
      className={cn(
        "exam-markdown max-w-none text-sm leading-6 text-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_table]:w-full [&_td]:border [&_td]:p-2 [&_th]:border [&_th]:p-2",
        className,
      )}
    >
      <Markdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[[rehypeSanitize, mathSchema], rehypeKatex]}>
        {content}
      </Markdown>
    </div>
  )
}

export { MarkdownContent }
