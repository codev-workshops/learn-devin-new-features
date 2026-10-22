import { Box, CircularProgress } from '@mui/material'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/useAuth'
import { Layout } from './components/Layout'
import { ApprovalsPage } from './pages/ApprovalsPage'
import { LoginPage } from './pages/LoginPage'
import { PayrollPage } from './pages/PayrollPage'
import { ReportsPage } from './pages/ReportsPage'
import { TimesheetsPage } from './pages/TimesheetsPage'

export default function App() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }
  if (!user) return <LoginPage />
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<TimesheetsPage />} />
        <Route path="approvals" element={user.role === 'employee' ? <Navigate to="/" replace /> : <ApprovalsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="payroll" element={user.role === 'admin' ? <PayrollPage /> : <Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
