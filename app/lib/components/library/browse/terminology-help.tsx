'use client'

import { HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { UnitAssessmentShape } from '@/lib/library/browse'

interface TerminologyHelpProps {
  assessmentShape?: UnitAssessmentShape
}

function formatUnitCounts(shape: UnitAssessmentShape): string {
  const assessmentLabel =
    shape.assessmentCount === 1 ? 'assessment' : 'assessments'
  const opportunityLabel =
    shape.opportunityCount === 1 ? 'opportunity' : 'opportunities'

  return `${shape.opportunityCount} assessment ${opportunityLabel} from the Teacher Edition + ${shape.assessmentCount} ${assessmentLabel} from the unit download`
}

export function TerminologyHelp({ assessmentShape }: TerminologyHelpProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <HelpCircle className="size-4" />
          What&apos;s in this table?
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 space-y-3" align="end">
        {assessmentShape ? (
          <p className="text-sm font-medium text-foreground">
            This unit: {formatUnitCounts(assessmentShape)}
          </p>
        ) : null}
        <div>
          <p className="font-semibold text-foreground">Assessment</p>
          <p className="text-sm text-muted-foreground">
            In OpenSciEd, an assessment is a standalone document from the unit download —
            something students complete and turn in (for example, a pre-assessment handout or
            performance task).
          </p>
        </div>
        <div>
          <p className="font-semibold text-foreground">Assessment opportunity</p>
          <p className="text-sm text-muted-foreground">
            An assessment opportunity is a facilitation call-out from the Teacher Edition —
            guidance on when and how to assess during a lesson. It is not a separate student
            handout.
          </p>
        </div>
        <div>
          <p className="font-semibold text-foreground">Assessment category</p>
          <p className="text-sm text-muted-foreground">
            Each assessment or opportunity is tagged with a category: Pre-assessment (before
            instruction), Formative (during instruction), Summative (end of unit or lesson
            sequence), or Peer (student-to-student feedback).
          </p>
        </div>
        <div>
          <p className="font-semibold text-foreground">Assessment guide</p>
          <p className="text-sm text-muted-foreground">
            An assessment guide is an Dott.it panel that supports teachers with alignment to
            standards, common gaps in student thinking, and sample responses — separate from
            the OpenSciEd unit download.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  )
}
