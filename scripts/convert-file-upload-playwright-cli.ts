#!/usr/bin/env tsx
/**
 * Out-of-process Playwright File-upload conversion (keeps Playwright out of Next.js).
 *
 * Reads JSON from stdin: { formId, titles, headed? }
 * Writes JSON result to stdout.
 */
import 'dotenv/config'
import { convertFileUploadItemsViaPlaywright } from '../lib/library/digitize/convert-file-upload-playwright'

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks).toString('utf8')
}

async function main() {
  const raw = (await readStdin()).trim()
  if (!raw) {
    throw new Error('Expected JSON on stdin: { formId, titles, headed? }')
  }
  const input = JSON.parse(raw) as {
    formId?: string
    titles?: string[]
    headed?: boolean
  }
  if (!input.formId?.trim() || !Array.isArray(input.titles)) {
    throw new Error('stdin JSON must include formId and titles[]')
  }

  const result = await convertFileUploadItemsViaPlaywright({
    formId: input.formId.trim(),
    titles: input.titles,
    headed: input.headed === true,
  })
  process.stdout.write(`${JSON.stringify(result)}\n`)
}

main().catch((error) => {
  console.error((error as Error).message)
  process.exit(1)
})
