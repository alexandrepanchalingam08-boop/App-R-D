import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext.jsx';
import { useSetPageMeta } from '../context/PageMetaContext.jsx';
import { prodRows } from '../lib/compute.js';
import { KIND_META } from '../constants.js';

export default function Produits() {
  useSetPageMeta({ kicker: 'Produits', heading: 'Toutes les sessions', showNew: true });
  const { sessions, loading } = useData();
  const navigate = useNavigate();
  const rows = prodRows(sessions);

  if (loading) return <p style={{ fontSize: 13, color: 'var(--color-neutral-700)' }}>Chargement…</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ margin: 0, fontSize: 12.5, color: 'var(--color-neutral-700)' }}>
        Toutes les sessions du pôle, moyenne cumulée sur les versions clôturées.
      </p>
      {rows.map(({ session: s, fmt }) => (
        <button
          key={s.id}
          type="button"
          onClick={() => navigate('/session/' + s.id)}
          className="card elev-sm"
          style={{ borderRadius: 'var(--radius-lg)', textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 7, width: '100%', color: 'inherit' }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, width: '100%' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{s.name}</div>
              <div style={{ fontSize: 12, color: 'var(--color-neutral-700)', marginTop: 3 }}>
                {KIND_META[s.kind].label} · {s.supplier} · {s.project}
              </div>
            </div>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: 18, color: 'var(--color-accent-700)', flex: 'none' }}>{fmt}</span>
          </div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {s.versions.map((v) => (
              <span key={v.id} className="tag tag-outline" style={{ whiteSpace: 'nowrap' }}>
                {v.ver + (v.closed ? ' · dégusté' : ' · à tester')}
              </span>
            ))}
          </div>
        </button>
      ))}
    </div>
  );
}
