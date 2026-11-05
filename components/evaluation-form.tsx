'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Info } from 'lucide-react'
import { formatScoreForDisplay } from '@/app/lib/utils/score-format'

interface Record {
  id: string
  assessmentId: string
  studentName: string
  studentId: string
  status: string
  submittedDate: string
  score?: number
  maxScore?: number
  reviewedDate?: string
  flagged: boolean
  feedback: Array<{
    type: string
    section: string
    content: string
  }>
  content?: string
}

interface EvaluationFormProps {
  record: Record
}

export function EvaluationForm({ record }: EvaluationFormProps) {
  const [scores, setScores] = useState({
    scientificExplanation: record.status === 'reviewed' ? '3' : '',
    dataAnalysis: record.status === 'reviewed' ? '3' : '',
    diagram: record.status === 'reviewed' ? '2' : '',
  })

  const [comments, setComments] = useState(
    record.feedback.find((f) => f.section === 'Educator Comments')?.content || '',
  )

  const totalScore =
    Number(scores.scientificExplanation) + Number(scores.dataAnalysis) + Number(scores.diagram)

  return (
    <div className="space-y-6">
      <fieldset className="space-y-4 border-0 p-0">
        <legend className="mb-2 flex w-full items-center justify-between px-0 text-base font-medium">
          <span>Scientific Explanation</span>
          <span className="text-sm font-normal text-muted-foreground">(out of 4)</span>
        </legend>
        <RadioGroup
          value={scores.scientificExplanation}
          onValueChange={(value) => setScores({ ...scores, scientificExplanation: value })}
          className="flex justify-between"
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <RadioGroupItem value={i.toString()} id={`scientific-${i}`} className="peer" />
              <Label
                htmlFor={`scientific-${i}`}
                className="cursor-pointer text-sm peer-data-[state=checked]:font-medium"
              >
                {i}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </fieldset>

      <fieldset className="space-y-4 border-0 p-0">
        <legend className="mb-2 flex w-full items-center justify-between px-0 text-base font-medium">
          <span>Data Analysis</span>
          <span className="text-sm font-normal text-muted-foreground">(out of 3)</span>
        </legend>
        <RadioGroup
          value={scores.dataAnalysis}
          onValueChange={(value) => setScores({ ...scores, dataAnalysis: value })}
          className="flex justify-between"
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <RadioGroupItem value={i.toString()} id={`data-${i}`} className="peer" />
              <Label
                htmlFor={`data-${i}`}
                className="cursor-pointer text-sm peer-data-[state=checked]:font-medium"
              >
                {i}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </fieldset>

      <fieldset className="space-y-4 border-0 p-0">
        <legend className="mb-2 flex w-full items-center justify-between px-0 text-base font-medium">
          <span>Diagram</span>
          <span className="text-sm font-normal text-muted-foreground">(out of 3)</span>
        </legend>
        <RadioGroup
          value={scores.diagram}
          onValueChange={(value) => setScores({ ...scores, diagram: value })}
          className="flex justify-between"
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <RadioGroupItem value={i.toString()} id={`diagram-${i}`} className="peer" />
              <Label
                htmlFor={`diagram-${i}`}
                className="cursor-pointer text-sm peer-data-[state=checked]:font-medium"
              >
                {i}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </fieldset>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <Label htmlFor="educator-comments" className="text-base">Educator Comments</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="size-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="w-[200px] text-xs">
                  Add personalized feedback to help the student understand their performance and
                  areas for improvement.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="space-y-2">
          <Button variant="outline" size="sm" className="text-xs">
            Use AI Suggestions
          </Button>
          <Textarea
            id="educator-comments"
            placeholder="Enter your feedback for the student..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center justify-between">
          <div className="font-medium">Total Score</div>
          <div className="text-lg font-bold">
            {formatScoreForDisplay(totalScore * 10, undefined, record.maxScore)}
          </div>
        </div>
      </div>
    </div>
  )
}
