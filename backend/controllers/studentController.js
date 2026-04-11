const Certificate = require('../models/Certificate');

// @desc    Get certificates for logged-in student
// @route   GET /api/student/certificates
// @access  Private (student)
const getMyCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find({ userId: req.user._id }).sort({ issuedAt: -1 });
    res.json({ success: true, count: certificates.length, certificates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getMyCertificates };
