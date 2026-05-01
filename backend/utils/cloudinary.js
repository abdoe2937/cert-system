const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadPDF = async (buffer, filename) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        public_id: filename,
        overwrite: true,
        type: "upload",
        access_mode: "public",
        format: "pdf",
      },
      (error, result) => {
        if (error) reject(error);
        else {
          // ✅ غير الـ URL من res. لـ dl. عشان يفرض التحميل
          const downloadUrl = result.secure_url.replace(
            "res.cloudinary.com",
            "dl.cloudinary.com"
          );
          resolve(downloadUrl);
        }
      }
    ).end(buffer);
  });
};

module.exports = { uploadPDF };