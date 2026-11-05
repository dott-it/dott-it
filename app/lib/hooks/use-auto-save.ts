import { useEffect, useRef, useCallback, useState } from 'react'

interface UseAutoSaveOptions {
  delay?: number
  onSave: (data: unknown) => Promise<void>
  enabled?: boolean
}

export function useAutoSave<T>(
  data: T,
  { delay = 2000, onSave, enabled = true }: UseAutoSaveOptions,
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedDataRef = useRef<T | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const isSavingRef = useRef(false)

  const saveData = useCallback(
    async (dataToSave: T) => {
      if (isSavingRef.current) return

      console.log('⏰ Auto-save triggered for data:', dataToSave)
      isSavingRef.current = true
      setIsSaving(true)
      try {
        await onSave(dataToSave)
        lastSavedDataRef.current = dataToSave
        console.log('✅ Auto-save completed successfully')
      } catch (error) {
        console.error('❌ Auto-save failed:', error)
        console.error('❌ Auto-save error details:', {
        message: (error as Error).message || 'Unknown error',
        status: (error as { status?: number }).status || 500,
        response: (error as { response?: unknown }).response || null,
        })
        // Don't update lastSavedDataRef on error
      } finally {
        isSavingRef.current = false
        setIsSaving(false)
      }
    },
    [onSave],
  )

  useEffect(() => {
    if (!enabled || !data) return

    // Skip if data hasn't changed
    if (JSON.stringify(data) === JSON.stringify(lastSavedDataRef.current)) {
      return
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      saveData(data)
    }, delay)

    // Cleanup on unmount or data change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [data, delay, enabled, saveData])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    isSaving,
  }
}
