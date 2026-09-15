import { Outlet } from 'react-router-dom';
import Header from './Header.jsx';
import BottomNav from './BottomNav.jsx';
import CameraOverlay from './CameraOverlay.jsx';
import { usePageMeta } from '../context/PageMetaContext.jsx';

export default function Layout() {
  const { meta } = usePageMeta();
  return (
    <div className="app-shell">
      <div className="phone">
        <Header kicker={meta.kicker} heading={meta.heading} showBack={meta.showBack} showNew={meta.showNew} />
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflow: 'auto',
            padding: '16px 18px 96px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            position: 'relative'
          }}
        >
          <Outlet />
        </div>
        <BottomNav />
        <CameraOverlay />
      </div>
    </div>
  );
}
