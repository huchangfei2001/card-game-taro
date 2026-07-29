import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import Taro from '@tarojs/taro'

interface User {
  id: string
  username: string
  coins: number
  isGuest: boolean
}

interface Transaction {
  id: string
  amount: number
  reason: string
  timestamp: number
}

interface UserContextType {
  user: User | null
  isLoggedIn: boolean
  register: (username: string, password: string) => Promise<string | null>
  login: (username: string, password: string) => Promise<string | null>
  logout: () => void
  playAsGuest: () => Promise<void>
  addCoins: (amount: number, reason: string) => Promise<boolean>
  spendCoins: (amount: number, reason: string) => Promise<boolean>
  transactions: Transaction[]
}

const UserContext = createContext<UserContextType | null>(null)

const API_BASE = 'http://localhost:3001/api'

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])

  useEffect(() => {
    const cached = Taro.getStorageSync('currentUser')
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        setUser(parsed)
        refreshUser(parsed.id)
      } catch (e) {
        Taro.removeStorageSync('currentUser')
      }
    }
  }, [])

  const refreshUser = async (userId: string) => {
    try {
      const res = await Taro.request({ url: `${API_BASE}/user/${userId}` })
      if (res.statusCode === 200 && res.data.user) {
        const u = res.data.user
        const mapped: User = {
          id: u.id,
          username: u.username,
          coins: u.coins,
          isGuest: !!u.is_guest
        }
        setUser(mapped)
        Taro.setStorageSync('currentUser', JSON.stringify(mapped))
      }
    } catch (e) {
      console.error('Refresh user failed:', e)
    }
  }

  const register = async (username: string, password: string): Promise<string | null> => {
    try {
      const res = await Taro.request({
        url: `${API_BASE}/register`,
        method: 'POST',
        data: { username, password }
      })
      if (res.statusCode === 200 && res.data.user) {
        const u = res.data.user
        const mapped: User = {
          id: u.id,
          username: u.username,
          coins: u.coins,
          isGuest: !!u.is_guest
        }
        setUser(mapped)
        Taro.setStorageSync('currentUser', JSON.stringify(mapped))
        return null
      }
      return res.data?.error || '注册失败'
    } catch (e) {
      return '网络错误'
    }
  }

  const login = async (username: string, password: string): Promise<string | null> => {
    try {
      const res = await Taro.request({
        url: `${API_BASE}/login`,
        method: 'POST',
        data: { username, password }
      })
      if (res.statusCode === 200 && res.data.user) {
        const u = res.data.user
        const mapped: User = {
          id: u.id,
          username: u.username,
          coins: u.coins,
          isGuest: !!u.is_guest
        }
        setUser(mapped)
        Taro.setStorageSync('currentUser', JSON.stringify(mapped))
        return null
      }
      return res.data?.error || '登录失败'
    } catch (e) {
      return '网络错误'
    }
  }

  const logout = () => {
    setUser(null)
    Taro.removeStorageSync('currentUser')
  }

  const playAsGuest = async () => {
    try {
      const res = await Taro.request({
        url: `${API_BASE}/guest`,
        method: 'POST'
      })
      if (res.statusCode === 200 && res.data.user) {
        const u = res.data.user
        const mapped: User = {
          id: u.id,
          username: u.username,
          coins: u.coins,
          isGuest: true
        }
        setUser(mapped)
        Taro.setStorageSync('currentUser', JSON.stringify(mapped))
      }
    } catch (e) {
      console.error('Guest login failed:', e)
    }
  }

  const addCoins = async (amount: number, reason: string): Promise<boolean> => {
    if (!user) return false
    try {
      const res = await Taro.request({
        url: `${API_BASE}/coins/add`,
        method: 'POST',
        data: { userId: user.id, amount, reason }
      })
      if (res.statusCode === 200 && res.data.user) {
        await refreshUser(user.id)
        return true
      }
      return false
    } catch (e) {
      return false
    }
  }

  const spendCoins = async (amount: number, reason: string): Promise<boolean> => {
    if (!user) return false
    if (user.coins < amount) return false
    try {
      const res = await Taro.request({
        url: `${API_BASE}/coins/spend`,
        method: 'POST',
        data: { userId: user.id, amount, reason }
      })
      if (res.statusCode === 200 && res.data.user) {
        await refreshUser(user.id)
        return true
      }
      return false
    } catch (e) {
      return false
    }
  }

  return (
    <UserContext.Provider value={{
      user,
      isLoggedIn: !!user,
      register,
      login,
      logout,
      playAsGuest,
      addCoins,
      spendCoins,
      transactions
    }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}
