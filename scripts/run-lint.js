#!/usr/bin/env node
import { existsSync } from 'fs';
import { spawnSync } from 'child_process';

const hasNodeModules = existsSync('node_modules');

if (hasNodeModules) {
  const cmd = spawnSync('pnpm', ['exec', 'next', 'lint'], { stdio: 'inherit' });
  process.exit(cmd.status ?? 0);
} else {
  console.log('No node_modules detected; skipping lint.');
}
