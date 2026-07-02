import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute() {
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  if (!token || user?.role !== 'community') {
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}