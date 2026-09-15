import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
          <input
            className="input"
            type="password"
            required
            autoComplete="current-password"
            style={{ minHeight: 46, fontSize: 15 }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
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
