import React, { useState, useEffect } from 'react';
import { CardFace } from '../../assets/svg/CardFace';
import { initShengji, bidTrump, buryCards, shengjiAI } from './shengjiEngine';
import type { SjState } from './shengjiEngine';
import type { Card } from '../../types';

const cardKey = (c: Card) => `${c.suit}-${c.rank}`;

const SUIT_LABELS: Record<string, string> = { spades: '♠ 黑桃', hearts: '♥ 红桃', diamonds: '♦ 方块', clubs: '♣ 梅花', none: '无主' };

export const Shengji: React.FC = () => {
  const [state, setState] = useState<SjState>(initShengji());
  const [selectedForBury, setSelectedForBury] = useState<Set<string>>(new Set());
  const [selectedToPlay, setSelectedToPlay] = useState<Set<string>>(new Set());

  const player = state.players[0];
  const teammate = state.players[2];
  const leftOpp = state.players[3];
  const rightOpp = state.players[1];

  const sortedHand = [...player.cards].sort((a, b) => {
    const va = a.rank === 1 ? 14 : a.rank;
    const vb = b.rank === 1 ? 14 : b.rank;
    return vb - va;
  });

  useEffect(() => {
    if (state.phase === 'finished') return;
    if (state.currentPlayer === 0) return;

    const timer = setTimeout(() => {
      const cp = state.currentPlayer;
      const result = shengjiAI(state, cp);

      if (state.phase === 'bidding') {
        if (result.action === 'bid' && result.suit) {
          const newState = bidTrump(state, result.suit);
          setState(newState);
        }
      } else if (state.phase === 'playing') {
        if (result.action === 'play' && result.cards.length > 0) {
          const players = state.players.map(p => ({ ...p, cards: [...p.cards] }));
          const cardSet = new Set(result.cards.map(cardKey));
          players[cp].cards = players[cp].cards.filter(c => !cardSet.has(cardKey(c)));
          const next = (state.currentPlayer + 1) % 4;
          const trick = [...state.trick, { playerId: cp, card: result.cards[0] }];
          const trickCount = state.trickCount + (trick.length < 4 ? 0 : 1);
          setState({
            ...state, players, currentPlayer: next, trick,
            trickCount, message: `${state.players[cp].name} 出牌`,
          });
        }
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [state]);

  const handleBid = (suit: Card['suit'] | 'none') => {
    if (state.phase !== 'bidding' || state.currentPlayer !== 0) return;
    setState(bidTrump(state, suit));
  };

  const toggleBuryCard = (c: Card) => {
    if (state.phase !== 'burying') return;
    setSelectedForBury(prev => {
      const n = new Set(prev);
      const k = cardKey(c);
      if (n.has(k)) n.delete(k); else if (n.size < 8) n.add(k);
      return n;
    });
  };

  const handleBury = () => {
    if (state.phase !== 'burying' || selectedForBury.size !== 8) return;
    const cards = player.cards.filter(c => selectedForBury.has(cardKey(c)));
    setState(buryCards(state, cards));
    setSelectedForBury(new Set());
  };

  const cancelBury = () => {
    setSelectedForBury(new Set());
  };

  const togglePlayCard = (c: Card) => {
    if (state.currentPlayer !== 0 || state.phase !== 'playing') return;
    setSelectedToPlay(prev => {
      const n = new Set(prev);
      const k = cardKey(c);
      if (n.has(k)) n.delete(k); else n.add(k);
      return n;
    });
  };

  const handlePlayCard = () => {
    if (state.currentPlayer !== 0 || state.phase !== 'playing' || selectedToPlay.size === 0) return;
    const cards = player.cards.filter(c => selectedToPlay.has(cardKey(c)));
    const next = (state.currentPlayer + 1) % 4;
    const players = state.players.map(p => ({ ...p, cards: [...p.cards] }));
    const cardSet = new Set(cards.map(cardKey));
    players[0].cards = players[0].cards.filter(c => !cardSet.has(cardKey(c)));
    const trick = [...state.trick, { playerId: 0, card: cards[0] }];
    setState({ ...state, players, currentPlayer: next, trick, message: '你出牌' });
    setSelectedToPlay(new Set());
  };

  const handleRestart = () => {
    setState(initShengji());
    setSelectedForBury(new Set());
    setSelectedToPlay(new Set());
  };

  return (
    <div className="game-container texas-bg">
      <div className="game-header">
        <h2>🃏 升级</h2>
        <button className="btn-restart" onClick={handleRestart}>重新开始</button>
      </div>

      {state.message && <div className="game-message">{state.message}</div>}

      <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginBottom: 10, flexWrap: 'wrap' }}>
        <span style={{ color: '#e9c46a', fontSize: 13 }}>级别: {state.currentLevel === 11 ? 'J' : state.currentLevel === 12 ? 'Q' : state.currentLevel === 13 ? 'K' : state.currentLevel === 14 ? 'A' : state.currentLevel}</span>
        <span style={{ color: '#a09080', fontSize: 13 }}>|</span>
        <span style={{ color: '#e9c46a', fontSize: 13 }}>主牌: {SUIT_LABELS[state.trump]}</span>
        <span style={{ color: '#a09080', fontSize: 13 }}>|</span>
        <span style={{ color: '#27ae60', fontSize: 13 }}>攻方: {state.teamScores[1]}分</span>
        <span style={{ color: '#a09080', fontSize: 13 }}>|</span>
        <span style={{ color: '#2980b9', fontSize: 13 }}>守方: {state.teamScores[0]}分</span>
      </div>

      <div className="ddz-table">
        <div className={`ddz-player ddz-left ${state.currentPlayer === 3 ? 'active' : ''}`}>
          <div className="player-info">
            <span className="player-name">{leftOpp.name}</span>
          </div>
          <div className="card-count">🂠 ×{leftOpp.cards.length}</div>
        </div>

        <div className="ddz-center" style={{ flexDirection: 'column', gap: 8 }}>
          <div className={`ddz-player ${state.currentPlayer === 2 ? 'active' : ''}`} style={{ width: 160, margin: '0 auto' }}>
            <div className="player-info">
              <span className="player-name">{teammate.name}</span>
            </div>
            <div className="card-count">🂠 ×{teammate.cards.length}</div>
          </div>

          {state.phase === 'bidding' && (
            <div className="bid-area" style={{ flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ color: '#e9c46a', fontSize: 15, fontWeight: 700 }}>选择主牌花色</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['spades', 'hearts', 'diamonds', 'clubs', 'none'] as const).map(s => (
                  <button key={s} className="btn-bid" style={{ fontSize: 13, padding: '8px 14px' }} onClick={() => handleBid(s)}>
                    {SUIT_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {state.phase === 'burying' && (
            <div className="played-info">
              <div>埋底牌 (选8张)</div>
              <div style={{ display: 'flex', gap: 2, justifyContent: 'center', marginTop: 6, flexWrap: 'wrap' }}>
                {state.bottom.length > 0 ? state.bottom.map((c, i) => (
                  <CardFace key={i} suit={c.suit} rank={c.rank} size={36} />
                )) : player.cards.slice(0, 8).map((c, i) => (
                  <CardFace key={i} suit={c.suit} rank={c.rank} size={36} onClick={() => toggleBuryCard(c)}
                    selected={selectedForBury.has(cardKey(c))} />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
                <button className="btn-play" style={{ fontSize: 13, padding: '6px 18px' }} onClick={handleBury} disabled={selectedForBury.size !== 8}>
                  埋牌 ({selectedForBury.size}/8)
                </button>
                <button className="btn-pass" onClick={cancelBury}>取消</button>
              </div>
            </div>
          )}

          {state.trick.length > 0 && (
            <div className="played-info" style={{ fontSize: 12 }}>
              当前回合: {state.trick.map(t => {
                const p = state.players[t.playerId];
                return `${p.name}: ${t.card.rank === 1 ? 'A' : t.card.rank === 11 ? 'J' : t.card.rank === 12 ? 'Q' : t.card.rank === 13 ? 'K' : t.card.rank}`;
              }).join(' | ')}
            </div>
          )}
        </div>

        <div className={`ddz-player ddz-right ${state.currentPlayer === 1 ? 'active' : ''}`}>
          <div className="player-info">
            <span className="player-name">{rightOpp.name}</span>
          </div>
          <div className="card-count">🂠 ×{rightOpp.cards.length}</div>
        </div>
      </div>

      {state.phase === 'burying' && (
        <div className="player-hand">
          <div className="player-info-bottom">
            <span className="player-name">{player.name}</span>
            <span className="card-count">选择8张埋入底牌: {selectedForBury.size}/8</span>
          </div>
          <div className="cards-row">
            {sortedHand.map((c) => (
              <CardFace key={cardKey(c)} suit={c.suit} rank={c.rank} size={48}
                onClick={() => toggleBuryCard(c)}
                selected={selectedForBury.has(cardKey(c))} />
            ))}
          </div>
        </div>
      )}

      {state.phase === 'playing' && (
        <div className="player-hand">
          <div className="player-info-bottom">
            <span className="player-name">{player.name}</span>
            <span className="card-count">剩余 {player.cards.length} 张</span>
            {state.currentPlayer === 0 && <span className="turn-indicator">轮到你</span>}
          </div>
          <div className="cards-row">
            {sortedHand.map((c) => (
              <CardFace key={cardKey(c)} suit={c.suit} rank={c.rank} size={48}
                onClick={() => togglePlayCard(c)}
                selected={selectedToPlay.has(cardKey(c))} />
            ))}
          </div>
          <div className="action-buttons">
            <button className="btn-play" onClick={handlePlayCard} disabled={selectedToPlay.size === 0}>
              出牌
            </button>
          </div>
        </div>
      )}

      {state.phase === 'finished' && (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <div className="game-message" style={{ fontSize: 18 }}>
            游戏结束！
          </div>
          <button className="btn-restart" onClick={handleRestart} style={{ marginTop: 12 }}>
            再来一局
          </button>
        </div>
      )}
    </div>
  );
};
