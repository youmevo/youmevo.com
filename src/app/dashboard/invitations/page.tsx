'use client';

import {useState, useEffect, useCallback, Fragment} from 'react';
import './invitations.css';

interface InvitationUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  banned: boolean;
}

interface Invitation {
  id: string;
  code: string;
  createdBy: { firstName: string | null; lastName: string | null; email: string } | null;
  usedBy: InvitationUser[];
  maxUses: number;
  usedCount: number;
  active: boolean;
  createdAt: string;
}

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [maxUses, setMaxUses] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchInvitations = useCallback(async () => {
    try {
      const res = await fetch('/api/invitations');
      if (res.ok) setInvitations(await res.json());
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchInvitations(); }, [fetchInvitations]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxUses }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Erreur lors de la génération');
      } else {
        await fetchInvitations();
      }
    } catch {
      setError('Erreur réseau');
    } finally {
      setGenerating(false);
    }
  };

  const handleBan = async (userId: string) => {
    if (!confirm('Bannir cet utilisateur ?')) return;
    try {
      const res = await fetch(`/api/users/${userId}/ban`, { method: 'PATCH' });
      if (res.ok) await fetchInvitations();
    } catch { /* silent */ }
  };

  return (
    <main className="invitations-main">
      <div className="invitations-header">
        <h1>Inviter des membres</h1>
        <div className="generate-form">
          <label>
            Utilisations max
            <input
              type="number"
              min={1}
              max={100}
              value={maxUses}
              onChange={(e) => setMaxUses(Number(e.target.value))}
              className="max-uses-input"
            />
          </label>
          <button
            className="generate-btn"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? 'Génération...' : 'Générer un code'}
          </button>
        </div>
        {error && <p className="invite-error">{error}</p>}
      </div>

      <div className="invitations-table-wrapper">
        <table className="invitations-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Créateur</th>
              <th>Utilisations</th>
              <th>Actif</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {invitations.map((inv) => (
              <Fragment key={inv.id}>
                <tr
                  className={`invite-row ${expandedId === inv.id ? 'expanded' : ''}`}
                  onClick={() => setExpandedId(expandedId === inv.id ? null : inv.id)}
                >
                  <td className="code-cell">{inv.code}</td>
                  <td>{inv.createdBy ? `${inv.createdBy.firstName ?? ''} ${inv.createdBy.lastName ?? ''}`.trim() || inv.createdBy.email : '—'}</td>
                  <td>{inv.usedCount} / {inv.maxUses}</td>
                  <td><span className={`badge ${inv.active ? 'badge-active' : 'badge-inactive'}`}>{inv.active ? 'Oui' : 'Non'}</span></td>
                  <td>{new Date(inv.createdAt).toLocaleDateString('fr-FR')}</td>
                </tr>
                {expandedId === inv.id && inv.usedBy.length > 0 && (
                  <tr key={`${inv.id}-users`} className="users-row">
                    <td colSpan={5}>
                      <div className="users-list">
                        <p className="users-title">Utilisateurs inscrits :</p>
                        {inv.usedBy.map((u) => (
                          <div key={u.id} className="user-item">
                            <span>{u.firstName ?? ''} {u.lastName ?? ''} — {u.email}</span>
                            {u.banned ? (
                              <span className="badge badge-banned">Banni</span>
                            ) : (
                              <button className="ban-btn" onClick={(e) => { e.stopPropagation(); handleBan(u.id); }}>
                                Bannir
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {invitations.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-cell">Aucun code d&apos;invitation</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
