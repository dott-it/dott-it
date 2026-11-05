import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  applyMarkdownBoldToUnicode,
  prepareFormsDescription,
  prepareFormsOption,
  prepareFormsTitle,
  stripTrivialLeadingVerbBold,
  toUnicodeBold,
} from '../lib/library/digitize/forms-text-format.ts'
import { digitizeFormBlocksToFormItems } from '../lib/library/digitize/extract-questions.ts'
import {
  collapseStemAndLoneFileAnswer,
  ensureAssessmentHeaderTitle,
  ensureInstructionalParagraphBreaks,
  formatNumberedStemCards,
  splitStemAcrossTitleAndDescription,
  stripHandoutArtifactId,
} from '../lib/library/digitize/quality-postprocess.ts'

test('should map ASCII letters to Mathematical Bold Unicode (legacy helper)', () => {
  assert.equal(toUnicodeBold('KE'), '𝐊𝐄')
  assert.equal(toUnicodeBold('A1'), '𝐀𝟏')
})

test('should keep Form titles and material blanks as plain text', () => {
  assert.equal(prepareFormsTitle('Name'), 'Name')
  assert.equal(prepareFormsTitle('Bat'), 'Bat')
  assert.equal(prepareFormsTitle('Pitcher'), 'Pitcher')
  assert.equal(prepareFormsTitle('Ball'), 'Ball')
  assert.equal(prepareFormsTitle('Wind'), 'Wind')
  assert.equal(prepareFormsTitle('Baseball Assessment 2'), 'Baseball Assessment 2')
  assert.equal(prepareFormsTitle('2. Use your diagrams'), '2. Use your diagrams')
  assert.equal(prepareFormsTitle('2a.'), '2a.')
  assert.equal(
    prepareFormsTitle('2. Measure the **kinetic energy**'),
    '2. Measure the kinetic energy',
  )
})

test('should strip markdown bold markers from descriptions without Unicode glyphs', () => {
  assert.equal(stripTrivialLeadingVerbBold('**Use** your diagrams.'), 'Use your diagrams.')
  assert.equal(
    prepareFormsDescription('**Use** your diagrams to find **kinetic energy**.'),
    'Use your diagrams to find kinetic energy.',
  )
  assert.equal(applyMarkdownBoldToUnicode('Show **contact forces**'), 'Show contact forces')
})

test('should keep choice options plain without bold', () => {
  assert.equal(prepareFormsOption('**a.** Yes, it supports both parts'), 'a. Yes, it supports both parts')
  assert.equal(prepareFormsOption('b. No, it supports only one part'), 'b. No, it supports only one part')

  const items = digitizeFormBlocksToFormItems([
    {
      kind: 'question',
      title: '10a.',
      type: 'radio',
      required: true,
      options: ['**a.** Yes', 'b. No', 'c. Not sure'],
    },
  ])
  const options =
    'questionItem' in items[0]
      ? items[0].questionItem.question.choiceQuestion?.options.map((option) => option.value)
      : undefined
  assert.deepEqual(options, ['a. Yes', 'b. No', 'c. Not sure'])
})

test('should put file-response instructions in description, not the title', () => {
  const items = digitizeFormBlocksToFormItems(
    [
      {
        kind: 'question',
        title:
          '2. Use your free-body diagrams on the previous page to help answer this question: Why or why not?',
        type: 'file',
        required: true,
      },
    ],
    { fileResponseVariant: 'teacher-export' },
  )
  assert.equal(items.length, 1)
  assert.match(items[0].title ?? '', /^2\./)
  assert.match(items[0].title ?? '', /Use your free-body diagrams/)
  assert.doesNotMatch(items[0].title ?? '', /\[File response\]/)
  assert.match(items[0].description ?? '', /\[File response\]/)
  assert.match(items[0].description ?? '', /Upload a photo or PDF/)
})

test('should collapse a numbered stem text card and lone 2a file into one question', () => {
  const collapsed = collapseStemAndLoneFileAnswer([
    {
      kind: 'text',
      title: '2.',
      description:
        'Use your free-body diagrams on the previous page to help answer this question: If all three pitches (A, B, and C) had equal amounts of KE when they left the pitcher\'s hand, would they all have the same amount of KE when they reach home plate? Why or why not?',
    },
    { kind: 'question', title: '2a.', type: 'file', required: true },
    {
      kind: 'text',
      title: '3.',
      description:
        'How would you design an investigation using materials we have used in class to collect evidence for all 3 pitches?',
    },
  ])

  assert.equal(collapsed.length, 2)
  assert.equal(collapsed[0]?.kind, 'question')
  if (collapsed[0]?.kind === 'question') {
    assert.equal(collapsed[0].type, 'file')
    assert.match(collapsed[0].title, /^2\. Use your free-body diagrams/)
    assert.doesNotMatch(collapsed[0].title, /^2a/)
  }
  assert.equal(collapsed[1]?.kind, 'text')
})

