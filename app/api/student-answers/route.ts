import { NextRequest, NextResponse } from 'next/server';
import { getStudentAnswers } from '@/app/api/student-answers/student-answer.service';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const assessmentRecordId = searchParams.get('assessmentRecordId');

  if (!assessmentRecordId) {
    return NextResponse.json({ error: 'assessmentRecordId is required' }, { status: 400 });
  }

  try {
    const studentAnswers = await getStudentAnswers(assessmentRecordId);
    return NextResponse.json(studentAnswers);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch student answers' }, { status: 500 });
  }
}
