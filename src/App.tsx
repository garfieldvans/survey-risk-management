import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { RequireAuth } from './components/RequireAuth';
import { AppLayout } from './layouts/AppLayout';
import { SurveyorLayout } from './layouts/SurveyorLayout';
import { Login } from './pages/Login';
import { SurveyorSurveys } from './pages/SurveyorSurveys';
import { SurveyorNewSurvey } from './pages/SurveyorNewSurvey';
import { SurveyDetail } from './pages/SurveyDetail';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminSurveys } from './pages/AdminSurveys';
import { AdminSurveyReview } from './pages/AdminSurveyReview';
import { AdminOccupations } from './pages/AdminOccupations';
import { AdminQuestions } from './pages/AdminQuestions';
import { AdminReports } from './pages/AdminReports';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Role-aware home */}
            <Route
              path="/"
              element={
                <RequireAuth>
                  <RoleHomeRedirect />
                </RequireAuth>
              }
            />

            {/* Surveyor area — mobile-first */}
            <Route
              element={
                <RequireAuth role="SURVEYOR">
                  <SurveyorLayout />
                </RequireAuth>
              }
            >
              <Route path="/surveys" element={<SurveyorSurveys />} />
              <Route path="/surveys/new" element={<SurveyorNewSurvey />} />
              <Route path="/surveys/:id" element={<SurveyDetail />} />
            </Route>

            {/* Admin area — desktop sidebar */}
            <Route
              element={
                <RequireAuth role="ADMIN">
                  <AppLayout />
                </RequireAuth>
              }
            >
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/surveys" element={<AdminSurveys />} />
              <Route path="/admin/surveys/:id" element={<SurveyDetail />} />
              <Route path="/admin/surveys/:id/review" element={<AdminSurveyReview />} />
              <Route path="/admin/occupations" element={<AdminOccupations />} />
              <Route path="/admin/questions" element={<AdminQuestions />} />
              <Route path="/admin/reports" element={<AdminReports />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

function RoleHomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) return null;
  return <Navigate to={user?.role === 'ADMIN' ? '/admin' : '/surveys'} replace />;
}