import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname } from 'node:path'
import test from 'node:test'
import assert from 'node:assert/strict'
import ts from 'typescript'
import vm from 'node:vm'

const workspaceRoot = process.cwd()
const require = createRequire(import.meta.url)

async function loadTsModule(relativePath) {
  const absolutePath = `${workspaceRoot}/${relativePath}`
  const tsSource = await readFile(absolutePath, 'utf8')
  const { outputText } = ts.transpileModule(tsSource, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: absolutePath,
  })

  const module = { exports: {} }
  const context = vm.createContext({
    module,
    exports: module.exports,
    require,
    __dirname: dirname(absolutePath),
    __filename: absolutePath,
    console,
  })

  const script = new vm.Script(outputText, { filename: absolutePath })
  script.runInContext(context)

  return context.module.exports
}

test('getTitleSuffix should return rest of title after question prefix', async () => {
  const { getTitleSuffix } = await loadTsModule(
    'components/ui/assessment-history/student-response-labels.ts',
  )
  const title = "Question 1a. The Company's Claim: We designed a foldable phone."
  assert.equal(getTitleSuffix(title), "The Company's Claim: We designed a foldable phone.")
})

test('getTitleSuffix should return full title when no question prefix', async () => {
  const { getTitleSuffix } = await loadTsModule(
    'components/ui/assessment-history/student-response-labels.ts',
  )
  const title = 'Directions: Read the text.'
  assert.equal(getTitleSuffix(title), title)
})

test('getQuestionLabel should read Question 3a and strip it from the title', async () => {
  const { getQuestionLabel, getTitleSuffix } = await loadTsModule(
    'components/ui/assessment-history/student-response-labels.ts',
  )
  const title =
    'Question 3a. Considering both objects that are about to collide, choose A, B, or C.'
  assert.equal(getQuestionLabel(title, 4), 'Question 3a')
  assert.equal(
    getTitleSuffix(title),
    'Considering both objects that are about to collide, choose A, B, or C.',
  )
})

test('getQuestionLabel should read a leading 1. or 2a. prefix', async () => {
  const { getQuestionLabel, getTitleSuffix } = await loadTsModule(
    'components/ui/assessment-history/student-response-labels.ts',
  )
  assert.equal(getQuestionLabel('1. How would the forces cause a concussion?', 0), 'Question 1')
  assert.equal(getTitleSuffix('1. How would the forces cause a concussion?'), 'How would the forces cause a concussion?')
  assert.equal(getQuestionLabel('2a. Explain in words your choice.', 3), 'Question 2a')
  assert.equal(getTitleSuffix('2a. Explain in words your choice.'), 'Explain in words your choice.')
})

test('getQuestionLabel should fall back to position when the title has no leading number', async () => {
  const { getQuestionLabel, getTitleSuffix } = await loadTsModule(
    'components/ui/assessment-history/student-response-labels.ts',
  )
  const title = 'Explain in words your choice in 2a.'
  assert.equal(getQuestionLabel(title, 2), 'Question 3')
  assert.equal(getTitleSuffix(title), title)
})

test('getQuestionLabel should accept Q, hyphen, dotted sub-id, and short codes', async () => {
  const { getQuestionLabel, getTitleSuffix } = await loadTsModule(
    'components/ui/assessment-history/student-response-labels.ts',
  )
  const cases = [
    ['Q1. Draw two diagrams', 'Question 1', 'Draw two diagrams'],
    ['1- Draw two diagrams', 'Question 1', 'Draw two diagrams'],
    ['Q1.a Choose a system', 'Question 1a', 'Choose a system'],
    ['1a', 'Question 1a', '1a'],
    ['Q1OA', 'Question 1OA', 'Q1OA'],
    ['Q1OA. Explain the system', 'Question 1OA', 'Explain the system'],
  ]
  for (const [title, label, suffix] of cases) {
    assert.equal(getQuestionLabel(title, 0), label, title)
    assert.equal(getTitleSuffix(title), suffix, title)
  }
})

