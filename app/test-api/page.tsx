'use client'

import { useEffect, useState } from 'react'
import { getAssessment } from '@/app/shared/services/assessment.service'
import { getAssessmentRecordsByAssessment } from '@/app/shared/services/assessment-records.service'
import { httpClient } from '@/lib/service'

export default function TestAPIPage() {
  const [assessmentData, setAssessmentData] = useState<unknown>(null)
  const [recordsData, setRecordsData] = useState<unknown>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function testServices() {
      try {
        const assessmentId = '8-6-lesson-11-green-anole-lizard-explanation'

        const assessmentResult = await getAssessment(httpClient, { id: assessmentId })
        setAssessmentData(assessmentResult)

        const recordsResult = await getAssessmentRecordsByAssessment(httpClient, { assessmentId })
        setRecordsData(recordsResult)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
    }

    testServices()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API Test Page</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">Assessment Service Result</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(assessmentData, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Assessment Records Service Result</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(recordsData, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}
