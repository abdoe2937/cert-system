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
router.get('/download', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ message: "No URL provided" });

    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)$/);
    if (!match) return res.status(400).json({ message: "Invalid URL" });

    const publicId = match[1];

    // ✅ استخدم Cloudinary SDK مباشرة عشان يجيب الـ buffer
    const result = await cloudinary.api.resource(publicId, { resource_type: 'raw' });
    
    const https = require('https');
    https.get(result.secure_url + "?invalidate=true", (stream) => {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="document.pdf"');
      stream.pipe(res);
    }).on('error', (err) => {
      res.status(500).json({ message: err.message });
    });

  } catch (error) {
    console.error("Download error:", error.message);
    res.status(500).json({ message: "Download failed" });
  }
});

module.exports = router;