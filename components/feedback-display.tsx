"use client"

import { useState } from "react"
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Share,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
// import { toast } from "@/hooks/use-toast" // Temporarily disabled

interface Feedback {
  type: string
  section: string
  content: string
}

interface FeedbackDisplayProps {
  feedback: Feedback[]
  onGenerateFeedback?: () => void
  isGenerating?: boolean
}

export function FeedbackDisplay({ feedback }: FeedbackDisplayProps) {
  const [selected, setSelected] = useState<number[]>([])

  const toggleSelect = (index: number) => {
    setSelected((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    )
  }

  const handleGenerate = () => {
    // toast({
    //   title: "Feedback Queued",
    //   description: `${selected.length} item(s) queued for student.`,
    // })
    setSelected([])
  }
  if (feedback.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MessageCircle className="size-12 text-muted-foreground opacity-50" />
            <h3 className="mt-4 text-lg font-medium">No Feedback Generated Yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              ✨ Generated feedback for this record is not yet available.
            </p>
            <Button className="mt-4">Generate Feedback Now</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="bg-muted/20 pb-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">✨ Generated Feedback</h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              Copy All
            </Button>
            <Button variant="outline" size="sm">
              Edit
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {[...feedback]
            .sort((a, b) => {
              if (a.type === b.type) return 0
              return a.type === "strength" ? -1 : 1
            })
            .map((item, index) => (
              <FeedbackItem
                key={index}
                item={item}
                selected={selected.includes(index)}
                toggleSelect={() => toggleSelect(index)}
              />
            ))}
        </div>
      </CardContent>
      <CardFooter className="justify-end">
        <Button
          onClick={handleGenerate}
          disabled={selected.length === 0}
        >
          <Share className="mr-2 size-4" />
          Generate for Student
        </Button>
      </CardFooter>
    </Card>
  )
}

function FeedbackItem({
  item,
  selected,
  toggleSelect,
}: {
  item: Feedback
  selected: boolean
  toggleSelect: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [feedbackRating, setFeedbackRating] = useState<"positive" | "negative" | null>(null)

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={selected}
              onCheckedChange={toggleSelect}
              className="mt-0.5"
            />
            <div
              className={`rounded-full p-2 ${item.type === "strength" ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"}`}
            >
              {item.type === "strength" ? <CheckCircle2 className="size-5" /> : <MessageCircle className="size-5" />}
            </div>
            <div>
              <h4 className="font-medium">{item.type === "strength" ? "Strength" : "Area for Improvement"}</h4>
              <p className="mt-1 text-sm text-muted-foreground">{item.section}</p>
            </div>
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={expanded ? 'Collapse feedback' : 'Expand feedback'}>
              {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent>
          <div className="mt-4 rounded-lg bg-muted/30 p-4">
            <p className="whitespace-pre-wrap">{item.content}</p>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className={`size-8 ${feedbackRating === "positive" ? "bg-muted text-primary" : ""}`}
                onClick={() => setFeedbackRating("positive")}
                aria-label="Rate feedback positively"
                aria-pressed={feedbackRating === "positive"}
              >
                <ThumbsUp className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`size-8 ${feedbackRating === "negative" ? "bg-muted text-primary" : ""}`}
                onClick={() => setFeedbackRating("negative")}
                aria-label="Rate feedback negatively"
                aria-pressed={feedbackRating === "negative"}
              >
                <ThumbsDown className="size-4" />
              </Button>
              <span className="text-xs text-muted-foreground">Rate AI feedback</span>
            </div>
            <Button variant="outline" size="sm">
              Apply Feedback
            </Button>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
