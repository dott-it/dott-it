import { RubricEvaluation } from "../api/rubric-evaluation"

export interface PromptResponse {
    rubric_evaluations: RubricEvaluation[]
    strengths: string[]
    suggestions: string[]

}