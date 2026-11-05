#!/usr/bin/env tsx
/**
 * Out-of-process Playwright Restore for Missing File Upload folders.
 *
 * Reads JSON from stdin: { formId, headed? }
 * Writes JSON result to stdout.
 */
import 'dotenv/config'
import { restoreFileUploadFoldersViaPlaywright } from '../lib/library/digitize/convert-file-upload-playwright'

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
    throw new Error('Expected JSON on stdin: { formId, headed? }')
  }
  const input = JSON.parse(raw) as { formId?: string; headed?: boolean }
  if (!input.formId?.trim()) {
    throw new Error('stdin JSON must include formId')
  }

  const result = await restoreFileUploadFoldersViaPlaywright({
    formId: input.formId.trim(),
    headed: input.headed === true,
  })
  process.stdout.write(`${JSON.stringify(result)}\n`)
}

main().catch((error) => {
  console.error((error as Error).message)
  process.exit(1)
})
