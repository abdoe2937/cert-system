const nodemailer = require("nodemailer");
const cloudinary = require("cloudinary").v2;
const { PassThrough } = require("stream");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Upload PDF Buffer to Cloudinary
const uploadPDFToCloudinary = async (pdfBuffer, fileName) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "cert-system/certificates",
        resource_type: "raw",
        public_id: fileName.replace(".pdf", ""),
        format: "pdf",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    const stream = new PassThrough();
    stream.end(pdfBuffer);
    stream.pipe(uploadStream);
  });
};

// Send certificate email with PDF attachment (no file saved!)
const sendCertificateEmail = async ({
  to,
  studentName,
  courseName,
  pdfBuffer,
  studentCode,
}) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"PSE - كيان إشارة سلام" <${process.env.SMTP_USER}>`,
    to,
    subject: `شهادة اتمام курс - ${courseName}`,
    html: `
      <div style="font-family: Cairo, sans-serif; direction: rtl; text-align: right; padding: 20px;">
        <h2 style="color: #b8943f;">🎓 تهانينا!</h2>
        <p>مرحبا <strong>${studentName}</strong>,</p>
        <p>يسعدنا إبلاغك بأنك قد أكملت بنجاح курс:</p>
        <h3 style="color: #b8943f;">${courseName}</h3>
        <p>ملف الشهادة مرفق في هذا البريد.</p>
        <hr style="border: 1px solid #b8943f; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
         PSE - كيان إشارة سلام<br>
        www.pse-egypt.org
        </p>
      </div>
    `,
    attachments: [
      {
        filename: `certificate_${studentCode}.pdf`,
        content: pdfBuffer,
      },
    ],
  };

  return transporter.sendMail(mailOptions);
};

// Generate and send in one function
const generateAndSendCertificate = async ({
  email,
  studentName,
  studentNameAr,
  profileImage,
  courseName,
  studentCode,
}) => {
  const { generateCertificatePDF } = require("./pdfGenerator");

  // Generate PDF (returns Buffer)
  const pdfBuffer = await generateCertificatePDF({
    studentName,
    studentNameAr,
    profileImage,
    courseName,
    studentCode,
    issuedAt: new Date(),
  });

  // Upload to Cloudinary (optional - for backup/display)
  let pdfUrl = "";
  try {
    const uploadResult = await uploadPDFToCloudinary(
      Buffer.from(pdfBuffer),
      `cert_${studentCode}`
    );
    pdfUrl = uploadResult.secure_url;
  } catch (e) {
    console.warn("Cloudinary upload failed:", e.message);
  }

  // Send email with PDF
  try {
    await sendCertificateEmail({
      to: email,
      studentName,
      courseName,
      pdfBuffer,
      studentCode,
    });
    console.log(`Certificate email sent to ${email}`);
  } catch (e) {
    console.error("Email send failed:", e.message);
    throw e;
  }

  return { pdfBuffer, pdfUrl };
};

module.exports = {
  createTransporter,
  uploadPDFToCloudinary,
  sendCertificateEmail,
  generateAndSendCertificate,
};