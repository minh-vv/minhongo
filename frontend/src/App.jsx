import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import KanjiPage from './pages/KanjiPage';
import VocabularyPage from './pages/VocabularyPage';
import GrammarPage from './pages/GrammarPage';
import RoadmapPage from './pages/RoadmapPage';
import SelfStudyPage from './pages/SelfStudyPage';
import DeckDetailPage from './pages/DeckDetailPage';
import StudyPage from './pages/StudyPage';
import CommunityPage from './pages/CommunityPage';
import UpgradePage from './pages/UpgradePage';

const queryClient = new QueryClient();

// Redirect logged-in users away from login/register
function PublicOnlyRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Auth pages — standalone layout */}
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        }
      />

      {/* Main app — all pages share AppLayout */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/hantu" element={<KanjiPage />} />
        <Route path="/tuvung" element={<VocabularyPage />} />
        <Route path="/nguphap" element={<GrammarPage />} />
        <Route path="/lotrinh" element={<RoadmapPage />} />
        <Route path="/tuhoc" element={<SelfStudyPage />} />
        <Route path="/deck/:deckId" element={<DeckDetailPage />} />
        <Route path="/study/:deckId" element={<StudyPage />} />
        <Route path="/cong-dong" element={<CommunityPage />} />
        <Route path="/nang-cap" element={<UpgradePage />} />
        {/* Legacy redirects */}
        <Route path="/bai-hoc" element={<Navigate to="/hantu" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
