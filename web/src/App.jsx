import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { DataProvider } from './context/DataContext.jsx';
import { CameraProvider } from './context/CameraContext.jsx';
import { PageMetaProvider } from './context/PageMetaContext.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Actives from './pages/Actives.jsx';
import Historique from './pages/Historique.jsx';
import Produits from './pages/Produits.jsx';
import SessionDetail from './pages/SessionDetail.jsx';
import Create from './pages/Create.jsx';
import Saisie from './pages/Saisie.jsx';
import Achats from './pages/Achats.jsx';
import Admin from './pages/Admin.jsx';

function Guard({ when, children, fallback = '/en-cours' }) {
  return when ? children : <Navigate to={fallback} replace />;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-neutral-600)' }}>
        Chargement…
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <DataProvider>
      <CameraProvider>
        <PageMetaProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/en-cours" replace />} />
              <Route path="login" element={<Navigate to="/en-cours" replace />} />
              <Route path="en-cours" element={<Actives />} />
              <Route path="historique" element={<Historique />} />
              <Route path="produits" element={<Produits />} />
              <Route path="session/:id" element={<SessionDetail />} />
              <Route path="nouveau" element={<Create />} />
              <Route path="saisie/:sessionId/:versionId" element={<Saisie />} />
              <Route
                path="achats"
                element={
                  <Guard when={user.pole === 'ACHATS' || user.isAdmin}>
                    <Achats />
                  </Guard>
                }
              />
              <Route
                path="admin"
                element={
                  <Guard when={user.isAdmin}>
                    <Admin />
                  </Guard>
                }
              />
              <Route path="*" element={<Navigate to="/en-cours" replace />} />
            </Route>
          </Routes>
        </PageMetaProvider>
      </CameraProvider>
    </DataProvider>
  );
}
