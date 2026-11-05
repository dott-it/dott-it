import type { DigitizeFormBlock, DigitizeQuestion } from './types'

/** Pretty-print extracted questions for CLI inspection. */
export function formatExtractedQuestions(questions: DigitizeQuestion[]): string {
  const lines = [`Extracted ${questions.length} question(s):`, '']

  for (const [index, question] of questions.entries()) {
    const required = question.required ? 'required' : 'optional'
    const images =
      question.imageIndexes && question.imageIndexes.length > 0
        ? ` images=[${question.imageIndexes.join(',')}]`
        : ''
    lines.push(`${index + 1}. [${question.type}] (${required})${images} ${question.title}`)
    if (question.options?.length) {
      for (const option of question.options) {
        lines.push(`   - ${option}`)
      }
    }
    lines.push('')
  }

  return lines.join('\n').trimEnd()
}

/** Pretty-print ordered text + question blocks. */
export function formatExtractedBlocks(blocks: DigitizeFormBlock[]): string {
  const questionCount = blocks.filter((block) => block.kind === 'question').length
  const lines = [`Extracted ${blocks.length} block(s) (${questionCount} question(s)):`, '']

  for (const [index, block] of blocks.entries()) {
    const images =
      block.imageIndexes && block.imageIndexes.length > 0
        ? ` images=[${block.imageIndexes.join(',')}]`
        : ''
    if (block.kind === 'text') {
      const desc = block.description ? ` — ${block.description.slice(0, 120)}${block.description.length > 120 ? '…' : ''}` : ''
      lines.push(`${index + 1}. [text]${images} ${block.title}${desc}`)
    } else {
      const required = block.required ? 'required' : 'optional'
      const num = block.sourceNumber ? ` Q${block.sourceNumber}` : ''
      const desc = block.description
        ? ` — ${block.description.slice(0, 120)}${block.description.length > 120 ? '…' : ''}`
        : ''
      lines.push(`${index + 1}. [${block.type}] (${required})${num}${images} ${block.title}${desc}`)
      if (block.options?.length) {
        for (const option of block.options) {
          lines.push(`   - ${option}`)
        }
      }
    }
    lines.push('')
  }

  return lines.join('\n').trimEnd()
}
