import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname } from 'node:path'
import test from 'node:test'
import assert from 'node:assert/strict'
import ts from 'typescript'
import vm from 'node:vm'

const workspaceRoot = '/home/ocarlosfelix/Repos/eddo-workspace'
const require = createRequire(import.meta.url)

// Load zod module to make it available in VM context
const zod = require('zod')

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
  
  // Create a custom require function that handles zod
  const customRequire = (id) => {
    if (id === 'zod') {
      return zod
    }
    return require(id)
  }

  const context = vm.createContext({
    module,
    exports: module.exports,
    require: customRequire,
    __dirname: dirname(absolutePath),
    __filename: absolutePath,
    console,
    URL: globalThis.URL,
  })

  const script = new vm.Script(outputText, { filename: absolutePath })
  script.runInContext(context)

  return context.module.exports
}

test.describe('Assessment Schema Validation', () => {
  test('should validate assessment schema with all required fields', async () => {
    const { createAssessmentSchema } = await loadTsModule(
      'app/(dashboard)/backoffice/assessments/schemas.ts',
    )

    const validPayload = {
      templateId: 'template-123',
      tenantId: 'tenant-456',
      assignedBy: 'teacher-789',
      assignedTo: 'Class A',
      status: 'draft',
      numberOfQuestions: '10',
    }

    const result = createAssessmentSchema.safeParse(validPayload)
    assert.equal(result.success, true)
    assert.equal(result.data.templateId, 'template-123')
    assert.equal(result.data.tenantId, 'tenant-456')
    assert.equal(result.data.status, 'draft')
  })

  test('should reject assessment schema with missing required fields', async () => {
    const { createAssessmentSchema } = await loadTsModule(
      'app/(dashboard)/backoffice/assessments/schemas.ts',
    )

    const invalidPayload = {
      templateId: '',
      tenantId: '',
      assignedBy: '',
      assignedTo: '',
    }

    const result = createAssessmentSchema.safeParse(invalidPayload)
    assert.equal(result.success, false)
    const fieldErrors = Object.keys(result.error.flatten().fieldErrors)
    assert.ok(fieldErrors.includes('templateId'))
    assert.ok(fieldErrors.includes('tenantId'))
    assert.ok(fieldErrors.includes('assignedBy'))
    assert.ok(fieldErrors.includes('assignedTo'))
    assert.ok(fieldErrors.includes('status'))
    assert.ok(fieldErrors.includes('numberOfQuestions'))
  })

  test('should validate assessment schema with valid status enum', async () => {
    const { createAssessmentSchema } = await loadTsModule(
      'app/(dashboard)/backoffice/assessments/schemas.ts',
    )

    const statuses = ['draft', 'live', 'completed', 'expired']
    for (const status of statuses) {
      const payload = {
        templateId: 'template-123',
        tenantId: 'tenant-456',
        assignedBy: 'teacher-789',
        assignedTo: 'Class A',
        status,
        numberOfQuestions: '10',
      }
      const result = createAssessmentSchema.safeParse(payload)
      assert.equal(result.success, true, `Status ${status} should be valid`)
    }
  })

  test('should reject invalid status enum value', async () => {
    const { createAssessmentSchema } = await loadTsModule(
      'app/(dashboard)/backoffice/assessments/schemas.ts',
    )

    const payload = {
      templateId: 'template-123',
      tenantId: 'tenant-456',
      assignedBy: 'teacher-789',
      assignedTo: 'Class A',
      status: 'invalid-status',
      numberOfQuestions: '10',
    }

    const result = createAssessmentSchema.safeParse(payload)
    assert.equal(result.success, false)
  })

  test('should validate numberOfQuestions range (1-50)', async () => {
    const { createAssessmentSchema } = await loadTsModule(
      'app/(dashboard)/backoffice/assessments/schemas.ts',
    )

    const validNumbers = ['1', '25', '50']
    for (const num of validNumbers) {
      const payload = {
        templateId: 'template-123',
        tenantId: 'tenant-456',
        assignedBy: 'teacher-789',
        assignedTo: 'Class A',
        status: 'draft',
        numberOfQuestions: num,
      }
      const result = createAssessmentSchema.safeParse(payload)
      assert.equal(result.success, true, `Number ${num} should be valid`)
    }

    const invalidNumbers = ['0', '51', '100', '-1']
    for (const num of invalidNumbers) {
      const payload = {
        templateId: 'template-123',
        tenantId: 'tenant-456',
        assignedBy: 'teacher-789',
        assignedTo: 'Class A',
        status: 'draft',
        numberOfQuestions: num,
      }
      const result = createAssessmentSchema.safeParse(payload)
      assert.equal(result.success, false, `Number ${num} should be invalid`)
    }
  })

  test('should validate optional dueDate field', async () => {
    const { createAssessmentSchema } = await loadTsModule(
      'app/(dashboard)/backoffice/assessments/schemas.ts',
    )

    const validPayload = {
      templateId: 'template-123',
      tenantId: 'tenant-456',
      assignedBy: 'teacher-789',
      assignedTo: 'Class A',
      status: 'draft',
      numberOfQuestions: '10',
      dueDate: '2025-03-10T09:00:00Z',
    }

    const result = createAssessmentSchema.safeParse(validPayload)
    assert.equal(result.success, true)
  })

  test('should reject invalid dueDate format', async () => {
    const { createAssessmentSchema } = await loadTsModule(
      'app/(dashboard)/backoffice/assessments/schemas.ts',
    )

    const payload = {
      templateId: 'template-123',
      tenantId: 'tenant-456',
      assignedBy: 'teacher-789',
      assignedTo: 'Class A',
      status: 'draft',
      numberOfQuestions: '10',
      dueDate: 'invalid-date',
    }

    const result = createAssessmentSchema.safeParse(payload)
    assert.equal(result.success, false)
  })

  test('should validate optional submissionUrl format', async () => {
    const { createAssessmentSchema } = await loadTsModule(
      'app/(dashboard)/backoffice/assessments/schemas.ts',
    )

    const validUrls = [
      'https://forms.google.com/example',
      'http://example.com/form',
    ]

    for (const url of validUrls) {
      const payload = {
        templateId: 'template-123',
        tenantId: 'tenant-456',
        assignedBy: 'teacher-789',
        assignedTo: 'Class A',
        status: 'draft',
        numberOfQuestions: '10',
        submissionUrl: url,
      }
      const result = createAssessmentSchema.safeParse(payload)
      assert.equal(result.success, true, `URL ${url} should be valid`)
    }
  })

  test('should reject invalid submissionUrl format', async () => {
    const { createAssessmentSchema } = await loadTsModule(
      'app/(dashboard)/backoffice/assessments/schemas.ts',
    )

    const payload = {
      templateId: 'template-123',
      tenantId: 'tenant-456',
      assignedBy: 'teacher-789',
      assignedTo: 'Class A',
      status: 'draft',
      numberOfQuestions: '10',
      submissionUrl: 'not-a-url',
    }

    const result = createAssessmentSchema.safeParse(payload)
    assert.equal(result.success, false)
  })
})

