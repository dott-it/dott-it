import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildExtractionPrompt, normalizeDigitizeFormBlocks } from '../lib/library/digitize/extract-questions.ts'
import { formatAssessment1GoldForPrompt } from '../lib/library/digitize/gold/assessment-1-structure.ts'
import {
  applyAssessment1QualityPostProcess,
  backfillHollowStems,
  ensureInvestigationMaterialBlanks,
  ensureNameTeacherQuestions,
  expandFusedNumberedPromptsInTextCards,
  expandFillInWorksheetCards,
  extractFillInPromptsFromHandout,
  extractInvestigationMaterialLabels,
  findHandoutStemForQuestionNumber,
  isHollowStemTextBlock,
  promoteUnansweredNumberedTextCards,
} from '../lib/library/digitize/quality-postprocess.ts'

const HANDOUT_EXCERPT = `
Baseball Assessment 2
Name: ________ Date: ________

1. Draw three different free-body diagrams (A, B, and C), one for each point marked on the graph. In each free-body diagram, show all the contact forces on the ball after the ball has left the pitcher's hand.

2. Use your free-body diagrams on the previous page to help answer this question: If all three pitches (A, B, and C) had equal amounts of KE when they left the pitcher's hand, would they all have the same amount of KE when they reach home plate? Why or why not?

3. How would you design an investigation using materials we have used in class to collect evidence for all 3 pitches to support or refute your claim for question 2? List the items and objects you will use in your investigation.
Bat
Pitcher
Ball
Wind
Other items needed to collect measurements and data:
My plan for setting up and carrying out my investigation:

4. Make a coordinate plot of the data from the table above.
`

test('should include Assessment 1 gold structure in the extraction prompt', () => {
  const gold = formatAssessment1GoldForPrompt()
  assert.match(gold, /Example structure/)
  assert.match(gold, /"Bat"/)
  assert.match(gold, /quality bar/)

  const prompt = buildExtractionPrompt('Baseball Assessment 2', HANDOUT_EXCERPT, 0)
  assert.match(prompt, /Example structure \(follow this quality bar\)/)
  assert.match(prompt, /FULL handout stem/)
  assert.match(prompt, /do not invent baseball blanks/i)
  assert.match(prompt, /"Bat"/)
})

test('should detect and backfill hollow Layer A stems from handout text', () => {
  assert.equal(
    isHollowStemTextBlock({ kind: 'text', title: '1', description: 'Figure 3' }),
    true,
  )

  const stem = findHandoutStemForQuestionNumber(HANDOUT_EXCERPT, 1)
  assert.ok(stem)
  assert.match(stem, /free-body diagrams/)

  const filled = backfillHollowStems(
    [{ kind: 'text', title: '1', description: 'Figure 3' }],
    HANDOUT_EXCERPT,
  )
  assert.equal(filled[0].kind, 'text')
  if (filled[0].kind === 'text') {
    assert.equal(filled[0].title, '1.')
    assert.match(filled[0].description ?? '', /free-body diagrams/)
  }
})

test('should rewrite fused investigation paragraphs into Bat/Pitcher/Ball/Wind blanks', () => {
  const blocks = ensureInvestigationMaterialBlanks(
    [
      {
        kind: 'text',
        title: '3.',
        description:
          'How would you design an investigation using materials we have used in class to collect evidence for all 3 pitches? List the items and objects you will use in your investigation.',
      },
      {
        kind: 'question',
        title: '3a. The items and objects I will use in my investigation and why I have chosen those items:',
        type: 'paragraph',
        required: true,
      },
      {
        kind: 'question',
        title: '3b. Other items needed to collect measurements and data:',
        type: 'paragraph',
        required: true,
      },
      {
        kind: 'question',
        title: '3c. My plan for setting up and carrying out my investigation:',
        type: 'paragraph',
        required: true,
      },
    ],
    HANDOUT_EXCERPT,
  )

  const titles = blocks.filter((block) => block.kind === 'question').map((block) => block.title)
  assert.deepEqual(titles.slice(0, 4), ['Bat', 'Pitcher', 'Ball', 'Wind'])
  assert.match(titles[4] ?? '', /Other items needed/)
  assert.match(titles[5] ?? '', /My plan for setting up/)
})

