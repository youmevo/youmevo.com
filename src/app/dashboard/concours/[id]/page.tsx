'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import './detail.css';

interface Contest {
  id: string;
  title: string;
  description: string | null;
  reward: string | null;
  status: string;
  maxParticipants: number;
  maxLikesPerUser: number;
  participantsCount: number;
  publishAt: string | null;
  maturityAt: string;
  voteEndAt: string;
  introVideoId: string | null;
  introVideoUrl: string | null;
  winnerId: string | null;
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  OPEN: 'Ouvert',
  VOTING: 'Votes',
  COMPLETED: 'Terminé',
  CANCELLED: 'Annulé',
};

function toLocalDatetime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ContestDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [contest, setContest] = useState<Contest | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editReward, setEditReward] = useState('');
  const [editMaxParticipants, setEditMaxParticipants] = useState(50);
  const [editMaxLikes, setEditMaxLikes] = useState(5);
  const [editPublishDate, setEditPublishDate] = useState('');
  const [editMaturityDate, setEditMaturityDate] = useState('');
  const [editVoteEndDate, setEditVoteEndDate] = useState('');

  const fetchContest = useCallback(async () => {
    try {
      const res = await fetch(`/api/contests/${id}`);
      if (!res.ok) {
        setError('Concours introuvable');
        setLoading(false);
        return;
      }
      const data: Contest = await res.json();
      setContest(data);
      setEditTitle(data.title);
      setEditDescription(data.description ?? '');
      setEditReward(data.reward ?? '');
      setEditMaxParticipants(data.maxParticipants);
      setEditMaxLikes(data.maxLikesPerUser);
      setEditPublishDate(toLocalDatetime(data.publishAt));
      setEditMaturityDate(toLocalDatetime(data.maturityAt));
      setEditVoteEndDate(toLocalDatetime(data.voteEndAt));
    } catch {
      setError('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchContest(); }, [fetchContest]);

  const handleSave = async () => {
    setError('');
    setSuccess('');
    if (!editTitle.trim()) { setError('Le titre est requis'); return; }
    if (!editMaturityDate) { setError('La date de maturité est requise'); return; }
    if (!editVoteEndDate) { setError('La date de fin des votes est requise'); return; }

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        reward: editReward.trim() || null,
        maxParticipants: editMaxParticipants,
        maxLikesPerUser: editMaxLikes,
        maturityAt: new Date(editMaturityDate).toISOString(),
        voteEndAt: new Date(editVoteEndDate).toISOString(),
      };
      if (editPublishDate) body.publishAt = new Date(editPublishDate).toISOString();

      const res = await fetch(`/api/contests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Erreur lors de la sauvegarde');
      } else {
        setSuccess('Concours mis à jour');
        await fetchContest();
      }
    } catch {
      setError('Erreur serveur');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Annuler ce concours ? Cette action est irréversible.')) return;
    try {
      const res = await fetch(`/api/contests/${id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/dashboard/concours');
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Erreur lors de l\'annulation');
      }
    } catch {
      setError('Erreur serveur');
    }
  };

  if (loading) {
    return (
      <main className="detail-main">
        <p className="detail-loading">Chargement...</p>
      </main>
    );
  }

  if (!contest) {
    return (
      <main className="detail-main">
        <Link href="/dashboard/concours" className="detail-back">&larr; Retour aux concours</Link>
        <p className="detail-error">{error || 'Concours introuvable'}</p>
      </main>
    );
  }

  const isDraft = contest.status === 'DRAFT';
  const canCancel = contest.status !== 'CANCELLED' && contest.status !== 'COMPLETED';
  const isCompleted = contest.status === 'COMPLETED';
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <main className="detail-main">
      <div className="detail-header">
        <Link href="/dashboard/concours" className="detail-back">&larr; Retour aux concours</Link>
        <h1>{contest.title}</h1>
      </div>

      {/* Info card */}
      <div className="detail-card">
        <div className="detail-info-grid">
          <div className="detail-info-item">
            <span className="detail-info-label">Statut</span>
            <span className="detail-info-value">
              <span className={`status-badge status-${contest.status}`}>
                {STATUS_LABELS[contest.status] || contest.status}
              </span>
            </span>
          </div>
          <div className="detail-info-item">
            <span className="detail-info-label">Participants</span>
            <span className="detail-info-value">{contest.participantsCount ?? 0} / {contest.maxParticipants}</span>
          </div>
          <div className="detail-info-item">
            <span className="detail-info-label">Max likes/user</span>
            <span className="detail-info-value">{contest.maxLikesPerUser}</span>
          </div>
          <div className="detail-info-item">
            <span className="detail-info-label">Date maturité</span>
            <span className="detail-info-value">{formatDate(contest.maturityAt)}</span>
          </div>
          <div className="detail-info-item">
            <span className="detail-info-label">Fin des votes</span>
            <span className="detail-info-value">{formatDate(contest.voteEndAt)}</span>
          </div>
          {contest.publishAt && (
            <div className="detail-info-item">
              <span className="detail-info-label">Publication</span>
              <span className="detail-info-value">{formatDate(contest.publishAt)}</span>
            </div>
          )}
          {contest.reward && (
            <div className="detail-info-item">
              <span className="detail-info-label">Récompense</span>
              <span className="detail-info-value">{contest.reward}</span>
            </div>
          )}
          <div className="detail-info-item">
            <span className="detail-info-label">Créé le</span>
            <span className="detail-info-value">{formatDate(contest.createdAt)}</span>
          </div>
        </div>

        {contest.description && (
          <p className="detail-description">{contest.description}</p>
        )}

        {contest.introVideoUrl && (
          <div className="detail-video">
            <iframe
              src={contest.introVideoUrl}
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Vidéo d'introduction"
            />
          </div>
        )}

        {isCompleted && !contest.winnerId && (
          <div className="detail-waiting">En attente de décision du gagnant</div>
        )}

        <div className="detail-actions">
          <Link href={`/dashboard/concours/${id}/participations`} className="detail-btn detail-btn-secondary">
            Gérer les participations
          </Link>
          {canCancel && (
            <button className="detail-btn detail-btn-danger" onClick={handleCancel}>
              Annuler le concours
            </button>
          )}
        </div>
      </div>

      {/* Edit form (DRAFT only) */}
      {isDraft && (
        <div className="detail-card">
          <h2 style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-secondary)', fontSize: '1.1rem', marginBottom: '16px' }}>
            Modifier le concours
          </h2>
          <div className="detail-form">
            <label>
              TITRE *
              <input
                className="detail-input"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </label>

            <label>
              DESCRIPTION
              <textarea
                className="detail-textarea"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </label>

            <label>
              RECOMPENSE
              <input
                className="detail-input"
                value={editReward}
                onChange={(e) => setEditReward(e.target.value)}
              />
            </label>

            <div className="detail-form-row">
              <label>
                MAX PARTICIPANTS *
                <input
                  type="number"
                  className="detail-input"
                  min={1}
                  value={editMaxParticipants}
                  onChange={(e) => setEditMaxParticipants(Number(e.target.value))}
                />
              </label>
              <label>
                MAX LIKES / UTILISATEUR
                <input
                  type="number"
                  className="detail-input"
                  min={1}
                  value={editMaxLikes}
                  onChange={(e) => setEditMaxLikes(Number(e.target.value))}
                />
              </label>
            </div>

            <label>
              DATE DE PUBLICATION
              <input
                type="datetime-local"
                className="detail-input"
                value={editPublishDate}
                onChange={(e) => setEditPublishDate(e.target.value)}
              />
            </label>

            <div className="detail-form-row">
              <label>
                DATE DE MATURITE *
                <input
                  type="datetime-local"
                  className="detail-input"
                  value={editMaturityDate}
                  onChange={(e) => setEditMaturityDate(e.target.value)}
                />
              </label>
              <label>
                DATE FIN DES VOTES *
                <input
                  type="datetime-local"
                  className="detail-input"
                  value={editVoteEndDate}
                  onChange={(e) => setEditVoteEndDate(e.target.value)}
                />
              </label>
            </div>

            {error && <p className="detail-error">{error}</p>}
            {success && <p className="detail-success">{success}</p>}

            <button className="detail-btn" onClick={handleSave} disabled={saving}>
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </div>
      )}

      {/* Show error/success outside edit form for non-draft */}
      {!isDraft && error && <p className="detail-error">{error}</p>}
    </main>
  );
}
