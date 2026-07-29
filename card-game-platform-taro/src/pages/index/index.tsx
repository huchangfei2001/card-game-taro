import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useUser } from '../../utils/UserContext'
import { GAME_LIST } from '../../utils/gameList'
import './index.scss'

const GAME_COST: Record<string, number> = {
  ddz: 20, poker: 30, blackjack: 10, zhajinhua: 20,
  niuniu: 15, guandan: 15, shengji: 10, sanshui: 15,
  paodekuai: 10, showhand: 20, xiangqi: 0, go: 0,
  gomoku: 0, chess: 0, othello: 0, flyingchess: 5,
  jungli: 10, checkers: 0, tetris: 0, tank: 0,
  pacman: 0, puzzlebobble: 0, strikers1945: 0,
  sichuanmahjong: 15, riichimahjong: 20
}

export default function IndexPage() {
  const { user, isLoggedIn } = useUser()

  const handleGameTap = (gameId: string) => {
    const cost = GAME_COST[gameId] || 0
    if (cost > 0 && user && user.coins < cost) {
      Taro.showToast({ title: '金币不足', icon: 'none' })
      return
    }
    Taro.navigateTo({ url: `/pages/game/index?id=${gameId}&cost=${cost}` })
  }

  return (
    <View className='lobby'>
      <View className='header'>
        <Text className='title'>棋牌游戏平台</Text>
        <Text className='subtitle'>26款经典游戏 · 单机&联机</Text>
      </View>

      {user && (
        <View className='user-bar'>
          <Text className='username'>{user.isGuest ? '👤 ' : '👑 '}{user.username}</Text>
          <Text className='coins'>💰 {user.coins}</Text>
        </View>
      )}

      {!isLoggedIn && (
        <View className='login-prompt'>
          <Text className='login-text'>登录后享受更多功能</Text>
          <View className='btn btn-gold login-btn' onTap={() => Taro.switchTab({ url: '/pages/login/index' })}>
            <Text>登录 / 注册</Text>
          </View>
        </View>
      )}

      <View className='mode-select'>
        <View className='mode-btn mode-active'>
          <Text>单机模式</Text>
        </View>
        <View className='mode-btn' onTap={() => Taro.navigateTo({ url: '/pages/multiplayer/index' })}>
          <Text>联机模式</Text>
        </View>
      </View>

      <ScrollView scrollY className='game-scroll'>
        <View className='category'>
          <Text className='category-title'>🃏 棋牌类</Text>
          <View className='game-grid'>
            {GAME_LIST.filter(g => g.category === 'card').map(game => (
              <View key={game.id} className='game-card' onTap={() => handleGameTap(game.id)}>
                <Text className='game-icon'>{game.icon}</Text>
                <Text className='game-name'>{game.name}</Text>
                <Text className='game-name-cn'>{game.nameCn}</Text>
                <Text className='game-desc'>{game.desc}</Text>
                <Text className='game-players'>{game.players}</Text>
                {GAME_COST[game.id] > 0 && (
                  <Text className='game-cost'>💰 {GAME_COST[game.id]}</Text>
                )}
                {GAME_COST[game.id] === 0 && (
                  <Text className='game-free'>免费</Text>
                )}
              </View>
            ))}
          </View>
        </View>

        <View className='category'>
          <Text className='category-title'>♟️ 棋类</Text>
          <View className='game-grid'>
            {GAME_LIST.filter(g => g.category === 'board').map(game => (
              <View key={game.id} className='game-card' onTap={() => handleGameTap(game.id)}>
                <Text className='game-icon'>{game.icon}</Text>
                <Text className='game-name'>{game.name}</Text>
                <Text className='game-name-cn'>{game.nameCn}</Text>
                <Text className='game-desc'>{game.desc}</Text>
                <Text className='game-players'>{game.players}</Text>
                {GAME_COST[game.id] > 0 && (
                  <Text className='game-cost'>💰 {GAME_COST[game.id]}</Text>
                )}
                {GAME_COST[game.id] === 0 && (
                  <Text className='game-free'>免费</Text>
                )}
              </View>
            ))}
          </View>
        </View>

        <View className='category'>
          <Text className='category-title'>🕹️ 街机类</Text>
          <View className='game-grid'>
            {GAME_LIST.filter(g => g.category === 'arcade').map(game => (
              <View key={game.id} className='game-card' onTap={() => handleGameTap(game.id)}>
                <Text className='game-icon'>{game.icon}</Text>
                <Text className='game-name'>{game.name}</Text>
                <Text className='game-name-cn'>{game.nameCn}</Text>
                <Text className='game-desc'>{game.desc}</Text>
                <Text className='game-players'>{game.players}</Text>
                {GAME_COST[game.id] > 0 && (
                  <Text className='game-cost'>💰 {GAME_COST[game.id]}</Text>
                )}
                {GAME_COST[game.id] === 0 && (
                  <Text className='game-free'>免费</Text>
                )}
              </View>
            ))}
          </View>
        </View>

        <View className='category'>
          <Text className='category-title'>🀄 麻将类</Text>
          <View className='game-grid'>
            {GAME_LIST.filter(g => g.category === 'mahjong').map(game => (
              <View key={game.id} className='game-card' onTap={() => handleGameTap(game.id)}>
                <Text className='game-icon'>{game.icon}</Text>
                <Text className='game-name'>{game.name}</Text>
                <Text className='game-name-cn'>{game.nameCn}</Text>
                <Text className='game-desc'>{game.desc}</Text>
                <Text className='game-players'>{game.players}</Text>
                {GAME_COST[game.id] > 0 && (
                  <Text className='game-cost'>💰 {GAME_COST[game.id]}</Text>
                )}
                {GAME_COST[game.id] === 0 && (
                  <Text className='game-free'>免费</Text>
                )}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
