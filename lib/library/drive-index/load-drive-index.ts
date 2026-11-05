import fs from 'node:fs'
import path from 'node:path'
import type { UnitDriveIndex } from './types'

export function driveIndexPath(unitCode: string): string {
  return path.join(process.cwd(), 'data/ingested/drive-index', `unit-${unitCode}.json`)
}

export function loadDriveIndex(unitCode: string): UnitDriveIndex | null {
  const filePath = driveIndexPath(unitCode)
  if (!fs.existsSync(filePath)) {
    return null
  }

  const raw = fs.readFileSync(filePath, 'utf8')
  return JSON.parse(raw) as UnitDriveIndex
}

export function hasDriveIndex(unitCode: string): boolean {
  return fs.existsSync(driveIndexPath(unitCode))
}
