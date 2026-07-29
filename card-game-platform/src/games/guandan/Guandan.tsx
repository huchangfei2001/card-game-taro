import React, { useState, useEffect } from 'react';
import { CardFace } from '../../assets/svg/CardFace';
import { initGuandan, playGdCards, gdAI } from './guandanEngine';
import type { GdState } from './guandanEngine';
import type { Card } from '../../types';

const cardKey = (c: Card) => `${c.suit}-${c.rank}`;

export const Guandan: React.FC = () => {
  const [state, setState] = useState<GdState>(initGuandan());
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const player = state.players[0];
  const teammate = state.players[2];
  const leftOpp = state.players[3];
  const rightOpp = state.players[1];

  useEffect(() => {
    if (state.phase !== 'playing' || state.currentPlayer === 0) return;
    const timer = setTimeout(() => {
      const cp = state.currentPlayer;
      const aiCards = gdAI(state, cp);
      const newState = playGdCards(state, cp, aiCards);
      if (newState) setState(newState);
    }, 800);
    return () => clearTimeout(timer);
  }, [state]);

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
    const newState = playGdCards(state, 0, cards);
    if (newState) {
      setState(newState);
      setSelected(new Set());
    }
  };

  const handlePass = () => {
    if (state.currentPlayer !== 0 || state.phase !== 'playing') return;
    const newState = playGdCards(state, 0, []);
    if (newState) {
      setState(newState);
      setSelected(new Set());
    }
  };

  const handleRestart = () => {
    setState(initGuandan());
    setSelected(new Set());
  };

  const sortedHand = [...player.cards].sort((a, b) => {
    const va = a.rank === 17 ? 18 : a.rank === 16 ? 17 : a.rank === state.level ? 16 : a.rank === 15 ? 15 : a.rank;
    const vb = b.rank === 17 ? 18 : b.rank === 16 ? 17 : b.rank === state.level ? 16 : b.rank === 15 ? 15 : b.rank;
    return vb - va;
  });

  const team0 = state.players.filter(p => p.team === 0).map(p => p.name).join(' & ');

  return (
    <div className="game-container texas-bg">
      <div className="game-header">
        <h2>🃏 掼蛋</h2>
        <button className="btn-restart" onClick={handleRestart}>重新开始</button>
      </div>

      {state.message && <div className="game-message">{state.message}</div>}

      <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ color: '#e9c46a', fontSize: 13 }}>级牌: {state.level === 11 ? 'J' : state.level === 12 ? 'Q' : state.level === 13 ? 'K' : state.level === 14 ? 'A' : state.level}</span>
        <span style={{ color: '#a09080', fontSize: 13 }}>|</span>
        <span style={{ color: '#e9c46a', fontSize: 13 }}>队友: {team0}</span>
      </div>

      <div className="ddz-table">
        {/* Left opponent */}
        <div className={`ddz-player ddz-left ${state.currentPlayer === 3 ? 'active' : ''}`}>
          <div className="player-info">
            <span className="player-name">{leftOpp.name}</span>
            <span style={{ color: '#e74c3c', fontSize: 11 }}>对手</span>
          </div>
          <div className="card-count">🂠 ×{leftOpp.cards.length}</div>
        </div>

        {/* Center */}
        <div className="ddz-center" style={{ flexDirection: 'column', gap: 8 }}>
          {/* Teammate (top) */}
          <div className={`ddz-player ${state.currentPlayer === 2 ? 'active' : ''}`} style={{ width: 180, margin: '0 auto' }}>
            <div className="player-info">
              <span className="player-name">{teammate.name}</span>
              <span style={{ color: '#27ae60', fontSize: 11 }}>队友</span>
            </div>
            <div className="card-count">🂠 ×{teammate.cards.length}</div>
          </div>

          {state.lastPlay && state.lastPlay.cards.length > 0 && (
            <div className="played-info" style={{ fontSize: 12 }}>
              {state.players[state.lastPlay.playerId]?.name} 出 {state.lastPlay.type}
              <div style={{ display: 'flex', gap: 2, justifyContent: 'center', marginTop: 4 }}>
                {state.lastPlay.cards.slice(0, 8).map((c, i) => (
                  <CardFace key={i} suit={c.suit} rank={c.rank} size={36} />
                ))}
                {state.lastPlay.cards.length > 8 && <span style={{ color: '#a09080', fontSize: 11 }}>+{state.lastPlay.cards.length - 8}</span>}
              </div>
            </div>
          )}
          {state.lastPlay && state.lastPlay.cards.length === 0 && (
            <div className="played-info" style={{ fontSize: 12 }}>
              {state.players[state.lastPlay.playerId]?.name} 出 {state.lastPlay.type}
            </div>
          )}
        </div>

        {/* Right opponent */}
        <div className={`ddz-player ddz-right ${state.currentPlayer === 1 ? 'active' : ''}`}>
          <div className="player-info">
            <span className="player-name">{rightOpp.name}</span>
            <span style={{ color: '#e74c3c', fontSize: 11 }}>对手</span>
          </div>
          <div className="card-count">🂠 ×{rightOpp.cards.length}</div>
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
              <CardFace
                key={cardKey(c)}
                suit={c.suit} rank={c.rank} size={48}
                onClick={() => toggleCard(c)}
                selected={selected.has(cardKey(c))}
              />
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
            {state.winner !== null && `${state.players[state.winner].name} 获胜！`}
          </div>
          <button className="btn-restart" onClick={handleRestart} style={{ marginTop: 12 }}>
            再来一局
          </button>
        </div>
      )}
    </div>
  );
};
