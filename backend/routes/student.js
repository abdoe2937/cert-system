const express  = require('express');
const router   = express.Router();
const Certificate = require('../models/Certificate');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET my certificates
router.get('/certificates', async (req, res) => {
  try {
    const certs = await Certificate.find({ userId: req.user._id }).sort({ issuedAt: -1 });
    res.json({ success: true, count: certs.length, certificates: certs });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET my ID card
router.get('/my-card', async (req, res) => {
  try {
    const user = await require('../models/User').findById(req.user._id);
    if (!user.cardUrl) {
      return res.status(404).json({ success: false, message: 'لم يتم إنشاء الكارنيه بعد' });
    }

    // ✅ صلح أي localhost URL قديم
    const fixedUrl = user.cardUrl.replace(
      /^https?:\/\/localhost:\d+/,
      process.env.BACKEND_URL || "https://cert-system-production.up.railway.app"
    );

    res.json({ success: true, cardUrl: fixedUrl });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;