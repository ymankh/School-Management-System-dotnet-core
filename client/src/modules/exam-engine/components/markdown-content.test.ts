import { describe, expect, it } from "vitest"

import { normalizeMathMarkdown } from "@/modules/exam-engine/components/markdown-content"

describe("normalizeMathMarkdown", () => {
  it("unwraps inline dollar math from markdown code ticks", () => {
    const result = normalizeMathMarkdown("Solve `$x^2 + 5x + 6$`.")

    expect(result).toBe("Solve $x^2 + 5x + 6$.")
  })

  it("keeps non-math inline code unchanged", () => {
    const result = normalizeMathMarkdown("Choose `(x + 2)(x + 3)`.")

    expect(result).toBe("Choose `(x + 2)(x + 3)`.")
  })

  it("unwraps parenthesized LaTeX delimiters from markdown code ticks", () => {
    const result = normalizeMathMarkdown("Solve `\\(x^2 + 5x + 6\\)`.")

    expect(result).toBe("Solve \\(x^2 + 5x + 6\\).")
  })
})
