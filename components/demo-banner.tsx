'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Info } from 'lucide-react'
import { getDemoModeConfig, getDemoModeMessage } from '@/lib/demo-mode'

export function DemoBanner() {
    const config = getDemoModeConfig()
    const message = getDemoModeMessage()

    if (!config.isEnabled || !config.showDemoBanner) {
        return null
    }

    return (
        <Alert className="border-blue-200 bg-blue-50/30">
            <Info className="size-4 text-blue-600" />
            <AlertDescription className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                    DEMO MODE
                </Badge>
                <span className="text-sm text-blue-800">
                    {message}
                </span>
            </AlertDescription>
        </Alert>
    )
}

export function DemoModeIndicator() {
    const config = getDemoModeConfig()

    if (!config.isEnabled) {
        return null
    }

    return (
        <Badge variant="outline" className="text-xs">
            DEMO
        </Badge>
    )
} 