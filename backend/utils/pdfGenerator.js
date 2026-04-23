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

  const name = studentName || "";
  const nameAr = studentNameAr || "";
  const course = courseName || "";

  const dateStr = issuedAt
    ? new Date(issuedAt).toLocaleDateString("en-GB")
    : new Date().toLocaleDateString("en-GB");

  // ✅ الاسم الإنجليزي - تحت "AWARDED TO"
  page.drawText(name, {
    x: W * 0.5 - font.widthOfTextAtSize(name, 36) / 2,
    y: H * 0.46,   // ← كان 0.58 (مرتفع جداً)
    size: 36,
    font,
    color: darkText,
  });

  // ✅ الاسم العربي - تحت الاسم الإنجليزي
  page.drawText(nameAr, {
    x: W * 0.5 - font.widthOfTextAtSize(nameAr, 32) / 2,
    y: H * 0.40,   // ← كان 0.52
    size: 32,
    font,
    color: darkText,
  });

  // ✅ اسم الكورس - تحت "FOR SUCCESSFULLY COMPLETING THE"
  page.drawText(course, {
    x: W * 0.5 - font.widthOfTextAtSize(course, 26) / 2,
    y: H * 0.32,   // ← كان 0.44
    size: 26,
    font,
    color: darkText,
  });

  // ✅ Completion Date
  page.drawText(dateStr, {
    x: W * 0.565,   // بعد "Completion Date:"
    y: H * 0.215,
    size: 16,
    font,
    color: darkText,
  });

  // ✅ Volunteer ID
  page.drawText(studentCode || "", {
    x: W * 0.565,   // بعد "Volunteer ID:"
    y: H * 0.178,
    size: 16,
    font,
    color: darkText,
  });

  // Profile image
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

  const pdfBytes = await doc.save();
  const certsDir = path.join(__dirname, "..", "certificates");
  if (!fs.existsSync(certsDir)) fs.mkdirSync(certsDir, { recursive: true });

  const filename = `cert_${studentCode || Date.now()}.pdf`;
  fs.writeFileSync(path.join(certsDir, filename), pdfBytes);

  return `/certificates/${filename}`;
};