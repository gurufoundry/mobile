import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function AuthGuard() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <div className="min-h-screen bg-paper" />

  if (!user) return <Navigate to="/auth" state={{ from: location }} replace />

  return <Outlet />
}
