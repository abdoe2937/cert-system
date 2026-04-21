const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const fontkit = require("@pdf-lib/fontkit");
const fs = require("fs");
const path = require("path");

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const W = 1619;
const H = 971;

const generateIDCard = async ({ user, overrides = {} }) => {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);

  const templatePath = path.join(__dirname, "..", "assets", "card-template.png");
  const templateBytes = fs.readFileSync(templatePath);
  const templateImg = await doc.embedPng(templateBytes);

  const page = doc.addPage([W, H]);
  page.drawImage(templateImg, { x: 0, y: 0, width: W, height: H });

  const fontPath = path.join(__dirname, "..", "assets", "fonts", "Cairo-Bold.ttf");
  let font;
  try {
    font = await doc.embedFont(fs.readFileSync(fontPath));
  } catch {
    font = await doc.embedFont(StandardFonts.HelveticaBold);
  }

  const navy = rgb(0.06, 0.13, 0.27);
  const textSize = 26;

  // ── البيانات — overrides بتغلب على user ──────────────────────
  const name         = overrides.fullNameEn   || user.fullNameEn  || user.fullName || "";
  const studentCode  = overrides.studentCode  || user.studentCode || "";
  const nationalId   = overrides.nationalId   || user.nationalId  || "";
  const enrollmentDate = overrides.enrollmentDate
    || (user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-GB") : "");

  const status = user.hearingType === "deaf"
    ? "Deaf"
    : user.hearingType === "interpreter"
      ? "Sign Lang. Interpreter"
      : "Hearing";

  // ── STUDENT NAME ─────────────────────────────────────────────
  page.drawText(name, {
    x: 900, y: 590, size: textSize, font, color: navy,
  });

  // ── STATUS ───────────────────────────────────────────────────
  page.drawText(status, {
    x: 900, y: 527, size: textSize, font, color: navy,
  });

  // ── NATIONAL ID ──────────────────────────────────────────────
  page.drawText(nationalId, {
    x: 900, y: 464, size: textSize, font, color: navy,
  });

  // ── CODE ─────────────────────────────────────────────────────
  page.drawText(studentCode, {
    x: 900, y: 400, size: textSize, font, color: navy,
  });

  // ── ENROLLMENT DATE ──────────────────────────────────────────
  page.drawText(enrollmentDate, {
    x: 900, y: 337, size: textSize, font, color: navy,
  });

  // ── صورة البروفايل ───────────────────────────────────────────
  if (user.profileImage) {
    const imgPath = path.join(__dirname, "..", user.profileImage.replace(/^\//, ""));
    if (fs.existsSync(imgPath)) {
      try {
        const imgBytes = fs.readFileSync(imgPath);
        const ext = path.extname(imgPath).toLowerCase();
        const img = ext === ".png"
          ? await doc.embedPng(imgBytes)
          : await doc.embedJpg(imgBytes);
        const boxW = 220;
        const boxH = 280;
        page.drawImage(img, {
          x: 1378 - boxW / 2,
          y: 518 - boxH / 2,
          width: boxW,
          height: boxH,
        });
      } catch (e) {
        console.error("Card image error:", e.message);
      }
    }
  }

  // ── حفظ ──────────────────────────────────────────────────────
  const pdfBytes = await doc.save();
  const cardDir = path.join(__dirname, "..", "cards");
  ensureDir(cardDir);
  const filename = `card_${studentCode}_${Date.now()}.pdf`;
  fs.writeFileSync(path.join(cardDir, filename), pdfBytes);

  return `/cards/${filename}`;
};

module.exports = { generateIDCard };