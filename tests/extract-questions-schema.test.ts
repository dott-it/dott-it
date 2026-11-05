import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { QuestionItem, TextFormItem, ImageFormItem } from '../lib/forms/types/forms.ts'
import {
  collectReferencedImageIndexes,
  digitizeFormBlocksToFormItems,
  digitizeQuestionsToFormItems,
  formatFileResponseFields,
  normalizeDigitizeFormBlocks,
  normalizeDigitizeQuestions,
  looksLikeLetteredChoiceOptionTitle,
  looksLikeChoiceCue,
  buildExtractionPrompt,
} from '../lib/library/digitize/extract-questions.ts'
import { eddoFormSiblingFolderNames } from '../lib/library/digitize/place-form.ts'

function asQuestion(item: { questionItem?: QuestionItem['questionItem']; title?: string }): QuestionItem {
  assert.ok(item.questionItem, 'expected a question item')
  return item as QuestionItem
}

test('should normalize a valid LLM questions payload as text answers', () => {
  const questions = normalizeDigitizeQuestions([
    { title: 'Student name', type: 'text', required: true },
    { title: 'Explain your reasoning', type: 'paragraph', required: false },
  ])

  assert.equal(questions.length, 2)
  assert.equal(questions[0].type, 'text')
  assert.equal(questions[1].type, 'paragraph')
  assert.equal(questions[1].required, false)
})

test('should keep draw/diagram items as file in the extracted schema', () => {
  const questions = normalizeDigitizeQuestions([
    {
      title: 'Draw three different free-body diagrams (A, B, and C).',
      type: 'file',
      required: true,
    },
  ])

  assert.equal(questions[0].type, 'file')
})

test('should keep radio and checkbox choice types with options', () => {
  const questions = normalizeDigitizeQuestions([
    {
      title: '2a. How would the amount of force on the head compare?',
      type: 'radio',
      options: [
        'a. same in every collision',
        'b. same in some collisions',
        'c. different in every collision',
      ],
      required: true,
    },
    {
      title: 'Select all that apply',
      type: 'checkbox',
      options: ['Gravity', 'Normal force'],
      required: true,
    },
  ])

  assert.equal(questions[0].type, 'radio')
  assert.equal(questions[0].options?.length, 3)
  assert.equal(questions[1].type, 'checkbox')
  assert.deepEqual(questions[1].options, ['Gravity', 'Normal force'])
})

test('should reject choice questions without options', () => {
  assert.throws(
    () =>
      normalizeDigitizeQuestions([
        { title: 'Pick one', type: 'radio', required: true },
      ]),
    /options/,
  )
})

test('should reject invalid question types', () => {
  assert.throws(
    () => normalizeDigitizeQuestions([{ title: 'Q', type: 'scale', required: true }]),
    /invalid type/,
  )
})

test('should keep valid imageIndexes and reject out-of-range indexes', () => {
  const questions = normalizeDigitizeQuestions(
    [{ title: 'Look at the figure', type: 'paragraph', required: true, imageIndexes: [1, 1, 2] }],
    { imageCount: 2 },
  )
  assert.deepEqual(questions[0].imageIndexes, [1, 2])

  assert.throws(
    () =>
      normalizeDigitizeQuestions(
        [{ title: 'Bad', type: 'text', required: true, imageIndexes: [3] }],
        { imageCount: 2 },
      ),
    /only 2 images exist/,
  )
})

test('should normalize text and question blocks with tables in description', () => {
  const blocks = normalizeDigitizeFormBlocks(
    [
      {
        kind: 'text',
        title: 'Bat mass vs swing speed',
        description: 'Mass (g)\tSpeed (mph)\n284\t74',
        imageIndexes: [6],
      },
      {
        kind: 'question',
        title: 'Question 4) Make a coordinate plot of the data from the table above.',
        type: 'file',
        required: true,
        sourceNumber: 4,
        imageIndexes: [6],
      },
    ],
    { imageCount: 7 },
  )

  assert.equal(blocks.length, 2)
  assert.equal(blocks[0].kind, 'text')
  assert.equal(blocks[1].kind, 'question')
  if (blocks[1].kind === 'question') {
    assert.equal(blocks[1].sourceNumber, 4)
  }
})

