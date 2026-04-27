import React, { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import ComplaintsPanel from "../components/ComplaintsPanel";
import CoursesPanel from "../components/CoursesPanel";
import { getAllUsers, markCompleted, sendCertificate } from "../api";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const cleanPath = path.replace(/\\/g, "/");
  const fixedPath = cleanPath.startsWith("/") ? cleanPath : "/" + cleanPath;
  return `${API_URL}${fixedPath}`;
};

const UsersIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const CheckIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const CertSendIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="8" r="6" />
    <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
  </svg>
);
const SearchIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);
const RefreshIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);
const CardIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
  </svg>
);
const EditIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const SendIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);
const CloseIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ── Card Popup Modal ──────────────────────────────────────────
const CardModal = ({ user, cardUrl: initialCardUrl, onClose }) => {
  const [mode, setMode] = useState("preview");
  const [cardUrl, setCardUrl] = useState(initialCardUrl);
  const [sending, setSending] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [editData, setEditData] = useState({
    fullNameEn: user.fullNameEn || user.fullName || "",
    studentCode: user.studentCode || "",
    nationalId: user.nationalId || "",
    enrollmentDate: user.createdAt
      ? new Date(user.createdAt).toLocaleDateString("en-GB")
      : "",
  });

  const handleSend = async () => {
    setSending(true);
    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/admin/send-card/${user._id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editData), // ✅ بيبعت التعديلات
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(
        `✅ تم إرسال الكارنيه للطالب ${user.fullName || user.fullNameEn}`,
      );
      onClose();
    } catch {
      toast.error("فشل إرسال الكارنيه");
    } finally {
      setSending(false);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch(
        `${API_URL}/api/admin/generate-card/${user._id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editData),
        },
      );
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      setCardUrl(blobUrl);
      setMode("preview");
      toast.success("✅ تم تحديث الكارنيه");
    } catch {
      toast.error("فشل تحديث الكارنيه");
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-xl shadow-2xl shadow-black/60 animate-slide-up overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
          <h3 className="font-display text-lg font-semibold text-white flex items-center gap-2">
            <span className="text-blue-400">
              <CardIcon />
            </span>
            كارنيه — {user.fullNameEn || user.fullName}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        {mode === "preview" && (
          <>
            <div className="bg-slate-900/50" style={{ height: "380px" }}>
              <iframe
                src={cardUrl}
                title="ID Card Preview"
                className="w-full h-full border-0"
              />
            </div>
            <div className="flex gap-3 p-5 border-t border-slate-700/50">
              <button onClick={onClose} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={() => setMode("edit")}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium font-body bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/25 transition-all active:scale-95"
              >
                <EditIcon /> Edit
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {sending ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <SendIcon /> Send
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {mode === "edit" && (
          <>
            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-400 font-body uppercase tracking-wider mb-3">
                تعديل بيانات الكارنيه
              </p>
              {[
                { label: "الاسم بالإنجليزية", key: "fullNameEn" },
                { label: "كود الطالب", key: "studentCode" },
                { label: "الرقم القومي", key: "nationalId" },
                { label: "تاريخ الالتحاق", key: "enrollmentDate" },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-slate-400 mb-1 font-body">
                    {label}
                  </label>
                  <input
                    className="input-field text-sm"
                    value={editData[key]}
                    onChange={(e) => {
                      if (key === "nationalId") {
                        const val = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 14);
                        setEditData({ ...editData, [key]: val });
                      } else {
                        setEditData({ ...editData, [key]: e.target.value });
                      }
                    }}
                    maxLength={key === "nationalId" ? 14 : undefined}
                    inputMode={key === "nationalId" ? "numeric" : "text"}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 p-5 border-t border-slate-700/50">
              <button
                onClick={() => setMode("preview")}
                className="btn-secondary flex-1"
              >
                Back
              </button>
              <button
                onClick={handleRegenerate}
                disabled={regenerating}
                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {regenerating ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <RefreshIcon /> تحديث الكارنيه
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ── User Details Modal ────────────────────────────────────────
const UserDetailsModal = ({ user, onClose }) => {
  const levelMap = {
    beginner: "مبتدئ",
    intermediate: "متوسط",
    advanced: "متقدم",
  };
  const goalMap = { job: "توظيف", skill: "مهارة", career: "تطوير مهني" };
  const genderMap = { male: "ذكر", female: "أنثى" };
  const hearingMap = {
    hearing: "متكلم",
    deaf: "أصم",
    interpreter: "مترجم إشارة",
  };

  const fields = [
    { label: "الاسم الكامل", value: user.fullName },
    { label: "البريد", value: user.email },
    { label: "رقم الهاتف", value: user.phone },
    { label: "كود الطالب", value: user.studentCode },
    { label: "المحافظة", value: user.governorate },
    { label: "الجنس", value: genderMap[user.gender] || user.gender },
    { label: "الرقم القومي", value: user.nationalId },
    { label: "العنوان", value: user.address },
    { label: "المؤهل الدراسي", value: user.education },
    { label: "الوظيفة", value: user.job },
    { label: "اسم الكورس", value: user.courseName },
    {
      label: "مستوى الخبرة",
      value: levelMap[user.experienceLevel] || user.experienceLevel,
    },
    { label: "الهدف", value: goalMap[user.goal] || user.goal },
    {
      label: "حالة الشخص",
      value: hearingMap[user.hearingType] || user.hearingType,
    },
    {
      label: "تاريخ التسجيل",
      value: new Date(user.createdAt).toLocaleDateString("ar-EG"),
    },
    { label: "الحالة", value: user.isCompleted ? "✅ مكتمل" : "⏳ جاري" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-lg p-6 shadow-2xl shadow-black/60 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            {user.profileImage ? (
              <img
                src={getImageUrl(user.profileImage)}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover border border-gold-500/30"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-500/30 to-gold-700/20 border border-gold-500/30 flex items-center justify-center text-gold-400 font-bold font-display text-xl">
                {(user?.fullName ?? "?")[0].toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="font-display text-lg font-semibold text-white">
                {user.fullName}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {user.studentCode}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {fields.map(({ label, value }) => (
            <div
              key={label}
              className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/40"
            >
              <p className="text-xs text-slate-500 font-body mb-0.5">{label}</p>
              <p className="text-slate-200 text-sm font-medium font-body">
                {value || <span className="text-slate-600">—</span>}
              </p>
            </div>
          ))}
        </div>

        {(user.idFront || user.idBack) && (
          <div className="mt-4">
            <p className="text-xs text-slate-500 font-body uppercase tracking-wider mb-3">
              صور البطاقة الشخصية
            </p>
            <div className="grid grid-cols-2 gap-3">
              {user.idFront && (
                <div className="bg-slate-800/40 rounded-xl p-2 border border-slate-700/40">
                  <p className="text-xs text-slate-500 font-body mb-2 text-center">
                    وجه البطاقة
                  </p>
                  <a
                    href={getImageUrl(user.idFront)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src={getImageUrl(user.idFront)}
                      alt="وجه البطاقة"
                      className="w-full rounded-lg object-cover hover:opacity-80 transition-opacity cursor-pointer"
                    />
                  </a>
                </div>
              )}
              {user.idBack && (
                <div className="bg-slate-800/40 rounded-xl p-2 border border-slate-700/40">
                  <p className="text-xs text-slate-500 font-body mb-2 text-center">
                    ظهر البطاقة
                  </p>
                  <a
                    href={getImageUrl(user.idBack)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src={getImageUrl(user.idBack)}
                      alt="ظهر البطاقة"
                      className="w-full rounded-lg object-cover hover:opacity-80 transition-opacity cursor-pointer"
                    />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        <button onClick={onClose} className="btn-secondary w-full mt-5">
          إغلاق
        </button>
      </div>
    </div>
  );
};

// ── Send Cert Modal ───────────────────────────────────────────
const SendCertModal = ({ user, onClose, onSuccess }) => {
  const [courseName, setCourseName] = useState(user.courseName || "");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!courseName.trim()) return toast.error("Please enter a course name");
    setLoading(true);
    try {
      await sendCertificate(user._id, { courseName });
      toast.success(`Certificate sent to ${user.fullName || ""}!`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send certificate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-md p-6 shadow-2xl shadow-black/60 animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-lg font-semibold text-white">
            Send Certificate
          </h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 mb-5 border border-slate-700/40">
          <p className="text-xs text-slate-500 font-body mb-0.5">Recipient</p>
          <p className="text-white font-medium font-body">
            {user.fullName || ""}
          </p>
          <p className="text-slate-400 text-sm font-body">{user.email}</p>
          <p className="text-gold-400 text-xs font-mono mt-1">
            {user.studentCode}
          </p>
        </div>
        <div className="mb-5">
          <label className="block text-xs font-medium text-slate-400 mb-1.5 font-body uppercase tracking-wider">
            Course Name
          </label>
          <input
            type="text"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            className="input-field"
            placeholder="e.g. Community Leadership"
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            autoFocus
          />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={loading}
            className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CertSendIcon /> Send
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("students");
  const [modalUser, setModalUser] = useState(null);
  const [detailsUser, setDetailsUser] = useState(null);
  const [completing, setCompleting] = useState(null);
  const [cardModal, setCardModal] = useState(null);
  const [sendingCard, setSendingCard] = useState(null);

  const fetchUsers = useCallback(async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const { data } = await getAllUsers();
      setUsers(data.users);
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("انتهت الجلسة، سيتم تسجيل الخروج...");
        setTimeout(() => {
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("user");
          window.location.href = "/login";
        }, 1500);
      } else {
        toast.error("Failed to load users");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(false);
  }, [fetchUsers]);

  const handleMarkCompleted = async (user) => {
    if (user.isCompleted) return;
    setCompleting(user._id);
    try {
      await markCompleted(user._id);
      toast.success(`${user.fullName} marked as completed`);
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, isCompleted: true } : u)),
      );
    } catch {
      toast.error("Failed to mark as completed");
    } finally {
      setCompleting(null);
    }
  };

  const handleOpenCard = async (user) => {
    setSendingCard(user._id);
    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch(
        `${API_URL}/api/admin/generate-card/${user._id}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      setCardModal({ user, cardUrl: blobUrl });
    } catch (err) {
      toast.error("Failed to generate card");
    } finally {
      setSendingCard(null);
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      (u.fullName || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.studentCode || "").toLowerCase().includes(q);
    const matchFilter =
      filter === "all" ||
      (filter === "completed" && u.isCompleted) ||
      (filter === "pending" && !u.isCompleted);
    return matchSearch && matchFilter;
  });

  const stats = {
    total: users.length,
    completed: users.filter((u) => u.isCompleted).length,
    pending: users.filter((u) => !u.isCompleted).length,
  };

  const tabBtn = (id, icon, label) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium font-body transition-all ${
        activeTab === id
          ? "bg-gold-500/20 text-gold-300 border border-gold-500/30"
          : "text-slate-400 hover:text-slate-200"
      }`}
    >
      {icon} {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      {detailsUser && (
        <UserDetailsModal
          user={detailsUser}
          onClose={() => setDetailsUser(null)}
        />
      )}
      {modalUser && (
        <SendCertModal
          user={modalUser}
          onClose={() => setModalUser(null)}
          onSuccess={fetchUsers}
        />
      )}
      {cardModal && (
        <CardModal
          user={cardModal.user}
          cardUrl={cardModal.cardUrl}
          onClose={() => setCardModal(null)}
        />
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 animate-slide-up">
          <div className="flex items-center gap-2 text-gold-500/60 text-sm font-body mb-2">
            <span>Admin Portal</span>
            <span>›</span>
            <span className="text-gold-400">Dashboard</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-white">
            Admin Dashboard
          </h1>
          <p className="text-slate-400 mt-1 font-body">
            Manage students and issue certificates
          </p>
        </div>

        <div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 animate-slide-up"
          style={{ animationDelay: "0.1s" }}
        >
          {[
            {
              label: "Total Students",
              value: stats.total,
              color: "text-white",
              bg: "",
            },
            {
              label: "Completed",
              value: stats.completed,
              color: "text-emerald-400",
              bg: "border-emerald-500/20 bg-emerald-500/5",
            },
            {
              label: "In Progress",
              value: stats.pending,
              color: "text-amber-400",
              bg: "border-amber-500/20 bg-amber-500/5",
            },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`card p-5 ${bg}`}>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-body mb-1">
                {label}
              </p>
              <p className={`font-display text-3xl font-bold ${color}`}>
                {loading ? "—" : value}
              </p>
            </div>
          ))}
        </div>

        <div className="flex gap-1 mb-6 bg-slate-900/60 p-1 rounded-xl border border-slate-700/40 w-fit">
          {tabBtn("students", <UsersIcon />, "Students")}
          {tabBtn("complaints", "💬", "Complaints")}
          {tabBtn("courses", "📚", "Courses")}
        </div>

        {activeTab === "students" && (
          <div
            className="card overflow-hidden animate-slide-up"
            style={{ animationDelay: "0.15s" }}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 border-b border-slate-700/50">
              <h2 className="font-display text-lg font-semibold text-white flex items-center gap-2">
                <span className="text-gold-400">
                  <UsersIcon />
                </span>{" "}
                Student Registry
              </h2>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                    <SearchIcon />
                  </span>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, email, code..."
                    className="input-field pl-9 py-2 text-sm w-full sm:w-64"
                  />
                </div>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="input-field py-2 text-sm bg-slate-800/60"
                >
                  <option value="all">All Students</option>
                  <option value="completed">Completed</option>
                  <option value="pending">In Progress</option>
                </select>
                <button
                  onClick={async () => {
                    try {
                      const token = sessionStorage.getItem("token");
                      const res = await fetch(
                        `${API_URL}/api/admin/export-excel`,
                        {
                          headers: { Authorization: `Bearer ${token}` },
                        },
                      );
                      if (!res.ok) throw new Error("Failed");
                      const blob = await res.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "students.xlsx";
                      a.click();
                      window.URL.revokeObjectURL(url);
                    } catch {
                      toast.error("Failed to download Excel");
                    }
                  }}
                  className="btn-secondary py-2 px-3 flex items-center justify-center gap-1.5 text-sm text-emerald-400"
                >
                  ⬇ Excel
                </button>
                <button
                  onClick={() => fetchUsers(true)}
                  disabled={refreshing}
                  className="btn-secondary py-2 px-3 flex items-center justify-center gap-1.5 text-sm disabled:opacity-50"
                >
                  <span className={refreshing ? "animate-spin" : ""}>
                    <RefreshIcon />
                  </span>
                  {refreshing ? "جاري..." : "Refresh"}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-4xl mb-3">🔍</div>
                  <p className="text-slate-400 font-body">No students found</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      {[
                        "Student",
                        "Email",
                        "Phone",
                        "Student Code",
                        "Status",
                        "Actions",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider font-body whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/30">
                    {filtered.map((user) => (
                      <tr
                        key={user._id}
                        className="table-row-hover transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {user.profileImage ? (
                              <img
                                src={getImageUrl(user.profileImage)}
                                alt="Profile"
                                className="w-8 h-8 rounded-full object-cover border border-gold-500/30 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-500/30 to-gold-700/20 border border-gold-500/30 flex items-center justify-center text-gold-400 text-xs font-bold font-display flex-shrink-0 text-lg">
                                {(user?.fullName ?? "?")[0].toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p
                                className="text-white font-medium font-body text-sm whitespace-nowrap cursor-pointer hover:text-gold-400 transition-colors"
                                onClick={() => setDetailsUser(user)}
                              >
                                {user.fullName || user.name}
                              </p>
                              <p className="text-slate-500 text-xs font-body">
                                {new Date(user.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-slate-300 font-body text-sm">
                            {user.email}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-slate-400 font-body text-sm">
                            {user.phone}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-mono text-xs text-gold-400 bg-gold-500/10 border border-gold-500/20 px-2.5 py-1 rounded-md">
                            {user.studentCode}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {user.isCompleted ? (
                            <span className="badge-completed">
                              <CheckIcon /> Completed
                            </span>
                          ) : (
                            <span className="badge-pending">
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />{" "}
                              In Progress
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleMarkCompleted(user)}
                              disabled={
                                user.isCompleted || completing === user._id
                              }
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium font-body transition-all ${
                                user.isCompleted
                                  ? "bg-slate-800/40 text-slate-600 cursor-not-allowed border border-slate-700/30"
                                  : "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/25 active:scale-95"
                              }`}
                            >
                              {completing === user._id ? (
                                <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <CheckIcon />
                              )}
                              <span className="hidden sm:inline">Complete</span>
                            </button>
                            <button
                              onClick={() => setModalUser(user)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium font-body bg-gold-500/15 hover:bg-gold-500/25 text-gold-400 border border-gold-500/25 transition-all active:scale-95"
                            >
                              <CertSendIcon />
                              <span className="hidden sm:inline">
                                Certificate
                              </span>
                            </button>
                            <button
                              onClick={() => handleOpenCard(user)}
                              disabled={sendingCard === user._id}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium font-body bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/25 transition-all active:scale-95 disabled:opacity-50"
                            >
                              {sendingCard === user._id ? (
                                <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <CardIcon />
                              )}
                              <span className="hidden sm:inline">Card</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {!loading && filtered.length > 0 && (
              <div className="px-5 py-3 border-t border-slate-700/50 flex items-center justify-between">
                <p className="text-xs text-slate-500 font-body">
                  Showing{" "}
                  <span className="text-slate-300">{filtered.length}</span> of{" "}
                  <span className="text-slate-300">{users.length}</span>{" "}
                  students
                </p>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500/60" />
                  <span className="text-xs text-slate-500 font-body">
                    {stats.completed} completed
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "complaints" && (
          <div className="animate-slide-up">
            <ComplaintsPanel />
          </div>
        )}
        {activeTab === "courses" && (
          <div className="animate-slide-up">
            <CoursesPanel />
          </div>
        )}
      </main>
    </div>
  );
}
