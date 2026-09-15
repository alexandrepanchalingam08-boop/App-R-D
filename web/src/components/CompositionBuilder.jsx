import { useState } from 'react';
import { totalMass } from '../lib/compute.js';
import { UNIT_LABELS } from '../constants.js';

export default function CompositionBuilder({ rows, onChange, sessions }) {
  const [form, setForm] = useState({ ref: '', name: '', dose: '', unit: 'g' });

  const total = totalMass(rows);

  function add() {
    if (!form.name.trim()) return;
    onChange(rows.concat([{ name: form.name.trim(), dose: form.dose, unit: form.unit, refSessionId: form.ref || null }]));
    setForm({ ref: '', name: '', dose: '', unit: form.unit });
  }
  function remove(i) {
    onChange(rows.filter((_, j) => j !== i));
  }
  function onRef(e) {
    const id = e.target.value;
    const src = sessions.find((s) => s.id === id);
    setForm((f) => ({ ...f, ref: id, name: src ? src.name : f.name }));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--color-accent-100)', border: '1px solid var(--color-accent-300)' }}>
      <div style={{ fontSize: 12, color: 'var(--color-accent-800)' }}>
        Composition — {total ? 'Masse totale : ' + total.toFixed(1) + ' g' : 'Ajoutez les ingrédients et leurs dosages'}
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingBottom: 7, borderBottom: '1px solid var(--color-accent-300)' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13 }}>{r.name}</div>
            <div style={{ fontSize: 10.5, color: 'var(--color-neutral-600)' }}>{r.refSessionId ? 'fiche liée' : 'saisi à la main'}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 'none' }}>
            <span style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>{r.dose ? r.dose + ' ' + UNIT_LABELS[r.unit] : 'dosage non renseigné'}</span>
            <button type="button" className="btn btn-ghost" style={{ borderRadius: 999, minHeight: 40 }} onClick={() => remove(i)}>
              Retirer
            </button>
          </div>
        </div>
      ))}
      <div className="field">
        <label>Rattacher un ingrédient de l'app</label>
        <select className="input" style={{ borderRadius: 999, minHeight: 44 }} value={form.ref} onChange={onRef}>
          <option value="">Ingrédient saisi à la main</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — {s.kind === 'INGREDIENT' ? 'Ingrédient' : s.kind === 'BENCHMARK' ? 'Benchmark' : 'Produit complet'}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Nom de l'ingrédient</label>
        <input
          className="input"
          style={{ borderRadius: 999, minHeight: 44 }}
          placeholder="ex. cacao alcalinisé"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <div className="field" style={{ flex: 1 }}>
          <label>Dosage</label>
          <input
            className="input"
            style={{ borderRadius: 999, minHeight: 44 }}
            placeholder="28"
            value={form.dose}
            onChange={(e) => setForm((f) => ({ ...f, dose: e.target.value }))}
          />
        </div>
        <div className="field" style={{ flex: '0 0 104px' }}>
          <label>Unité</label>
          <select className="input" style={{ borderRadius: 999, minHeight: 44 }} value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}>
            {Object.entries(UNIT_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button type="button" className="btn btn-secondary" style={{ borderRadius: 999, minHeight: 44 }} onClick={add}>
        Ajouter l'ingrédient
      </button>
    </div>
  );
}
