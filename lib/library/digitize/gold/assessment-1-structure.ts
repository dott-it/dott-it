import type { DigitizeFormBlock } from '../types'

/**
 * Compact gold structure patterned on Baseball Assessment 1 (Eddo) —
 * teacher-quality text layout (stems on the answer item when single-response,
 * materials blanks, Name/Hour/Teacher first).
 * Used as few-shot in the extraction prompt; not a full Form dump.
 */
export const ASSESSMENT_1_GOLD_STRUCTURE: DigitizeFormBlock[] = [
  { kind: 'question', title: 'Name', type: 'text', required: true },
  { kind: 'question', title: 'Hour', type: 'text', required: true },
  { kind: 'question', title: 'Teacher', type: 'text', required: true },
  {
    kind: 'text',
    title: 'Baseball Assessment 1',
    description:
      'At each level of organized baseball, there are rules in place about what type of bat and ball can be used. These rules help ensure the game play remains competitive, fair, and fun.\n\nAnswer the prompts below to figure out how these factors could impact the game of baseball.',
  },
  {
    kind: 'question',
    title:
      '1. Draw three different free-body diagrams (A, B, and C), one for each point marked on the graph. In each free-body diagram, show all the contact forces on the ball after the ball has left the pitcher’s hand.',
    type: 'file',
    required: true,
    imageIndexes: [1],
  },
  {
    kind: 'question',
    title:
      '2. Use your free-body diagrams on the previous page to help answer this question: If all three pitches (A, B, and C) had equal amounts of KE when they left the pitcher\'s hand, would they all have the same amount of KE when they reach home plate? Why or why not?',
    type: 'file',
    required: true,
  },
  {
    kind: 'text',
    title:
      '3. How would you design an investigation using materials we have used in class to collect evidence for all 3 pitches to support or refute your claim for question 2?',
    description:
      'List the items and objects you will use in your investigation.\n\nThen describe the procedures for setting up and carrying out your investigation.',
  },
  { kind: 'question', title: 'Bat', type: 'text', required: true },
  { kind: 'question', title: 'Pitcher', type: 'text', required: true },
  { kind: 'question', title: 'Ball', type: 'text', required: true },
  { kind: 'question', title: 'Wind', type: 'text', required: true },
  {
    kind: 'question',
    title: 'Other items needed to collect measurements and data:',
    type: 'paragraph',
    required: true,
  },
  {
    kind: 'question',
    title: 'My plan for setting up and carrying out my investigation:',
    type: 'paragraph',
    required: true,
  },
  {
    kind: 'question',
    title:
      '10. Does the warning on the bat label shown above support both parts of the coach’s argument about forces and deformation?',
    type: 'radio',
    required: true,
    options: [
      'a. Yes, it supports both parts of the argument',
      'b. No, it supports only one part of the argument',
      'c. No, it does not support the argument',
      'd. Not sure',
    ],
  },
]

/** JSON few-shot block for the LLM extraction prompt. */
export function formatAssessment1GoldForPrompt(): string {
  return `## Example structure (follow this quality bar)

This is the expected quality (patterned on a teacher-reviewed Baseball Assessment Form). Match this density of stem text and answer types. Copy Bat / Pitcher / Ball / Wind blanks ONLY when THIS handout prints those labels as fill-in lines — never invent them for other units (forces, genetics, electromagnets, etc.).

\`\`\`json
${JSON.stringify(ASSESSMENT_1_GOLD_STRUCTURE, null, 2)}
\`\`\`

Quality bar checklist:
- First three items (before any intro text): short "text" questions **Name**, then **Hour**, then **Teacher** (never Date — Forms already records a timestamp).
- Single-response prompts (draw / explain-with-diagram / one upload) → ONE "file" (or "paragraph") question whose title is "N. " + the FULL stem. Never "N." text card + empty "Na." file.
- Single multiple-choice prompts (lettered a./b./c./d.) → ONE "radio" whose title is "N. " + the FULL stem. Never "N." text card + bare "Na." radio.
- Multi-part prompts (materials blanks, several sub-answers) → Layer A text card whose title is "N. " + the first stem paragraph (never bare "N."), with remaining instructional paragraphs in description separated by blank lines (\`\\n\\n\`), then separate answer items.
- Fill-in worksheets / reading checklists → one paragraph per "Question? ________" blank; never a single static text card for the whole sheet.
- Numbered items (1a., 1b.) that ask students to work must have answer items — never a text-only "1a." card.
- Rely on Forms' native title weight for headers — do not wrap Name/Hour/Teacher/Bat/Pitcher or section titles in emphasis markers.
- Investigation materials → if THIS handout lists labeled fill-in lines (e.g. Bat, Pitcher, Ball, Wind), emit those as separate short "text" blanks, then any "Other items…" / "My plan…" paragraphs from the handout. If those labels are absent, do not invent them.`
}
