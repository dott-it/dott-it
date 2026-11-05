import assert from 'node:assert/strict'
import { test } from 'node:test'
import { unitBrowseModelFromManifest } from '../lib/library/ingest/to-browse-model.ts'
import type { IngestedUnitManifest } from '../lib/library/ingest/types.ts'

test('should keep only the first assessment when ingest ids collide', () => {
  const manifest: IngestedUnitManifest = {
    unitId: '8.2',
    unitTitle: 'Sound Waves',
    description: 'test',
    lessonCount: 1,
    assessments: [
      {
        id: 'dup-id',
        lesson: 'Lesson 02',
        lessonNum: 2,
        title: 'Self Assessment',
        source: 'formal-assessment',
        standards: [],
        description: 'first',
        files: {
          studentHandout: 'a.docx',
          teacherGuide: null,
          answerKey: null,
          googleForm: null,
          rubric: null,
        },
      },
      {
        id: 'dup-id',
        lesson: 'Lesson 02',
        lessonNum: 2,
        title: 'Self-Assessment',
        source: 'formal-assessment',
        standards: [],
        description: 'second',
        files: {
          studentHandout: 'b.docx',
          teacherGuide: null,
          answerKey: null,
          googleForm: null,
          rubric: null,
        },
      },
    ],
  }

  const model = unitBrowseModelFromManifest(manifest, {
    unitCode: '8.2',
    title: 'Sound Waves',
    subject: 'Physical Science',
    grade: 8,
    drivingQuestion: 'How does sound travel?',
  })

  const lesson2 = model.lessons.find((lesson) => lesson.lessonNumber === 2)
  assert.ok(lesson2)
  assert.equal(lesson2.assessments.length, 1)
  assert.equal(lesson2.assessments[0]?.title, 'Self Assessment')
})
