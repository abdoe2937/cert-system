const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const fontkit = require("@pdf-lib/fontkit");
const fs = require("fs");
const path = require("path");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const W = 1619;
const H = 971;

const scaleX = (x) => (x * W) / 1393;
const scaleY = (y) => H - (y * H) / 878;

const loadImage = async (doc, imagePath) => {
  if (!imagePath) return null;

  if (imagePath.startsWith("http")) {
    try {
      const response = await fetch(imagePath);
      const arrayBuffer = await response.arrayBuffer();
      const ext = imagePath.toLowerCase().includes(".png") ? ".png" : ".jpg";
      return ext === ".png"
        ? await doc.embedPng(arrayBuffer)
        : await doc.embedJpg(arrayBuffer);
    } catch (e) {
      console.error("Failed to load Cloudinary image:", e.message);
      return null;
    }
  }

  const fullPath = path.join(__dirname, "..", imagePath.replace(/^\//, ""));
  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const ext = path.extname(fullPath).toLowerCase();
  const bytes = fs.readFileSync(fullPath);
  return ext === ".png" ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
};

const generateIDCard = async ({ user, overrides = {} }) => {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);

  const templatePath = path.join(__dirname, "..", "assets", "card-template.png");
  if (!fs.existsSync(templatePath)) {
    throw new Error("Card template not found");
  }
  const templateBytes = fs.readFileSync(templatePath);
  const templateImg = await doc.embedPng(templateBytes);

  const page = doc.addPage([W, H]);
  page.drawImage(templateImg, { x: 0, y: 0, width: W, height: H });

  let font;
  const fontPath = path.join(__dirname, "..", "assets", "fonts", "Cairo-Bold.ttf");
  try {
    font = fs.existsSync(fontPath)
      ? await doc.embedFont(fs.readFileSync(fontPath))
      : await doc.embedFont(StandardFonts.HelveticaBold);
  } catch {
    font = await doc.embedFont(StandardFonts.HelveticaBold);
  }

  const navy = rgb(0.06, 0.13, 0.27);
  const textSize = 26;

  const name = overrides.fullNameEn || user.fullNameEn || user.fullName || "";
  const studentCode = overrides.studentCode || user.studentCode || "";
  const nationalId = overrides.nationalId || user.nationalId || "";
  const enrollmentDate = overrides.enrollmentDate || (user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-GB") : "");
  const status = user.hearingType === "deaf" ? "Deaf" : user.hearingType === "interpreter" ? "Sign Lang. Interpreter" : "Hearing";

  page.drawText(name, { x: scaleX(550), y: scaleY(523), size: textSize, font, color: navy });
  page.drawText(status, { x: scaleX(550), y: scaleY(573), size: 22, font, color: navy });
  page.drawText(nationalId, { x: scaleX(550), y: scaleY(624), size: 18, font, color: navy });
  page.drawText(studentCode, { x: scaleX(550), y: scaleY(676), size: 18, font, color: navy });
  page.drawText(enrollmentDate, { x: scaleX(550), y: scaleY(727), size: 18, font, color: navy });

  if (user.profileImage) {
    const img = await loadImage(doc, user.profileImage);
    if (img) {
      const boxW = 220;
      const boxH = 280;
      page.drawImage(img, { x: scaleX(1130) - boxW / 2, y: scaleY(510) - boxH / 2, width: boxW, height: boxH });
    }
  }

  // ── رفع على Cloudinary بدل الحفظ على الـ disk ──
  const pdfBytes = await doc.save();

  const uploadResult = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: "cards",
        public_id: `card_${user.studentCode || Date.now()}`,
        format: "pdf",
      },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(Buffer.from(pdfBytes));
  });

  return uploadResult.secure_url; // ← Cloudinary URL دايم شغال
};

module.exports = { generateIDCard };