test('should place Name, Hour, and Teacher first before the intro card', () => {
  const withIdentity = ensureNameTeacherQuestions(
    [
      { kind: 'text', title: 'Baseball Assessment 2', description: 'Intro about baseball rules.' },
      { kind: 'question', title: '1a.', type: 'file', required: true },
    ],
    HANDOUT_EXCERPT,
  )
  assert.equal(withIdentity[0]?.kind, 'question')
  assert.equal(withIdentity[1]?.kind, 'question')
  assert.equal(withIdentity[2]?.kind, 'question')
  if (
    withIdentity[0]?.kind === 'question' &&
    withIdentity[1]?.kind === 'question' &&
    withIdentity[2]?.kind === 'question'
  ) {
    assert.equal(withIdentity[0].title, 'Name')
    assert.equal(withIdentity[1].title, 'Hour')
    assert.equal(withIdentity[2].title, 'Teacher')
  }
  assert.equal(withIdentity[3]?.kind, 'text')
  assert.ok(!withIdentity.some((block) => block.kind === 'question' && block.title === 'Date'))
})

test('should repair Assessment-2-style bad extraction toward Assessment 1 patterns', () => {
  const repaired = normalizeDigitizeFormBlocks(
    [
      { kind: 'text', title: 'Baseball Assessment 2', description: 'Intro paragraph about baseball rules.' },
      { kind: 'text', title: '1', description: 'Figure 3' },
      { kind: 'question', title: '1a.', type: 'file', required: true },
      {
        kind: 'text',
        title: '3',
        description:
          'How would you design an investigation using materials we have used in class? List the items and objects you will use.',
      },
      {
        kind: 'question',
        title: '3a. The items and objects I will use in my investigation and why I have chosen those items:',
        type: 'paragraph',
        required: true,
      },
      {
        kind: 'question',
        title: '3b. Other items needed to collect measurements and data:',
        type: 'paragraph',
        required: true,
      },
      {
        kind: 'question',
        title: '3c. My plan for setting up and carrying out my investigation:',
        type: 'paragraph',
        required: true,
      },
    ],
    { documentText: HANDOUT_EXCERPT },
  )

  const q1 = repaired.find(
    (block) =>
      block.kind === 'question' &&
      block.type === 'file' &&
      /^1\.\s/.test(block.title.trim()),
  )
  assert.ok(q1 && q1.kind === 'question')
  assert.match(q1.title, /free-body diagrams/)

  const materialTitles = repaired
    .filter((block) => block.kind === 'question')
    .map((block) => block.title)
  assert.ok(materialTitles.includes('Bat'))
  assert.ok(materialTitles.includes('Pitcher'))
  assert.ok(materialTitles.includes('Ball'))
  assert.ok(materialTitles.includes('Wind'))
  assert.ok(materialTitles.includes('Name'))
  assert.ok(materialTitles.includes('Hour'))
  assert.ok(materialTitles.includes('Teacher'))
  assert.ok(!materialTitles.includes('Date'))
  assert.equal(repaired[0]?.kind, 'question')
  assert.equal(repaired[1]?.kind, 'question')
  assert.equal(repaired[2]?.kind, 'question')
  if (
    repaired[0]?.kind === 'question' &&
    repaired[1]?.kind === 'question' &&
    repaired[2]?.kind === 'question'
  ) {
    assert.equal(repaired[0].title, 'Name')
    assert.equal(repaired[1].title, 'Hour')
    assert.equal(repaired[2].title, 'Teacher')
  }
})

test('should run the full Assessment 1 quality post-process pipeline', () => {
  const out = applyAssessment1QualityPostProcess(
    [
      { kind: 'text', title: '1', description: 'Fig' },
      {
        kind: 'text',
        title: '3.',
        description: 'Design an investigation using materials we have used in class. List the items.',
      },
      { kind: 'question', title: '3a.', type: 'paragraph', required: true },
    ],
    { documentText: HANDOUT_EXCERPT },
  )
  assert.ok(out.some((block) => block.kind === 'question' && block.title === 'Bat'))
  assert.ok(
    out.some(
      (block) =>
        (block.kind === 'text' || block.kind === 'question') &&
        `${block.title}\n${block.description ?? ''}`.includes('free-body'),
    ),
  )
  const q3 = out.find((block) => block.kind === 'text' && /^3\.\s/.test(block.title))
  assert.ok(q3 && q3.kind === 'text')
  assert.match(q3.title, /^3\. /)
  assert.doesNotMatch(q3.title, /^3\.\s*$/)
})

