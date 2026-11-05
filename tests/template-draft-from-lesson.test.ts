import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildTemplateDraftFieldsFromLesson,
  formatLessonTeachersEdition,
} from '../lib/library/browse/template-draft-fields.ts'
import {
  ANSWER_KEY_PARTIAL_MESSAGE,
  ANSWER_KEY_UNAVAILABLE_MESSAGE,
  combineAnswerKeySections,
  driveAnswerKeySection,
} from '../lib/library/browse/template-draft-from-lesson.ts'
import type { UnitBrowseModel } from '../lib/library/browse/types.ts'

function sampleUnit(): UnitBrowseModel {
  return {
    unitCode: '8.1',
    title: 'Contact Forces',
    subject: 'Physical Science',
    description: 'Unit description',
    drivingQuestion: 'Why do things get damaged?',
    grade: 8,
    lessonCount: 1,
    assessmentShape: {
      lessonCount: 1,
      opportunityCount: 1,
      assessmentCount: 1,
      totalPacingDays: 2,
    },
    lessons: [
      {
        lessonNumber: 6,
        topic: 'Soccer assessment',
        drivingQuestion: 'What happens in a soccer collision?',
        pacingDays: 2,
        assessments: [
          {
            id: '81-6-soccer-assessment',
            slug: 'soccer',
            title: 'Soccer Assessment',
            category: 'Formative',
            categoryLabel: 'Formative',
            standards: [],
            lessonNumber: 6,
          },
        ],
        opportunities: [
          {
            id: 'opp-1',
            slug: 'opp-1',
            title: 'AO Soccer',
            category: 'Formative',
            categoryLabel: 'Formative',
            lessonNumber: 6,
            standards: [],
            purpose: 'Check modeling',
            keyFocus: 'Forces',
            buildingTowards: 'Build toward force interactions',
            whatToLookFor: 'Students name contact forces',
            whatToDo: 'Prompt with evidence',
          },
        ],
      },
    ],
    timeline: [],
  }
}