test('should collapse a numbered stem text card and duplicate bare file title', () => {
  const collapsed = collapseStemAndLoneFileAnswer([
    {
      kind: 'text',
      title: '4.',
      description: 'Make a coordinate plot of the data from the table above.',
    },
    {
      kind: 'question',
      title: '4.',
      type: 'file',
      required: true,
      imageIndexes: [4, 5],
    },
  ])
  assert.equal(collapsed.length, 1)
  assert.equal(collapsed[0]?.kind, 'question')
  if (collapsed[0]?.kind === 'question') {
    assert.match(collapsed[0].title, /^4\. Make a coordinate plot/)
    assert.deepEqual(collapsed[0].imageIndexes, [4, 5])
  }
})

test('should collapse a numbered stem text card and lone 10a radio into one question', () => {
  const collapsed = collapseStemAndLoneFileAnswer([
    {
      kind: 'text',
      title: '10.',
      description:
        'Does the warning on the bat label shown above support both parts of the coach’s argument about forces and deformation?',
    },
    {
      kind: 'question',
      title: '10a.',
      type: 'radio',
      required: true,
      options: [
        'a. Yes, it supports both parts of the argument',
        'b. No, it supports only one part of the argument',
        'c. No, it does not support the argument',
        'd. Not sure',
      ],
    },
  ])

  assert.equal(collapsed.length, 1)
  assert.equal(collapsed[0]?.kind, 'question')
  if (collapsed[0]?.kind === 'question') {
    assert.equal(collapsed[0].type, 'radio')
    assert.match(collapsed[0].title, /^10\. Does the warning/)
    assert.doesNotMatch(collapsed[0].title, /^10a/)
    assert.equal(collapsed[0].options?.length, 4)
  }
})

test('should collapse titled stem text card and bare 10a radio into one question', () => {
  const collapsed = collapseStemAndLoneFileAnswer([
    {
      kind: 'text',
      title:
        '10. Does the warning on the bat label shown above support both parts of the coach’s argument about forces and deformation?',
    },
    {
      kind: 'question',
      title: '10a.',
      type: 'radio',
      required: true,
      options: [
        'a. Yes, it supports both parts of the argument',
        'b. No, it supports only one part of the argument',
        'c. No, it does not support the argument',
        'd. Not sure',
      ],
    },
  ])

  assert.equal(collapsed.length, 1)
  assert.equal(collapsed[0]?.kind, 'question')
  if (collapsed[0]?.kind === 'question') {
    assert.equal(collapsed[0].type, 'radio')
    assert.match(collapsed[0].title, /^10\. Does the warning/)
  }
})

test('should not collapse stem + radio when a lettered sibling answer follows', () => {
  const blocks = collapseStemAndLoneFileAnswer([
    {
      kind: 'text',
      title: '10.',
      description:
        'Does the warning on the bat label shown above support both parts of the coach’s argument about forces and deformation?',
    },
    {
      kind: 'question',
      title: '10a.',
      type: 'radio',
      required: true,
      options: ['a. Yes', 'b. No'],
    },
    {
      kind: 'question',
      title: '10b.',
      type: 'paragraph',
      required: true,
    },
  ])
  assert.equal(blocks.length, 3)
  assert.equal(blocks[0]?.kind, 'text')
})

test('should format bare "3." stems as "3. texto" with paragraph breaks in description', () => {
  const split = splitStemAcrossTitleAndDescription(
    '3.',
    'How would you design an investigation using materials we have used in class to collect evidence for all 3 pitches to support or refute your claim for question 2? List the items and objects you will use in your investigation. Then describe the procedures for setting up and carrying out your investigation.',
  )
  assert.match(split.title, /^3\. How would you design/)
  assert.doesNotMatch(split.title, /^3\.\s*$/)
  assert.match(split.description ?? '', /List the items/)
  assert.match(split.description ?? '', /\n\nThen describe/)

  const formatted = formatNumberedStemCards([
    {
      kind: 'text',
      title: '3.',
      description:
        'How would you design an investigation using materials we have used in class to collect evidence for all 3 pitches to support or refute your claim for question 2? List the items and objects you will use in your investigation. Then describe the procedures for setting up and carrying out your investigation.',
    },
    { kind: 'question', title: 'Bat', type: 'text', required: true },
  ])
  assert.equal(formatted[0]?.kind, 'text')
  if (formatted[0]?.kind === 'text') {
    assert.match(formatted[0].title, /^3\. How would you design/)
    assert.match(formatted[0].description ?? '', /\n\n/)
  }
})

