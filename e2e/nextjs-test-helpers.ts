import { Page, expect } from '@playwright/test';

/**
 * Simplified Next.js test helpers for reliable testing
 */

/**
 * Wait for Next.js page to be ready
 */
export async function waitForNextJsPage(page: Page, url?: string) {
    if (url) {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
    }

    // Wait for Next.js to be ready
    await page.waitForLoadState('domcontentloaded');
}

/**
 * Wait for Next.js loading states to complete
 */
export async function waitForNextJsLoading(page: Page) {
    // Wait for any loading spinners to disappear
    await page.waitForFunction(() => {
        const loadingElements = document.querySelectorAll('[data-loading], .loading, [aria-busy="true"]');
        return loadingElements.length === 0;
    }, { timeout: 10_000 });
}

/**
 * Wait for Next.js data fetching to complete
 */
export async function waitForNextJsData(page: Page) {
    // Wait for any data fetching indicators to disappear
    await page.waitForFunction(() => {
        const fetchingElements = document.querySelectorAll('[data-fetching], .fetching');
        return fetchingElements.length === 0;
    }, { timeout: 15_000 });
}

/**
 * Optimized assertion for Next.js page title
 */
export async function expectNextJsTitle(page: Page, expectedTitle: string | RegExp) {
    await expect(page).toHaveTitle(expectedTitle);
}

/**
 * Wait for Next.js navigation to complete
 */
export async function waitForNextJsNavigation(page: Page) {
    // Wait for Next.js router to complete navigation
    await page.waitForFunction(() => {
        return !document.querySelector('[data-nextjs-router-state="loading"]');
    }, { timeout: 10_000 });
}

/**
 * Click a link and wait for Next.js navigation
 */
export async function clickAndWaitForNavigation(page: Page, selector: string) {
    await Promise.all([
        page.waitForLoadState('domcontentloaded'),
        page.click(selector)
    ]);
    await waitForNextJsNavigation(page);
}

/**
 * Fill a form field optimized for Next.js
 */
export async function fillNextJsField(page: Page, selector: string, value: string) {
    await page.fill(selector, value);
    // Wait for any Next.js form validation
    await page.waitForTimeout(100);
}

/**
 * Submit a form and wait for Next.js processing
 */
export async function submitNextJsForm(page: Page, selector: string) {
    await Promise.all([
        page.waitForLoadState('domcontentloaded'),
        page.click(selector)
    ]);
    await waitForNextJsLoading(page);
}

/**
 * Wait for Next.js API response
 */
export async function waitForNextJsApiResponse(page: Page, endpoint: string) {
    await page.waitForResponse(
        response => response.url().includes(endpoint) && response.status() === 200,
        { timeout: 15_000 }
    );
}

/**
 * Check if Next.js error boundary is displayed
 */
export async function checkNextJsErrorBoundary(page: Page) {
    const errorElements = page.locator('[data-nextjs-error-boundary], .error-boundary');
    await expect(errorElements).toHaveCount(0);
}

/**
 * Wait for Next.js image optimization to complete
 */
export async function waitForNextJsImages(page: Page) {
    await page.waitForFunction(() => {
        const images = document.querySelectorAll('img[src*="/_next/image"]');
        return [...images].every(img => (img as HTMLImageElement).complete);
    }, { timeout: 10_000 });
}

/**
 * Simple test setup for Next.js pages
 */
export async function setupNextJsTest(page: Page, url: string) {
    await waitForNextJsPage(page, url);
    await waitForNextJsLoading(page);
    await waitForNextJsData(page);
    await checkNextJsErrorBoundary(page);
}

/**
 * Performance monitoring for Next.js tests
 */
export async function measureNextJsPerformance(page: Page, testName: string) {
    const startTime = Date.now();

    // Wait for page to be fully loaded
    await page.waitForLoadState('domcontentloaded');

    const loadTime = Date.now() - startTime;

    // Log performance metrics
    console.log(`Performance [${testName}]: ${loadTime}ms`);

    // Assert reasonable performance
    expect(loadTime).toBeLessThan(10_000);

    return loadTime;
} 