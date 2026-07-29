import React, { useState } from 'react';
import { useSocket } from '../hooks/useSocket';

interface MultiplayerLobbyProps {
  onStartGame: (gameType: string, roomId: string, isHost: boolean) => void;
  onBack: () => void;
}

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({ onStartGame, onBack }) => {
  const { connected, roomId, players, error, createRoom, joinRoom } = useSocket();
  const [name, setName] = useState('玩家');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [gameType, setGameType] = useState('doudizhu');
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');

  const handleCreate = () => {
    createRoom(gameType, name);
    setMode('create');
  };

  const handleJoin = () => {
    if (joinRoomId.trim()) {
      joinRoom(joinRoomId.trim().toUpperCase(), name);
    }
  };

  if (mode === 'select') {
    return (
      <div className="multiplayer-lobby">
        <h2>联机对战</h2>
        <p className="subtitle">与好友一起游戏</p>

        <div className="mp-status">
          服务器: {connected ? <span style={{ color: '#2a9d8f' }}>已连接</span> : <span style={{ color: '#e63946' }}>连接中...</span>}
        </div>

        <div className="mp-form">
          <label>你的昵称</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="输入昵称" />

          <label>选择游戏</label>
          <select value={gameType} onChange={e => setGameType(e.target.value)}>
            <option value="doudizhu">斗地主</option>
            <option value="texas">德州扑克</option>
            <option value="chess">中国象棋</option>
            <option value="go">围棋</option>
            <option value="mahjong">红中赖子杠</option>
            <option value="gomoku">五子棋</option>
            <option value="intlchess">国际象棋</option>
            <option value="othello">黑白棋</option>
            <option value="guandan">掼蛋</option>
            <option value="shengji">升级</option>
            <option value="shisanshui">十三水</option>
            <option value="paodekuai">跑得快</option>
            <option value="suoha">梭哈</option>
            <option value="junqi">军棋</option>
            <option value="tiaoqi">跳棋</option>
            <option value="tetris">俄罗斯方块</option>
            <option value="tankbattle">坦克大战</option>
          </select>

          <div className="mp-buttons">
            <button className="btn-mp" onClick={handleCreate} disabled={!connected}>创建房间</button>
            <button className="btn-mp btn-secondary" onClick={() => setMode('join')}>加入房间</button>
            <button className="btn-mp btn-back" onClick={onBack}>返回</button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'create' && roomId) {
    return (
      <div className="multiplayer-lobby">
        <h2>房间已创建</h2>
        <div className="room-info">
          <div className="room-id">房间号: <strong>{roomId}</strong></div>
          <div className="copy-hint">将房间号发送给好友</div>
        </div>
        <div className="player-list">
          <h4>玩家列表 ({players.length})</h4>
          {players.map((p, i) => (
            <div key={i} className="player-item">{p.name}</div>
          ))}
        </div>
        {error && <div className="mp-error">{error}</div>}
        <div className="mp-buttons">
          <button className="btn-mp" onClick={() => onStartGame(gameType, roomId, true)}>
            开始游戏
          </button>
          <button className="btn-mp btn-back" onClick={onBack}>返回</button>
        </div>
      </div>
    );
  }

  if (mode === 'join') {
    return (
      <div className="multiplayer-lobby">
        <h2>加入房间</h2>
        <div className="mp-form">
          <label>你的昵称</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="输入昵称" />

          <label>房间号</label>
          <input value={joinRoomId} onChange={e => setJoinRoomId(e.target.value.toUpperCase())}
            placeholder="输入6位房间号" maxLength={6} />

          {error && <div className="mp-error">{error}</div>}

          <div className="mp-buttons">
            <button className="btn-mp" onClick={handleJoin} disabled={!connected || joinRoomId.length < 4}>
              加入
            </button>
            <button className="btn-mp btn-back" onClick={() => setMode('select')}>返回</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="multiplayer-lobby">
      <p>等待连接...</p>
      <button className="btn-mp btn-back" onClick={onBack}>返回</button>
    </div>
  );
};
