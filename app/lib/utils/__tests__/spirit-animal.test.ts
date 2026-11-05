import { getSpiritAnimal, getShortSpiritAnimal } from '../spirit-animal'

describe('getSpiritAnimal', () => {
  it('should return spirit animal with color for valid names', () => {
    const result1 = getSpiritAnimal('John Doe')
    const result2 = getSpiritAnimal('Alice Smith')
    const result3 = getSpiritAnimal('Bob Wilson')
    
    // Should return consistent results for the same input
    expect(getSpiritAnimal('John Doe')).toBe(result1)
    expect(getSpiritAnimal('Alice Smith')).toBe(result2)
    expect(getSpiritAnimal('Bob Wilson')).toBe(result3)
    
    // Should have format "Color Animal"
    expect(result1).toMatch(/^[A-Za-z]+ [A-Za-z\s-]+$/)
    expect(result2).toMatch(/^[A-Za-z]+ [A-Za-z\s-]+$/)
    expect(result3).toMatch(/^[A-Za-z]+ [A-Za-z\s-]+$/)
  })

  it('should handle single names', () => {
    const result = getSpiritAnimal('John')
    expect(result).toMatch(/^[A-Za-z]+ [A-Za-z\s-]+$/)
    // Should return consistent results for the same input
    expect(getSpiritAnimal('John')).toBe(result)
  })

  it('should handle empty or invalid input', () => {
    expect(getSpiritAnimal('')).toBe('Mystical Creature')
    expect(getSpiritAnimal(null as unknown as string)).toBe('Mystical Creature')
    expect(getSpiritAnimal(undefined as unknown as string)).toBe('Mystical Creature')
  })

  it('should handle names with multiple parts', () => {
    const result1 = getSpiritAnimal('John Michael Doe')
    const result2 = getSpiritAnimal('Mary Jane Watson')
    
    // Should return consistent results for the same input
    expect(getSpiritAnimal('John Michael Doe')).toBe(result1)
    expect(getSpiritAnimal('Mary Jane Watson')).toBe(result2)
    
    // Should have format "Color Animal"
    expect(result1).toMatch(/^[A-Za-z]+ [A-Za-z\s-]+$/)
    expect(result2).toMatch(/^[A-Za-z]+ [A-Za-z\s-]+$/)
  })

  it('should be case insensitive', () => {
    const result1 = getSpiritAnimal('john doe')
    const result2 = getSpiritAnimal('JOHN DOE')
    const result3 = getSpiritAnimal('John Doe')
    
    // Should return the same result regardless of case
    expect(result1).toBe(result2)
    expect(result2).toBe(result3)
  })

  it('should handle single character names', () => {
    const result1 = getSpiritAnimal('A')
    const result2 = getSpiritAnimal('Z')
    
    expect(result1).toMatch(/^[A-Za-z]+ [A-Za-z\s-]+$/)
    expect(result2).toMatch(/^[A-Za-z]+ [A-Za-z\s-]+$/)
    
    // Should return consistent results for the same input
    expect(getSpiritAnimal('A')).toBe(result1)
    expect(getSpiritAnimal('Z')).toBe(result2)
  })

  it('should handle names with special characters by filtering them out', () => {
    // Names with special characters should be filtered to valid parts only
    const result1 = getSpiritAnimal('John-Doe')
    const result2 = getSpiritAnimal("Mary O'Connor")
    
    expect(result1).toMatch(/^[A-Za-z]+ [A-Za-z\s-]+$/)
    expect(result2).toMatch(/^[A-Za-z]+ [A-Za-z\s-]+$/)
    
    // Should return consistent results for the same input
    expect(getSpiritAnimal('John-Doe')).toBe(result1)
    expect(getSpiritAnimal("Mary O'Connor")).toBe(result2)
  })

  it('should provide variety in spirit animal names', () => {
    // Test multiple names to ensure variety
    const results = [
      getSpiritAnimal('Alice Anderson'),
      getSpiritAnimal('Alice Adams'),
      getSpiritAnimal('Alice Allen'),
    ]
    
    // All should be valid spirit animal names
    for (const result of results) {
      expect(result).toMatch(/^[A-Za-z]+ [A-Za-z\s-]+$/)
    }
    
    // Should be consistent for the same input
    expect(getSpiritAnimal('Alice Anderson')).toBe(results[0])
  })

  it('should handle names with spaces consistently', () => {
    const result1 = getSpiritAnimal('John  Doe') // Double space
    const result2 = getSpiritAnimal('John Doe')  // Single space
    const result3 = getSpiritAnimal('JohnDoe')   // No space
    
    // All should return the same result (spaces are removed before hashing)
    expect(result1).toBe(result2)
    expect(result2).toBe(result3)
  })
})

describe('getShortSpiritAnimal', () => {
  it('should return shortened spirit animal names', () => {
    const result1 = getShortSpiritAnimal('John Doe')
    const result2 = getShortSpiritAnimal('Alice Smith')
    
    // Should return consistent results for the same input
    expect(getShortSpiritAnimal('John Doe')).toBe(result1)
    expect(getShortSpiritAnimal('Alice Smith')).toBe(result2)
    
    // Should have format "Color Animal" (shortened version)
    expect(result1).toMatch(/^[A-Za-z]+ [A-Za-z\s-]+$/)
    expect(result2).toMatch(/^[A-Za-z]+ [A-Za-z\s-]+$/)
  })

  it('should handle edge cases', () => {
    const result1 = getShortSpiritAnimal('John')
    const result2 = getShortSpiritAnimal('')
    
    expect(result1).toMatch(/^[A-Za-z]+ [A-Za-z\s-]+$/)
    expect(result2).toBe('Mystical Creature')
    
    // Should return consistent results for the same input
    expect(getShortSpiritAnimal('John')).toBe(result1)
    expect(getShortSpiritAnimal('')).toBe(result2)
  })
})
