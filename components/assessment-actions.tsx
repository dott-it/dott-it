"use client"

import { CreateAssessmentDialog } from "@/components/create-assessment-dialog"

interface AssessmentActionsProps {
    unitId: string
}

function handleAssessmentCreated(_assessment: unknown) {
    // In a real app, you would refresh the page or update the UI
    globalThis.location.reload()
}

export function AssessmentActions({ unitId: _unitId }: AssessmentActionsProps) {
    return (
        <CreateAssessmentDialog
            onAssessmentCreated={handleAssessmentCreated}
        >
            <button>Create Assessment</button>
        </CreateAssessmentDialog>
    )
} 