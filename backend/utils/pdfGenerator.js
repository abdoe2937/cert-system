const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const fontkit = require("@pdf-lib/fontkit");
const fs = require("fs");
const path = require("path");

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

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

  // ── تحميل التمبليت ──────────────────────────────────────────
  const templatePath = path.join(
    __dirname,
    "..",
    "assets",
    "certificate-template.png",
  );
  const templateBytes = fs.readFileSync(templatePath);
  const templateImg = await doc.embedPng(templateBytes);

  const { width: W, height: H } = templateImg;
  const page = doc.addPage([W, H]);

  page.drawImage(templateImg, { x: 0, y: 0, width: W, height: H });

  // ── تحميل الفونت ────────────────────────────────────────────
  const fontPath = path.join(
    __dirname,
    "..",
    "assets",
    "fonts",
    "Cairo-Bold.ttf",
  );
  let font;
  try {
    const fontBytes = fs.readFileSync(fontPath);
    font = await doc.embedFont(fontBytes);
  } catch {
    font = await doc.embedFont(StandardFonts.HelveticaBold);
  }

  const darkText = rgb(0.1, 0.13, 0.27);
  const goldText = rgb(0.76, 0.6, 0.15);

  // ── اسم الطالب ──────────────────────────────────────────────
  const nameSize = W * 0.03;
  const nameW = font.widthOfTextAtSize(studentName, nameSize);
  page.drawText(studentName, {
    x: (W - nameW) / 2,
    y: H * 0.42, // ← نزلنا شوية من 0.4492
    size: nameSize,
    font,
    color: darkText,
  });

  // ── اسم الكورس ──────────────────────────────────────────────
  const courseSize = W * 0.022;
  const courseW = font.widthOfTextAtSize(courseName, courseSize);
  page.drawText(courseName, {
    x: (W - courseW) / 2,
    y: H * 0.3438,
    size: courseSize,
    font,
    color: goldText,
  });

  // ── تاريخ الإصدار ────────────────────────────────────────────
  const date = issuedAt
    ? new Date(issuedAt).toLocaleDateString("en-GB")
    : new Date().toLocaleDateString("en-GB");
  page.drawText(date, {
    x: W * 0.4635,
    y: H * 0.293,
    size: W * 0.018,
    font,
    color: darkText,
  });

  // ── كود الطالب ──────────────────────────────────────────────
  page.drawText(studentCode || "", {
    x: W * 0.4635,
    y: H * 0.2451,
    size: W * 0.018,
    font,
    color: darkText,
  });

  // ── صورة البروفايل ───────────────────────────────────────────
  if (profileImage) {
    const imgPath = path.join(__dirname, "..", profileImage.replace(/^\//, ""));
    if (fs.existsSync(imgPath)) {
      try {
        const imgBytes = fs.readFileSync(imgPath);
        const ext = path.extname(imgPath).toLowerCase();
        const img =
          ext === ".png"
            ? await doc.embedPng(imgBytes)
            : await doc.embedJpg(imgBytes);
        const size = W * 0.09;
        page.drawImage(img, {
          x: W * 0.8424 - size / 2, // توسيط أفقي
          y: H * 0.2400 - size / 2,
          width: size,
          height: size,
        });
      } catch (e) {
        console.error("Profile image error:", e.message);
      }
    }
  }

  // ── حفظ ─────────────────────────────────────────────────────
  const pdfBytes = await doc.save();
  const certsDir = path.join(__dirname, "..", "certificates");
  ensureDir(certsDir);
  const filename = `cert_${studentCode}_${Date.now()}.pdf`;
  const filepath = path.join(certsDir, filename);
  fs.writeFileSync(filepath, pdfBytes);

  return `/certificates/${filename}`;
};

module.exports = { generateCertificatePDF };
