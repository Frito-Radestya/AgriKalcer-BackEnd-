/**
 * Extract pagination parameters from request query
 * @param {Object} req - Express request object
 * @returns {Object} { page, limit, offset }
 */
export function getPaginationParams(req) {
  const page = Math.max(1, parseInt(req.query.page) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50))
  const offset = (page - 1) * limit
  return { page, limit, offset }
}

/**
 * Get total count for pagination metadata
 * @param {Object} db - Database query function
 * @param {string} table - Table name
 * @param {string} whereClause - WHERE clause (e.g., 'user_id = $1')
 * @param {Array} params - Query parameters
 * @returns {Promise<number>} Total count
 */
export async function getTotalCount(db, table, whereClause = '', params = []) {
  const query = whereClause 
    ? `SELECT COUNT(*) as total FROM ${table} WHERE ${whereClause}`
    : `SELECT COUNT(*) as total FROM ${table}`
  
  const { rows } = await db.query(query, params)
  return parseInt(rows[0].total)
}

/**
 * Format pagination response
 * @param {Array} data - Data array
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @returns {Object} Paginated response
 */
export function formatPaginationResponse(data, page, limit, total) {
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  }
}

