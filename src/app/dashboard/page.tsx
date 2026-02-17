'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import './dashboard.css';

interface User {
  firstName: string;
  lastName: string;
  email: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');

        if (!res.ok) {
          router.replace('/login');
          return;
        }

        const data = await res.json();
        setUser(data);
      } catch {
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loader">
          <div className="loader-ring" />
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="dashboard-container">
      <div className="dashboard-bg" />

      <nav className="dashboard-nav">
        <div className="nav-logo">YouMevo</div>
        <button className="logout-btn" onClick={handleLogout}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Déconnexion
        </button>
      </nav>

      <main className="dashboard-main">
        <div className="welcome-card">
          <div className="avatar">
            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
          </div>
          <h1>
            Bienvenue, <span className="highlight">{user.firstName} {user.lastName}</span>
          </h1>
          <p className="user-email">{user.email}</p>
        </div>
      </main>
    </div>
  );
}
