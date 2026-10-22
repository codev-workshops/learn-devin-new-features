import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { AuthContext, type AuthState } from '../auth/AuthContext'
import { DEMO_ACCOUNTS } from '../auth/demoAccounts'
import { LoginPage } from './LoginPage'

function renderWith(login: AuthState['login']) {
  render(
    <AuthContext.Provider value={{ user: null, loading: false, login, logout: () => undefined }}>
      <LoginPage />
    </AuthContext.Provider>,
  )
}

test('signs in with a demo account', async () => {
  const login = vi.fn().mockResolvedValue(undefined)
  renderWith(login)
  fireEvent.click(screen.getByRole('button', { name: DEMO_ACCOUNTS[2].label }))
  await waitFor(() => expect(login).toHaveBeenCalledWith('eli@acme.test'))
})

test('shows the API error message', async () => {
  renderWith(vi.fn().mockRejectedValue(new Error('Unknown user')))
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'nobody@acme.test' } })
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
  expect(await screen.findByText('Unknown user')).toBeInTheDocument()
})
