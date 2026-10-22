import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api, TOKEN_KEY } from '../api/client'
import { useMe } from '../api/hooks'
import type { User } from '../api/types'
import { AuthContext } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const client = useQueryClient()
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const me = useMe(Boolean(token))

  const login = useCallback(
    async (email: string) => {
      const response = await api.post<{ data: { token: string; user: User } }>('/auth/login', { email })
      localStorage.setItem(TOKEN_KEY, response.data.data.token)
      client.setQueryData(['me'], response.data.data.user)
      setToken(response.data.data.token)
    },
    [client],
  )

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    client.clear()
  }, [client])

  const value = useMemo(
    () => ({
      user: token && me.data ? me.data : null,
      loading: Boolean(token) && me.isPending,
      login,
      logout,
    }),
    [token, me.data, me.isPending, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
