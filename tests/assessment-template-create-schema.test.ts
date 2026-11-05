import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { listIngestedUnitCodes } from '../lib/library/ingest/load-manifest.ts'
import { listIngestedUnitCodes as listClientUnitCodes } from '../lib/library/ingest/ingested-unit-codes.ts'
import {
  TEMPLATE_TYPE_OPTIONS,
  templateUnitSelectOptions,
} from '../components/backoffice/assessment-templates/assessment-template-options.ts'
import {
  createTemplateSchema,
  emptyCreateTemplateFormState,
} from '../app/(dashboard)/backoffice/assessment-templates/schemas.ts'

describe('assessment template create schema', () => {
  it('should include Entrance/Exit Ticket in type options', () => {
    assert.ok(TEMPLATE_TYPE_OPTIONS.includes('Entrance/Exit Ticket'))
  })

  it('should require unit and lesson', () => {
    const result = createTemplateSchema.safeParse({
      ...emptyCreateTemplateFormState,
      title: 'Template',
      type: 'Formative',
      subject: 'Biology',
    })
    assert.equal(result.success, false)
    if (!result.success) {
      const fields = result.error.flatten().fieldErrors
      assert.ok(fields.unitCode)
      assert.ok(fields.lessonNumber)
    }
  })

  it('should accept a valid create payload with lesson number', () => {
    const result = createTemplateSchema.safeParse({
      title: 'Soccer assessment',
      type: 'Entrance/Exit Ticket',
      subject: 'Physical Science',
      description: 'Collision modeling',
      curriculumTeachersEdition: 'TE notes',
      curriculumAnswerKey: 'Key notes',
      gradeLevel: '',
      unitCode: '8.1',
      lessonNumber: '6',
    })
    assert.equal(result.success, true)
  })

  it('should only list ingested library units in the create unit select', () => {
    const optionsSource = readFileSync(
      new URL(
        '../components/backoffice/assessment-templates/assessment-template-options.ts',
        import.meta.url,
      ),
      'utf8',
    )
    assert.equal(optionsSource.includes('load-manifest'), false)
    assert.deepEqual(listClientUnitCodes(), listIngestedUnitCodes())

    const ingested = new Set(listIngestedUnitCodes())
    assert.ok(templateUnitSelectOptions.length > 0)
    assert.ok(templateUnitSelectOptions.every((option) => ingested.has(option.value)))
    assert.ok(templateUnitSelectOptions.some((option) => option.value === '8.1'))
    assert.equal(
      templateUnitSelectOptions.some((option) => option.value === '1.1'),
      false,
    )
  })
})
