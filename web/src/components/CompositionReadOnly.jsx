import { useNavigate } from 'react-router-dom';
import { totalMass } from '../lib/compute.js';
import { UNIT_LABELS } from '../constants.js';

export default function CompositionReadOnly({ rows, compact }) {
  const navigate = useNavigate();
  if (!rows || !rows.length) return null;
  const total = totalMass(rows);

  if (compact) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, padding: 11, borderRadius: 'var(--radius-md)', background: 'var(--color-neutral-100)' }}>
        <div style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--color-neutral-600)' }}>
          Composition · {total ? 'Masse totale : ' + total.toFixed(1) + ' g' : 'Dosages non renseignés'}
        </div>
        {rows.map((r) => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, fontSize: 12.5 }}>
            <span>{r.name}</span>
            <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--color-neutral-700)' }}>
              {r.dose ? r.dose + ' ' + UNIT_LABELS[r.unit] : 'dosage non renseigné'}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <section className="card elev-sm" style={{ borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 16 }}>Composition et dosages</h2>
        <p style={{ margin: '5px 0 0', fontSize: 12, color: 'var(--color-neutral-700)' }}>
          {total ? 'Masse totale : ' + total.toFixed(1) + ' g' : 'Dosages en masse non renseignés'}
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map((r) => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingBottom: 8, borderBottom: '1px solid var(--color-divider)' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13.5 }}>{r.name}</div>
              <div style={{ fontSize: 10.5, color: 'var(--color-neutral-600)', textTransform: 'uppercase', letterSpacing: '.07em' }}>
                {r.refSessionId ? 'fiche liée' : ''}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 'none' }}>
              <span style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums', color: 'var(--color-neutral-800)' }}>
                {r.dose ? r.dose + ' ' + UNIT_LABELS[r.unit] : 'dosage non renseigné'}
              </span>
              {r.refSessionId && (
                <button type="button" className="btn btn-ghost" style={{ borderRadius: 999, minHeight: 40 }} onClick={() => navigate('/session/' + r.refSessionId)}>
                  Fiche
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--color-neutral-600)' }}>La composition se définit à la création de la version.</div>
    </section>
  );
}
