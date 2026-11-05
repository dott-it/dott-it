/** Minimum usable column pane when the sticky header is tall (matches prior lg:min-h-[28rem]). */
export const FEEDBACK_COLUMNS_MIN_HEIGHT_PX = 28 * 16

/** Breathing room between sticky bottom and the viewport edge. */
export const FEEDBACK_COLUMNS_VIEWPORT_GAP_PX = 16

/** CSS custom property consumed by the Student Response / Feedback column panes. */
export const FEEDBACK_COLUMNS_AVAILABLE_HEIGHT_VAR =
  '--feedback-columns-available-height'

/**
 * Remaining viewport below the sticky assessment header.
 * Tracks Show/Hide Details and AppHeader visibility without a hardcoded rem offset.
 */
export function computeFeedbackColumnsAvailableHeight(
  viewportHeight: number,
  stickyBottom: number,
  options?: { gapPx?: number; minPx?: number },
): number {
  const gapPx = options?.gapPx ?? FEEDBACK_COLUMNS_VIEWPORT_GAP_PX
  const minPx = options?.minPx ?? FEEDBACK_COLUMNS_MIN_HEIGHT_PX
  return Math.max(Math.floor(viewportHeight - stickyBottom - gapPx), minPx)
}