test('should break dense Cheerleading stems into spaced instructional beats', () => {
  const oneB =
    'Draw a model of the material structure you would expect to see in the design described in 1a. In your model, label each design feature. For each design feature you label, explain in words how the structural properties help it function as a protective material.'
  const broken1b = ensureInstructionalParagraphBreaks(oneB)
  assert.match(broken1b, /in 1a\.\n\nIn your model/)
  assert.match(broken1b, /design feature\.\n\nFor each/)

  const twoA =
    "When any of the three designs shown above are worn on a person's head, the person’s head is in contact with the headgear. When a person falls to the floor and hits their head, the headgear makes contact with the ground. Draw and label a diagram that shows all three of these objects in contact with each other at the moment of collision."
  const split2a = splitStemAcrossTitleAndDescription('2a.', twoA)
  assert.match(split2a.title, /^2a\. When any of the three designs/)
  assert.match(split2a.description ?? '', /When a person falls/)
  assert.match(split2a.description ?? '', /\n\nDraw and label/)

  const formatted = formatNumberedStemCards([
    {
      kind: 'question',
      title: `2a. ${twoA}`,
      type: 'file',
      required: true,
    },
    {
      kind: 'text',
      title: 'Part 1: Evaluating headgear',
      description:
        'Here are three different headgear devices that are currently being marketed as protection from potential concussions in cheerleading. These headgear devices use different materials and structures. When getting ideas from stakeholders, start by asking what they care about.',
    },
  ])
  assert.equal(formatted[0]?.kind, 'question')
  if (formatted[0]?.kind === 'question') {
    assert.match(formatted[0].title, /^2a\. When any/)
    assert.match(formatted[0].description ?? '', /\n\n/)
  }
  assert.equal(formatted[1]?.kind, 'text')
  if (formatted[1]?.kind === 'text') {
    assert.equal(formatted[1].title, 'Part 1: Evaluating headgear')
    assert.match(formatted[1].description ?? '', /\n\n/)
  }
})

test('should break Coors Field / Q9 stems into readable paragraphs', () => {
  const stem =
    'Some baseball stadiums (such as Coors Field in Denver, Colorado, which is the home stadium for the Colorado Rockies) are located at much higher altitudes than most stadiums. Coors Field is 5,200 feet (almost a mile) above sea level. At this higher altitude there are fewer air particles in a given volume of air than at lower altitudes. Assume that the data shown in the two data tables in question 8 were collected at a stadium close to sea level (lower elevation). How would you expect the patterns in both tables to compare if you collected new data on bat weight vs. speed of ball after impact and bat swing speed vs. speed of ball after impact at Coors Field, where the air is less dense than air near sea level? Why?'

  const broken = ensureInstructionalParagraphBreaks(stem)
  assert.match(broken, /most stadiums\.\n\nCoors Field is 5,200 feet/)
  assert.match(broken, /sea level\.\n\nAt this higher altitude/)
  assert.match(broken, /lower altitudes\.\n\nAssume that the data/)
  assert.match(broken, /lower elevation\)\.\n\nHow would you expect/)

  const split = splitStemAcrossTitleAndDescription('9.', stem)
  assert.match(split.title, /^9\. Some baseball stadiums/)
  assert.match(split.description ?? '', /At this higher altitude/)
  assert.match(split.description ?? '', /\n\nAssume that the data/)
  assert.match(split.description ?? '', /\n\nHow would you expect/)
})

test('should strip handout artifact IDs and bold assessment header titles', () => {
  assert.equal(stripHandoutArtifactId('Baseball Assessment 21905019050'), 'Baseball Assessment')
  assert.equal(stripHandoutArtifactId('Soccer Assessment1905019050'), 'Soccer Assessment')
  assert.equal(stripHandoutArtifactId('Baseball Assessment 2'), 'Baseball Assessment 2')

  const blocks = ensureAssessmentHeaderTitle(
    [
      { kind: 'question', title: 'Name', type: 'text', required: true },
      {
        kind: 'text',
        title: 'Baseball Assessment 21905019050',
        description: 'At each level of organized baseball…',
      },
    ],
    'Baseball Assessment 2',
  )
  assert.equal(blocks[1]?.kind, 'text')
  if (blocks[1]?.kind === 'text') {
    assert.equal(blocks[1].title, 'Baseball Assessment 2')
  }

  assert.equal(prepareFormsTitle('Baseball Assessment 2'), 'Baseball Assessment 2')
})
