import { Answers } from '@/app/types';
import { generateAiResponse } from '@/lib/langsmith';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';



async function regenerateAiFeedback(studentAnswerId: string) {
  // First, get the existing student answer with its AI suggestions
  const studentAnswer = await prisma.studentAnswer.findUnique({
    where: { id: studentAnswerId },
    include: { 
      assessmentRecord: {
        include: {
          assessment: {
            include: {
              template: true
            }
          }
        }
      },
      aiSuggestions: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { feedback: true }
      } 
    }
  });

  await prisma.studentAnswer.update({
    where: { id: studentAnswerId },
    data: {
      aiSuggestions: {
        deleteMany: {}
      }
    }
  })

  if (!studentAnswer) {
    throw new Error('Student answer not found');
  }

  // Generate new AI suggestions using the assessment instructions
  const instructions = studentAnswer.assessmentRecord.assessment.instructions || '';
  
  const aiSuggestions = await generateAiResponse(
    instructions,
    studentAnswer.answers as unknown as Answers[]
  );

  console.log('aiSuggestions')
  console.log(aiSuggestions)
  // Create AI suggestions first
  const aiSuggestionsData = await prisma.aiSuggestions.create({
    data: {
      studentAnswerId: studentAnswerId,
      rubricScore: aiSuggestions.rubricScore,
      used: false,
      discarted: false,
      feedback: { 
        create: (aiSuggestions.feedback || []).map(feedback => ({
          type: feedback.type,
          section: feedback.section,
          content: feedback.content,
          order: feedback.order,
          used: false,
          discarted: false,
          isCustomized: false
        }))
      }
    }
  });

  // Create rubric evaluations separately with the aiSuggestions ID
  if (aiSuggestions.rubricEvaluation && aiSuggestions.rubricEvaluation.length > 0) {
    await Promise.all(
      aiSuggestions.rubricEvaluation.map(evaluation =>
        prisma.rubricEvaluation.create({
          data: {
            criterion: evaluation.criterion || '',
            evaluation: evaluation.evaluation || '',
            points: evaluation.points || '',
            rationale: evaluation.rationale || '',
            aiSuggestionsId: aiSuggestionsData.id
          }
        })
      )
    );
  }
  // Return the updated student answer with the new AI suggestions
  return await prisma.studentAnswer.findUnique({
    where: { id: studentAnswerId },
    include: { 
      aiSuggestions: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { 
          feedback: true,
          rubricEvaluation: true
        }
      } 
    }
  });

}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const {id:studentAnswerId} = await params;

  if (!studentAnswerId) {
    return NextResponse.json(
      { error: 'studentAnswerId is required' },
      { status: 400 }
    );
  }

  try {
    const updatedStudentAnswer = await regenerateAiFeedback( studentAnswerId );
    return NextResponse.json(updatedStudentAnswer);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to regenerate AI feedback', details: message },
      { status: 500 }
    );
  }
}
