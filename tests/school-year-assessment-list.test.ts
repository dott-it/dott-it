import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  getCurrentSchoolYear,
  getSchoolYearForDate,
  inferSchoolYear,
  isValidSchoolYear,
  listRecentSchoolYears,
  parseSchoolYearListFilter,
  schoolYearWhereClause,
} from '../lib/school-year.ts'
import { formatAssignedToClass } from '../lib/assessment-assigned-to.ts'

describe('school year helpers', () => {
  it('should treat July 1 as the start of a new school year', () => {
    assert.equal(getSchoolYearForDate(new Date(Date.UTC(2025, 6, 1))), '2025-2026')
  })

  it('should keep June 30 in the previous school year', () => {
    assert.equal(getSchoolYearForDate(new Date(Date.UTC(2025, 5, 30))), '2024-2025')
  })

  it('should validate YYYY-YYYY school year format', () => {
    assert.equal(isValidSchoolYear('2025-2026'), true)
    assert.equal(isValidSchoolYear('2025-2027'), false)
    assert.equal(isValidSchoolYear('2025'), false)
  })

  it('should list recent school years newest first including current', () => {
    const years = listRecentSchoolYears(3, new Date(Date.UTC(2026, 0, 15)))
    assert.deepEqual(years, ['2025-2026', '2024-2025', '2023-2024'])
  })

  it('should infer school year from assignedAt then dueAt', () => {
    assert.equal(inferSchoolYear('2024-09-01T00:00:00.000Z', null), '2024-2025')
    assert.equal(inferSchoolYear(null, '2023-03-01T00:00:00.000Z'), '2022-2023')
  })

  it('should build prisma where clauses for current and prior filters', () => {
    const now = new Date(Date.UTC(2026, 2, 1))
    const current = getCurrentSchoolYear(now)
    assert.deepEqual(schoolYearWhereClause('current', now), { schoolYear: current })
    assert.deepEqual(schoolYearWhereClause('prior', now), { NOT: { schoolYear: current } })
    assert.deepEqual(schoolYearWhereClause('2023-2024', now), { schoolYear: '2023-2024' })
  })

  it('should parse list filters and reject invalid schoolYear values', () => {
    assert.deepEqual(parseSchoolYearListFilter(null), { ok: true, filter: undefined })
    assert.deepEqual(parseSchoolYearListFilter('current'), { ok: true, filter: 'current' })
    assert.deepEqual(parseSchoolYearListFilter('prior'), { ok: true, filter: 'prior' })
    assert.deepEqual(parseSchoolYearListFilter('2024-2025'), { ok: true, filter: '2024-2025' })
    assert.equal(parseSchoolYearListFilter('2024').ok, false)
    assert.equal(parseSchoolYearListFilter('all').ok, false)
  })
})

describe('formatAssignedToClass', () => {
  it('should format class labels from assignedTo payloads', () => {
    assert.equal(formatAssignedToClass('Hour 3'), 'Hour 3')
    assert.equal(
      formatAssignedToClass([{ type: 'class', id: '1', name: 'Hour 3' }]),
      'Hour 3',
    )
    assert.equal(formatAssignedToClass(null), '—')
  })
})