test('getQuestionLabel should read a letter-only sub-part closed by punctuation', async () => {
  const { getQuestionLabel, getTitleSuffix } = await loadTsModule(
    'components/ui/assessment-history/student-response-labels.ts',
  )
  const cases = [
    ['a. Explain in words your choice.', 'Question a', 'Explain in words your choice.'],
    ['a- Explain in words your choice.', 'Question a', 'Explain in words your choice.'],
    ['a) Explain in words your choice.', 'Question a', 'Explain in words your choice.'],
    ['a: Explain in words your choice.', 'Question a', 'Explain in words your choice.'],
    ['B) Player running and heading the ball', 'Question b', 'Player running and heading the ball'],
  ]
  for (const [title, label, suffix] of cases) {
    assert.equal(getQuestionLabel(title, 4), label, title)
    assert.equal(getTitleSuffix(title), suffix, title)
  }
})

test('getQuestionLabel should read parentheses, Problem, Part, and dotted numbers', async () => {
  const { getQuestionLabel, getTitleSuffix } = await loadTsModule(
    'components/ui/assessment-history/student-response-labels.ts',
  )
  const cases = [
    ['(a) Explain your reasoning.', 'Question a', 'Explain your reasoning.'],
    ['(1) How would the forces cause a concussion?', 'Question 1', 'How would the forces cause a concussion?'],
    ['(1a) Draw two diagrams', 'Question 1a', 'Draw two diagrams'],
    ['Problem 1. Use your free-body diagrams', 'Question 1', 'Use your free-body diagrams'],
    ['Problem 1a. Explain your choice.', 'Question 1a', 'Explain your choice.'],
    ['Part A. Explain your reasoning.', 'Question a', 'Explain your reasoning.'],
    ['Part 1. Explain your reasoning.', 'Question 1', 'Explain your reasoning.'],
    ['1.1 What is the probability?', 'Question 1.1', 'What is the probability?'],
  ]
  for (const [title, label, suffix] of cases) {
    assert.equal(getQuestionLabel(title, 4), label, title)
    assert.equal(getTitleSuffix(title), suffix, title)
  }
})

test('getQuestionLabel should ignore a sentence wrapped in parentheses', async () => {
  const { getQuestionLabel, getTitleSuffix } = await loadTsModule(
    'components/ui/assessment-history/student-response-labels.ts',
  )
  const title = '(a player running and heading the ball)'
  assert.equal(getQuestionLabel(title, 2), 'Question 3')
  assert.equal(getTitleSuffix(title), title)
})

test('getQuestionLabel should ignore a lone letter that starts a sentence', async () => {
  const { getQuestionLabel, getTitleSuffix } = await loadTsModule(
    'components/ui/assessment-history/student-response-labels.ts',
  )
  const title = 'a player running and heading the soccer ball'
  assert.equal(getQuestionLabel(title, 2), 'Question 3')
  assert.equal(getTitleSuffix(title), title)
})

test('getQuestionLabel should not treat a word after a dotted number as a sub-id', async () => {
  const { getQuestionLabel, getTitleSuffix } = await loadTsModule(
    'components/ui/assessment-history/student-response-labels.ts',
  )
  const title = '1.the answer'
  assert.equal(getQuestionLabel(title, 0), 'Question 1')
  assert.equal(getTitleSuffix(title), 'the answer')
})

test('getQuestionLabel should leave a leading quantity and a Part phrase on the title', async () => {
  const { getQuestionLabel, getTitleSuffix } = await loadTsModule(
    'components/ui/assessment-history/student-response-labels.ts',
  )
  const quantity = '7 miles per hour. Choose A, B, or C.'
  assert.equal(getQuestionLabel(quantity, 4), 'Question 5')
  assert.equal(getTitleSuffix(quantity), quantity)

  const partPhrase = 'Part A of the experiment'
  assert.equal(getQuestionLabel(partPhrase, 2), 'Question 3')
  assert.equal(getTitleSuffix(partPhrase), partPhrase)
})

test('getQuestionLabel should leave a number glued to a word on the title', async () => {
  const { getQuestionLabel, getTitleSuffix } = await loadTsModule(
    'components/ui/assessment-history/student-response-labels.ts',
  )
  // Non-zero index so the position fallback cannot be mistaken for reading "1".
  const title = '1about the collision'
  assert.equal(getQuestionLabel(title, 2), 'Question 3')
  assert.equal(getTitleSuffix(title), title)
})
