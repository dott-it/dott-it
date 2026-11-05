import { spawn } from 'node:child_process'
import path from 'node:path'
import type { PlaywrightFileUploadConvertResult } from './convert-file-upload-playwright'

/**
 * Run Playwright File-upload conversion in a child process so Next.js never
 * bundles Playwright (webpackIgnore broke runtime resolution under Turbopack).
 */
export async function convertFileUploadItemsViaPlaywrightProcess(args: {
  formId: string
  titles: string[]
  headed?: boolean
}): Promise<PlaywrightFileUploadConvertResult> {
  if (args.titles.length === 0) {
    return { formId: args.formId, converted: 0, titles: [], method: 'playwright-ui' }
  }

  const tsxCli = path.join(process.cwd(), 'node_modules/tsx/dist/cli.mjs')
  const script = path.join(process.cwd(), 'scripts/convert-file-upload-playwright-cli.ts')
  const payload = JSON.stringify({
    formId: args.formId,
    titles: args.titles,
    headed: args.headed === true,
  })

  const { stdout, stderr, code } = await runProcess(tsxCli, [script], payload)
  if (code !== 0) {
    throw new Error(
      stderr.trim() ||
        stdout.trim() ||
        `Playwright convert process exited with code ${code}`,
    )
  }

  const line = stdout
    .split('\n')
    .map((row) => row.trim())
    .findLast(Boolean)
  if (!line) {
    throw new Error(`Playwright convert produced no JSON output.\n${stderr}`)
  }

  try {
    return JSON.parse(line) as PlaywrightFileUploadConvertResult
  } catch {
    throw new Error(`Playwright convert returned invalid JSON: ${line}`)
  }
}

function runProcess(
  command: string,
  args: string[],
  stdinPayload: string,
): Promise<{ stdout: string; stderr: string; code: number | null }> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [command, ...args], {
      cwd: process.cwd(),
      env: process.env,
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', (chunk: string) => {
      stdout += chunk
    })
    child.stderr.on('data', (chunk: string) => {
      stderr += chunk
      // Forward progress logs to the parent server log.
      process.stderr.write(chunk)
    })
    child.on('error', reject)
    child.on('close', (code) => resolve({ stdout, stderr, code }))

    child.stdin.write(stdinPayload)
    child.stdin.end()
  })
}
