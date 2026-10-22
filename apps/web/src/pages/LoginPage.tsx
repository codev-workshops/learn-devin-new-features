import { useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material'
import { errorMessage } from '../api/client'
import { DEMO_ACCOUNTS } from '../auth/demoAccounts'
import { useAuth } from '../auth/useAuth'


export function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const signIn = async (address: string) => {
    setBusy(true)
    setError(null)
    try {
      await login(address)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: 'grey.100' }}>
      <Card sx={{ width: 420 }}>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h5">Workforce Ops</Typography>
            <Typography variant="body2" color="text.secondary">
              Training environment. Pick a seeded account or type its email.
            </Typography>
            {error && <Alert severity="error">{error}</Alert>}
            <Stack spacing={1}>
              {DEMO_ACCOUNTS.map((account) => (
                <Button key={account.email} variant="outlined" disabled={busy} onClick={() => signIn(account.email)}>
                  {account.label}
                </Button>
              ))}
            </Stack>
            <Box
              component="form"
              onSubmit={(event) => {
                event.preventDefault()
                void signIn(email)
              }}
            >
              <Stack direction="row" spacing={1}>
                <TextField size="small" label="Email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
                <Button type="submit" variant="contained" disabled={busy || !email}>
                  Sign in
                </Button>
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
