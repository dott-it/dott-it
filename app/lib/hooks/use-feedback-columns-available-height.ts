'use client'

import { useEffect, type RefObject } from 'react'
import {
  computeFeedbackColumnsAvailableHeight,
  FEEDBACK_COLUMNS_AVAILABLE_HEIGHT_VAR,
} from '@/app/lib/assessment/feedback-columns-available-height'

/**
 * Keeps `--feedback-columns-available-height` in sync with the sticky header
 * (expanded/collapsed details, scroll, resize) so column max-height tracks the viewport.
 */
export function useFeedbackColumnsAvailableHeight(
  stickyHeaderRef: RefObject<HTMLElement | null>,
  rootRef: RefObject<HTMLElement | null>,
  /** Re-run when sticky chrome mounts/toggles (e.g. after loading, Show/Hide Details). */
  layoutKey?: unknown,
): void {
  useEffect(() => {
    const sticky = stickyHeaderRef.current
    const root = rootRef.current
    if (!sticky || !root || globalThis.window === undefined) return

    const update = () => {
      const available = computeFeedbackColumnsAvailableHeight(
        globalThis.window.innerHeight,
        sticky.getBoundingClientRect().bottom,
      )
      root.style.setProperty(
        FEEDBACK_COLUMNS_AVAILABLE_HEIGHT_VAR,
        `${available}px`,
      )
    }

    update()

    const resizeObserver = new ResizeObserver(() => {
      update()
    })
    resizeObserver.observe(sticky)

    globalThis.window.addEventListener('scroll', update, { passive: true })
    globalThis.window.addEventListener('resize', update)

    return () => {
      resizeObserver.disconnect()
      globalThis.window.removeEventListener('scroll', update)
      globalThis.window.removeEventListener('resize', update)
    }
  }, [stickyHeaderRef, rootRef, layoutKey])
}
