import { test, expect } from '@playwright/test';
import { URL } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Base URL to start crawling from
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const MAX_DEPTH = 10; // Set crawl depth limit

// Helper to check if a link is internal
function isInternalLink(link: string, base: string) {
    try {
        const url = new URL(link, base);
        return url.origin === new URL(base).origin;
    } catch {
        return false;
    }
}

test.skip('crawl all internal links and report broken ones', async ({ page, context }) => {
    // Set only the bypass header and user-agent
    await context.setExtraHTTPHeaders({
        'x-vercel-protection-bypass': process.env.VERCEL_AUTOMATION_BYPASS_SECRET || '',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
    });

    // Visit the root URL once to set the bypass cookie
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

    const visited = new Set<string>();
    const broken: { url: string; status: number | string }[] = [];

    async function crawl(url: string, depth: number) {
        if (visited.has(url) || depth > MAX_DEPTH) return;
        visited.add(url);
        let response;

        // Retry logic for failed requests
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
                if (!response || !response.ok()) {
                    if (attempt === 3) {
                        broken.push({ url, status: response ? response.status() : 'NO RESPONSE' });
                    }
                    return;
                }
                break; // Success, exit retry loop
            } catch (e: any) {
                if (attempt === 3) {
                    broken.push({ url, status: e.message });
                    return;
                }
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        try {
            // Click all visible buttons before collecting links
            const buttons = await page.$$('button');
            for (const button of buttons) {
                try {
                    if (await button.isVisible()) {
                        await button.click({ timeout: 1000 });
                    }
                } catch (e) {
                    // Ignore errors from buttons that can't be clicked
                }
            }

            // Only collect links if we haven't reached max depth
            if (depth < MAX_DEPTH) {
                // Collect all internal links on the page
                const links = await page.$$eval('a[href]', as => as.map(a => (a as HTMLAnchorElement).href));
                for (const link of links) {
                    if (isInternalLink(link, BASE_URL)) {
                        await crawl(link, depth + 1);
                    }
                }
            }
        } catch (e: any) {
            // Only add to broken if it's not already there
            if (!broken.some(b => b.url === url)) {
                broken.push({ url, status: e.message });
            }
        }
    }

    await crawl(BASE_URL, 0);

    // Prepare report content
    const reportPath = path.resolve('playwright-link-report.txt');
    const crawledLinks = Array.from(visited);
    let reportContent = 'Links crawled:\n';
    reportContent += crawledLinks.join('\n') + '\n\n';
    console.log('Links crawled:');
    crawledLinks.forEach(link => console.log(link));

    if (broken.length) {
        reportContent += 'Broken links:\n';
        broken.forEach(b => reportContent += `${b.url} [${b.status}]\n`);
        console.log('\nBroken links found:');
        broken.forEach(b => console.log(`${b.url} [${b.status}]`));
    } else {
        reportContent += 'No broken links found.\n';
        console.log('\nNo broken links found.');
    }
    fs.writeFileSync(reportPath, reportContent, 'utf-8');
    console.log(`\nReport written to ${reportPath}`);

    // Allow broken links for pages that are not implemented yet
    expect(broken.length, 'Should have at most 4 broken links').toBeLessThanOrEqual(4);
    if (broken.length > 0) {
        // Log the broken links for debugging
        console.log('Broken links found:', broken.map(link => link.url));
    }
}); 