test('should not invent baseball material blanks on an electromagnet investigation', () => {
  const electromagnetHandout = `
Summative Assessment — Electromagnetic Inventions

1. Choose an electromagnet application from the list that the class brainstormed.

Design an Investigation — An engineer suggests that copper might not be the best material for transferring energy into the electromagnet in your device.

4. Write a hypothesis that describes a cause-and-effect relationship in the electromagnet that you would expect to see if the engineer is correct.

5. How would you design an investigation to test which metal is better for your device, copper or silver?
Other items needed to collect measurements and data:
My plan for setting up and carrying out my investigation:
`

  assert.deepEqual(extractInvestigationMaterialLabels(electromagnetHandout), [])
  assert.deepEqual(extractInvestigationMaterialLabels(undefined), [])

  const blocks = ensureInvestigationMaterialBlanks(
    [
      {
        kind: 'text',
        title: 'Design an Investigation',
        description:
          'How would you design an investigation to test which metal is better for your device, copper or silver?',
      },
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
    ],
    electromagnetHandout,
  )
  const titles = blocks.filter((block) => block.kind === 'question').map((block) => block.title)
  assert.ok(!titles.includes('Bat'))
  assert.ok(!titles.includes('Pitcher'))
  assert.ok(!titles.includes('Ball'))
  assert.ok(!titles.includes('Wind'))
  assert.match(titles[0] ?? '', /Other items needed/)
})

test('should expand Considerations for design text into questions 1 and 2', () => {
  const expanded = expandFusedNumberedPromptsInTextCards([
    {
      kind: 'text',
      title: 'Considerations for design',
      description:
        '1. What is the purpose of the design? What criteria does the headgear you design need to meet?\n\n2. Pick one stakeholder who will be affected by your design and design with that person in mind.\n\nWho is the stakeholder you are designing for?\n\nWhat constraints do you anticipate your stakeholder will bring to your design? List at least 3 constraints that you think a helmet designer would have to consider.',
    },
    {
      kind: 'question',
      title: '3. Use words and pictures to show the structure of your design solution.',
      type: 'file',
      required: true,
    },
  ])

  assert.equal(expanded[0]?.kind, 'text')
  if (expanded[0]?.kind === 'text') {
    assert.equal(expanded[0].title, 'Considerations for design')
  }
  const questions = expanded.filter((block) => block.kind === 'question')
  assert.ok(questions.length >= 3)
  assert.match(questions[0]?.title ?? '', /^1\. What is the purpose/)
  assert.match(questions[1]?.title ?? '', /^2\. Pick one stakeholder/)
  assert.match(questions.some((block) => /Who is the stakeholder/.test(block.title)) ? 'yes' : '', /yes/)
  assert.equal(questions.at(-1)?.title.startsWith('3.'), true)
})

test('should keep only the section header when 1 and 2 already have answer items', () => {
  const expanded = expandFusedNumberedPromptsInTextCards([
    {
      kind: 'text',
      title: 'Considerations for design',
      description:
        '1. What is the purpose of the design? What criteria does the headgear you design need to meet?\n\n2. Pick one stakeholder who will be affected by your design.',
    },
    {
      kind: 'question',
      title: '1. What is the purpose of the design? What criteria does the headgear you design need to meet?',
      type: 'paragraph',
      required: true,
    },
    {
      kind: 'question',
      title: '2. Who is the stakeholder you are designing for?',
      type: 'paragraph',
      required: true,
    },
  ])

  assert.equal(expanded.length, 3)
  assert.equal(expanded[0]?.kind, 'text')
  if (expanded[0]?.kind === 'text') {
    assert.equal(expanded[0].title, 'Considerations for design')
  assert.equal(expanded[0].description, undefined)
  }
})

const CHECKLIST_HANDOUT = `
Checklist for Obtaining and Evaluating Information from Scientific Text1905019050
Obtaining information from scientific text
Read for the gist--skim the title, headings, images.
What is the central idea or claim? ____________________________________________________________________________ ____________________________________________________________________________
Mark up the text.
Select methods for marking the text. Keep track of questions you have in the margins. Circle key words. Put question marks by words you want to learn more about. Underline main ideas. _____________________________(another method of your own)
If the text is about research, ask yourself these questions about the text.
What question was the author asking? ____________________________________________________________________________ What evidence did they collect? ____________________________________________________________________________ ____________________________________________________________________________
Evaluating information from scientific text
Identify the goal of the text.
What is the goal of the text--to share information, to convince someone of something, to distract people from a larger issue, or something else? _____________________________________________________________________________ _____________________________________________________________________________
If it is a research study, identify how the study was done.
Are the research methods used appropriate for the purpose of the study? Why or why not? _____________________________________________________________________________ _____________________________________________________________________________
`

