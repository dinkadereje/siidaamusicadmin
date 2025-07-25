"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { logger } from '@/lib/logger'

interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  is_staff: boolean
  is_superuser: boolean
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://13.60.30.188'

  // Check for existing token on mount
  useEffect(() => {
    logger.info('AUTH', 'Initializing authentication context')
    
    const savedToken = localStorage.getItem('admin_token')
    const savedUser = localStorage.getItem('admin_user')
    
    if (savedToken && savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        setToken(savedToken)
        setUser(userData)
        logger.info('AUTH', `Restored session for user: ${userData.username}`)
      } catch (error) {
        logger.error('AUTH', 'Failed to parse saved user data', error as Error)
        // Clear corrupted data
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_user')
        localStorage.removeItem('admin_refresh_token')
      }
    } else {
      logger.info('AUTH', 'No saved session found')
    }
    
    setIsLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    logger.authAttempt(username)
    
    try {
      setIsLoading(true)
      
      logger.info('AUTH', `Attempting login for user: ${username}`, {
        apiUrl: API_BASE_URL,
        timestamp: new Date().toISOString(),
      })
      
      // Get JWT token
      const tokenResponse = await fetch(`${API_BASE_URL}/api/token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      logger.info('AUTH', `Token request response: ${tokenResponse.status}`, {
        ok: tokenResponse.ok,
        statusText: tokenResponse.statusText,
        url: tokenResponse.url,
      })

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json()
        const errorMessage = errorData.detail || 'Invalid credentials'
        logger.authFailure(username, errorMessage)
        throw new Error(errorMessage)
      }

      const tokenData = await tokenResponse.json()
      const accessToken = tokenData.access
      
      logger.info('AUTH', 'Token received successfully', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!tokenData.refresh,
      })

      // Get user profile
      const profileResponse = await fetch(`${API_BASE_URL}/api/user/profile/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      logger.info('AUTH', `Profile request response: ${profileResponse.status}`, {
        ok: profileResponse.ok,
        statusText: profileResponse.statusText,
      })

      if (!profileResponse.ok) {
        const errorMessage = 'Failed to fetch user profile'
        logger.error('AUTH', errorMessage, new Error(`Profile fetch failed: ${profileResponse.status}`))
        throw new Error(errorMessage)
      }

      const userData = await profileResponse.json()
      
      logger.info('AUTH', 'User profile received', {
        userId: userData.id,
        username: userData.username,
        email: userData.email,
        isStaff: userData.is_staff,
        isSuperuser: userData.is_superuser,
      })

      // Save to localStorage
      localStorage.setItem('admin_token', accessToken)
      localStorage.setItem('admin_user', JSON.stringify(userData))
      localStorage.setItem('admin_refresh_token', tokenData.refresh)

      setToken(accessToken)
      setUser(userData)
      
      logger.authSuccess(username)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown login error'
      logger.authFailure(username, errorMessage)
      console.error('Login error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    const currentUser = user?.username || 'unknown'
    logger.authLogout()
    logger.info('AUTH', `User ${currentUser} logged out`)
    
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    localStorage.removeItem('admin_refresh_token')
    setToken(null)
    setUser(null)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('admin_refresh_token')
      if (!refreshToken) {
        throw new Error('No refresh token available')
      }

      const response = await fetch(`${API_BASE_URL}/api/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      })

      if (!response.ok) {
        throw new Error('Token refresh failed')
      }

      const data = await response.json()
      const newAccessToken = data.access

      localStorage.setItem('admin_token', newAccessToken)
      setToken(newAccessToken)

      return newAccessToken
    } catch (error) {
      console.error('Token refresh error:', error)
      logout()
      throw error
    }
  }

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isLoading,
    isAuthenticated: !!token && !!user,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}