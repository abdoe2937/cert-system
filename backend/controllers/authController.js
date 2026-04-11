const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { appendUserToExcel } = require('../utils/excelService');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// @route  POST /api/auth/register
const register = async (req, res) => {
  try {
    const {
      fullName, email, password, phone,
      address, nationalId, governorate, gender,
      education, job, courseName, experienceLevel, goal,
      hearingType, // ضيف السطر ده 👈
    } = req.body;

    // Required fields check
    if (!fullName || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'الاسم والبريد وكلمة المرور والهاتف مطلوبون',
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'البريد الإلكتروني مسجل مسبقاً' });
    }

    const user = await User.create({
      fullName, email, password, phone,
      address, nationalId, governorate, gender,
      education, job, courseName, experienceLevel, goal,
      hearingType,
    });

    // Save to Excel in background (don't block response)
    const savedUser = await User.findById(user._id);
console.log('User data:', savedUser);
appendUserToExcel(savedUser)
  .then(() => console.log('✅ Excel updated'))
  .catch((err) => console.error('❌ Excel error:', err.message));
    const token = generateToken(user._id);
    res.status(201).json({ success: true, message: 'تم التسجيل بنجاح', token, user });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route  POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'البريد وكلمة المرور مطلوبان' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة' });
    }

    const token = generateToken(user._id);
    res.json({ success: true, message: 'تم الدخول بنجاح', token, user: user.toJSON() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route  GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

module.exports = { register, login, getMe };
