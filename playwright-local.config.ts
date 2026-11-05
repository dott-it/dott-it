import { defineConfig, PlaywrightTestConfig } from '@playwright/test';

// Local dev config for pnpm test:e2e — scoped to the OpenSciEd library pilot (#375).
// Unit tests in tests/ run via pnpm test:unit. Other e2e specs are run ad hoc.
const config: PlaywrightTestConfig = {
    testDir: './e2e',
    testMatch: /openscied-pilot\.e2e\.spec\.ts/,
    timeout: 30000,
    expect: {
        timeout: 10000,
    },
    use: {
        baseURL: 'http://localhost:3000',
        extraHTTPHeaders: {
            'x-vercel-protection-bypass': process.env.VERCEL_AUTOMATION_BYPASS_SECRET!,
            'x-vercel-set-bypass-cookie': 'true',
        },
        navigationTimeout: 15000,
        actionTimeout: 10000,
    },
    webServer: {
        command: 'pnpm dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 120 * 1000,
    },
    projects: [
        {
            name: 'e2e',
            testDir: './e2e',
            testMatch: /openscied-pilot\.e2e\.spec\.ts/,
        },
    ],
    workers: 3,
    retries: 1,
    reporter: [
        ['list'],
        ['html', { open: 'never' }],
    ],
};

export default config;
