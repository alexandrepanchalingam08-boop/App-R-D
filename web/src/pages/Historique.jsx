import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext.jsx';
import { useSetPageMeta } from '../context/PageMetaContext.jsx';
import { histRows } from '../lib/compute.js';
import { pillStyle } from '../lib/pill.js';
import { api } from '../api.js';

const SUGGESTIONS = ['cacao 28%', 'benchmark', 'CDC-284', 'Karim B.'];

export default function Historique() {
  useSetPageMeta({ kicker: 'Historique', heading: 'Dégustations', showNew: true });
  const { sessions, loading, refresh } = useData();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const rows = histRows(sessions, q);

  async function doDelete(sessionId, versionId) {
    setBusy(true);
    try {
      await api.deleteVersion(sessionId, versionId);
      await refresh();
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  }

  if (loading) return <p style={{ fontSize: 13, color: 'var(--color-neutral-700)' }}>Chargement…</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <span style={{ position: 'absolute', left: 14, display: 'flex', color: 'var(--color-neutral-600)' }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </span>
        <input
          className="input"
          placeholder="Ingrédient, dégustateur, code, mot-clé…"
          style={{ borderRadius: 999, minHeight: 46, paddingLeft: 40, fontSize: 15 }}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div style={{ display: 'flex', gap: 7, overflow: 'auto', paddingBottom: 2 }}>
        {SUGGESTIONS.map((s) => (
          <button key={s} type="button" onClick={() => setQ(s)} style={pillStyle(q === s)}>
            {s}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--color-neutral-700)' }}>
        {rows.length} séance{rows.length > 1 ? 's' : ''} clôturée{rows.length > 1 ? 's' : ''}
      </div>

      {rows.map(({ session: s, version: v, meta, panelLabel, noteMain, noteUnit, good }) => {
        const key = s.id + '-' + v.id;
        return (
          <article key={key} className="card elev-sm" style={{ borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 9 }}>
            <button
              type="button"
              onClick={() => navigate('/session/' + s.id + '?v=' + v.id)}
              style={{ border: 0, background: 'transparent', padding: 0, textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 9, width: '100%', color: 'inherit' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%' }}>
                <div
                  style={{
                    flex: 'none',
                    width: 58,
                    height: 58,
                    borderRadius: 999,
                    background: good ? 'var(--color-accent-2-200)' : 'var(--color-accent-200)',
                    color: good ? 'var(--color-accent-2-800)' : 'var(--color-accent-800)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-heading)', fontSize: 18, lineHeight: 1 }}>{noteMain}</span>
                  <span style={{ fontSize: 9, opacity: 0.75 }}>{noteUnit}</span>
                </div>
                <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 15.5, fontWeight: 600 }}>{s.name}</span>
                    <span className="tag tag-accent">{v.ver}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-neutral-700)' }}>{meta}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-neutral-700)' }}>{panelLabel}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {v.ingredients.map((i, idx) => (
                  <span key={idx} className="tag tag-accent-2">
                    {i}
                  </span>
                ))}
              </div>
            </button>
            <button type="button" className="btn btn-ghost" style={{ borderRadius: 999, minHeight: 42, alignSelf: 'flex-start' }} onClick={() => setConfirm(key)}>
              Supprimer de l'historique
            </button>
            {confirm === key && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--color-accent-200)' }}>
                <div style={{ fontSize: 12.5, color: 'var(--color-accent-800)' }}>
                  Supprimer cette séance clôturée ? Les moyennes du produit seront recalculées.
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn btn-primary" disabled={busy} style={{ borderRadius: 999, minHeight: 42, flex: 1 }} onClick={() => doDelete(s.id, v.id)}>
                    Supprimer
                  </button>
                  <button type="button" className="btn btn-secondary" style={{ borderRadius: 999, minHeight: 42, flex: 1 }} onClick={() => setConfirm(null)}>
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </article>
        );
      })}

      {!rows.length && (
        <div className="card" style={{ borderRadius: 'var(--radius-lg)', textAlign: 'center', padding: '30px 20px' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16 }}>Aucune séance</div>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--color-neutral-700)' }}>
            Essayez un ingrédient, un code produit ou un nom de dégustateur.
          </p>
        </div>
      )}
    </div>
  );
}
