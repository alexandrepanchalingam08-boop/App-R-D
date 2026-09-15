import { useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import { useSetPageMeta } from '../context/PageMetaContext.jsx';
import { POLES, POLE_LABELS } from '../constants.js';
import { pillStyle } from '../lib/pill.js';
import { api } from '../api.js';

function blankForm() {
  return { firstName: '', lastName: '', email: '', password: '', pole: 'RD' };
}

export default function Admin() {
  useSetPageMeta({ kicker: 'Administration', heading: 'Comptes utilisateurs' });
  const { users, refresh } = useData();
  const [form, setForm] = useState(blankForm());
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const counts = POLES.map((p) => ({ label: POLE_LABELS[p], n: users.filter((u) => u.pole === p).length }));

  async function submit() {
    setErr(null);
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setErr('Nom et prénom sont obligatoires.');
      return;
    }
    if (!form.email.trim() || !form.password || form.password.length < 8) {
      setErr('Email valide et mot de passe (8 caractères min.) requis.');
      return;
    }
    setBusy(true);
    try {
      await api.createUser(form);
      await refresh();
      setForm(blankForm());
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    setBusy(true);
    try {
      await api.deleteUser(id);
      await refresh();
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p style={{ margin: 0, fontSize: 12.5, color: 'var(--color-neutral-700)' }}>
        {users.length} comptes · {counts.map((c) => c.label + ' ' + c.n).join(' · ')}
      </p>
      <p style={{ margin: 0, fontSize: 12, color: 'var(--color-neutral-700)' }}>
        Les droits et les écrans visibles dépendent du pôle de chaque compte.
      </p>

      <section className="card elev-sm" style={{ borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>Créer un compte</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="field">
            <label>Prénom</label>
            <input className="input" style={{ borderRadius: 999, minHeight: 46 }} placeholder="Camille" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          </div>
          <div className="field">
            <label>Nom</label>
            <input className="input" style={{ borderRadius: 999, minHeight: 46 }} placeholder="Durand" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </div>
        </div>
        <div className="field">
          <label>Email</label>
          <input
            className="input"
            type="email"
            style={{ borderRadius: 999, minHeight: 46 }}
            placeholder="camille.durand@quick.fr"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Mot de passe provisoire</label>
          <input
            className="input"
            type="text"
            style={{ borderRadius: 999, minHeight: 46 }}
            placeholder="8 caractères minimum"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Pôle de rattachement</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {POLES.map((p) => (
              <button key={p} type="button" onClick={() => setForm({ ...form, pole: p })} style={pillStyle(form.pole === p)}>
                {POLE_LABELS[p]}
              </button>
            ))}
          </div>
        </div>
        <button type="button" className="btn btn-primary" disabled={busy} style={{ borderRadius: 999, minHeight: 48 }} onClick={submit}>
          Créer le compte
        </button>
        {err && (
          <div style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-accent-200)', color: 'var(--color-accent-800)', padding: '10px 13px', fontSize: 12.5 }}>{err}</div>
        )}
      </section>

      <section className="card elev-sm" style={{ borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 11 }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>Comptes existants</h2>
        {users.map((u) => (
          <div key={u.id} style={{ display: 'flex', flexDirection: 'column', gap: 9, paddingBottom: 10, borderBottom: '1px solid var(--color-divider)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 'none', width: 36, height: 36, borderRadius: 999, background: 'var(--color-accent-200)', color: 'var(--color-accent-800)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                {(u.firstName[0] + u.lastName[0]).toUpperCase()}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 14 }}>
                  {u.firstName} {u.lastName}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--color-neutral-700)' }}>
                  {POLE_LABELS[u.pole]}
                  {u.isAdmin ? ' · administrateur' : ''}
                </div>
              </div>
              {!u.isAdmin && (
                <button type="button" className="btn btn-ghost" style={{ borderRadius: 999, minHeight: 40 }} onClick={() => setConfirm(u.id)}>
                  Retirer
                </button>
              )}
              {u.isAdmin && (
                <span className="tag tag-accent" style={{ flex: 'none' }}>
                  admin
                </span>
              )}
            </div>
            {confirm === u.id && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--color-accent-200)' }}>
                <div style={{ fontSize: 12.5, color: 'var(--color-accent-800)' }}>
                  Retirer le compte de {u.firstName} {u.lastName} ? Ses grilles déjà saisies sont conservées.
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn btn-primary" disabled={busy} style={{ borderRadius: 999, minHeight: 42, flex: 1 }} onClick={() => remove(u.id)}>
                    Retirer
                  </button>
                  <button type="button" className="btn btn-secondary" style={{ borderRadius: 999, minHeight: 42, flex: 1 }} onClick={() => setConfirm(null)}>
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
