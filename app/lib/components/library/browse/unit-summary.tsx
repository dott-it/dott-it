'use client'

import { useEffect, useState } from 'react'
import type { UnitBrowseModel } from '@/lib/library/browse'
import type { UnitExportSummary } from '@/lib/library/export/types'
import { Button } from '@/components/ui/button'
import { ExportUnitDialog } from './export-unit-dialog'

interface UnitSummaryProps {
  unit: UnitBrowseModel
  exportSummary: UnitExportSummary
}

export function UnitSummary({ unit, exportSummary }: UnitSummaryProps) {
  const [exportOpen, setExportOpen] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(globalThis.location.search)
    if (params.get('googleExport') === 'ready') {
      setExportOpen(true)
    }
  }, [])

  return (
    <>
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          Unit {unit.unitCode} · {unit.subject} · Grade {unit.grade}
        </p>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Unit {unit.unitCode}: {unit.title}
            </h1>
            {unit.description ? (
              <p className="text-base text-muted-foreground">{unit.description}</p>
            ) : (
              <p className="text-base text-muted-foreground">
                <span className="font-medium text-foreground">Driving question: </span>
                {unit.drivingQuestion}
              </p>
            )}
          </div>
          <Button
            type="button"
            disabled={!exportSummary.ready}
            className="shrink-0 rounded-full bg-[#E67E51] px-5 text-white hover:bg-[#E67E51]/90 disabled:opacity-50"
            onClick={() => setExportOpen(true)}
          >
            Export unit
          </Button>
        </div>
      </div>

      <ExportUnitDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        unitCode={unit.unitCode}
        unitTitle={unit.title}
        exportSummary={exportSummary}
      />
    </>
  )
}
