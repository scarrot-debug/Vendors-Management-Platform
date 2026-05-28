import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import Layout from './components/Layout.jsx';
import PageGuard from './components/PageGuard.jsx';
import Login from './pages/Login.jsx';
import Vendors from './pages/Vendors.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Settings from './pages/Settings.jsx';
import Profile from './pages/Profile.jsx';
import Catalog from './pages/Catalog.jsx';
import Requests from './pages/Requests.jsx';
import Approvals from './pages/Approvals.jsx';

function Protected({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Protected><Layout /></Protected>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<PageGuard permKey="can_access_dashboard"><Dashboard /></PageGuard>} />
            <Route path="vendors" element={<PageGuard permKey="can_access_vendors"><Vendors /></PageGuard>} />
            <Route path="catalog" element={<PageGuard permKey="can_access_catalog"><Catalog /></PageGuard>} />
            <Route path="requests" element={<PageGuard permKey="can_access_requests"><Requests /></PageGuard>} />
            <Route path="approvals" element={<PageGuard permKey="can_access_approvals"><Approvals /></PageGuard>} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