describe('template draft from lesson', () => {
  it('should build title description subject type and TE from the selected lesson', () => {
    const draft = buildTemplateDraftFieldsFromLesson(sampleUnit(), 6)
    assert.ok(draft)
    assert.equal(draft.title, 'Soccer assessment')
    assert.equal(draft.description, 'What happens in a soccer collision?')
    assert.equal(draft.subject, 'Physical Science')
    assert.equal(draft.type, 'Formative')
    assert.match(draft.curriculumTeachersEdition, /Building towards/)
    assert.match(draft.curriculumTeachersEdition, /Build toward force interactions/)
    assert.match(draft.curriculumTeachersEdition, /What to look \/ listen for/)
    assert.match(draft.curriculumTeachersEdition, /What to do/)
    assert.equal(draft.curriculumAnswerKey, '')
    assert.equal(draft.answerKeyWarning, null)
  })

  it('should warn when an answer key file fails to load instead of treating empty text as content', () => {
    const partial = combineAnswerKeySections([
      { text: '### Soccer\n\nForces diagram', failed: false },
      { text: '', failed: true },
    ])
    assert.match(partial.curriculumAnswerKey, /Forces diagram/)
    assert.equal(partial.answerKeyWarning, ANSWER_KEY_PARTIAL_MESSAGE)
    assert.doesNotMatch(partial.answerKeyWarning ?? '', /empty field/)

    const failed = combineAnswerKeySections([{ text: '', failed: true }])
    assert.equal(failed.curriculumAnswerKey, '')
    assert.match(failed.answerKeyWarning ?? '', /empty field/)
    assert.equal(failed.answerKeyWarning, ANSWER_KEY_UNAVAILABLE_MESSAGE)

    const missing = combineAnswerKeySections([{ text: '', failed: false }])
    assert.equal(missing.curriculumAnswerKey, '')
    assert.equal(missing.answerKeyWarning, null)
  })

  it('should treat an empty Drive extraction as a failed answer key', () => {
    assert.deepEqual(driveAnswerKeySection(''), { text: '', failed: true })
    assert.deepEqual(driveAnswerKeySection('   '), { text: '', failed: true })
    assert.deepEqual(driveAnswerKeySection('Forces diagram'), {
      text: 'Forces diagram',
      failed: false,
    })
  })

  it('should return null when the lesson is missing', () => {
    assert.equal(buildTemplateDraftFieldsFromLesson(sampleUnit(), 99), null)
  })

  it('should infer Entrance/Exit Ticket from exit ticket titles', () => {
    const unit = sampleUnit()
    unit.lessons[0]!.assessments = [
      {
        id: 'exit-1',
        slug: 'exit',
        title: 'Lesson 3 Exit Ticket',
        category: 'Formative',
        categoryLabel: 'Formative',
        standards: [],
        lessonNumber: 6,
        description: 'Quick check',
      },
    ]
    const draft = buildTemplateDraftFieldsFromLesson(unit, 6)
    assert.equal(draft?.type, 'Entrance/Exit Ticket')
  })

  it('should infer Entrance/Exit Ticket from a pre-assessment entrance ticket', () => {
    const unit = sampleUnit()
    unit.lessons[0]!.assessments = []
    unit.lessons[0]!.opportunities = [
      {
        id: 'opp-exit',
        slug: 'opp-exit',
        title: 'Entrance ticket',
        category: 'Pre',
        categoryLabel: 'Pre-assessment',
        lessonNumber: 6,
        standards: [],
        purpose: 'Check what students already know',
        keyFocus: '',
      },
    ]
    const draft = buildTemplateDraftFieldsFromLesson(unit, 6)
    assert.equal(draft?.type, 'Entrance/Exit Ticket')
  })

  it('should infer Peer-Assessment from peer lesson assessments', () => {
    const unit = sampleUnit()
    unit.lessons[0]!.assessments = [
      {
        id: 'peer-1',
        slug: 'peer',
        title: 'Peer review',
        category: 'Peer',
        categoryLabel: 'Peer',
        standards: [],
        lessonNumber: 6,
      },
    ]
    const draft = buildTemplateDraftFieldsFromLesson(unit, 6)
    assert.equal(draft?.type, 'Peer-Assessment')
  })

  it('should skip opportunities without TE facilitation content', () => {
    const unit = sampleUnit()
    unit.lessons[0]!.opportunities.push({
      id: 'opp-empty',
      slug: 'opp-empty',
      title: 'Empty',
      category: 'Formative',
      categoryLabel: 'Formative',
      lessonNumber: 6,
      standards: [],
      purpose: '',
      keyFocus: '',
    })
    const te = formatLessonTeachersEdition(unit.lessons[0]!)
    assert.doesNotMatch(te, /### Empty/)
    assert.match(te, /### AO Soccer/)
  })

  it('should reuse cached answer key text for the same file', async () => {
    const { cachedAnswerKeyText } = await import(
      '../lib/library/browse/template-draft-from-lesson.ts'
    )
    let calls = 0
    const load = async () => {
      calls += 1
      return '  answer key  '
    }
    const cacheKey = `test-cache-${Date.now()}`
    assert.equal(await cachedAnswerKeyText(cacheKey, load), 'answer key')
    assert.equal(await cachedAnswerKeyText(cacheKey, load), 'answer key')
    assert.equal(calls, 1)
  })

  it('should resolve Drive file ids for lesson answer keys from the drive index', async () => {
    const { resolveAnswerKeyDriveFileId } = await import(
      '../lib/library/browse/template-draft-from-lesson.ts'
    )
    const driveFileId = resolveAnswerKeyDriveFileId('8.1', '81-6-soccer-assessment')
    assert.equal(typeof driveFileId, 'string')
    assert.ok(driveFileId && driveFileId.length > 10)
  })
})
