import { prisma } from '@/lib/prisma';

export const getStudentAnswers = async (assessmentRecordId: string) => {
  return await prisma.studentAnswer.findMany({
    where: {
      assessmentRecordId,
    },
    include: {
      aiSuggestions: true,
    },
  });
};
