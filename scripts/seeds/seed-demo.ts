#!/usr/bin/env tsx
/**
 * Idempotent demo seed for Dott.it (mock tenant, teacher login, class, assessments).
 * Does not copy Eddo production data.
 *
 * Login (credentials / bcrypt user — works in Production):
 *   DEMO_TEACHER_EMAIL / DEMO_TEACHER_PASSWORD from ~/.config/dott-it/neon.env or .env.local
 *
 * Preview login (only when VERCEL_ENV=preview or NODE_ENV=development) uses PREVIEW_LOGIN_*.
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

import bcrypt from 'bcryptjs'

import { prisma } from '@/lib/prisma'
import { getUserPrisma } from '@/lib/user-prisma'
import { inferSchoolYear } from '@/lib/school-year'

function loadEnvFile(path: string) {
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue
    const eq = trimmed.indexOf('=')
    const key = trimmed.slice(0, eq)
    let value = trimmed.slice(eq + 1)
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = value
  }
}

loadEnvFile(resolve(process.cwd(), '.env'))
loadEnvFile(resolve(process.cwd(), '.env.local'))
loadEnvFile('/home/ocarlosfelix/.config/dott-it/neon.env')

const userPrisma = getUserPrisma()

const DEMO = {
  tenantSlug: 'dott-demo',
  tenantName: 'Dott.it Demo School',
  domain: 'demo.dott.it',
  teacherUserId: 'demo-teacher-user',
  teacherId: 'demo-teacher-001',
  templateId: 'demo-forces-template',
  assessmentId: 'demo-forces-assessment-001',
  classSection: 'Period 3 — Physical Science',
} as const

const LEARNERS = [
  { id: 'demo-learner-01', name: 'Ava Chen', email: 'ava.chen@demo.dott.it' },
  { id: 'demo-learner-02', name: 'Noah Patel', email: 'noah.patel@demo.dott.it' },
  { id: 'demo-learner-03', name: 'Mia Santos', email: 'mia.santos@demo.dott.it' },
  { id: 'demo-learner-04', name: 'Liam Brooks', email: 'liam.brooks@demo.dott.it' },
  { id: 'demo-learner-05', name: 'Sofia Alvarez', email: 'sofia.alvarez@demo.dott.it' },
  { id: 'demo-learner-06', name: 'Ethan Nguyen', email: 'ethan.nguyen@demo.dott.it' },
  { id: 'demo-learner-07', name: 'Isabella Reed', email: 'isabella.reed@demo.dott.it' },
  { id: 'demo-learner-08', name: 'Jackson Ortiz', email: 'jackson.ortiz@demo.dott.it' },
] as const

const SAMPLE_ANSWERS = [
  {
    q1: "Newton's first law: an object stays at rest or in uniform motion unless a net force acts on it.",
    q2: 'F = ma relates net force, mass, and acceleration.',
    q3: 'For every action there is an equal and opposite reaction.',
  },
  {
    q1: 'Inertia resists changes in motion; more mass means more inertia.',
    q2: 'If force doubles and mass is constant, acceleration doubles.',
    q3: 'When you push a wall, the wall pushes back with equal force.',
  },
  {
    q1: 'Balanced forces mean zero net force and no acceleration.',
    q2: 'Unbalanced forces change an object’s velocity.',
    q3: 'Action-reaction pairs act on different objects.',
  },
]

async function seedTenantAndTeacher() {
  const email = process.env.DEMO_TEACHER_EMAIL?.trim().toLowerCase()
  const password = process.env.DEMO_TEACHER_PASSWORD
  if (!email || !password) {
    throw new Error('DEMO_TEACHER_EMAIL and DEMO_TEACHER_PASSWORD must be set')
  }
  if (!email.endsWith(`@${DEMO.domain}`)) {
    throw new Error(
      `DEMO_TEACHER_EMAIL must use domain @${DEMO.domain} (got ${email}) so tenant matching works`,
    )
  }

  const tenant = await userPrisma.tenant.upsert({
    where: { slug: DEMO.tenantSlug },
    update: {
      name: DEMO.tenantName,
      domains: [DEMO.domain],
    },
    create: {
      name: DEMO.tenantName,
      slug: DEMO.tenantSlug,
      domains: [DEMO.domain],
    },
  })

  const passwordHash = bcrypt.hashSync(password, 10)
  const user = await userPrisma.user.upsert({
    where: { email },
    update: {
      name: process.env.PREVIEW_LOGIN_NAME || 'Demo Teacher',
      passwordHash,
      emailVerified: new Date(),
      active: true,
      tenantId: tenant.id,
      role: 'teacher',
    },
    create: {
      id: DEMO.teacherUserId,
      email,
      name: process.env.PREVIEW_LOGIN_NAME || 'Demo Teacher',
      passwordHash,
      emailVerified: new Date(),
      active: true,
      tenantId: tenant.id,
      role: 'teacher',
    },
  })

  const teacher = await userPrisma.teacher.upsert({
    where: { id: DEMO.teacherId },
    update: {
      firstName: 'Demo',
      lastName: 'Teacher',
      teacherNickname: 'Ms. Demo',
      email,
      tenantId: tenant.id,
      userId: user.id,
    },
    create: {
      id: DEMO.teacherId,
      firstName: 'Demo',
      lastName: 'Teacher',
      teacherNickname: 'Ms. Demo',
      email,
      tenantId: tenant.id,
      userId: user.id,
    },
  })

  console.log(`tenant=${tenant.slug} teacher=${teacher.id} user=${user.email}`)
  return { tenant, teacher, user }
}

async function seedLearners(tenantId: string, teacherId: string) {
  const learners = []
  for (const row of LEARNERS) {
    const learner = await userPrisma.learner.upsert({
      where: { email: row.email },
      update: {
        name: row.name,
        tenantId,
        teacherId,
        status: 'active',
      },
      create: {
        id: row.id,
        name: row.name,
        email: row.email,
        tenantId,
        teacherId,
        status: 'active',
      },
    })
    learners.push(learner)
  }
  console.log(`learners=${learners.length}`)
  return learners
}

async function seedAssessments(
  tenantId: string,
  teacherId: string,
  learners: Array<{ id: string; name: string }>,
) {
  const template = await prisma.assessmentTemplate.upsert({
    where: { id: DEMO.templateId },
    update: {
      title: 'Forces and Motion — Exit Ticket',
      type: 'formative',
      description: 'Short check on Newton’s laws for Physical Science.',
      subject: 'Physical Science',
      gradeLevel: 'Grade 8',
      unitCode: 'PS-8-U2',
      lessonNumber: 4,
    },
    create: {
      id: DEMO.templateId,
      title: 'Forces and Motion — Exit Ticket',
      type: 'formative',
      description: 'Short check on Newton’s laws for Physical Science.',
      subject: 'Physical Science',
      gradeLevel: 'Grade 8',
      unitCode: 'PS-8-U2',
      lessonNumber: 4,
    },
  })

  const assignedAt = '2026-10-20T14:00:00Z'
  const dueAt = '2026-10-22T23:59:59Z'
  const assignedTo = learners.map((l) => l.id)

  const assessment = await prisma.assessment.upsert({
    where: { id: DEMO.assessmentId },
    update: {
      tenantId,
      templateId: template.id,
      teacherId,
      assignedBy: 'Ms. Demo',
      assignedAt,
      dueAt,
      assignedTo,
      status: 'live',
      instructions: 'Answer in your own words. Use examples from class when you can.',
      numberOfQuestions: 3,
      schoolYear: inferSchoolYear(assignedAt, dueAt),
      unitCode: 'PS-8-U2',
      studentResponsesCount: Math.min(5, learners.length),
      submissionUrl: null,
      googleFormId: null,
    },
    create: {
      id: DEMO.assessmentId,
      tenantId,
      templateId: template.id,
      teacherId,
      assignedBy: 'Ms. Demo',
      assignedAt,
      dueAt,
      assignedTo,
      status: 'live',
      instructions: 'Answer in your own words. Use examples from class when you can.',
      numberOfQuestions: 3,
      schoolYear: inferSchoolYear(assignedAt, dueAt),
      unitCode: 'PS-8-U2',
      studentResponsesCount: Math.min(5, learners.length),
    },
  })

  let records = 0
  for (let i = 0; i < Math.min(5, learners.length); i++) {
    const learner = learners[i]!
    const rawAnswer = SAMPLE_ANSWERS[i % SAMPLE_ANSWERS.length]!
    const recordId = `demo-record-${String(i + 1).padStart(2, '0')}`

    const record = await prisma.assessmentRecord.upsert({
      where: {
        assessmentId_learnerId: {
          assessmentId: assessment.id,
          learnerId: learner.id,
        },
      },
      update: {
        tenantId,
        classSection: DEMO.classSection,
        rawAnswer,
        status: i < 2 ? 'feedback_in_progress' : 'submitted',
        type: 'formative',
        numberOfQuestions: '3',
        details: '',
      },
      create: {
        id: recordId,
        tenantId,
        assessmentId: assessment.id,
        classSection: DEMO.classSection,
        learnerId: learner.id,
        rawAnswer,
        status: i < 2 ? 'feedback_in_progress' : 'submitted',
        type: 'formative',
        numberOfQuestions: '3',
        details: '',
      },
    })

    await prisma.studentAnswer.deleteMany({ where: { assessmentRecordId: record.id } })
    await prisma.studentAnswer.create({
      data: {
        assessmentRecordId: record.id,
        formSubmissionID: `demo-form-sub-${i + 1}`,
        answers: rawAnswer,
      },
    })

    if (i < 2) {
      await prisma.feedback.deleteMany({ where: { assessmentRecordId: record.id } })
      await prisma.feedback.create({
        data: {
          assessmentRecordId: record.id,
          status: 'draft',
          feedbackSections: {
            create: [
              {
                type: 'strength',
                section: 'Strengths',
                content: `${learner.name.split(' ')[0]} names the core idea clearly and uses class language.`,
                order: 0,
                used: true,
              },
              {
                type: 'growth',
                section: 'Next step',
                content: 'Add one concrete classroom example to show the law in action.',
                order: 1,
                used: true,
              },
            ],
          },
        },
      })
    }

    records += 1
  }

  console.log(`template=${template.id} assessment=${assessment.id} records=${records}`)
}

async function main() {
  console.log('Seeding Dott.it demo data…')
  const { tenant, teacher } = await seedTenantAndTeacher()
  const learners = await seedLearners(tenant.id, teacher.id)
  await seedAssessments(tenant.id, teacher.id, learners)
  console.log('Done. Log in with DEMO_TEACHER_EMAIL / DEMO_TEACHER_PASSWORD (see neon.env).')
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(async () => {
    await Promise.allSettled([userPrisma.$disconnect(), prisma.$disconnect()])
  })
