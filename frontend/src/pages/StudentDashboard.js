import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { getMyCertificates, getMyCard } from "../api";
import API from "../api";
import SuggestedCourses from "../components/SuggestedCourses";
import EnrollmentPanel from "../components/EnrollmentPanel";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

const resolveUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${BACKEND_URL}${url}`;
};

const CertIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="8" r="6" />
    <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
  </svg>
);

const ComplaintIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const StatusBadge = ({ status }) => {
  const map = {
    new: { label: "New", cls: "bg-blue-500/15 text-blue-400 border-blue-500/25" },
    in_progress: { label: "In Progress", cls: "bg-amber-500/15 text-amber-400 border-amber-500/25" },
    resolved: { label: "Resolved", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" },
  };
  const s = map[status] || map.new;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${s.cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {s.label}
    </span>
  );
};

const ComplaintForm = ({ onSuccess }) => {
  const [form, setForm] = useState({ subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim())
      return toast.error("Please fill in all fields");
    setLoading(true);
    try {
      await API.post("/api/complaints", form);
      toast.success("Complaint submitted successfully!");
      setForm({ subject: "", message: "" });
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit complaint");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="card p-6 mb-6 border-gold-500/20">
      <h3 className="font-display text-base font-semibold text-white mb-4 flex items-center gap-2">
        <span className="text-gold-400"><ComplaintIcon /></span>
        Submit New Complaint
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider font-body">Subject</label>
          <input className="input-field" placeholder="Brief subject of your complaint" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider font-body">Message</label>
          <textarea className="input-field resize-none" rows={4} placeholder="Describe your complaint in detail..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
        </div>
        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2 disabled:opacity-50">
          {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting...</> : "Submit Complaint"}
        </button>
      </form>
    </div>
  );
};

const ComplaintCard = ({ complaint }) => (
  <div className="card p-5 hover:border-slate-600/50 transition-colors">
    <div className="flex items-start justify-between gap-3 mb-3">
      <div>
        <p className="text-white font-semibold font-body">{complaint.subject}</p>
        <p className="text-slate-500 text-xs font-body mt-0.5">
          {new Date(complaint.createdAt).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>
      <StatusBadge status={complaint.status} />
    </div>
    <p className="text-slate-400 text-sm font-body bg-slate-800/40 rounded-lg p-3 mb-3">{complaint.message}</p>
    {complaint.adminReply && (
      <div className="bg-gold-500/8 border border-gold-500/20 rounded-lg p-3">
        <p className="text-xs text-gold-400 font-medium font-body uppercase tracking-wider mb-1">Admin Reply</p>
        <p className="text-slate-300 text-sm font-body">{complaint.adminReply}</p>
        {complaint.repliedAt && (
          <p className="text-slate-500 text-xs mt-1 font-body">{new Date(complaint.repliedAt).toLocaleDateString("en-GB")}</p>
        )}
      </div>
    )}
  </div>
);

export default function StudentDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [certificates, setCertificates] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loadingCerts, setLoadingCerts] = useState(true);
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const [cardUrl, setCardUrl] = useState(null);

  const fetchComplaints = () => {
    setLoadingComplaints(true);
    API.get("/api/complaints/mine")
      .then(({ data }) => setComplaints(data.complaints))
      .catch(() => toast.error("Failed to load complaints"))
      .finally(() => setLoadingComplaints(false));
  };

  useEffect(() => {
    if (!user) return;
    const token = sessionStorage.getItem("token");
    if (!token) return;

    getMyCertificates()
      .then(({ data }) => setCertificates(data.certificates))
      .catch(() => toast.error("Failed to load certificates"))
      .finally(() => setLoadingCerts(false));

    getMyCard()
      .then(({ data }) => {
        if (data.success && data.cardUrl) {
          setCardUrl(data.cardUrl);
        }
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (user) fetchComplaints();
  }, [user]);

  const tabs = [
    { id: "profile", label: "Profile", icon: "👤" },
    { id: "certificates", label: "Certificates", icon: "🏆", count: certificates.length },
    { id: "complaints", label: "Complaints", icon: "💬", count: complaints.filter((c) => c.status === "new").length },
    { id: "enrollment", label: "Courses", icon: "🚀" },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 animate-slide-up">
          <h1 className="font-display text-3xl font-bold text-white">
            Welcome, <span className="text-gold-400">{user?.fullName || user?.name}</span>
          </h1>
          <p className="text-slate-400 mt-1 font-body">Student Portal Dashboard</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="card p-5 border-gold-500/30 bg-gold-500/5">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-body mb-1">Student Code</p>
            <p className="font-mono text-lg font-bold student-code">{user?.studentCode}</p>
          </div>
          <div className="card p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-body mb-1">Status</p>
            <p className="font-display text-xl font-bold text-white">{user?.isCompleted ? "✅ Completed" : "⏳ Active"}</p>
          </div>
          <div className="card p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-body mb-1">Certificates</p>
            <p className="font-display text-3xl font-bold text-white">{loadingCerts ? "—" : certificates.length}</p>
          </div>
        </div>

        <div className="flex gap-1 mb-6 bg-slate-900/60 p-1 rounded-xl border border-slate-700/40">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium font-body transition-all ${
                activeTab === tab.id ? "bg-gold-500/20 text-gold-300 border border-gold-500/30" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? "bg-gold-500/30 text-gold-300" : "bg-slate-700 text-slate-400"}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === "profile" && (
          <div className="card p-6 animate-slide-up">
            <h2 className="font-display text-lg font-semibold text-white mb-4">Profile Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: "Full Name", value: user?.fullName || user?.name },
                { label: "Email", value: user?.email },
                { label: "Phone", value: user?.phone },
                { label: "Governorate", value: user?.governorate },
                { label: "Education", value: user?.education },
                { label: "Job", value: user?.job },
                { label: "Course", value: user?.courseName },
                {
                  label: "Member Since",
                  value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" }) : "—",
                },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/40">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-body mb-1">{label}</p>
                  <p className="text-slate-200 font-medium font-body">{value || "—"}</p>
                </div>
              ))}
            </div>

            {cardUrl ? (
              <a
                href={resolveUrl(cardUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full mt-5 flex items-center justify-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
                Download My ID Card
              </a>
            ) : (
              <div className="mt-5 p-4 rounded-xl bg-slate-800/40 border border-slate-700/40 text-center">
                <p className="text-slate-500 text-sm font-body">🪪 الكارنيه لم يتم إرساله بعد</p>
                <p className="text-slate-600 text-xs mt-1 font-body">سيظهر هنا بعد مراجعة الأدمن</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "certificates" && (
          <div className="animate-slide-up">
            {loadingCerts ? (
              <div className="card p-12 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
              </div>
            ) : certificates.length === 0 ? (
              <div className="card p-12 text-center">
                <div className="w-16 h-16 bg-slate-800/60 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-600">
                  <CertIcon />
                </div>
                <p className="text-slate-400 font-body">No certificates yet</p>
                <p className="text-slate-600 text-sm mt-1 font-body">Complete your course to receive a certificate</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {certificates.map((cert) => (
                  <div key={cert._id} className="card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-gold-500/25 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gold-500/15 border border-gold-500/30 rounded-xl flex items-center justify-center text-gold-400 flex-shrink-0">
                        <CertIcon />
                      </div>
                      <div>
                        <p className="text-white font-semibold font-body">{cert.courseName}</p>
                        <p className="text-slate-400 text-sm font-body mt-0.5">
                          {new Date(cert.issuedAt).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <a
                      href={resolveUrl(cert.pdfUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary flex items-center gap-2 text-sm whitespace-nowrap"
                    >
                      <DownloadIcon /> Download PDF
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "complaints" && (
          <div className="animate-slide-up">
            <ComplaintForm onSuccess={fetchComplaints} />
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold text-white">My Complaints</h3>
              <span className="text-xs text-slate-500 font-body bg-slate-800/60 px-2.5 py-1 rounded-full border border-slate-700/40">{complaints.length} total</span>
            </div>
            {loadingComplaints ? (
              <div className="card p-12 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
              </div>
            ) : complaints.length === 0 ? (
              <div className="card p-12 text-center">
                <p className="text-4xl mb-3">💬</p>
                <p className="text-slate-400 font-body">No complaints submitted yet</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {complaints.map((c) => (
                  <ComplaintCard key={c._id} complaint={c} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "enrollment" && (
          <div className="animate-slide-up"><EnrollmentPanel /></div>
        )}

        <SuggestedCourses />
      </main>
    </div>
  );
}