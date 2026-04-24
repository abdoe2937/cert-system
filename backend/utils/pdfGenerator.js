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

const W = 1123;
const H = 794;
const darkText = rgb(0.12, 0.18, 0.28);

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
      console.error("Failed to load image:", e.message);
      return null;
    }
  }

  const fullPath = path.join(__dirname, "..", imagePath.replace(/^\//, ""));
  if (!fs.existsSync(fullPath)) {
    console.log("Image not found:", fullPath);
    return null;
  }

  const ext = path.extname(fullPath).toLowerCase();
  const bytes = fs.readFileSync(fullPath);
  return ext === ".png" ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
};

const generateCertificatePDF = async ({
  studentName,
  profileImage,
  courseName,
  studentCode,
  issuedAt,
}) => {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);

  const templatePath = path.join(
    __dirname,
    "..",
    "assets",
    "certificate-template.png",
  );
  if (!fs.existsSync(templatePath)) {
    throw new Error("Certificate template not found");
  }
  const templateBytes = fs.readFileSync(templatePath);
  const templateImg = await doc.embedPng(templateBytes);

  const page = doc.addPage([W, H]);
  page.drawImage(templateImg, { x: 0, y: 0, width: W, height: H });

  let font;
  const fontPath = path.join(
    __dirname,
    "..",
    "assets",
    "fonts",
    "Cairo-Bold.ttf",
  );
  try {
    font = fs.existsSync(fontPath)
      ? await doc.embedFont(fs.readFileSync(fontPath))
      : await doc.embedFont(StandardFonts.HelveticaBold);
  } catch {
    font = await doc.embedFont(StandardFonts.HelveticaBold);
  }

  const name = studentName || "";
  page.drawText(name, {
    x: W * 0.5 - font.widthOfTextAtSize(name, 36) / 2,
    y: H * 0.42,
    size: 36,
    font,
    color: darkText,
  });

  const course = courseName || "";
  page.drawText(course, {
    x: W * 0.5 - font.widthOfTextAtSize(course, 26) / 2,
    y: H * 0.34,
    size: 26,
    font,
    color: darkText,
  });

  const dateStr = issuedAt
    ? new Date(issuedAt).toLocaleDateString("en-GB")
    : new Date().toLocaleDateString("en-GB");

  page.drawText(dateStr, {
    x: W * 0.440,
    y: H * 0.287,
    size: 16,
    font,
    color: darkText,
  });

  page.drawText(studentCode || "", {
    x: W * 0.440,
    y: H * 0.240,
    size: 16,
    font,
    color: darkText,
  });

  if (profileImage) {
    const img = await loadImage(doc, profileImage);
    if (img) {
      const size = W * 0.09;
      page.drawImage(img, {
        x: W * 0.8424 - size / 2,
        y: H * 0.24 - size / 2,
        width: size,
        height: size,
      });
    }
  }

  // ── رفع على Cloudinary بدل الحفظ على الـ disk ──
  const pdfBytes = await doc.save();

  const uploadResult = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: "certificates",
        public_id: `cert_${studentCode || Date.now()}`,
        format: "pdf",
      },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(Buffer.from(pdfBytes));
  });

  return uploadResult.secure_url; // ← Cloudinary URL دايم شغال
};

module.exports = { generateCertificatePDF };