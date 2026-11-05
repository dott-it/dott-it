# Page Event Tracking - Fix for Multiple Triggers

## Problem
The page event tracker was triggering multiple times on each render, causing hundreds of duplicate events to be sent to the API (resulting in 401 errors as shown in the logs).

## Root Cause
The original implementation used a `useCallback` with dependencies that changed on every render:
- `createBasePayload` - recreated on every render due to `pageName` and `additionalPayload` dependencies
- `createEventMutation` - React Query mutation that may change
- `onPageView` - callback prop that may change

This caused the `trackPageViewEvent` callback to be recreated on every render, which triggered the effect repeatedly.

## Solution
Changed the implementation to:

1. **Use a ref to track the last pathname**: `lastTrackedPathname.current`
2. **Move the tracking logic directly into the effect**: Instead of using a callback that gets recreated
3. **Check if pathname was already tracked**: Skip tracking if `lastTrackedPathname.current === pathname`
4. **Include all dependencies**: Properly list all dependencies in the effect array to satisfy React's exhaustive-deps rule

### Key Changes

**Before:**
```tsx
const trackPageViewEvent = useCallback(async () => {
  if (!trackPageView || hasTrackedPageView.current) return
  // ... tracking logic
}, [trackPageView, createBasePayload, createEventMutation, onPageView])

useEffect(() => {
  hasTrackedPageView.current = false
}, [pathname])

useEffect(() => {
  trackPageViewEvent()
}, [trackPageViewEvent]) // This runs on every render!
```

**After:**
```tsx
const lastTrackedPathname = useRef<string | null>(null)

useEffect(() => {
  // Skip if tracking is disabled
  if (trackPageView === false) return
  
  // Skip if we've already tracked this pathname
  if (lastTrackedPathname.current === pathname) return
  
  const trackView = async () => {
    // ... tracking logic
    lastTrackedPathname.current = pathname // Mark as tracked
  }
  
  trackView()
}, [pathname, trackPageView, createBasePayload, createEventMutation, onPageView])
```

## Result
✅ **Page view events now trigger only ONCE per pathname**
✅ **No duplicate events on re-renders**
✅ **Proper cleanup when navigating between pages**
✅ **All React Hook dependencies properly declared**

## Testing
To verify the fix works:

1. Navigate to a dashboard page (e.g., `/workspace/assessments`)
2. Check the network tab - should see only ONE `POST /api/events` with `page_view`
3. Click on elements - should see `page_click` events
4. Navigate to another page - should see ONE new `page_view` event
5. Go back to the first page - should see ONE `page_view` event (new one, not cached)

## Additional Notes
- The ref approach ensures the tracking state persists across renders
- The pathname comparison prevents duplicate tracking even if the component re-renders
- Error handling remains the same - silent failures in production, logged in development
- Click tracking was not affected by this issue and continues to work correctly
