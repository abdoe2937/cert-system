import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const GOVERNORATES = [
  'القاهرة','الجيزة','الإسكندرية','الدقهلية','البحيرة','الشرقية','المنوفية',
  'الغربية','القليوبية','كفر الشيخ','دمياط','بورسعيد','الإسماعيلية','السويس',
  'شمال سيناء','جنوب سيناء','الفيوم','بني سويف','المنيا','أسيوط','سوهاج',
  'قنا','الأقصر','أسوان','البحر الأحمر','الوادي الجديد','مطروح',
];
const EDUCATION_LEVELS = ['ابتدائي','إعدادي','ثانوي','دبلوم','بكالوريوس','ماجستير','دكتوراه'];
const EXPERIENCE_LEVELS = [
  { value:'beginner',     label:'Beginner — مبتدئ'     },
  { value:'intermediate', label:'Intermediate — متوسط'  },
  { value:'advanced',     label:'Advanced — متقدم'      },
];
const GOALS = [
  { value:'job',    label:'Job — توظيف'               },
  { value:'skill',  label:'Skill — اكتساب مهارة'       },
  { value:'career', label:'Career — تطوير مهني'        },
];

const Section = ({ title, icon, children }) => (
  <div className="mb-6">
    <div className="flex items-center gap-2 mb-3">
      <span className="text-gold-400">{icon}</span>
      <h3 className="font-display text-sm font-semibold text-gold-400 uppercase tracking-widest">{title}</h3>
      <div className="flex-1 h-px bg-gold-500/20" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
  </div>
);

const Field = ({ label, required, children, fullWidth }) => (
  <div className={fullWidth ? 'sm:col-span-2' : ''}>
    <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider font-body">
      {label} {required && <span className="text-gold-400">*</span>}
    </label>
    {children}
  </div>
);

