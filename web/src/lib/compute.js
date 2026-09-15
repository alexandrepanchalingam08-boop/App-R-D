import { GRILLE, AXES, NOTE_SCALE, KIND_META } from '../constants.js';

export function mean(a) {
  return a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
}

export function sd(a) {
  if (a.length < 2) return 0;
  const m = mean(a);
  return Math.sqrt(mean(a.map((v) => (v - m) * (v - m))));
}

export function fmt(v) {
  if (NOTE_SCALE === 'sur 9 (hédonique)') return (v * 0.9).toFixed(1) + '/9';
  if (NOTE_SCALE === 'sur 5 (étoiles)') return (v / 2).toFixed(1) + '★';
  return v.toFixed(1) + '/10';
}

export function fmtParts(v) {
  if (NOTE_SCALE === 'sur 9 (hédonique)') return { main: (v * 0.9).toFixed(1), unit: 'sur 9' };
  if (NOTE_SCALE === 'sur 5 (étoiles)') return { main: (v / 2).toFixed(1), unit: 'sur 5' };
  return { main: v.toFixed(1), unit: 'sur 10' };
}

const MONTHS = ['janv.', 'févr.', 'mars', 'avril', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
export function dateLabel(d) {
  if (!d) return '';
  const p = String(d).split('-');
  return Number(p[2]) + ' ' + MONTHS[Number(p[1]) - 1] + ' ' + p[0];
}

export function initials(n) {
  return n
    .split(' ')
    .map((x) => x[0])
    .join('');
}

export function totalMass(list) {
  return list.reduce(
    (a, c) => a + (c.unit === 'g' ? Number(c.dose) || 0 : c.unit === 'kg' ? (Number(c.dose) || 0) * 1000 : 0),
    0
  );
}

export function versionMeans(version) {
  return mean(version.grades.map((g) => g.note));
}

// Session-level statistics: KPIs, per-version means, sensory radar (latest
// closed version vs the one before), panel dispersion, recent comments.
export function sessionStats(session) {
  const closed = session.versions.filter((v) => v.closed && v.grades.length);
  if (!closed.length) return { has: false };

  const all = closed.flatMap((v) => v.grades.map((g) => g.note));
  const last = closed[closed.length - 1];
  const prev = closed.length > 1 ? closed[closed.length - 2] : last;

  const profileMean = (v) => {
    const o = {};
    GRILLE.forEach((c) => {
      o[c.k] = mean(v.grades.map((g) => g.profile[c.k] || 0));
    });
    return o;
  };
  const A = profileMean(last);
  const B = profileMean(prev);

  const means = closed.map((v) => versionMeans(v));
  const best = means.reduce((acc, m, i) => (m > acc.m ? { m, v: closed[i].ver } : acc), { m: -1, v: '—' });

  const angleStep = (2 * Math.PI) / AXES.length;
  const radar = (prof) =>
    AXES.map((ax, i) => {
      const ang = -Math.PI / 2 + i * angleStep;
      const r = (84 * (prof[ax.k] || 0)) / 10;
      return (110 + r * Math.cos(ang)).toFixed(1) + ',' + (110 + r * Math.sin(ang)).toFixed(1);
    }).join(' ');

  const byPanelist = {};
  closed.forEach((v) => v.grades.forEach((g) => (byPanelist[g.tasterName] = byPanelist[g.tasterName] || []).push(g.note)));
  const gm = mean(all);

  return {
    has: true,
    aVer: last.ver,
    bVer: prev.ver === last.ver ? 'référence' : prev.ver,
    kpis: [
      { label: 'Moyenne session', value: fmt(gm), note: all.length + ' grilles', color: 'var(--color-accent-700)' },
      {
        label: 'Dernière clôturée',
        value: fmt(means[means.length - 1]),
        note: last.ver + ' · ' + dateLabel(last.date),
        color: 'var(--color-text)'
      },
      { label: 'Meilleure version', value: fmt(best.m), note: best.v, color: 'var(--color-accent-2-700)' },
      {
        label: 'Écart-type',
        value: sd(all).toFixed(2),
        note: sd(all) > 2 ? 'panel dispersé' : 'panel cohérent',
        color: 'var(--color-text)'
      }
    ],
    versions: closed.map((v, i) => ({
      ver: v.ver,
      dateLabel: dateLabel(v.date),
      fmt: fmt(means[i]),
      sd: sd(v.grades.map((g) => g.note)).toFixed(2),
      w: (means[i] * 10).toFixed(0) + '%',
      color: i === closed.length - 1 ? 'var(--color-accent)' : 'var(--color-accent-300)'
    })),
    axes: AXES.map((ax, i) => {
      const ang = -Math.PI / 2 + i * angleStep;
      const cx = Math.cos(ang);
      const cy = Math.sin(ang);
      return {
        label: ax.label,
        x: (110 + 84 * cx).toFixed(1),
        y: (110 + 84 * cy).toFixed(1),
        lx: (110 + 100 * cx).toFixed(1),
        ly: (110 + 100 * cy + 4).toFixed(1),
        anchor: cx > 0.2 ? 'start' : cx < -0.2 ? 'end' : 'middle'
      };
    }),
    radarA: radar(A),
    radarB: radar(B),
    panel: Object.keys(byPanelist)
      .map((name) => {
        const m = mean(byPanelist[name]);
        const d = m - gm;
        const w = Math.min(50, (Math.abs(d) / 3) * 50);
        return {
          name,
          label: (d >= 0 ? '+' : '') + d.toFixed(1),
          left: (d >= 0 ? 50 : 50 - w) + '%',
          w: w.toFixed(1) + '%',
          color: d >= 0 ? 'var(--color-accent-2-500)' : 'var(--color-accent-400)'
        };
      })
      .sort((a, b) => Number(b.label) - Number(a.label)),
    comments: closed
      .slice()
      .reverse()
      .flatMap((v) =>
        v.grades.slice(0, 2).map((g) => ({
          name: g.tasterName,
          ver: v.ver,
          fmt: fmt(g.note),
          text: g.comment,
          initials: initials(g.tasterName)
        }))
      )
      .slice(0, 4)
  };
}

export function activeVersion(session) {
  const open = session.versions.filter((v) => !v.closed);
  return open[open.length - 1] || session.versions[session.versions.length - 1];
}

export function activeRows(sessions) {
  return sessions
    .filter((s) => s.versions.some((v) => !v.closed))
    .map((s) => {
      const cur = activeVersion(s);
      const m = mean(cur.grades.map((g) => g.note));
      return {
        session: s,
        version: cur,
        meta: s.supplier + ' · ' + s.project + ' · ' + s.versions.length + ' versions',
        openLabel: cur.ver + ' à tester · ' + cur.grades.length + ' grille' + (cur.grades.length > 1 ? 's' : ''),
        provisional: cur.grades.length ? 'provisoire ' + fmt(m) : 'aucune grille',
        w: Math.min(100, cur.grades.length * 20) + '%'
      };
    });
}

export function histRows(sessions, q) {
  const needle = (q || '').trim().toLowerCase();
  const rows = [];
  sessions.forEach((s) =>
    s.versions.forEach((v) => {
      if (!v.closed || !v.grades.length) return;
      const names = v.grades.map((g) => g.tasterName);
      const hay = [
        s.name,
        s.kind,
        s.project,
        s.supplier,
        v.ver,
        v.code,
        v.ingredients.join(' '),
        names.join(' '),
        v.grades.map((g) => g.comment).join(' ')
      ]
        .join(' ')
        .toLowerCase();
      if (needle && hay.indexOf(needle) < 0) return;
      const m = mean(v.grades.map((g) => g.note));
      const parts = fmtParts(m);
      const good = m >= 7;
      rows.push({
        session: s,
        version: v,
        sort: v.date,
        meta:
          KIND_META[s.kind].label + ' · ' + dateLabel(v.date) + (v.code ? ' · ' + v.code : '') + ' · σ ' + sd(v.grades.map((g) => g.note)).toFixed(2),
        panelLabel: names.slice(0, 3).join(', ') + (names.length > 3 ? ' +' + (names.length - 3) : ''),
        noteMain: parts.main,
        noteUnit: parts.unit,
        good
      });
    })
  );
  return rows.sort((a, b) => (a.sort < b.sort ? 1 : -1));
}

export function prodRows(sessions) {
  return sessions.map((s) => {
    const closed = s.versions.filter((v) => v.closed && v.grades.length);
    const all = closed.flatMap((v) => v.grades.map((g) => g.note));
    return { session: s, fmt: all.length ? fmt(mean(all)) : '—' };
  });
}
