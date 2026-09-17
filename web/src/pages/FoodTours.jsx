import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSetPageMeta } from '../context/PageMetaContext.jsx';
import { dateLabel } from '../lib/compute.js';
import { api } from '../api.js';

const today = () => new Date().toISOString().slice(0, 10);

export default function FoodTours() {
  useSetPageMeta({ kicker: 'Food tour', heading: 'Food tours', showBack: false });
  const navigate = useNavigate();

  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [lieu, setLieu] = useState('');
  const [date, setDate] = useState(today());
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await api.foodTours();
      setTours(res.foodTours);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function submit() {
    setErr(null);
    if (!lieu.trim()) {
      setErr('Le lieu est obligatoire.');
      return;
    }
    setBusy(true);
    try {
      const res = await api.createFoodTour({ lieu, date });
      setLieu('');
      setDate(today());
      setFormOpen(false);
      navigate('/food-tour/' + res.foodTour.id);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p style={{ fontSize: 13, color: 'var(--color-neutral-700)' }}>Chargement…</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p style={{ margin: 0, fontSize: 12.5, color: 'var(--color-neutral-700)' }}>
        Un food tour = une sortie, plusieurs enseignes visitées. Ouvrez-en un pour ajouter les enseignes.
      </p>

      <button type="button" className="btn btn-secondary" style={{ borderRadius: 999, minHeight: 46 }} onClick={() => setFormOpen(!formOpen)}>
        {formOpen ? 'Annuler' : '+ Nouveau food tour'}
      </button>

      {formOpen && (
        <section className="card elev-sm" style={{ borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Lieu</label>
              <input className="input" style={{ borderRadius: 999, minHeight: 46 }} placeholder="ex. Lyon Part-Dieu" value={lieu} onChange={(e) => setLieu(e.target.value)} />
            </div>
            <div className="field" style={{ flex: '0 0 140px' }}>
              <label>Date</label>
              <input className="input" type="date" style={{ borderRadius: 999, minHeight: 46 }} value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <button type="button" className="btn btn-primary" disabled={busy} style={{ borderRadius: 999, minHeight: 46 }} onClick={submit}>
            Créer le food tour
          </button>
          {err && (
            <div style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-accent-200)', color: 'var(--color-accent-800)', padding: '10px 13px', fontSize: 12.5 }}>{err}</div>
          )}
        </section>
      )}

      {tours.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => navigate('/food-tour/' + t.id)}
          className="card elev-sm"
          style={{ borderRadius: 'var(--radius-lg)', textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6, width: '100%', color: 'inherit' }}
        >
          <div style={{ fontSize: 15.5, fontWeight: 600 }}>{t.lieu}</div>
          <div style={{ fontSize: 12, color: 'var(--color-neutral-700)' }}>
            {dateLabel(t.date)} · {t.enseignes.length} enseigne{t.enseignes.length > 1 ? 's' : ''}
          </div>
        </button>
      ))}

      {!tours.length && !formOpen && (
        <div className="card" style={{ borderRadius: 'var(--radius-lg)', textAlign: 'center', padding: '30px 20px' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16 }}>Aucun food tour</div>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--color-neutral-700)' }}>Créez-en un avec le bouton ci-dessus.</p>
        </div>
      )}
    </div>
  );
}
