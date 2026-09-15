import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext.jsx';
import { useSetPageMeta } from '../context/PageMetaContext.jsx';
import { activeRows } from '../lib/compute.js';
import { KIND_META } from '../constants.js';

export default function Actives() {
  useSetPageMeta({ kicker: 'En cours', heading: 'Sessions actives', showNew: true });
  const { sessions, loading } = useData();
  const navigate = useNavigate();

  const rows = activeRows(sessions);

  if (loading) return <p style={{ fontSize: 13, color: 'var(--color-neutral-700)' }}>Chargement…</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p style={{ margin: 0, fontSize: 12.5, color: 'var(--color-neutral-700)' }}>
        Une session = un produit, un ingrédient ou une recette. Ouvrez-la pour choisir la version à déguster.
      </p>

      {rows.map(({ session: s, version: cur, meta, openLabel, provisional, w }) => (
        <button
          key={s.id}
          type="button"
          onClick={() => navigate('/session/' + s.id + '?v=' + cur.id)}
          className="card elev-sm"
          style={{ borderRadius: 'var(--radius-lg)', textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 9, width: '100%', color: 'inherit' }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, width: '100%' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15.5, fontWeight: 600 }}>{s.name}</div>
              <div style={{ fontSize: 12, color: 'var(--color-neutral-700)', marginTop: 4 }}>{meta}</div>
            </div>
            <span className="tag tag-accent-2" style={{ flex: 'none' }}>
              {KIND_META[s.kind].label}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--color-neutral-700)' }}>
              <span>{openLabel}</span>
              <span>{provisional}</span>
            </div>
            <div style={{ height: 12, borderRadius: 999, background: 'var(--color-neutral-200)', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 999, background: 'var(--color-accent)', width: w }} />
            </div>
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

      {!rows.length && (
        <div className="card" style={{ borderRadius: 'var(--radius-lg)', textAlign: 'center', padding: '30px 20px' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16 }}>Aucune session en cours</div>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--color-neutral-700)' }}>
            Créez-en une avec « Nouveau » en haut à droite.
          </p>
        </div>
      )}
    </div>
  );
}
