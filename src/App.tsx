import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { FirebaseProvider } from './firebase/FirebaseProvider'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Orders } from './pages/Orders'
import { NewOrder } from './pages/NewOrder'
import { EditOrder } from './pages/EditOrder'
import { OrderDetail } from './pages/OrderDetail'
import { Technicians } from './pages/Technicians'
import { Manutencao } from './pages/Manutencao'
import { Admin } from './pages/Admin'

export function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || undefined}>
      <AuthProvider>
        <FirebaseProvider>
        <Routes>
          {/* Rota pública */}
          <Route path="/login" element={<Login />} />

          {/* Rotas do setor de manutenção (layout próprio) */}
          <Route
            path="/manutencao"
            element={
              <ProtectedRoute allowedSectors={['manutencao', 'admin']}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Manutencao />} />
          </Route>

          {/* Rotas do admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedSectors={['admin']}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Admin />} />
          </Route>

          {/* Rotas principais (instalador + setor_som + admin) */}
          <Route
            element={
              <ProtectedRoute allowedSectors={['instalador', 'setor_som', 'admin']}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="pedidos" element={<Orders />} />
            <Route
              path="pedidos/novo"
              element={
                <ProtectedRoute allowedSectors={['setor_som', 'admin']}>
                  <NewOrder />
                </ProtectedRoute>
              }
            />
            <Route path="pedidos/:id/editar" element={<EditOrder />} />
            <Route path="pedidos/:id" element={<OrderDetail />} />
            <Route
              path="prestadores"
              element={
                <ProtectedRoute allowedSectors={['setor_som', 'admin']}>
                  <Technicians />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </FirebaseProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
