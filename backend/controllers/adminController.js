const fs = require("fs");
const path = require("path");
const User = require("../models/User");
const Certificate = require("../models/Certificate");
const { generateCertificatePDF } = require("../utils/pdfGenerator");
const { generateIDCard } = require("../utils/idCardGenerator");
const { sendCertificateEmail, sendCardEmail } = require("../utils/emailService");
const { uploadPDF } = require("../utils/cloudinary");

// GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: "user" }).sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "المستخدم غير موجود" });
    }
    const certificates = await Certificate.find({ userId: user._id });
    res.json({ success: true, user, certificates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/admin/complete/:id
const markCompleted = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isCompleted: true }, { new: true });
    if (!user) {
      return res.status(404).json({ success: false, message: "المستخدم غير موجود" });
    }
    res.json({ success: true, message: "تم تحديد الطالب كمكتمل", user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin/send-certificate/:id
const sendCertificate = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "المستخدم غير موجود" });

    const courseName = req.body.courseName || user.courseName || "Volunteering Program";

    const relativePath = await generateCertificatePDF({
      studentName: user.fullNameEn || user.fullName || user.fullNameAr,
      profileImage: user.profileImage,
      courseName,
      studentCode: user.studentCode,
      issuedAt: new Date(),
    });

    const filename = path.basename(relativePath);
    const pdfPath = path.join(__dirname, "..", "certificates", filename);
    const pdfBuffer = fs.readFileSync(pdfPath);

    // ✅ ارفع على Cloudinary بدل BASE_URL
    const publicId = `certificates/${filename.replace('.pdf', '')}`;
const pdfUrl = await uploadPDF(pdfBuffer, publicId);

    const certificate = await Certificate.create({
      userId: user._id,
      courseName,
      pdfUrl,
      issuedAt: new Date(),
    });

    await User.findByIdAndUpdate(user._id, { isCompleted: true });

    // ✅ ابعت الشهادة على الجيميل
    try {
      await sendCertificateEmail({
        to: user.email,
        studentName: user.fullNameEn || user.fullName,
        courseName,
        pdfBuffer,
        studentCode: user.studentCode,
      });
      console.log("✅ Certificate email sent to:", user.email);
    } catch (emailErr) {
      console.warn("⚠️ Certificate email failed:", emailErr.message);
    }

    res.status(201).json({ success: true, message: "تم إرسال الشهادة بنجاح", certificate });
  } catch (error) {
    console.error("Send certificate error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin/send-card/:id
const sendCard = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "المستخدم غير موجود" });

    const overrides = req.body && Object.keys(req.body).length > 0 ? req.body : {};

    // ✅ احفظ التعديلات في الـ DB
    if (Object.keys(overrides).length > 0) {
      await User.findByIdAndUpdate(user._id, { $set: overrides });
    }

    const pdfBytes = await generateIDCard({
      user: { ...user.toObject(), ...overrides },
      overrides: {},
    });

    // ✅ ارفع على Cloudinary بدل السيرفر
    const cardUrl = await uploadPDF(Buffer.from(pdfBytes), `cards/card_${user.studentCode}`);
    await User.findByIdAndUpdate(user._id, { cardUrl });

    // ✅ ابعت الكارنيه على الجيميل
    try {
      await sendCardEmail({
        to: user.email,
        studentName: user.fullNameEn || user.fullName,
        pdfBuffer: Buffer.from(pdfBytes),
        studentCode: user.studentCode,
      });
      console.log("✅ Card email sent to:", user.email);
    } catch (emailErr) {
      console.warn("⚠️ Card email failed:", emailErr.message);
    }

    res.json({ success: true, message: "تم إرسال الكارنيه بنجاح", cardUrl });
  } catch (error) {
    console.error("Send card error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin/generate-card/:id
const generateCard = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "المستخدم غير موجود" });
    }

    const overrides = req.body && Object.keys(req.body).length > 0 ? req.body : {};
    const pdfBytes = await generateIDCard({ user, overrides });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="card_${user.studentCode}.pdf"`);
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error("Generate card error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const exportExcel = (req, res) => {
  const EXCEL_PATH = require("../utils/excelService").EXCEL_PATH;
  if (!fs.existsSync(EXCEL_PATH)) {
    return res.status(404).json({ success: false, message: "No Excel file found yet" });
  }
  res.download(EXCEL_PATH, "students.xlsx");
};

module.exports = {
  getAllUsers,
  getUserById,
  markCompleted,
  sendCertificate,
  generateCard,
  sendCard,
  exportExcel,
};