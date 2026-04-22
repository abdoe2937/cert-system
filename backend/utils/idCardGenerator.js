const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const fontkit = require("@pdf-lib/fontkit");
const fs = require("fs");
const path = require("path");

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const W = 1619;
const H = 971;

// نسب التحويل من أبعاد الصورة للـ PDF
const scaleX = (x) => x * W / 1393;
const scaleY = (y) => H - (y * H / 878);

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

  const name           = overrides.fullNameEn     || user.fullNameEn  || user.fullName || "";
  const studentCode    = overrides.studentCode    || user.studentCode || "";
  const nationalId     = overrides.nationalId     || user.nationalId  || "";
  const enrollmentDate = overrides.enrollmentDate
    || (user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-GB") : "");

  const status = user.hearingType === "deaf"
    ? "Deaf"
    : user.hearingType === "interpreter"
      ? "Sign Lang. Interpreter"
      : "Hearing";

  // ── البيانات ─────────────────────────────────────────────────
  page.drawText(name, {
    x: scaleX(550), y: scaleY(523),
    size: textSize, font, color: navy,
  });

  page.drawText(status, {
    x: scaleX(550), y: scaleY(573),
    size: textSize, font, color: navy,
  });

  page.drawText(nationalId, {
    x: scaleX(550), y: scaleY(624),
    size: textSize, font, color: navy,
  });

  page.drawText(studentCode, {
    x: scaleX(550), y: scaleY(676),
    size: textSize, font, color: navy,
  });

  page.drawText(enrollmentDate, {
    x: scaleX(550), y: scaleY(727),
    size: textSize, font, color: navy,
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
          x: scaleX(1130) - boxW / 2,
          y: scaleY(510) - boxH / 2,
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