import { test, expect } from '@playwright/test';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

test.skip('App should start without React.Children.only errors', async () => {
    let server;
    let passed = false;
    
    try {
        // Start the development server
        server = spawn('npm', ['run', 'dev'], {
            cwd: projectRoot,
            stdio: 'pipe'
        });

        let output = '';
        let errorOutput = '';

        // Collect output
        server.stdout.on('data', (data) => {
            output += data.toString();
        });

        server.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        // Wait for server to start (look for Ready message or timeout)
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Server failed to start within 30 seconds'));
            }, 30000);

            const checkOutput = () => {
                // Check if server is ready
                if (output.includes('Ready') || output.includes('started server on')) {
                    clearTimeout(timeout);
                    
                    // Check for React.Children.only errors in the output
                    const hasChildrenOnlyError = 
                        output.includes('React.Children.only') || 
                        errorOutput.includes('React.Children.only') ||
                        output.includes('expected to receive a single React element child') ||
                        errorOutput.includes('expected to receive a single React element child');

                    if (hasChildrenOnlyError) {
                        reject(new Error('App failed to load: React.Children.only error detected in server output'));
                    } else {
                        passed = true;
                        resolve();
                    }
                }
                
                // Check for compilation errors
                if (output.includes('Failed to compile') || errorOutput.includes('Failed to compile')) {
                    clearTimeout(timeout);
                    reject(new Error('App failed to compile'));
                }
            };

            server.stdout.on('data', checkOutput);
            server.stderr.on('data', checkOutput);
        });

        expect(passed).toBe(true);

    } catch (error) {
        expect.fail(`App failed to load properly: ${error.message}`);
    } finally {
        // Clean up server
        if (server && !server.killed) {
            server.kill('SIGTERM');
            
            // Force kill if still running after 5 seconds
            setTimeout(() => {
                if (!server.killed) {
                    server.kill('SIGKILL');
                }
            }, 5000);
        }
    }
}); 