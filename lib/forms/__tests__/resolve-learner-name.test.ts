import {
  isFirstNameFieldTitle,
  isFullStudentNameFieldTitle,
  isLastNameFieldTitle,
  isStudentNameFieldTitle,
  learnerNameUpdateData,
  displayNameFromLearnerEmail,
  isEmailLocalPartDisplayName,
  resolveLearnerDisplayName,
  resolveLearnerNameFromAnswerSources,
  resolveLearnerNameFromRawAnswer,
  toPlaintextNameAnswers,
  toPlaintextNameFieldValue,
} from '../resolve-learner-name'

/** Test decrypt: strips `enc:` prefix; otherwise empty (failed decrypt). */
function decryptTestCipher(value: string): string {
  if (value.startsWith('enc:')) {
    return value.slice(4)
  }
  return ''
}

describe('resolveLearnerDisplayName', () => {
  it('should combine first and last name when both fields exist', () => {
    expect(
      resolveLearnerDisplayName([
        { title: 'First Name', value: 'Jane' },
        { title: 'Last Name', value: 'Doe' },
        { title: 'Hour', value: '2' },
      ]),
    ).toBe('Jane Doe')
  })

  it('should prefer first+last over a later full-name field', () => {
    expect(
      resolveLearnerDisplayName([
        { title: 'First Name', value: 'Jane' },
        { title: 'Last Name', value: 'Doe' },
        { title: 'Student Name', value: 'Should Not Win' },
      ]),
    ).toBe('Jane Doe')
  })

  it('should use Student Name when first/last are missing', () => {
    expect(
      resolveLearnerDisplayName([
        { title: 'Student Name', value: 'Jane Doe' },
        { title: 'Hour', value: '2' },
      ]),
    ).toBe('Jane Doe')
  })

  it('should use Last Name, First Name format field when present', () => {
    expect(
      resolveLearnerDisplayName([
        {
          title: 'Please write your name in this format: Last Name, First Name',
          value: 'Doe, Jane',
        },
      ]),
    ).toBe('Doe, Jane')
  })

  it('should use generic name titles like What is your name?', () => {
    expect(
      resolveLearnerDisplayName([
        { title: 'What is your name?', value: 'Jane Doe' },
        { title: 'Hour', value: '2' },
      ]),
    ).toBe('Jane Doe')
  })

  it('should use Full Name and Your Name as full-name fields', () => {
    expect(
      resolveLearnerDisplayName([{ title: 'Full Name', value: 'Jane Doe' }]),
    ).toBe('Jane Doe')
    expect(
      resolveLearnerDisplayName([{ title: 'Your Name', value: 'Alex Rivera' }]),
    ).toBe('Alex Rivera')
  })

  it('should fall back to first name alone when last is missing', () => {
    expect(
      resolveLearnerDisplayName([{ title: 'First Name', value: 'Jane' }]),
    ).toBe('Jane')
  })

  it('should fall back to first name when last value is empty', () => {
    expect(
      resolveLearnerDisplayName([
        { title: 'First Name', value: 'Jane' },
        { title: 'Last Name', value: '' },
      ]),
    ).toBe('Jane')
  })

  it('should fall back to last name alone when first value is empty', () => {
    expect(
      resolveLearnerDisplayName([
        { title: 'First Name', value: '  ' },
        { title: 'Last Name', value: 'Doe' },
      ]),
    ).toBe('Doe')
  })

  it('should not treat Teacher Name as a student name', () => {
    expect(
      resolveLearnerDisplayName([
        { title: 'Teacher Name', value: 'Ms. Smith' },
        { title: 'First Name', value: 'Jane' },
        { title: 'Last Name', value: 'Doe' },
      ]),
    ).toBe('Jane Doe')
  })
})

