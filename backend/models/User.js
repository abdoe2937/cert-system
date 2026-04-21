const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

const userSchema = new mongoose.Schema(
  {
    // ── Names ────────────────────────────────────────────────
    fullNameAr: { type: String, trim: true },
    fullNameEn: { type: String, trim: true },
    // Keep fullName as alias for backward compat
    fullName: { type: String, trim: true },

    // ── Auth ─────────────────────────────────────────────────
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6, select: false },
    phone: { type: String, required: true, trim: true },

    // ── Profile Image ─────────────────────────────────────────
    profileImage: { type: String, default: "" }, // path to uploaded file

    // ── ID Card Images ────────────────────────────────────────
    idFront: { type: String, default: "" },
    idBack: { type: String, default: "" },

    // ── Personal ─────────────────────────────────────────────
    address: { type: String, trim: true },
    nationalId: { type: String, trim: true },
    governorate: { type: String, trim: true },
    gender: { type: String, enum: ["male", "female", ""] },
    hearingType: {
      type: String,
      enum: ["deaf", "hearing", "interpreter", ""],
      default: "",
    },

    // ── Education & Career ───────────────────────────────────
    education: { type: String, trim: true },
    job: { type: String, trim: true },

    // ── Course ───────────────────────────────────────────────
    courseName: { type: String, trim: true },
    experienceLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    goal: { type: String, enum: ["job", "skill", "career", ""] },

    // ── Course History ───────────────────────────────────────
    courseHistory: [
      {
        courseName: String,
        completedAt: Date,
        certId: { type: mongoose.Schema.Types.ObjectId, ref: "Certificate" },
      },
    ],

    // ── System ───────────────────────────────────────────────
    studentCode: { type: String, unique: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isCompleted: { type: Boolean, default: false },
    cardUrl: { type: String, default: "" }, // ← أضيف ده
  },
  { timestamps: true },
);

userSchema.pre("save", async function (next) {
  // Sync fullName with fullNameEn for backward compatibility
  if (this.fullNameEn) this.fullName = this.fullNameEn;
  else if (this.fullNameAr) this.fullName = this.fullNameAr;

  if (!this.studentCode) {
    this.studentCode = `EVC-${uuidv4().split("-")[0].toUpperCase()}`;
  }
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
