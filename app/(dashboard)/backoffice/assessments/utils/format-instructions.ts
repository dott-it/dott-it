export function formatInstructions(instructions: string | undefined): string {
  if (!instructions) return ''

  try {
    const parsed = JSON.parse(instructions)

    if (typeof parsed === 'object' && parsed !== null) {
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => (typeof item === 'string' ? item : JSON.stringify(item, null, 2)))
          .join('\n')
      }

      return Object.entries(parsed)
        .map(([key, value]) => {
          if (typeof value === 'string') {
            return `${key}: ${value}`
          }
          return `${key}: ${JSON.stringify(value, null, 2)}`
        })
        .join('\n')
    }

    if (typeof parsed === 'string') {
      return parsed
    }

    return JSON.stringify(parsed, null, 2)
  } catch {
    return instructions
  }
}


