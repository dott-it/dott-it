import 'dotenv/config'
import { ChatOpenAI } from '@langchain/openai'
import type {
  ThematicAnalysisLLMOutput,
  ThematicAnalysisReviewerInstructions,
} from '@/app/types'
export {
  buildStudentResponseList,
  parseThematicAnalysisResponse,
  resolveCitationLearnerId,
} from './thematic-analysis-utils'
export type { StudentResponseInput } from './thematic-analysis-utils'
export { buildThematicAnalysisSystemPrompt } from './thematic-analysis-prompt'

import {
  buildStudentResponseList,
  parseThematicAnalysisResponse,
  type StudentResponseInput,
} from './thematic-analysis-utils'
import { buildThematicAnalysisSystemPrompt } from './thematic-analysis-prompt'

const llm = new ChatOpenAI({
  model: 'gpt-4.1-mini',
  temperature: 0.3,
})

export async function generateThematicAnalysis(
  reviewer: ThematicAnalysisReviewerInstructions,
  studentResponses: StudentResponseInput[],
): Promise<ThematicAnalysisLLMOutput> {
  const studentResponseList = buildStudentResponseList(studentResponses)
  const systemPrompt = buildThematicAnalysisSystemPrompt(reviewer)
  const userPrompt = `Here's a list of my students' responses:\n${studentResponseList}`

  const response = await llm.invoke([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ])

  const content = response.content?.toString().trim() ?? '{}'
  return parseThematicAnalysisResponse(content)
}
