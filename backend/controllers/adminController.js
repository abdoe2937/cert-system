const sendCertificate = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "المستخدم غير موجود" });
    }

    const courseName = req.body.courseName || user.courseName || "Volunteering Program";

    // ✅ بترجع bytes مباشرة دلوقتي
    const pdfBytes = await generateCertificatePDF({
      studentName: user.fullNameEn || user.fullName || user.fullNameAr,
      profileImage: user.profileImage,
      courseName,
      studentCode: user.studentCode,
      issuedAt: new Date(),
    });

    const pdfBuffer = Buffer.from(pdfBytes);

    // Upload to Cloudinary
    let pdfUrl = "";
    try {
      const uploadResult = await uploadPDFToCloudinary(pdfBuffer, `cert_${user.studentCode}`);
      pdfUrl = uploadResult.secure_url;
    } catch (e) {
      console.warn("Cloudinary upload failed:", e.message);
    }

    // Save record in DB
    const certificate = await Certificate.create({
      userId: user._id,
      courseName,
      pdfUrl,
      issuedAt: new Date(),
    });

    // Send email
    try {
      const { sendCertificateEmail } = require("../utils/emailService");
      await sendCertificateEmail({
        to: user.email,
        studentName: user.fullNameEn || user.fullName || user.fullNameAr,
        courseName,
        pdfBuffer,
        studentCode: user.studentCode,
      });
    } catch (e) {
      console.warn("Email send failed:", e.message);
    }

    await User.findByIdAndUpdate(user._id, { isCompleted: true });

    // ✅ ابعت الـ PDF في الـ response مباشرة
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="cert_${user.studentCode}.pdf"`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error("Send certificate error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};