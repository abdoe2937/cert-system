import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { registerUser } from "../api";
import logo from '../assets/logo.png';

// ─── Egyptian Governorates ────────────────────────────────────────────────────
const GOVERNORATES = [
  "القاهرة",
  "الجيزة",
  "الإسكندرية",
  "الدقهلية",
  "البحيرة",
  "الشرقية",
  "المنوفية",
  "الغربية",
  "القليوبية",
  "كفر الشيخ",
  "دمياط",
  "بورسعيد",
  "الإسماعيلية",
  "السويس",
  "شمال سيناء",
  "جنوب سيناء",
  "الفيوم",
  "بني سويف",
  "المنيا",
  "أسيوط",
  "سوهاج",
  "قنا",
  "الأقصر",
  "أسوان",
  "البحر الأحمر",
  "الوادي الجديد",
  "مطروح",
];

const EXPERIENCE_LEVELS = [
  { value: "beginner", label: "مبتدئ — Beginner" },
  { value: "intermediate", label: "متوسط — Intermediate" },
  { value: "advanced", label: "متقدم — Advanced" },
];

const GOALS = [
  { value: "job", label: "الحصول على وظيفة" },
  { value: "skill", label: "اكتساب مهارة" },
  { value: "career", label: "تطوير المسار المهني" },
];

const EDUCATION_LEVELS = [
  "ابتدائي",
  "إعدادي",
  "ثانوي",
  "دبلوم",
  "بكالوريوس",
  "ماجستير",
  "دكتوراه",
];

// ─── Field Section Wrapper ────────────────────────────────────────────────────
const Section = ({ title, icon, children }) => (
  <div className="mb-6">
    <div className="flex items-center gap-2 mb-3">
      <span className="text-gold-400 text-lg">{icon}</span>
      <h3 className="font-display text-sm font-semibold text-gold-400 uppercase tracking-widest">
        {title}
      </h3>
      <div className="flex-1 h-px bg-gold-500/20" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
  </div>
);

// ─── Reusable Input ───────────────────────────────────────────────────────────
const Field = ({ label, required, children, fullWidth }) => (
  <div className={fullWidth ? "sm:col-span-2" : ""}>
    <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider font-body">
      {label} {required && <span className="text-gold-400">*</span>}
    </label>
    {children}
  </div>
);

