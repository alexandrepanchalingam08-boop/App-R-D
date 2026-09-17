import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSetPageMeta } from '../context/PageMetaContext.jsx';
import { dateLabel } from '../lib/compute.js';
import { api } from '../api.js';

export default function FoodTourDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  useSetPageMeta({ kicker: 'Food tour', heading: tour ? tour.lieu : 'Food tour', showBack: true });

  async function load() {
    setLoading(true);
    try {
      const res = await api.foodTour(id);
      setTour(res.foodTour);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function addEnseigne() {
    setErr(null);
    if (!name.trim()) {
      setErr("Le nom de l'enseigne est obligatoire.");
      return;
    }
    setBusy(true);
    try {
      const res = await api.createEnseigne(id, { name });
      setTour(res.foodTour);
      setName('');
      setFormOpen(false);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteTour() {
    setBusy(true);
    try {
      await api.deleteFoodTour(id);
      navigate('/food-tour');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p style={{ fontSize: 13, color: 'var(--color-neutral-700)' }}>Chargement…</p>;
  if (!tour) {
    return (
      <div className="card" style={{ borderRadius: 'var(--radius-lg)', textAlign: 'center', padding: '30px 20px' }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16 }}>Food tour introuvable</div>
        <button type="button" className="btn btn-secondary" style={{ marginTop: 10, borderRadius: 999 }} onClick={() => navigate('/food-tour')}>
          Retour
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <section className="card elev-sm" style={{ borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 12, color: 'var(--color-neutral-700)' }}>{dateLabel(tour.date)}</div>
        <a
          href={`/api/foodtours/${tour.id}/export.xlsx`}
          className="btn btn-secondary"
          style={{ borderRadius: 999, minHeight: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none' }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v13" />
            <path d="m7 11 5 5 5-5" />
            <path d="M4 21h16" />
          </svg>
          Télécharger en Excel
        </a>
      </section>

      <button type="button" className="btn btn-secondary" style={{ borderRadius: 999, minHeight: 46 }} onClick={() => setFormOpen(!formOpen)}>
        {formOpen ? 'Annuler' : '+ Ajouter une enseigne'}
      </button>

      {formOpen && (
        <section className="card elev-sm" style={{ borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="field">
            <label>Nom de l'enseigne</label>
            <input className="input" style={{ borderRadius: 999, minHeight: 46 }} placeholder="ex. Chez Mario" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <button type="button" className="btn btn-primary" disabled={busy} style={{ borderRadius: 999, minHeight: 46 }} onClick={addEnseigne}>
            Ajouter l'enseigne
          </button>
          {err && (
            <div style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-accent-200)', color: 'var(--color-accent-800)', padding: '10px 13px', fontSize: 12.5 }}>{err}</div>
          )}
        </section>
      )}

      {tour.enseignes.map((e) => (
        <button
          key={e.id}
          type="button"
          onClick={() => navigate('/food-tour/' + tour.id + '/enseigne/' + e.id)}
          className="card elev-sm"
          style={{ borderRadius: 'var(--radius-lg)', textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 5, width: '100%', color: 'inherit' }}
        >
          <div style={{ fontSize: 15.5, fontWeight: 600 }}>{e.name}</div>
          <div style={{ fontSize: 12, color: 'var(--color-neutral-700)' }}>
            {e.photos.length} photo{e.photos.length > 1 ? 's' : ''} · {e.products.length} produit{e.products.length > 1 ? 's' : ''}
          </div>
          {e.keyLearnings && (
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--color-neutral-700)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {e.keyLearnings}
            </p>
          )}
        </button>
      ))}

      {!tour.enseignes.length && !formOpen && (
        <div className="card" style={{ borderRadius: 'var(--radius-lg)', textAlign: 'center', padding: '30px 20px' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16 }}>Aucune enseigne</div>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--color-neutral-700)' }}>Ajoutez la première enseigne visitée.</p>
        </div>
      )}

      <section className="card elev-sm" style={{ borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>Supprimer le food tour</h2>
        <p style={{ margin: 0, fontSize: 12.5, color: 'var(--color-neutral-700)' }}>Retire le food tour et toutes ses enseignes.</p>
        {!confirmDel && (
          <button type="button" className="btn btn-secondary" style={{ borderRadius: 999, minHeight: 44 }} onClick={() => setConfirmDel(true)}>
            Supprimer « {tour.lieu} »
          </button>
        )}
        {confirmDel && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--color-accent-200)' }}>
            <div style={{ fontSize: 12.5, color: 'var(--color-accent-800)' }}>Confirmer la suppression de « {tour.lieu} » ?</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-primary" disabled={busy} style={{ borderRadius: 999, minHeight: 42, flex: 1 }} onClick={deleteTour}>
                Supprimer
              </button>
              <button type="button" className="btn btn-secondary" style={{ borderRadius: 999, minHeight: 42, flex: 1 }} onClick={() => setConfirmDel(false)}>
                Annuler
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
