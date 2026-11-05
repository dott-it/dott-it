import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { AssessmentTemplate } from '../app/types/api/assessment-template.ts'
import {
  collectTemplateBrowseOptions,
  emptyTemplateBrowseFilters,
  filterAssessmentTemplates,
  hasActiveTemplateBrowseFilters,
  lessonOptionsForUnit,
  sortAssessmentTemplatesByUnit,
  templateListSelect,
} from '../lib/assessment-template-browse.ts'

function template(
  partial: Partial<AssessmentTemplate> & Pick<AssessmentTemplate, 'id' | 'title'>,
): AssessmentTemplate {
  return {
    type: 'Entrance/Exit Ticket',
    description: null,
    curriculumTeachersEdition: null,
    curriculumAnswerKey: null,
    subject: 'Physical Science',
    gradeLevel: '8',
    unitCode: '8.1',
    lessonNumber: 6,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...partial,
  }
}

describe('assessment template browse', () => {
  it('should omit curriculum text from the template list query', () => {
    assert.deepEqual(Object.keys(templateListSelect).sort(), [
      'description',
      'gradeLevel',
      'id',
      'lessonNumber',
      'subject',
      'title',
      'type',
      'unitCode',
    ])
    assert.equal('curriculumTeachersEdition' in templateListSelect, false)
    assert.equal('curriculumAnswerKey' in templateListSelect, false)
  })

  const templates = [
    template({ id: 't1', title: 'Soccer forces', description: 'Collision modeling' }),
    template({
      id: 't2',
      title: 'Alaska wildfires',
      unitCode: '7.6',
      lessonNumber: 17,
      subject: 'Earth & Space Science',
      type: 'Formative',
    }),
    template({
      id: 't3',
      title: 'Soccer forces - District A',
      lessonNumber: 6,
      type: 'Formative',
    }),
  ]

  it('should filter by template name and ignore description', () => {
    const byTitle = filterAssessmentTemplates(templates, {
      ...emptyTemplateBrowseFilters,
      search: 'alaska',
    })
    assert.deepEqual(
      byTitle.map((item) => item.id),
      ['t2'],
    )

    const byDescription = filterAssessmentTemplates(templates, {
      ...emptyTemplateBrowseFilters,
      search: 'collision',
    })
    assert.deepEqual(byDescription, [])
  })

  it('should match type filters case-insensitively and collapse type options', () => {
    const mixed = [
      ...templates,
      template({ id: 't4', title: 'Lowercase formative', type: 'formative' }),
    ]
    const matches = filterAssessmentTemplates(mixed, {
      ...emptyTemplateBrowseFilters,
      type: 'Formative',
    })
    assert.deepEqual(
      matches.map((item) => item.id).sort(),
      ['t2', 't3', 't4'],
    )

    const options = collectTemplateBrowseOptions(mixed)
    const formativeOptions = options.types.filter(
      (option) => option.value.toLowerCase() === 'formative',
    )
    assert.equal(formativeOptions.length, 1)
    assert.equal(formativeOptions[0]?.value, 'Formative')
  })

  it('should filter by unit, lesson, subject, and type together', () => {
    const matches = filterAssessmentTemplates(templates, {
      search: '',
      unitCode: '8.1',
      lessonNumber: '6',
      subject: 'Physical Science',
      type: 'Formative',
    })
    assert.deepEqual(
      matches.map((item) => item.id),
      ['t3'],
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
    const matches = filterAssessmentTemplates(templates, filters)
    assert.equal(matches.length, 3)
    assert.equal(hasActiveTemplateBrowseFilters(filters), false)
    assert.equal(
      hasActiveTemplateBrowseFilters({ ...emptyTemplateBrowseFilters, search: 'soccer' }),
      true,
    )
  })

  it('should collect browse options from loaded templates', () => {
    const options = collectTemplateBrowseOptions(templates)
    assert.deepEqual(
      options.units.map((option) => option.value),
      ['7.6', '8.1'],
    )
    assert.deepEqual(
      options.lessons.map((option) => option.value),
      ['6', '17'],
    )
    assert.ok(options.subjects.some((option) => option.value === 'Physical Science'))
    assert.ok(options.types.some((option) => option.value === 'Entrance/Exit Ticket'))
  })

  it('should scope lesson options to the selected unit', () => {
    const lessons = lessonOptionsForUnit(templates, '7.6')
    assert.deepEqual(
      lessons.map((option) => option.value),
      ['17'],
    )
  })

  it('should sort templates by unit, then lesson, then title', () => {
    const sorted = sortAssessmentTemplatesByUnit([
      template({ id: 'c', title: 'B title', unitCode: '8.1', lessonNumber: 6 }),
      template({ id: 'a', title: 'A title', unitCode: '7.6', lessonNumber: 17 }),
      template({ id: 'd', title: 'A title', unitCode: '8.1', lessonNumber: 6 }),
      template({ id: 'b', title: 'No unit', unitCode: null, lessonNumber: null }),
      template({ id: 'e', title: 'Earlier lesson', unitCode: '8.1', lessonNumber: 2 }),
    ])
    assert.deepEqual(
      sorted.map((item) => item.id),
      ['a', 'e', 'd', 'c', 'b'],
    )
  })
})
