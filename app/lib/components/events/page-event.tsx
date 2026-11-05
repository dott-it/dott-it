'use client'

import React, { useEffect, useCallback, useState } from 'react'
import { usePathname } from 'next/navigation'
import { eventsQueries } from '@/app/lib/services/events/events.queries'

/**
 * Page Event Types
 */
export interface PageEventPayload {
  pageName?: string
  pageUrl?: string
  timestamp?: string
  referrer?: string
  userAgent?: string
  [key: string]: unknown
}

export interface ClickEventPayload extends PageEventPayload {
  elementId?: string
  elementClass?: string
  elementText?: string
  elementTag?: string
  clickX?: number
  clickY?: number
}

export interface PageEventTrackerProps {
  /**
   * Name of the page for tracking (optional - auto-detected from route if not provided)
   */
  pageName?: string

  /**
   * Whether to track page view on mount
   * @default true
   */
  trackPageView?: boolean

  /**
   * Whether to track clicks on the page
   * @default true
   */
  trackClicks?: boolean

  /**
   * CSS selector to limit click tracking to specific elements
   * @example "[data-track-click]" or ".trackable"
   */
  clickSelector?: string

  /**
   * Additional payload to include with all events
   */
  additionalPayload?: Record<string, unknown>

  /**
   * Callback when page view event is tracked
   */
  onPageView?: (eventId: string) => void

  /**
   * Callback when click event is tracked
   */
  onClick?: (eventId: string, payload: ClickEventPayload) => void

  /**
   * Children to render
   */
  children?: React.ReactNode
}

/**
 * PageEventTracker Component
 *
 * Tracks page views and user clicks on a page.
 * Automatically detects the page name from the current route.
 *
 * @example
 * ```tsx
 * <PageEventTracker>
 *   <div>Your page content</div>
 * </PageEventTracker>
 * ```
 *
 * @example With custom page name
 * ```tsx
 * <PageEventTracker pageName="Custom Page Name">
 *   <div>Your page content</div>
 * </PageEventTracker>
 * ```
 *
 * @example With click tracking on specific elements
 * ```tsx
 * <PageEventTracker clickSelector="[data-track-click]">
 *   <button data-track-click>Track this click</button>
 *   <button>Don't track this</button>
 * </PageEventTracker>
 * ```
 */
export function PageEventTracker({
  pageName: customPageName,
  trackPageView = true,
  trackClicks = true,
  clickSelector,
  additionalPayload = {},
  onPageView,
  onClick,
  children,
}: PageEventTrackerProps) {
  const pathname = usePathname()
  const createEventMutation = eventsQueries.createEvent.useMutation()
  const [alreadyTracked, setAlreadyTracked] = useState<boolean>(false)

  /**
   * Auto-detect page name from pathname
   */
  const getPageName = useCallback(() => {
    if (customPageName) {
      return customPageName
    }

    // Convert pathname to readable page name
    // e.g., /workspace/assessments/123 -> Workspace Assessments Detail
    const segments = pathname.split('/').filter(Boolean)

    if (segments.length === 0) {
      return 'Home'
    }

    // Capitalize and join segments
    const pageName = segments
      .map((segment) => {
        // Skip IDs (numeric or UUID-like strings)
        const isId = /^[0-9a-f-]{8,}$/i.test(segment) || /^\d+$/.test(segment)
        if (isId) {
          return 'Detail'
        }
        // Capitalize first letter of each word
        return segment
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      })
      .join(' ')

    return pageName
  }, [pathname, customPageName])

  const pageName = getPageName()

  /**
   * Create base payload with common page information
   */
  const createBasePayload = useCallback((): PageEventPayload => {
    return {
      pageName,
      pageUrl: globalThis.window ? globalThis.window.location.href : '',
      timestamp: new Date().toISOString(),
      referrer: globalThis.window ? globalThis.document.referrer : '',
      userAgent: globalThis.window ? globalThis.navigator.userAgent : '',
      ...additionalPayload,
    }
  }, [pageName, additionalPayload])

  /**
   * Track page view event - only once per pathname
   */
  useEffect(() => {
    // Skip if tracking is disabled
    if (trackPageView === false) {
      return
    }

    // Skip if we've already tracked this pathname
    if (alreadyTracked) {
      return
    }

    const trackView = async () => {
      if (alreadyTracked) {
        return
      }
      else{
        setAlreadyTracked(true)
      }
      try {
        const payload = createBasePayload()
        const result = await createEventMutation.mutateAsync({
          name: 'page_view',
          payload,
        })

        // Mark this pathname as tracked
        setAlreadyTracked(true)
        onPageView?.(result.id)
      } catch (error) {
        // Silently fail - don't break the app if tracking fails
        // Only log in development mode
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.error('Failed to track page view:', error)
        }
      }
    }

    trackView()
  }, [pathname, trackPageView, createBasePayload, createEventMutation, onPageView, alreadyTracked])

  /**
   * Track click event
   */
  const trackClickEvent = useCallback(
    async (event: MouseEvent) => {
      if (trackClicks === false) {
        return
      }

      const target = event.target as HTMLElement

      // If clickSelector is provided, check if the target matches
      if (clickSelector && !target.matches(clickSelector)) {
        // Check if any parent matches the selector
        const matchingParent = target.closest(clickSelector)
        if (!matchingParent) return
      }

      try {
        const payload: ClickEventPayload = {
          ...createBasePayload(),
          elementId: target.id || undefined,
          elementClass: target.className || undefined,
          elementText: target.textContent?.trim().slice(0, 100) || undefined,
          elementTag: target.tagName.toLowerCase(),
          clickX: event.clientX,
          clickY: event.clientY,
        }

        const result = await createEventMutation.mutateAsync({
          name: 'page_click',
          payload,
        })

        onClick?.(result.id, payload)
      } catch (error) {
        // Silently fail - don't break the app if tracking fails
        // Only log in development mode
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.error('Failed to track click event:', error)
        }
      }
    },
    [trackClicks, clickSelector, createBasePayload, createEventMutation, onClick],
  )

  /**
   * Set up click tracking
   */
  useEffect(() => {
    if (trackClicks === false) {
      return
    }

    document.addEventListener('click', trackClickEvent)

    return () => {
      document.removeEventListener('click', trackClickEvent)
    }
  }, [trackClicks, trackClickEvent])

  return <>{children}</>
}
