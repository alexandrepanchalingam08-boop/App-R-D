export function pillStyle(on, dark = false) {
  return {
    cursor: 'pointer',
    fontSize: 12,
    minHeight: 36,
    padding: '0 13px',
    borderRadius: 999,
    whiteSpace: 'nowrap',
    border: '1px solid ' + (on ? 'var(--color-accent)' : dark ? 'rgba(245,234,216,.35)' : 'var(--color-divider)'),
    background: on ? 'var(--color-accent)' : 'transparent',
    color: on ? '#fff' : dark ? '#f5ead8' : 'var(--color-neutral-800)'
  };
}
