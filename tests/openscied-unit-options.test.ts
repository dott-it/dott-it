import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  gradeLevelForUnitCode,
  gradeLevelsMatch,
  listOpenSciEdUnitOptions,
  listOpenSciEdUnitOptionsForGrade,
  normalizeGradeLevelKey,
} from '../lib/openscied-unit-options.ts'

describe('OpenSciEd unit options', () => {
  it('should label units with the unit code only', () => {
    const options = listOpenSciEdUnitOptions()
    assert.ok(options.length > 0)
    for (const option of options) {
      assert.equal(option.label, option.value)
      assert.doesNotMatch(option.label, /Grade/i)
    }
  })

  it('should infer grade level from unit code metadata', () => {
    assert.equal(gradeLevelForUnitCode('8.2'), 'Grade 8')
    assert.equal(gradeLevelForUnitCode(''), null)
    assert.equal(gradeLevelForUnitCode(undefined), null)
  })
})

describe('openscied unit grade matching', () => {
  it('should normalize numbered grades with or without the Grade prefix', () => {
    assert.equal(normalizeGradeLevelKey('Grade 8'), '8')
    assert.equal(normalizeGradeLevelKey('8'), '8')
    assert.equal(normalizeGradeLevelKey('grade 6'), '6')
    assert.equal(normalizeGradeLevelKey('Kindergarten'), 'kindergarten')
  })

  it('should treat Grade 8 and 8 as the same grade level', () => {
    assert.equal(gradeLevelsMatch('Grade 8', '8'), true)
    assert.equal(gradeLevelsMatch('8', 'Grade 8'), true)
    assert.equal(gradeLevelsMatch('Grade 8', 'Grade 6'), false)
  })

  it('should return units when filtering with a bare grade number', () => {
    const byLabel = listOpenSciEdUnitOptionsForGrade('Grade 8')
    const byNumber = listOpenSciEdUnitOptionsForGrade('8')
    assert.ok(byLabel.length > 0)
    assert.deepEqual(
      byNumber.map((unit) => unit.value),
      byLabel.map((unit) => unit.value),
    )
  })
})
