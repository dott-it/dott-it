import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  assessmentListInclude,
  assessmentListRecordSelect,
  assessmentListTemplateSelect,
  mapAssessmentListRow,
  type AssessmentListSource,
} from '../lib/assessment-list-map.ts'

function source(
  partial: Partial<AssessmentListSource> & {
    template?: Partial<AssessmentListSource['template']>
  } = {},
): AssessmentListSource {
  const { template, ...rest } = partial
  return {
    id: 'assessment-1',
    tenantId: 'tenant-1',
    teacherId: 'teacher-1',
    assignedBy: 'teacher-1',
    assignedTo: {},
    schoolYear: '2025-2026',
    unitCode: '8.1',
    studentResponsesCount: 2,
    dueAt: '2026-02-01',
    assignedAt: '2026-01-01',
    status: 'live',
    assessmentRecords: [{ status: 'submitted' }, { status: 'handed_in' }],
    template: {
      title: 'Soccer forces',
      subject: 'Physical Science',
      gradeLevel: '8',
      description: 'Collision modeling',
      unitCode: '7.6',
      lessonNumber: 6,
      type: 'Formative',
      ...template,
    },
    ...rest,
  }
}

describe('assessment list map', () => {
  it('should omit curriculum text and record history from the list query', () => {
    assert.equal('lessonNumber' in assessmentListTemplateSelect, true)
    assert.equal('curriculumTeachersEdition' in assessmentListTemplateSelect, false)
    assert.equal('curriculumAnswerKey' in assessmentListTemplateSelect, false)
    assert.deepEqual(assessmentListRecordSelect, { status: true })
    assert.equal('include' in assessmentListInclude.assessmentRecords, false)
    assert.deepEqual(assessmentListInclude.template.select, assessmentListTemplateSelect)
  })

  it('should copy lessonNumber from the template onto the list payload', () => {
    const row = mapAssessmentListRow(
      source({
        unitCode: '8.1',
        template: { unitCode: '7.6', lessonNumber: 6, subject: '  ' },
      }),
      new Map(),
      new Map(),
    )

    assert.equal(row.lessonNumber, 6)
    assert.equal(row.unitCode, '8.1')
    assert.equal(row.unitName, '8.1')
    assert.equal(row.subject, '')
    assert.equal(row.pendingRecords, 1)
    assert.equal(row.submissionStatus.handedIn, 1)
  })

  it('should fall back to the template unit when the assessment has none', () => {
    const row = mapAssessmentListRow(
      source({
        unitCode: null,
        template: { unitCode: '7.6', lessonNumber: null, subject: null },
      }),
      new Map([['teacher-1', { id: 'teacher-1', name: 'Ada', email: 'ada@school.edu' }]]),
      new Map([['tenant-1', { id: 'tenant-1', name: 'District A', slug: 'district-a' }]]),
    )

    assert.equal(row.unitCode, '7.6')
    assert.equal(row.lessonNumber, null)
    assert.equal(row.subject, '')
    assert.equal(row.unitName, '7.6')
    assert.equal(row.teacher?.name, 'Ada')
    assert.equal(row.tenant?.name, 'District A')
  })

  it('should use a real subject as the unit label when no unit code exists', () => {
    const row = mapAssessmentListRow(
      source({
        unitCode: null,
        template: { unitCode: null, subject: 'Earth and Space' },
      }),
      new Map(),
      new Map(),
    )

    assert.equal(row.unitCode, null)
    assert.equal(row.unitName, 'Earth and Space')
    assert.equal(row.subject, 'Earth and Space')
  })

  it('should leave the unit label empty when there is no unit and no subject', () => {
    const row = mapAssessmentListRow(
      source({
        unitCode: '   ',
        template: { unitCode: null, subject: '   ' },
      }),
      new Map(),
      new Map(),
    )

    assert.equal(row.unitCode, null)
    assert.equal(row.unitName, '')
    assert.equal(row.subject, '')
  })
})
