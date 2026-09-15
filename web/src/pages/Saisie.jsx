import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../context/DataContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useSetPageMeta } from '../context/PageMetaContext.jsx';
import { useCamera } from '../context/CameraContext.jsx';
import { dateLabel } from '../lib/compute.js';
import { GRILLE, HED } from '../constants.js';
import { api } from '../api.js';
import CompositionReadOnly from '../components/CompositionReadOnly.jsx';
import MicButton from '../components/MicButton.jsx';

function blankProfile() {
  const p = {};
  GRILLE.forEach((c) => (p[c.k] = 5));
  return p;
}

export default function Saisie() {
  const { sessionId, versionId } = useParams();
  const navigate = useNavigate();
  const { findSession, refresh } = useData();
  const { user } = useAuth();
  const { openCamera } = useCamera();

  const session = findSession(sessionId);
  const version = session ? session.versions.find((v) => v.id === versionId) : null;

  useSetPageMeta({ kicker: 'Ma grille', heading: 'Dégustation', showBack: true });

  const [name, setName] = useState(user ? user.firstName + ' ' + user.lastName.charAt(0).toUpperCase() + '.' : '');
  const [note, setNote] = useState(7);
  const [profile, setProfile] = useState(blankProfile());
  const [comment, setComment] = useState('');
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [photoCount, setPhotoCount] = useState(0);

  if (!session || !version) {
    return <p style={{ fontSize: 13, color: 'var(--color-neutral-700)' }}>Version introuvable.</p>;
  }

  async function submit() {
    if (!name.trim()) {
      setErr("Indiquez votre nom avant d'enregistrer.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await api.addGrade(session.id, version.id, { tasterName: name.trim(), hedonicRaw: note, profile, comment });
      await refresh();
      navigate('/session/' + session.id + '?v=' + version.id);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <section className="card elev-sm" style={{ borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 9 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 15.5, fontWeight: 600 }}>{session.name}</span>
          <span className="tag tag-accent">{version.ver}</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-neutral-700)' }}>
          {session.kind === 'INGREDIENT' ? 'Ingrédient' : session.kind === 'BENCHMARK' ? 'Benchmark' : 'Produit complet'} ·{' '}
          {dateLabel(version.date)}
          {version.code ? ' · ' + version.code : ''} · {session.supplier}
        </div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {version.ingredients.map((i, idx) => (
            <span key={idx} className="tag tag-outline">
              {i}
            </span>
          ))}
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-neutral-700)' }}>
          {version.grades.length ? 'Déjà saisi par ' + version.grades.map((g) => g.tasterName).join(', ') : 'Vous êtes le premier à saisir cette version.'}
        </div>
      </section>

      {version.composition.length > 0 && <CompositionReadOnly rows={version.composition} compact />}

      <section className="card elev-sm" style={{ borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 11 }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>Votre nom</h2>
        <input className="input" style={{ borderRadius: 999, minHeight: 46, fontSize: 15 }} placeholder="Prénom + initiale" value={name} onChange={(e) => setName(e.target.value)} />
      </section>

      <section className="card elev-sm" style={{ borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 11 }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>Appréciation globale</h2>
        <div style={{ fontSize: 11.5, color: 'var(--color-neutral-700)' }}>Échelle hédonique 9 points</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 7 }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((x) => (
            <button
              key={x}
              type="button"
              onClick={() => setNote(x)}
              title={HED[x]}
              style={{
                height: 50,
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontSize: 16,
                border: '1px solid ' + (note === x ? 'var(--color-accent)' : 'var(--color-divider)'),
                background: note === x ? 'var(--color-accent)' : 'transparent',
                color: note === x ? '#fff' : 'var(--color-neutral-800)'
              }}
            >
              {x}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--color-neutral-700)' }}>
          {note} — {HED[note]}
        </div>
      </section>

      <section className="card elev-sm" style={{ borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>Profil descriptif</h2>
        {GRILLE.map((c) => (
          <div key={c.k} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 13 }}>{c.label}</span>
              <span style={{ fontSize: 11, color: 'var(--color-neutral-600)' }}>{profile[c.k]}</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={profile[c.k]}
              onChange={(e) => setProfile({ ...profile, [c.k]: Number(e.target.value) })}
              style={{ width: '100%', height: 30, accentColor: 'var(--color-accent)' }}
            />
          </div>
        ))}
      </section>

      <section className="card elev-sm" style={{ borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 11 }}>
        <div className="field">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 5 }}>
            <label style={{ margin: 0 }}>Commentaire</label>
            <MicButton value={comment} onText={setComment} />
          </div>
          <textarea
            className="input"
            style={{ borderRadius: 'var(--radius-md)', minHeight: 84 }}
            placeholder="Attaque franche, finale un peu amère…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ borderRadius: 999, minHeight: 46 }}
          onClick={() => openCamera(session.id, 'ASPECT', () => setPhotoCount((c) => c + 1))}
        >
          Ajouter une photo{photoCount ? ' (' + photoCount + ')' : ''}
        </button>
        <button type="button" className="btn btn-primary" disabled={busy} style={{ borderRadius: 999, minHeight: 48 }} onClick={submit}>
          Enregistrer ma grille
        </button>
        {err && (
          <div style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-accent-200)', color: 'var(--color-accent-800)', padding: '10px 13px', fontSize: 12.5 }}>{err}</div>
        )}
      </section>
    </div>
  );
}
