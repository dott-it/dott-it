import {
  getAnonymizedStudentLabel,
  getStudentDisplayName,
  MYSTICAL_CREATURE_LABEL,
} from '../student-display-name'

const originalSalt = process.env.NEXT_PUBLIC_STUDENT_NAME_SALT

describe('student-display-name', () => {
  afterEach(() => {
    if (originalSalt === undefined) {
      delete process.env.NEXT_PUBLIC_STUDENT_NAME_SALT
    } else {
      process.env.NEXT_PUBLIC_STUDENT_NAME_SALT = originalSalt
    }
  })

  describe('without name salt', () => {
    beforeEach(() => {
      delete process.env.NEXT_PUBLIC_STUDENT_NAME_SALT
    })

    it('returns Mystical Creature when names are hidden', () => {
      expect(
        getAnonymizedStudentLabel('learner-abc', 'John Doe'),
      ).toBe(MYSTICAL_CREATURE_LABEL)
    })

    it('returns Mystical Creature even for stored citation names', () => {
      expect(
        getStudentDisplayName({
          showRealNames: false,
          learnerName: 'Lucas Anderson',
          learnerId: 'cmfwqzhg123',
        }),
      ).toBe(MYSTICAL_CREATURE_LABEL)
    })

    it('does not show real names when showRealNames is true', () => {
      expect(
        getStudentDisplayName({
          showRealNames: true,
          learnerName: 'John Doe',
          learnerId: 'learner-1',
        }),
      ).toBe(MYSTICAL_CREATURE_LABEL)
    })

    it('does not expose email local-part when salt is missing', () => {
      expect(
        getStudentDisplayName({
          showRealNames: true,
          learnerName: 'jane.doe@school.edu',
          learnerId: 'learner-1',
        }),
      ).toBe(MYSTICAL_CREATURE_LABEL)
    })
  })

  describe('with name salt', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_STUDENT_NAME_SALT = 'test-salt'
    })

    it('uses spirit animal from learner name when anonymized', () => {
      const label = getAnonymizedStudentLabel('learner-1', 'John Doe')
      expect(label).not.toBe(MYSTICAL_CREATURE_LABEL)
      expect(label).toMatch(/^[A-Za-z]+ [A-Za-z\s-]+$/)
    })

    it('uses learner id when name is a student fallback', () => {
      const fromId = getAnonymizedStudentLabel('learner-abc', 'Student cmfwqzhg')
      const fromIdOnly = getAnonymizedStudentLabel('learner-abc', '')
      expect(fromId).toBe(fromIdOnly)
    })

    // Documents the thematic-analysis hide-names bug: CUID / alphanumeric
    // learner IDs fail getSpiritAnimal's alphabetic-word check, so every
    // student collapses to Mystical Creature when learnerName is omitted.
    it('returns Mystical Creature for alphanumeric learner ids without a name', () => {
      expect(
        getAnonymizedStudentLabel('cmfwqzhg123abcde', ''),
      ).toBe(MYSTICAL_CREATURE_LABEL)
      expect(
        getAnonymizedStudentLabel('learner-abc', ''),
      ).toBe(MYSTICAL_CREATURE_LABEL)
    })
  })
})
