const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { appendUserToExcel } = require("../utils/excelService");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const {
      fullNameAr,
      fullNameEn,
      email,
      password,
      phone,
      address,
      nationalId,
      governorate,
      gender,
      hearingType,
      education,
      job,
      courseName,
      experienceLevel,
      goal,
    } = req.body;

    // Required fields
    if (!fullNameAr || !fullNameEn || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message:
          "الاسم بالعربية والإنجليزية والبريد وكلمة المرور والهاتف مطلوبون",
      });
    }

    // Profile image required
    // بعد ✅
    const profileImage = req.file
      ? `/uploads/profiles/${req.file.filename}`
      : null;

    const existing = await User.findOne({ email });
    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: "البريد الإلكتروني مسجل مسبقاً" });
    }


    const user = await User.create({
      fullNameAr,
      fullNameEn,
      fullName: fullNameEn,
      email,
      password,
      phone,
      profileImage,
      address,
      nationalId,
      governorate,
      gender,
      hearingType,
      education,
      job,
      courseName,
      experienceLevel,
      goal,
    });

    // Save to Excel (background)
    appendUserToExcel(user)
      .then(() => console.log(`✅ Excel: ${user.fullNameEn}`))
      .catch((err) => console.error("❌ Excel error:", err.message));

    const token = generateToken(user._id);
    res
      .status(201)
      .json({ success: true, message: "تم التسجيل بنجاح", token, user });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "البريد وكلمة المرور مطلوبان" });
    }
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res
        .status(401)
        .json({ success: false, message: "بيانات الدخول غير صحيحة" });
    }
    const token = generateToken(user._id);
    res.json({
      success: true,
      message: "تم الدخول بنجاح",
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

module.exports = { register, login, getMe };
