/**
 * Seed script — creates the first admin user.
 * Run once: node scripts/seedAdmin.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const existing = await User.findOne({ email: 'admin@certify.com' });
    if (existing) {
      console.log('✅ Admin already exists:', existing.email);
      process.exit(0);
    }

    const admin = await User.create({
      fullName: 'Super Admin',
      fullNameEn: 'Super Admin',
      fullNameAr: 'سوبر ادمن',
      email: 'admin@certify.com',
      password: 'admin123456',
      phone: '01000000000',
      role: 'admin',
    });

    console.log('✅ Admin created successfully!');
    console.log('   Email   :', admin.email);
    console.log('   Password: admin123456');
    console.log('   Code    :', admin.studentCode);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
};

seed();
