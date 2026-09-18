import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useSetPageMeta } from '../context/PageMetaContext.jsx';
import { dateLabel } from '../lib/compute.js';
import { UNIT_LABELS } from '../constants.js';
import { api } from '../api.js';

export default function Achats() {
  useSetPageMeta({ kicker: 'Achats', heading: 'Mes ingrédients' });
  const { sessions, loading, mergeSession } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [forms, setForms] = useState({});
  const [busyId, setBusyId] = useState(null);

  const mine = useMemo(() => sessions.filter((s) => s.kind === 'INGREDIENT' && s.frPassed && s.buyerId === user.id), [sessions, user.id]);

  const filterOptions = useMemo(() => {
    const dates = [];
    mine.forEach((s) => {
      if (s.comiteDate && !dates.includes(s.comiteDate)) dates.push(s.comiteDate);
    });
    dates.sort();
    return [{ value: 'all', label: 'Tous les comités inno' }]
      .concat(dates.map((d) => ({ value: d, label: 'Comité du ' + dateLabel(d) })))
      .concat([{ value: 'none', label: 'Sans comité inno' }]);
  }, [mine]);

  const rows = mine
    .filter((s) => filter === 'all' || (filter === 'none' ? !s.comiteDate : s.comiteDate === filter))
    .sort((a, b) => ((a.comiteDate || '9999') < (b.comiteDate || '9999') ? -1 : 1));

  function formFor(s) {
    return forms[s.id] || { amount: '', dose: '', unit: 'kg', date: new Date().toISOString().slice(0, 10) };
  }
  function setForm(id, patch) {
    setForms((f) => ({ ...f, [id]: { ...formFor({ id }), ...patch } }));
  }

  async function save(s) {
    const f = formFor(s);
    if (!f.amount.trim() || !f.dose.trim()) return;
    setBusyId(s.id);
    try {
      const res = await api.savePrice(s.id, f);
      mergeSession(res.session);
      setForms((prev) => ({ ...prev, [s.id]: { amount: '', dose: '', unit: f.unit, date: f.date } }));
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <p style={{ fontSize: 13, color: 'var(--color-neutral-700)' }}>Chargement…</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ margin: 0, fontSize: 12.5, color: 'var(--color-neutral-700)' }}>
        Ingrédients qui vous sont rattachés et passés en FR par le pôle R&amp;D. Visible uniquement sur votre compte.
      </p>
      <div className="field">
        <label>Filtrer par comité inno</label>
        <select className="input" style={{ borderRadius: 999, minHeight: 46, fontSize: 15 }} value={filter} onChange={(e) => setFilter(e.target.value)}>
          {filterOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {rows.map((s) => {
        const v = s.versions[s.versions.length - 1];
        const f = formFor(s);
        const done = !!s.price;
        return (
          <article key={s.id} className="card elev-sm" style={{ borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: 'var(--color-neutral-700)', marginTop: 4 }}>{s.supplier}</div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 7 }}>
                  <span className="tag tag-accent">{v ? v.ver : '—'}</span>
                  <span className="tag tag-neutral">{v && v.code ? v.code : 'code non renseigné'}</span>
                  <span className="tag tag-outline">{s.project}</span>
                  <span className="tag tag-accent-2">{s.comiteDate ? 'Comité inno du ' + dateLabel(s.comiteDate) : 'Hors comité'}</span>
                </div>
              </div>
              <span className={'tag ' + (done ? 'tag-accent-2' : 'tag-accent')} style={{ flex: 'none' }}>
                {done ? 'chiffré' : 'à chiffrer'}
              </span>
            </div>

            {done && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: 11, borderRadius: 'var(--radius-md)', background: 'var(--color-accent-2-100)' }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 19, color: 'var(--color-accent-2-800)' }}>
                  {s.price.amount} € / {s.price.dose} {UNIT_LABELS[s.price.unit]}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--color-neutral-700)' }}>Relevé le {dateLabel(s.price.date)}</div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <div className="field" style={{ flex: 1 }}>
                  <label>Prix (€)</label>
                  <input className="input" style={{ borderRadius: 999, minHeight: 44 }} placeholder="8,40" value={f.amount} onChange={(e) => setForm(s.id, { amount: e.target.value })} />
                </div>
                <div className="field" style={{ flex: 1 }}>
                  <label>Dosage</label>
                  <input className="input" style={{ borderRadius: 999, minHeight: 44 }} placeholder="1" value={f.dose} onChange={(e) => setForm(s.id, { dose: e.target.value })} />
                </div>
                <div className="field" style={{ flex: '0 0 96px' }}>
                  <label>Unité</label>
                  <select className="input" style={{ borderRadius: 999, minHeight: 44 }} value={f.unit} onChange={(e) => setForm(s.id, { unit: e.target.value })}>
                    {Object.entries(UNIT_LABELS).map(([val, l]) => (
                      <option key={val} value={val}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Date du relevé</label>
                <input className="input" type="date" style={{ borderRadius: 999, minHeight: 44 }} value={f.date} onChange={(e) => setForm(s.id, { date: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-primary" disabled={busyId === s.id} style={{ borderRadius: 999, minHeight: 46, flex: 1 }} onClick={() => save(s)}>
                  Enregistrer le prix
                </button>
                <button type="button" className="btn btn-secondary" style={{ borderRadius: 999, minHeight: 46 }} onClick={() => navigate('/session/' + s.id)}>
                  Voir la fiche
                </button>
              </div>
            </div>
          </article>
        );
      })}

      {!rows.length && (
        <div className="card" style={{ borderRadius: 'var(--radius-lg)', textAlign: 'center', padding: '30px 20px' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16 }}>Aucun ingrédient à chiffrer</div>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--color-neutral-700)' }}>
            Les ingrédients apparaissent ici après un passage en FR côté R&amp;D.
          </p>
        </div>
      )}
    </div>
  );
}
