import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  getActiveTimelineLegend,
  getCategorySwatchClass,
  getOpportunityMarkerClass,
  getTimelineMarkerClass,
  loadUnitBrowseData,
} from '../lib/library/browse/index.ts'

test('should use OpenSciEd palette for pre-assessment markers', () => {
  assert.match(getCategorySwatchClass('Pre'), /ose-accent/)
  assert.match(getTimelineMarkerClass('Pre', 'assessment'), /border-ose-accent/)
})

test('should use dark green for summative markers', () => {
  assert.match(getCategorySwatchClass('Summative'), /ose-green/)
})

test('should use navy square for peer assessment markers', () => {
  assert.match(getCategorySwatchClass('Peer'), /ose-navy/)
  assert.match(getCategorySwatchClass('Peer'), /rounded-\[2px\]/)
})

test('should use violet for TE opportunity table markers', () => {
  assert.match(getOpportunityMarkerClass(), /ose-violet/)
})

test('should encode opportunity categories on the timeline for Unit 8.1', () => {
  const unit = loadUnitBrowseData('8.1', 8)
  assert.ok(unit)

  const lesson15 = unit.timeline.find((segment) => segment.lessonNumber === 15)
  assert.ok(lesson15)
  assert.ok(
    lesson15.markers.some(
      (marker) => marker.kind === 'opportunity' && marker.category === 'Summative',
    ),
  )
  assert.match(getTimelineMarkerClass('Summative', 'opportunity'), /ose-violet/)
})

test('should show active category legend entries for Unit 8.1', () => {
  const unit = loadUnitBrowseData('8.1', 8)
  assert.ok(unit)

  const legend = getActiveTimelineLegend(unit.timeline)
  const labels = legend.map((entry) => entry.label)

  assert.ok(labels.includes('Assessment opportunity'))
  assert.ok(labels.includes('Pre-assessment'))
  assert.ok(labels.includes('Formative assessment'))
  assert.ok(labels.includes('Summative assessment'))
  assert.ok(labels.includes('Peer assessment'))
})
