"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "../ui/button"
import { DownloadCloud, Eye, FileText, Notebook } from "lucide-react"
import { AssessmentFormModal } from "../assessment-form-modal";
import { Assessment } from "@/lib/demo-data";
import React, { useState } from "react";


interface AssessmentActionsProps {
  assessment: Assessment;
}

function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + (str.codePointAt(i) ?? 0);
  }
  return Math.abs(hash);
}

export function AssessmentActions(props: AssessmentActionsProps): React.JSX.Element {
  const { assessment } = props;
  // Create a slug in the pattern xxxx-xxxx (letters only, lowercase, hyphen between first and second word)
  // Generate a non-obvious, short slug from the unit name using a hash and base36 encoding

  let slug = '';
  if (assessment.unitName) {
    // Hash the unit name, encode as base36, and format as xxxx-xxxx
    const hash = hashString(assessment.unitName);
    const base36 = hash.toString(36).padStart(8, '0').slice(0, 8);
    slug = base36.slice(0, 4) + '-' + base36.slice(4, 8);
  }

  const [formModalOpen, setFormModalOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button variant="outline" size="sm" className="w-full justify-start">
          <DownloadCloud className="mr-2 size-4" />
          Export Data
        </Button>
        <Button variant="outline" size="sm" className="w-full justify-start">
          <FileText className="mr-2 size-4" />
          Generate Report
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={() => setFormModalOpen(true)}
        >
          <Eye className="mr-2 size-4" />
          Assessment Handout Screen
        </Button>
        <AssessmentFormModal
          open={formModalOpen}
          onOpenChange={setFormModalOpen}
          title={assessment.title + " Form"}
          slug={slug}
        />
        <Button variant="outline" size="sm" className="w-full justify-start">
          <Notebook className="mr-2 size-4" />
          Customize Form
        </Button>
      </CardContent>
    </Card>)
}
