import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/Login'
import BookingsPage from './pages/Bookings'
import SettingsPage from './pages/Settings'
import DashboardPage from './pages/Dashboard'
import FinancePage from './pages/Finance'
import ClientsPage from './pages/Clients'
import Layout from './components/Layout'

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/bookings" replace />} />
        <Route path="bookings" element={<BookingsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="finance" element={<FinancePage />} />
        <Route path="clients" element={<ClientsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

