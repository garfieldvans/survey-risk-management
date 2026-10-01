import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Spinner } from '../components/Spinner';

export function RequireAuth({ role, children }: { role?: 'ADMIN' | 'SURVEYOR'; children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner label="Memeriksa sesi..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role && user.role !== role) {
    // Surveyor can't enter admin, admin can't enter surveyor area
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/surveys'} replace />;
  }

  return <>{children}</>;
}