test.describe('Template Schema Validation', () => {
  test('should validate template schema with all required fields', async () => {
    const { createTemplateSchema } = await loadTsModule(
      'app/(dashboard)/backoffice/assessment-templates/schemas.ts',
    )

    const validPayload = {
      title: 'Science Assessment Template',
      type: 'formative',
      subject: 'Science',
    }

    const result = createTemplateSchema.safeParse(validPayload)
    assert.equal(result.success, true)
    assert.equal(result.data.title, 'Science Assessment Template')
    assert.equal(result.data.type, 'formative')
    assert.equal(result.data.subject, 'Science')
  })

  test('should reject template schema with missing required fields', async () => {
    const { createTemplateSchema } = await loadTsModule(
      'app/(dashboard)/backoffice/assessment-templates/schemas.ts',
    )

    const invalidPayload = {
      title: '',
      type: '',
      subject: '',
    }

    const result = createTemplateSchema.safeParse(invalidPayload)
    assert.equal(result.success, false)
    const fieldErrors = Object.keys(result.error.flatten().fieldErrors)
    assert.ok(fieldErrors.includes('title'))
    assert.ok(fieldErrors.includes('type'))
    assert.ok(fieldErrors.includes('subject'))
  })

  test('should validate template schema with optional fields', async () => {
    const { createTemplateSchema } = await loadTsModule(
      'app/(dashboard)/backoffice/assessment-templates/schemas.ts',
    )

    const validPayload = {
      title: 'Science Assessment Template',
      type: 'formative',
      subject: 'Science',
      description: 'A comprehensive science assessment',
      curriculumTeachersEdition: 'Teacher edition notes',
      curriculumAnswerKey: 'Answer key notes',
      gradeLevel: '8',
      unitCode: '8.1',
    }

    const result = createTemplateSchema.safeParse(validPayload)
    assert.equal(result.success, true)
    assert.equal(result.data.description, 'A comprehensive science assessment')
    assert.equal(result.data.curriculumTeachersEdition, 'Teacher edition notes')
    assert.equal(result.data.curriculumAnswerKey, 'Answer key notes')
    assert.equal(result.data.gradeLevel, '8')
    assert.equal(result.data.unitCode, '8.1')
  })
})

