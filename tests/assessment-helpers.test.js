import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname } from 'node:path'
import test from 'node:test'
import assert from 'node:assert/strict'
import ts from 'typescript'
import vm from 'node:vm'

const workspaceRoot = '/home/ocarlosfelix/Repos/dott-it-workspace'
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

test('should format JSON instructions into human readable text', async () => {
  const { formatInstructions } = await loadTsModule(
    'app/(dashboard)/backoffice/assessments/utils/format-instructions.ts',
  )

  const formatted = formatInstructions(JSON.stringify(['Step one', 'Step two']))
  assert.equal(formatted, 'Step one\nStep two')
})

test('should expose validation errors when template data is incomplete', async () => {
  const { createTemplateSchema } = await loadTsModule(
    'app/(dashboard)/backoffice/assessment-templates/schemas.ts',
  )

  const result = createTemplateSchema.safeParse({
    title: '',
    type: '',
    subject: '',
  })

  assert.equal(result.success, false)
  assert.deepEqual(Object.keys(result.error.flatten().fieldErrors), [
    'title',
    'type',
    'subject',
  ])
})

test('should validate assessment payload before submission', async () => {
  const { createAssessmentSchema } = await loadTsModule(
    'app/(dashboard)/backoffice/assessments/schemas.ts',
  )

  const validPayload = {
    templateId: 'template-123',
    tenantId: 'tenant-456',
    assignedBy: 'teacher-456',
    assignedTo: 'Class A',
    status: 'draft',
    numberOfQuestions: '10',
    dueDate: '2025-03-10T09:00',
    instructions: 'Complete the lab experiment.',
    submissionUrl: 'https://forms.google.com/example',
    googleFormId: '',
  }

  const result = createAssessmentSchema.safeParse(validPayload)

  assert.equal(result.success, true)
  assert.equal(result.data.numberOfQuestions, '10')
})

