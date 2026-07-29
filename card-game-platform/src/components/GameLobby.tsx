import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GameInfo } from '../types';
import { MultiplayerLobby } from './MultiplayerLobby';
import { LoginModal } from './LoginModal';
import { useUser } from '../context/UserContext';
import '../styles/lobby.css';

const GAME_COST: Record<string, number> = {
  blackjack: 20, niuniu: 20, zhajinhua: 20, suoha: 30,
  doudizhu: 10, texas: 30, guandan: 15, shengji: 15,
  shisanshui: 15, paodekuai: 10,
};

const GAMES: GameInfo[] = [
  { id: 'doudizhu', name: 'Dou Di Zhu', nameCN: '斗地主', description: '经典三人扑克牌游戏', players: '1-3人', icon: '🃏' },
  { id: 'texas', name: 'Texas Hold\'em', nameCN: '德州扑克', description: '最受欢迎的扑克变体', players: '1-9人', icon: '♠️' },
  { id: 'chess', name: 'Chinese Chess', nameCN: '中国象棋', description: '传统策略棋盘游戏', players: '1-2人', icon: '🐴' },
  { id: 'go', name: 'Go (Weiqi)', nameCN: '围棋', description: '古老策略棋盘游戏', players: '1-2人', icon: '⚫' },
  { id: 'mahjong', name: 'Hong Zhong Lai Zi Gang', nameCN: '红中赖子杠', description: '武汉特色麻将玩法', players: '1-4人', icon: '🀄' },
  { id: 'gomoku', name: 'Gomoku', nameCN: '五子棋', description: '简洁策略连线游戏', players: '1-2人', icon: '⚫' },
  { id: 'blackjack', name: 'Blackjack', nameCN: '21点', description: '经典赌场扑克游戏', players: '1人', icon: '🃏' },
  { id: 'zhajinhua', name: 'Zha Jin Hua', nameCN: '炸金花', description: '流行扑克赌博玩法', players: '1-4人', icon: '♣️' },
  { id: 'niuniu', name: 'Niu Niu', nameCN: '牛牛', description: '快节奏五人牛牛', players: '1-3人', icon: '🐂' },
  { id: 'ludo', name: 'Ludo', nameCN: '飞行棋', description: '经典掷骰子棋类', players: '1-4人', icon: '🎲' },
  { id: 'intlchess', name: 'International Chess', nameCN: '国际象棋', description: '世界经典策略棋盘', players: '1-2人', icon: '♔' },
  { id: 'othello', name: 'Othello', nameCN: '黑白棋', description: '翻转棋子策略游戏', players: '1-2人', icon: '⚫' },
  { id: 'tetris', name: 'Tetris', nameCN: '俄罗斯方块', description: '经典消除益智游戏', players: '1-2人', icon: '🧱' },
  { id: 'tankbattle', name: 'Battle City', nameCN: '坦克大战', description: '经典FC坦克射击游戏', players: '1-2人', icon: '🚜' },
  { id: 'pacman', name: 'Pac-Man', nameCN: '吃豆人', description: '经典街机迷宫游戏', players: '1人', icon: '👻' },
  { id: 'puzzlebobble', name: 'Puzzle Bobble', nameCN: '泡泡龙', description: '经典射击消除游戏', players: '1-2人', icon: '🫧' },
  { id: 'strikers1945', name: 'Strikers 1945', nameCN: 'Strikers 1945', description: '经典街机弹幕射击', players: '1人', icon: '✈️' },
  { id: 'guandan', name: 'Guandan', nameCN: '掼蛋', description: '流行4人2v2升级扑克', players: '1-4人', icon: '🥚' },
  { id: 'shengji', name: 'Sheng Ji', nameCN: '升级/拖拉机', description: '经典4人升级扑克游戏', players: '1-4人', icon: '🚜' },
  { id: 'shisanshui', name: '13 Cards', nameCN: '十三水', description: '13张牌摆三道比大小', players: '1-3人', icon: '💧' },
  { id: 'paodekuai', name: 'Speed', nameCN: '跑得快', description: '谁先出完谁赢', players: '1-3人', icon: '🏃' },
  { id: 'suoha', name: 'ShowHand', nameCN: '梭哈', description: '五张牌暗注明注比牌', players: '1-3人', icon: '💰' },
  { id: 'junqi', name: 'Military Chess', nameCN: '军棋', description: '暗棋军阶对抗夺军旗', players: '1-2人', icon: '🎖️' },
  { id: 'tiaoqi', name: 'Chinese Checkers', nameCN: '跳棋', description: '六角棋盘搭桥跳子', players: '1-2人', icon: '⭐' },
  { id: 'scmj', name: 'Sichuan Mahjong', nameCN: '四川血战到底', description: '缺一门刮风下雨查叫', players: '1-4人', icon: '🀄' },
  { id: 'riichimahjong', name: 'Riichi Mahjong', nameCN: '日本立直麻将', description: '立直一发宝牌役种', players: '1-4人', icon: '🀄' },
];

