import type { ThematicAnalysisReviewerInstructions } from '@/app/types'

export const OUTPUT_SCHEMA_DESCRIPTION = `
Return a JSON object with two fields:
1. "thematic_analysis": an array of theme objects. Include 2-3 strengths and 2-3 identified student needs. Each theme object has:
   - "type": either "strength" or "need"
   - "title": short name for the identified theme
   - "description": a description of the pattern found across samples, in one or two sentences
   - "citations": an array of student artifact citations. Each citation has:
     - "student_id": MUST be the exact learner id string shown in each student block as "(id: ...)" — never invent ids, never use row numbers only
     - "highlights": an array of specific text snippets (verbatim) to highlight in the student response
     - "annotation": a teacher-facing description of the relevant citation in relation to the theme, in one or two sentences
2. "summary": a high-level overview of the themes, in a short paragraph. When referring to a theme, link it using [theme name](#theme_id) format.
`

function buildReviewerInstructionsSection(
  reviewer: ThematicAnalysisReviewerInstructions,
): string {
  const sections = [
    reviewer.curriculumTeachersEdition.trim(),
    reviewer.curriculumAnswerKey.trim(),
    reviewer.customInstructions.trim(),
  ].filter(Boolean)

  return sections.join('\n\n')
}

export function buildThematicAnalysisSystemPrompt(
  reviewer: ThematicAnalysisReviewerInstructions,
): string {
  const reviewerInstructions = buildReviewerInstructionsSection(reviewer)

  return `You are a teacher assistant evaluating the assessment and supporting teachers in their classroom work.

TASK DESCRIPTION
Identify common themes based on the supplied instructions.
Perform thematic analysis of the student work, identifying common strengths and challenges.
Cite student artifacts that illustrate the provided themes.

REVIEWER INSTRUCTIONS
${reviewerInstructions}

REVIEWER GUIDANCE
- Speak to the teacher like a peer, and in concise, descriptive language and in complete sentences.
- Use quantifier words for common strengths and common needs.
- Use only verbatim examples from the student's writing when providing examples. DO NOT MAKE ANYTHING UP.

${OUTPUT_SCHEMA_DESCRIPTION}`
}