describe('toPlaintextNameAnswers', () => {
  it('should use empty string when decrypt fails instead of ciphertext', () => {
    const ciphertext = 'U2FsdGVkX1+ciphertext'
    const result = toPlaintextNameAnswers(
      [
        { title: 'First Name', value: ciphertext },
        { title: 'Last Name', value: ciphertext },
      ],
      () => '',
    )
    expect(result).toEqual([
      { title: 'First Name', value: '' },
      { title: 'Last Name', value: '' },
    ])
    expect(resolveLearnerDisplayName(result)).toBe('')
  })

  it('should keep trimmed decrypted plaintext', () => {
    const result = toPlaintextNameAnswers(
      [
        { title: 'First Name', value: 'enc-jane' },
        { title: 'Last Name', value: 'enc-doe' },
      ],
      (value) => (value === 'enc-jane' ? ' Jane ' : ' Doe '),
    )
    expect(result).toEqual([
      { title: 'First Name', value: 'Jane' },
      { title: 'Last Name', value: 'Doe' },
    ])
    expect(resolveLearnerDisplayName(result)).toBe('Jane Doe')
  })

  it('should decrypt only student name field titles', () => {
    const decrypt = jest.fn((value: string) =>
      value.startsWith('enc:') ? value.slice(4) : value,
    )
    const result = toPlaintextNameAnswers(
      [
        { title: 'First Name', value: 'enc:Jane' },
        { title: 'Teacher Name', value: 'enc:MsSmith' },
        { title: 'Hour', value: '1st hour' },
      ],
      decrypt,
    )
    expect(decrypt).toHaveBeenCalledTimes(1)
    expect(decrypt).toHaveBeenCalledWith('enc:Jane')
    expect(result).toEqual([
      { title: 'First Name', value: 'Jane' },
      { title: 'Teacher Name', value: '' },
      { title: 'Hour', value: '' },
    ])
  })
})

describe('name field title matchers', () => {
  it('should classify first and last name titles', () => {
    expect(isFirstNameFieldTitle('First Name')).toBe(true)
    expect(isLastNameFieldTitle('Last Name')).toBe(true)
    expect(isFullStudentNameFieldTitle('First Name')).toBe(false)
    expect(isFullStudentNameFieldTitle('Last Name')).toBe(false)
    expect(isFullStudentNameFieldTitle('Teacher Name')).toBe(false)
    expect(isFullStudentNameFieldTitle('Student Name')).toBe(true)
    expect(isFullStudentNameFieldTitle('What is your name?')).toBe(true)
    expect(isFullStudentNameFieldTitle('Full Name')).toBe(true)
    expect(isFullStudentNameFieldTitle('Your Name')).toBe(true)
    expect(isFullStudentNameFieldTitle('name')).toBe(true)
  })

  it('should treat student name fields as encryptable and exclude Teacher Name', () => {
    expect(isStudentNameFieldTitle('First Name')).toBe(true)
    expect(isStudentNameFieldTitle('Last Name')).toBe(true)
    expect(isStudentNameFieldTitle('Student Name')).toBe(true)
    expect(isStudentNameFieldTitle('What is your name?')).toBe(true)
    expect(isStudentNameFieldTitle('Teacher Name')).toBe(false)
    expect(isStudentNameFieldTitle('Hour')).toBe(false)
  })
})

describe('learnerNameUpdateData', () => {
  it('should omit name when empty so sync does not wipe existing names', () => {
    expect(learnerNameUpdateData('')).toEqual({})
    expect(learnerNameUpdateData('encrypted-name')).toEqual({ name: 'encrypted-name' })
  })
})

