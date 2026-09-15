import { useNavigate } from 'react-router-dom';
import { POLE_LABELS } from '../constants.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Header({ kicker, heading, showBack, showNew }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <header
      style={{
        flex: 'none',
        background: 'var(--color-accent)',
        color: '#fff',
        padding: '20px 18px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#fff',
            borderRadius: 12,
            padding: '5px 8px'
          }}
        >
          <img src="/quick-logo.png" alt="Quick" style={{ height: 54, width: 'auto', display: 'block' }} />
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {user && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '.03em',
                color: '#fff',
                background: 'rgba(0,0,0,.18)',
                borderRadius: 999,
                padding: '7px 12px',
                whiteSpace: 'nowrap',
                maxWidth: 140,
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
              title={user.firstName + ' ' + user.lastName + ' · ' + POLE_LABELS[user.pole]}
            >
              {user.firstName} {user.lastName.charAt(0)}. · {POLE_LABELS[user.pole]}
            </span>
          )}
          <button
            type="button"
            onClick={logout}
            aria-label="Se déconnecter"
            title="Se déconnecter"
            style={{
              minHeight: 36,
              minWidth: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 0,
              borderRadius: 999,
              background: 'rgba(0,0,0,.18)',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="m16 17 5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: '#fff', fontWeight: 600 }}>
            {kicker}
          </div>
          <h1
            style={{
              margin: '2px 0 0',
              fontSize: 24,
              lineHeight: '32px',
              color: '#fff',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {heading}
          </h1>
        </div>
        {showNew && (
          <button
            type="button"
            onClick={() => navigate('/nouveau')}
            style={{
              flex: 'none',
              minHeight: 44,
              padding: '0 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              border: 0,
              borderRadius: 999,
              cursor: 'pointer',
              background: '#fff',
              color: 'var(--color-accent-700)',
              fontSize: 13.5,
              fontWeight: 600
            }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nouveau
          </button>
        )}
        {showBack && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              flex: 'none',
              minHeight: 44,
              padding: '0 16px',
              border: '1.5px solid rgba(255,255,255,.7)',
              borderRadius: 999,
              cursor: 'pointer',
              background: 'transparent',
              color: '#fff',
              fontSize: 13.5
            }}
          >
            Retour
          </button>
        )}
      </div>
    </header>
  );
}
