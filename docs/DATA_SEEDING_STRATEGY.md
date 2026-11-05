# Data Seeding Strategy

## Overview

The Dott.it Workspace uses a **comprehensive multi-source seeding strategy** that combines mock data, real anonymized assessment data, and a structured database schema to provide a rich development and demonstration environment.

## Naming Conventions

### Database Models

- **PascalCase** for model names: `AssessmentTemplate`, `Assessment`, `AssessmentRecord`
- **camelCase** for field names: `tenantId`, `firstName`, `lastName`, `gradeLevel`
- **Descriptive names**: `assignedAt` instead of `assignedDate`, `submittedAt` instead of `submittedDate`
- **Consistent prefixes**: `anonSubjectId` for anonymized identifiers

### Functions and Variables

- **Verb-first function names**: `createTenants()`, `seedStudents()`, `seedNaturalSelectionAssessmentData()`
- **Descriptive variable names**: `demoEnvironment` instead of `demoTenant`, `naturalSelectionAssessment` instead of `greenAnoleAssessment`
- **Clear interface names**: `NaturalSelectionAssessmentRecord` instead of `GreenAnoleRecord`

### File and Directory Names

- **kebab-case** for files: `seed-database.ts`, `data-service.ts`
- **Descriptive names**: `8-6-lesson-11-green-anole-lizard-explanation` instead of `natural-selection-assessment`

## Data Sources

### 1. Data Service (`lib/data-service.ts`)

**Purpose**: Provides real data access from the database using Prisma

- **Assessments**: Real assessment data from the database
- **Assessment Records**: Student submission records with status tracking
- **Events**: Assessment events like submissions, AI reviews, and teacher reviews

### 2. Green Anole Lizard Assessment Data (`green_anole_data_anonymized.csv`)

**Purpose**: Real anonymized student responses for AI/ML development

- **148 student responses** to green anole lizard assessment
- **Rich metadata**: Timestamps, teacher scores, AI-generated feedback
- **Multi-dimensional scoring**: SEP, DCI, CCC, Communication, Overall
- **Structured feedback**: Strengths and suggestions for each response

### 3. Authentication Data (`lib/auth.ts`)

**Purpose**: Mock user accounts for development and testing

- **Teacher accounts**: `teacherA@example.com`, `teacherB@example.com`
- **Student accounts**: `studentA@example.com`, `studentB@example.com`
- **Admin accounts**: `coach@example.com`

## Domain Model

The application follows a clear domain model for assessments:

1. **AssessmentTemplate**: The blueprint/definition of an assessment

   - Contains title, description, subject, grade level
   - Can be reused to create multiple assessment instances
   - Stored in the tenant plane for customization

2. **Assessment**: An instance of an assessment template assigned to students

   - References a specific template via `templateId`
   - Contains assignment details (assigned by, due date, instructions)
   - Tracks status and submission information

3. **AssessmentRecord**: A student's submission record for an assessment

   - Links a student to a specific assessment instance
   - Tracks submission status and timing
   - Provides quick access to student participation

4. **Response**: The detailed student response data
   - Contains the actual answer content and metadata
   - Links to the assessment template for context
   - Used for AI analysis and feedback generation

## Database Architecture

### Tenant Plane (PII Data)

```prisma
model Tenant {
  id           String   @id @default(cuid())
  name         String
  slug         String   @unique
  primaryDomain String
  students     Student[]
  responses    Response[]
  templates    AssessmentTemplate[]
  assessments  Assessment[]
}

model Student {
  id        String   @id @default(cuid())
  tenantId  String   @index
  localId   String
  firstName String
  lastName  String
  email     String?
  responses Response[]
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  @@unique([tenantId, localId])
}

model AssessmentTemplate {
  id          String   @id @default(cuid())
  tenantId    String   @index
  title       String
  description String?
  subject     String?
  gradeLevel  String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  assessments Assessment[]
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
}

model Assessment {
  id                String   @id @default(cuid())
  tenantId          String   @index
  templateId        String
  assignedBy        String
  assignedAt        String
  dueAt             String
  assignedTo        Json
  submissionUrl     String?
  qrCodeData        String?
  status            String
  instructions      String?
  records           AssessmentRecord[]
  tenant            Tenant   @relation(fields: [tenantId], references: [id])
  template          AssessmentTemplate @relation(fields: [templateId], references: [id])
}

model AssessmentRecord {
  id                   String   @id @default(cuid())
  assessmentId         String
  studentId            String
  studentName          String
  submittedAt          String?
  status               String
  assessment           Assessment @relation(fields: [assessmentId], references: [id])
}
```

