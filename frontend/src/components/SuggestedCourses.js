import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function SuggestedCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get(`${API_URL}/api/courses/suggested`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(({ data }) => setCourses(data.courses))
      .catch(() => toast.error('Failed to load courses'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-10">
      <div className="w-6 h-6 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
    </div>
  );

  if (courses.length === 0) return null;

  return (
    <div className="mt-8 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-gradient-to-r from-gold-500/40 to-transparent" />
        <div className="flex items-center gap-2">
          <span className="text-gold-400 text-sm">✦</span>
          <h2 className="font-display text-lg font-semibold text-white">
            Suggested for You
          </h2>
          <span className="text-gold-400 text-sm">✦</span>
        </div>
        <div className="flex-1 h-px bg-gradient-to-l from-gold-500/40 to-transparent" />
      </div>

      <p className="text-slate-500 text-sm font-body text-center mb-5">
        Courses recommended based on your profile and goals
      </p>

      {/* Course Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((course, i) => (
          <div
            key={course._id}
            className="card p-5 flex flex-col gap-3 hover:border-gold-500/30 transition-all group"
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            {/* Icon + Title */}
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-gold-500/15 border border-gold-500/25 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 group-hover:bg-gold-500/20 transition-colors">
                {course.thumbnail}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold font-body text-sm leading-tight">
                  {course.title}
                </p>
                {course.instructor && (
                  <p className="text-gold-400/70 text-xs font-body mt-0.5">
                    {course.instructor}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            {course.description && (
              <p className="text-slate-400 text-xs font-body line-clamp-2 leading-relaxed">
                {course.description}
              </p>
            )}

            {/* Duration */}
            {course.duration && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-body">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                {course.duration}
              </div>
            )}

            {/* CTA Button */}
            
          </div>
        ))}
      </div>
    </div>
  );
}
