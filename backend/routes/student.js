const express = require('express');
const router = express.Router();
const Certificate = require('../models/Certificate');
const { protect } = require('../middleware/auth');
const cloudinary = require('cloudinary').v2;

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
    const fixedUrl = user.cardUrl.replace(
      /^https?:\/\/localhost:\d+/,
      process.env.BACKEND_URL || "https://cert-system-production.up.railway.app"
    );
    res.json({ success: true, cardUrl: fixedUrl });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET /api/student/download?url=...
router.get('/download', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ message: "No URL provided" });

    // ✅ أضف fl_attachment للـ URL مباشرة
    const downloadUrl = url.replace('/upload/', '/upload/fl_attachment/');
    
    console.log("Download URL:", downloadUrl);

    const https = require('https');
    https.get(downloadUrl, (stream) => {
      console.log("Status:", stream.statusCode);
      if (stream.statusCode !== 200) {
        return res.status(500).json({ message: `Error: ${stream.statusCode}` });
      }
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="document.pdf"');
      stream.pipe(res);
    }).on('error', (err) => {
      res.status(500).json({ message: err.message });
    });

  } catch (error) {
    res.status(500).json({ message: "Download failed" });
  }
});

module.exports = router;