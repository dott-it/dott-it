/**
 * Simple hash function for browser compatibility
 * @param str - The string to hash
 * @returns A hash number
 */
function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.codePointAt(i) ?? 0
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

/**
 * Converts a character to a number (a=1, b=2, etc.)
 * @param char - The character to convert
 * @returns The numeric value of the character
 */
function charToNumber(char: string): number {
  const code = char.toLowerCase().codePointAt(0) || 0
  if (code >= 97 && code <= 122) { // a-z
    return code - 96
  }
  return Number.parseInt(char, 10) || 0
}

/**
 * Generates a deterministic index based on simple hash
 * @param input - The string to hash
 * @param max - The maximum value (exclusive)
 * @param useFirstPart - Whether to use first part or second part of hash
 * @returns A number between 0 and max-1
 */
function getDeterministicIndex(input: string, max: number, useFirstPart: boolean = true): number {
  // Remove spaces and normalize to lowercase for case insensitivity
  const cleanInput = input.replaceAll(/\s+/g, '').toLowerCase()
  const hash = simpleHash(cleanInput)
  
  // Use different parts of the hash for variety
  const hashStr = hash.toString()
  const targetChars = useFirstPart 
    ? hashStr.slice(0, 4) 
    : hashStr.slice(-4)
  
  // Convert characters to numbers and sum
  let sum = 0
  for (const char of targetChars) {
    sum += charToNumber(char)
  }
  
  return sum % max
}

/**
 * Converts a person's name to a spirit animal based on deterministic hash
 * @param fullName - The full name of the person (e.g., "John Doe")
 * @returns A spirit animal name with color (e.g., "Red Jaguar")
 */
export function getSpiritAnimal(fullName: string): string {
  if (!fullName || typeof fullName !== 'string') {
    return 'Mystical Creature'
  }

  // Validate that we have at least one word with letters
  const nameParts = fullName
    .trim()
    .split(' ')
    .filter((part) => part.length > 0 && /^[A-Za-z]+$/.test(part))
  
  if (nameParts.length === 0) {
    return 'Mystical Creature'
  }

  // Arrays of colors and animals
  const colors = ['Amber', 'Azure', 'Aqua', 'Blue', 'Black', 'Bronze', 'Crimson', 'Coral', 'Copper', 'Diamond', 'Denim', 'Daffodil', 'Emerald', 'Ebony', 'Eggshell', 'Fuchsia', 'Forest', 'Flame', 'Golden', 'Garnet', 'Grey', 'Honey', 'Hunter', 'Heliotrope', 'Indigo', 'Ivory', 'Iron', 'Jade', 'Jet', 'Jasmine', 'Khaki', 'Kelly', 'Kyanite', 'Lavender', 'Lime', 'Lilac', 'Magenta', 'Maroon', 'Mint', 'Navy', 'Nectar', 'Neon', 'Orange', 'Olive', 'Onyx', 'Purple', 'Pink', 'Pearl', 'Quartz', 'Quicksilver', 'Quince', 'Red', 'Rose', 'Ruby', 'Silver', 'Sage', 'Sunset', 'Teal', 'Turquoise', 'Tangerine', 'Ultramarine', 'Umber', 'Ultraviolet', 'Violet', 'Vermillion', 'Vanilla', 'White', 'Wheat', 'Wisteria', 'Xanthic', 'Xenon', 'Xylophone', 'Yellow', 'Yam', 'Yolk', 'Zinc', 'Zircon', 'Zucchini']

  const animals = ['Albatross', 'Antelope', 'Armadillo', 'Bear', 'Butterfly', 'Badger', 'Cobra', 'Cheetah', 'Crane', 'Dragon', 'Dolphin', 'Deer', 'Elephant', 'Eagle', 'Eel', 'Fox', 'Falcon', 'Frog', 'Gazelle', 'Giraffe', 'Goat', 'Horse', 'Hawk', 'Hedgehog', 'Impala', 'Ibis', 'Iguana', 'Jellyfish', 'Jaguar', 'Jay', 'Kangaroo', 'Koala', 'Kingfisher', 'Leopard', 'Lion', 'Lynx', 'Monkey', 'Moose', 'Mantis', 'Newt', 'Nightingale', 'Narwhal', 'Octopus', 'Owl', 'Otter', 'Penguin', 'Panther', 'Panda', 'Quail', 'Quetzal', 'Quokka', 'Rhino', 'Raven', 'Rabbit', 'Snake', 'Shark', 'Swan', 'Turtle', 'Tiger', 'Toucan', 'Urchin', 'Unicorn', 'Uakari', 'Viper', 'Vulture', 'Vole', 'Whale', 'Wolf', 'Wombat', 'Xerus', 'Xenops', 'X-ray Tetra', 'Yeti', 'Yak', 'Yellowjacket', 'Zebra', 'Zebu', 'Zorilla']

  // Get color using first 4 characters of hash
  const colorIndex = getDeterministicIndex(fullName, colors.length, true)
  const color = colors[colorIndex]

  // Get animal using last 4 characters of hash
  const animalIndex = getDeterministicIndex(fullName, animals.length, false)
  const animal = animals[animalIndex]

  return `${color} ${animal}`
}

/**
 * Gets a shortened version of the spirit animal name for display in compact spaces
 * @param fullName - The full name of the person
 * @returns A shortened spirit animal name
 */
export function getShortSpiritAnimal(fullName: string): string {
  const spiritAnimal = getSpiritAnimal(fullName)
  const parts = spiritAnimal.split(' ')

  if (parts.length >= 2) {
    return `${parts[0]} ${parts[1]}`
  }

  return spiritAnimal
}