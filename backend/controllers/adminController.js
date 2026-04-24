const fs = require("fs");
const path = require("path");
const User = require("../models/User");
const Certificate = require("../models/Certificate");
const { generateCertificatePDF } = require("../utils/pdfGenerator");
const { generateIDCard } = require("../utils/idCardGenerator");

const BASE_URL = process.env.BACKEND_URL || "http://localhost:5000";

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

    // generateCertificatePDF بيحفظ الملف ويرجع الـ relative path زي /certificates/cert_XX.pdf
    const relativePath = await generateCertificatePDF({
      studentName: user.fullNameEn || user.fullName || user.fullNameAr,
      profileImage: user.profileImage,
      courseName,
      studentCode: user.studentCode,
      issuedAt: new Date(),
    });

    const filename = path.basename(relativePath);
    const pdfUrl = `${BASE_URL}/certificates/${filename}`;

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

// POST /api/admin/send-card/:id
const sendCard = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "المستخدم غير موجود" });

    const pdfBytes = await generateIDCard({ user, overrides: {} });

    const cardsDir = path.join(__dirname, "..", "cards");
    if (!fs.existsSync(cardsDir)) fs.mkdirSync(cardsDir, { recursive: true });

    const filename = `card_${user.studentCode}.pdf`;
    const filepath = path.join(cardsDir, filename);
    fs.writeFileSync(filepath, Buffer.from(pdfBytes));

    const cardUrl = `${BASE_URL}/cards/${filename}`;

    await User.findByIdAndUpdate(user._id, { cardUrl });

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