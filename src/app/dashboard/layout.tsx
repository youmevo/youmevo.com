'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import './dashboard.css';

interface User {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.replace('/login');
          return;
        }
        const data = await res.json();
        if (data.role !== 'admin' && data.role !== 'legend') {
          router.replace('/login');
          return;
        }
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
        <div className="nav-left">
          <div className="nav-logo">YouMevo</div>
          <div className="nav-links">
            <Link
              href="/dashboard"
              className={`nav-link ${pathname === '/dashboard' ? 'nav-link-active' : ''}`}
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/invitations"
              className={`nav-link ${pathname === '/dashboard/invitations' ? 'nav-link-active' : ''}`}
            >
              Inviter des membres
            </Link>
            <Link
              href="/dashboard/campagnes"
              className={`nav-link ${pathname === '/dashboard/campagnes' ? 'nav-link-active' : ''}`}
            >
              Campagnes
            </Link>
            {user.role === 'admin' && (
              <Link
                href="/dashboard/config"
                className={`nav-link ${pathname === '/dashboard/config' ? 'nav-link-active' : ''}`}
              >
                Config
              </Link>
            )}
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Déconnexion
        </button>
      </nav>
      {children}
    </div>
  );
}
