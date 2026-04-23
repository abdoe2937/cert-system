const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const fontkit = require("@pdf-lib/fontkit");
const fs = require("fs");
const path = require("path");

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

  const templatePath = path.join(__dirname, "..", "assets", "certificate-template.png");
  if (!fs.existsSync(templatePath)) {
    throw new Error("Certificate template not found");
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

  // ✅ الاسم الإنجليزي فقط - تحت AWARDED TO
  const name = studentName || "";
  page.drawText(name, {
    x: W * 0.5 - font.widthOfTextAtSize(name, 36) / 2,
    y: H * 0.46,
    size: 36,
    font,
    color: darkText,
  });

  // ✅ اسم الكورس - تحت FOR SUCCESSFULLY COMPLETING THE
  const course = courseName || "";
  page.drawText(course, {
    x: W * 0.5 - font.widthOfTextAtSize(course, 26) / 2,
    y: H * 0.32,
    size: 26,
    font,
    color: darkText,
  });

  // ✅ Completion Date
  const dateStr = issuedAt
    ? new Date(issuedAt).toLocaleDateString("en-GB")
    : new Date().toLocaleDateString("en-GB");

  page.drawText(dateStr, {
    x: W * 0.565,
    y: H * 0.215,
    size: 16,
    font,
    color: darkText,
  });

  // ✅ Volunteer ID
  page.drawText(studentCode || "", {
    x: W * 0.565,
    y: H * 0.178,
    size: 16,
    font,
    color: darkText,
  });

  // ✅ Profile image
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

  // ✅ حفظ الملف محلياً (زي ما كان شغال)
  const pdfBytes = await doc.save();
  const certsDir = path.join(__dirname, "..", "certificates");
  if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir, { recursive: true });
  }

  const filename = `cert_${studentCode || Date.now()}.pdf`;
  const filepath = path.join(certsDir, filename);
  fs.writeFileSync(filepath, pdfBytes);

  return `/certificates/${filename}`;
};

module.exports = { generateCertificatePDF };