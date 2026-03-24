'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import './concours.css';

interface Contest {
  id: string;
  title: string;
  status: string;
  participantsCount: number;
  maturityDate: string;
  createdAt: string;
}

const STATUSES = ['ALL', 'DRAFT', 'OPEN', 'VOTING', 'COMPLETED', 'CANCELLED'] as const;

const STATUS_LABELS: Record<string, string> = {
  ALL: 'Tous',
  DRAFT: 'Brouillon',
  OPEN: 'Ouvert',
  VOTING: 'Votes',
  COMPLETED: 'Terminé',
  CANCELLED: 'Annulé',
};

export default function ConcoursPage() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [filter, setFilter] = useState<string>('ALL');
  const router = useRouter();

  const fetchContests = useCallback(async () => {
    try {
      const url = filter === 'ALL' ? '/api/contests' : `/api/contests?status=${filter}`;
      const res = await fetch(url);
      if (res.ok) setContests(await res.json());
    } catch { /* silent */ }
  }, [filter]);

  useEffect(() => { fetchContests(); }, [fetchContests]);

  return (
    <main className="concours-main">
      <div className="concours-header">
        <h1>Concours</h1>
        <Link href="/dashboard/concours/nouveau" className="new-contest-btn">
          Nouveau concours
        </Link>
      </div>

      <div className="concours-filters">
        {STATUSES.map((s) => (
          <button
            key={s}
            className={`filter-btn ${filter === s ? 'filter-btn-active' : ''}`}
            onClick={() => setFilter(s)}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="concours-table-wrapper">
        <table className="concours-table">
          <thead>
            <tr>
              <th>Titre</th>
              <th>Statut</th>
              <th>Participants</th>
              <th>Date maturité</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {contests.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-cell">Aucun concours</td>
              </tr>
            ) : (
              contests.map((c) => (
                <tr
                  key={c.id}
                  className="concours-row"
                  onClick={() => router.push(`/dashboard/concours/${c.id}`)}
                >
                  <td>{c.title}</td>
                  <td>
                    <span className={`status-badge status-${c.status}`}>
                      {STATUS_LABELS[c.status] || c.status}
                    </span>
                  </td>
                  <td>{c.participantsCount ?? 0}</td>
                  <td>{new Date(c.maturityDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                  <td>
                    <Link
                      href={`/dashboard/concours/${c.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="new-contest-btn"
                      style={{ padding: '4px 14px', fontSize: '0.75rem' }}
                    >
                      Voir
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
