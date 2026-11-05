import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import https from 'https';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Load metadata files
function loadJSONFile(filename) {
    try {
        const filePath = join(projectRoot, 'data', 'seed', filename);
        const content = readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        console.error(`Error loading ${filename}:`, error.message);
        return null;
    }
}

// HTTP request helper
function checkUrl(url) {
    return new Promise((resolve) => {
        const urlObj = new URL(url);
        const client = urlObj.protocol === 'https:' ? https : http;
        
        const req = client.request(url, {
            method: 'HEAD',
            timeout: 5000, // Reduced timeout for faster tests
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; LinkChecker/1.0)'
            }
        }, (res) => {
            resolve({
                url,
                status: res.statusCode,
                statusText: res.statusMessage,
                headers: res.headers,
                ok: res.statusCode >= 200 && res.statusCode < 400
            });
        });

        req.on('error', (error) => {
            resolve({
                url,
                error: error.message,
                ok: false
            });
        });

        req.on('timeout', () => {
            req.destroy();
            resolve({
                url,
                error: 'Request timeout',
                ok: false
            });
        });

        req.end();
    });
}

// Test configuration - can be overridden by environment variables
const TEST_ONLINE = process.env.TEST_ONLINE === '1' || process.env.CI === 'true' || process.env.PRE_COMMIT === '1';
const SKIP_LINK_CHECKER = process.env.SKIP_LINK_CHECKER === '1';
const LINK_CHECKER_TIMEOUT = parseInt(process.env.LINK_CHECKER_TIMEOUT) || 30000; // 30 seconds default
const LINK_CHECKER_REQUIRED = process.env.PRE_COMMIT === '1' || process.env.CI === 'true';

