import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

export function Layout() {
  const { user, logout } = useAuth()
  const links = [
    { to: '/', label: 'My timesheet', show: true },
    { to: '/approvals', label: 'Approvals', show: user?.role !== 'employee' },
    { to: '/reports', label: 'Reports', show: true },
    { to: '/payroll', label: 'Payroll exports', show: user?.role === 'admin' },
  ]
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <AppBar position="static">
        <Toolbar sx={{ gap: 1 }}>
          <Typography variant="h6" sx={{ mr: 2 }}>
            Workforce Ops
          </Typography>
          {links
            .filter((link) => link.show)
            .map((link) => (
              <Button key={link.to} component={NavLink} to={link.to} color="inherit" end>
                {link.label}
              </Button>
            ))}
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="body2" sx={{ mr: 2 }}>
            {user?.name} · {user?.role} · {user?.tenant.name}
          </Typography>
          <Button color="inherit" onClick={logout}>
            Sign out
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Outlet />
      </Container>
    </Box>
  )
}
