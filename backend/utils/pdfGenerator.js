// utils/pdfGenerator.js
const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");
const fontkit = require("@pdf-lib/fontkit");
const fs = require("fs");
const path = require("path");

async function generateCertificate({
  studentName,
  courseName,
  date,
  certificateCode,
}) {
  // ── 1. إنشاء الـ PDF (A4 Landscape) ──────────────────────────────
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const W = 842, H = 595;
  const page = pdfDoc.addPage([W, H]);

  // ── 2. تحميل الفونت (Cairo يدعم العربي والإنجليزي) ───────────────
  const fontPath = path.join(__dirname, "../assets/fonts/Cairo-Bold.ttf");
  const fontBytes = fs.readFileSync(fontPath);
  const mainFont = await pdfDoc.embedFont(fontBytes);

  // Fallback لو Cairo مش موجود
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // ── 3. الألوان ────────────────────────────────────────────────────
  const gold        = rgb(0.937, 0.624, 0.153); // #EF9F27
  const goldLight   = rgb(0.980, 0.780, 0.459); // #FAC775
  const darkBlue    = rgb(0.094, 0.373, 0.647); // #185FA5
  const darkText    = rgb(0.173, 0.173, 0.165); // #2C2C2A
  const mutedText   = rgb(0.533, 0.529, 0.502); // #888780
  const lightBorder = rgb(0.827, 0.820, 0.780); // #D3D1C7
  const white       = rgb(1, 1, 1);
  const pageBg      = rgb(0.99, 0.99, 0.99);

  // ── 4. الخلفية ────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: pageBg });

  // Border خارجي
  page.drawRectangle({
    x: 20, y: 20, width: W - 40, height: H - 40,
    borderColor: gold, borderWidth: 2, color: white,
  });

  // Border داخلي رفيع
  page.drawRectangle({
    x: 30, y: 30, width: W - 60, height: H - 60,
    borderColor: goldLight, borderWidth: 0.5, color: undefined,
  });

  // ── 5. الخطوط الأفقية الزخرفية ───────────────────────────────────
  // فوق
  page.drawLine({ start: { x: 80, y: H - 95 }, end: { x: W - 80, y: H - 95 }, color: gold, thickness: 0.5 });
  // تحت
  page.drawLine({ start: { x: 80, y: 100 }, end: { x: W - 80, y: 100 }, color: gold, thickness: 0.5 });

  // ── 6. اللوجو ─────────────────────────────────────────────────────
  try {
    const logoPath = path.join(__dirname, "../assets/logo.png");
    const logoBytes = fs.readFileSync(logoPath);
    const logoImg = await pdfDoc.embedPng(logoBytes);
    const logoDims = logoImg.scale(1);
    const logoH = 55;
    const logoW = (logoDims.width / logoDims.height) * logoH;
    page.drawImage(logoImg, {
      x: (W - logoW) / 2,
      y: H - 85,
      width: logoW,
      height: logoH,
    });
  } catch (e) {
    // لو اللوجو مش موجود، ارسم دايرة placeholder
    page.drawCircle({
      x: W / 2, y: H - 58, size: 28,
      color: rgb(0.980, 0.933, 0.855),
      borderColor: gold, borderWidth: 1,
    });
  }

  // ── 7. عنوان الشهادة ─────────────────────────────────────────────
  const title = "CERTIFICATE OF COMPLETION";
  const titleSize = 13;
  const titleW = mainFont.widthOfTextAtSize(title, titleSize);
  page.drawText(title, {
    x: (W - titleW) / 2,
    y: H - 145,
    size: titleSize,
    font: mainFont,
    color: mutedText,
    characterSpacing: 2.5,
  });

  // ── 8. "This is to certify that" ─────────────────────────────────
  const sub1 = "This is to certify that";
  const sub1W = mainFont.widthOfTextAtSize(sub1, 11);
  page.drawText(sub1, {
    x: (W - sub1W) / 2,
    y: H - 175,
    size: 11,
    font: mainFont,
    color: lightBorder,
  });

  // ── 9. اسم الطالب ─────────────────────────────────────────────────
  const nameSize = 32;
  const nameW = mainFont.widthOfTextAtSize(studentName, nameSize);
  page.drawText(studentName, {
    x: (W - nameW) / 2,
    y: H - 220,
    size: nameSize,
    font: mainFont,
    color: darkText,
  });

  // خط تحت الاسم
  page.drawLine({
    start: { x: (W / 2) - 200, y: H - 230 },
    end:   { x: (W / 2) + 200, y: H - 230 },
    color: gold, thickness: 0.8,
  });

  // ── 10. "has successfully completed the course" ───────────────────
  const sub2 = "has successfully completed the course";
  const sub2W = mainFont.widthOfTextAtSize(sub2, 11);
  page.drawText(sub2, {
    x: (W - sub2W) / 2,
    y: H - 265,
    size: 11,
    font: mainFont,
    color: lightBorder,
  });

  // ── 11. اسم الكورس ───────────────────────────────────────────────
  const courseSize = 20;
  const courseW = mainFont.widthOfTextAtSize(courseName, courseSize);
  page.drawText(courseName, {
    x: (W - courseW) / 2,
    y: H - 305,
    size: courseSize,
    font: mainFont,
    color: darkBlue,
  });

  // ── 12. النقاط الزخرفية ──────────────────────────────────────────
  const dotY = H - 340;
  [-20, 0, 20].forEach((offset, i) => {
    page.drawCircle({
      x: W / 2 + offset, y: dotY, size: 3,
      color: i === 1 ? gold : lightBorder,
    });
  });

  // ── 13. التاريخ والكود (أسفل) ─────────────────────────────────────
  const infoY = H - 390;

  // DATE label
  const dateLabel = "DATE ISSUED";
  const dateLabelW = mainFont.widthOfTextAtSize(dateLabel, 9);
  page.drawText(dateLabel, {
    x: W / 4 - dateLabelW / 2,
    y: infoY + 18,
    size: 9, font: mainFont, color: lightBorder,
    characterSpacing: 1,
  });

  // Date value
  const dateW = mainFont.widthOfTextAtSize(date, 13);
  page.drawText(date, {
    x: W / 4 - dateW / 2,
    y: infoY,
    size: 13, font: mainFont, color: darkText,
  });

  // خط فاصل عمودي
  page.drawLine({
    start: { x: W / 2, y: infoY - 10 },
    end:   { x: W / 2, y: infoY + 35 },
    color: lightBorder, thickness: 0.5,
  });

  // CODE label
  const codeLabel = "CERTIFICATE CODE";
  const codeLabelW = mainFont.widthOfTextAtSize(codeLabel, 9);
  page.drawText(codeLabel, {
    x: (W * 3) / 4 - codeLabelW / 2,
    y: infoY + 18,
    size: 9, font: mainFont, color: lightBorder,
    characterSpacing: 1,
  });

  // Code value
  const codeW = mainFont.widthOfTextAtSize(certificateCode, 13);
  page.drawText(certificateCode, {
    x: (W * 3) / 4 - codeW / 2,
    y: infoY,
    size: 13, font: mainFont, color: darkText,
  });

  // ── 14. نجوم زخرفية أسفل ─────────────────────────────────────────
  const starsText = "* * *";
  const starsW = mainFont.widthOfTextAtSize(starsText, 10);
  page.drawText(starsText, {
    x: (W - starsW) / 2,
    y: 65,
    size: 10, font: mainFont, color: lightBorder,
    characterSpacing: 3,
  });

  // ── 15. حفظ وإرجاع الـ bytes ──────────────────────────────────────
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

module.exports = { generateCertificate };