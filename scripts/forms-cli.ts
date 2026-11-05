#!/usr/bin/env tsx

import { createSampleForm } from '../lib/forms/examples/create-form';
import { runGetFormCLI } from '../lib/forms/examples/get-form';
import { runGetResponsesCLI } from '../lib/forms/examples/list-responses';

const command = process.argv[2];

async function main() {
  try {
    switch (command) {
      case 'create': {
        console.log('Creating sample form...');
        await createSampleForm();
        break;
      }
      
      case 'get': {
        console.log('Getting form details...');
        await runGetFormCLI();
        break;
      }
      
      case 'responses': {
        console.log('Getting form responses...');
        await runGetResponsesCLI();
        break;
      }
      
      default: {
        console.log(`
Google Forms CLI Tool

Usage:
  npm run forms:create          Create a sample form
  npm run forms:get -- FORM_ID Get form details
  npm run forms:responses -- FORM_ID List form responses

Examples:
  npm run forms:create
  npm run forms:get -- 1FAIpQLSe...your-form-id
  npm run forms:responses -- 1FAIpQLSe...your-form-id
        `);
        break;
      }
    }
  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
    process.exit(1);
  }
}

// Run main function if this file is executed directly
// eslint-disable-next-line unicorn/prefer-top-level-await
main().catch((error) => {
  console.error('❌ CLI Error:', (error as Error).message);
  process.exit(1);
});
