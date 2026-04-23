const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const fontkit = require("@pdf-lib/fontkit");
const fs = require("fs");
const path = require("path");

const W = 1123;
const H = 794;
const darkText = rgb(0.12, 0.18, 0.28);

// Load image from local path OR Cloudinary URL
const loadImage = async (doc, imagePath) => {
  if (!imagePath) return null;
  
  if (imagePath.startsWith("http")) {
    try {
      const response = await fetch(imagePath);
      const arrayBuffer = await response.arrayBuffer();
      const ext = imagePath.toLowerCase().includes(".png") ? ".png" : ".jpg";
      return ext === ".png" ? await doc.embedPng(arrayBuffer) : await doc.embedJpg(arrayBuffer);
    } catch (e) {
      console.error("Cloudinary image failed:", e.message);
      return null;
    }
  }
  
  const fullPath = path.join(__dirname, "..", imagePath.replace(/^\//, ""));
  if (!fs.existsSync(fullPath)) return null;
  
  const ext = path.extname(fullPath).toLowerCase();
  const bytes = fs.readFileSync(fullPath);
  return ext === ".png" ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
};

// Generate PDF - returns Buffer directly (no file saved!)
const generateCertificatePDF = async ({
  studentName,
  studentNameAr,
  profileImage,
  courseName,
  studentCode,
  issuedAt,
}) => {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);

  const templatePath = path.join(__dirname, "..", "assets", "certificate-template.png");
  if (!fs.existsSync(templatePath)) {
    // Use blank page if template missing
    const page = doc.addPage([W, H]);
  } else {
    const templateBytes = fs.readFileSync(templatePath);
    const templateImg = doc.embedPng(templateBytes);
    templateImg.scaleTo(W, H);
    const page = doc.addPage([W, H]);
    page.drawImage(templateImg, { x: 0, y: 0, width: W, height: H });
  }

  let font;
  const fontPath = path.join(__dirname, "..", "assets", "fonts", "Cairo-Bold.ttf");
  try {
    font = fs.existsSync(fontPath) 
      ? await doc.embedFont(fs.readFileSync(fontPath))
      : await doc.embedFont(StandardFonts.HelveticaBold);
  } catch {
    font = await doc.embedFont(StandardFonts.HelveticaBold);
  }

  // Student Name (English)
  const nameSize = 36;
  const nameWidth = font.widthOfTextAtSize(studentName || "", nameSize);
  page.drawText(studentName || "", {
    x: W * 0.5 - nameWidth / 2,
    y: H * 0.58,
    size: nameSize,
    font,
    color: darkText,
  });

  // Student Name (Arabic)
  const nameAr = studentNameAr || "";
  const nameArSize = 32;
  const nameArWidth = font.widthOfTextAtSize(nameAr, nameArSize);
  page.drawText(nameAr, {
    x: W * 0.5 - nameArWidth / 2,
    y: H * 0.52,
    size: nameArSize,
    font,
    color: darkText,
  });

  // Course Name
  page.drawText(courseName || "", {
    x: W * 0.5 - font.widthOfTextAtSize(courseName || "", 28) / 2,
    y: H * 0.44,
    size: 28,
    font,
    color: darkText,
  });

  // Issue Date
  const dateStr = issuedAt ? new Date(issuedAt).toLocaleDateString("en-GB") : new Date().toLocaleDateString("en-GB");
  page.drawText(dateStr, {
    x: W * 0.38,
    y: H * 0.18,
    size: 18,
    font,
    color: darkText,
  });

  // Profile Image
  if (profileImage) {
    const img = await loadImage(doc, profileImage);
    if (img) {
      const size = W * 0.09;
      page.drawImage(img, {
        x: W * 0.8424 - size / 2,
        y: H * 0.2400 - size / 2,
        width: size,
        height: size,
      });
    }
  }

  // Return PDF as Buffer (no file saved!)
  return await doc.save();
};

module.exports = { generateCertificatePDF };