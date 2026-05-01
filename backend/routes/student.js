const express = require('express');
const router = express.Router();
const axios = require('axios');
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

// GET /api/student/download?url=...
// ✅ Proxy downloads through backend to avoid Cloudinary 401
router.get('/download', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ message: "No URL provided" });

    console.log("Downloading from:", url); // ✅ log

    const https = require('https');
    const http = require('http');
    const client = url.startsWith('https') ? https : http;

    client.get(url, (cloudinaryRes) => {
      console.log("Cloudinary status:", cloudinaryRes.statusCode); // ✅ log
      
      if (cloudinaryRes.statusCode !== 200) {
        return res.status(500).json({ 
          message: `Cloudinary returned ${cloudinaryRes.statusCode}` 
        });
      }
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="document.pdf"');
      cloudinaryRes.pipe(res);
    }).on('error', (err) => {
      console.error("HTTPS error:", err.message); // ✅ log
      res.status(500).json({ message: "Download failed: " + err.message });
    });

  } catch (error) {
    console.error("Proxy download error:", error.message);
    res.status(500).json({ message: "Download failed" });
  }
});

module.exports = router;