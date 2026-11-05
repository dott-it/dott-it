import { defineConfig, devices, PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
    testDir: './e2e',
    testMatch: /openscied-pilot\.e2e\.spec\.ts/,
    use: {
        baseURL: 'http://localhost:3000',
        extraHTTPHeaders: {
            'x-vercel-protection-bypass': process.env.VERCEL_AUTOMATION_BYPASS_SECRET!,
            'x-vercel-set-bypass-cookie': 'true',
        },
    },
    webServer: {
        command: 'pnpm build && pnpm start',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
    },
    projects: [
        {
            name: 'e2e',
            testDir: './e2e',
            testMatch: /openscied-pilot\.e2e\.spec\.ts/,
        },
    ],
};

export default config; 