test('should turn a dumped reading checklist into fill-in paragraph answers', () => {
  const prompts = extractFillInPromptsFromHandout(CHECKLIST_HANDOUT)
  assert.ok(prompts.some((prompt) => /central idea or claim/i.test(prompt)))
  assert.ok(prompts.some((prompt) => /question was the author asking/i.test(prompt)))
  assert.ok(prompts.some((prompt) => /evidence did they collect/i.test(prompt)))
  assert.ok(prompts.some((prompt) => /research methods used appropriate/i.test(prompt)))
  assert.ok(!prompts.some((prompt) => /^name\b/i.test(prompt)))

  const expanded = expandFillInWorksheetCards(
    [
      { kind: 'question', title: 'Name', type: 'text', required: true },
      { kind: 'question', title: 'Hour', type: 'text', required: true },
      { kind: 'question', title: 'Teacher', type: 'text', required: true },
      {
        kind: 'text',
        title: 'Checklist for Obtaining Information',
        description: CHECKLIST_HANDOUT,
      },
    ],
    CHECKLIST_HANDOUT,
  )
  const answers = expanded.filter(
    (block) => block.kind === 'question' && !['Name', 'Hour', 'Teacher'].includes(block.title),
  )
  assert.ok(answers.length >= 5)
  assert.ok(answers.every((block) => block.kind === 'question' && block.type === 'paragraph'))
  assert.ok(
    expanded.some(
      (block) => block.kind === 'text' && /obtaining information from scientific text/i.test(block.title),
    ),
  )
})

test('should promote an unanswered 1a synthesize card when 1b already has an answer', () => {
  const promoted = promoteUnansweredNumberedTextCards([
    {
      kind: 'text',
      title:
        '1a. Synthesize the data using the Checklist for Obtaining and Evaluating Information from Scientific Text to make sense of and evaluate the information in the reading.',
    },
    {
      kind: 'question',
      title: '1b. Using the information you obtained from the reading, visually represent each mating.',
      type: 'file',
      required: true,
    },
  ])
  assert.equal(promoted[0]?.kind, 'question')
  if (promoted[0]?.kind === 'question') {
    assert.equal(promoted[0].type, 'paragraph')
    assert.match(promoted[0].title, /^1a\.\s+Synthesize/)
  }
})

test('should collapse a duplicate 2a text card into the following paragraph answer', () => {
  const collapsed = applyAssessment1QualityPostProcess(
    [
      {
        kind: 'text',
        title:
          '2a. Speckled goldfish are popular fish because of their beautiful colors. If a goldfish breeder wanted to breed speckled fish, should the breeder mate a speckled female with a speckled male or a brown female with a transparent male?',
      },
      {
        kind: 'question',
        title:
          '2a. Speckled goldfish are popular fish because of their beautiful colors. If a goldfish breeder wanted to breed speckled fish, should the breeder mate a speckled female with a speckled male or a brown female with a transparent male?',
        type: 'paragraph',
        required: true,
      },
      {
        kind: 'question',
        title: '2b. Use words and/or drawings to show how the offspring’s genotype results from the parents’ chromosomes.',
        type: 'file',
        required: true,
      },
    ],
    { documentText: 'Goldfish Assessment' },
  )
  const twoA = collapsed.filter(
    (block) => block.kind === 'question' && /^2a\./i.test(block.title),
  )
  assert.equal(twoA.length, 1)
  assert.ok(!collapsed.some((block) => block.kind === 'text' && /^2a\./i.test(block.title)))
})

test('should drop a duplicate Q1 synthesize question when 1a already has the same stem', () => {
  const deduped = applyAssessment1QualityPostProcess(
    [
      {
        kind: 'question',
        title:
          'Q1 1. Synthesize the data using the Checklist for Obtaining and Evaluating Information from Scientific Text to make sense of and evaluate the information in the reading.',
        type: 'paragraph',
        required: true,
      },
      {
        kind: 'question',
        title:
          '1a. Synthesize the data using the Checklist for Obtaining and Evaluating Information from Scientific Text to make sense of and evaluate the information in the reading.',
        type: 'paragraph',
        required: true,
      },
      {
        kind: 'question',
        title: '1b. Visually represent each mating by creating 4 pedigrees.',
        type: 'file',
        required: true,
      },
    ],
    { documentText: 'Goldfish Assessment' },
  )
  const synthesize = deduped.filter(
    (block) => block.kind === 'question' && /synthesize the data/i.test(block.title),
  )
  assert.equal(synthesize.length, 1)
  assert.match(synthesize[0]?.title ?? '', /^1a\./)
})
