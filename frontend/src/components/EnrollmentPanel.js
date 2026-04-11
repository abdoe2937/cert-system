import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

export default function EnrollmentPanel() {
  const { user, login } = useAuth();
  const [availableCourses, setAvailableCourses] = useState([]);
  const [history, setHistory]                   = useState([]);
  const [selected, setSelected]                 = useState('');
  const [customName, setCustomName]             = useState('');
  const [loading, setLoading]                   = useState(false);
  const [loadingData, setLoadingData]           = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get(`${API_URL}/api/courses/available`, { headers: authH() }),
      axios.get(`${API_URL}/api/courses/my-history`, { headers: authH() }),
    ]).then(([avail, hist]) => {
      setAvailableCourses(avail.data.courses);
      setHistory(hist.data.history);
    }).catch(() => toast.error('Failed to load data'))
      .finally(() => setLoadingData(false));
  }, []);

  // هل الطالب مؤهل للتقديم؟
  const canEnroll = !user?.courseName || (user?.isCompleted);
  const hasCert   = user?.isCompleted;
  const currentCourse = user?.courseName;

  const handleEnroll = async () => {
    let courseName = '';
  
    if (selected === '__custom__') {
      courseName = customName.trim();
    } else if (selected) {
      courseName = selected.trim();
    } else {
      courseName = customName.trim();
    }
  
    if (!courseName) return toast.error('اختر أو اكتب اسم الكورس');
  
    setLoading(true);
    try {
      const { data } = await axios.post(
        `${API_URL}/api/courses/enroll`,
        { courseName },
        { headers: authH() }
      );
      toast.success(data.message);
      const token = localStorage.getItem('token');
      login(token, data.user);
      setSelected('');
      setCustomName('');
      const hist = await axios.get(`${API_URL}/api/courses/my-history`, { headers: authH() });
      setHistory(hist.data.history);
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل التسجيل');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) return (
    <div className="flex items-center justify-center py-10">
      <div className="w-6 h-6 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Current Course Status */}
      {currentCourse && (
        <div className={`card p-5 border-l-4 ${hasCert ? 'border-l-emerald-500' : 'border-l-amber-500'}`}>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-body mb-1">الكورس الحالي</p>
          <p className="text-white font-semibold font-body text-lg">{currentCourse}</p>
          <div className="flex items-center gap-2 mt-2">
            {hasCert ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                ✅ مكتمل — يمكنك التقديم على كورس جديد
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/25">
                ⏳ جاري — أكمل الكورس واحصل على شهادتك أولاً
              </span>
            )}
          </div>
        </div>
      )}

      {/* Enrollment Form */}
      {canEnroll ? (
        <div className="card p-6">
          <h3 className="font-display text-lg font-semibold text-white mb-1">
            التقديم على كورس جديد
          </h3>
          <p className="text-slate-400 text-sm font-body mb-5">
            اختر من الكورسات المتاحة أو اكتب اسم الكورس اللي عايزه
          </p>

          {/* Available courses */}
          {availableCourses.length > 0 && (
            <div className="mb-4">
              <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider font-body">
                الكورسات المتاحة
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {availableCourses.map(c => (
                  <button
                    key={c._id}
                    onClick={() => { setSelected(c.title); setCustomName(''); }}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      selected === c.title
                        ? 'border-gold-500/50 bg-gold-500/10'
                        : 'border-slate-700/40 bg-slate-800/30 hover:border-slate-600/60'
                    }`}
                  >
                    <span className="text-xl">{c.thumbnail}</span>
                    <div>
                      <p className="text-white text-sm font-medium font-body">{c.title}</p>
                      {c.duration && <p className="text-slate-500 text-xs font-body">⏱ {c.duration}</p>}
                    </div>
                    {selected === c.title && (
                      <span className="ml-auto text-gold-400">✓</span>
                    )}
                  </button>
                ))}

                {/* Custom option */}
                <button
                  onClick={() => setSelected('__custom__')}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    selected === '__custom__'
                      ? 'border-gold-500/50 bg-gold-500/10'
                      : 'border-dashed border-slate-600/40 bg-slate-800/20 hover:border-slate-500/60'
                  }`}
                >
                  <span className="text-xl">✏️</span>
                  <div>
                    <p className="text-slate-300 text-sm font-medium font-body">كورس آخر</p>
                    <p className="text-slate-500 text-xs font-body">اكتب اسم الكورس يدوي</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Custom course name input */}
          {(selected === '__custom__' || availableCourses.length === 0) && (
            <div className="mb-5">
              <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider font-body">
                اسم الكورس
              </label>
              <input
                className="w-full bg-slate-800/60 border border-slate-700/60 focus:border-gold-500/60 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 outline-none transition-all font-body"
                placeholder="مثال: برنامج تطوير القيادات"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
              />
            </div>
          )}

          <button
            onClick={handleEnroll}
            disabled={loading || (!selected && !customName.trim())}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />جاري التسجيل...</>
              : '🚀 التقديم على الكورس'}
          </button>
        </div>
      ) : (
        <div className="card p-6 text-center opacity-60">
          <p className="text-2xl mb-2">🔒</p>
          <p className="text-slate-400 font-body text-sm">
            أكمل الكورس الحالي واحصل على شهادتك عشان تقدر تسجل في كورس جديد
          </p>
        </div>
      )}

      {/* Course History */}
      {history.length > 0 && (
        <div>
          <h3 className="font-display text-lg font-semibold text-white mb-4">
            📋 سجل الكورسات
          </h3>
          <div className="space-y-3">
            {history.map((h, i) => (
              <div key={i} className="card p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-500/15 border border-emerald-500/25 rounded-lg flex items-center justify-center text-emerald-400 text-xs font-bold">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-white font-medium font-body text-sm">{h.courseName}</p>
                    <p className="text-slate-500 text-xs font-body">
                      {h.completedAt ? new Date(h.completedAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                    </p>
                  </div>
                </div>
                <span className="badge-completed text-xs">✅ مكتمل</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
