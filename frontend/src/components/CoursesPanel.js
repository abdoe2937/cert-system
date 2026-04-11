import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const LEVELS = [
  { value: 'all', label: 'All Levels' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];
const GOALS = [
  { value: 'all', label: 'All Goals' },
  { value: 'job', label: 'Job' },
  { value: 'skill', label: 'Skill' },
  { value: 'career', label: 'Career' },
];
const HEARING_TYPES = [
  { value: 'all',         label: 'All Types' },
  { value: 'hearing',     label: 'Hearing (متكلم)' },
  { value: 'deaf',        label: 'Deaf (أصم)' },
  { value: 'interpreter', label: 'Interpreter (مترجم إشارة)' },
];
const EMOJIS = ['📚','🎓','💼','🚀','🌟','🏆','💡','🔧','🎯','🌍','❤️','🤝'];

const EMPTY = {
  title: '', description: '', instructor: '',
  duration: '', thumbnail: '📚',
  targetLevel: 'all', targetGoal: 'all',
  targetHearingType: 'all',
  isAvailableForEnrollment: true,
  order: 0,
};

const CourseModal = ({ course, onClose, onSuccess }) => {
  const [form, setForm] = useState(course || EMPTY);
  const [loading, setLoading] = useState(false);
  const isEdit = !!course?._id;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async () => {
    if (!form.title.trim()) return toast.error('Course title is required');
    setLoading(true);
    try {
      if (isEdit) {
        await axios.patch(`${API_URL}/api/courses/admin/${course._id}`, form, { headers: authHeaders() });
        toast.success('Course updated!');
      } else {
        await axios.post(`${API_URL}/api/courses/admin`, form, { headers: authHeaders() });
        toast.success('Course added!');
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full bg-slate-800/60 border border-slate-700/60 focus:border-gold-500/60 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none transition-all font-body text-sm';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="card w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-lg font-semibold text-white">
            {isEdit ? 'Edit Course' : 'Add New Course'}
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          {/* Emoji */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider font-body">Icon</label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map(e => (
                <button key={e} type="button" onClick={() => setForm({ ...form, thumbnail: e })}
                  className={`w-9 h-9 text-lg rounded-lg border transition-all ${form.thumbnail === e ? 'border-gold-500/60 bg-gold-500/20' : 'border-slate-700/40 bg-slate-800/40 hover:border-slate-600'}`}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider font-body">Course Title *</label>
            <input className={inputCls} value={form.title} onChange={set('title')} placeholder="e.g. Leadership Skills Program" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider font-body">Description</label>
            <textarea className={inputCls + ' resize-none'} rows={3} value={form.description} onChange={set('description')} placeholder="Brief description..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider font-body">Instructor</label>
              <input className={inputCls} value={form.instructor} onChange={set('instructor')} placeholder="Instructor name" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider font-body">Duration</label>
              <input className={inputCls} value={form.duration} onChange={set('duration')} placeholder="e.g. 4 weeks" />
            </div>
          </div>

          {/* Targeting */}
          <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
            <p className="text-xs text-gold-400 uppercase tracking-wider font-body mb-3">🎯 Targeting</p>
            <div className="grid grid-cols-1 gap-2">
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-body">Target Level</label>
                <select className={inputCls} value={form.targetLevel} onChange={set('targetLevel')}>
                  {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-body">Target Goal</label>
                <select className={inputCls} value={form.targetGoal} onChange={set('targetGoal')}>
                  {GOALS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-body">Target Hearing Type</label>
                <select className={inputCls} value={form.targetHearingType} onChange={set('targetHearingType')}>
                  {HEARING_TYPES.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Enrollment toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
            <div>
              <p className="text-sm text-slate-300 font-body">Available for Enrollment</p>
              <p className="text-xs text-slate-500 font-body">الطلاب يقدروا يتقدموا على الكورس ده</p>
            </div>
            <button type="button"
              onClick={() => setForm({ ...form, isAvailableForEnrollment: !form.isAvailableForEnrollment })}
              className={`w-10 h-6 rounded-full border-2 transition-all relative ${form.isAvailableForEnrollment ? 'bg-gold-500 border-gold-500' : 'bg-slate-700 border-slate-600'}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${form.isAvailableForEnrollment ? 'left-4' : 'left-0.5'}`} />
            </button>
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
            {loading
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
              : isEdit ? 'Save Changes' : 'Add Course'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function CoursesPanel() {
  const [courses, setCourses]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modalData, setModalData] = useState(null);
  const [deleting, setDeleting]   = useState(null);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/courses/admin/all`, { headers: authHeaders() });
      setCourses(data.courses);
    } catch {
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCourses(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this course?')) return;
    setDeleting(id);
    try {
      await axios.delete(`${API_URL}/api/courses/admin/${id}`, { headers: authHeaders() });
      toast.success('Course deleted');
      setCourses(prev => prev.filter(c => c._id !== id));
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const toggleActive = async (course) => {
    try {
      await axios.patch(`${API_URL}/api/courses/admin/${course._id}`,
        { isActive: !course.isActive }, { headers: authHeaders() });
      setCourses(prev => prev.map(c => c._id === course._id ? { ...c, isActive: !c.isActive } : c));
      toast.success(course.isActive ? 'Course hidden' : 'Course activated');
    } catch { toast.error('Failed to update'); }
  };

  const hearingLabel = { all: 'All', deaf: '🧏 Deaf', hearing: '🗣 Hearing', interpreter: '🤝 Interpreter' };

  return (
    <div>
      {modalData !== null && (
        <CourseModal course={modalData._id ? modalData : null} onClose={() => setModalData(null)} onSuccess={fetchCourses} />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-xl font-semibold text-white">Courses</h2>
          <p className="text-slate-400 text-sm font-body mt-0.5">{courses.length} courses</p>
        </div>
        <button onClick={() => setModalData({})} className="btn-primary flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Course
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
        </div>
      ) : courses.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-4xl mb-3">📚</p>
          <p className="text-slate-400 font-body">No courses yet</p>
          <button onClick={() => setModalData({})} className="btn-primary mt-4">Add First Course</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map(course => (
            <div key={course._id}
              className={`card p-5 flex flex-col gap-3 transition-all ${!course.isActive ? 'opacity-50' : 'hover:border-gold-500/25'}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gold-500/15 border border-gold-500/25 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                    {course.thumbnail}
                  </div>
                  <div>
                    <p className="text-white font-semibold font-body text-sm leading-tight">{course.title}</p>
                    {course.instructor && <p className="text-slate-500 text-xs font-body mt-0.5">{course.instructor}</p>}
                  </div>
                </div>
                <button onClick={() => toggleActive(course)}
                  className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all ${course.isActive ? 'bg-emerald-500 border-emerald-500' : 'bg-transparent border-slate-600'}`} />
              </div>

              {course.description && (
                <p className="text-slate-400 text-xs font-body line-clamp-2">{course.description}</p>
              )}

              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/25 font-body">
                  {LEVELS.find(l => l.value === course.targetLevel)?.label}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/25 font-body">
                  {GOALS.find(g => g.value === course.targetGoal)?.label}
                </span>
                {course.targetHearingType && course.targetHearingType !== 'all' && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-400 border border-teal-500/25 font-body">
                    {hearingLabel[course.targetHearingType]}
                  </span>
                )}
                {course.isAvailableForEnrollment && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gold-500/15 text-gold-400 border border-gold-500/25 font-body">
                    🚀 Open
                  </span>
                )}
                {course.duration && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-400 border border-slate-700/40 font-body">
                    ⏱ {course.duration}
                  </span>
                )}
              </div>

              <div className="flex gap-2 pt-1 border-t border-slate-700/40">
                <button onClick={() => setModalData(course)}
                  className="flex-1 text-xs py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 border border-slate-700/40 transition-all font-body">
                  Edit
                </button>
                <button onClick={() => handleDelete(course._id)} disabled={deleting === course._id}
                  className="flex-1 text-xs py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all font-body disabled:opacity-50">
                  {deleting === course._id ? '...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
