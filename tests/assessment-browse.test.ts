import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { ActiveAssessment } from '../app/types/api/assessment.ts'
import {
  assessmentBrowseContextLine,
  assessmentBrowseSchoolYearOptions,
  assessmentListSchoolYearParam,
  collectAssessmentBrowseOptions,
  emptyAssessmentBrowseFilters,
  filterAssessments,
  hasActiveAssessmentBrowseFilters,
  lessonOptionsForAssessmentUnit,
  sortAssessmentsByUnit,
} from '../lib/assessment-browse.ts'

function assessment(
  partial: Partial<ActiveAssessment> & Pick<ActiveAssessment, 'id' | 'title'>,
): ActiveAssessment {
  return {
    tenantId: 'tenant-1',
    templateId: 'template-1',
    teacherId: 'teacher-1',
    assignedBy: 'teacher-1',
    assignedAt: '2026-01-01',
    dueAt: '2026-02-01',
    assignedTo: {},
    status: 'live',
    numberOfQuestions: 3,
    totalRecords: 0,
    unitCode: '8.1',
    lessonNumber: 6,
    subject: 'Physical Science',
    type: 'Entrance/Exit Ticket',
    description: '',
    ...partial,
  }
}

describe('assessment browse', () => {
  const assessments = [
    assessment({ id: 'a1', title: 'Soccer forces', description: 'Collision modeling' }),
    assessment({
      id: 'a2',
      title: 'Alaska wildfires',
      unitCode: '7.6',
      lessonNumber: 17,
      subject: 'Earth & Space Science',
      type: 'Formative',
    }),
    assessment({
      id: 'a3',
      title: 'Soccer forces - District A',
      lessonNumber: 6,
      type: 'Formative',
      tenant: { id: 't1', name: 'District A', slug: 'district-a' },
    }),
  ]

  it('should filter by search across title, description, subject, and tenant', () => {
    const byTitle = filterAssessments(assessments, {
      ...emptyAssessmentBrowseFilters,
      search: 'alaska',
    })
    assert.deepEqual(
      byTitle.map((item) => item.id),
      ['a2'],
    )

    const byDescription = filterAssessments(assessments, {
      ...emptyAssessmentBrowseFilters,
      search: 'collision',
    })
    assert.deepEqual(
      byDescription.map((item) => item.id),
      ['a1'],
    )

    const bySubject = filterAssessments(assessments, {
      ...emptyAssessmentBrowseFilters,
      search: 'earth',
    })
    assert.deepEqual(
      bySubject.map((item) => item.id),
      ['a2'],
    )

    const byTenant = filterAssessments(assessments, {
      ...emptyAssessmentBrowseFilters,
      search: 'district',
    })
    assert.deepEqual(
      byTenant.map((item) => item.id),
      ['a3'],
    )
  })

  it('should ignore the synthetic unit name when searching', () => {
    const rows = [
      assessment({
        id: 'real',
        title: 'Plate motion',
        subject: 'Earth and Space',
        description: '',
        unitName: '7.6',
      }),
      assessment({
        id: 'fallback',
        title: 'Volcanoes',
        subject: '',
        description: '',
        unitCode: null,
        unitName: 'Science',
      }),
    ]
    const matches = filterAssessments(rows, {
      ...emptyAssessmentBrowseFilters,
      search: 'science',
    })
    assert.deepEqual(
      matches.map((item) => item.id),
      [],
    )
  })

  it('should match search against the unit code', () => {
    const byUnit = filterAssessments(assessments, {
      ...emptyAssessmentBrowseFilters,
      search: '7.6',
    })
    assert.deepEqual(
      byUnit.map((item) => item.id),
      ['a2'],
    )
  })

  it('should build the same context line for grid and list', () => {
    assert.equal(
      assessmentBrowseContextLine({
        schoolYear: '2025-2026',
        tenant: { name: 'District A' },
        teacher: { name: '', email: 'ada@school.edu' },
      }),
      '2025-2026 · District A · ada@school.edu',
    )
    assert.equal(
      assessmentBrowseContextLine({
        schoolYear: '  ',
        tenant: { name: null },
        teacher: null,
      }),
      '',
    )
  })

  it('should scope the list query to the selected school year', () => {
    assert.deepEqual(assessmentListSchoolYearParam('current'), { schoolYear: 'current' })
    assert.deepEqual(assessmentListSchoolYearParam('prior'), { schoolYear: 'prior' })
    assert.deepEqual(assessmentListSchoolYearParam('all'), {})

    const options = assessmentBrowseSchoolYearOptions(new Date(Date.UTC(2026, 2, 1)))
    assert.deepEqual(
      options.map((option) => option.value),
      ['current', 'prior', 'all'],
    )
    assert.equal(options[0]?.label, 'Current (2025-2026)')
  })

  it('should match type filters case-insensitively and collapse type options', () => {
    const mixed = [
      ...assessments,
      assessment({ id: 'a4', title: 'Lowercase formative', type: 'formative' }),
    ]
    const matches = filterAssessments(mixed, {
      ...emptyAssessmentBrowseFilters,
      type: 'Formative',
    })
    assert.deepEqual(
      matches.map((item) => item.id).sort(),
      ['a2', 'a3', 'a4'],
    )

    const options = collectAssessmentBrowseOptions(mixed)
    const formativeOptions = options.types.filter(
      (option) => option.value.toLowerCase() === 'formative',
    )
    assert.equal(formativeOptions.length, 1)
    assert.equal(formativeOptions[0]?.value, 'Formative')
  })

  it('should prefer mixed-case type labels over all caps', () => {
    const capsFirst = collectAssessmentBrowseOptions([
      assessment({ id: 'caps', title: 'Caps first', type: 'FORMATIVE' }),
      assessment({ id: 'mixed', title: 'Mixed case', type: 'Formative' }),
    ])
    const mixedFirst = collectAssessmentBrowseOptions([
      assessment({ id: 'mixed', title: 'Mixed case', type: 'Formative' }),
      assessment({ id: 'caps', title: 'Caps first', type: 'FORMATIVE' }),
    ])

    assert.equal(
      capsFirst.types.find((option) => option.value.toLowerCase() === 'formative')?.value,
      'Formative',
    )
    assert.equal(
      mixedFirst.types.find((option) => option.value.toLowerCase() === 'formative')?.value,
      'Formative',
    )
  })

  it('should filter by unit, lesson, subject, and type together', () => {
    const matches = filterAssessments(assessments, {
      search: '',
      unitCode: '8.1',
      lessonNumber: '6',
      subject: 'Physical Science',
      type: 'Formative',
    })
    assert.deepEqual(
      matches.map((item) => item.id),
      ['a3'],
    )
  })

  it('should treat "all" filter values as inactive', () => {
    const filters = {
      search: '',
      unitCode: 'all',
      lessonNumber: 'all',
      subject: 'all',
      type: 'all',
    }
    assert.equal(filterAssessments(assessments, filters).length, 3)
    assert.equal(hasActiveAssessmentBrowseFilters(filters), false)
  })

  it('should collect browse options from loaded assessments', () => {
    const options = collectAssessmentBrowseOptions(assessments)
    assert.deepEqual(
      options.units.map((option) => option.value),
      ['7.6', '8.1'],
    )
    assert.deepEqual(
      options.lessons.map((option) => option.value),
      ['6', '17'],
    )
  })

  it('should scope lesson options to the selected unit', () => {
    const lessons = lessonOptionsForAssessmentUnit(assessments, '7.6')
    assert.deepEqual(
      lessons.map((option) => option.value),
      ['17'],
    )
  })

  it('should sort assessments by unit, then lesson, then title', () => {
    const sorted = sortAssessmentsByUnit([
      assessment({ id: 'c', title: 'B title', unitCode: '8.1', lessonNumber: 6 }),
      assessment({ id: 'a', title: 'A title', unitCode: '7.6', lessonNumber: 17 }),
      assessment({ id: 'd', title: 'A title', unitCode: '8.1', lessonNumber: 6 }),
      assessment({ id: 'b', title: 'No unit', unitCode: null, lessonNumber: null }),
      assessment({ id: 'e', title: 'Earlier lesson', unitCode: '8.1', lessonNumber: 2 }),
    ])
    assert.deepEqual(
      sorted.map((item) => item.id),
      ['a', 'e', 'd', 'c', 'b'],
    )
  })
})
