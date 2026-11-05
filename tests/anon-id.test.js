import { test, expect } from '@playwright/test';
import { anonId } from '../lib/anon-id.js';
import crypto from 'node:crypto';

test('anonId should hash tenant and local ID with salt', () => {
  const prev = process.env.HASH_SALT;
  process.env.HASH_SALT = 'test-salt';
  const result = anonId('student1', 'tenantA');
  const expected = crypto
    .createHmac('sha256', 'test-salt')
    .update('tenantA:student1')
    .digest('hex');
  expect(result).toBe(expected);
  if (prev === undefined) {
    delete process.env.HASH_SALT;
  } else {
    process.env.HASH_SALT = prev;
  }
});
