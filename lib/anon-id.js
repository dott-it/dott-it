import crypto from 'node:crypto'

/**
 * Compute a stable anonymised subject ID for the global plane.
 * @param {string} localId - Student local identifier within a tenant
 * @param {string} tenantId - Tenant identifier
 * @returns {string}
 */
export function anonId(localId, tenantId) {
  const salt = process.env.HASH_SALT || ''
  return crypto
    .createHmac('sha256', salt)
    .update(`${tenantId}:${localId}`)
    .digest('hex')
}
