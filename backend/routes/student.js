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

    const https = require('https');
    
    // ✅ استخدم الـ URL مباشرة مع الـ API credentials في الـ header
    const options = {
      hostname: 'res.cloudinary.com',
      path: new URL(url).pathname,
      method: 'GET',
      auth: `${process.env.CLOUDINARY_API_KEY}:${process.env.CLOUDINARY_API_SECRET}`
    };

    const request = https.request(options, (stream) => {
      console.log("Status:", stream.statusCode);
      if (stream.statusCode !== 200) {
        return res.status(500).json({ message: `Error: ${stream.statusCode}` });
      }
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="document.pdf"');
      stream.pipe(res);
    });

    request.on('error', (err) => {
      res.status(500).json({ message: err.message });
    });

    request.end();

  } catch (error) {
    res.status(500).json({ message: "Download failed" });
  }
});

module.exports = router;