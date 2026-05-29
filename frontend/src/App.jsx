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
import GrammarLessonPage from './pages/GrammarLessonPage';
import RoadmapPage from './pages/RoadmapPage';
import CustomRoadmapPage from './pages/CustomRoadmapPage';
import SelfStudyPage from './pages/SelfStudyPage';
import DeckDetailPage from './pages/DeckDetailPage';
import StudyPage from './pages/StudyPage';
import QuizPage from './pages/QuizPage';
import LessonPage from './pages/LessonPage';
import CourseLessonPage from './pages/CourseLessonPage';
import CoursePage from './pages/CoursePage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminContentPage from './pages/AdminContentPage';
import AdminCoursesPage from './pages/AdminCoursesPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';
import BrowsePage from './pages/BrowsePage';
import DemoPage from './pages/DemoPage';
import ExercisePage from './pages/ExercisePage';
import ProgressPage from './pages/ProgressPage';
import LeaderboardPage from './pages/LeaderboardPage';
import CommunityPage from './pages/CommunityPage';
import UpgradePage from './pages/UpgradePage';
import AiChatPage from './pages/AiChatPage';
import ListeningPage from './pages/ListeningPage';

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
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Main app — all pages share AppLayout */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/kanji" element={<KanjiPage />} />
        <Route path="/vocabulary" element={<VocabularyPage />} />
        <Route path="/grammar" element={<GrammarPage />} />
        <Route path="/grammar/:deckId" element={<GrammarLessonPage />} />
        <Route path="/roadmap" element={<RoadmapPage />} />
        <Route path="/custom-roadmap/:id" element={<CustomRoadmapPage />} />
        <Route path="/self-study" element={<SelfStudyPage />} />
        <Route path="/deck/:deckId" element={<DeckDetailPage />} />
        <Route path="/study/:deckId" element={<StudyPage />} />
        <Route path="/quiz/:deckId" element={<QuizPage />} />
        <Route path="/lesson/:deckId" element={<LessonPage />} />
        <Route path="/courses/:slug" element={<CoursePage />} />
        <Route path="/learn/:lessonId" element={<CourseLessonPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/content" element={<AdminContentPage />} />
        <Route path="/admin/courses" element={<AdminCoursesPage />} />
        <Route path="/admin/settings" element={<AdminSettingsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/browse" element={<BrowsePage />} />
        <Route path="/demo/:deckId" element={<DemoPage />} />
        <Route path="/exercises/:deckId" element={<ExercisePage />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/upgrade" element={<UpgradePage />} />
        <Route path="/ai-chat" element={<AiChatPage />} />
        <Route path="/listening" element={<ListeningPage />} />
        {/* Legacy redirects */}
        <Route path="/hantu" element={<Navigate to="/kanji" replace />} />
        <Route path="/tuvung" element={<Navigate to="/vocabulary" replace />} />
        <Route path="/nguphap" element={<Navigate to="/grammar" replace />} />
        <Route path="/lotrinh" element={<Navigate to="/roadmap" replace />} />
        <Route path="/tuhoc" element={<Navigate to="/self-study" replace />} />
        <Route path="/cong-dong" element={<Navigate to="/community" replace />} />
        <Route path="/nang-cap" element={<Navigate to="/upgrade" replace />} />
        <Route path="/bai-hoc" element={<Navigate to="/kanji" replace />} />
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
