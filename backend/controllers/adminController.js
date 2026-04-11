const User = require('../models/User');
const Certificate = require('../models/Certificate');
const { generateCertificate } = require('../utils/pdfGenerator'); // ✅ صحّحنا الاسم
const path = require('path');
const fs = require('fs');

// GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    const certificates = await Certificate.find({ userId: user._id });
    res.json({ success: true, user, certificates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/admin/complete/:id
const markCompleted = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isCompleted: true },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    res.json({ success: true, message: 'تم تحديد الطالب كمكتمل', user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin/send-certificate/:id
const sendCertificate = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });

    const courseName = req.body.courseName || user.courseName || 'برنامج التطوع';
    
    // كود الشهادة
    const certificateCode = user.studentCode || `CERT-${Date.now()}`;
    
    // التاريخ
    const date = new Date().toLocaleDateString('ar-EG');

    // ✅ توليد الـ PDF
    const pdfBytes = await generateCertificate({
      studentName: user.fullName,
      courseName,
      date,
      certificateCode,
    });

    // ✅ حفظ الـ PDF في فولدر certificates
    const fileName = `certificate-${user._id}-${Date.now()}.pdf`;
    const filePath = path.join(__dirname, '../certificates', fileName);
    
    // تأكد إن الفولدر موجود
    if (!fs.existsSync(path.join(__dirname, '../certificates'))) {
      fs.mkdirSync(path.join(__dirname, '../certificates'));
    }
    
    fs.writeFileSync(filePath, pdfBytes);

    const pdfUrl = `/certificates/${fileName}`;

    const certificate = await Certificate.create({
      userId: user._id,
      courseName,
      pdfUrl,
      issuedAt: new Date(),
    });

    await User.findByIdAndUpdate(user._id, { isCompleted: true });

    res.status(201).json({ success: true, message: 'تم إرسال الشهادة بنجاح', certificate });
  } catch (error) {
    console.error('Send certificate error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAllUsers, getUserById, markCompleted, sendCertificate };