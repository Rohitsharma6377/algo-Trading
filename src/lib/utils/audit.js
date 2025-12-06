const AuditLog = require('@/models/AuditLog');
const connectDB = require('@/lib/db');

/**
 * Create audit log entry
 * @param {Object} params - Audit log parameters
 */
async function createAuditLog({
  userId,
  userEmail,
  action,
  resource,
  resourceId,
  details = {},
  ipAddress,
  userAgent,
  status = 'success',
  severity = 'low',
}) {
  try {
    await connectDB();

    await AuditLog.create({
      userId,
      userEmail,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
      status,
      severity,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit logging should not break main flow
  }
}

/**
 * Get audit logs with filters
 */
async function getAuditLogs({
  userId,
  action,
  startDate,
  endDate,
  severity,
  limit = 100,
  skip = 0,
}) {
  await connectDB();

  const query = {};

  if (userId) query.userId = userId;
  if (action) query.action = action;
  if (severity) query.severity = severity;
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  const logs = await AuditLog.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(skip)
    .populate('userId', 'email name')
    .lean();

  const total = await AuditLog.countDocuments(query);

  return { logs, total };
}

/**
 * Get audit statistics
 */
async function getAuditStats(days = 7) {
  await connectDB();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const stats = await AuditLog.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);

  return stats;
}

module.exports = {
  createAuditLog,
  getAuditLogs,
  getAuditStats,
};
