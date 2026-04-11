const Complaint = require('../models/Complaint');

// ── Student ──────────────────────────────────────────────────────────────────

// POST /api/complaints — submit new complaint
const submitComplaint = async (req, res) => {
  try {
    const { subject, message } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ success: false, message: 'الموضوع والرسالة مطلوبان' });
    }
    const complaint = await Complaint.create({
      userId: req.user._id,
      subject,
      message,
    });
    res.status(201).json({ success: true, message: 'تم إرسال الشكوى بنجاح', complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/complaints/mine — get my complaints
const getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: complaints.length, complaints });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Admin ────────────────────────────────────────────────────────────────────

// GET /api/complaints/admin/all — get all complaints
const getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate('userId', 'fullName email studentCode')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: complaints.length, complaints });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/complaints/admin/:id/reply — reply and change status
const replyToComplaint = async (req, res) => {
  try {
    const { adminReply, status } = req.body;
    if (!adminReply) {
      return res.status(400).json({ success: false, message: 'الرد مطلوب' });
    }
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      {
        adminReply,
        status: status || 'resolved',
        repliedAt: new Date(),
      },
      { new: true }
    ).populate('userId', 'fullName email studentCode');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'الشكوى غير موجودة' });
    }
    res.json({ success: true, message: 'تم الرد بنجاح', complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/complaints/admin/:id/status — change status only
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('userId', 'fullName email studentCode');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'الشكوى غير موجودة' });
    }
    res.json({ success: true, complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { submitComplaint, getMyComplaints, getAllComplaints, replyToComplaint, updateStatus };
