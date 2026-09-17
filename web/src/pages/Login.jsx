import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await login(username.trim(), password);
      navigate(location.state?.from || '/en-cours', { replace: true });
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 20px',
        background: 'var(--color-neutral-200)'
      }}
    >
      <form
        onSubmit={onSubmit}
        className="card elev-sm"
        style={{ width: '100%', maxWidth: 360, borderRadius: 'var(--radius-lg)', padding: 24, gap: 16 }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--color-accent)',
              borderRadius: 14,
              padding: '8px 12px'
            }}
          >
            <img src="/quick-logo.png" alt="Quick" style={{ height: 46, width: 'auto', display: 'block' }} />
          </span>
          <h1 style={{ fontSize: 20, margin: 0 }}>Dégustathèque</h1>
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--color-neutral-700)', textAlign: 'center' }}>
            Historique des dégustations produits — pôle R&amp;D
          </p>
        </div>

        <div className="field">
          <label>Nom d'utilisateur</label>
          <input
            className="input"
            type="text"
            required
            autoComplete="username"
            style={{ minHeight: 46, fontSize: 15 }}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="prenom.nom"
          />
        </div>
        <div className="field">
          <label>Mot de passe</label>
          <div style={{ position: 'relative' }}>
            <input
              className="input"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              style={{ minHeight: 46, fontSize: 15, paddingRight: 44, width: '100%' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              style={{
                position: 'absolute',
                right: 6,
                top: '50%',
                transform: 'translateY(-50%)',
                minHeight: 34,
                minWidth: 34,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 0,
                borderRadius: 999,
                background: 'transparent',
                color: 'var(--color-neutral-600)',
                cursor: 'pointer'
              }}
            >
              {showPassword ? (
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-5 0-9.27-3.11-11-8 .69-1.94 1.88-3.68 3.36-5.06M9.9 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.11 11 8-.46 1.3-1.13 2.5-1.98 3.53M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                  <path d="M1 1l22 22" />
                </svg>
              ) : (
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {err && (
          <div
            style={{
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-accent-200)',
              color: 'var(--color-accent-800)',
              padding: '10px 13px',
              fontSize: 12.5
            }}
          >
            {err}
          </div>
        )}

        <button type="submit" className="btn btn-primary" disabled={busy} style={{ borderRadius: 999, minHeight: 48 }}>
          {busy ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </div>
  );
}
