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

  // Loading state - show while checking authentication
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

  // Not authenticated - redirect to login with return URL
  if (!isLoggedIn) {
    return (
      <Navigate 
        to="/login" 
        state={{ 
          backgroundLocation: location,
          from: location.pathname 
        }} 
        replace 
      />
    );
  }

  // Check role if required
  if (requiredRole && userData?.role !== requiredRole) {
    // Redirect based on user's actual role
    if (userData?.role === 'admin') {
      return <Navigate to="/admin/home" replace />;
    } else {
      return <Navigate to="/user/home" replace />;
    }
  }

  // Authenticated and authorized
  return <>{children}</>;
};

export default ProtectedRoute;