export const GameLobby: React.FC = () => {
  const [showMultiplayer, setShowMultiplayer] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const navigate = useNavigate();
  const { user, isLoggedIn, logout, spendCoins } = useUser();

  const handleGameStart = async (gameId: string) => {
    const cost = GAME_COST[gameId] || 0;
    if (cost > 0) {
      const ok = await spendCoins(cost, `进入${gameId}`);
      if (!ok) { alert('金币不足！请充值或选择免费游戏'); return; }
    }
    navigate(`/game/${gameId}`);
  };

  if (showMultiplayer) {
    return (
      <MultiplayerLobby
        onBack={() => setShowMultiplayer(false)}
        onStartGame={(gameType, roomId, isHost) => {
          navigate(`/game/${gameType}?room=${roomId}&host=${isHost}`);
        }}
      />
    );
  }

  return (
    <div className="lobby">
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}

      {/* User bar */}
      <div style={{
        position: 'fixed', top: 0, right: 0, padding: '8px 16px',
        display: 'flex', alignItems: 'center', gap: 12, zIndex: 100,
      }}>
        {isLoggedIn ? (
          <>
            <span style={{ color: '#e9c46a', fontSize: 14 }}>{user?.username}</span>
            <span style={{
              background: 'linear-gradient(135deg, #f4a261, #e9c46a)',
              padding: '4px 12px', borderRadius: 12, fontSize: 14, fontWeight: 700, color: '#1a1a2e',
            }}>
              🪙 {user?.coins.toLocaleString()}
            </span>
            <button onClick={logout} style={{
              background: 'transparent', color: '#888', border: '1px solid #555',
              padding: '2px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
            }}>退出</button>
          </>
        ) : (
          <button onClick={() => setShowLogin(true)} style={{
            background: 'linear-gradient(135deg, #e9c46a, #f4a261)',
            color: '#1a1a2e', border: 'none', padding: '6px 16px', borderRadius: 8,
            fontWeight: 700, cursor: 'pointer',
          }}>
            登录 / 注册
          </button>
        )}
      </div>

      <h1>棋牌游戏平台</h1>
      <p className="subtitle">选择一款游戏，开始你的对局</p>

      <div className="mode-select">
        <button className="btn-mode btn-mode-active">单机模式</button>
        <button className="btn-mode" onClick={() => setShowMultiplayer(true)}>联机模式</button>
      </div>

      <div className="game-grid">
        {GAMES.map(game => {
          const cost = GAME_COST[game.id];
          return (
            <div key={game.id} onClick={() => handleGameStart(game.id)} className="game-card" style={{ cursor: 'pointer' }}>
              <div className="game-icon">{game.icon}</div>
              <h3>{game.nameCN}</h3>
              <div className="game-name-cn">{game.name}</div>
              <div className="game-desc">{game.description}</div>
              <div className="game-players">{game.players}{cost ? ` · ${cost}金币` : ' · 免费'}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