export default function RegisterPage() {
  const [form, setForm] = useState({
    fullNameAr:'', fullNameEn:'', email:'', password:'', phone:'',
    address:'', nationalId:'', governorate:'', gender:'', hearingType:'',
    education:'', job:'', courseName:'', experienceLevel:'beginner', goal:'',
  });
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [step, setStep]         = useState(1);
  const fileInputRef            = useRef();
  const { login }               = useAuth();
  const navigate                = useNavigate();

  const set  = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const inp  = 'input-field';
  const sel  = 'input-field appearance-none';

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    setProfileImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const validateStep1 = () => {
    if (!form.fullNameAr.trim()) { toast.error('الاسم بالعربية مطلوب'); return false; }
    if (!form.fullNameEn.trim()) { toast.error('Name in English is required'); return false; }
    if (!form.email.trim())      { toast.error('Email is required'); return false; }
    if (form.password.length < 6){ toast.error('Password must be at least 6 characters'); return false; }
    if (!form.phone.trim())      { toast.error('Phone is required'); return false; }
    if (!profileImage)           { toast.error('Profile photo is required'); return false; }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.courseName.trim()) { toast.error('Course name is required'); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      formData.append('profileImage', profileImage);
      const { data } = await axios.post(`${API_URL}/api/auth/register`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      login(data.token, data.user);
      toast.success(`Welcome, ${data.user.fullNameEn}! 🎉`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-gold-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute inset-0" style={{backgroundImage:'radial-gradient(rgba(184,148,63,0.03) 1px,transparent 1px)',backgroundSize:'40px 40px'}} />
      </div>

      <div className="w-full max-w-2xl relative animate-slide-up">

        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src={logo}
            alt="كيان إشارة سلام"
            className="w-28 h-28 object-contain mb-4 mx-auto"
          />
          <h1 className="font-display text-3xl font-bold text-white">
            <span className="text-gold-400">كيان </span> إشارة سلام
          </h1>
          <p className="text-slate-400 text-sm mt-1 font-body">PSE</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {[1,2].map(s => (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium font-body transition-all ${
                step===s ? 'bg-gold-500/20 border border-gold-500/50 text-gold-300'
                : step>s  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                          : 'bg-slate-800/60 border border-slate-700/40 text-slate-500'}`}>
                <span>{step>s?'✓':s}</span>
                <span>{s===1 ? 'Personal Info' : 'Course Info'}</span>
              </div>
              {s<2 && <div className="w-8 h-px bg-slate-700" />}
            </React.Fragment>
          ))}
        </div>

        <div className="card p-8 shadow-2xl shadow-black/50">

          {step === 1 && (
            <div>
              <div className="flex flex-col items-center mb-6">
                <div
                  onClick={() => fileInputRef.current.click()}
                  className={`w-24 h-24 rounded-full border-2 border-dashed cursor-pointer flex items-center justify-center overflow-hidden transition-all ${
                    imagePreview ? 'border-gold-500/60' : 'border-slate-600 hover:border-gold-500/40'
                  } bg-slate-800/40`}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-500 mx-auto mb-1">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                      <p className="text-xs text-slate-500 font-body">Photo *</p>
                    </div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                <p className="text-xs text-slate-500 mt-2 font-body">
                  {imagePreview ? '✅ Photo selected' : 'Click to upload profile photo (required)'}
                </p>
              </div>

              <Section title="Basic Information" icon="👤">
                <Field label="الاسم بالعربية" required fullWidth>
                  <input className={inp} value={form.fullNameAr} onChange={set('fullNameAr')} placeholder="مثال: أحمد محمد" dir="rtl" />
                </Field>
                <Field label="Full Name in English" required fullWidth>
                  <input className={inp} value={form.fullNameEn} onChange={set('fullNameEn')} placeholder="e.g. Ahmed Mohamed" />
                </Field>
                <Field label="Email" required>
                  <input className={inp} type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
                </Field>
                <Field label="Password" required>
                  <input className={inp} type="password" value={form.password} onChange={set('password')} placeholder="Min. 6 characters" />
                </Field>
                <Field label="Phone" required>
                  <input className={inp} type="tel" value={form.phone} onChange={set('phone')} placeholder="01XXXXXXXXX" />
                </Field>
                <Field label="National ID">
                  <input className={inp} value={form.nationalId} onChange={set('nationalId')} placeholder="14 digits" maxLength={14} />
                </Field>
              </Section>

              <Section title="Personal Details" icon="🪪">
                <Field label="Governorate">
                  <select className={sel} value={form.governorate} onChange={set('governorate')}>
                    <option value="">Select Governorate</option>
                    {GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </Field>
                <Field label="Gender">
                  <select className={sel} value={form.gender} onChange={set('gender')}>
                    <option value="">Select Gender</option>
                    <option value="male">Male — ذكر</option>
                    <option value="female">Female — أنثى</option>
                  </select>
                </Field>
                <Field label="Hearing Type">
                  <select className={sel} value={form.hearingType} onChange={set('hearingType')}>
                    <option value="">Select Hearing Type</option>
                    <option value="hearing">Hearing — متكلم</option>
                    <option value="deaf">Deaf — أصم</option>
                    <option value="interpreter">Sign Language Interpreter — مترجم</option>
                  </select>
                </Field>
                <Field label="Address">
                  <input className={inp} value={form.address} onChange={set('address')} placeholder="Your address" />
                </Field>
              </Section>

              <Section title="Education & Work" icon="🎓">
                <Field label="Education Level">
                  <select className={sel} value={form.education} onChange={set('education')}>
                    <option value="">Select Level</option>
                    {EDUCATION_LEVELS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </Field>
                <Field label="Current Job">
                  <input className={inp} value={form.job} onChange={set('job')} placeholder="e.g. Student, Engineer" />
                </Field>
              </Section>

              <button type="button" onClick={() => { if (validateStep1()) setStep(2); }} className="btn-primary w-full mt-2">
                Next → Course Info
              </button>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit}>
              <Section title="Course Details" icon="📚">
                <Field label="Course Name" required fullWidth>
                  <input className={inp} value={form.courseName} onChange={set('courseName')} placeholder="e.g. Community Leadership Program" />
                </Field>
                <Field label="Experience Level">
                  <select className={sel} value={form.experienceLevel} onChange={set('experienceLevel')}>
                    {EXPERIENCE_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </Field>
                <Field label="Goal">
                  <select className={sel} value={form.goal} onChange={set('goal')}>
                    <option value="">Select Goal</option>
                    {GOALS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                </Field>
              </Section>

              <div className="mb-5 p-4 rounded-xl bg-gold-500/8 border border-gold-500/20">
                <p className="text-xs text-gold-400 font-body font-medium mb-2 uppercase tracking-wider">Summary</p>
                <div className="grid grid-cols-2 gap-1 text-xs font-body text-slate-400">
                  <span>Arabic Name: <span className="text-slate-200">{form.fullNameAr||'—'}</span></span>
                  <span>English Name: <span className="text-slate-200">{form.fullNameEn||'—'}</span></span>
                  <span>Course: <span className="text-slate-200">{form.courseName||'—'}</span></span>
                  <span>Photo: <span className={profileImage?'text-emerald-400':'text-red-400'}>{profileImage?'✅ Ready':'❌ Missing'}</span></span>
                </div>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">← Back</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
                  {loading
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...</>
                    : 'Create Account ✓'}
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-sm text-slate-500 mt-5 font-body">
            Already have an account?{' '}
            <Link to="/login" className="text-gold-400 hover:text-gold-300 font-medium transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}