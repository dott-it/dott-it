import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  return {
    title: `Edit assessment ${id}`,
  }
}

export default function EditAssessmentSegmentLayout({ children }: { children: ReactNode }) {
  return children
}
