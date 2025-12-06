const bcrypt = require('bcrypt');
const connectDB = require('@/lib/db');
const User = require('@/models/User');
const { createAuditLog } = require('@/lib/utils/audit');

/**
 * POST /api/admin/seed
 * Seed default admin user
 * ⚠️  Run this manually once during initial setup
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@algotrader.com';
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@12345';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      return res.status(400).json({ 
        error: 'Admin user already exists',
        email: adminEmail,
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // Create admin user
    const admin = await User.create({
      email: adminEmail,
      password: hashedPassword,
      name: 'Admin',
      role: 'admin',
      provider: 'local',
      emailVerified: true,
      isActive: true,
    });

    await createAuditLog({
      userId: admin._id,
      userEmail: admin.email,
      action: 'ADMIN_SEEDED',
      severity: 'high',
      status: 'success',
    });

    console.log('✅ Admin user created successfully');
    console.log(`Email: ${adminEmail}`);
    console.log('⚠️  CHANGE THE DEFAULT PASSWORD IMMEDIATELY!');

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      email: adminEmail,
      warning: 'CHANGE THE DEFAULT PASSWORD IMMEDIATELY!',
    });
  } catch (error) {
    console.error('Seed admin error:', error);
    res.status(500).json({ 
      error: 'Failed to seed admin',
      message: error.message,
    });
  }
}
