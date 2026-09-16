import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useData } from '../context/DataContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useSetPageMeta } from '../context/PageMetaContext.jsx';
import { useCamera } from '../context/CameraContext.jsx';
import { activeVersion, dateLabel, fmt, mean, sessionStats } from '../lib/compute.js';
import { KIND_META, UNIT_LABELS, PHOTO_LABEL_TEXT } from '../constants.js';
import { api } from '../api.js';
import CompositionBuilder from '../components/CompositionBuilder.jsx';
import CompositionReadOnly from '../components/CompositionReadOnly.jsx';
import MicButton from '../components/MicButton.jsx';

export default function SessionDetail() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { sessions, users, loading, findSession, refresh } = useData();
  const { user, isRD } = useAuth();
  const { openCamera } = useCamera();

  const session = findSession(id);
  useSetPageMeta({ kicker: 'Session', heading: session ? session.name : 'Session', showBack: true });

  const [newOpen, setNewOpen] = useState(false);
  const [nv, setNv] = useState(null);
  const [nvComp, setNvComp] = useState([]);
  const [confirmVer, setConfirmVer] = useState(false);
  const [confirmSes, setConfirmSes] = useState(false);
  const [priceForm, setPriceForm] = useState({ amount: '', dose: '', unit: 'kg', date: new Date().toISOString().slice(0, 10) });
  const [buyerSel, setBuyerSel] = useState('');
  const [comiteVal, setComiteVal] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const requestedVer = params.get('v');
  const currentVersion = useMemo(() => {
    if (!session) return null;
    if (requestedVer) {
      const found = session.versions.find((v) => v.id === requestedVer);
      if (found) return found;
    }
    return activeVersion(session);
  }, [session, requestedVer]);

  if (loading) return <p style={{ fontSize: 13, color: 'var(--color-neutral-700)' }}>Chargement…</p>;
  if (!session || !currentVersion) {
    return (
      <div className="card" style={{ borderRadius: 'var(--radius-lg)', textAlign: 'center', padding: '30px 20px' }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16 }}>Session introuvable</div>
        <button type="button" className="btn btn-secondary" style={{ marginTop: 10, borderRadius: 999 }} onClick={() => navigate('/en-cours')}>
          Retour
        </button>
      </div>
    );
  }

  const stats = sessionStats(session);
  const isFull = session.kind === 'PRODUIT_COMPLET';
  const isBenchmark = session.kind === 'BENCHMARK';
  const buyers = users.filter((u) => u.pole === 'ACHATS');

  function selectVersion(vid) {
    navigate('/session/' + session.id + '?v=' + vid, { replace: true });
  }

  function toggleNew() {
    if (!newOpen) {
      const last = session.versions[session.versions.length - 1];
      setNv({ ver: '', code: '', date: new Date().toISOString().slice(0, 10), ing: last.ingredients.join(', '), procede: last.procede || '' });
      setNvComp([]);
    }
    setNewOpen(!newOpen);
  }

  async function addVersion() {
    setBusy(true);
    setErr(null);
    try {
      const payload = isFull
        ? { ver: nv.ver, code: nv.code, date: nv.date, composition: nvComp, procede: nv.procede }
        : { ver: nv.ver, code: nv.code, date: nv.date, ingredients: nv.ing, procede: nv.procede };
      const res = await api.addVersion(session.id, payload);
      await refresh();
      setNewOpen(false);
      selectVersion(res.version.id);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function closeVersion() {
    setBusy(true);
    try {
      await api.closeVersion(session.id, currentVersion.id);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function deleteVersion() {
    setBusy(true);
    try {
      const res = await api.deleteVersion(session.id, currentVersion.id);
      if (res.sessionDeleted) {
        navigate('/en-cours');
        return;
      }
      await refresh();
      setConfirmVer(false);
    } finally {
      setBusy(false);
    }
  }

  async function deleteSession() {
    setBusy(true);
    try {
      await api.deleteSession(session.id);
      navigate('/en-cours');
    } finally {
      setBusy(false);
    }
  }

  async function onSetBuyer(e) {
    setBuyerSel(e.target.value);
    await api.setBuyer(session.id, e.target.value || null);
    await refresh();
  }
  async function onToggleFR() {
    await api.toggleFR(session.id);
    await refresh();
  }
  async function onSetComite(e) {
    setComiteVal(e.target.value);
    await api.setComite(session.id, e.target.value || null);
    await refresh();
  }
  async function savePrice() {
    if (!priceForm.amount.trim() || !priceForm.dose.trim()) return;
    setBusy(true);
    try {
      await api.savePrice(session.id, priceForm);
      await refresh();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  const mine = session.buyerId === user.id;
  const canAssign = isRD;
  const canEdit = mine && session.frPassed;
  const waiting = mine && !session.frPassed;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Session card */}
      <section className="card elev-sm" style={{ borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 11 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 600 }}>{session.name}</div>
            <div style={{ fontSize: 12, color: 'var(--color-neutral-700)', marginTop: 4 }}>
              {session.supplier} · {session.project}
            </div>
          </div>
          <span className="tag tag-accent-2" style={{ flex: 'none' }}>
            {KIND_META[session.kind].label}
          </span>
        </div>
        {!isBenchmark && (
          <>
            <div className="field">
              <label>Version dégustée</label>
              <select className="input" style={{ borderRadius: 999, minHeight: 46, fontSize: 15 }} value={currentVersion.id} onChange={(e) => selectVersion(e.target.value)}>
                {session.versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.ver} — {dateLabel(v.date)}
                    {v.code ? ' · ' + v.code : ''}
                    {v.closed ? ' · dégusté' : ' · à tester'}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-secondary" style={{ borderRadius: 999, minHeight: 42, flex: 1 }} onClick={toggleNew}>
                {newOpen ? "Annuler l'ajout" : '+ Nouvelle version'}
              </button>
            </div>
            {newOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--color-accent-100)', border: '1px solid var(--color-accent-300)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="field">
                    <label>Version</label>
                    <input className="input" style={{ borderRadius: 999, minHeight: 44 }} placeholder="V4" value={nv.ver} onChange={(e) => setNv({ ...nv, ver: e.target.value })} />
                  </div>
                  <div className="field">
                    <label>Code produit</label>
                    <input className="input" style={{ borderRadius: 999, minHeight: 44 }} placeholder="CDC-291" value={nv.code} onChange={(e) => setNv({ ...nv, code: e.target.value })} />
                  </div>
                </div>
                <div className="field">
                  <label>Date</label>
                  <input className="input" type="date" style={{ borderRadius: 999, minHeight: 44 }} value={nv.date} onChange={(e) => setNv({ ...nv, date: e.target.value })} />
                </div>
                {!isFull && (
                  <div className="field">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 5 }}>
                      <label style={{ margin: 0 }}>Ingrédients (virgules)</label>
                      <MicButton value={nv.ing} onText={(text) => setNv({ ...nv, ing: text })} />
                    </div>
                    <textarea className="input" style={{ borderRadius: 'var(--radius-md)', minHeight: 70 }} value={nv.ing} onChange={(e) => setNv({ ...nv, ing: e.target.value })} />
                  </div>
                )}
                {isFull && <CompositionBuilder rows={nvComp} onChange={setNvComp} sessions={sessions.filter((s) => s.id !== session.id)} />}
                <div className="field">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 5 }}>
                    <label style={{ margin: 0 }}>Mise en œuvre (temps de cuisson, équipement…)</label>
                    <MicButton value={nv.procede} onText={(text) => setNv({ ...nv, procede: text })} />
                  </div>
                  <textarea
                    className="input"
                    style={{ borderRadius: 'var(--radius-md)', minHeight: 70 }}
                    placeholder="ex. Cuisson 12 min à 180°C, mélangeur planétaire vitesse 2"
                    value={nv.procede}
                    onChange={(e) => setNv({ ...nv, procede: e.target.value })}
                  />
                </div>
                {err && (
                  <div style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-accent-200)', color: 'var(--color-accent-800)', padding: '10px 13px', fontSize: 12.5 }}>{err}</div>
                )}
                <button type="button" className="btn btn-primary" disabled={busy} style={{ borderRadius: 999, minHeight: 44 }} onClick={addVersion}>
                  Ajouter la version
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Version card */}
      <section className="card elev-sm" style={{ borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 11 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {!isBenchmark && <h2 style={{ margin: 0, fontSize: 16 }}>Version {currentVersion.ver}</h2>}
          <span className="tag tag-accent">{currentVersion.closed ? 'dégusté' : 'à tester'}</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-neutral-700)' }}>
          {dateLabel(currentVersion.date)}
          {currentVersion.code ? ' · code ' + currentVersion.code : ''} · {currentVersion.grades.length} grille
          {currentVersion.grades.length > 1 ? 's' : ''}
        </div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {currentVersion.ingredients.map((i, idx) => (
            <span key={idx} className="tag tag-outline">
              {i}
            </span>
          ))}
        </div>
        {currentVersion.procede && (
          <div style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-neutral-100)', padding: '9px 11px', fontSize: 12.5, color: 'var(--color-neutral-800)' }}>
            <div style={{ fontWeight: 600, fontSize: 11, color: 'var(--color-neutral-600)', marginBottom: 3 }}>Mise en œuvre</div>
            {currentVersion.procede}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {currentVersion.grades.map((g) => (
            <div key={g.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, fontSize: 13, borderBottom: '1px solid var(--color-divider)', paddingBottom: 7 }}>
              <span>{g.tasterName}</span>
              <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--color-neutral-700)' }}>{fmt(g.note)}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-neutral-700)' }}>
          {currentVersion.grades.length
            ? 'Moyenne de la version : ' + fmt(mean(currentVersion.grades.map((g) => g.note)))
            : 'Aucune grille saisie pour l’instant.'}
        </div>
        {!currentVersion.closed && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{ borderRadius: 999, minHeight: 46 }}
              onClick={() => navigate('/saisie/' + session.id + '/' + currentVersion.id)}
            >
              Saisir ma grille
            </button>
            <button type="button" className="btn btn-secondary" disabled={busy} style={{ borderRadius: 999, minHeight: 44 }} onClick={closeVersion}>
              Clôturer la version
            </button>
          </div>
        )}
        {!isBenchmark && (
          <>
            <button type="button" className="btn btn-ghost" style={{ borderRadius: 999, minHeight: 42 }} onClick={() => setConfirmVer(true)}>
              Supprimer cette version
            </button>
            {confirmVer && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--color-accent-200)' }}>
                <div style={{ fontSize: 12.5, color: 'var(--color-accent-800)' }}>Supprimer Version {currentVersion.ver} et ses grilles ? Action définitive.</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn btn-primary" disabled={busy} style={{ borderRadius: 999, minHeight: 42, flex: 1 }} onClick={deleteVersion}>
                    Supprimer
                  </button>
                  <button type="button" className="btn btn-secondary" style={{ borderRadius: 999, minHeight: 42, flex: 1 }} onClick={() => setConfirmVer(false)}>
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* Price / Achats card */}
      {session.kind === 'INGREDIENT' && (
        <section className="card elev-sm" style={{ borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 16 }}>Achats et prix</h2>
            <p style={{ margin: '5px 0 0', fontSize: 12, color: 'var(--color-neutral-700)' }}>
              {session.buyer ? 'Acheteur rattaché : ' + session.buyer.firstName + ' ' + session.buyer.lastName : 'Aucun acheteur rattaché'} ·{' '}
              {session.frPassed ? 'Passé en FR — visible côté Achats' : 'Pas encore passé en FR'}
            </p>
          </div>

          {canAssign && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="field">
                <label>Rattacher un acheteur</label>
                <select className="input" style={{ borderRadius: 999, minHeight: 44 }} value={buyerSel || session.buyerId || ''} onChange={onSetBuyer}>
                  <option value="">Aucun acheteur</option>
                  {buyers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} · Achats
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-primary" style={{ borderRadius: 999, minHeight: 46, flex: '1 1 150px' }} onClick={onToggleFR}>
                  {session.frPassed ? "Annuler le passage en FR" : 'Passage en FR'}
                </button>
                <div className="field" style={{ flex: '1 1 150px' }}>
                  <label>Comité inno</label>
                  <input className="input" type="date" style={{ borderRadius: 999, minHeight: 46 }} value={comiteVal || session.comiteDate || ''} onChange={onSetComite} />
                </div>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--color-neutral-700)' }}>
                {session.comiteDate ? 'Comité inno du ' + dateLabel(session.comiteDate) : 'Aucune date de comité inno'}
              </div>
            </div>
          )}

          {session.price && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--color-accent-2-100)' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, color: 'var(--color-accent-2-800)' }}>
                {session.price.amount} € pour {session.price.dose} {UNIT_LABELS[session.price.unit]}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--color-neutral-700)' }}>Relevé le {dateLabel(session.price.date)}</div>
            </div>
          )}

          {waiting && (
            <div style={{ fontSize: 12, color: 'var(--color-neutral-700)', padding: 11, borderRadius: 'var(--radius-md)', background: 'var(--color-neutral-100)' }}>
              Vous pourrez renseigner le prix dès que le pôle R&amp;D aura fait le passage en FR.
            </div>
          )}

          {canEdit && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--color-accent-100)', border: '1px solid var(--color-accent-300)' }}>
              <div style={{ fontSize: 12, color: 'var(--color-accent-800)' }}>Renseigner le prix — réservé à l'acheteur rattaché.</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <div className="field" style={{ flex: 1 }}>
                  <label>Prix (€)</label>
                  <input className="input" style={{ borderRadius: 999, minHeight: 44 }} placeholder="8,40" value={priceForm.amount} onChange={(e) => setPriceForm({ ...priceForm, amount: e.target.value })} />
                </div>
                <div className="field" style={{ flex: 1 }}>
                  <label>Dosage</label>
                  <input className="input" style={{ borderRadius: 999, minHeight: 44 }} placeholder="1" value={priceForm.dose} onChange={(e) => setPriceForm({ ...priceForm, dose: e.target.value })} />
                </div>
                <div className="field" style={{ flex: '0 0 96px' }}>
                  <label>Unité</label>
                  <select className="input" style={{ borderRadius: 999, minHeight: 44 }} value={priceForm.unit} onChange={(e) => setPriceForm({ ...priceForm, unit: e.target.value })}>
                    {Object.entries(UNIT_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Date du relevé</label>
                <input className="input" type="date" style={{ borderRadius: 999, minHeight: 44 }} value={priceForm.date} onChange={(e) => setPriceForm({ ...priceForm, date: e.target.value })} />
              </div>
              <button type="button" className="btn btn-primary" disabled={busy} style={{ borderRadius: 999, minHeight: 46 }} onClick={savePrice}>
                Enregistrer le prix
              </button>
            </div>
          )}
        </section>
      )}

      {/* Prix de vente card (Benchmark) */}
      {isBenchmark && (
        <section className="card elev-sm" style={{ borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 16 }}>Prix de vente</h2>
            <p style={{ margin: '5px 0 0', fontSize: 12, color: 'var(--color-neutral-700)' }}>Prix constaté sur le marché pour ce produit de référence.</p>
          </div>

          {session.price && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--color-accent-2-100)' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, color: 'var(--color-accent-2-800)' }}>
                {session.price.amount} € pour {session.price.dose} {UNIT_LABELS[session.price.unit]}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--color-neutral-700)' }}>Relevé le {dateLabel(session.price.date)}</div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--color-accent-100)', border: '1px solid var(--color-accent-300)' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <div className="field" style={{ flex: 1 }}>
                <label>Prix (€)</label>
                <input className="input" style={{ borderRadius: 999, minHeight: 44 }} placeholder="8,40" value={priceForm.amount} onChange={(e) => setPriceForm({ ...priceForm, amount: e.target.value })} />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label>Dosage</label>
                <input className="input" style={{ borderRadius: 999, minHeight: 44 }} placeholder="1" value={priceForm.dose} onChange={(e) => setPriceForm({ ...priceForm, dose: e.target.value })} />
              </div>
              <div className="field" style={{ flex: '0 0 96px' }}>
                <label>Unité</label>
                <select className="input" style={{ borderRadius: 999, minHeight: 44 }} value={priceForm.unit} onChange={(e) => setPriceForm({ ...priceForm, unit: e.target.value })}>
                  {Object.entries(UNIT_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field">
              <label>Date du relevé</label>
              <input className="input" type="date" style={{ borderRadius: 999, minHeight: 44 }} value={priceForm.date} onChange={(e) => setPriceForm({ ...priceForm, date: e.target.value })} />
            </div>
            {err && (
              <div style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-accent-200)', color: 'var(--color-accent-800)', padding: '10px 13px', fontSize: 12.5 }}>{err}</div>
            )}
            <button type="button" className="btn btn-primary" disabled={busy} style={{ borderRadius: 999, minHeight: 46 }} onClick={savePrice}>
              Enregistrer le prix de vente
            </button>
          </div>
        </section>
      )}

      {isFull && currentVersion.composition.length > 0 && <CompositionReadOnly rows={currentVersion.composition} />}

      {stats.has && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {stats.kpis.map((k) => (
              <div key={k.label} className="card elev-sm" style={{ borderRadius: 'var(--radius-lg)', padding: 13, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ fontSize: 10, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--color-neutral-600)' }}>{k.label}</div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 21, lineHeight: 1.15, color: k.color }}>{k.value}</div>
                <div style={{ fontSize: 11, color: 'var(--color-neutral-700)' }}>{k.note}</div>
              </div>
            ))}
          </div>

          <section className="card elev-sm" style={{ borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
              <h2 style={{ margin: 0, fontSize: 16 }}>Photos</h2>
              <span style={{ fontSize: 11, color: 'var(--color-neutral-600)' }}>
                {session.photos.length ? session.photos.length + ' prise' + (session.photos.length > 1 ? 's' : '') + " dans l'app" : 'aucune prise de vue'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 10, overflow: 'auto', paddingBottom: 2 }}>
              {session.photos.map((ph) => (
                <div key={ph.id} style={{ flex: 'none', width: 132, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div className="washed" style={{ height: 132, borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--color-neutral-200)' }}>
                    <div
                      role="img"
                      aria-label={PHOTO_LABEL_TEXT[ph.label]}
                      style={{ width: '100%', height: '100%', backgroundImage: `url("${ph.url}")`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                    />
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--color-neutral-700)' }}>{PHOTO_LABEL_TEXT[ph.label]}</span>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => openCamera(session.id, 'ASPECT', null)}
              style={{ borderRadius: 999, minHeight: 46 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 4h-5L8 7H4v13h16V7h-4z" />
                <circle cx="12" cy="13.5" r="3.5" />
              </svg>
              Prendre une photo
            </button>
          </section>

          <section className="card elev-sm" style={{ borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 16 }}>Moyenne par version</h2>
            {stats.versions.map((v) => (
              <div key={v.ver} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                  <span>
                    <strong>{v.ver}</strong> · {v.dateLabel}
                  </span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {v.fmt} σ {v.sd}
                  </span>
                </div>
                <div style={{ height: 14, borderRadius: 999, background: 'var(--color-neutral-200)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 999, background: v.color, width: v.w }} />
                </div>
              </div>
            ))}
          </section>

          <section className="card elev-sm" style={{ borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 16 }}>Profil sensoriel</h2>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--color-neutral-700)' }}>
              <strong style={{ color: 'var(--color-accent-700)' }}>{stats.aVer}</strong> vs{' '}
              <strong style={{ color: 'var(--color-accent-2-700)' }}>{stats.bVer}</strong>, intensités 0–10.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <svg viewBox="0 0 220 220" style={{ width: '100%', maxWidth: 250, height: 'auto', overflow: 'visible' }}>
                <circle cx="110" cy="110" r="84" fill="none" stroke="var(--color-divider)" />
                <circle cx="110" cy="110" r="56" fill="none" stroke="var(--color-divider)" />
                <circle cx="110" cy="110" r="28" fill="none" stroke="var(--color-divider)" />
                {stats.axes.map((a) => (
                  <g key={a.label}>
                    <line x1="110" y1="110" x2={a.x} y2={a.y} stroke="var(--color-divider)" />
                    <text x={a.lx} y={a.ly} textAnchor={a.anchor} fontSize="10.5" fill="var(--color-neutral-700)" fontFamily="var(--font-body)">
                      {a.label}
                    </text>
                  </g>
                ))}
                <polygon points={stats.radarB} fill="none" stroke="var(--color-accent-2-600)" strokeWidth="2.5" strokeDasharray="5 4" />
                <polygon points={stats.radarA} fill="color-mix(in srgb, var(--color-accent) 22%, transparent)" stroke="var(--color-accent)" strokeWidth="3" />
              </svg>
            </div>
          </section>

          <section className="card elev-sm" style={{ borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 16 }}>Dispersion du panel</h2>
            {stats.panel.map((p) => (
              <div key={p.name} style={{ display: 'grid', gridTemplateColumns: '96px minmax(0,1fr) 42px', gap: 8, alignItems: 'center', fontSize: 12.5 }}>
                <span>{p.name}</span>
                <div style={{ position: 'relative', height: 11, borderRadius: 999, background: 'var(--color-neutral-200)' }}>
                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, background: 'var(--color-neutral-400)' }} />
                  <div style={{ position: 'absolute', top: 0, bottom: 0, borderRadius: 999, background: p.color, left: p.left, width: p.w }} />
                </div>
                <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--color-neutral-700)' }}>{p.label}</span>
              </div>
            ))}
          </section>

          <section className="card elev-sm" style={{ borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 11 }}>
            <h2 style={{ margin: 0, fontSize: 16 }}>Commentaires</h2>
            {stats.comments.map((c, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                <div style={{ flex: 'none', width: 28, height: 28, borderRadius: 999, background: 'var(--color-accent-200)', color: 'var(--color-accent-800)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5 }}>
                  {c.initials}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 11.5, color: 'var(--color-neutral-700)' }}>
                    {c.name} · {c.ver} · {c.fmt}
                  </div>
                  <p style={{ margin: '2px 0 0', fontSize: 13 }}>{c.text}</p>
                </div>
              </div>
            ))}
          </section>
        </>
      )}

      <section className="card elev-sm" style={{ borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>Supprimer la session</h2>
        <p style={{ margin: 0, fontSize: 12.5, color: 'var(--color-neutral-700)' }}>Retire la session, toutes ses versions et leurs grilles.</p>
        {!confirmSes && (
          <button type="button" className="btn btn-secondary" style={{ borderRadius: 999, minHeight: 44 }} onClick={() => setConfirmSes(true)}>
            Supprimer « {session.name} »
          </button>
        )}
        {confirmSes && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--color-accent-200)' }}>
            <div style={{ fontSize: 12.5, color: 'var(--color-accent-800)' }}>Confirmer la suppression de « {session.name} » ?</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-primary" disabled={busy} style={{ borderRadius: 999, minHeight: 42, flex: 1 }} onClick={deleteSession}>
                Supprimer
              </button>
              <button type="button" className="btn btn-secondary" style={{ borderRadius: 999, minHeight: 42, flex: 1 }} onClick={() => setConfirmSes(false)}>
                Annuler
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
