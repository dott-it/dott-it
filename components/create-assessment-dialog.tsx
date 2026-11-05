"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, FileText, Target, Users, Plus, Loader2 } from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Progress } from '@/components/ui/progress'
// import { toast } from '@/hooks/use-toast' // Temporarily disabled

interface AssessmentFormData {
    title: string
    type: string
    dueDate: string
    description: string
    subject: string
    grade: string
    studentInstructions: string
    assessmentCriteria: string
}

interface CreateAssessmentDialogProps {
    children: React.ReactNode
    onAssessmentCreated?: (assessment: AssessmentFormData) => void
}

export function CreateAssessmentDialog({ children, onAssessmentCreated }: CreateAssessmentDialogProps) {
    const [open, setOpen] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [progress, setProgress] = useState(0)
    const [currentStep, setCurrentStep] = useState('')
    const [formData, setFormData] = useState<AssessmentFormData>({
        title: '',
        type: '',
        dueDate: '',
        description: '',
        subject: '',
        grade: '',
        studentInstructions: '',
        assessmentCriteria: ''
    })
    const searchParams = useSearchParams()
    const router = useRouter()

    // Pre-fill form based on URL parameters
    useEffect(() => {
        const lesson = searchParams.get('lesson')
        const unit = searchParams.get('unit')

        if (lesson && unit) {
            setFormData(prev => ({
                ...prev,
                title: `Unit ${unit} Lesson ${lesson} Assessment`,
                description: `Assessment for Unit ${unit}, Lesson ${lesson}`,
                subject: 'Science',
                grade: unit.startsWith('8') ? 'Grade 8' : 'Grade 6'
            }))
        }
    }, [searchParams])

    const handleInputChange = (field: keyof AssessmentFormData, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.title || !formData.type || !formData.subject || !formData.grade) {
            // toast({
            //     title: "Missing Information",
            //     description: "Please fill in all required fields.",
            //     variant: "destructive",
            // })
            return
        }

        setIsCreating(true)
        setProgress(0)
        setCurrentStep('Creating assessment...')

        try {
            // Simulate progress updates
            const progressInterval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval)
                        return prev
                    }
                    return prev + Math.random() * 10
                })
            }, 200)

            const response = await fetch('/api/assessments/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            })

            clearInterval(progressInterval)
            setProgress(100)
            setCurrentStep('Assessment created successfully!')

            if (!response.ok) {
                throw new Error('Failed to create assessment')
            }

            const result = await response.json()

            const _submittedCount = result.assessment.records.filter((r: { status: string }) => r.status === 'submitted').length
            // toast({
            //     title: "Assessment Created!",
            //     description: `Successfully created "${formData.title}" with ${result.assessment.totalRecords} student records (${submittedCount} submitted).`,
            // })

            if (onAssessmentCreated) {
                onAssessmentCreated(formData)
            }

            // Wait a moment to show completion
            await new Promise(resolve => setTimeout(resolve, 1000))

            setOpen(false)
            // Reset form
            setFormData({
                title: '',
                type: '',
                dueDate: '',
                description: '',
                subject: '',
                grade: '',
                studentInstructions: '',
                assessmentCriteria: ''
            })

            // Navigate to the new assessment
            router.push(`/workspace/assessments/${result.assessment.id}`)

        } catch {
            // toast({
            //     title: "Error",
            //     description: "Failed to create assessment. Please try again.",
            //     variant: "destructive",
            // })
        } finally {
            setIsCreating(false)
            setProgress(0)
            setCurrentStep('')
        }
    }

    const assessmentTypes = [
        { value: 'pre-assessment', label: 'Pre-assessment', description: 'Baseline assessment before instruction' },
        { value: 'formative', label: 'Formative Assessment', description: 'Ongoing assessment during instruction' },
        { value: 'summative', label: 'Summative Assessment', description: 'End-of-unit assessment' },
        { value: 'exit-ticket', label: 'Exit Ticket', description: 'Quick check for understanding' }
    ]

    const subjects = [
        { value: 'science', label: 'Science' },
        { value: 'math', label: 'Mathematics' },
        { value: 'english', label: 'English Language Arts' },
        { value: 'social-studies', label: 'Social Studies' }
    ]

    const grades = [
        { value: 'grade-6', label: 'Grade 6' },
        { value: 'grade-7', label: 'Grade 7' },
        { value: 'grade-8', label: 'Grade 8' },
        { value: 'high-school', label: 'High School' }
    ]

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Plus className="size-4" />
                        Create New Assessment
                    </DialogTitle>
                    <DialogDescription>
                        Create a new assessment for your students. Fill in the details below.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="size-4" />
                                Basic Information
                            </CardTitle>
                            <CardDescription>
                                Essential details about your assessment
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Assessment Title *</Label>
                                    <Input
                                        id="title"
                                        value={formData.title}
                                        onChange={(e) => handleInputChange('title', e.target.value)}
                                        placeholder="Enter assessment title"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="type">Assessment Type *</Label>
                                    <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                                        <SelectTrigger id="type" aria-required="true">
                                            <SelectValue placeholder="Select assessment type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {assessmentTypes.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{type.label}</span>
                                                        <span className="text-xs text-muted-foreground">{type.description}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="dueDate">Due Date</Label>
                                    <Input
                                        id="dueDate"
                                        type="date"
                                        value={formData.dueDate}
                                        onChange={(e) => handleInputChange('dueDate', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="subject">Subject *</Label>
                                    <Select value={formData.subject} onValueChange={(value) => handleInputChange('subject', value)}>
                                        <SelectTrigger id="subject" aria-required="true">
                                            <SelectValue placeholder="Select subject" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {subjects.map((subject) => (
                                                <SelectItem key={subject.value} value={subject.value}>
                                                    {subject.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    placeholder="Describe the assessment and its objectives"
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Grade Level */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="size-4" />
                                Grade Level
                            </CardTitle>
                            <CardDescription>
                                Select the appropriate grade level for this assessment
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Label htmlFor="grade">Grade Level *</Label>
                                <Select value={formData.grade} onValueChange={(value) => handleInputChange('grade', value)}>
                                    <SelectTrigger id="grade" aria-required="true">
                                        <SelectValue placeholder="Select grade level" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {grades.map((grade) => (
                                            <SelectItem key={grade.value} value={grade.value}>
                                                {grade.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Student Instructions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="size-4" />
                                Student Instructions
                            </CardTitle>
                            <CardDescription>
                                Instructions that will be shown to students
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Label htmlFor="studentInstructions">Instructions</Label>
                                <Textarea
                                    id="studentInstructions"
                                    value={formData.studentInstructions}
                                    onChange={(e) => handleInputChange('studentInstructions', e.target.value)}
                                    placeholder="Provide clear instructions for students..."
                                    rows={4}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Assessment Criteria */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Target className="size-4" />
                                Assessment Criteria
                            </CardTitle>
                            <CardDescription>
                                Define the criteria and rubrics for evaluation
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Label htmlFor="assessmentCriteria">Criteria & Rubrics</Label>
                                <Textarea
                                    id="assessmentCriteria"
                                    value={formData.assessmentCriteria}
                                    onChange={(e) => handleInputChange('assessmentCriteria', e.target.value)}
                                    placeholder="Define assessment criteria, rubrics, and evaluation standards..."
                                    rows={4}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <DialogFooter>
                        {isCreating ? (
                            <div className="w-full space-y-4">
                                <div
                                    className="flex items-center gap-2"
                                    role="status"
                                    aria-live="polite"
                                >
                                    <Loader2 className="size-4 animate-spin" aria-hidden />
                                    <span className="text-sm">{currentStep}</span>
                                </div>
                                <Progress value={progress} className="w-full" />
                                <div className="text-xs text-muted-foreground">
                                    Creating assessment and generating student records...
                                </div>
                            </div>
                        ) : (
                            <>
                                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isCreating}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isCreating}>
                                    {isCreating ? (
                                        <>
                                            <Loader2 className="mr-2 size-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        'Create Assessment'
                                    )}
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
