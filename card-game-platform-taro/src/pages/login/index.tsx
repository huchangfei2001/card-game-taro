import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { useUser } from '../../utils/UserContext'
import './index.scss'

export default function LoginPage() {
  const { user, isLoggedIn, register, login, logout, playAsGuest } = useUser()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setError('')
    if (!username.trim() || !password.trim()) {
      setError('请输入用户名和密码')
      return
    }
    const fn = mode === 'login' ? login : register
    const err = await fn(username, password)
    if (err) {
      setError(err)
    } else {
      Taro.showToast({ title: mode === 'login' ? '登录成功' : '注册成功', icon: 'success' })
      setUsername('')
      setPassword('')
    }
  }

  const handleGuest = async () => {
    await playAsGuest()
    Taro.showToast({ title: '游客登录成功', icon: 'success' })
  }

  if (isLoggedIn && user) {
    return (
      <View className='profile'>
        <View className='profile-header'>
          <Text className='profile-avatar'>{user.isGuest ? '👤' : '👑'}</Text>
          <Text className='profile-name'>{user.username}</Text>
          <Text className='profile-coins'>💰 {user.coins} 金币</Text>
        </View>

        <View className='profile-actions'>
          {user.isGuest && (
            <View className='info-box'>
              <Text>游客账号数据不会保存，建议注册账号</Text>
            </View>
          )}
          <View className='btn btn-gold' onTap={() => Taro.showModal({
            title: '充值',
            content: '请联系客服充值金币',
            showCancel: false
          })}>
            <Text>充值金币</Text>
          </View>
          <View className='btn btn-outline' onTap={() => {
            Taro.showModal({
              title: '确认退出',
              content: '确定要退出登录吗？',
              success: (res) => {
                if (res.confirm) {
                  logout()
                  Taro.showToast({ title: '已退出', icon: 'success' })
                }
              }
            })
          }}>
            <Text>退出登录</Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View className='login-page'>
      <View className='login-header'>
        <Text className='login-title'>棋牌游戏平台</Text>
        <Text className='login-subtitle'>登录享受更多功能</Text>
      </View>

      <View className='login-card'>
        <View className='mode-tabs'>
          <View className={`mode-tab ${mode === 'login' ? 'active' : ''}`} onTap={() => setMode('login')}>
            <Text>登录</Text>
          </View>
          <View className={`mode-tab ${mode === 'register' ? 'active' : ''}`} onTap={() => setMode('register')}>
            <Text>注册</Text>
          </View>
        </View>

        <View className='form-group'>
          <Text className='form-label'>用户名</Text>
          <Input
            className='form-input'
            placeholder='请输入用户名'
            value={username}
            onInput={(e) => setUsername(e.detail.value)}
          />
        </View>

        <View className='form-group'>
          <Text className='form-label'>密码</Text>
          <Input
            className='form-input'
            placeholder='请输入密码'
            password
            value={password}
            onInput={(e) => setPassword(e.detail.value)}
          />
        </View>

        {error && <Text className='form-error'>{error}</Text>}

        <View className='btn btn-gold submit-btn' onTap={handleSubmit}>
          <Text>{mode === 'login' ? '登录' : '注册'}</Text>
        </View>

        <View className='divider'>
          <View className='divider-line' />
          <Text className='divider-text'>或</Text>
          <View className='divider-line' />
        </View>

        <View className='btn btn-outline guest-btn' onTap={handleGuest}>
          <Text>游客模式 (赠送500金币)</Text>
        </View>

        {mode === 'register' && (
          <Text className='bonus-hint'>注册赠送 2000 金币</Text>
        )}
      </View>
    </View>
  )
}
