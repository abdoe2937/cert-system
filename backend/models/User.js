const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema(
  {
    fullName:        { type: String, required: [true, 'الاسم الكامل مطلوب'], trim: true },
    email:           { type: String, required: [true, 'البريد الإلكتروني مطلوب'], unique: true, lowercase: true, trim: true },
    password:        { type: String, required: [true, 'كلمة المرور مطلوبة'], minlength: 6, select: false },
    phone:           { type: String, required: [true, 'رقم الهاتف مطلوب'], trim: true },
    address:         { type: String, trim: true },
    nationalId:      { type: String, trim: true },
    governorate:     { type: String, trim: true },
    gender:          { type: String, enum: ['male', 'female'] },
    education:       { type: String, trim: true },
    job:             { type: String, trim: true },

    // ── نوع الإعاقة السمعية ──────────────────────────────────
    hearingType: {
      type: String,
      enum: ['deaf', 'hearing', 'interpreter', ''],
      default: '',
    },

    // ── Course Info ──────────────────────────────────────────
    courseName:      { type: String, trim: true },
    experienceLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    goal:            { type: String, enum: ['job', 'skill', 'career'] },

    // ── System Fields ────────────────────────────────────────
    studentCode:     { type: String, unique: true },
    role:            { type: String, enum: ['user', 'admin'], default: 'user' },
    isCompleted:     { type: Boolean, default: false },

    // ── Course History ───────────────────────────────────────
    courseHistory: [
      {
        courseName:  { type: String },
        completedAt: { type: Date },
        certId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Certificate' },
      }
    ],
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.studentCode) {
    this.studentCode = `EVC-${uuidv4().split('-')[0].toUpperCase()}`;
  }
  if (!this.isModified('password')) return next();
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

module.exports = mongoose.model('User', userSchema);
