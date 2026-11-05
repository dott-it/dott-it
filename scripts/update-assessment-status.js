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
  // Primeiro, vamos listar alguns assessments para você escolher
  console.log('📋 Listando assessments disponíveis...')
  const assessments = await prisma.assessment.findMany({
    include: {
      template: true,
      assessmentRecords: {
        include: {
          events: true,
        },
      },
    },
    take: 5, // Limita a 5 para não sobrecarregar
  })

  console.log('\n🔍 Assessments encontrados:')
  for (const [index, assessment] of assessments.entries()) {
    const totalRecords = assessment.assessmentRecords.length
    const pendingRecords = assessment.assessmentRecords.filter((record) => {
      const submissionEvent = record.events.find((e) => e.eventType === 'submission')
      const teacherReviewEvent = record.events.find((e) => e.eventType === 'teacher_review')
      return submissionEvent && !teacherReviewEvent
    }).length

    console.log(`${index + 1}. ID: ${assessment.id}`)
    console.log(`   Título: ${assessment.template.title}`)
    console.log(`   Status atual: ${assessment.status}`)
    console.log(`   Registros: ${totalRecords} total, ${pendingRecords} pendentes`)
    console.log('')
  }

  // Para o teste, vamos atualizar o primeiro assessment para 'completed'
  if (assessments.length > 0) {
    const assessmentToUpdate = assessments[0]
    console.log(
      `✅ Atualizando assessment "${assessmentToUpdate.template.title}" para status 'completed'...`,
    )

    const updatedAssessment = await prisma.assessment.update({
      where: { id: assessmentToUpdate.id },
      data: { status: 'completed' },
      include: {
        template: true,
      },
    })

    console.log(`✅ Assessment atualizado com sucesso!`)
    console.log(`   ID: ${updatedAssessment.id}`)
    console.log(`   Título: ${updatedAssessment.template.title}`)
    console.log(`   Novo status: ${updatedAssessment.status}`)
  } else {
    console.log('❌ Nenhum assessment encontrado no banco de dados.')
  }
} catch (error) {
  console.error('❌ Erro ao atualizar assessment:', error)
} finally {
  await prisma.$disconnect()
}
