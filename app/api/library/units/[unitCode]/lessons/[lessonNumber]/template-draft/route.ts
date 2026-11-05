import { NextResponse } from 'next/server'
import { requireBackofficeSession } from '@/app/lib/api/require-backoffice-session'
import { loadUnitBrowseData } from '@/lib/library/browse'
import { buildAssessmentTemplateDraftFromLesson } from '@/lib/library/browse/template-draft-from-lesson'
import { normalizeGradeLevelKey } from '@/lib/openscied-unit-options'

export const runtime = 'nodejs'
export const maxDuration = 120

interface RouteParams {
  params: Promise<{ unitCode: string; lessonNumber: string }>
}

/**
 * GET /api/library/units/[unitCode]/lessons/[lessonNumber]/template-draft?grade=
 * Prefill assessment-template fields from library browse + ingest data.
 */
export async function GET(request: Request, context: RouteParams) {
  const access = await requireBackofficeSession()
  if (!access.ok) {
    if (access.status === 401) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      {
        error: 'Forbidden',
        message: 'Access denied',
        details: 'Template drafts are restricted to Dott.it tenant users',
      },
      { status: 403 },
    )
  }

  const { unitCode, lessonNumber: lessonParam } = await context.params
  const { searchParams } = new URL(request.url)
  const gradeParam = searchParams.get('grade')

  const lessonNumber = Number.parseInt(lessonParam, 10)
  if (!Number.isInteger(lessonNumber) || lessonNumber < 1) {
    return NextResponse.json({ error: 'lessonNumber must be a positive integer' }, { status: 400 })
  }

  let grade: number
  if (gradeParam) {
    const fromQuery = Number.parseInt(normalizeGradeLevelKey(gradeParam) || gradeParam, 10)
    if (Number.isNaN(fromQuery)) {
      return NextResponse.json({ error: 'grade must be a number' }, { status: 400 })
    }
    grade = fromQuery
  } else {
    const fromUnit = Number.parseInt(/^(\d+)\./.exec(unitCode)?.[1] ?? '', 10)
    if (Number.isNaN(fromUnit)) {
      return NextResponse.json({ error: 'grade query parameter is required' }, { status: 400 })
    }
    grade = fromUnit
  }

  try {
    const unit = loadUnitBrowseData(unitCode, grade)
    if (!unit) {
      return NextResponse.json({ error: 'Unit not found' }, { status: 404 })
    }

    const draft = await buildAssessmentTemplateDraftFromLesson(unit, lessonNumber)
    if (!draft) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    return NextResponse.json({
      unitCode: unit.unitCode,
      lessonNumber,
      grade: unit.grade,
      ...draft,
    })
  } catch (error) {
    console.error('Error building template draft from lesson:', error)
    return NextResponse.json({ error: 'Failed to build template draft' }, { status: 500 })
  }
}
