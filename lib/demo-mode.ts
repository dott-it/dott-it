/**
 * Demo mode utility functions
 *
 * Demo mode can be enabled by setting the DEMO_MODE environment variable to 'true'
 * This affects various aspects of the application behavior
 */

export const isDemoMode = (): boolean => {
  return process.env.DEMO_MODE === 'true'
}

export const getDemoModeConfig = () => {
  return {
    isEnabled: isDemoMode(),
    showDemoBanner: isDemoMode(),
    useMockData: isDemoMode(),
    allowAnonymousAccess: isDemoMode(),
    demoAssessmentId:
      process.env.DEMO_ASSESSMENT_ID || '8-6-lesson-11-green-anole-lizard-explanation',
    demoTenantId: process.env.DEMO_TENANT_ID || 'demo',
    demoDomain: process.env.DEMO_DOMAIN || 'demo.eddolearning.com',
    showAllAssessments: isDemoMode(),
    simulateActivity: isDemoMode(),
    demoActivityInterval: Number.parseInt(process.env.DEMO_ACTIVITY_INTERVAL || '30000'), // 30 seconds
    demoMaxRecords: Number.parseInt(process.env.DEMO_MAX_RECORDS || '50'),
  }
}

export const getDemoModeMessage = (): string => {
  if (!isDemoMode()) return ''

  return (
    process.env.DEMO_MODE_MESSAGE || 'Demo mode: showing all assessments and simulating activity'
  )
}

export const getDemoModeFeatures = () => {
  return {
    // Features that are enabled in demo mode
    features: {
      anonymousView: isDemoMode(),
      mockData: isDemoMode(),
      demoAssessments: isDemoMode(),
      limitedFunctionality: isDemoMode(),
      sampleData: isDemoMode(),
      showAllAssessments: isDemoMode(),
      simulateActivity: isDemoMode(),
      liveUpdates: isDemoMode(),
    },

    // Limitations in demo mode
    limitations: {
      noDataPersistence: isDemoMode(),
      noRealAssessments: isDemoMode(),
      noRealStudents: isDemoMode(),
      noRealTeachers: isDemoMode(),
      readOnlyMode: process.env.DEMO_READ_ONLY === 'true',
    },
  }
}

// Demo simulation utilities
export const generateDemoActivity = () => {
  if (!isDemoMode()) return null

  const activities = [
    {
      type: 'assessment_assigned',
      message: 'Assessment assigned to Student A',
      timestamp: new Date(),
    },
    {
      type: 'assessment_in_progress',
      message: 'Student A started working on assessment',
      timestamp: new Date(),
    },
    {
      type: 'assessment_submitted',
      message: 'Assessment submitted by Student A',
      timestamp: new Date(),
    },
    {
      type: 'generating_feedback',
      message: 'AI generating feedback for assessment',
      timestamp: new Date(),
    },
    {
      type: 'feedback_generated',
      message: 'AI feedback generated successfully',
      timestamp: new Date(),
    },
    {
      type: 'ready_for_review',
      message: 'Assessment ready for teacher review',
      timestamp: new Date(),
    },
    { type: 'review_in_progress', message: 'Teacher reviewing assessment', timestamp: new Date() },
    {
      type: 'review_completed',
      message: 'Teacher completed review of assessment',
      timestamp: new Date(),
    },
    { type: 'data_exported', message: 'Assessment data exported', timestamp: new Date() },
    { type: 'report_generated', message: 'Analytics report generated', timestamp: new Date() },
  ]

  return activities[Math.floor(Math.random() * activities.length)]
}

export const getDemoAssessments = () => {
  if (!isDemoMode()) return []

  return [
    {
      id: '8-6-lesson-11-green-anole-lizard-explanation',
      title: '8.6 Lesson 11 Green Anole Lizard Explanation',
      subject: 'Science',
      grade: 8,
      status: 'live',
      pendingRecords: 15,
      totalRecords: 45,
    },
    {
      id: 'water-cycle-assessment',
      title: 'Water Cycle Assessment',
      subject: 'Earth Science',
      grade: 7,
      status: 'completed',
      pendingRecords: 0,
      totalRecords: 32,
    },
    {
      id: 'ecosystem-assessment',
      title: 'Ecosystem Interactions Assessment',
      subject: 'Biology',
      grade: 9,
      status: 'live',
      pendingRecords: 12,
      totalRecords: 28,
    },
    {
      id: 'chemistry-assessment',
      title: 'Chemical Reactions Assessment',
      subject: 'Chemistry',
      grade: 10,
      status: 'live',
      pendingRecords: 5,
      totalRecords: 18,
    },
    {
      id: 'physics-assessment',
      title: 'Motion and Forces Assessment',
      subject: 'Physics',
      grade: 11,
      status: 'live',
      pendingRecords: 3,
      totalRecords: 22,
    },
  ]
}
