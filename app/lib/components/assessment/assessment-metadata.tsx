import { Card, CardContent } from '@/app/lib/components/ui/layout/card'
import { Typography } from '@/app/lib/components/ui/typography'
import { Users, Calendar, Book, GraduationCap, Layers } from 'lucide-react'
import { SmartDate } from '@/app/lib/components/ui/feedback'
import { ActiveAssessment } from '@/types'

interface AssessmentMetadataProps {
  assessment: ActiveAssessment
  totalStudents: number
}

// Dynamic grid classes based on number of cards
const getGridClasses = (cardCount: number) => {
  switch (cardCount) {
    case 1: {
      return "grid gap-4 grid-cols-1"
    }
    case 2: {
      return "grid gap-4 md:grid-cols-2"
    }
    case 3: {
      return "grid gap-4 md:grid-cols-2 lg:grid-cols-3"
    }
    case 4: {
      return "grid gap-4 md:grid-cols-2 lg:grid-cols-4"
    }
    case 5: {
      return "grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
    }
    default: {
      return "grid gap-4 md:grid-cols-2 lg:grid-cols-3"
    }
  }
}

export function AssessmentMetadata({ assessment, totalStudents }: AssessmentMetadataProps) {
  // Calculate the number of visible cards
  const visibleCards = [
    true, // Grade Level - always visible
    true, // Unit - always visible  
    true, // Assessment Type - always visible
    totalStudents > 0, // Students - conditional
    !!assessment.closeDate, // Close Date - conditional
  ].filter(Boolean).length

  return (
    <div className={getGridClasses(visibleCards)}>
      {/* Grade Level */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="size-5 text-purple-600" />
            <div>
              <Typography variant="body2" color="muted" fontWeight="medium">
                Grade Level
              </Typography>
              <Typography variant="h2"   className="text-xl"  fontWeight="bold">
                {assessment.grade}
              </Typography>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unit */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Layers className="size-5 text-indigo-600" />
            <div>
              <Typography variant="body2" color="muted" fontWeight="medium">
                Unit
              </Typography>
              <Typography variant="h2"  className="text-xl"  fontWeight="bold">
                {assessment.unitName}
              </Typography>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assessment Type */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Book className="size-5 text-blue-600" />
            <div>
              <Typography variant="body2" color="muted" fontWeight="medium">
                Assessment Type
              </Typography>
              <Typography variant="h2"  className="text-xl"  fontWeight="bold">
                {assessment.type}
              </Typography>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Number of Students - only show if there are students */}
      {totalStudents > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="size-5 text-primary" />
              <div>
                <Typography variant="body2" color="muted" fontWeight="medium">
                  Students
                </Typography>
                <Typography variant="h2" className="text-xl" fontWeight="bold">
                  {totalStudents}
                </Typography>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Close Date - only show if provided */}
      {assessment.closeDate && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="size-5 text-green-600" />
              <div>
                <Typography variant="body2" color="muted" fontWeight="medium">
                  Close Date
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  <SmartDate date={assessment.closeDate} />
                </Typography>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
