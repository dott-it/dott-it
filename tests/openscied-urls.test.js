import { test, expect } from '@playwright/test';

// Allow running the file offline. Network based tests are only executed when
// TEST_ONLINE is truthy.
const RUN_ONLINE = !!process.env.TEST_ONLINE;

test.describe.skip('OpenSciEd URL Tests', () => {

// All OpenSciEd URLs from the assessment library
const openSciedUrls = [
  // Middle School Units
  {
    unit: "6.3 Weather, Climate & Water Cycling",
    url: "https://openscied.org/instructional-materials/6-3-weather-climate-water-cycling/",
    course: "Earth Science",
    grade: 6
  },
  {
    unit: "7.5 Ecosystem Dynamics", 
    url: "https://openscied.org/instructional-materials/7-5-ecosystem-dynamics/",
    course: "Life Science",
    grade: 7
  },
  {
    unit: "8.6 Natural Selection & Common Ancestry",
    url: "https://openscied.org/instructional-materials/8-6-natural-selection-common-ancestry/",
    course: "Life Science", 
    grade: 8
  },
  {
    unit: "6.1 Light & Matter",
    url: "https://openscied.org/instructional-materials/6-1-light-matter/",
    course: "Physical Science",
    grade: 6
  },
  {
    unit: "7.1 Chemical Reactions & Matter",
    url: "https://openscied.org/instructional-materials/7-1-chemical-reactions-matter/",
    course: "Physical Science",
    grade: 7
  },
  {
    unit: "6.4 Plate Tectonics & Rock Cycling",
    url: "https://openscied.org/instructional-materials/6-4-rock-cycling-plate-tectonics/",
    course: "Earth Science",
    grade: 6
  },
  {
    unit: "6.6 Cells & Systems",
    url: "https://openscied.org/instructional-materials/6-6-cells-systems/",
    course: "Life Science",
    grade: 6
  },
  {
    unit: "8.1 Contact Forces",
    url: "https://openscied.org/instructional-materials/8-1-contact-forces/",
    course: "Physical Science",
    grade: 8
  },
  
  // High School Biology Units
  {
    unit: "B.1 Ecosystem Interactions & Dynamics",
    url: "https://openscied.org/instructional-materials/b-1-ecosystem-interactions-dynamics/",
    course: "Biology",
    grade: 9
  },
  {
    unit: "B.2 Ecosystems: Matter & Energy",
    url: "https://openscied.org/instructional-materials/b-2-ecosystems-matter-energy/",
    course: "Biology",
    grade: 9
  },
  {
    unit: "B.3 Inheritance & Variation of Traits",
    url: "https://openscied.org/instructional-materials/b-3-inheritance-variation-of-traits/",
    course: "Biology",
    grade: 10
  },
  {
    unit: "B.4 Natural Selection & Evolution of Populations",
    url: "https://openscied.org/instructional-materials/b-4-natural-selection-evolution/",
    course: "Biology",
    grade: 10
  },
  {
    unit: "B.5 Common Ancestry & Speciation",
    url: "https://openscied.org/instructional-materials/b-5-common-ancestry-speciation/",
    course: "Biology",
    grade: 10
  },
  
  // High School Chemistry Units
  {
    unit: "C.2 Structure & Properties of Matter",
    url: "https://openscied.org/instructional-materials/c-2-structure-properties-of-matter/",
    course: "Chemistry",
    grade: 11
  },
  {
    unit: "C.4 Chemical Reactions in our World",
    url: "https://openscied.org/instructional-materials/c-4-chemical-reactions-in-our-world/",
    course: "Chemistry",
    grade: 11
  },
  
  // High School Physics Units
  {
    unit: "P.3 Collisions & Momentum",
    url: "https://openscied.org/instructional-materials/p-3-collisions-momentum/",
    course: "Physics",
    grade: 12
  },
  {
    unit: "P.5 Electromagnetic Radiation",
    url: "https://openscied.org/instructional-materials/p-5-electromagnetic-radiation/",
    course: "Physics",
    grade: 12
  }
];

// Helper function to check URL accessibility
async function checkUrl(url, timeout = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      method: 'HEAD', // Use HEAD to avoid downloading content
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; OpenSciEd-Test/1.0)'
      }
    });
    clearTimeout(timeoutId);
    return {
      status: response.status,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

// Test suite for individual URLs. These rely on network access and are skipped
// unless TEST_ONLINE is set.
(RUN_ONLINE ? test : test.skip)('OpenSciEd URL Accessibility Tests', async () => {
  
  // Test each URL individually
  for (const unitData of openSciedUrls) {
    test(`${unitData.unit} (${unitData.course}, Grade ${unitData.grade})`, async () => {
      try {
        const result = await checkUrl(unitData.url);
        
        // Check if URL is accessible (200-299 status codes)
        expect(result.ok).toBe(true);
        expect(result.status).toBeGreaterThanOrEqual(200);
        expect(result.status).toBeLessThan(400);
        
        // Check if it's an HTML page (content-type check)
        const contentType = result.headers['content-type'] || '';
        expect(contentType.includes('text/html') || contentType.includes('text/')).toBe(true);
          
      } catch (error) {
        expect.fail(`Failed to access ${unitData.url}: ${error.message}`);
      }
    });
  }
});

// Test URL format consistency
test('URL Format Consistency Tests', async () => {
  
  test('All URLs follow OpenSciEd domain pattern', () => {
    for (const unitData of openSciedUrls) {
      expect(unitData.url.startsWith('https://openscied.org/')).toBe(true);
    }
  });

  test('All URLs follow instructional-materials path pattern', () => {
    for (const unitData of openSciedUrls) {
      expect(unitData.url.includes('/instructional-materials/')).toBe(true);
    }
  });

  test('All URLs end with trailing slash', () => {
    for (const unitData of openSciedUrls) {
      expect(unitData.url.endsWith('/')).toBe(true);
    }
  });

  test('Middle school URLs use numeric grade format', () => {
    const middleSchoolUnits = openSciedUrls.filter(unit => unit.grade <= 8);
    for (const unitData of middleSchoolUnits) {
      const urlPath = unitData.url.split('/instructional-materials/')[1];
      expect(/^\d-\d/.test(urlPath)).toBe(true);
    }
  });

  test('High school URLs use letter prefix format', () => {
    const highSchoolUnits = openSciedUrls.filter(unit => unit.grade > 8);
    for (const unitData of highSchoolUnits) {
      const urlPath = unitData.url.split('/instructional-materials/')[1];
      expect(/^[a-z]-\d/.test(urlPath)).toBe(true);
    }
  });
});

// Test data completeness
test('Assessment Data Completeness Tests', async () => {
  
  test('All required fields are present', () => {
    for (const unitData of openSciedUrls) {
      expect(unitData.unit).toBeTruthy();
      expect(unitData.url).toBeTruthy();
      expect(unitData.course).toBeTruthy();
      expect(typeof unitData.grade === 'number').toBe(true);
    }
  });

  test('Grade levels are appropriate for courses', () => {
    const middleSchoolCourses = ['Earth Science', 'Life Science', 'Physical Science'];
    const highSchoolCourses = ['Biology', 'Chemistry', 'Physics'];
    
    for (const unitData of openSciedUrls) {
      if (unitData.grade <= 8) {
        expect(middleSchoolCourses.includes(unitData.course)).toBe(true);
      } else {
        expect(highSchoolCourses.includes(unitData.course)).toBe(true);
      }
    }
  });

  test('Unit names match URL patterns', () => {
    for (const unitData of openSciedUrls) {
      const urlPath = unitData.url.split('/instructional-materials/')[1].replace('/', '');
      const unitCode = unitData.unit.split(' ')[0]; // e.g., "6.3" or "B.1"
      
      // Convert unit code to URL format (lowercase, dots to dashes)
      const expectedUrlStart = unitCode.toLowerCase().replace('.', '-');
      
      expect(urlPath.startsWith(expectedUrlStart)).toBe(true);
    }
  });
});

// Performance and batch tests. These also require network access and are
// skipped unless TEST_ONLINE is set.
(RUN_ONLINE ? test : test.skip)('Batch URL Performance Tests', async () => {
  
  test('All URLs accessible within reasonable time', async () => {
    const startTime = Date.now();
    const batchSize = 5; // Test in smaller batches to avoid overwhelming the server
    
    for (let i = 0; i < openSciedUrls.length; i += batchSize) {
      const batch = openSciedUrls.slice(i, i + batchSize);
      const promises = batch.map(unitData => 
        checkUrl(unitData.url, 5000) // 5 second timeout per URL
          .catch(error => ({ error: error.message, url: unitData.url }))
      );
      
      const results = await Promise.all(promises);
      
      // Check that no URLs in this batch failed
      for (const result of results) {
        expect(!result.error).toBe(true);
      }
      
      // Small delay between batches to be respectful to the server
      if (i + batchSize < openSciedUrls.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`✓ All ${openSciedUrls.length} URLs checked in ${totalTime}ms`);
    
    // Ensure the entire test completes in reasonable time (60 seconds)
    expect(totalTime < 60000).toBe(true);
  });
});

});

