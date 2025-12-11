// ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import type { FC, ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'customer';
}

const ProtectedRoute: FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { isLoggedIn, isLoading, userData } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Verifying authentication...
      </div>
    );
  }

  // Not authenticated - redirect to login with a SAFE background
  if (!isLoggedIn) {
    const isAdminPath = location.pathname.startsWith('/admin');
    const backgroundLocation = isAdminPath
      ? { pathname: '/product-catalog' } // avoid looping back into admin
      : location;

    return (
      <Navigate 
        to="/login" 
        state={{ 
          backgroundLocation,
          from: location.pathname 
        }} 
        replace 
      />
    );
  }

  // Check role if required
  if (requiredRole && userData?.role !== requiredRole) {
    if (userData?.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/product-catalog" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