test('should map radio questions to choiceQuestion RADIO', () => {
  const items = digitizeQuestionsToFormItems([
    {
      title: '2a. Choose one',
      type: 'radio',
      required: true,
      options: ['a. same', 'b. some', 'c. different'],
    },
  ])

  const q = asQuestion(items[0])
  assert.equal(q.questionItem.question.choiceQuestion?.type, 'RADIO')
  assert.equal(q.questionItem.question.choiceQuestion?.options.length, 3)
  assert.equal(q.questionItem.question.textQuestion, undefined)
  assert.equal(q.title, '2a. Choose one')
})

test('should map file questions to paragraph prompts with file-response wording in curriculum mode', () => {
  const items = digitizeQuestionsToFormItems([
    { title: 'Name', type: 'text', required: true },
    { title: 'Essay', type: 'paragraph', required: false },
    { title: '1. Draw a free-body diagram', type: 'file', required: true },
  ])

  const q0 = asQuestion(items[0])
  const q1 = asQuestion(items[1])
  const q2 = asQuestion(items[2])
  assert.equal(q0.questionItem.question.textQuestion?.paragraph, false)
  assert.equal(q1.questionItem.question.textQuestion?.paragraph, true)
  assert.equal(q2.questionItem.question.textQuestion?.paragraph, true)
  assert.match(q2.title, /1\. Draw a free-body diagram/)
  assert.doesNotMatch(q2.title, /\[File response\]/)
  assert.match(q2.description ?? '', /\[File response\]/)
})

test('should promote draw/plot paragraph prompts to file type', () => {
  const blocks = normalizeDigitizeFormBlocks([
    {
      kind: 'question',
      title: '4. Make a coordinate plot of the data from the table above.',
      type: 'paragraph',
      required: true,
    },
    {
      kind: 'question',
      title: '5. After graphing your data, draw a line of best fit for it.',
      type: 'paragraph',
      required: true,
    },
  ])
  assert.equal(blocks[0].kind, 'question')
  assert.equal(blocks[1].kind, 'question')
  if (blocks[0].kind === 'question' && blocks[1].kind === 'question') {
    assert.equal(blocks[0].type, 'file')
    assert.equal(blocks[1].type, 'file')
  }
})

test('should map file questions to upload prompts when teacher upload folder is provided', () => {
  const folderUrl = 'https://drive.google.com/drive/folders/abc'
  const items = digitizeQuestionsToFormItems(
    [{ title: 'Draw a free-body diagram', type: 'file', required: true }],
    { uploadFolderUrl: folderUrl, fileResponseVariant: 'teacher-export' },
  )

  const q = asQuestion(items[0])
  assert.doesNotMatch(q.title, /\[File response\]/)
  assert.match(q.description ?? '', /\[File response\]/)
  assert.match(q.description ?? '', /abc/)
})

test('should map curriculum file questions to example paste-a-link copy', () => {
  const items = digitizeQuestionsToFormItems(
    [{ title: 'Draw a free-body diagram', type: 'file', required: true }],
    { fileResponseVariant: 'curriculum-example' },
  )

  const q = asQuestion(items[0])
  assert.match(q.description ?? '', /Library example only/i)
  assert.match(q.description ?? '', /File upload/i)
})

test('should map text-only stimulus to textItem with spaced description', () => {
  const items = digitizeFormBlocksToFormItems([
    {
      kind: 'text',
      title: 'Data table',
      description: 'Mass 284\n\nSpeed 74',
    },
    {
      kind: 'question',
      title: '1. Explain',
      type: 'paragraph',
      required: true,
    },
  ])

  assert.equal(items.length, 2)
  assert.ok('textItem' in items[0])
  const textItem = items[0] as TextFormItem
  assert.equal(textItem.title, 'Data table')
  assert.equal(textItem.description, 'Mass 284\n\nSpeed 74')
})

