import { View, Text, Input, Picker } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect, useRef } from 'react'
import { useUser } from '../../utils/UserContext'
import { GAME_LIST } from '../../utils/gameList'
import './index.scss'

const GAME_OPTIONS = GAME_LIST.map(g => `${g.icon} ${g.nameCn}`)
const GAME_IDS = GAME_LIST.map(g => g.id)

export default function MultiplayerPage() {
  const { user } = useUser()
  const [nickname, setNickname] = useState(user?.username || '')
  const [roomCode, setRoomCode] = useState('')
  const [selectedGame, setSelectedGame] = useState(0)
  const [room, setRoom] = useState<any>(null)
  const [error, setError] = useState('')
  const socketRef = useRef<any>(null)

  useEffect(() => {
    if (!user) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      Taro.switchTab({ url: '/pages/login/index' })
      return
    }
    setNickname(user.username)
  }, [user])

  const connectSocket = () => {
    const socket = Taro.connectSocket({ url: 'ws://localhost:3001' })
    socketRef.current = socket

    socket.onOpen(() => {
      console.log('WebSocket connected')
    })

    socket.onMessage((msg) => {
      try {
        const data = JSON.parse(msg.data)
        if (data.type === 'roomUpdate') {
          setRoom(data.room)
        } else if (data.type === 'gameStart') {
          Taro.navigateTo({
            url: `/pages/game/index?id=${room?.game}&room=${room?.id}&multiplayer=1`
          })
        } else if (data.type === 'error') {
          setError(data.message)
        }
      } catch (e) {
        console.error('Parse error:', e)
      }
    })

    socket.onClose(() => {
      console.log('WebSocket closed')
    })

    return socket
  }

  const handleCreateRoom = () => {
    if (!nickname.trim()) {
      setError('请输入昵称')
      return
    }
    setError('')
    const socket = connectSocket()
    setTimeout(() => {
      socket.send({
        data: JSON.stringify({
          type: 'createRoom',
          game: GAME_IDS[selectedGame],
          nickname
        })
      })
    }, 500)
  }

  const handleJoinRoom = () => {
    if (!nickname.trim()) {
      setError('请输入昵称')
      return
    }
    if (!roomCode.trim()) {
      setError('请输入房间号')
      return
    }
    setError('')
    const socket = connectSocket()
    setTimeout(() => {
      socket.send({
        data: JSON.stringify({
          type: 'joinRoom',
          roomId: roomCode.trim().toUpperCase(),
          nickname
        })
      })
    }, 500)
  }

  if (room) {
    return (
      <View className='mp-room'>
        <Text className='mp-title'>等待玩家加入...</Text>
        <View className='room-info'>
          <Text className='room-id'>房间号: {room.id}</Text>
          <Text className='room-game'>{GAME_LIST.find(g => g.id === room.game)?.nameCn}</Text>
        </View>
        <View className='player-list'>
          <Text className='player-title'>玩家 ({room.players.length}/{room.maxPlayers})</Text>
          {room.players.map((p: any, i: number) => (
            <View key={i} className='player-item'>
              <Text>{p.nickname}</Text>
              {i === 0 && <Text className='host-badge'>房主</Text>}
            </View>
          ))}
        </View>
        <View className='btn btn-outline' onTap={() => setRoom(null)}>
          <Text>退出房间</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='mp-page'>
      <Text className='mp-title'>联机模式</Text>

      <View className='mp-form'>
        <View className='form-group'>
          <Text className='form-label'>昵称</Text>
          <Input
            className='form-input'
            placeholder='请输入昵称'
            value={nickname}
            onInput={(e) => setNickname(e.detail.value)}
          />
        </View>

        <View className='form-group'>
          <Text className='form-label'>选择游戏</Text>
          <Picker
            mode='selector'
            range={GAME_OPTIONS}
            value={selectedGame}
            onChange={(e) => setSelectedGame(Number(e.detail.value))}
          >
            <View className='form-input picker'>
              <Text>{GAME_OPTIONS[selectedGame]}</Text>
            </View>
          </Picker>
        </View>

        <View className='btn btn-gold' onTap={handleCreateRoom}>
          <Text>创建房间</Text>
        </View>

        <View className='divider'>
          <View className='divider-line' />
          <Text className='divider-text'>或加入已有房间</Text>
          <View className='divider-line' />
        </View>

        <View className='form-group'>
          <Text className='form-label'>房间号</Text>
          <Input
            className='form-input'
            placeholder='请输入6位房间号'
            value={roomCode}
            onInput={(e) => setRoomCode(e.detail.value)}
            maxlength={6}
          />
        </View>

        <View className='btn btn-blue' onTap={handleJoinRoom}>
          <Text>加入房间</Text>
        </View>

        {error && <Text className='form-error'>{error}</Text>}
      </View>

      <View className='btn btn-outline back-btn' onTap={() => Taro.switchTab({ url: '/pages/index/index' })}>
        <Text>返回大厅</Text>
      </View>
    </View>
  )
}
