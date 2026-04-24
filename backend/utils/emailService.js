const nodemailer = require("nodemailer");
const cloudinary = require("cloudinary").v2;
const { PassThrough } = require("stream");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

const uploadPDFToCloudinary = async (pdfBuffer, fileName) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "cert-system/certificates",
        resource_type: "image",
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

const sendCertificateEmail = async ({ to, studentName, courseName, pdfBuffer, studentCode }) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("Email not configured - skipping");
    return { skipped: true };
  }

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

module.exports = { createTransporter, uploadPDFToCloudinary, sendCertificateEmail };