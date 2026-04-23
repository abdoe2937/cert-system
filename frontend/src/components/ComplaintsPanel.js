import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const StatusBadge = ({ status }) => {
  const map = {
    new:         { label: 'New',         cls: 'bg-blue-500/15 text-blue-400 border-blue-500/25' },
    in_progress: { label: 'In Progress', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/25' },
    resolved:    { label: 'Resolved',    cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
  };
  const s = map[status] || map.new;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${s.cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {s.label}
    </span>
  );
};

// ─── Reply Modal ──────────────────────────────────────────────────────────────
const ReplyModal = ({ complaint, onClose, onSuccess }) => {
  const [reply, setReply] = useState(complaint.adminReply || '');
  const [status, setStatus] = useState(complaint.status);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reply.trim()) return toast.error('Please enter a reply');
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      await axios.patch(
        `${API_URL}/api/complaints/admin/${complaint._id}/reply`,
        { adminReply: reply, status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Reply sent successfully!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reply');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="card w-full max-w-lg p-6 shadow-2xl shadow-black/60 animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-lg font-semibold text-white">Reply to Complaint</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Complaint info */}
        <div className="bg-slate-800/50 rounded-xl p-4 mb-4 border border-slate-700/40">
          <div className="flex items-center justify-between mb-2">
            <p className="text-white font-semibold font-body text-sm">{complaint.subject}</p>
            <StatusBadge status={complaint.status} />
          </div>
          <p className="text-slate-400 text-sm font-body">{complaint.message}</p>
          <p className="text-xs text-slate-500 mt-2 font-body">
            From: <span className="text-gold-400">{complaint.userId?.fullName}</span>
            {' — '}{complaint.userId?.studentCode}
          </p>
        </div>

        {/* Status */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider font-body">
            Update Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="input-field"
          >
            <option value="new">New</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        {/* Reply */}
        <div className="mb-5">
          <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider font-body">
            Your Reply
          </label>
          <textarea
            className="input-field resize-none"
            rows={4}
            placeholder="Write your reply here..."
            value={reply}
            onChange={(e) => setReply(e.target.value)}
          />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending...</>
            ) : 'Send Reply'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Complaints Panel ────────────────────────────────────────────────────
export default function ComplaintsPanel() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const { data } = await axios.get(`${API_URL}/api/complaints/admin/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComplaints(data.complaints);
    } catch {
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchComplaints(); }, []);

  const filtered = complaints.filter(c => filter === 'all' || c.status === filter);

  const stats = {
    all:         complaints.length,
    new:         complaints.filter(c => c.status === 'new').length,
    in_progress: complaints.filter(c => c.status === 'in_progress').length,
    resolved:    complaints.filter(c => c.status === 'resolved').length,
  };

  return (
    <div>
      {selectedComplaint && (
        <ReplyModal
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          onSuccess={fetchComplaints}
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { key: 'all',         label: 'Total',       color: 'text-white' },
          { key: 'new',         label: 'New',         color: 'text-blue-400' },
          { key: 'in_progress', label: 'In Progress', color: 'text-amber-400' },
          { key: 'resolved',    label: 'Resolved',    color: 'text-emerald-400' },
        ].map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`card p-4 text-left transition-all ${filter === key ? 'border-gold-500/40' : ''}`}
          >
            <p className="text-xs text-slate-500 uppercase tracking-wider font-body mb-1">{label}</p>
            <p className={`font-display text-2xl font-bold ${color}`}>{loading ? '—' : stats[key]}</p>
          </button>
        ))}
      </div>

      {/* List */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
          <h2 className="font-display text-lg font-semibold text-white flex items-center gap-2">
            <span>💬</span> Complaints
          </h2>
          <button onClick={fetchComplaints} className="btn-secondary py-1.5 px-3 text-sm flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">💬</p>
            <p className="text-slate-400 font-body">No complaints found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/30">
            {filtered.map((c) => (
              <div key={c._id} className="p-5 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* User info */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full bg-gold-500/20 border border-gold-500/30 flex items-center justify-center text-gold-400 text-xs font-bold">
                        {(c.userId?.fullName || '?')[0].toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-slate-300 font-body">{c.userId?.fullName}</span>
                      <span className="text-xs text-slate-500 font-mono">{c.userId?.studentCode}</span>
                    </div>

                    {/* Subject & message */}
                    <p className="text-white font-semibold font-body mb-1">{c.subject}</p>
                    <p className="text-slate-400 text-sm font-body line-clamp-2">{c.message}</p>

                    {/* Admin reply preview */}
                    {c.adminReply && (
                      <div className="mt-2 bg-gold-500/8 border border-gold-500/20 rounded-lg px-3 py-2">
                        <p className="text-xs text-gold-400 font-body font-medium mb-0.5">Your Reply:</p>
                        <p className="text-slate-300 text-xs font-body line-clamp-1">{c.adminReply}</p>
                      </div>
                    )}

                    <p className="text-xs text-slate-600 mt-2 font-body">
                      {new Date(c.createdAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge status={c.status} />
                    <button
                      onClick={() => setSelectedComplaint(c)}
                      className="btn-secondary text-xs py-1.5 px-3"
                    >
                      {c.adminReply ? 'Edit Reply' : 'Reply'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