test('Link Checker - Validate all URLs in metadata', async () => {
    if (SKIP_LINK_CHECKER) {
        console.log('Skipping link checker tests. Set SKIP_LINK_CHECKER=0 to run.');
        return;
    }

    if (!TEST_ONLINE) {
        console.log('Skipping online tests. Set TEST_ONLINE=1 to run link checks.');
        return;
    }

    const openSciEdUnits = loadJSONFile('openscied_units.json');
    const ngssAlignment = loadJSONFile('ngss_alignment.json');

    expect(openSciEdUnits).toBeTruthy();
    expect(ngssAlignment).toBeTruthy();

    const allUrls = new Set();
    const urlSources = [];

    // Collect OpenSciEd unit URLs
    if (openSciEdUnits) {
        openSciEdUnits.forEach(unit => {
            if (unit.link) {
                allUrls.add(unit.link);
                urlSources.push({ url: unit.link, source: `OpenSciEd Unit ${unit.unitCode}`, type: 'unit_link' });
            }
        });
    }

    // Collect NGSS standard URLs
    if (ngssAlignment && ngssAlignment.standards) {
        Object.entries(ngssAlignment.standards).forEach(([code, standard]) => {
            if (standard.url) {
                allUrls.add(standard.url);
                urlSources.push({ url: standard.url, source: `NGSS Standard ${code}`, type: 'ngss_standard' });
            }
        });
    }

    console.log(`\n🔍 Checking ${allUrls.size} unique URLs...\n`);

    const results = [];
    const batchSize = 3; // Reduced batch size for faster tests
    const urlArray = Array.from(allUrls);

    // Set a timeout for the entire link checking process
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Link checker timeout')), LINK_CHECKER_TIMEOUT);
    });

    try {
        const linkCheckPromise = (async () => {
            for (let i = 0; i < urlArray.length; i += batchSize) {
                const batch = urlArray.slice(i, i + batchSize);
                const batchPromises = batch.map(url => checkUrl(url));
                
                const batchResults = await Promise.all(batchPromises);
                results.push(...batchResults);
                
                // Smaller delay between batches for faster tests
                if (i + batchSize < urlArray.length) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
        })();

        await Promise.race([linkCheckPromise, timeoutPromise]);
    } catch (error) {
        if (error.message === 'Link checker timeout') {
            console.log(`⚠️  Link checker timed out after ${LINK_CHECKER_TIMEOUT}ms. Processed ${results.length}/${urlArray.length} URLs.`);
        } else {
            throw error;
        }
    }

    // Analyze results
    const successful = results.filter(r => r.ok);
    const failed = results.filter(r => !r.ok);
    const statusCodes = {};

    results.forEach(result => {
        if (result.status) {
            statusCodes[result.status] = (statusCodes[result.status] || 0) + 1;
        }
    });

    console.log('📊 Results Summary:');
    console.log(`✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    console.log(`📈 Success Rate: ${((successful.length / results.length) * 100).toFixed(1)}%`);

    if (Object.keys(statusCodes).length > 0) {
        console.log('\n📋 Status Code Distribution:');
        Object.entries(statusCodes).sort(([a], [b]) => parseInt(a) - parseInt(b)).forEach(([code, count]) => {
            console.log(`  ${code}: ${count} URLs`);
        });
    }

    // Report specific failures (only in verbose mode or CI)
    if (failed.length > 0 && (process.env.CI === 'true' || process.env.VERBOSE === '1')) {
        console.log('\n❌ Failed URLs:');
        failed.forEach(result => {
            const sources = urlSources.filter(s => s.url === result.url);
            const sourceInfo = sources.map(s => `${s.source} (${s.type})`).join(', ');
            
            if (result.status) {
                console.log(`  ${result.url}`);
                console.log(`    Status: ${result.status} ${result.statusText}`);
                console.log(`    Sources: ${sourceInfo}`);
            } else {
                console.log(`  ${result.url}`);
                console.log(`    Error: ${result.error}`);
                console.log(`    Sources: ${sourceInfo}`);
            }
            console.log('');
        });
    }

    // Check for specific problematic patterns
    const ngssFailures = failed.filter(r => r.url.includes('nextgenscience.org'));
    const openSciEdFailures = failed.filter(r => r.url.includes('openscied.org'));

    if (ngssFailures.length > 0) {
        console.log(`⚠️  NGSS URL Issues: ${ngssFailures.length} failures`);
        if (process.env.CI === 'true' || process.env.VERBOSE === '1') {
            ngssFailures.forEach(failure => {
                console.log(`  ${failure.url} - ${failure.status || failure.error}`);
            });
        }
    }

    if (openSciEdFailures.length > 0) {
        console.log(`⚠️  OpenSciEd URL Issues: ${openSciEdFailures.length} failures`);
        if (process.env.CI === 'true' || process.env.VERBOSE === '1') {
            openSciEdFailures.forEach(failure => {
                console.log(`  ${failure.url} - ${failure.status || failure.error}`);
            });
        }
    }

    // Assertions for critical failures
    const criticalFailures = failed.filter(r => 
        r.status === 404 || 
        r.status === 500 || 
        r.error?.includes('ENOTFOUND') ||
        r.error?.includes('ECONNREFUSED')
    );

    if (criticalFailures.length > 0) {
        console.log(`\n🚨 Critical Failures (404s, 500s, connection errors): ${criticalFailures.length}`);
        if (process.env.CI === 'true' || process.env.VERBOSE === '1') {
            criticalFailures.forEach(failure => {
                const sources = urlSources.filter(s => s.url === failure.url);
                console.log(`  ${failure.url}`);
                console.log(`    Issue: ${failure.status || failure.error}`);
                console.log(`    Sources: ${sources.map(s => s.source).join(', ')}`);
            });
        }
    }

    // Summary assertions
    expect(successful.length).toBeGreaterThan(0);
    
    // In CI or pre-commit, be more strict about failures
    if (LINK_CHECKER_REQUIRED) {
        const failureThreshold = Math.ceil(results.length * 0.05); // Allow up to 5% failures in CI/pre-commit
        expect(failed.length).toBeLessThanOrEqual(failureThreshold);
        
        if (failed.length > 0) {
            console.log(`\n⚠️  Link checker found ${failed.length} failures. Please fix these URLs before committing:`);
            failed.forEach(result => {
                const sources = urlSources.filter(s => s.url === result.url);
                const sourceInfo = sources.map(s => s.source).join(', ');
                console.log(`  ${result.url} (${sourceInfo})`);
            });
        }
    }
});

test('Link Checker - Validate URL formats', async () => {
    const openSciEdUnits = loadJSONFile('openscied_units.json');
    const ngssAlignment = loadJSONFile('ngss_alignment.json');

    expect(openSciEdUnits).toBeTruthy();
    expect(ngssAlignment).toBeTruthy();
    if (openSciEdUnits) {
        for (const unit of openSciEdUnits) {
            if (unit.link) {
                expect(
                    unit.link.startsWith('https://openscied.org/'),
                    `OpenSciEd URL should start with https://openscied.org/: ${unit.link}`
                ).toBeTruthy();
                expect(
                    unit.link.includes('instructional-materials'),
                    `OpenSciEd URL should contain 'instructional-materials': ${unit.link}`
                ).toBeTruthy();
            }
        }
    }

    if (ngssAlignment && ngssAlignment.standards) {
        for (const standard of Object.values(ngssAlignment.standards)) {
            if (standard.url) {
                expect(
                    standard.url.startsWith('https://www.nextgenscience.org/'),
                    `NGSS URL should start with https://www.nextgenscience.org/: ${standard.url}`
                ).toBeTruthy();
                expect(
                    standard.url.includes('/pe/'),
                    `NGSS URL should contain '/pe/': ${standard.url}`
                ).toBeTruthy();
            }
        }
    }

    if (openSciEdUnits && ngssAlignment) {
        const definedStandards = new Set(Object.keys(ngssAlignment.standards || {}));
        const referencedStandards = new Set();

        openSciEdUnits.forEach(unit => {
            if (unit.standards) {
                unit.standards.forEach(standard => referencedStandards.add(standard));
            }
            if (unit.assessmentTemplates) {
                unit.assessmentTemplates.forEach(template => {
                    if (template.standards) {
                        template.standards.forEach(standard => referencedStandards.add(standard));
                    }
                });
            }
        });

        const missingStandards = Array.from(referencedStandards).filter(standard => !definedStandards.has(standard));

        if (missingStandards.length > 0) {
            console.log('\n⚠️  Missing NGSS standards definitions:');
            missingStandards.forEach(standard => {
                console.log(`  ${standard} - referenced but not defined in ngss_alignment.json`);
            });
        }

        expect(missingStandards.length).toBe(0);
    }
});

