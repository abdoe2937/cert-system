const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const fontkit = require("@pdf-lib/fontkit");
const fs = require("fs");
const path = require("path");

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const W = 1619;
const H = 971;

const generateIDCard = async ({ user }) => {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);

  const templatePath = path.join(
    __dirname,
    "..",
    "assets",
    "card-template.png",
  );
  const templateBytes = fs.readFileSync(templatePath);
  const templateImg = await doc.embedPng(templateBytes);

  const page = doc.addPage([W, H]);
  page.drawImage(templateImg, { x: 0, y: 0, width: W, height: H });

  // ── فونت ────────────────────────────────────────────────────
  const fontPath = path.join(
    __dirname,
    "..",
    "assets",
    "fonts",
    "Cairo-Bold.ttf",
  );
  let font;
  try {
    font = await doc.embedFont(fs.readFileSync(fontPath));
  } catch {
    font = await doc.embedFont(StandardFonts.HelveticaBold);
  }

  const navy = rgb(0.06, 0.13, 0.27);
  const textSize = 26;

  // ── VOLUNTEER NAME ─────────────────────────────────────────────
  const name = user.fullNameEn || user.fullName || "";
  page.drawText(name, {
    x: 900, // ← كان 841، راح يمين
    y: 590, // ← كان 644، نزل تحت
    size: textSize,
    font,
    color: navy,
  });

  // ── STATUS ───────────────────────────────────────────────────
  const status =
    user.hearingType === "deaf"
      ? "Deaf"
      : user.hearingType === "interpreter"
        ? "Sign Lang. Interpreter"
        : "Hearing";
  page.drawText(status, {
    x: 900, // ← موحد
    y: 527, // ← نزل تحت
    size: textSize,
    font,
    color: navy,
  });

  // ── EMAIL ────────────────────────────────────────────────────
  page.drawText(user.nationalId|| "", {
    x: 900, // ← كان 898، راح شمال
    y: 464, // ← نزل تحت
    size: textSize,
    font,
    color: navy,
  });

  // ── CODE ─────────────────────────────────────────────────────
  page.drawText(user.studentCode || "", {
    x: 900, // ← موحد
    y: 400, // ← نزل تحت
    size: textSize,
    font,
    color: navy,
  });

  // ── ENROLLMENT DATE ──────────────────────────────────────────
  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-GB")
    : "";
  page.drawText(joinDate, {
    x: 900, // ← موحد
    y: 337, // ← نزل تحت
    size: textSize,
    font,
    color: navy,
  });

  // ── صورة البروفايل ───────────────────────────────────────────
  if (user.profileImage) {
    const imgPath = path.join(
      __dirname,
      "..",
      user.profileImage.replace(/^\//, ""),
    );
    if (fs.existsSync(imgPath)) {
      try {
        const imgBytes = fs.readFileSync(imgPath);
        const ext = path.extname(imgPath).toLowerCase();
        const img =
          ext === ".png"
            ? await doc.embedPng(imgBytes)
            : await doc.embedJpg(imgBytes);

        const boxW = 220;
        const boxH = 280;
        page.drawImage(img, {
          x: 1378 - boxW / 2, // توسيط على النقطة الـ cyan
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
  const filename = `card_${user.studentCode}_${Date.now()}.pdf`;
  fs.writeFileSync(path.join(cardDir, filename), pdfBytes);

  return `/cards/${filename}`;
};

module.exports = { generateIDCard };
