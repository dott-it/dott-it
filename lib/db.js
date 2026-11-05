import { neon } from '@neondatabase/serverless'

/**
 * Database connection for the tenant plane.
 * Returns a tagged template query function or throws an error when DATABASE_URL is unset.
 */
export const tenantDb = process.env.DATABASE_URL
  ? neon(process.env.DATABASE_URL)
  : (() => {
      throw new Error('DATABASE_URL environment variable is not set. Please configure your database connection.')
    })()

/**
 * Database connection for the global plane storing AssessmentEvent.
 * Returns a tagged template query function or throws an error when GLOBAL_DATABASE_URL is unset.
 */
export const globalDb = process.env.GLOBAL_DATABASE_URL
  ? neon(process.env.GLOBAL_DATABASE_URL)
  : (() => {
      throw new Error('GLOBAL_DATABASE_URL environment variable is not set. Please configure your database connection.')
    })()
