'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Activity, Users, FileText, MessageSquare, Download, BarChart3 } from 'lucide-react'
import { generateDemoActivity, getDemoModeConfig } from '@/lib/demo-mode'
import { SmartDate } from '@/app/lib/components/ui/feedback'

interface ActivityItem {
  type: string
  message: string
  timestamp: Date
}

export function DemoActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const demoConfig = getDemoModeConfig()

  useEffect(() => {
    if (!demoConfig.simulateActivity) return

    // Generate initial activity
    const initialActivity = generateDemoActivity()
    if (initialActivity) {
      setActivities([initialActivity])
    }

    // Set up interval for new activities with progression simulation
    const interval = setInterval(() => {
      const newActivity = generateDemoActivity()
      if (newActivity) {
        setActivities((prev) => {
          // Simulate workflow progression by occasionally showing related activities
          const shouldShowProgression = Math.random() < 0.3 // 30% chance

          if (shouldShowProgression && prev.length > 0) {
            const lastActivity = prev[0]
            let progressionActivity = null

            // Create progression based on last activity
            switch (lastActivity.type) {
              case 'assessment_assigned': {
                progressionActivity = {
                  type: 'assessment_in_progress',
                  message: 'Student started working on assessment',
                  timestamp: new Date(),
                }
                break
              }
              case 'assessment_in_progress': {
                progressionActivity = {
                  type: 'assessment_submitted',
                  message: 'Assessment submitted for review',
                  timestamp: new Date(),
                }
                break
              }
              case 'assessment_submitted': {
                progressionActivity = {
                  type: 'generating_feedback',
                  message: 'AI analyzing assessment content',
                  timestamp: new Date(),
                }
                break
              }
              case 'generating_feedback': {
                progressionActivity = {
                  type: 'feedback_generated',
                  message: 'AI feedback generated successfully',
                  timestamp: new Date(),
                }
                break
              }
              case 'feedback_generated': {
                progressionActivity = {
                  type: 'ready_for_review',
                  message: 'Assessment ready for teacher review',
                  timestamp: new Date(),
                }
                break
              }
              case 'ready_for_review': {
                progressionActivity = {
                  type: 'review_in_progress',
                  message: 'Teacher reviewing assessment',
                  timestamp: new Date(),
                }
                break
              }
              case 'review_in_progress': {
                progressionActivity = {
                  type: 'review_completed',
                  message: 'Teacher completed review',
                  timestamp: new Date(),
                }
                break
              }
            }

            if (progressionActivity) {
              return [progressionActivity, ...prev.slice(0, 4)]
            }
          }

          return [newActivity, ...prev.slice(0, 4)] // Keep last 5 activities
        })
      }
    }, demoConfig.demoActivityInterval)

    return () => clearInterval(interval)
  }, [demoConfig.simulateActivity, demoConfig.demoActivityInterval])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'assessment_assigned': {
        return <FileText className="size-4 text-blue-500" />
      }
      case 'assessment_in_progress': {
        return <Activity className="size-4 text-yellow-500" />
      }
      case 'assessment_submitted': {
        return <FileText className="size-4 text-green-500" />
      }
      case 'generating_feedback': {
        return <MessageSquare className="size-4 text-orange-500" />
      }
      case 'feedback_generated': {
        return <MessageSquare className="size-4 text-green-500" />
      }
      case 'ready_for_review': {
        return <Users className="size-4 text-blue-500" />
      }
      case 'review_in_progress': {
        return <Users className="size-4 text-yellow-500" />
      }
      case 'review_completed': {
        return <Users className="size-4 text-purple-500" />
      }
      case 'data_exported': {
        return <Download className="size-4 text-orange-500" />
      }
      case 'report_generated': {
        return <BarChart3 className="size-4 text-indigo-500" />
      }
      default: {
        return <Activity className="size-4 text-gray-500" />
      }
    }
  }

  const getActivityBadge = (type: string) => {
    switch (type) {
      case 'assessment_assigned': {
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800">
            Assigned
          </Badge>
        )
      }
      case 'assessment_in_progress': {
        return (
          <Badge variant="default" className="bg-yellow-100 text-yellow-800">
            In Progress
          </Badge>
        )
      }
      case 'assessment_submitted': {
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Submitted
          </Badge>
        )
      }
      case 'generating_feedback': {
        return (
          <Badge variant="default" className="bg-orange-100 text-orange-800">
            Generating Feedback
          </Badge>
        )
      }
      case 'feedback_generated': {
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Feedback Ready
          </Badge>
        )
      }
      case 'ready_for_review': {
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800">
            Ready for Review
          </Badge>
        )
      }
      case 'review_in_progress': {
        return (
          <Badge variant="default" className="bg-yellow-100 text-yellow-800">
            Reviewing
          </Badge>
        )
      }
      case 'review_completed': {
        return (
          <Badge variant="default" className="bg-purple-100 text-purple-800">
            Reviewed
          </Badge>
        )
      }
      case 'data_exported': {
        return (
          <Badge variant="default" className="bg-orange-100 text-orange-800">
            Exported
          </Badge>
        )
      }
      case 'report_generated': {
        return (
          <Badge variant="default" className="bg-indigo-100 text-indigo-800">
            Report
          </Badge>
        )
      }
      default: {
        return <Badge variant="outline">Activity</Badge>
      }
    }
  }

  if (!demoConfig.simulateActivity || activities.length === 0) {
    return null
  }

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="size-5 text-blue-600" />
          Live Demo Activity
          <Badge variant="outline" className="text-xs">
            Simulated
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="mb-3 text-sm text-blue-800">
          Simulating assessment workflow progression: Assigned → In Progress → Submitted →
          Generating Feedback → Ready for Review → Reviewed
        </div>
        <div className="space-y-2">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-center gap-3 rounded-lg bg-white/50 p-2">
              {getActivityIcon(activity.type)}
              <div className="flex-1">
                <div className="text-sm font-medium">{activity.message}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  <SmartDate date={activity.timestamp} includeTime />
                </div>
              </div>
              {getActivityBadge(activity.type)}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
