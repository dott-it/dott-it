import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  classifyFormalAssessment,
  isFormalAssessmentFile,
  matchAnswerKey,
  shortTitleFromLessonTitle,
  titleFromAssessmentFileName,
} from '../lib/library/ingest/formal-files.ts'
import { pickLinkedTeOpportunityId } from '../lib/library/ingest/link-te-opportunity.ts'
import { reingestUnitFromDriveIndex } from '../lib/library/ingest/reingest-from-drive-index.ts'
import type { IngestedUnitManifest } from '../lib/library/ingest/types.ts'

test('should keep named assessments and drop self-check / teacher-reference files', () => {
  assert.equal(isFormalAssessmentFile('8.2 Lesson 6 Assessment Assessment'), true)
  assert.equal(isFormalAssessmentFile('8.5 Lesson 10 Assessment Goldfish Assessment'), true)
  assert.equal(isFormalAssessmentFile('8.2 Lesson 6 Teacher Reference Assessment Key'), false)
  assert.equal(isFormalAssessmentFile('8.2 Lesson 6 Answer Key Assessment Key'), false)
  assert.equal(isFormalAssessmentFile('8.2 Lesson 2 Handout Self Assessment'), false)
  assert.equal(isFormalAssessmentFile('8.2 Lesson 11 Handout Peer Feedback Self-Assessment'), false)
  assert.equal(isFormalAssessmentFile('Copy of 8.6 Lesson 11 Assessment Green Anole Lizard'), false)
})

test('should expand truncated Drive stems via overrides and clean leftover Assessment prefix', () => {
  const overrides = {
    '8.3 Lesson 6 Assessment Figuring out the': 'Figuring out the speaker',
  }
  assert.equal(
    titleFromAssessmentFileName('8.3', '8.3 Lesson 6 Assessment Figuring out the.docx', overrides),
    'Figuring out the speaker',
  )
  assert.equal(
    titleFromAssessmentFileName('8.2', '8.2 Lesson 14 Assessment Unit Assessment.docx'),
    'Unit Assessment',
  )
  assert.equal(
    titleFromAssessmentFileName('8.2', '8.2 Lesson 6 Assessment Assessment.docx'),
    'Lesson 6 Assessment',
  )
})

test('should match answer keys by token overlap instead of first file in the folder', () => {
  assert.equal(
    matchAnswerKey('8.5 Lesson 10 Assessment Goldfish Assessment', [
      '8.5 Lesson 10 Answer Key Key for Checklist',
      '8.5 Lesson 10 Answer Key Key for Goldfish',
    ]),
    '8.5 Lesson 10 Answer Key Key for Goldfish',
  )
  assert.equal(
    matchAnswerKey('8.2 Lesson 14 Assessment Unit Assessment', [
      '8.2 Lesson 14 Answer Key Gotta-Have-It Checklist Key',
      '8.2 Lesson 14 Answer Key Unit Assessment Answer',
    ]),
    '8.2 Lesson 14 Answer Key Unit Assessment Answer',
  )
  assert.equal(
    matchAnswerKey('8.3 Lesson 12 Assessment Summative Assessment', [
      '8.3 Lesson 12 Answer Key Electromagnetic Inventions Scoring',
    ]),
    '8.3 Lesson 12 Answer Key Electromagnetic Inventions Scoring',
  )
  assert.equal(
    matchAnswerKey('8.2 Lesson 6 Assessment Assessment', [
      '8.2 Lesson 6 Answer Key Key Connecting Graphical',
      '8.2 Lesson 6 Answer Key Assessment Key',
    ]),
    '8.2 Lesson 6 Answer Key Assessment Key',
  )
  assert.equal(
    matchAnswerKey('8.6 Lesson 6 Assessment “How are penguins', [
      '8.6 Lesson 6 Answer Key Key Argument for',
    ]),
    '8.6 Lesson 6 Answer Key Key Argument for',
  )
  assert.equal(
    matchAnswerKey('8.5 Lesson 14 Assessment Self-assessment for Obtaining,', [
      '8.5 Lesson 14 Answer Key Asexual Reproduction Notes',
    ]),
    null,
  )
})

test('should mark unit / listed lessons as summative', () => {
  assert.equal(classifyFormalAssessment('Unit Assessment', 14, [14]).isSummative, true)
  assert.equal(classifyFormalAssessment('Goldfish Assessment', 10, [17]).assessmentType, 'formative')
  assert.equal(
    classifyFormalAssessment('Self-assessment for Obtaining, Evaluating, and Communicating Information', 14)
      .assessmentType,
    'lesson-reflection',
  )
})

test('should derive a short lesson title from the driving question', () => {
  assert.equal(
    shortTitleFromLessonTitle('How do goldfish get their traits?', 10),
    'How do goldfish get their traits',
  )
  assert.equal(
    shortTitleFromLessonTitle('How does a sound source make something like this happen?', 1),
    'How does a sound source make something like this happen',
  )
  assert.equal(shortTitleFromLessonTitle('Lesson 3', 3), 'Lesson 3')
})