export default function RegisterPage() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    nationalId: "",
    governorate: "",
    gender: "",
    education: "",
    job: "",
    courseName: "",
    experienceLevel: "beginner",
    goal: "",
    hearingType: "", 
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: personal, 2: course
  const { login } = useAuth();
  const navigate = useNavigate();

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const validateStep1 = () => {
    if (!form.fullName.trim()) {
      toast.error("الاسم الكامل مطلوب");
      return false;
    }
    if (!form.email.trim()) {
      toast.error("البريد الإلكتروني مطلوب");
      return false;
    }
    if (form.password.length < 6) {
      toast.error("كلمة المرور 6 أحرف على الأقل");
      return false;
    }
    if (!form.phone.trim()) {
      toast.error("رقم الهاتف مطلوب");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep1()) setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.courseName.trim()) {
      toast.error("اسم الكورس مطلوب");
      return;
    }
    setLoading(true);
    try {
      const { data } = await registerUser(form);
      login(data.token, data.user);
      toast.success(`أهلاً بك، ${data.user.fullName}! 🎉`);
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "حدث خطأ أثناء التسجيل");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "input-field";
  const selectClass = "input-field appearance-none";

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* BG effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(rgba(184,148,63,0.03) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="w-full max-w-2xl relative animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
        <img
  src={logo}
  alt="كيان إشارة سلام"
  className="w-28 h-28 object-contain mb-4 mx-auto"
/>
          <h1 className="font-display text-3xl font-bold text-white">
          <span className="text-gold-400">كيان </span>إشارة سلام
          </h1>
          <p className="text-slate-400 text-sm mt-1 font-body">
            PSE
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {[1, 2].map((s) => (
            <React.Fragment key={s}>
              <div
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium font-body transition-all ${
                  step === s
                    ? "bg-gold-500/20 border border-gold-500/50 text-gold-300"
                    : step > s
                      ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                      : "bg-slate-800/60 border border-slate-700/40 text-slate-500"
                }`}
              >
                <span>{step > s ? "✓" : s}</span>
                <span>{s === 1 ? "البيانات الشخصية" : "بيانات الكورس"}</span>
              </div>
              {s < 2 && <div className="w-8 h-px bg-slate-700" />}
            </React.Fragment>
          ))}
        </div>

        <div className="card p-8 shadow-2xl shadow-black/50">
          {/* ── STEP 1: Personal Info ── */}
          {step === 1 && (
            <div>
              <Section title="البيانات الأساسية" icon="👤">
                <Field label="الاسم الكامل" required fullWidth>
                  <input
                    className={inputClass}
                    value={form.fullName}
                    onChange={set("fullName")}
                    placeholder="أدخل اسمك الكامل"
                  />
                </Field>
                <Field label="البريد الإلكتروني" required>
                  <input
                    className={inputClass}
                    type="email"
                    value={form.email}
                    onChange={set("email")}
                    placeholder="example@mail.com"
                  />
                </Field>
                <Field label="كلمة المرور" required>
                  <input
                    className={inputClass}
                    type="password"
                    value={form.password}
                    onChange={set("password")}
                    placeholder="6 أحرف على الأقل"
                  />
                </Field>
                <Field label="رقم الهاتف" required>
                  <input
                    className={inputClass}
                    type="tel"
                    value={form.phone}
                    onChange={set("phone")}
                    placeholder="01XXXXXXXXX"
                  />
                </Field>
              </Section>

              <Section title="البيانات الشخصية" icon="🪪">
                <Field label="الرقم القومي">
                  <input
                    className={inputClass}
                    value={form.nationalId}
                    onChange={set("nationalId")}
                    placeholder="14 رقم"
                    maxLength={14}
                  />
                </Field>
                <Field label="المحافظة">
                  <select
                    className={selectClass}
                    value={form.governorate}
                    onChange={set("governorate")}
                  >
                    <option value="">اختر المحافظة</option>
                    {GOVERNORATES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="الجنس">
                  <select
                    className={selectClass}
                    value={form.gender}
                    onChange={set("gender")}
                  >
                    <option value="">اختر الجنس</option>
                    <option value="male">ذكر</option>
                    <option value="female">أنثى</option>
                  </select>
                </Field>
                <Field label="حالة الشخص">
                  <select
                    className={selectClass}
                    value={form.hearingType}
                    onChange={set("hearingType")}
                  >
                    <option value="">الحالة</option>
                    <option value="hearing">متكلم</option>
                    <option value="deaf">أصم</option>
                    <option value="interpreter">مترجم إشارة</option>
                  </select>
                </Field>
                <Field label="العنوان">
                  <input
                    className={inputClass}
                    value={form.address}
                    onChange={set("address")}
                    placeholder="عنوان الإقامة"
                  />
                </Field>
              </Section>

              <Section title="التعليم والعمل" icon="🎓">
                <Field label="المؤهل الدراسي">
                  <select
                    className={selectClass}
                    value={form.education}
                    onChange={set("education")}
                  >
                    <option value="">اختر المؤهل</option>
                    {EDUCATION_LEVELS.map((e) => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="الوظيفة الحالية">
                  <input
                    className={inputClass}
                    value={form.job}
                    onChange={set("job")}
                    placeholder="مثال: طالب، موظف، حر"
                  />
                </Field>
              </Section>

              <button
                type="button"
                onClick={handleNext}
                className="btn-primary w-full mt-2"
              >
                التالي ← بيانات الكورس
              </button>
            </div>
          )}

          {/* ── STEP 2: Course Info ── */}
          {step === 2 && (
            <form onSubmit={handleSubmit}>
              <Section title="بيانات الكورس" icon="📚">
                <Field label="اسم الكورس" required fullWidth>
                  <input
                    className={inputClass}
                    value={form.courseName}
                    onChange={set("courseName")}
                    placeholder="مثال: برنامج القيادة المجتمعية"
                  />
                </Field>
                <Field label="مستوى الخبرة">
                  <select
                    className={selectClass}
                    value={form.experienceLevel}
                    onChange={set("experienceLevel")}
                  >
                    {EXPERIENCE_LEVELS.map((l) => (
                      <option key={l.value} value={l.value}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="الهدف من الكورس">
                  <select
                    className={selectClass}
                    value={form.goal}
                    onChange={set("goal")}
                  >
                    <option value="">اختر الهدف</option>
                    {GOALS.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </Section>

              {/* Summary */}
              <div className="mb-5 p-4 rounded-xl bg-gold-500/8 border border-gold-500/20">
                <p className="text-xs text-gold-400 font-body font-medium mb-2 uppercase tracking-wider">
                  ملخص التسجيل
                </p>
                <div className="grid grid-cols-2 gap-1 text-xs font-body text-slate-400">
                  <span>
                    الاسم:{" "}
                    <span className="text-slate-200">
                      {form.fullName || "—"}
                    </span>
                  </span>
                  <span>
                    المحافظة:{" "}
                    <span className="text-slate-200">
                      {form.governorate || "—"}
                    </span>
                  </span>
                  <span>
                    الكورس:{" "}
                    <span className="text-slate-200">
                      {form.courseName || "—"}
                    </span>
                  </span>
                  <span>
                    المستوى:{" "}
                    <span className="text-slate-200">
                      {EXPERIENCE_LEVELS.find(
                        (l) => l.value === form.experienceLevel,
                      )
                        ?.label.split("—")[0]
                        .trim()}
                    </span>
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-secondary flex-1"
                >
                  ← رجوع
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      جاري التسجيل...
                    </>
                  ) : (
                    "إنشاء الحساب ✓"
                  )}
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-sm text-slate-500 mt-5 font-body">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-gold-400 hover:text-gold-300 font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
