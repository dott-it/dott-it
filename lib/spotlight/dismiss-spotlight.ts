import { prisma } from '@/lib/prisma'

export type DismissSpotlightResult =
  | { ok: true }
  | { ok: false; reason: 'not_found' | 'forbidden' }

/**
 * Permanently dismiss a spotlight card for a teacher + assessment.
 * Idempotent via unique (teacherId, assessmentId).
 */
export async function dismissSpotlightCard(input: {
  teacherId: string
  tenantId: string
  assessmentId: string
  /** When true (eddo staff), skip teacher ownership check. */
  isStaff?: boolean
}): Promise<DismissSpotlightResult> {
  const assessment = await prisma.assessment.findUnique({
    where: { id: input.assessmentId },
    select: { id: true, teacherId: true, tenantId: true },
  })

  if (!assessment) {
    return { ok: false, reason: 'not_found' }
  }

  if (!input.isStaff && assessment.teacherId !== input.teacherId) {
    return { ok: false, reason: 'forbidden' }
  }

  await prisma.spotlightDismissal.upsert({
    where: {
      teacherId_assessmentId: {
        teacherId: input.teacherId,
        assessmentId: input.assessmentId,
      },
    },
    create: {
      tenantId: assessment.tenantId || input.tenantId,
      teacherId: input.teacherId,
      assessmentId: input.assessmentId,
    },
    update: {},
  })

  return { ok: true }
}
