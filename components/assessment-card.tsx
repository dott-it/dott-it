import Link from "next/link"
import { ArrowRight, Clock, CheckCircle, AlertTriangle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface Assessment {
  id: string
  title: string
  unitName: string
  subject: string
  grade: number | null
  gradeName?: string | null
  type: string
  dueDate: string
  totalRecords: number
  pendingRecords: number
}

interface AssessmentCardProps {
  assessment: Assessment
}

export function AssessmentCard({ assessment }: AssessmentCardProps) {
  const progressPercent =
    assessment.totalRecords > 0
      ? ((assessment.totalRecords - assessment.pendingRecords) / assessment.totalRecords) * 100
      : 0

  // Determine card variant based on status - temporarily disabled
  // const getCardVariant = () => {
  //   if (assessment.pendingRecords === 0 && assessment.totalRecords > 0) {
  //     return "success" // Completed
  //   }
  //   if (assessment.pendingRecords > 0 && progressPercent > 0) {
  //     return "warning" // In progress
  //   }
  //   if (assessment.totalRecords === 0) {
  //     return "info" // No records yet
  //   }
  //   return "default"
  // }

  // Get status info
  const getStatusInfo = () => {
    if (assessment.pendingRecords === 0 && assessment.totalRecords > 0) {
      return {
        icon: CheckCircle,
        text: "Complete",
        variant: "default" as const,
        className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      }
    }
    if (assessment.pendingRecords > 0) {
      return {
        icon: Clock,
        text: `${assessment.pendingRecords} pending`,
        variant: "secondary" as const,
        className: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
      }
    }
    if (assessment.totalRecords === 0) {
      return {
        icon: AlertTriangle,
        text: "No records",
        variant: "outline" as const,
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      }
    }
    return {
      icon: Clock,
      text: "Pending",
      variant: "outline" as const,
      className: ""
    }
  }

  const statusInfo = getStatusInfo()
  const StatusIcon = statusInfo.icon

  return (
    <Card
      className="group overflow-hidden"
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="line-clamp-1 transition-colors group-hover:text-primary">
            {assessment.title}
          </CardTitle>
          <Badge
            variant={statusInfo.variant}
            className={`flex items-center gap-1 ${statusInfo.className}`}
          >
            <StatusIcon className="size-3" />
            {statusInfo.text}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          {assessment.unitName}, {assessment.gradeName ?? `Grade ${assessment.grade ?? ""}`}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Progress</span>
              <span className="font-medium text-primary">
                {assessment.totalRecords - assessment.pendingRecords}/{assessment.totalRecords}
              </span>
            </div>
            <Progress
              value={progressPercent}
              className="h-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="font-medium text-muted-foreground">Type</p>
              <p className="font-semibold">{assessment.type}</p>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-muted-foreground">Due</p>
              <p className="font-semibold">{assessment.dueDate}</p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full transition-shadow group-hover:shadow-md">
          <Link href={`/workspace/assessments/${assessment.id}`}>
            View Assessment
            <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
