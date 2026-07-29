import React, { useState, useEffect } from 'react';
import { CardFace } from '../../assets/svg/CardFace';
import { initGame, dealCards, playCards, aiPlay, cardKey } from './doudizhuEngine';
import type { DdzState } from './doudizhuEngine';
import type { Card } from '../../types';

const DdzCard: React.FC<{ card: Card; size?: number; onClick?: () => void; selected?: boolean }> =
  ({ card, size = 70, onClick, selected }) => (
    <CardFace suit={card.suit} rank={card.rank} size={size} onClick={onClick} selected={selected} />
  );

export const DouDiZhu: React.FC = () => {
  const [state, setState] = useState<DdzState>(initGame());
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const player = state.players[0];
  const ai1 = state.players[1];
  const ai2 = state.players[2];

  // AI turn
  useEffect(() => {
    if (state.phase !== 'playing') return;
    if (state.currentPlayer === 0) return;

    const timer = setTimeout(() => {
      const cp = state.currentPlayer;
      const hand = state.players[cp].cards;
      const isFree = !state.lastPlayCardIds || state.lastPlayCardIds.length === 0;
      const result = aiPlay(hand, state.lastPlayType, state.lastPlayRank, isFree);
      if (result && result.length > 0) {
        const ids = result.map(cardKey);
        const newState = playCards(state, cp, ids);
        if (newState) setState(newState);
      } else {
        // Pass
        const newState = playCards(state, cp, []);
        if (newState) setState(newState);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [state]);

  const handleBid = (bid: boolean) => {
    if (bid) {
      setState(dealCards(state, 0));
      setSelected(new Set());
    } else {
      // Simple AI bidding
      const ai1Bid = Math.random() < 0.4;
      const ai2Bid = !ai1Bid && Math.random() < 0.5;

      if (ai1Bid) {
        setState(dealCards(state, 1));
      } else if (ai2Bid) {
        setState(dealCards(state, 2));
      } else {
        // Force you as landlord
        setState(dealCards(state, 0));
      }
      setSelected(new Set());
    }
  };

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
    const ids = [...selected];
    const newState = playCards(state, 0, ids);
    if (newState) {
      setState(newState);
      setSelected(new Set());
    }
  };

  const handlePass = () => {
    if (state.currentPlayer !== 0 || state.phase !== 'playing') return;
    if (!state.lastPlayCardIds || state.lastPlayCardIds.length === 0) return;
    const newState = playCards(state, 0, []);
    if (newState) {
      setState(newState);
      setSelected(new Set());
    }
  };

  const handleRestart = () => {
    setState(initGame());
    setSelected(new Set());
  };

  return (
    <div className="game-container doudizhu-bg">
      <div className="game-header">
        <h2>🃏 斗地主</h2>
        <button className="btn-restart" onClick={handleRestart}>重新开始</button>
      </div>

      {state.message && <div className="game-message">{state.message}</div>}

      <div className="ddz-table">
        {/* AI 2 (left) */}
        <div className={`ddz-player ddz-left ${state.currentPlayer === 2 ? 'active' : ''}`}>
          <div className="player-info">
            <span className="player-name">{ai2.name}</span>
            {ai2.isLandlord && <span className="landlord-badge">地主</span>}
          </div>
          <div className="card-count">🂠 ×{ai2.cards.length}</div>
        </div>

        {/* Center */}
        <div className="ddz-center">
          {state.phase === 'bidding' && (
            <div className="bid-area">
              <button className="btn-bid" onClick={() => handleBid(true)}>叫地主</button>
              <button className="btn-bid btn-pass" onClick={() => handleBid(false)}>不叫</button>
            </div>
          )}
          {state.lastPlayCardIds && state.lastPlayCardIds.length > 0 && (
            <div className="played-info">
              上一手: {state.players[state.lastPlayPlayer]?.name} 出了 {state.lastPlayCardIds.length} 张
            </div>
          )}
        </div>

        {/* AI 1 (right) */}
        <div className={`ddz-player ddz-right ${state.currentPlayer === 1 ? 'active' : ''}`}>
          <div className="player-info">
            <span className="player-name">{ai1.name}</span>
            {ai1.isLandlord && <span className="landlord-badge">地主</span>}
          </div>
          <div className="card-count">🂠 ×{ai1.cards.length}</div>
        </div>
      </div>

      {/* Player's hand */}
      {state.phase === 'playing' && (
        <div className="player-hand">
          <div className="player-info-bottom">
            <span className="player-name">{player.name}</span>
            {player.isLandlord && <span className="landlord-badge">地主</span>}
            <span className="card-count">剩余 {player.cards.length} 张</span>
            {state.currentPlayer === 0 && <span className="turn-indicator">轮到你</span>}
          </div>
          <div className="cards-row">
            {player.cards.map((c) => (
              <DdzCard
                key={cardKey(c)}
                card={c}
                size={70}
                onClick={() => toggleCard(c)}
                selected={selected.has(cardKey(c))}
              />
            ))}
          </div>
          <div className="action-buttons">
            <button className="btn-play" onClick={handlePlay} disabled={selected.size === 0}>
              出牌 ({selected.size}张)
            </button>
            <button className="btn-pass" onClick={handlePass}
              disabled={!state.lastPlayCardIds || state.lastPlayCardIds.length === 0}>
              不出
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
