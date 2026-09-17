import { useState } from 'react';

export default function PhotoLightbox({ photo, onClose }) {
  const [busy, setBusy] = useState(false);

  if (!photo) return null;

  async function download() {
    setBusy(true);
    try {
      const res = await fetch(photo.url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'photo-' + (photo.id || Date.now()) + '.jpg';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Repli : la plupart des buckets publics servent quand même l'image dans un nouvel onglet.
      window.open(photo.url, '_blank');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      role="button"
      tabIndex={-1}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,13,12,.92)', zIndex: 300, display: 'flex', flexDirection: 'column' }}
    >
      <div style={{ flex: 'none', padding: '18px 16px 10px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            download();
          }}
          disabled={busy}
          style={{
            minHeight: 44,
            padding: '0 16px',
            borderRadius: 999,
            border: 0,
            cursor: busy ? 'wait' : 'pointer',
            background: 'var(--color-accent)',
            color: '#fff',
            fontSize: 13.5,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 7
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v13" />
            <path d="m7 11 5 5 5-5" />
            <path d="M4 21h16" />
          </svg>
          {busy ? 'Téléchargement…' : 'Télécharger'}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Fermer"
          style={{
            minHeight: 44,
            minWidth: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(245,234,216,.35)',
            borderRadius: 999,
            background: 'transparent',
            color: '#f5ead8',
            cursor: 'pointer'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px 24px' }}>
        <img src={photo.url} alt="" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 'var(--radius-md)' }} />
      </div>
    </div>
  );
}
