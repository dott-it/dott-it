"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, QrCode, Copy, ClipboardList, UserCheck, UsersIcon } from "lucide-react"
// import { toast } from "@/hooks/use-toast" // Temporarily disabled
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
  // toast({
  //   title: "Copied to clipboard",
  //   description: "The session link has been copied to your clipboard.",
  // })
}

interface AvailableAssessment {
  id: string
  title: string
  unitName: string
  subject: string
  grade: number | null
  gradeName?: string | null
  type: string
  description: string
  pointValue: number
  estimatedDuration: string
  standards: string[]
  tags: string[]
  link: string
}

interface AssignmentDialogProps {
  assessment: AvailableAssessment | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AssignmentDialog({ assessment, open, onOpenChange }: AssignmentDialogProps) {
  const [assignmentType, setAssignmentType] = useState<"individual" | "group" | "class">("class")
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [dueDate, setDueDate] = useState<Date>()
  const [instructions, setInstructions] = useState("")
  const [sessionLink, setSessionLink] = useState("")
  // Removed unused showQRCode

  // Mock data for students, groups, and classes
  const mockStudents = [
    { id: "s1", name: "Sophia Johnson" },
    { id: "s2", name: "Ethan Williams" },
    { id: "s3", name: "Olivia Martinez" },
    { id: "s4", name: "Noah Thompson" },
    { id: "s5", name: "Emma Davis" },
    { id: "s6", name: "Liam Rodriguez" },
  ]

  const mockGroups = [
    { id: "g1", name: "Team Alpha", members: 4 },
    { id: "g2", name: "Team Beta", members: 5 },
    { id: "g3", name: "Team Gamma", members: 3 },
  ]

  const mockClasses = [
    { id: "c1", name: "6th Grade - Section A", students: 25 },
    { id: "c2", name: "6th Grade - Section B", students: 23 },
    { id: "c3", name: "7th Grade - Section A", students: 28 },
  ]

  function generateSessionLink() {
    const linkId = Math.random().toString(36).slice(2, 15)
    const submissionDomain = process.env.NEXT_PUBLIC_SUBMISSION_DOMAIN || 'opensci.ed'
    const link = `https://${submissionDomain}/submit/${linkId}`
    setSessionLink(link)
    return link
  }

  function handleAssign() {
    if (!assessment || !dueDate) {
      // toast({
      //   title: "Missing Information",
      //   description: "Please select a due date and ensure all required fields are filled.",
      //   variant: "destructive",
      // })
      return
    }

    generateSessionLink()

    // Here you would typically save the assignment to your backend
    // toast({
    //   title: "Assessment Activity Created",
    //   description: `${assessment.title} has been scheduled with a session link generated.`,
    // })

    // Removed setShowQRCode (unused)
  }

  if (!assessment) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="size-5" />
            Create Assessment Activity
          </DialogTitle>
          <DialogDescription>Configure activity settings for &quot;{assessment.title}&quot;</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Assessment Summary */}
          <div className="rounded-lg border bg-muted/20 p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{assessment.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {assessment.unitName} • {assessment.gradeName ?? `Grade ${assessment.grade ?? ""}`} • {assessment.pointValue} points
                </p>
              </div>
              <Badge>Assessment</Badge>
            </div>
            <p className="mt-2 text-sm">{assessment.description}</p>
          </div>

          <Tabs defaultValue="assignment" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="assignment">Activity Details</TabsTrigger>
              <TabsTrigger value="distribution" disabled={!sessionLink}>
                Distribution & QR Code
              </TabsTrigger>
            </TabsList>

            <TabsContent value="assignment" className="space-y-6">
              {/* Activity Type */}
              <div className="space-y-3">
                <Label className="text-base">Activity Type</Label>
                <RadioGroup value={assignmentType} onValueChange={(value: string) => setAssignmentType(value as "individual" | "group" | "class")}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="individual" id="individual" />
                    <Label htmlFor="individual" className="flex items-center gap-2">
                      <UserCheck className="size-4" />
                      Individual Students
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="group" id="group" />
                    <Label htmlFor="group" className="flex items-center gap-2">
                      <Users className="size-4" />
                      Student Groups
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="class" id="class" />
                    <Label htmlFor="class" className="flex items-center gap-2">
                      <UsersIcon className="size-4" />
                      Entire Class
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Target Selection */}
              <div className="space-y-3">
                <Label
                  id="assignment-target-label"
                  className="text-base"
                  htmlFor={assignmentType === "class" ? "assignment-class-select" : undefined}
                >
                  {assignmentType === "individual"
                    ? "Select Students"
                    : (assignmentType === "group"
                      ? "Select Groups"
                      : "Select Class")}
                </Label>

                {assignmentType === "individual" && (
                  <div className="grid max-h-40 grid-cols-2 gap-2 overflow-y-auto rounded-md border p-3">
                    {mockStudents.map((student) => (
                      <label key={student.id} className="flex cursor-pointer items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudents([...selectedStudents, student.id])
                            } else {
                              setSelectedStudents(selectedStudents.filter((id) => id !== student.id))
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{student.name}</span>
                      </label>
                    ))}
                  </div>
                )}

                {assignmentType === "group" && (
                  <div className="space-y-2">
                    {mockGroups.map((group) => (
                      <label
                        key={group.id}
                        className="flex cursor-pointer items-center justify-between rounded border p-2 hover:bg-muted/50"
                      >
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedGroups.includes(group.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedGroups([...selectedGroups, group.id])
                              } else {
                                setSelectedGroups(selectedGroups.filter((id) => id !== group.id))
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm font-medium">{group.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{group.members} members</span>
                      </label>
                    ))}
                  </div>
                )}

                {assignmentType === "class" && (
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger id="assignment-class-select" aria-labelledby="assignment-target-label">
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockClasses.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name} ({cls.students} students)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Due Date */}
              <div className="space-y-3">
                <Label htmlFor="assignment-due-date" className="text-base">Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="assignment-due-date"
                      variant="outline"
                      className={cn("w-full text-left justify-start font-normal", !dueDate && "text-muted-foreground")}
                    >
                      <Calendar className="mr-2 size-4" />
                      {dueDate ? format(dueDate, "PPP") : "Select due date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Instructions */}
              <div className="space-y-3">
                <Label htmlFor="instructions" className="text-base">
                  Additional Instructions (Optional)
                </Label>
                <Textarea
                  id="instructions"
                  placeholder="Add any specific instructions for students..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </TabsContent>

            <TabsContent value="distribution" className="space-y-6">
              {sessionLink && (
                <>
                  <div className="space-y-3">
                    <Label htmlFor="assignment-session-link" className="text-base">Session Link</Label>
                    <div className="flex gap-2">
                      <Input id="assignment-session-link" value={sessionLink} readOnly className="font-mono text-sm" aria-label="Session link URL" />
                      <Button variant="outline" size="icon" onClick={() => copyToClipboard(sessionLink)} aria-label="Copy session link">
                        <Copy className="size-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base">QR Code for Easy Access</Label>
                    <div className="flex justify-center rounded-lg border bg-white p-6">
                      <div className="flex size-48 items-center justify-center rounded bg-muted">
                        <div className="text-center">
                          <QrCode className="mx-auto mb-2 size-16 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">QR Code</p>
                          <p className="text-xs text-muted-foreground">Scan to access assessment</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <Button variant="outline" size="sm">
                        Download QR Code
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs >
        </div >

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={!dueDate}>
            {sessionLink ? "Update Activity" : "Create Activity"}
          </Button>
        </DialogFooter >
      </DialogContent >
    </Dialog >
  )
}