test('should map stimulus with figures to one imageItem card (header + context + figure)', () => {
  const items = digitizeFormBlocksToFormItems(
    [
      {
        kind: 'text',
        title: '2',
        description:
          'Sports scientists concluded that concussions result from headers.\n\nLet’s consider the three main types of systems.',
        imageIndexes: [1],
      },
    ],
    {
      imageSourceUris: new Map([[1, 'https://drive.google.com/uc?export=view&id=img1']]),
    },
  )

  assert.equal(items.length, 1)
  assert.ok('imageItem' in items[0])
  const imageItem = items[0] as ImageFormItem
  assert.equal(imageItem.title, '2')
  assert.match(imageItem.description ?? '', /Sports scientists concluded/)
  assert.match(imageItem.description ?? '', /\n\n/)
  assert.match(imageItem.description ?? '', /Let’s consider/)
  assert.equal(
    imageItem.imageItem.image.sourceUri,
    'https://drive.google.com/uc?export=view&id=img1',
  )
})

test('should map question description under the short header', () => {
  const items = digitizeQuestionsToFormItems([
    {
      title: '2a.',
      description: 'How would the amount of force compare?\n\nUse systems A, B, and C.',
      type: 'paragraph',
      required: true,
    },
  ])
  const q = asQuestion(items[0])
  assert.equal(q.title, '2a.')
  assert.equal(q.description, 'How would the amount of force compare?\n\nUse systems A, B, and C.')
})

test('should expand write-or-upload prompts into paragraph plus optional file', () => {
  const blocks = normalizeDigitizeFormBlocks([
    {
      kind: 'question',
      title: '6. Use words or pictures to explain your model.',
      type: 'paragraph',
      required: true,
      sourceNumber: 6,
    },
  ])
  assert.equal(blocks.length, 2)
  assert.equal(blocks[0].kind, 'question')
  assert.equal(blocks[1].kind, 'question')
  if (blocks[0].kind === 'question' && blocks[1].kind === 'question') {
    assert.equal(blocks[0].type, 'paragraph')
    assert.equal(blocks[1].type, 'file')
    assert.equal(blocks[1].required, false)
    assert.match(blocks[1].title, /photo of your work \(optional\)/)
  }
})

test('should treat "words and pictures" like write-or-upload', () => {
  const blocks = normalizeDigitizeFormBlocks([
    {
      kind: 'question',
      title:
        '3. Use words and pictures to show the structure of your design solution. Draw the proposed design.',
      type: 'paragraph',
      required: true,
    },
  ])
  assert.equal(blocks.length, 2)
  if (blocks[0].kind === 'question' && blocks[1].kind === 'question') {
    assert.equal(blocks[0].type, 'paragraph')
    assert.equal(blocks[1].type, 'file')
  }
})

test('should add a file answer after a Your design text card with no follow-up upload', () => {
  const blocks = normalizeDigitizeFormBlocks([
    {
      kind: 'text',
      title: 'Your design',
      description:
        '3. Use words and pictures to show the structure of your design solution. Draw the proposed design on, over, and around the 2 views of the head shown below.',
      imageIndexes: [2],
    },
    {
      kind: 'question',
      title: '4. Explain how the materials in your design will function.',
      type: 'paragraph',
      required: true,
    },
  ])

  assert.equal(blocks.length, 2)
  assert.equal(blocks[0].kind, 'question')
  if (blocks[0].kind === 'question') {
    assert.equal(blocks[0].type, 'file')
    assert.match(blocks[0].title, /^3\./)
    assert.deepEqual(blocks[0].imageIndexes, [2])
  }
  assert.equal(blocks[1].kind, 'question')
})

test('should merge Your design text card with following file into one upload question', () => {
  const blocks = normalizeDigitizeFormBlocks([
    {
      kind: 'text',
      title: 'Your design',
      description:
        '3. Use words and pictures to show the structure of your design solution. Draw the proposed design.',
      imageIndexes: [2],
    },
    {
      kind: 'question',
      title:
        '3. Use words and pictures to show the structure of your design solution. Draw the proposed design.',
      type: 'file',
      required: true,
      imageIndexes: [2],
    },
  ])

  assert.equal(blocks.length, 1)
  assert.equal(blocks[0].kind, 'question')
  if (blocks[0].kind === 'question') {
    assert.equal(blocks[0].type, 'file')
    assert.match(blocks[0].title, /words and pictures/)
    assert.deepEqual(blocks[0].imageIndexes, [2])
  }
})

