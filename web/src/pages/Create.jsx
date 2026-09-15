import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext.jsx';
import { useSetPageMeta } from '../context/PageMetaContext.jsx';
import { SESSION_KINDS, KIND_META } from '../constants.js';
import { pillStyle } from '../lib/pill.js';
import { api } from '../api.js';
import CompositionBuilder from '../components/CompositionBuilder.jsx';
import MicButton from '../components/MicButton.jsx';

function FieldLabel({ children, value, onText }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 5 }}>
      <label style={{ margin: 0 }}>{children}</label>
      <MicButton value={value} onText={onText} />
    </div>
  );
}

const today = () => new Date().toISOString().slice(0, 10);

export default function Create() {
  useSetPageMeta({ kicker: 'Nouveau', heading: 'Créer une session', showBack: true });
  const { sessions, refresh } = useData();
  const navigate = useNavigate();

  const [kind, setKind] = useState('PRODUIT_COMPLET');
  const [date, setDate] = useState(today());
  const [name, setName] = useState('');
  const [project, setProject] = useState('');
  const [supplier, setSupplier] = useState('');
  const [ver, setVer] = useState('V1');
  const [code, setCode] = useState('');
  const [ing, setIng] = useState('');
  const [procede, setProcede] = useState('');
  const [comp, setComp] = useState([]);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const isFull = kind === 'PRODUIT_COMPLET';
  const meta = KIND_META[kind];

  async function submit() {
    setErr(null);
    if (!name.trim()) {
      setErr('Le nom est obligatoire.');
      return;
    }
    if (isFull && !comp.length) {
      setErr('Ajoutez au moins un ingrédient à la composition.');
      return;
    }
    if (!isFull && !ing.trim()) {
      setErr("Renseignez au moins un ingrédient — c'est ce qui rend la session cherchable.");
      return;
    }
    setBusy(true);
    try {
      const res = await api.createSession({
        kind,
        name,
        project,
        supplier,
        date,
        ver,
        code,
        ingredients: ing,
        composition: comp,
        procede
      });
      await refresh();
      navigate('/session/' + res.session.id);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p style={{ margin: 0, fontSize: 12.5, color: 'var(--color-neutral-700)' }}>
        Créez la session, puis ajoutez-y autant de versions que nécessaire.
      </p>
      <section className="card elev-sm" style={{ borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div className="field" style={{ flex: 1, minWidth: 0 }}>
            <label>Nature de la fiche</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {SESSION_KINDS.map((k) => (
                <button key={k} type="button" onClick={() => setKind(k)} style={pillStyle(kind === k)}>
                  {KIND_META[k].label}
                </button>
              ))}
            </div>
          </div>
          <div className="field" style={{ flex: '0 0 132px' }}>
            <label>Date</label>
            <input className="input" type="date" style={{ borderRadius: 999, minHeight: 46 }} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--color-neutral-600)', marginTop: -4 }}>{meta.hint}</div>
        <div className="field">
          <FieldLabel value={name} onText={setName}>{meta.nameLabel}</FieldLabel>
          <input className="input" style={{ borderRadius: 999, minHeight: 46, fontSize: 15 }} placeholder="ex. Crème dessert praliné" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <FieldLabel value={project} onText={setProject}>Projet R&amp;D</FieldLabel>
          <input className="input" style={{ borderRadius: 999, minHeight: 46 }} placeholder="ex. Dessert 2026" value={project} onChange={(e) => setProject(e.target.value)} />
        </div>
        <div className="field">
          <FieldLabel value={supplier} onText={setSupplier}>Fournisseur ou enseigne</FieldLabel>
          <input className="input" style={{ borderRadius: 999, minHeight: 46 }} placeholder="ex. Cacao Nord" value={supplier} onChange={(e) => setSupplier(e.target.value)} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="field">
            <label>Première version</label>
            <input className="input" style={{ borderRadius: 999, minHeight: 46 }} placeholder="V1" value={ver} onChange={(e) => setVer(e.target.value)} />
          </div>
          <div className="field">
            <label>Code produit</label>
            <input className="input" style={{ borderRadius: 999, minHeight: 46 }} placeholder="ex. CDC-284" value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
        </div>
        {!isFull && (
          <div className="field">
            <FieldLabel value={ing} onText={setIng}>Ingrédients (séparés par une virgule)</FieldLabel>
            <textarea
              className="input"
              style={{ borderRadius: 'var(--radius-md)', minHeight: 78 }}
              placeholder="cacao 28%, crème, sucre de canne, fleur de sel"
              value={ing}
              onChange={(e) => setIng(e.target.value)}
            />
          </div>
        )}
        {isFull && <CompositionBuilder rows={comp} onChange={setComp} sessions={sessions} />}
        <div className="field">
          <FieldLabel value={procede} onText={setProcede}>Mise en œuvre (temps de cuisson, équipement…)</FieldLabel>
          <textarea
            className="input"
            style={{ borderRadius: 'var(--radius-md)', minHeight: 70 }}
            placeholder="ex. Cuisson 12 min à 180°C, mélangeur planétaire vitesse 2"
            value={procede}
            onChange={(e) => setProcede(e.target.value)}
          />
        </div>
        <button type="button" className="btn btn-primary" disabled={busy} style={{ borderRadius: 999, minHeight: 48 }} onClick={submit}>
          Créer la session
        </button>
        {err && (
          <div style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-accent-200)', color: 'var(--color-accent-800)', padding: '10px 13px', fontSize: 12.5 }}>{err}</div>
        )}
      </section>
    </div>
  );
}
