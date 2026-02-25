'use client';

import { useState, useEffect } from 'react';
import './dashboard.css';

interface User {
  firstName: string;
  lastName: string;
  email: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) setUser(await res.json());
      } catch { /* handled by layout */ }
    };
    fetchUser();
  }, []);

  if (!user) return null;

  return (
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
  );
}
