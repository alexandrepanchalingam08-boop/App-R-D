import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const ICONS = {
  actives: 'M12 7v5l4 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18',
  hist: 'M4 6h16M4 12h16M4 18h10',
  prod: 'M6 3h9l5 5v13H6zM15 3v5h5',
  buy: 'M6 6h15l-2 9H8zM6 6 5 3H2M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2M18 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2',
  admin: 'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1',
  foodtour: 'M4 3v18M4 3h6a3 3 0 0 1 0 6H4M15 3v18M20 3l-2 7h4l-2 7'
};

export default function BottomNav() {
  const { isBuyer, user } = useAuth();

  const items = [
    { id: 'actives', to: '/en-cours', label: 'En cours' },
    { id: 'hist', to: '/historique', label: 'Historique' },
    { id: 'prod', to: '/produits', label: 'Produits' },
    { id: 'foodtour', to: '/food-tour', label: 'Food tour' }
  ];
  if (isBuyer) items.push({ id: 'buy', to: '/achats', label: 'Mes achats' });
  if (user?.isAdmin) items.push({ id: 'admin', to: '/admin', label: 'Admin' });

  return (
    <nav
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        padding: '8px 10px 14px',
        display: 'flex',
        gap: 4,
        background: '#fff',
        borderTop: '1px solid var(--color-divider)',
        boxShadow: '0 -6px 18px rgba(23,18,15,.06)'
      }}
    >
      {items.map((it) => (
        <NavLink
          key={it.id}
          to={it.to}
          style={({ isActive }) => ({
            flex: 1,
            minHeight: 52,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
            border: 0,
            cursor: 'pointer',
            borderRadius: 'var(--radius-md)',
            textDecoration: 'none',
            background: isActive ? 'var(--color-accent-200)' : 'transparent',
            color: isActive ? 'var(--color-accent-800)' : 'var(--color-neutral-600)'
          })}
        >
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round">
            <path d={ICONS[it.id]} />
          </svg>
          <span style={{ fontSize: 10.5 }}>{it.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
