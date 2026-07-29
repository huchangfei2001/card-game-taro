import React, { useState, useEffect } from 'react';
import { CardFace } from '../../assets/svg/CardFace';
import { initPaodekuai, playPdkCards, pdkAI } from './paodekuaiEngine';
import type { PdkState } from './paodekuaiEngine';
import type { Card } from '../../types';

const cardKey = (c: Card) => `${c.suit}-${c.rank}`;

export const Paodekuai: React.FC = () => {
  const [state, setState] = useState<PdkState>(initPaodekuai());
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const player = state.players[0];
  const aiLeft = state.players[1];
  const aiRight = state.players[2];

  useEffect(() => {
    if (state.phase !== 'playing' || state.currentPlayer === 0) return;
    const timer = setTimeout(() => {
      const cp = state.currentPlayer;
      const result = pdkAI(state, cp);
      const newState = playPdkCards(state, result.cards, result.pass);
      if (newState) setState(newState);
    }, 700);
    return () => clearTimeout(timer);
  }, [state]);

  const cardVal = (c: Card) => c.rank === 2 ? 15 : c.rank === 1 ? 14 : c.rank;

  const sortedHand = [...player.cards].sort((a, b) => cardVal(b) - cardVal(a));

  const toggleCard = (c: Card) => {
    if (state.currentPlayer !== 0 || state.phase !== 'playing') return;
    setSelected(prev => {
      const n = new Set(prev);
      const k = cardKey(c);
      if (n.has(k)) n.delete(k); else n.add(k);
      return n;
    });
  };

  const handlePlay = () => {
    if (state.currentPlayer !== 0 || state.phase !== 'playing' || selected.size === 0) return;
    const cardKeys = [...selected];
    const cards = player.cards.filter(c => cardKeys.includes(cardKey(c)));
    const newState = playPdkCards(state, cards, false);
    if (newState) {
      setState(newState);
      setSelected(new Set());
    }
  };

  const handlePass = () => {
    if (state.currentPlayer !== 0 || state.phase !== 'playing') return;
    const newState = playPdkCards(state, [], true);
    if (newState) {
      setState(newState);
      setSelected(new Set());
    }
  };

  const handleRestart = () => {
    setState(initPaodekuai());
    setSelected(new Set());
  };

  return (
    <div className="game-container texas-bg">
      <div className="game-header">
        <h2>🃏 跑得快</h2>
        <button className="btn-restart" onClick={handleRestart}>重新开始</button>
      </div>

      {state.message && <div className="game-message">{state.message}</div>}

      <div className="texas-opponents" style={{ justifyContent: 'center' }}>
        {/* AI Left */}
        <div className={`texas-opponent ${state.currentPlayer === 1 ? 'active' : ''}`}>
          <div className="opponent-name">{aiLeft.name}</div>
          <div className="opponent-chips">🂠 ×{aiLeft.cards.length}</div>
        </div>

        {/* Center info */}
        <div style={{ flex: 1, maxWidth: 280, textAlign: 'center' }}>
          {state.lastPlay && state.lastPlay.cards.length > 0 && (
            <div className="played-info" style={{ fontSize: 12 }}>
              {state.players[state.lastPlay.playerId]?.name} 出 {state.lastPlay.type} ({state.lastPlay.rank === 1 ? 'A' : state.lastPlay.rank === 11 ? 'J' : state.lastPlay.rank === 12 ? 'Q' : state.lastPlay.rank === 13 ? 'K' : state.lastPlay.rank === 15 ? '2' : state.lastPlay.rank})
              <div style={{ display: 'flex', gap: 2, justifyContent: 'center', marginTop: 4 }}>
                {state.lastPlay.cards.slice(0, 8).map((c, i) => (
                  <CardFace key={i} suit={c.suit} rank={c.rank} size={36} />
                ))}
              </div>
            </div>
          )}
          {state.lastPlay && state.lastPlay.cards.length === 0 && (
            <div className="played-info" style={{ fontSize: 12 }}>
              新一轮，自由出牌
            </div>
          )}
          <div style={{ color: '#a09080', fontSize: 11, marginTop: 4 }}>
            过牌人数: {state.passCount}/2
          </div>
        </div>

        {/* AI Right */}
        <div className={`texas-opponent ${state.currentPlayer === 2 ? 'active' : ''}`}>
          <div className="opponent-name">{aiRight.name}</div>
          <div className="opponent-chips">🂠 ×{aiRight.cards.length}</div>
        </div>
      </div>

      {state.phase === 'playing' && (
        <div className="player-hand">
          <div className="player-info-bottom">
            <span className="player-name">{player.name}</span>
            <span className="card-count">剩余 {player.cards.length} 张</span>
            {state.currentPlayer === 0 && <span className="turn-indicator">轮到你</span>}
          </div>
          <div className="cards-row">
            {sortedHand.map((c) => (
              <CardFace key={cardKey(c)} suit={c.suit} rank={c.rank} size={52}
                onClick={() => toggleCard(c)} selected={selected.has(cardKey(c))} />
            ))}
          </div>
          <div className="action-buttons">
            <button className="btn-play" onClick={handlePlay} disabled={selected.size === 0}>
              出牌 ({selected.size}张)
            </button>
            <button className="btn-pass" onClick={handlePass}>
              过
            </button>
          </div>
        </div>
      )}

      {state.phase === 'finished' && (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <div className="game-message" style={{ fontSize: 20 }}>
            {state.winner !== null ? `${state.players[state.winner].name} 获胜！` : '游戏结束'}
          </div>
          <button className="btn-restart" onClick={handleRestart} style={{ marginTop: 12 }}>
            再来一局
          </button>
        </div>
      )}
    </div>
  );
};
