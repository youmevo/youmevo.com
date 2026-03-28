'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import './login.css';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement,
            config: {
              theme?: string;
              size?: string;
              width?: number;
              text?: string;
              shape?: string;
              logo_alignment?: string;
            }
          ) => void;
        };
      };
    };
    AppleID?: {
      auth: {
        init: (config: {
          clientId: string;
          scope: string;
          redirectURI: string;
          usePopup: boolean;
        }) => void;
        signIn: () => Promise<{
          authorization: { id_token: string; code: string };
          user?: { name?: { firstName?: string; lastName?: string }; email?: string };
        }>;
      };
    };
  }
}

export default function LoginPage() {
  const showSocialLogin = process.env.NEXT_PUBLIC_showSocialLogin === 'true';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const [appleLoading, setAppleLoading] = useState(false);

  const handleGoogleResponse = useCallback(async (response: { credential: string }) => {
    setError('');

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: response.credential }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Échec de la connexion Google');
        return;
      }

      window.location.href = '/dashboard';
    } catch {
      setError('Erreur de connexion au serveur');
    }
  }, []);

  const handleAppleSignIn = async () => {
    if (!window.AppleID) {
      setError('Apple Sign In non disponible');
      return;
    }

    setAppleLoading(true);
    setError('');

    try {
      window.AppleID.auth.init({
        clientId: process.env.NEXT_PUBLIC_APPLE_CLIENT_ID!,
        scope: 'name email',
        redirectURI: window.location.origin + '/login',
        usePopup: true,
      });

      const result = await window.AppleID.auth.signIn();
      const identityToken = result.authorization.id_token;
      const firstName = result.user?.name?.firstName;
      const lastName = result.user?.name?.lastName;

      const res = await fetch('/api/auth/apple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identityToken, firstName, lastName }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Échec de la connexion Apple');
        return;
      }

      window.location.href = '/dashboard';
    } catch (err: any) {
      // L'utilisateur a fermé la popup → pas d'erreur à afficher
      if (err?.error !== 'popup_closed_by_user') {
        setError('Erreur de connexion Apple');
      }
    } finally {
      setAppleLoading(false);
    }
  };

  const initGoogleButton = useCallback(() => {
    if (window.google && googleBtnRef.current) {
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        callback: handleGoogleResponse,
      });

      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'filled_black',
        size: 'large',
        width: 360,
        text: 'signin_with',
        shape: 'pill',
      });
    }
  }, [handleGoogleResponse]);

  useEffect(() => {
    if (window.google) {
      initGoogleButton();
    }
  }, [initGoogleButton]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Identifiants invalides');
        return;
      }

      window.location.href = '/dashboard';
    } catch {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {showSocialLogin && (
        <>
          <Script
            src="https://accounts.google.com/gsi/client"
            strategy="afterInteractive"
            onLoad={initGoogleButton}
          />
          <Script
            src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"
            strategy="afterInteractive"
          />
        </>
      )}

      <div className="login-container">
        <Link href="/" className="back-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          Retour
        </Link>

        <div className="login-card">
          <div className="login-logo">
            <h2>YouMevo</h2>
          </div>
          <p className="login-subtitle">Connectez-vous à votre compte</p>

          {error && <div className="error-message">{error}</div>}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Mot de passe</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="login-btn"
              disabled={loading}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          {showSocialLogin && (
            <>
              <div className="divider">
                <span>ou</span>
              </div>

              <div className="google-btn-wrapper" ref={googleBtnRef} />

              <button
                className="apple-btn"
                onClick={handleAppleSignIn}
                disabled={appleLoading}
                type="button"
              >
                <svg className="apple-btn-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.032 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
                </svg>
                {appleLoading ? 'Connexion...' : 'Se connecter avec Apple'}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