test('should emit preceding imageItems for every figure on a question', () => {
  const items = digitizeQuestionsToFormItems(
    [
      {
        title: 'Compare the two figures',
        type: 'paragraph',
        required: true,
        imageIndexes: [1, 2],
      },
    ],
    {
      imageSourceUris: new Map([
        [1, 'https://drive.google.com/uc?export=view&id=img1'],
        [2, 'https://drive.google.com/uc?export=view&id=img2'],
      ]),
    },
  )

  assert.equal(items.length, 3)
  assert.ok('imageItem' in items[0])
  assert.ok('imageItem' in items[1])
  assert.equal(
    items[0].imageItem.image.sourceUri,
    'https://drive.google.com/uc?export=view&id=img1',
  )
  assert.equal(
    items[1].imageItem.image.sourceUri,
    'https://drive.google.com/uc?export=view&id=img2',
  )
  const question = asQuestion(items[2])
  assert.equal(question.questionItem.image, undefined)
})

test('should collect unique referenced image indexes from blocks', () => {
  const indexes = collectReferencedImageIndexes([
    { kind: 'text', title: 'Intro', imageIndexes: [2] },
    { kind: 'question', title: 'A', type: 'text', required: true, imageIndexes: [2, 1] },
    { kind: 'question', title: 'B', type: 'paragraph', required: true, imageIndexes: [1, 3] },
  ])
  assert.deepEqual(indexes, [2, 1, 3])
})

test('should preserve handout numbering and flatten newlines in Form titles', () => {
  const items = digitizeQuestionsToFormItems([
    { title: '1. What do you notice?\nUse the data.', type: 'paragraph', required: true },
  ])
  assert.equal(asQuestion(items[0]).title, '1. What do you notice? Use the data.')
})

test('should convert Name/Date underline text blocks into Name, Hour, and Teacher short answers', () => {
  const blocks = normalizeDigitizeFormBlocks([
    {
      kind: 'text',
      title: 'Name and Date',
      description: 'Name: ______________________________________\nDate: ___________________',
    },
    {
      kind: 'question',
      title: '1. What do you notice?',
      type: 'paragraph',
      required: true,
    },
  ])

  assert.equal(blocks.length, 4)
  assert.equal(blocks[0].kind, 'question')
  assert.equal(blocks[1].kind, 'question')
  assert.equal(blocks[2].kind, 'question')
  assert.equal(blocks[3].kind, 'question')
  if (
    blocks[0].kind === 'question' &&
    blocks[1].kind === 'question' &&
    blocks[2].kind === 'question' &&
    blocks[3].kind === 'question'
  ) {
    assert.equal(blocks[0].title, 'Name')
    assert.equal(blocks[0].type, 'text')
    assert.equal(blocks[1].title, 'Hour')
    assert.equal(blocks[2].title, 'Teacher')
    assert.equal(blocks[3].title, '1. What do you notice?')
  }
})

test('should format file-response fields with upload instructions in description', () => {
  const fields = formatFileResponseFields('Draw a diagram', {
    uploadFolderUrl: 'https://drive.google.com/drive/folders/xyz',
    fileResponseVariant: 'teacher-export',
  })
  assert.match(fields.title, /Draw a diagram/)
  assert.match(fields.description, /\[File response\]/)
  assert.match(fields.description, /xyz/)
})

test('should name sibling asset and uploads folders from form title', () => {
  assert.deepEqual(eddoFormSiblingFolderNames('Baseball Assessment 1 (Eddo)'), [
    'Baseball Assessment 1 (Eddo) — assets',
    'Baseball Assessment 1 (Eddo) — uploads',
    'Baseball Assessment 1 (Eddo) — student uploads',
  ])
})

test('should recognize lettered MCQ option titles but not sub-questions or blanks', () => {
  assert.equal(looksLikeLetteredChoiceOptionTitle('a. same in every collision'), true)
  assert.equal(looksLikeLetteredChoiceOptionTitle('b) different in every collision'), true)
  assert.equal(looksLikeLetteredChoiceOptionTitle('2a. Explain your reasoning'), false)
  assert.equal(looksLikeLetteredChoiceOptionTitle('Bat'), false)
  assert.equal(looksLikeChoiceCue('Circle one of the following'), true)
  assert.equal(looksLikeChoiceCue('List the materials you will use'), false)
})

