'use client';

import { useState, useEffect, useCallback } from 'react';
import './templates.css';

interface NotificationTemplate {
  id: string;
  eventType: string;
  titleTemplate: string;
  bodyTemplate: string;
  locale: string;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  CONTEST_PUBLISHED: 'Concours publié',
  CONTEST_MATURED: 'Concours arrivé à maturité',
  CONTEST_VOTING_END: 'Fin des votes',
  CONTEST_COMPLETED: 'Concours terminé',
  CONTEST_CANCELLED: 'Concours annulé',
  PARTICIPATION_REMOVED: 'Participation supprimée',
  WINNER_ANNOUNCED: 'Gagnant annoncé',
};

const AVAILABLE_VARIABLES = [
  '{{contest_title}}',
  '{{contest_description}}',
  '{{winner_name}}',
  '{{participant_name}}',
  '{{vote_count}}',
  '{{participants_count}}',
];

export default function NotificationTemplatesPage() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Per-template edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/contest-notification-templates');
      if (res.ok) {
        setTemplates(await res.json());
      } else {
        setError('Erreur de chargement');
      }
    } catch {
      setError('Erreur serveur');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const startEdit = (t: NotificationTemplate) => {
    setEditingId(t.id);
    setEditTitle(t.titleTemplate);
    setEditBody(t.bodyTemplate);
    setSaveError('');
    setSaveSuccess('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setSaveError('');
    setSaveSuccess('');
  };

  const handleSave = async (templateId: string) => {
    setSaveError('');
    setSaveSuccess('');
    if (!editTitle.trim()) {
      setSaveError('Le titre ne peut pas être vide');
      return;
    }
    if (!editBody.trim()) {
      setSaveError('Le corps ne peut pas être vide');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/contest-notification-templates/${templateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titleTemplate: editTitle.trim(),
          bodyTemplate: editBody.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSaveError(data.error || 'Erreur lors de la sauvegarde');
      } else {
        setSaveSuccess('Template sauvegardé');
        setEditingId(null);
        await fetchTemplates();
      }
    } catch {
      setSaveError('Erreur serveur');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="templates-main">
        <p className="templates-loading">Chargement...</p>
      </main>
    );
  }

  return (
    <main className="templates-main">
      <div className="templates-header">
        <h1>Templates de notifications</h1>
      </div>

      {error && <p className="templates-error">{error}</p>}

      {templates.length === 0 && !error ? (
        <p className="templates-empty">Aucun template configuré</p>
      ) : (
        <div className="templates-list">
          {templates.map((t) => {
            const isEditing = editingId === t.id;
            return (
              <div key={t.id} className="template-card">
                <div className="template-card-header">
                  <span className="template-event-type">
                    {EVENT_TYPE_LABELS[t.eventType] || t.eventType}
                  </span>
                  <span className="template-locale">{t.locale}</span>
                </div>

                {isEditing ? (
                  <>
                    <div className="template-field">
                      <p className="template-field-label">Titre</p>
                      <input
                        className="template-input"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                      />
                    </div>
                    <div className="template-field">
                      <p className="template-field-label">Corps</p>
                      <textarea
                        className="template-textarea"
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                      />
                    </div>

                    <div className="template-variables">
                      <p className="template-variables-title">Variables disponibles</p>
                      <div className="template-variables-list">
                        {AVAILABLE_VARIABLES.map((v) => (
                          <span key={v} className="template-variable-tag">{v}</span>
                        ))}
                      </div>
                    </div>

                    {saveError && <p className="template-error">{saveError}</p>}

                    <div className="template-actions">
                      <button
                        className="template-btn-save"
                        onClick={() => handleSave(t.id)}
                        disabled={saving}
                      >
                        {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                      </button>
                      <button className="template-btn-cancel" onClick={cancelEdit}>
                        Annuler
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="template-field">
                      <p className="template-field-label">Titre</p>
                      <p className="template-field-value">{t.titleTemplate}</p>
                    </div>
                    <div className="template-field">
                      <p className="template-field-label">Corps</p>
                      <p className="template-field-value">{t.bodyTemplate}</p>
                    </div>

                    <div className="template-variables">
                      <p className="template-variables-title">Variables disponibles</p>
                      <div className="template-variables-list">
                        {AVAILABLE_VARIABLES.map((v) => (
                          <span key={v} className="template-variable-tag">{v}</span>
                        ))}
                      </div>
                    </div>

                    {saveSuccess && editingId === null && (
                      <p className="template-success">{saveSuccess}</p>
                    )}

                    <div className="template-actions">
                      <button className="template-btn-edit" onClick={() => startEdit(t)}>
                        Modifier
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
