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
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    "annotation",
    "math",
    "mfrac",
    "mi",
    "mn",
    "mo",
    "mrow",
    "msqrt",
    "msup",
    "munder",
    "semantics",
  ],
  attributes: {
    ...defaultSchema.attributes,
    code: [
      ...(defaultSchema.attributes?.code ?? []),
      ["className", /^language-math$/, /^math-display$/, /^math-inline$/],
    ],
    annotation: ["encoding"],
    div: [...(defaultSchema.attributes?.div ?? []), ["className", /^math-display$/, /^katex-display$/]],
    math: [["xmlns", "http://www.w3.org/1998/Math/MathML"]],
    span: [
      ...(defaultSchema.attributes?.span ?? []),
      [
        "className",
        /^base$/,
        /^delimsizing$/,
        /^frac-line$/,
        /^katex$/,
        /^katex-html$/,
        /^katex-mathml$/,
        /^mclose$/,
        /^mopen$/,
        /^mord$/,
        /^mrel$/,
        /^mspace$/,
        /^mfrac$/,
        /^mtight$/,
        /^nulldelimiter$/,
        /^pstrut$/,
        /^reset-size\d+$/,
        /^sizing$/,
        /^size\d+$/,
        /^sqrt$/,
        /^sqrt-line$/,
        /^strut$/,
        /^vlist$/,
        /^vlist-r$/,
        /^vlist-s$/,
        /^vlist-t$/,
      ],
      "aria-hidden",
    ],
  },
}

function normalizeMathMarkdown(content: string) {
  return content
    .replace(/`(\$[^`\n]+\$)`/g, "$1")
    .replace(/`\$([^`\n]+)`/g, (_match, value: string) => `$${value}$`)
    .replace(/`(\\\([^`\n]+\\\))`/g, "$1")
    .replace(/`(\\\[[\s\S]*?\\\])`/g, "$1")
    .replace(/`([^`\n]+)`/g, (match, value: string) => {
      if (!looksLikeMath(value)) {
        return match
      }

      return `$${value}$`
    })
}

function looksLikeMath(value: string) {
  const trimmed = value.trim()

  if (!trimmed || trimmed.includes(" ")) {
    return false
  }

  return /\\[a-zA-Z]+|[a-zA-Z0-9][\^_][a-zA-Z0-9{]|\d\s*[+\-*/=]\s*\d|[{}]/.test(trimmed)
}

function MarkdownContent({ content, className }: MarkdownContentProps) {
  const normalizedContent = normalizeMathMarkdown(content)

  return (
    <div
      className={cn(
        "exam-markdown max-w-none text-sm leading-6 text-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_table]:w-full [&_td]:border [&_td]:p-2 [&_th]:border [&_th]:p-2",
        className,
      )}
    >
      <Markdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeSanitize, mathSchema], [rehypeKatex, { strict: false, throwOnError: false }]]}
      >
        {normalizedContent}
      </Markdown>
    </div>
  )
}

export { MarkdownContent, looksLikeMath, normalizeMathMarkdown }
