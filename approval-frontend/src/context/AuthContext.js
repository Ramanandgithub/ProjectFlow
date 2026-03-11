import { createContext, useContext, useEffect, useReducer } from 'react'
import { authApi } from '../api'

const AuthContext = createContext(null)

const initialState = {
  user:    JSON.parse(localStorage.getItem('auth_user') || 'null'),
  token:   localStorage.getItem('auth_token') || null,
  loading: false,
  ready:   false,
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING': return { ...state, loading: action.payload }
    case 'LOGIN_SUCCESS':
      localStorage.setItem('auth_token', action.payload.token)
      localStorage.setItem('auth_user', JSON.stringify(action.payload.user))
      return { ...state, user: action.payload.user, token: action.payload.token, loading: false, ready: true }
    case 'LOGOUT':
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      return { ...state, user: null, token: null, loading: false, ready: true }
    case 'SET_READY': return { ...state, ready: true }
    default: return state
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  // Validate token on mount — run once only
  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      authApi.me()
        .then(({ data }) => {
          dispatch({ type: 'LOGIN_SUCCESS', payload: { user: data.data, token } })
        })
        .catch(() => {
          dispatch({ type: 'LOGOUT' })
        })
    } else {
      dispatch({ type: 'SET_READY' })
    }
  }, []) // Run only once on mount

  const login = async (credentials) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    const { data } = await authApi.login(credentials)
    dispatch({ type: 'LOGIN_SUCCESS', payload: data.data })
    return data
  }

  const register = async (userData) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    const { data } = await authApi.register(userData)
    dispatch({ type: 'LOGIN_SUCCESS', payload: data.data })
    return data
  }

  const logout = async () => {
    try { await authApi.logout() } catch {}
    dispatch({ type: 'LOGOUT' })
  }

  return (
    <AuthContext.Provider value={{
      user:    state.user,
      token:   state.token,
      loading: state.loading,
      ready:   state.ready,
      isAdmin: state.user?.role === 'admin',
      isAuth:  !!state.user,
      login,
      register,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}