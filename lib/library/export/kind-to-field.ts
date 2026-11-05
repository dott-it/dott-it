import type { IngestedFileRefs } from '@/lib/library/ingest/types'
import type { PackageItemKind } from '@/lib/library/materials/types'

export const PACKAGE_KIND_TO_INGEST_FIELD: Record<
  PackageItemKind,
  keyof IngestedFileRefs | null
> = {
  'student-handout': 'studentHandout',
  'teacher-guide': 'teacherGuide',
  'answer-key': 'answerKey',
  rubric: 'rubric',
  'guidance-sheet': 'guidanceSheet',
  'google-form': 'googleForm',
}
