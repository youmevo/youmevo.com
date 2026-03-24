'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import './participations.css';

interface Participation {
  id: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  videoUrl: string | null;
  likesCount: number;
  status: string;
  removedReason: string | null;
  createdAt: string;
}

interface Contest {
  id: string;
  title: string;
  status: string;
  winnerId: string | null;
}

export default function ParticipationsPage() {
  const { id } = useParams<{ id: string }>();

  const [contest, setContest] = useState<Contest | null>(null);
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalPid, setModalPid] = useState<string | null>(null);
  const [removeReason, setRemoveReason] = useState('');
  const [modalError, setModalError] = useState('');
  const [removing, setRemoving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [contestRes, partRes] = await Promise.all([
        fetch(`/api/contests/${id}`),
        fetch(`/api/contests/${id}/participations`),
      ]);
      if (contestRes.ok) setContest(await contestRes.json());
      if (partRes.ok) setParticipations(await partRes.json());
    } catch {
      setError('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openRemoveModal = (pid: string) => {
    setModalPid(pid);
    setRemoveReason('');
    setModalError('');
    setShowModal(true);
  };

  const handleRemove = async () => {
    if (removeReason.trim().length < 5) {
      setModalError('La raison doit contenir au moins 5 caractères');
      return;
    }
    setRemoving(true);
    setModalError('');
    try {
      const res = await fetch(`/api/contests/${id}/participations/${modalPid}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: removeReason.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setModalError(data.error || 'Erreur lors de la suppression');
      } else {
        setShowModal(false);
        await fetchData();
      }
    } catch {
      setModalError('Erreur serveur');
    } finally {
      setRemoving(false);
    }
  };

  const handleDesignateWinner = async (participationId: string) => {
    if (!confirm('Désigner cette participation comme gagnante ?')) return;
    try {
      const res = await fetch(`/api/contests/${id}/winner`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participationId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Erreur');
      } else {
        await fetchData();
      }
    } catch {
      setError('Erreur serveur');
    }
  };

  const isCompleted = contest?.status === 'COMPLETED';
  const noWinner = isCompleted && !contest?.winnerId;

  const userName = (p: Participation) => {
    const name = `${p.user.firstName ?? ''} ${p.user.lastName ?? ''}`.trim();
    return name || p.user.email;
  };

  if (loading) {
    return (
      <main className="participations-main">
        <p className="participations-loading">Chargement...</p>
      </main>
    );
  }

  return (
    <main className="participations-main">
      <div className="participations-header">
        <Link href={`/dashboard/concours/${id}`} className="participations-back">
          &larr; Retour au concours
        </Link>
        <h1>Participations{contest ? ` - ${contest.title}` : ''}</h1>
      </div>

      {error && <p className="participations-error">{error}</p>}

      <div className="participations-table-wrapper">
        <table className="participations-table">
          <thead>
            <tr>
              <th>Participant</th>
              <th>Vidéo</th>
              <th>Likes</th>
              <th>Date</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {participations.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-cell">Aucune participation</td>
              </tr>
            ) : (
              participations.map((p) => {
                const isRemoved = p.status === 'REMOVED';
                return (
                  <tr key={p.id} className={isRemoved ? 'participation-removed' : ''}>
                    <td>{userName(p)}</td>
                    <td>
                      {p.videoUrl ? (
                        <a
                          href={p.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="video-link"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Voir la vidéo
                        </a>
                      ) : (
                        <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>
                      )}
                    </td>
                    <td>{p.likesCount ?? 0}</td>
                    <td>{new Date(p.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                    <td>
                      {isRemoved ? (
                        <span className="part-badge part-badge-removed">Supprimé</span>
                      ) : contest?.winnerId === p.user.id ? (
                        <span className="part-badge part-badge-winner">Gagnant</span>
                      ) : (
                        <span className="part-badge part-badge-active">Actif</span>
                      )}
                    </td>
                    <td>
                      <div className="part-actions">
                        {!isRemoved && (
                          <button
                            className="part-btn-remove"
                            onClick={() => openRemoveModal(p.id)}
                          >
                            Supprimer
                          </button>
                        )}
                        {noWinner && !isRemoved && (
                          <button
                            className="part-btn-winner"
                            onClick={() => handleDesignateWinner(p.id)}
                          >
                            Gagnant
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Remove modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <p className="modal-title">Supprimer la participation</p>
            <label className="modal-label">
              RAISON (min. 5 caractères)
              <input
                className="modal-input"
                value={removeReason}
                onChange={(e) => setRemoveReason(e.target.value)}
                placeholder="Raison de la suppression..."
                autoFocus
              />
            </label>
            {modalError && <p className="modal-error">{modalError}</p>}
            <div className="modal-actions">
              <button
                className="modal-btn modal-btn-cancel"
                onClick={() => setShowModal(false)}
              >
                Annuler
              </button>
              <button
                className="modal-btn modal-btn-confirm"
                onClick={handleRemove}
                disabled={removing}
              >
                {removing ? 'Suppression...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
