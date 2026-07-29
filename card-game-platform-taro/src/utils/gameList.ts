export interface GameInfo {
  id: string
  name: string
  nameCn: string
  desc: string
  players: string
  category: 'card' | 'board' | 'arcade' | 'mahjong'
  icon: string
}

export const GAME_LIST: GameInfo[] = [
  { id: 'ddz', name: 'Dou Di Zhu', nameCn: '斗地主', desc: '经典三人斗地主', players: '3人', category: 'card', icon: '🃏' },
  { id: 'poker', name: 'Texas Holdem', nameCn: '德州扑克', desc: '无限注德州扑克', players: '2-9人', category: 'card', icon: '♠️' },
  { id: 'blackjack', name: 'Blackjack', nameCn: '21点', desc: '经典21点', players: '1-7人', category: 'card', icon: '🂡' },
  { id: 'zhajinhua', name: 'Zha Jin Hua', nameCn: '炸金花', desc: '经典炸金花', players: '2-6人', category: 'card', icon: '🔥' },
  { id: 'niuniu', name: 'Niu Niu', nameCn: '牛牛', desc: '经典牛牛', players: '2-6人', category: 'card', icon: '🐂' },
  { id: 'guandan', name: 'Guan Dan', nameCn: '掼蛋', desc: '江苏掼蛋', players: '4人', category: 'card', icon: '🎴' },
  { id: 'shengji', name: 'Sheng Ji', nameCn: '升级', desc: '四人升级', players: '4人', category: 'card', icon: '⬆️' },
  { id: 'sanshui', name: 'Shi San Shui', nameCn: '十三水', desc: '经典十三水', players: '2-4人', category: 'card', icon: '💧' },
  { id: 'paodekuai', name: 'Pao De Kuai', nameCn: '跑得快', desc: '经典跑得快', players: '2-5人', category: 'card', icon: '🏃' },
  { id: 'showhand', name: 'Show Hand', nameCn: '梭哈', desc: '经典梭哈', players: '2-5人', category: 'card', icon: '💎' },
  { id: 'xiangqi', name: 'Chinese Chess', nameCn: '中国象棋', desc: '经典中国象棋', players: '2人', category: 'board', icon: '♚' },
  { id: 'go', name: 'Go', nameCn: '围棋', desc: '经典围棋', players: '2人', category: 'board', icon: '⚫' },
  { id: 'gomoku', name: 'Gomoku', nameCn: '五子棋', desc: '经典五子棋', players: '2人', category: 'board', icon: '⭕' },
  { id: 'chess', name: 'Chess', nameCn: '国际象棋', desc: '经典国际象棋', players: '2人', category: 'board', icon: '♞' },
  { id: 'othello', name: 'Othello', nameCn: '黑白棋', desc: '经典黑白棋', players: '2人', category: 'board', icon: '🔵' },
  { id: 'flyingchess', name: 'Flying Chess', nameCn: '飞行棋', desc: '经典飞行棋', players: '2-4人', category: 'board', icon: '✈️' },
  { id: 'jungli', name: 'Jungle', nameCn: '军棋', desc: '经典军棋', players: '2人', category: 'board', icon: '🎖️' },
  { id: 'checkers', name: 'Checkers', nameCn: '跳棋', desc: '经典跳棋', players: '2-6人', category: 'board', icon: '🔴' },
  { id: 'tetris', name: 'Tetris', nameCn: '俄罗斯方块', desc: '经典俄罗斯方块', players: '1人', category: 'arcade', icon: '🧱' },
  { id: 'tank', name: 'Tank Battle', nameCn: '坦克大战', desc: '经典坦克大战', players: '1-2人', category: 'arcade', icon: '🔫' },
  { id: 'pacman', name: 'Pac-Man', nameCn: '吃豆人', desc: '经典吃豆人', players: '1人', category: 'arcade', icon: '😮' },
  { id: 'puzzlebobble', name: 'Puzzle Bobble', nameCn: '泡泡龙', desc: '经典泡泡龙', players: '1-2人', category: 'arcade', icon: '🫧' },
  { id: 'strikers1945', name: 'Strikers 1945', nameCn: '打击者1945', desc: '经典纵版射击', players: '1-2人', category: 'arcade', icon: '🛩️' },
  { id: 'gravitysnake', name: 'Gravity Snake', nameCn: '重力贪吃蛇', desc: '旋转手机控制贪吃蛇', players: '1人', category: 'arcade', icon: '🐍' },
  { id: 'pinball', name: 'Finger Pinball', nameCn: '指尖弹球', desc: '画线让球弹到终点', players: '1人', category: 'arcade', icon: '🎱' },
  { id: 'sichuanmahjong', name: 'Sichuan Mahjong', nameCn: '四川血战到底', desc: '四川血战麻将', players: '4人', category: 'mahjong', icon: '🀄' },
  { id: 'riichimahjong', name: 'Riichi Mahjong', nameCn: '日本立直麻将', desc: '日本立直麻将', players: '4人', category: 'mahjong', icon: '🎋' },
]
