import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import HomePage from './pages/HomePage';
import TrainingPage from './pages/TrainingPage';
import SessionsPage from './pages/SessionsPage';
import SessionDetailPage from './pages/SessionDetailPage';
import ProgressPage from './pages/ProgressPage';
import ProfilePage from './pages/ProfilePage';
import { DeviceProvider } from './lib/DeviceContext';

export default function App() {
  useEffect(() => {
    document.body.classList.add('app-ready');
    return () => document.body.classList.remove('app-ready');
  }, []);

  return (
    <DeviceProvider>
      <HashRouter>
        <div className="dark min-h-screen min-h-dvh bg-bg max-w-lg mx-auto relative overflow-hidden">
          <main className="pb-20">
            <Routes>
              <Route path="/"              element={<HomePage />} />
              <Route path="/training"      element={<TrainingPage />} />
              <Route path="/sessions"      element={<SessionsPage />} />
              <Route path="/sessions/:id"  element={<SessionDetailPage />} />
              <Route path="/progress"      element={<ProgressPage />} />
              <Route path="/profile"       element={<ProfilePage />} />
              <Route path="*"              element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <BottomNav />
        </div>
      </HashRouter>
    </DeviceProvider>
  );
}
