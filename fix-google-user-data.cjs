const { PrismaClient } = require('@prisma/assessmentDB')
const { userPrisma } = require('./lib/user-prisma')

async function fixGoogleUserData() {
  const prisma = new PrismaClient()

  try {
    console.log('🔍 Finding Google user...')

    // Find the Google user
    const googleUser = await userPrisma.user.findFirst({
      where: {
        email: {
          contains: 'gmail.com',
        },
      },
    })

    if (!googleUser) {
      console.log('❌ No Google user found')
      return
    }

    console.log('✅ Found Google user:', googleUser.email, 'tenantId:', googleUser.tenantId)

    // Create assessment template for this tenant
    const template = await prisma.assessmentTemplate.upsert({
      where: { id: 'google-template-1' },
      update: {},
      create: {
        id: 'google-template-1',
        tenantId: googleUser.tenantId,
        title: 'Sample Assessment',
        description: 'A sample assessment for testing',
        subject: 'Science',
        gradeLevel: 'Grade 8',
        type: 'formative',
      },
    })

    console.log('✅ Template created:', template.id)

    // Create assessment
    const assessment = await prisma.assessment.upsert({
      where: { id: 'google-assessment-1' },
      update: {},
      create: {
        id: 'google-assessment-1',
        tenantId: googleUser.tenantId,
        templateId: template.id,
        teacherId: googleUser.id,
        assignedBy: 'Google User',
        assignedAt: new Date().toISOString(),
        dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        assignedTo: [],
        status: 'active',
        instructions: 'Complete this assessment',
        numberOfQuestions: 3,
      },
    })

    console.log('✅ Assessment created:', assessment.id)

    // Create assessment record
    const record = await prisma.assessmentRecord.create({
      data: {
        tenantId: googleUser.tenantId,
        assessmentId: assessment.id,
        classSection: 'Google Class',
        learnerId: 'google-learner-1',
        rawAnswer: {
          question1: 'Sample answer 1',
          question2: 'Sample answer 2',
          question3: 'Sample answer 3',
        },
        submittedAt: new Date(),
        status: 'submitted',
        rubricScore: '3',
        details: 'Good work',
        type: 'formative',
        teacherScore: '3',
        numberOfQuestions: '3',
      },
    })

    console.log('✅ Assessment record created:', record.id)

    console.log('🎉 Data created successfully for Google user!')
  } catch (error) {
    console.error('❌ Error creating data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixGoogleUserData()