### Global Plane (Anonymized Data)

```prisma
model AssessmentEvent {
  id            String   @id @default(cuid())
  anonSubjectId String   @index
  tenantId      String   @index
  itemId        String   @index
  rubricScore   Float
  aiFeedback    Json
  computedAt    DateTime @default(now())
}
```

## Seeding Process

### 1. Environment Setup

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# Run seeding script
pnpm db:seed
```

### 2. Seeding Script Flow

```typescript
async function main() {
  // 1. Create tenant environments
  const { demoEnvironment, developmentEnvironment } = await createTenants()

  // 2. Create student profiles
  const students = await seedStudents(demoEnvironment.id)

  // 3. Seed green anole lizard assessment template and data
  await seedGreenAnoleLizardAssessmentData(demoEnvironment.id)

  // 4. Seed mock assessment templates and instances
  await seedMockData(demoEnvironment.id)
}
```

### 3. Data Transformation

The seeding script transforms CSV data into structured database records:

```typescript
// CSV Record → Database Response
{
  timestamp: "4/28/2025 8:12:06",
  observationQuestion: "When the green lizards were living in Florida alone...",
  explanationQuestion: "The green lizards used to be farther down the tree...",
  teacherScore: "1.0",
  aiScoreOverall: "2.0",
  aiFeedbackStrengths: "The student identifies the interaction...",
  aiFeedbackSuggestions: "Add more detail about how genetic variation..."
}
```

## Usage Examples

### Development Environment

```bash
# Reset and reseed database
pnpm db:reset

# Run specific seeding functions
pnpm tsx scripts/seed-database.ts
```

### Production Deployment

```bash
# Deploy schema changes
pnpm db:migrate

# Seed production data (if needed)
NODE_ENV=production pnpm db:seed
```

## Best Practices

### 1. Data Consistency

- Use **upsert operations** to prevent duplicate data
- Maintain **referential integrity** between related records
- **Validate data** before insertion

### 2. Performance

- **Batch operations** for large datasets (100+ records)
- **Progress logging** for long-running operations
- **Error handling** with graceful fallbacks

### 3. Security

- **Anonymize sensitive data** before global plane storage
- **Use environment-specific** data for different deployments
- **Validate file paths** and data sources

### 4. Maintainability

- **Modular functions** for different data types
- **Clear naming conventions** throughout
- **Comprehensive documentation** for each data source

## Troubleshooting

### Common Issues

1. **Missing dependencies**: Run `pnpm install` to install required packages
2. **Database connection**: Verify `DATABASE_URL` and `GLOBAL_DATABASE_URL` environment variables
3. **CSV parsing errors**: Check file encoding and column headers
4. **Prisma client errors**: Run `pnpm db:generate` to regenerate client

### Debug Commands

```bash
# Check database connection
pnpm db:push --preview-feature

# Validate schema
pnpm prisma validate

# View database in Prisma Studio
pnpm prisma studio
```

## Future Enhancements

1. **Data Versioning**: Track changes to seeded data over time
2. **Incremental Seeding**: Only seed new or changed data
3. **Data Validation**: Schema validation for all data sources
4. **Performance Optimization**: Parallel processing for large datasets
5. **Environment-Specific Data**: Different datasets for dev/staging/prod
