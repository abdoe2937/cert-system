const Course      = require('../models/Course');
const User        = require('../models/User');
const Certificate = require('../models/Certificate');

// ── Admin ─────────────────────────────────────────────────────────────────────

const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find().sort({ order: 1, createdAt: -1 });
    res.json({ success: true, count: courses.length, courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createCourse = async (req, res) => {
  try {
    const { title, description, instructor, duration, link, thumbnail,
            targetLevel, targetGoal, targetHearingType, isAvailableForEnrollment, order } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'عنوان الكورس مطلوب' });
    const course = await Course.create({
      title, description, instructor, duration, link, thumbnail,
      targetLevel, targetGoal, targetHearingType, isAvailableForEnrollment, order,
    });
    res.status(201).json({ success: true, message: 'تم إضافة الكورس', course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!course) return res.status(404).json({ success: false, message: 'الكورس غير موجود' });
    res.json({ success: true, message: 'تم التحديث', course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteCourse = async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'تم الحذف' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Student — Suggested Courses ───────────────────────────────────────────────

const getSuggestedCourses = async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .limit(6);
    res.json({ success: true, count: courses.length, courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Student — Enrollment ──────────────────────────────────────────────────────

// GET /api/courses/available — كورسات متاحة للتقديم
const getAvailableCourses = async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true, isAvailableForEnrollment: true })
      .select('title description instructor duration thumbnail')
      .sort({ order: 1 });
    res.json({ success: true, courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/courses/enroll — الطالب يتقدم على كورس جديد
const enrollInCourse = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // لازم يكون خلص الكورس الحالي وأخد شهادة
    if (user.courseName && !user.isCompleted) {
      return res.status(400).json({
        success: false,
        message: 'لازم تخلص الكورس الحالي وتاخد شهادتك الأول',
      });
    }

    // تحقق إن عنده شهادة لو عنده كورس قبلي
    if (user.courseName && user.isCompleted) {
      const cert = await Certificate.findOne({ userId: user._id, courseName: user.courseName });
      if (!cert) {
        return res.status(400).json({
          success: false,
          message: 'لازم تاخد شهادة الكورس الحالي الأول',
        });
      }

      // حفظ الكورس القديم في التاريخ
      user.courseHistory.push({
        courseName:  user.courseName,
        completedAt: new Date(),
        certId:      cert._id,
      });
    }

    const { courseName } = req.body;
    if (!courseName?.trim()) {
      return res.status(400).json({ success: false, message: 'اسم الكورس مطلوب' });
    }

    // تسجيل في الكورس الجديد
    user.courseName  = courseName;
    user.isCompleted = false;
    await user.save();

    res.json({ success: true, message: `تم التسجيل في "${courseName}" بنجاح!`, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/courses/my-history — تاريخ كورسات الطالب
const getMyCourseHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('courseHistory.certId', 'pdfUrl issuedAt');
    res.json({ success: true, history: user.courseHistory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllCourses, createCourse, updateCourse, deleteCourse,
  getSuggestedCourses, getAvailableCourses, enrollInCourse, getMyCourseHistory,
};
