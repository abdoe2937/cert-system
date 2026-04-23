const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const fontkit = require("@pdf-lib/fontkit");
const fs = require("fs");
const path = require("path");

const W = 1619;
const H = 971;

const scaleX = (x) => (x * W) / 1393;
const scaleY = (y) => H - (y * H) / 878;

// Try to load image from local path or from Cloudinary URL
const loadImage = async (doc, imagePath) => {
  if (!imagePath) return null;

  // Check if it's a Cloudinary URL
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

  // Local file
  const fullPath = path.join(__dirname, "..", imagePath.replace(/^\//, ""));
  if (!fs.existsSync(fullPath)) {
    console.log("Image not found:", fullPath);
    return null;
  }

  const ext = path.extname(fullPath).toLowerCase();
  const bytes = fs.readFileSync(fullPath);
  return ext === ".png" ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
};

const generateIDCard = async ({ user, overrides = {} }) => {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);

  const templatePath = path.join(
    __dirname,
    "..",
    "assets",
    "card-template.png",
  );
  if (!fs.existsSync(templatePath)) {
    console.error("Card template not found:", templatePath);
    throw new Error("Card template not found. Please contact admin.");
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
    if (fs.existsSync(fontPath)) {
      font = await doc.embedFont(fs.readFileSync(fontPath));
    } else {
      font = await doc.embedFont(StandardFonts.HelveticaBold);
    }
  } catch {
    font = await doc.embedFont(StandardFonts.HelveticaBold);
  }

  const navy = rgb(0.06, 0.13, 0.27);
  const textSize = 26;

  const name = overrides.fullNameEn || user.fullNameEn || user.fullName || "";
  const studentCode = overrides.studentCode || user.studentCode || "";
  const nationalId = overrides.nationalId || user.nationalId || "";
  const enrollmentDate =
    overrides.enrollmentDate ||
    (user.createdAt
      ? new Date(user.createdAt).toLocaleDateString("en-GB")
      : "");

  const status =
    user.hearingType === "deaf"
      ? "Deaf"
      : user.hearingType === "interpreter"
        ? "Sign Lang. Interpreter"
        : "Hearing";

  page.drawText(name, {
    x: scaleX(550),
    y: scaleY(523),
    size: textSize,
    font,
    color: navy,
  });
  page.drawText(studentCode, {
    x: scaleX(550),
    y: scaleY(573),
    size: 22,
    font,
    color: navy,
  });
  page.drawText(nationalId, {
    x: scaleX(550),
    y: scaleY(624),
    size: 18,
    font,
    color: navy,
  });
  page.drawText(status, {
    x: scaleX(550),
    y: scaleY(727),
    size: 18,
    font,
    color: navy,
  });
  page.drawText(enrollmentDate, {
    x: scaleX(550),
    y: scaleY(676),
    size: 18,
    font,
    color: navy,
  });
  

  // Profile image - works with both local and Cloudinary
  if (user.profileImage) {
    const img = await loadImage(doc, user.profileImage);
    if (img) {
      const boxW = 220;
      const boxH = 280;
      page.drawImage(img, {
        x: scaleX(1130) - boxW / 2,
        y: scaleY(510) - boxH / 2,
        width: boxW,
        height: boxH,
      });
    }
  }

  const pdfBytes = await doc.save();
  return pdfBytes;
};

module.exports = { generateIDCard };
