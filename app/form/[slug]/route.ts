import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Function to generate a unique slug from assessment ID (copied from live-collection-modal)
function generateAssessmentSlug(assessmentId: string): string {
  // Simple hash function to convert ID to a consistent number
  let hash = 0
  for (let i = 0; i < assessmentId.length; i++) {
    const char = assessmentId.codePointAt(i) || 0
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }

  // Convert to base36 and format as xxxx-xxxx
  const base36 = Math.abs(hash).toString(36).padStart(8, '0').slice(0, 8)
  return base36.slice(0, 4) + '-' + base36.slice(4, 8)
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params

    console.log(`Form redirect: Processing slug: ${slug}`)

    // Since we can't perfectly reverse the hash, we'll search through all assessments
    // and find the one that generates the matching slug
    const assessments = await prisma.assessment.findMany({
      select: {
        id: true,
        submissionUrl: true,
        template: {
          select: {
            title: true,
          },
        },
      },
    })

    // Find the assessment that generates the matching slug
    let targetAssessment = null
    for (const assessment of assessments) {
      const generatedSlug = generateAssessmentSlug(assessment.id)
      if (generatedSlug === slug) {
        targetAssessment = assessment
        break
      }
    }

    if (!targetAssessment) {
      console.log(`Form redirect: Assessment not found for slug: ${slug}`)
      return NextResponse.json(
        {
          error: 'Assessment not found',
          message: 'The assessment form you are looking for does not exist or has been removed.',
        },
        { status: 404 },
      )
    }

    if (!targetAssessment.submissionUrl) {
      console.log(`Form redirect: No submission URL for assessment: ${targetAssessment.id}`)
      return NextResponse.json(
        {
          error: 'Form not available',
          message: 'This assessment form is not available at the moment.',
        },
        { status: 404 },
      )
    }

    console.log(`Form redirect: Redirecting to: ${targetAssessment.submissionUrl}`)

    // Redirect to the Google Forms URL
    return NextResponse.redirect(targetAssessment.submissionUrl)
  } catch (error) {
    console.error('Form redirect error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An error occurred while processing your request.',
      },
      { status: 500 },
    )
  }
}
