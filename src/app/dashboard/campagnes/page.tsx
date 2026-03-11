'use client';

import { useState, useEffect, useCallback } from 'react';
import './campagnes.css';

interface Campaign {
  id: string;
  title: string;
  body: string;
  target: string;
  targetValue: string | null;
  deepLink: string | null;
  sentCount: number;
  sentAt: string;
}

interface UserResult {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

export default function CampagnesPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState<'all' | 'tag' | 'user' | 'anonymous'>('all');
  const [targetValue, setTargetValue] = useState('');
  const [deepLink, setDeepLink] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // User search
  const [userQuery, setUserQuery] = useState('');
  const [userResults, setUserResults] = useState<UserResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);

  const fetchCampaigns = useCallback(async () => {
    const res = await fetch('/api/notifications/campaigns');
    if (res.ok) setCampaigns(await res.json());
  }, []);

  const fetchTags = useCallback(async () => {
    const res = await fetch('/api/notifications/tags');
    if (res.ok) setTags(await res.json());
  }, []);

  useEffect(() => {
    fetchCampaigns();
    fetchTags();
  }, [fetchCampaigns, fetchTags]);

  // User search debounce
  useEffect(() => {
    if (target !== 'user' || userQuery.length < 2) {
      setUserResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      const res = await fetch(`/api/notifications/users/search?q=${encodeURIComponent(userQuery)}`);
      if (res.ok) setUserResults(await res.json());
    }, 300);
    return () => clearTimeout(timeout);
  }, [userQuery, target]);

  const handleSend = async () => {
    setError('');
    setSuccess('');
    if (!title.trim() || !body.trim()) {
      setError('Titre et message requis');
      return;
    }
    if (target === 'tag' && !targetValue) {
      setError('Sélectionnez un tag');
      return;
    }
    if (target === 'user' && !selectedUser) {
      setError('Sélectionnez un utilisateur');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/notifications/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          target,
          targetValue: target === 'tag' ? targetValue : target === 'user' ? selectedUser?.id : undefined,
          deepLink: deepLink.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Erreur lors de l\'envoi');
      } else {
        const campaign = await res.json();
        setSuccess(`Campagne envoyée à ${campaign.sentCount} appareil(s)`);
        setTitle('');
        setBody('');
        setTarget('all');
        setTargetValue('');
        setDeepLink('');
        setSelectedUser(null);
        setUserQuery('');
        await fetchCampaigns();
      }
    } catch {
      setError('Erreur serveur');
    } finally {
      setSending(false);
    }
  };

  const handleArchive = async (id: string) => {
    const res = await fetch(`/api/notifications/campaigns/${id}/archive`, { method: 'PATCH' });
    if (res.ok) await fetchCampaigns();
  };

  const formatTarget = (c: Campaign) => {
    if (c.target === 'all') return 'Tous';
    if (c.target === 'anonymous') return 'Anonymes';
    if (c.target === 'tag') return `Tag: ${c.targetValue}`;
    return `Utilisateur`;
  };

  return (
    <main className="campagnes-main">
      <div className="campagnes-header">
        <h1>Campagnes Push</h1>
      </div>

      <div className="campaign-form">
        <label>
          TITRE
          <input
            className="campaign-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre de la notification"
          />
        </label>

        <label>
          MESSAGE
          <textarea
            className="campaign-textarea"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Corps de la notification"
          />
        </label>

        <div className="campaign-form-row">
          <label>
            CIBLE
            <select
              className="campaign-select"
              value={target}
              onChange={(e) => {
                setTarget(e.target.value as 'all' | 'tag' | 'user');
                setTargetValue('');
                setSelectedUser(null);
                setUserQuery('');
              }}
            >
              <option value="all">Tous les utilisateurs</option>
              <option value="anonymous">Anonymes (app ouverte, jamais connecté)</option>
              <option value="tag">Par tag</option>
              <option value="user">Utilisateur spécifique</option>
            </select>
          </label>

          {target === 'tag' && (
            <label>
              TAG
              <select
                className="campaign-select"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
              >
                <option value="">Sélectionner un tag</option>
                {tags.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
          )}

          {target === 'user' && (
            <label>
              UTILISATEUR
              <div className="user-search-wrapper">
                <input
                  className="campaign-input"
                  value={selectedUser ? `${selectedUser.firstName ?? ''} ${selectedUser.lastName ?? ''} (${selectedUser.email})` : userQuery}
                  onChange={(e) => {
                    setUserQuery(e.target.value);
                    setSelectedUser(null);
                  }}
                  placeholder="Rechercher par nom ou email"
                />
                {userResults.length > 0 && !selectedUser && (
                  <div className="user-search-results">
                    {userResults.map((u) => (
                      <div
                        key={u.id}
                        className="user-search-item"
                        onClick={() => {
                          setSelectedUser(u);
                          setUserResults([]);
                        }}
                      >
                        {u.firstName ?? ''} {u.lastName ?? ''} — {u.email}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </label>
          )}
        </div>

        <label>
          DEEP LINK (optionnel)
          <input
            className="campaign-input"
            value={deepLink}
            onChange={(e) => setDeepLink(e.target.value)}
            placeholder="/profile, /feed, etc."
          />
        </label>

        {error && <p className="campaign-error">{error}</p>}
        {success && <p className="campaign-success">{success}</p>}

        <button className="campaign-btn" onClick={handleSend} disabled={sending}>
          {sending ? 'Envoi en cours...' : 'Envoyer la campagne'}
        </button>
      </div>

      <div className="campagnes-table-wrapper">
        <table className="campagnes-table">
          <thead>
            <tr>
              <th>Titre</th>
              <th>Cible</th>
              <th>Envoyés</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {campaigns.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-cell">Aucune campagne envoyée</td>
              </tr>
            ) : (
              campaigns.map((c) => (
                <tr key={c.id}>
                  <td>{c.title}</td>
                  <td><span className="target-badge">{formatTarget(c)}</span></td>
                  <td>{c.sentCount}</td>
                  <td>{new Date(c.sentAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  <td>
                    <button className="archive-btn" onClick={() => handleArchive(c.id)} title="Archiver">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
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
