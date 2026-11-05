'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/app/lib/components/ui/buttons/button-compounds'
import { Typography } from '@/app/lib/components/ui/typography'
import { ArrowLeft } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/app/lib/components/ui/layout/card'

export default function CreateAssessmentPage() {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)

  const handleBack = () => {
    router.push('/workspace')
  }

  const handleCreateAssessment = async () => {
    setIsCreating(true)
    try {
      // TODO: Implement assessment creation logic
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Redirect to workspace after creation
      router.push('/workspace')
    } catch {
      // Error handling will be implemented when API call is added
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleBack} aria-label="Go back">
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <Typography variant="h1" className="mb-2">
            Create New Assessment
          </Typography>
          <Typography variant="body1" color="muted">
            Set up a new assessment for your students
          </Typography>
        </div>
      </div>

      {/* Create Assessment Form */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Assessment Details</CardTitle>
        </CardHeader>
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-2">
                Assessment Title
              </label>
              <input
                type="text"
                id="title"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter assessment title"
              />
            </div>
            
            <div>
              <label htmlFor="unit" className="block text-sm font-medium mb-2">
                Unit
              </label>
              <input
                type="text"
                id="unit"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter unit name"
              />
            </div>
            
            <div>
              <label htmlFor="subject" className="block text-sm font-medium mb-2">
                Subject
              </label>
              <input
                type="text"
                id="subject"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter subject"
              />
            </div>
            
            <div>
              <label htmlFor="grade" className="block text-sm font-medium mb-2">
                Grade Level
              </label>
              <select
                id="grade"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select grade level</option>
                <option value="6">Grade 6</option>
                <option value="7">Grade 7</option>
                <option value="8">Grade 8</option>
                <option value="9">Grade 9</option>
                <option value="10">Grade 10</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter assessment description"
              />
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateAssessment}
              disabled={isCreating}
              className="flex-1"
            >
              {isCreating ? 'Creating...' : 'Create Assessment'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
