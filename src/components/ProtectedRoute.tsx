import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { Sector } from '../types'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedSectors?: Sector[]
}

export function ProtectedRoute({ children, allowedSectors }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-gray-50">
        <div className="w-7 h-7 border-2 border-icm-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Não autenticado → login
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Autenticado mas sem perfil → Login trata esse estado (tela de "conta sem perfil")
  if (!profile) {
    return <Navigate to="/login" replace />
  }

  if (allowedSectors && !allowedSectors.includes(profile.sector)) {
    if (profile.sector === 'manutencao') return <Navigate to="/manutencao" replace />
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
