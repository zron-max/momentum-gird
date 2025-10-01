import { useAuth } from '@/contexts/AuthContext'
import { Navigate } from 'react-router-dom'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, status } = useAuth()

  if (isLoading) return <div>Loading...</div>
  if (!user) return <Navigate to="/auth" replace />

  if (status === 'pending') return <Navigate to="/pending" replace />
  if (status === 'rejected') return <Navigate to="/rejected" replace />

  return <>{children}</> // approved user
}
