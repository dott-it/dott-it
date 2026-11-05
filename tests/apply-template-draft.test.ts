import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { describe, it } from 'node:test'
import {
  applyTemplateDraftToForm,
  isTemplateContentField,
  type TemplateContentField,
  type TemplateDraftFields,
} from '../components/backoffice/assessment-templates/apply-template-draft.ts'

const emptyForm = {
  title: '',
  description: '',
  subject: '',
  type: '',
  curriculumTeachersEdition: '',
  curriculumAnswerKey: '',
  unitCode: '8.1',
  lessonNumber: '6',
}

const draft: TemplateDraftFields = {
  title: 'Draft title',
  description: 'Draft description',
  subject: 'Physics',
  type: 'Formative',
  curriculumTeachersEdition: 'Draft TE',
  curriculumAnswerKey: 'Draft AK',
}

describe('applyTemplateDraftToForm', () => {
  it('should fill empty form fields from the draft', () => {
    const next = applyTemplateDraftToForm(emptyForm, draft, new Set())
    assert.equal(next.title, 'Draft title')
    assert.equal(next.description, 'Draft description')
    assert.equal(next.subject, 'Physics')
    assert.equal(next.type, 'Formative')
    assert.equal(next.curriculumTeachersEdition, 'Draft TE')
    assert.equal(next.curriculumAnswerKey, 'Draft AK')
    assert.equal(next.unitCode, '8.1')
    assert.equal(next.lessonNumber, '6')
  })

  it('should keep dirty fields when the draft arrives later', () => {
    const prev = {
      ...emptyForm,
      title: 'User title',
      curriculumTeachersEdition: 'User TE edits',
      curriculumAnswerKey: 'User AK edits',
    }
    const dirty = new Set<TemplateContentField>([
      'title',
      'curriculumTeachersEdition',
      'curriculumAnswerKey',
    ])

    const next = applyTemplateDraftToForm(prev, draft, dirty)

    assert.equal(next.title, 'User title')
    assert.equal(next.curriculumTeachersEdition, 'User TE edits')
    assert.equal(next.curriculumAnswerKey, 'User AK edits')
    assert.equal(next.description, 'Draft description')
    assert.equal(next.subject, 'Physics')
    assert.equal(next.type, 'Formative')
  })

  it('should clear answer key on warning unless the field is dirty', () => {
    const prev = {
      ...emptyForm,
      curriculumAnswerKey: 'Stale key from typing',
    }
    const warningDraft: TemplateDraftFields = {
      ...draft,
      curriculumAnswerKey: '',
      answerKeyWarning: 'Could not load answer key',
    }

    const wiped = applyTemplateDraftToForm(prev, warningDraft, new Set())
    assert.equal(wiped.curriculumAnswerKey, '')

    const kept = applyTemplateDraftToForm(
      prev,
      warningDraft,
      new Set<TemplateContentField>(['curriculumAnswerKey']),
    )
    assert.equal(kept.curriculumAnswerKey, 'Stale key from typing')
  })

  it('should reject invalid draft subject/type when validators are provided', () => {
    const next = applyTemplateDraftToForm(
      emptyForm,
      { ...draft, subject: 'NotASubject', type: 'NotAType' },
      new Set(),
      {
        isSubject: (value) => value === 'Physics',
        isType: (value) => value === 'Formative',
      },
    )
    assert.equal(next.subject, '')
    assert.equal(next.type, '')
  })

  it('should recognize template content fields', () => {
    assert.equal(isTemplateContentField('title'), true)
    assert.equal(isTemplateContentField('unitCode'), false)
  })
})

describe('assessment template create/edit draft wiring', () => {
  it('should keep dirty fields and open the detail page after create', async () => {
    const contents = await readFile(
      'app/(dashboard)/backoffice/assessment-templates/create/page.tsx',
      'utf8',
    )
    assert.match(contents, /applyTemplateDraftToForm/)
    assert.match(contents, /dirtyFieldsRef/)
    assert.match(contents, /abortSignalWithTimeout/)
    assert.match(contents, /assessment-templates\/\$\{template\.id\}/)
    assert.equal(contents.includes("router.push('/backoffice?tab=templates')"), false)
  })

  it('should keep dirty fields when hydrating a lesson on edit', async () => {
    const contents = await readFile(
      'app/(dashboard)/backoffice/assessment-templates/[id]/edit/page.tsx',
      'utf8',
    )
    assert.match(contents, /applyTemplateDraftToForm/)
    assert.match(contents, /dirtyFieldsRef/)
    assert.match(contents, /abortSignalWithTimeout/)
    assert.match(contents, /setDraftLoading\(next\.hydrateLesson\)/)
  })
})
