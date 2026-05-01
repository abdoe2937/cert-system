const express = require('express');
const router = express.Router();
const Certificate = require('../models/Certificate');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET /api/student/certificates
router.get('/certificates', async (req, res) => {
  try {
    const certs = await Certificate.find({ userId: req.user._id }).sort({ issuedAt: -1 });
    res.json({ success: true, count: certs.length, certificates: certs });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET /api/student/my-card
router.get('/my-card', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.cardUrl) {
      return res.status(404).json({ success: false, message: 'لم يتم إنشاء الكارنيه بعد' });
    }
    res.json({ success: true, cardUrl: user.cardUrl });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET /api/student/download-certificate/:id
router.get('/download-certificate/:id', async (req, res) => {
  try {
    const cert = await Certificate.findOne({
      _id: req.params.id,
      userId: req.user._id, // ✅ أمان - الطالب يقدر يحمل شهادته بس
    });

    if (!cert) {
      return res.status(404).json({ success: false, message: 'الشهادة غير موجودة' });
    }

    if (!cert.pdfData) {
      return res.status(404).json({ success: false, message: 'ملف الشهادة غير متاح' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificate_${req.user.studentCode}.pdf"`);
    res.send(cert.pdfData);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET /api/student/download-card
router.get('/download-card', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.cardData) {
      return res.status(404).json({ success: false, message: 'الكارنيه غير متاح بعد' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="card_${user.studentCode}.pdf"`);
    res.send(user.cardData);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;