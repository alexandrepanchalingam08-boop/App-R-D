import { useEffect, useRef, useState } from 'react';
import { useCamera } from '../context/CameraContext.jsx';
import { PHOTO_LABELS, PHOTO_LABEL_TEXT } from '../constants.js';
import { api } from '../api.js';
import { useData } from '../context/DataContext.jsx';

export default function CameraOverlay() {
  const { request, closeCamera } = useCamera();
  const { refresh } = useData();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [label, setLabel] = useState(request?.targetLabel || 'ASPECT');
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!request) return;
    setLabel(request.targetLabel || 'ASPECT');
    setErr(null);
    const md = navigator.mediaDevices;
    if (!md || !md.getUserMedia) {
      setErr('Aperçu caméra indisponible ici. Sur téléphone, « Galerie » ouvre directement l’appareil photo.');
      return;
    }
    md.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setErr(null);
      })
      .catch(() => setErr('Accès caméra refusé ou bloqué dans l’aperçu. Utilisez « Galerie » — sur téléphone, cela ouvre l’appareil photo.'));

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [request]);

  if (!request) return null;

  async function uploadBlob(blob) {
    setBusy(true);
    try {
      const file = new File([blob], 'photo.jpg', { type: blob.type || 'image/jpeg' });
      const res = await api.uploadPhoto(request.sessionId, file, label);
      await refresh();
      request.onDone && request.onDone(res.photo);
      closeCamera();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  function shoot() {
    const v = videoRef.current;
    if (!v || !v.videoWidth) {
      setErr('Rien à capturer : pas de flux vidéo. Passez par « Galerie ».');
      return;
    }
    const c = document.createElement('canvas');
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext('2d').drawImage(v, 0, 0);
    c.toBlob((blob) => blob && uploadBlob(blob), 'image/jpeg', 0.85);
  }

  function onPick(e) {
    const f = e.target.files && e.target.files[0];
    if (f) uploadBlob(f);
    e.target.value = '';
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0f0d0c',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 200
      }}
    >
      <div
        style={{
          flex: 'none',
          padding: '20px 16px 10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          color: '#f5ead8'
        }}
      >
        <button
          type="button"
          onClick={closeCamera}
          style={{
            minHeight: 44,
            padding: '0 14px',
            borderRadius: 999,
            border: '1px solid rgba(245,234,216,.35)',
            background: 'transparent',
            color: '#f5ead8',
            fontSize: 14,
            cursor: 'pointer'
          }}
        >
          Annuler
        </button>
        <div style={{ fontSize: 13, opacity: 0.8 }}>{request.title || 'Prise de vue'}</div>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          position: 'relative',
          margin: '0 14px',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          background: '#1a1613'
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 16,
            border: '2px solid rgba(245,234,216,.35)',
            borderRadius: 'var(--radius-md)',
            pointerEvents: 'none'
          }}
        />
        {err && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14,
              padding: 26,
              textAlign: 'center',
              color: '#f5ead8',
              background: '#1a1613'
            }}
          >
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 4h-5L8 7H4v13h16V7h-4z" />
              <circle cx="12" cy="13.5" r="3.5" />
              <path d="m3 3 18 18" />
            </svg>
            <div style={{ fontSize: 13.5, lineHeight: 1.5, maxWidth: '30ch' }}>{err}</div>
          </div>
        )}
      </div>

      <div style={{ flex: 'none', padding: '16px 16px 34px', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', color: '#f5ead8' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {PHOTO_LABELS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLabel(l)}
              style={{
                cursor: 'pointer',
                fontSize: 12,
                minHeight: 36,
                padding: '0 13px',
                borderRadius: 999,
                whiteSpace: 'nowrap',
                border: '1px solid ' + (label === l ? 'var(--color-accent)' : 'rgba(245,234,216,.35)'),
                background: label === l ? 'var(--color-accent)' : 'transparent',
                color: label === l ? '#fff' : '#f5ead8'
              }}
            >
              {PHOTO_LABEL_TEXT[l]}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <label
            style={{
              minHeight: 44,
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '0 14px',
              borderRadius: 999,
              border: '1px solid rgba(245,234,216,.35)',
              fontSize: 13,
              cursor: 'pointer'
            }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 16v3h16v-3" />
              <path d="M12 4v10" />
              <path d="m8 8 4-4 4 4" />
            </svg>
            Galerie
            <input type="file" accept="image/*" capture="environment" onChange={onPick} style={{ display: 'none' }} />
          </label>
          <button
            type="button"
            onClick={shoot}
            disabled={busy}
            aria-label="Déclencher"
            style={{
              width: 74,
              height: 74,
              borderRadius: 999,
              border: '4px solid rgba(245,234,216,.5)',
              background: 'var(--color-accent)',
              cursor: busy ? 'wait' : 'pointer'
            }}
          />
          <div style={{ width: 96, fontSize: 11, opacity: 0.75, lineHeight: 1.4 }}>
            {busy ? 'Envoi…' : err ? 'Aperçu indisponible' : 'Cadrez l’échantillon dans le repère'}
          </div>
        </div>
      </div>
    </div>
  );
}
