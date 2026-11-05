import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// Carregar variáveis de ambiente do .env.local
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const envPath = path.join(__dirname, '..', '.env.local')

try {
  const envContent = readFileSync(envPath, 'utf8')
  const envVars = {}

  for (const line of envContent.split('\n')) {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').replaceAll(/^["']|["']$/g, '') // Remove quotes
      envVars[key.trim()] = value.trim()
    }
  }

  // Definir as variáveis de ambiente
  for (const [key, value] of Object.entries(envVars)) {
    if (key && value) {
      process.env[key] = value
    }
  }
} catch {
  console.log('⚠️  Não foi possível carregar .env.local, tentando usar variáveis existentes...')
}

const prisma = new PrismaClient()

try {
  console.log('🔍 Procurando assessments para marcar como concluído...')

  // Buscar assessments
  const assessments = await prisma.assessment.findMany({
    include: {
      template: true,
      assessmentRecords: {
        include: {
          events: true,
        },
      },
    },
    take: 3,
  })

  console.log(`📋 Encontrados ${assessments.length} assessments:`)

  for (const [index, assessment] of assessments.entries()) {
    const totalRecords = assessment.assessmentRecords.length
    const pendingRecords = assessment.assessmentRecords.filter((record) => {
      const submissionEvent = record.events.find((e) => e.eventType === 'submission')
      const teacherReviewEvent = record.events.find((e) => e.eventType === 'teacher_review')
      return submissionEvent && !teacherReviewEvent
    }).length

    console.log(`${index + 1}. ${assessment.template.title}`)
    console.log(`   ID: ${assessment.id}`)
    console.log(`   Status atual: ${assessment.status}`)
    console.log(`   Registros: ${totalRecords} total, ${pendingRecords} pendentes`)
    console.log('')
  }

  if (assessments.length > 0) {
    // Marcar o primeiro assessment como concluído
    const assessmentToUpdate = assessments[0]
    console.log(`🎯 Marcando assessment "${assessmentToUpdate.template.title}" como concluído...`)

    const updatedAssessment = await prisma.assessment.update({
      where: { id: assessmentToUpdate.id },
      data: { status: 'completed' },
      include: {
        template: true,
      },
    })

    console.log('✅ Assessment atualizado com sucesso!')
    console.log(`   ID: ${updatedAssessment.id}`)
    console.log(`   Título: ${updatedAssessment.template.title}`)
    console.log(`   Novo status: ${updatedAssessment.status}`)

    // Verificar se a atualização foi persistida
    const verifyAssessment = await prisma.assessment.findUnique({
      where: { id: updatedAssessment.id },
      include: { template: true },
    })

    console.log('')
    console.log('🔍 Verificação no banco de dados:')
    console.log(`   Status no banco: ${verifyAssessment?.status}`)
    console.log(`   Status atualizado: ${updatedAssessment.status}`)
    console.log(
      `   Atualização persistida: ${
        verifyAssessment?.status === 'completed' ? '✅ SIM' : '❌ NÃO'
      }`,
    )
  } else {
    console.log('❌ Nenhum assessment encontrado no banco de dados.')
  }
} catch (error) {
  console.error('❌ Erro ao atualizar assessment:', error)
} finally {
  await prisma.$disconnect()
}

