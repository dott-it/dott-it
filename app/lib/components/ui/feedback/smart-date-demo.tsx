import React from 'react'
import { SmartDate, SmartDateBadge } from './smart-date'
import { Card, CardContent, CardHeader, CardTitle } from '../layout/card'

/**
 * Demo component showing SmartDate usage examples
 */
export function SmartDateDemo() {
  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  // Create dates for current week
  const currentWeekDates = []
  for (let i = -6; i <= 6; i++) {
    const date = new Date(now.getTime() + i * 24 * 60 * 60 * 1000)
    let label = `Day ${i > 0 ? '+' : ''}${i}`
    switch (i) {
      case 0: {
        label = 'Today'
        break
      }
      case -1: {
        label = 'Yesterday'
        break
      }
      case 1: {
        label = 'Tomorrow'
        break
      }
      default: {
        // label already set above
        break
      }
    }

    currentWeekDates.push({
      date,
      label,
    })
  }

  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const oldDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>SmartDate Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="font-medium">Relative Format (Default)</h3>
              <div className="space-y-1 text-sm">
                <div>
                  Today: <SmartDate date={now} />
                </div>
                <div>
                  Yesterday: <SmartDate date={yesterday} />
                </div>
                <div>
                  Tomorrow: <SmartDate date={tomorrow} />
                </div>
                <div>
                  Last week: <SmartDate date={lastWeek} />
                </div>
                <div>
                  Next week: <SmartDate date={nextWeek} />
                </div>
                <div>
                  Old date: <SmartDate date={oldDate} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Current Week Examples</h3>
              <div className="space-y-1 text-sm">
                {currentWeekDates.map(({ date, label }) => (
                  <div key={label}>
                    {label}: <SmartDate date={date} />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">With Time</h3>
              <div className="space-y-1 text-sm">
                <div>
                  Today: <SmartDate date={now} includeTime />
                </div>
                <div>
                  Yesterday: <SmartDate date={yesterday} includeTime />
                </div>
                <div>
                  Tomorrow: <SmartDate date={tomorrow} includeTime />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Weekday Format</h3>
              <div className="space-y-1 text-sm">
                <div>
                  Today: <SmartDate date={now} variant="weekday" />
                </div>
                <div>
                  Yesterday: <SmartDate date={yesterday} variant="weekday" />
                </div>
                <div>
                  Tomorrow: <SmartDate date={tomorrow} variant="weekday" />
                </div>
                <div>
                  Last week: <SmartDate date={lastWeek} variant="weekday" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Full Format</h3>
              <div className="space-y-1 text-sm">
                <div>
                  Today: <SmartDate date={now} variant="full" />
                </div>
                <div>
                  Yesterday: <SmartDate date={yesterday} variant="full" />
                </div>
                <div>
                  Old date: <SmartDate date={oldDate} variant="full" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SmartDateBadge Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium">Badge Variants</h3>
            <div className="flex flex-wrap gap-2">
              <SmartDateBadge date={now} variant="default" />
              <SmartDateBadge date={yesterday} variant="secondary" />
              <SmartDateBadge date={tomorrow} variant="outline" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Badge Sizes</h3>
            <div className="flex flex-wrap items-center gap-2">
              <SmartDateBadge date={now} size="sm" />
              <SmartDateBadge date={now} size="md" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Current Week Badges</h3>
            <div className="flex flex-wrap gap-2">
              {currentWeekDates.slice(0, 7).map(({ date, label }) => (
                <SmartDateBadge key={label} date={date} variant="outline" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
