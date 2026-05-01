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

    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)$/);
    if (!match) return res.status(400).json({ message: "Invalid URL" });

    const publicId = match[1];
    console.log("Downloading:", publicId);

    const signedUrl = cloudinary.url(publicId, {
      resource_type: 'raw',
      sign_url: true,
      secure: true,
      expires_at: Math.floor(Date.now() / 1000) + 300,
    });

    console.log("Signed URL:", signedUrl);

    const https = require('https');
    const request = https.get(signedUrl, (stream) => {
      console.log("Cloudinary status:", stream.statusCode);
      if (stream.statusCode !== 200) {
        return res.status(500).json({ message: `Cloudinary error: ${stream.statusCode}` });
      }
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="document.pdf"');
      stream.pipe(res);
    });

    request.on('error', (err) => {
      console.error("Request error:", err.message);
      res.status(500).json({ message: "Download failed" });
    });

  } catch (error) {
    console.error("Download error:", error.message);
    res.status(500).json({ message: "Download failed" });
  }
});

module.exports = router;