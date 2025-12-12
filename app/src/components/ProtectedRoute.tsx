// ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import type { FC, ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'customer';
}

const SAFE_BACKGROUND_PATH = '/product-catalog';
const SAFE_SEGMENTS = new Set(['admin', 'account', 'user', 'customer']);

const ProtectedRoute: FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { isLoggedIn, isLoading, userData } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '18px',
          color: '#666',
        }}
      >
        Verifying authentication...
      </div>
    );
  }

  const firstSegment = location.pathname.split('/').filter(Boolean)[0] ?? '';
  const isSafeSegment = SAFE_SEGMENTS.has(firstSegment);

  // Not authenticated - redirect to login with a SAFE background for protected areas
  if (!isLoggedIn) {
    const backgroundLocation = isSafeSegment
      ? { pathname: SAFE_BACKGROUND_PATH }
      : location;

    return (
      <Navigate
        to="/login"
        state={{
          backgroundLocation,
          from: location.pathname,
        }}
        replace
      />
    );
  }

  // Check role if required
  if (requiredRole && userData?.role !== requiredRole) {
    if (userData?.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to={SAFE_BACKGROUND_PATH} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
