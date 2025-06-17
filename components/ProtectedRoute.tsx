
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthenticatedUser } from '../types';

interface ProtectedRouteProps {
  user: AuthenticatedUser; 
  redirectPath?: string;
  children?: React.ReactNode; 
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ user, redirectPath = '/home', children }) => {
  if (!user) {
    return <Navigate to={redirectPath} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;