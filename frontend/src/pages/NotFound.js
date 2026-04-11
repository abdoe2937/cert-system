import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NotFound() {
  const { user } = useAuth();
  const home = user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/login';

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="text-center animate-slide-up">
        <p className="font-mono text-8xl font-bold text-gold-500/20 mb-2">404</p>
        <h1 className="font-display text-2xl font-bold text-white mb-2">Page Not Found</h1>
        <p className="text-slate-400 font-body mb-6">The page you're looking for doesn't exist.</p>
        <Link to={home} className="btn-primary inline-flex">Go Home</Link>
      </div>
    </div>
  );
}
