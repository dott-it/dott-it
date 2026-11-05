import { NextResponse } from 'next/server'
import { loadUnitBrowseData } from '@/lib/library/browse'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ unitCode: string }> },
) {
  const { unitCode } = await params
  const { searchParams } = new URL(request.url)
  const gradeParam = searchParams.get('grade')

  if (!gradeParam) {
    return NextResponse.json({ error: 'grade query parameter is required' }, { status: 400 })
  }

  const grade = Number.parseInt(gradeParam, 10)
  if (Number.isNaN(grade)) {
    return NextResponse.json({ error: 'grade must be a number' }, { status: 400 })
  }

  try {
    const data = loadUnitBrowseData(unitCode, grade)

    if (!data) {
      return NextResponse.json({ error: 'Unit not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error loading unit browse data:', error)
    return NextResponse.json({ error: 'Failed to load unit browse data' }, { status: 500 })
  }
}