test.describe('Tenant Schema Validation', () => {
  test('should validate tenant schema with all required fields', async () => {
    const { createTenantSchema } = await loadTsModule(
      'app/(dashboard)/backoffice/tenants/schemas.ts',
    )

    const validPayload = {
      name: 'Acme School District',
      slug: 'acme-school',
    }

    const result = createTenantSchema.safeParse(validPayload)
    assert.equal(result.success, true)
    assert.equal(result.data.name, 'Acme School District')
    assert.equal(result.data.slug, 'acme-school')
  })

  test('should reject tenant schema with missing required fields', async () => {
    const { createTenantSchema } = await loadTsModule(
      'app/(dashboard)/backoffice/tenants/schemas.ts',
    )

    const invalidPayload = {
      name: '',
      slug: '',
    }

    const result = createTenantSchema.safeParse(invalidPayload)
    assert.equal(result.success, false)
    const fieldErrors = Object.keys(result.error.flatten().fieldErrors)
    assert.ok(fieldErrors.includes('name'))
    assert.ok(fieldErrors.includes('slug'))
  })

  test('should validate tenant slug format (lowercase, alphanumeric, dots, hyphens)', async () => {
    const { createTenantSchema } = await loadTsModule(
      'app/(dashboard)/backoffice/tenants/schemas.ts',
    )

    const validSlugs = ['acme-school', 'school-123', 'test.school', 'test-school-123']
    for (const slug of validSlugs) {
      const payload = {
        name: 'Test School',
        slug,
      }
      const result = createTenantSchema.safeParse(payload)
      assert.equal(result.success, true, `Slug ${slug} should be valid`)
    }

    const invalidSlugs = ['ACME-SCHOOL', 'school_123', 'school 123', 'school@123']
    for (const slug of invalidSlugs) {
      const payload = {
        name: 'Test School',
        slug,
      }
      const result = createTenantSchema.safeParse(payload)
      assert.equal(result.success, false, `Slug ${slug} should be invalid`)
    }
  })

  test('should validate optional logo URL field', async () => {
    const { createTenantSchema } = await loadTsModule(
      'app/(dashboard)/backoffice/tenants/schemas.ts',
    )

    const validPayload = {
      name: 'Test School',
      slug: 'test-school',
      logo: 'https://example.com/logo.png',
    }

    const result = createTenantSchema.safeParse(validPayload)
    assert.equal(result.success, true)
    assert.equal(result.data.logo, 'https://example.com/logo.png')
  })

  test('should reject invalid logo URL format', async () => {
    const { createTenantSchema } = await loadTsModule(
      'app/(dashboard)/backoffice/tenants/schemas.ts',
    )

    const payload = {
      name: 'Test School',
      slug: 'test-school',
      logo: 'not-a-valid-url',
    }

    const result = createTenantSchema.safeParse(payload)
    assert.equal(result.success, false)
  })

  test('should accept empty logo field', async () => {
    const { createTenantSchema } = await loadTsModule(
      'app/(dashboard)/backoffice/tenants/schemas.ts',
    )

    const payload = {
      name: 'Test School',
      slug: 'test-school',
      logo: '',
    }

    const result = createTenantSchema.safeParse(payload)
    assert.equal(result.success, true)
  })
})

test.describe('User Schema Validation', () => {
  test('should validate user schema with required email field', async () => {
    const { createUserSchema } = await loadTsModule(
      'app/(dashboard)/backoffice/users/schemas.ts',
    )

    const validPayload = {
      email: 'user@example.com',
    }

    const result = createUserSchema.safeParse(validPayload)
    assert.equal(result.success, true)
    assert.equal(result.data.email, 'user@example.com')
    assert.equal(result.data.active, true) // default value
  })

  test('should reject user schema with invalid email', async () => {
    const { createUserSchema } = await loadTsModule(
      'app/(dashboard)/backoffice/users/schemas.ts',
    )

    const invalidEmails = ['not-an-email', 'invalid@', '@example.com', '']
    for (const email of invalidEmails) {
      const payload = { email }
      const result = createUserSchema.safeParse(payload)
      assert.equal(result.success, false, `Email ${email} should be invalid`)
    }
  })

  test('should validate user schema with optional fields', async () => {
    const { createUserSchema } = await loadTsModule(
      'app/(dashboard)/backoffice/users/schemas.ts',
    )

    const validPayload = {
      email: 'user@example.com',
      name: 'John Doe',
      password: 'secure-password',
      tenantId: 'tenant-123',
      role: 'teacher',
      active: false,
    }

    const result = createUserSchema.safeParse(validPayload)
    assert.equal(result.success, true)
    assert.equal(result.data.name, 'John Doe')
    assert.equal(result.data.password, 'secure-password')
    assert.equal(result.data.tenantId, 'tenant-123')
    assert.equal(result.data.role, 'teacher')
    assert.equal(result.data.active, false)
  })

  test('should default active field to true when not provided', async () => {
    const { createUserSchema } = await loadTsModule(
      'app/(dashboard)/backoffice/users/schemas.ts',
    )

    const payload = {
      email: 'user@example.com',
    }

    const result = createUserSchema.safeParse(payload)
    assert.equal(result.success, true)
    assert.equal(result.data.active, true)
  })
})

