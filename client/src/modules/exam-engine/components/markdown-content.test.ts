import { describe, expect, it } from "vitest"

import { looksLikeMath, normalizeMathMarkdown } from "@/modules/exam-engine/utils/markdown-math"

describe("normalizeMathMarkdown", () => {
  it("unwraps inline dollar math from markdown code ticks", () => {
    const result = normalizeMathMarkdown("Solve `$x^2 + 5x + 6$`.")

    expect(result).toBe("Solve $x^2 + 5x + 6$.")
  })

  it("repairs backticked math with a missing closing dollar delimiter", () => {
    const result = normalizeMathMarkdown("Reference: a quadratic has form `$ax^2 + bx + c = 0`.")

    expect(result).toBe("Reference: a quadratic has form $ax^2 + bx + c = 0$.")
  })

  it("keeps non-math inline code unchanged", () => {
    const result = normalizeMathMarkdown("Choose `(x + 2)(x + 3)`.")

    expect(result).toBe("Choose `(x + 2)(x + 3)`.")
  })

  it("converts math-looking inline code into dollar-delimited math", () => {
    const result = normalizeMathMarkdown("Match `2^3`, `\\sqrt{16}`, and `3^2`.")

    expect(result).toBe("Match $2^3$, $\\sqrt{16}$, and $3^2$.")
  })

  it("unwraps parenthesized LaTeX delimiters from markdown code ticks", () => {
    const result = normalizeMathMarkdown("Solve `\\(x^2 + 5x + 6\\)`.")

    expect(result).toBe("Solve \\(x^2 + 5x + 6\\).")
  })

  it("identifies compact math expressions without treating prose as math", () => {
    expect(looksLikeMath("2^3")).toBe(true)
    expect(looksLikeMath("\\sqrt{16}")).toBe(true)
    expect(looksLikeMath("answer")).toBe(false)
  })
})
