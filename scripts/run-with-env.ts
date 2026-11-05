import dotenv from 'dotenv';
import { exec } from 'node:child_process';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local', override: true });

const script = process.argv[2];

console.log(process.env)

if (!script) {
  throw new Error('Please provide a script to run.');
}

const child = exec(`tsx ${script}`, (error, stdout, stderr) => {
  if (error) {
    console.error(`exec error: ${error}`);
    return;
  }
  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);
});

child.on('exit', (code) => {
  if (code !== 0) {
    throw new Error(`Script exited with code ${code}`);
  }
});
