/**
 * Best-effort in-memory rate limit for expensive library Form generation.
 * Per-process only (Vercel instances are independent) — still blocks casual scripted abuse.
 *
 * Follow-up before wider traffic: shared store (Redis/Upstash). No Upstash dependency yet.
 */

type Bucket = {
  timestamps: number[]
}

const buckets = new Map<string, Bucket>()

export type LibraryFormGenerationRateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; retryAfterSeconds: number }

function getTrimmedBucket(key: string, windowMs: number, now: number): Bucket {
  const cutoff = now - windowMs
  const bucket = buckets.get(key) ?? { timestamps: [] }
  bucket.timestamps = bucket.timestamps.filter((ts) => ts > cutoff)
  return bucket
}

/**
 * Check Form-generation capacity. Pass consume:false to reserve the slot only after success
 * via recordLibraryFormGenerationRateLimit (avoids burning quota on transient Drive failures).
 */
export function checkLibraryFormGenerationRateLimit(args: {
  key: string
  /** Max Form-generating exports in the window. */
  limit?: number
  /** Sliding window length in ms. */
  windowMs?: number
  nowMs?: number
  /** When false, only peeks without recording (default true for backward compatibility). */
  consume?: boolean
}): LibraryFormGenerationRateLimitResult {
  const limit = args.limit ?? 5
  const windowMs = args.windowMs ?? 60 * 60 * 1000
  const now = args.nowMs ?? Date.now()
  const consume = args.consume !== false

  const bucket = getTrimmedBucket(args.key, windowMs, now)

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0] ?? now
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000))
    buckets.set(args.key, bucket)
    return { allowed: false, retryAfterSeconds }
  }

  if (consume) {
    bucket.timestamps.push(now)
  }
  buckets.set(args.key, bucket)
  return { allowed: true, remaining: Math.max(0, limit - bucket.timestamps.length) }
}

/** Record a successful Form-generating export against a previously peeked bucket. */
export function recordLibraryFormGenerationRateLimit(args: {
  key: string
  windowMs?: number
  nowMs?: number
}): void {
  const windowMs = args.windowMs ?? 60 * 60 * 1000
  const now = args.nowMs ?? Date.now()
  const bucket = getTrimmedBucket(args.key, windowMs, now)
  bucket.timestamps.push(now)
  buckets.set(args.key, bucket)
}

/** Test helper — clears all buckets. */
export function resetLibraryFormGenerationRateLimitForTests(): void {
  buckets.clear()
}
