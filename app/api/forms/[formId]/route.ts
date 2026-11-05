import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function buildCorsHeaders(req?: Request) {
  const origin = req?.headers.get('origin') ?? '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
  };
}

export async function OPTIONS(req: Request) {
  // Handle CORS preflight
  const headers = buildCorsHeaders(req);
  return new NextResponse(null, { status: 204, headers });
}

export async function DELETE(req: Request, ctx: unknown) {
  const params = await (ctx as { params?: { formId?: string } })?.params;
  const formId = params?.formId;
  const corsHeaders = buildCorsHeaders(req);
  console.log('Received DELETE request for formId:', formId);

  if (!formId) {
    return NextResponse.json({ success: false, error: 'formId is required' }, { status: 400, headers: corsHeaders });
  }

  try {
    // Find assessments that use this form id
    const assessments = await prisma.assessment.findMany({ where: { googleFormId: formId }, select: { id: true } });
    if (!assessments || assessments.length === 0) {
      return NextResponse.json({ success: true, deleted: 0, message: 'No assessments found for this form id' }, { headers: corsHeaders });
    }

    console.log(`Found ${assessments.length} assessments for formId ${formId}`);
    console.log('Assessment IDs:', assessments.map(a => a.id));

    const assessmentIds = assessments.map((a) => a.id);

    // Find all assessmentRecord ids for these assessments
    const assessmentRecords = await prisma.assessmentRecord.findMany({ where: { assessmentId: { in: assessmentIds } }, select: { id: true } });
    const assessmentRecordIds = assessmentRecords.map(r => r.id);

    if (assessmentRecordIds.length === 0) {
      return NextResponse.json({ success: true, deleted: 0, message: 'No assessment records to delete for this form id' }, { headers: corsHeaders });
    }

    // Find dependent ids
    const studentAnswers = await prisma.studentAnswer.findMany({ where: { assessmentRecordId: { in: assessmentRecordIds } }, select: { id: true } });
    const studentAnswerIds = studentAnswers.map(s => s.id);

    const aiSuggestions = await prisma.aiSuggestions.findMany({ where: { studentAnswerId: { in: studentAnswerIds } }, select: { id: true } });
    const aiSuggestionsIds = aiSuggestions.map(a => a.id);

    const feedbacks = await prisma.feedback.findMany({ where: { assessmentRecordId: { in: assessmentRecordIds } }, select: { id: true } });
    const feedbackIds = feedbacks.map(f => f.id);

    // Execute deletes in a safe order inside a transaction
    const results = await prisma.$transaction([
      // Delete rubric evaluations linked to aiSuggestions
      prisma.rubricEvaluation.deleteMany({ where: { aiSuggestionsId: { in: aiSuggestionsIds } } }),
      // Delete feedback sections linked to feedbacks
      prisma.feedbackSection.deleteMany({ where: { feedbackId: { in: feedbackIds } } }),
      // Delete feedbacks linked to assessment records
      prisma.feedback.deleteMany({ where: { id: { in: feedbackIds } } }),
      // Delete assessment events/history
      prisma.assessmentEvent.deleteMany({ where: { assessmentRecordId: { in: assessmentRecordIds } } }),
      // Delete aiSuggestions
      prisma.aiSuggestions.deleteMany({ where: { id: { in: aiSuggestionsIds } } }),
      // Delete student answers
      prisma.studentAnswer.deleteMany({ where: { id: { in: studentAnswerIds } } }),
      // Finally delete assessment records
      prisma.assessmentRecord.deleteMany({ where: { id: { in: assessmentRecordIds } } }),
    ]);

  // results is an array of DeleteManyResult objects; sum counts
  const deletedCount = results.reduce((sum: number, r: { count?: number }) => sum + (r.count ?? 0), 0);

    return NextResponse.json({ success: true, deleted: deletedCount, details: results }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error deleting assessment records for form:', formId, error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: 'Failed to delete assessment records', details: message }, { status: 500, headers: corsHeaders });
  }
}