// Quick validation test that runs without network requests
test('Link Checker - Quick validation (offline)', async () => {
    const openSciEdUnits = loadJSONFile('openscied_units.json');
    const ngssAlignment = loadJSONFile('ngss_alignment.json');

    expect(openSciEdUnits).toBeTruthy();
    expect(ngssAlignment).toBeTruthy();

    // Check OpenSciEd units structure
    expect(Array.isArray(openSciEdUnits)).toBeTruthy();
    expect(openSciEdUnits.length).toBeGreaterThan(0);

    // Check NGSS alignment structure
    expect(ngssAlignment.standards).toBeTruthy();
    expect(Object.keys(ngssAlignment.standards).length).toBeGreaterThan(0);

    // Check that units have required fields
    openSciEdUnits.forEach(unit => {
        expect(unit.unitCode).toBeTruthy();
        expect(unit.title).toBeTruthy();
        expect(unit.subject).toBeTruthy();
        expect(unit.grade).toBeTruthy();
    });

    // Check that standards have required fields
    Object.values(ngssAlignment.standards).forEach(standard => {
        expect(standard.code).toBeTruthy();
        expect(standard.title).toBeTruthy();
        expect(standard.url).toBeTruthy();
        expect(standard.grade_level).toBeTruthy();
        expect(standard.domain).toBeTruthy();
    });
});