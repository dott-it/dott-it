import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import type { AssessmentTemplate } from '../app/types/api/assessment-template.ts'
import {
  copyTitlesTaken,
  findExactTemplateTitleConflict,
  findStructuralTemplateDuplicates,
  isTemplateUniqueConflict,
  nextCopyTitle,
  templateConflictSelect,
  templateTitleConflictResponse,
  titleMatchesExistingTemplate,
} from '../lib/assessment-template-duplicates.ts'

function template(partial: Partial<AssessmentTemplate> & Pick<AssessmentTemplate, 'id' | 'title'>): AssessmentTemplate {
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

describe('assessment template duplicates', () => {
  const existing = [
    template({ id: 't1', title: 'Soccer forces', unitCode: '8.1', lessonNumber: 6, type: 'Entrance/Exit Ticket' }),
    template({
      id: 't2',
      title: 'Soccer forces - District A',
      unitCode: '8.1',
      lessonNumber: 6,
      type: 'Entrance/Exit Ticket',
    }),
    template({ id: 't3', title: 'Other lesson', unitCode: '8.1', lessonNumber: 7, type: 'Entrance/Exit Ticket' }),
    template({ id: 't4', title: 'Soccer forces', unitCode: '8.1', lessonNumber: 6, type: 'Formative' }),
  ]

  it('should find structural duplicates by unit, lesson, and type', () => {
    const matches = findStructuralTemplateDuplicates(existing, {
      unitCode: '8.1',
      lessonNumber: 6,
      type: 'Entrance/Exit Ticket',
    })
    assert.deepEqual(
      matches.map((item) => item.id),
      ['t1', 't2'],
    )
  })

  it('should ignore whitespace differences when matching structure', () => {
    const matches = findStructuralTemplateDuplicates(existing, {
      unitCode: ' 8.1 ',
      lessonNumber: 6,
      type: ' Entrance/Exit Ticket ',
    })
    assert.equal(matches.length, 2)
  })

  it('should match type case-insensitively for structural duplicates', () => {
    const seeded = [
      ...existing,
      template({ id: 't5', title: 'Seed formative', unitCode: '8.1', lessonNumber: 6, type: 'formative' }),
    ]
    const matches = findStructuralTemplateDuplicates(seeded, {
      unitCode: '8.1',
      lessonNumber: 6,
      type: 'Formative',
    })
    assert.deepEqual(
      matches.map((item) => item.id).sort(),
      ['t4', 't5'],
    )
  })

  it('should return no structural matches for a free unit/lesson/type combo', () => {
    const matches = findStructuralTemplateDuplicates(existing, {
      unitCode: '8.2',
      lessonNumber: 1,
      type: 'Summative',
    })
    assert.equal(matches.length, 0)
  })

  it('should ignore the template being updated when checking title conflicts', () => {
    const conflict = findExactTemplateTitleConflict(
      existing,
      {
        unitCode: '8.1',
        lessonNumber: 6,
        type: 'formative',
        title: 'Soccer forces',
      },
      't4',
    )
    assert.equal(conflict, undefined)

    const other = findExactTemplateTitleConflict(existing, {
      unitCode: '8.1',
      lessonNumber: 6,
      type: 'Formative',
      title: 'Soccer forces',
    })
    assert.equal(other?.id, 't4')
  })

  it('should read only the columns used to compare a title conflict', () => {
    assert.deepEqual(Object.keys(templateConflictSelect).sort(), [
      'id',
      'lessonNumber',
      'title',
      'type',
      'unitCode',
    ])
    assert.equal('curriculumTeachersEdition' in templateConflictSelect, false)
    assert.equal('curriculumAnswerKey' in templateConflictSelect, false)
  })

  it('should treat a unique-index violation as a template conflict', () => {
    assert.equal(isTemplateUniqueConflict({ code: 'P2002' }), true)
    assert.equal(isTemplateUniqueConflict({ code: 'P2003' }), false)
    assert.equal(isTemplateUniqueConflict(new Error('duplicate')), false)

    const body = templateTitleConflictResponse('template-1')
    assert.equal(body.error, 'Conflict')
    assert.match(body.details, /template-1/)
  })

  it('should define a case-insensitive unique index for unit, lesson, type, and title', () => {
    const sql = readFileSync(
      new URL(
        '../prisma/assessment/migrations/20260929140000_template_structure_title_unique/migration.sql',
        import.meta.url,
      ),
      'utf8',
    )
    assert.match(sql, /CREATE UNIQUE INDEX "AssessmentTemplate_structure_title_key"/)
    assert.match(sql, /lower\(btrim\("unitCode"\)\)/)
    assert.match(sql, /"lessonNumber"/)
    assert.match(sql, /lower\(btrim\("type"\)\)/)
    assert.match(sql, /lower\(btrim\("title"\)\)/)
    assert.match(sql, /"lessonNumber" IS NOT NULL/)
    assert.match(sql, /DROP INDEX "AssessmentTemplate_structure_title_key"/)
    assert.match(sql, /\(Copy/)
    assert.equal(/DELETE FROM "AssessmentTemplate"/i.test(sql), false)
    assert.equal(sql.includes('"templateId"'), false)
  })

  it('should pick the next free copy title', () => {
    assert.equal(nextCopyTitle('Soccer forces (Copy)', ['Soccer forces (Copy)']), 'Soccer forces (Copy 2)')
    assert.equal(
      nextCopyTitle('Soccer forces (Copy 2)', ['soccer forces (copy)', 'Soccer forces (Copy 2)']),
      'Soccer forces (Copy 3)',
    )
    assert.equal(nextCopyTitle('Soccer forces', []), 'Soccer forces (Copy)')
    assert.equal(
      nextCopyTitle('Soccer forces', ['Soccer forces (Copy)']),
      'Soccer forces (Copy 2)',
    )
    assert.equal(
      nextCopyTitle('Soccer forces', ['  soccer forces (copy)  ', 'Soccer forces (Copy 2)']),
      'Soccer forces (Copy 3)',
    )
  })

  it('should ignore titles from a different lesson when choosing a copy name', () => {
    const taken = copyTitlesTaken(
      [
        template({ id: 'same', title: 'Soccer forces (Copy)', lessonNumber: 6, type: 'Formative' }),
        template({ id: 'other', title: 'Soccer forces (Copy 2)', lessonNumber: 7, type: 'Formative' }),
      ],
      { unitCode: '8.1', lessonNumber: 6, type: 'formative' },
    )
    assert.deepEqual(taken, ['Soccer forces (Copy)'])
    assert.equal(nextCopyTitle('Soccer forces', taken), 'Soccer forces (Copy 2)')
  })

  it('should detect a colliding title case-insensitively', () => {
    const structural = findStructuralTemplateDuplicates(existing, {
      unitCode: '8.1',
      lessonNumber: 6,
      type: 'Entrance/Exit Ticket',
    })
    assert.equal(titleMatchesExistingTemplate(structural, '  SOCCER FORCES  '), true)
    assert.equal(titleMatchesExistingTemplate(structural, 'Soccer forces - District B'), false)
  })
})