test('should rebuild formals from Drive files and keep TE plus Form URLs', () => {
  const previous: IngestedUnitManifest = {
    unitId: '8.5',
    unitTitle: 'Genetics',
    description: 'Genetics',
    lessonCount: 2,
    lessons: [
      {
        lessonNum: 10,
        shortTitle: 'Lesson 10',
        title: 'How do goldfish get their traits?',
        teacherEditionPath: 'lesson_10/original/8.5 Lesson 10 Teacher Edition.docx',
        expectedDays: 2,
      },
    ],
    assessments: [
      {
        id: '85-10-goldfish-assessment',
        lesson: 'Lesson 10',
        lessonNum: 10,
        title: 'Goldfish Assessment',
        source: 'formal-assessment',
        standards: ['MS-LS3-1'],
        description: 'old',
        files: {
          studentHandout: 'lesson_10/original/8.5 Lesson 10 Assessment Goldfish Assessment.docx',
          teacherGuide: null,
          answerKey: 'lesson_10/original/8.5 Lesson 10 Answer Key Key for Checklist.docx',
          googleForm: 'https://docs.google.com/forms/d/e/1FAIpQLGoldfish/viewform',
          rubric: null,
        },
      },
      {
        id: '85-10-ao-1',
        lesson: 'Lesson 10',
        lessonNum: 10,
        title: 'Listen for trait ideas',
        source: 'te-opportunity',
        standards: ['MS-LS3-1'],
        description: 'TE',
        files: {
          studentHandout: null,
          teacherGuide: 'lesson_10/original/8.5 Lesson 10 Teacher Edition.docx',
          answerKey: null,
          googleForm: null,
          rubric: null,
        },
      },
    ],
  }

  const next = reingestUnitFromDriveIndex({
    unitCode: '8.5',
    previous,
    filesByRelativePath: {
      'Lesson 10 - 8.5 Genetics/8.5 Lesson 10 Teacher Edition': {
        name: '8.5 Lesson 10 Teacher Edition',
        driveFileId: 'te',
      },
      'Lesson 10 - 8.5 Genetics/8.5 Lesson 10 Assessment Goldfish Assessment': {
        name: '8.5 Lesson 10 Assessment Goldfish Assessment',
        driveFileId: 'goldfish',
      },
      'Lesson 10 - 8.5 Genetics/8.5 Lesson 10 Assessment Checklist for Obtaining': {
        name: '8.5 Lesson 10 Assessment Checklist for Obtaining',
        driveFileId: 'checklist',
      },
      'Lesson 10 - 8.5 Genetics/8.5 Lesson 10 Answer Key Key for Goldfish': {
        name: '8.5 Lesson 10 Answer Key Key for Goldfish',
        driveFileId: 'gold-key',
      },
      'Lesson 10 - 8.5 Genetics/8.5 Lesson 10 Answer Key Key for Checklist': {
        name: '8.5 Lesson 10 Answer Key Key for Checklist',
        driveFileId: 'check-key',
      },
      'Lesson 10 - 8.5 Genetics/8.5 Lesson 10 Handout Self-Assessment': {
        name: '8.5 Lesson 10 Handout Self-Assessment',
        driveFileId: 'self',
      },
    },
    titleOverrides: {
      '8.5 Lesson 10 Assessment Checklist for Obtaining': 'Checklist for Obtaining Information',
    },
    summativeLessons: [17],
    standards: ['MS-LS3-1'],
  })

  const formals = next.assessments.filter((row) => row.source === 'formal-assessment')
  assert.equal(formals.length, 2)
  const goldfish = formals.find((row) => row.title === 'Goldfish Assessment')
  assert.ok(goldfish)
  assert.equal(goldfish.files.googleForm, 'https://docs.google.com/forms/d/e/1FAIpQLGoldfish/viewform')
  assert.match(goldfish.files.answerKey ?? '', /Key for Goldfish/)
  assert.equal(
    formals.find((row) => row.title === 'Checklist for Obtaining Information')?.files.answerKey?.includes(
      'Key for Checklist',
    ),
    true,
  )
  assert.equal(next.assessments.some((row) => row.source === 'te-opportunity'), true)
  assert.equal(next.lessons[0]?.shortTitle, 'How do goldfish get their traits')
  assert.equal(goldfish.linkedTeOpportunityId, '85-10-ao-1')
})

test('should prefer the TE callout that tells students to complete the assessment', () => {
  const linkedId = pickLinkedTeOpportunityId('How can objects make different sounds?', [
    {
      id: 'ao-practice',
      title: 'Connecting Graphical Representations',
      whatToDo: 'This practice contains scaffolding before the independent assessment.',
    },
    {
      id: 'ao-formal',
      title: 'Connecting Graphical Representations',
      buildingTowards: 'Building towards: 6.B Use a model to explain vibration.',
      lookListenFor: 'All objects vibrate when they make sound.',
      whatToDo: 'Ask students to complete the assessment. Refer to Assessment Key.',
      peCode: '6.B',
    },
  ])
  assert.equal(linkedId, 'ao-formal')
})
