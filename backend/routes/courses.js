const express = require('express');
const router  = express.Router();
const {
  getAllCourses, createCourse, updateCourse, deleteCourse,
  getSuggestedCourses, getAvailableCourses, enrollInCourse, getMyCourseHistory,
} = require('../controllers/courseController');
const { protect, adminOnly } = require('../middleware/auth');

// ── Student ──────────────────────────────────────────────────
router.get('/suggested',    protect, getSuggestedCourses);
router.get('/available',    protect, getAvailableCourses);
router.post('/enroll',      protect, enrollInCourse);
router.get('/my-history',   protect, getMyCourseHistory);

// ── Admin ────────────────────────────────────────────────────
router.get('/admin/all',    protect, adminOnly, getAllCourses);
router.post('/admin',       protect, adminOnly, createCourse);
router.patch('/admin/:id',  protect, adminOnly, updateCourse);
router.delete('/admin/:id', protect, adminOnly, deleteCourse);

module.exports = router;
