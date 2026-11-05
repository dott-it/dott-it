import { NextResponse } from 'next/server'
import { syncFormResponses } from '@/lib/forms/sync-form-responses'

export async function POST(request: Request, { params }: { params: Promise<{ formId: string }> }) {
  const { formId } = await params
  const reqBody = await request.json()

  if (!formId) {
    return NextResponse.json({ error: 'Form ID is required' }, { status: 400 })
  }

  try {
    const formData = reqBody.formData
    const responseData = reqBody.responseData

    console.log(responseData)
    if (!formData || !responseData) {
      return NextResponse.json({ message: 'No form data or responses found.' }, { status: 404 })
    }

    await syncFormResponses({
      formId,
      formData,
      responseData,
    })

    return NextResponse.json({ success: true, message: 'Responses synced successfully.' })
  } catch (error) {
    console.error('Error syncing responses:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'

    if (
      errorMessage === 'Assessment not found' ||
      errorMessage.startsWith('No assessment found for googleFormId:')
    ) {
      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          details:
            'Link this Google Form to an Assessment (googleFormId) before syncing responses',
        },
        { status: 404 },
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to sync responses', details: errorMessage },
      { status: 500 },
    )
  }
}