test('should merge misclassified MCQ alternatives into one radio question', () => {
  const blocks = normalizeDigitizeFormBlocks([
    {
      kind: 'text',
      title: '2a.',
      description: 'How would the amount of force on the head compare? Circle one:',
    },
    { kind: 'question', title: 'a. same in every collision', type: 'text', required: true },
    { kind: 'question', title: 'b. same in some collisions', type: 'text', required: true },
    { kind: 'question', title: 'c. different in every collision', type: 'text', required: true },
    { kind: 'question', title: '2b.', description: 'Explain your choice.', type: 'paragraph', required: true },
  ])

  assert.equal(blocks.length, 2)
  assert.equal(blocks[0].kind, 'question')
  if (blocks[0].kind === 'question') {
    assert.equal(blocks[0].type, 'radio')
    assert.equal(blocks[0].title, '2a.')
    assert.match(blocks[0].description ?? '', /Circle one/)
    assert.deepEqual(blocks[0].options, [
      'a. same in every collision',
      'b. same in some collisions',
      'c. different in every collision',
    ])
  }
  assert.equal(blocks[1].kind, 'question')
  if (blocks[1].kind === 'question') {
    assert.equal(blocks[1].type, 'paragraph')
    assert.equal(blocks[1].title, '2b.')
  }
})

test('should not merge labeled material blanks into a choice question', () => {
  const blocks = normalizeDigitizeFormBlocks([
    {
      kind: 'text',
      title: '3.',
      description: 'The items and objects I will use in my investigation:',
    },
    { kind: 'question', title: 'Bat', type: 'text', required: true },
    { kind: 'question', title: 'Pitcher', type: 'text', required: true },
    { kind: 'question', title: 'Ball', type: 'text', required: true },
  ])

  assert.equal(blocks.length, 4)
  assert.equal(blocks[1].kind, 'question')
  if (blocks[1].kind === 'question') {
    assert.equal(blocks[1].type, 'text')
    assert.equal(blocks[1].title, 'Bat')
  }
})

test('should merge Yes/No/Not sure short answers into one radio', () => {
  const blocks = normalizeDigitizeFormBlocks([
    {
      kind: 'text',
      title: '10a.',
      description: 'Does the warning on the bat label support the coach’s claim? Choose one.',
    },
    { kind: 'question', title: 'Yes', type: 'text', required: true },
    { kind: 'question', title: 'No', type: 'text', required: true },
    { kind: 'question', title: 'Not sure', type: 'text', required: true },
  ])

  assert.equal(blocks.length, 1)
  assert.equal(blocks[0].kind, 'question')
  if (blocks[0].kind === 'question') {
    assert.equal(blocks[0].type, 'radio')
    assert.deepEqual(blocks[0].options, ['Yes', 'No', 'Not sure'])
  }
})

test('should coerce LLM kind:"radio" into kind:"question" type:"radio"', () => {
  const blocks = normalizeDigitizeFormBlocks([
    {
      kind: 'radio',
      title: '3a. Do you agree or disagree with this claim?',
      required: true,
      options: ['a. Agree', 'b. Disagree'],
    },
  ])

  assert.equal(blocks.length, 1)
  assert.equal(blocks[0].kind, 'question')
  if (blocks[0].kind === 'question') {
    assert.equal(blocks[0].type, 'radio')
    assert.deepEqual(blocks[0].options, ['a. Agree', 'b. Disagree'])
  }
})

test('should mention MCQ anti-pattern and Assessment 1 quality bar in the extraction prompt', () => {
  const prompt = buildExtractionPrompt('Baseball Assessment 1', 'Sample handout text', 0)
  assert.match(prompt, /anti-pattern/)
  assert.match(prompt, /labeled blanks vs choices/)
  assert.match(prompt, /ONE "radio"/)
  assert.match(prompt, /Example structure \(follow this quality bar\)/)
  assert.match(prompt, /FULL handout stem/)
  assert.match(prompt, /10a\." radio/)
})
