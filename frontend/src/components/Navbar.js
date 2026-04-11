import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

const ShieldIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
  <img
    src={logo}
    alt="كيان إشارة سلام"
    className="w-10 h-10 object-contain"
  />
  <span className="font-display text-lg font-semibold text-white tracking-wide">
  <span className="text-gold-400">كيان</span> إشارة سلام
  </span>
</div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Role badge */}
            <span className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
              isAdmin
                ? 'bg-gold-500/10 text-gold-400 border-gold-500/25'
                : 'bg-blue-500/10 text-blue-400 border-blue-500/25'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {isAdmin ? 'Administrator' : 'Student'}
            </span>

            {/* User info + logout */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-800/60 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gold-500/30 to-gold-600/20 border border-gold-500/30 flex items-center justify-center text-gold-400 text-xs font-bold font-display">
                {(user?.fullName || user?.name)?.[0]?.toUpperCase()}
                </div>
                <span className="hidden sm:block text-sm text-slate-300 font-medium max-w-[120px] truncate">
                  {user?.name}
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-1 w-48 card shadow-xl shadow-black/50 overflow-hidden z-50 animate-fade-in">
                  <div className="px-4 py-3 border-b border-slate-700/50">
                    <p className="text-xs text-slate-500 font-body">Signed in as</p>
                    <p className="text-sm text-slate-200 font-medium truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors font-body"
                  >
                    <LogoutIcon />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
