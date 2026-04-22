const path = require("path");
const fs = require("fs");
const User = require("../models/User");
const Certificate = require("../models/Certificate");
const { generateCertificatePDF } = require("../utils/pdfGenerator");
const { generateIDCard } = require("../utils/idCardGenerator");
const { EXCEL_PATH } = require("../utils/excelService");

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
    if (!user)
      return res.status(404).json({ success: false, message: "المستخدم غير موجود" });
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
    if (!user)
      return res.status(404).json({ success: false, message: "المستخدم غير موجود" });
    res.json({ success: true, message: "تم تحديد الطالب كمكتمل", user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin/send-certificate/:id
const sendCertificate = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user)
      return res.status(404).json({ success: false, message: "المستخدم غير موجود" });

    const courseName =
      req.body.courseName || user.courseName || "Volunteering Program";

    const pdfUrl = await generateCertificatePDF({
      studentName: user.fullNameEn || user.fullName || user.fullNameAr,
      studentNameAr: user.fullNameAr,
      profileImage: user.profileImage,
      courseName,
      studentCode: user.studentCode,
      issuedAt: new Date(),
    });

    const certificate = await Certificate.create({
      userId: user._id,
      courseName,
      pdfUrl,
      issuedAt: new Date(),
    });

    await User.findByIdAndUpdate(user._id, { isCompleted: true });

    res.status(201).json({ success: true, message: "تم إرسال الشهادة بنجاح", certificate });
  } catch (error) {
    console.error("Send certificate error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin/generate-card/:id
const generateCard = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user)
      return res.status(404).json({ success: false, message: "المستخدم غير موجود" });

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
  exportExcel,
};