describe('resolveLearnerNameFromRawAnswer', () => {
  it('should recover first+last from rawAnswer array when learner name is missing', () => {
    expect(
      resolveLearnerNameFromRawAnswer(
        [
          { title: 'First Name', value: 'enc:Jane' },
          { title: 'Last Name', value: 'enc:Doe' },
          { title: 'Hour', value: '1st hour' },
        ],
        decryptTestCipher,
      ),
    ).toBe('Jane Doe')
  })

  it('should recover Student Name from JSON string rawAnswer', () => {
    expect(
      resolveLearnerNameFromRawAnswer(
        JSON.stringify([
          { title: 'Student Name', value: 'enc:Alex Rivera' },
          { title: 'Hour', value: '2' },
        ]),
        decryptTestCipher,
      ),
    ).toBe('Alex Rivera')
  })

  it('should return empty when rawAnswer has no resolvable name', () => {
    expect(
      resolveLearnerNameFromRawAnswer([{ title: 'Hour', value: '1st hour' }], decryptTestCipher),
    ).toBe('')
  })

  it('should not leak Teacher Name into the display name', () => {
    expect(
      resolveLearnerNameFromRawAnswer(
        [
          { title: 'Teacher Name', value: 'enc:Ms. Smith' },
          { title: 'Student Name', value: 'enc:Jane Doe' },
          { title: 'Hour', value: '1st hour' },
        ],
        decryptTestCipher,
      ),
    ).toBe('Jane Doe')
  })

  it('should not use Teacher Name when no student name fields exist', () => {
    expect(
      resolveLearnerNameFromRawAnswer(
        [{ title: 'Teacher Name', value: 'enc:Ms. Smith' }],
        decryptTestCipher,
      ),
    ).toBe('')
  })

  it('should return empty for invalid rawAnswer', () => {
    expect(resolveLearnerNameFromRawAnswer(null, decryptTestCipher)).toBe('')
    expect(resolveLearnerNameFromRawAnswer('not-json', decryptTestCipher)).toBe('')
  })

  it('should recover First + Last when decrypt fails but values are plaintext', () => {
    expect(
      resolveLearnerNameFromRawAnswer(
        [
          { title: 'First Name', value: 'Jane' },
          { title: 'Last Name', value: 'Doe' },
          { title: 'Section', value: '1st hour' },
        ],
        () => '',
      ),
    ).toBe('Jane Doe')
  })

  it('should recover First + Last with required-field asterisk in titles', () => {
    expect(
      resolveLearnerNameFromRawAnswer(
        [
          { title: 'First Name *', value: 'enc:Jane' },
          { title: 'Last Name *', value: 'enc:Doe' },
        ],
        decryptTestCipher,
      ),
    ).toBe('Jane Doe')
  })

  it('should not treat Encryption Error as a recoverable name', () => {
    expect(
      resolveLearnerNameFromRawAnswer(
        [
          { title: 'First Name', value: 'Encryption Error' },
          { title: 'Last Name', value: 'Encryption Error' },
        ],
        () => '',
      ),
    ).toBe('')
  })
})

describe('toPlaintextNameFieldValue', () => {
  it('should keep plaintext when decrypt returns empty', () => {
    expect(toPlaintextNameFieldValue('Jane', () => '')).toBe('Jane')
  })

  it('should not keep AES ciphertext when decrypt fails', () => {
    expect(toPlaintextNameFieldValue('U2FsdGVkX1+abc', () => '')).toBe('')
  })
})

describe('resolveLearnerNameFromAnswerSources', () => {
  it('should use later source when earlier has no name', () => {
    expect(
      resolveLearnerNameFromAnswerSources(
        [
          [{ title: 'Hour', value: '1' }],
          [
            { title: 'First Name', value: 'enc:Jane' },
            { title: 'Last Name', value: 'enc:Doe' },
          ],
        ],
        decryptTestCipher,
      ),
    ).toBe('Jane Doe')
  })
})

describe('displayNameFromLearnerEmail', () => {
  it('should title-case email local part', () => {
    expect(displayNameFromLearnerEmail('jane.doe@cameron.k12.wi.us')).toBe('Jane Doe')
  })

  it('should ignore uuid placeholder emails', () => {
    expect(
      displayNameFromLearnerEmail('550e8400-e29b-41d4-a716-446655440000@example.com'),
    ).toBe('')
  })
})

describe('isEmailLocalPartDisplayName', () => {
  it('should detect email-local-part fallbacks like Cameron student ids', () => {
    expect(
      isEmailLocalPartDisplayName('31jenneell', '31jenneell@cameron.k12.wi.us'),
    ).toBe(true)
    expect(
      isEmailLocalPartDisplayName('Jane Doe', '31jenneell@cameron.k12.wi.us'),
    ).toBe(false)
  })
})
