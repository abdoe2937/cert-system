const express = require('express');
const router = express.Router();
const {
  submitComplaint,
  getMyComplaints,
  getAllComplaints,
  replyToComplaint,
  updateStatus,
} = require('../controllers/complaintController');
const { protect, adminOnly } = require('../middleware/auth');

// Student routes
router.post('/',        protect, submitComplaint);
router.get('/mine',     protect, getMyComplaints);

// Admin routes
router.get('/admin/all',           protect, adminOnly, getAllComplaints);
router.patch('/admin/:id/reply',   protect, adminOnly, replyToComplaint);
router.patch('/admin/:id/status',  protect, adminOnly, updateStatus);

module.exports = router;
