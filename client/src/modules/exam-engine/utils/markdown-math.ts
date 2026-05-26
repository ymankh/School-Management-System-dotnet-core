export function normalizeMathMarkdown(content: string) {
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

export function looksLikeMath(value: string) {
  const trimmed = value.trim()

  if (!trimmed || trimmed.includes(" ")) {
    return false
  }

  return /\\[a-zA-Z]+|[a-zA-Z0-9][\^_][a-zA-Z0-9{]|\d\s*[+\-*/=]\s*\d|[{}]/.test(trimmed)
}
