import React, { useState, useEffect } from 'react';
import { CardFace } from '../../assets/svg/CardFace';
import { initSuoha, suohaBet, suohaAI } from './suohaEngine';
import type { ShState } from './suohaEngine';

export const Suoha: React.FC = () => {
  const [state, setState] = useState<ShState>(initSuoha());
  const [raiseAmount, setRaiseAmount] = useState(20);

  const player = state.players[0];
  const ai1 = state.players[1];
  const ai2 = state.players[2];

  useEffect(() => {
    if (state.phase === 'finished') return;
    if (state.currentPlayer === 0) return;
    const cp = state.currentPlayer;
    if (state.players[cp].folded) return;

    const timer = setTimeout(() => {
      const action = suohaAI(state, cp);
      const newState = suohaBet(state, action.action, action.amount);
      setState(newState);
    }, 700);
    return () => clearTimeout(timer);
  }, [state]);

  const handleAction = (action: 'fold' | 'call' | 'raise') => {
    if (state.currentPlayer !== 0 || state.phase !== 'betting') return;
    const newState = suohaBet(state, action, action === 'raise' ? raiseAmount : undefined);
    setState(newState);
  };

  const handleRestart = () => {
    setState(initSuoha());
    setRaiseAmount(20);
  };

  const toCall = state.currentBet - player.bet;
  const canRaise = player.chips > toCall;

  const renderPlayerCards = (p: typeof player, showHole: boolean) => (
    <div className={`texas-opponent ${state.currentPlayer === p.id ? 'active' : ''} ${p.folded ? 'folded' : ''}`}>
      <div className="opponent-name">
        {p.name}
        {p.id === 0 && <span style={{ color: '#e9c46a', fontSize: 11, marginLeft: 6 }}>(你)</span>}
      </div>
      <div className="opponent-chips">筹码: ${p.chips}</div>
      <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 4 }}>
        {p.holeCards.map((c, i) => (
          <CardFace key={`h-${i}`} suit={c.suit} rank={c.rank} size={40} faceDown={!showHole} />
        ))}
      </div>
      {p.faceCards.length > 0 && (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 4 }}>
          {p.faceCards.map((c, i) => (
            <CardFace key={`f-${i}`} suit={c.suit} rank={c.rank} size={40} />
          ))}
        </div>
      )}
      {p.totalBet > 0 && <div className="bet-amount">下注: ${p.totalBet}</div>}
      {p.folded && <div className="fold-label">弃牌</div>}
      {p.handType && state.phase === 'finished' && (
        <div style={{ fontSize: 11, color: '#27ae60', marginTop: 4 }}>{p.handType}</div>
      )}
    </div>
  );

  return (
    <div className="game-container texas-bg">
      <div className="game-header">
        <h2>🃏 梭哈</h2>
        <button className="btn-restart" onClick={handleRestart}>重新开始</button>
      </div>

      {state.message && <div className="game-message">{state.message}</div>}

      <div className="texas-opponents" style={{ justifyContent: 'center' }}>
        {renderPlayerCards(ai1, state.phase === 'finished')}

        <div className="community-area" style={{ maxWidth: 200 }}>
          <div className="pot-display" style={{ fontSize: 16 }}>
            底池: ${state.pot}
          </div>
          <div className="phase-label" style={{ fontSize: 12, color: '#a09080' }}>
            第{state.round}轮 | 下注额: ${state.currentBet}
          </div>
        </div>

        {renderPlayerCards(ai2, state.phase === 'finished')}
      </div>

      <div className="texas-player-area">
        <div className="player-info-row">
          <span className="player-name">你</span>
          <span className="player-chips">筹码: ${player.chips}</span>
        </div>
        <div className="player-pocket">
          {player.holeCards.map((c, i) => (
            <CardFace key={i} suit={c.suit} rank={c.rank} size={64} />
          ))}
          {player.faceCards.map((c, i) => (
            <CardFace key={`pf-${i}`} suit={c.suit} rank={c.rank} size={64} />
          ))}
        </div>
        {player.totalBet > 0 && <div className="bet-amount">总下注: ${player.totalBet}</div>}

        {state.currentPlayer === 0 && state.phase === 'betting' && (
          <div className="texas-actions" style={{ marginTop: 10 }}>
            <button className="btn-texas btn-fold" onClick={() => handleAction('fold')}>弃牌</button>
            <button className="btn-texas btn-call" onClick={() => handleAction('call')}>
              跟注 ${toCall}
            </button>
            {canRaise && (
              <div className="raise-group">
                <input type="range"
                  min={state.currentBet * 2}
                  max={player.chips + player.bet}
                  value={raiseAmount}
                  onChange={e => setRaiseAmount(Number(e.target.value))}
                  className="raise-slider"
                />
                <button className="btn-texas btn-raise" onClick={() => handleAction('raise')}>
                  加注 ${raiseAmount}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
