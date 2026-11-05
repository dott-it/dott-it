import { AlertCircle, Database, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ErrorCardProps {
    title?: string
    description?: string
    error?: Error | string
    type?: 'database' | 'network' | 'general'
    onRetry?: () => void
    showRetry?: boolean
    className?: string
}

export function ErrorCard({
    title = "Something went wrong",
    description = "An unexpected error occurred. Please try again.",
    error,
    type = 'general',
    onRetry,
    showRetry = true,
    className = ""
}: ErrorCardProps) {
    const getIcon = () => {
        switch (type) {
            case 'database': {
                return <Database className="size-4" />
            }
            case 'network': {
                return <AlertCircle className="size-4" />
            }
            default: {
                return <AlertCircle className="size-4" />
            }
        }
    }

    const getTypeDescription = () => {
        switch (type) {
            case 'database': {
                return "Database connection error"
            }
            case 'network': {
                return "Network connection error"
            }
            default: {
                return "General error"
            }
        }
    }

    const errorMessage = error instanceof Error ? error.message : error

    return (
        <Card className={`w-full ${className}`}>
            <CardHeader>
                <div className="flex items-center gap-2">
                    {getIcon()}
                    <CardTitle className="text-lg">{title}</CardTitle>
                </div>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {errorMessage && (
                    <Alert>
                        <AlertCircle className="size-4" />
                        <AlertDescription className="font-mono text-sm">
                            {errorMessage}
                        </AlertDescription>
                    </Alert>
                )}

                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        {getTypeDescription()}
                    </div>

                    {showRetry && onRetry && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onRetry}
                            className="flex items-center gap-2"
                        >
                            <RefreshCw className="size-3" />
                            Retry
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )
} 