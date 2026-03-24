'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import * as tus from 'tus-js-client';
import './nouveau.css';

export default function NouveauConcoursPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reward, setReward] = useState('');
  const [maxParticipants, setMaxParticipants] = useState<number>(50);
  const [maxLikesPerUser, setMaxLikesPerUser] = useState<number>(5);
  const [publishDate, setPublishDate] = useState('');
  const [maturityDate, setMaturityDate] = useState('');
  const [voteEndDate, setVoteEndDate] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setVideoFile(file);
  };

  const handleSubmit = async () => {
    setError('');

    if (!title.trim()) {
      setError('Le titre est requis');
      return;
    }
    if (!maxParticipants || maxParticipants < 1) {
      setError('Le nombre max de participants est requis');
      return;
    }
    if (!maturityDate) {
      setError('La date de maturité est requise');
      return;
    }
    if (!voteEndDate) {
      setError('La date de fin des votes est requise');
      return;
    }

    setSubmitting(true);

    try {
      const body: Record<string, unknown> = {
        title: title.trim(),
        maxParticipants,
        maxLikesPerUser,
        maturityAt: new Date(maturityDate).toISOString(),
        voteEndAt: new Date(voteEndDate).toISOString(),
      };

      if (description.trim()) body.description = description.trim();
      if (reward.trim()) body.reward = reward.trim();
      if (publishDate) body.publishAt = new Date(publishDate).toISOString();

      const res = await fetch('/api/contests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Erreur lors de la création');
        setSubmitting(false);
        return;
      }

      const contest = await res.json();

      if (videoFile && contest.uploadInfo) {
        setUploading(true);
        setSubmitting(false);

        const upload = new tus.Upload(videoFile, {
          endpoint: 'https://video.bunnycdn.com/tusupload',
          retryDelays: [0, 3000, 5000, 10000, 20000],
          headers: {
            AuthorizationSignature: contest.uploadInfo.signature,
            AuthorizationExpire: contest.uploadInfo.expiration,
            VideoId: contest.introVideoId,
            LibraryId: contest.uploadInfo.libraryId,
          },
          metadata: {
            filetype: videoFile.type,
            title: contest.title,
          },
          onProgress: (bytesUploaded: number, bytesTotal: number) => {
            setProgress(Math.round((bytesUploaded / bytesTotal) * 100));
          },
          onSuccess: () => {
            router.push('/dashboard/concours');
          },
          onError: (err: Error) => {
            setError(err.message || 'Erreur lors de l\'upload');
            setUploading(false);
          },
        });
        upload.start();
      } else {
        router.push('/dashboard/concours');
      }
    } catch {
      setError('Erreur serveur');
      setSubmitting(false);
    }
  };

  return (
    <main className="nouveau-main">
      <div className="nouveau-header">
        <Link href="/dashboard/concours" className="nouveau-back">
          &larr; Retour aux concours
        </Link>
        <h1>Nouveau concours</h1>
      </div>

      <div className="nouveau-form">
        <label>
          TITRE *
          <input
            className="nouveau-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre du concours"
          />
        </label>

        <label>
          DESCRIPTION
          <textarea
            className="nouveau-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description du concours (optionnel)"
          />
        </label>

        <label>
          RECOMPENSE
          <input
            className="nouveau-input"
            value={reward}
            onChange={(e) => setReward(e.target.value)}
            placeholder="Ex: 500 EUR, iPhone 15, etc. (optionnel)"
          />
        </label>

        <div className="nouveau-form-row">
          <label>
            MAX PARTICIPANTS *
            <input
              type="number"
              className="nouveau-input"
              min={1}
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(Number(e.target.value))}
            />
          </label>

          <label>
            MAX LIKES PAR UTILISATEUR
            <input
              type="number"
              className="nouveau-input"
              min={1}
              value={maxLikesPerUser}
              onChange={(e) => setMaxLikesPerUser(Number(e.target.value))}
            />
          </label>
        </div>

        <label>
          DATE DE PUBLICATION (laisser vide = immédiat)
          <input
            type="datetime-local"
            className="nouveau-input"
            value={publishDate}
            onChange={(e) => setPublishDate(e.target.value)}
          />
        </label>

        <div className="nouveau-form-row">
          <label>
            DATE DE MATURITE *
            <input
              type="datetime-local"
              className="nouveau-input"
              value={maturityDate}
              onChange={(e) => setMaturityDate(e.target.value)}
            />
          </label>

          <label>
            DATE FIN DES VOTES *
            <input
              type="datetime-local"
              className="nouveau-input"
              value={voteEndDate}
              onChange={(e) => setVoteEndDate(e.target.value)}
            />
          </label>
        </div>

        <label>
          VIDEO D&apos;INTRODUCTION
          <div className="upload-zone" onClick={handleFileSelect}>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="upload-hidden"
              onChange={handleFileChange}
            />
            {videoFile ? (
              <span className="upload-zone-file">{videoFile.name}</span>
            ) : (
              <span className="upload-zone-text">Cliquer pour sélectionner une vidéo</span>
            )}
          </div>
        </label>

        {uploading && (
          <div className="upload-progress-wrapper">
            <div className="upload-progress-bar">
              <div
                className="upload-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="upload-progress-text">Upload en cours... {progress}%</p>
          </div>
        )}

        {error && <p className="nouveau-error">{error}</p>}

        <button
          className="nouveau-btn"
          onClick={handleSubmit}
          disabled={submitting || uploading}
        >
          {submitting ? 'Création...' : uploading ? `Upload ${progress}%` : 'Créer le concours'}
        </button>
      </div>
    </main>
  );
}
