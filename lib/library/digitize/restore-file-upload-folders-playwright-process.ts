import { spawn } from 'node:child_process'
import path from 'node:path'

export type PlaywrightFileUploadRestoreResult = {
  formId: string
  restored: boolean
  method: 'playwright-ui'
}

/**
 * Run Playwright File-upload folder Restore in a child process (keeps Playwright
 * out of the Next.js bundle).
 */
export async function restoreFileUploadFoldersViaPlaywrightProcess(args: {
  formId: string
  headed?: boolean
}): Promise<PlaywrightFileUploadRestoreResult> {
  const tsxCli = path.join(process.cwd(), 'node_modules/tsx/dist/cli.mjs')
  const script = path.join(process.cwd(), 'scripts/restore-file-upload-folders-playwright-cli.ts')
  const payload = JSON.stringify({
    formId: args.formId,
    headed: args.headed === true,
  })

  const { stdout, stderr, code } = await runProcess(tsxCli, [script], payload)
  if (code !== 0) {
    throw new Error(
      stderr.trim() ||
        stdout.trim() ||
        `Playwright restore process exited with code ${code}`,
    )
  }

  const line = stdout
    .split('\n')
    .map((row) => row.trim())
    .findLast(Boolean)
  if (!line) {
    throw new Error(`Playwright restore produced no JSON output.\n${stderr}`)
  }

  try {
    return JSON.parse(line) as PlaywrightFileUploadRestoreResult
  } catch {
    throw new Error(`Playwright restore returned invalid JSON: ${line}`)
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
      process.stderr.write(chunk)
    })
    child.on('error', reject)
    child.on('close', (code) => resolve({ stdout, stderr, code }))

    child.stdin.write(stdinPayload)
    child.stdin.end()
  })
}
