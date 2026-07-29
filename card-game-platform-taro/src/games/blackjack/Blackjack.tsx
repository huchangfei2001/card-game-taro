import React, { useState } from 'react';
import { CardFace } from '../../assets/svg/CardFace';
import { initBj, placeBet, hit, stand } from './blackjackEngine';
import type { BjState } from './blackjackEngine';

export const Blackjack: React.FC = () => {
  const [state, setState] = useState<BjState>(initBj());
  const [betAmt, setBetAmt] = useState(50);

  const handleBet = () => { const s = placeBet(state, betAmt); if (s !== state) setState(s); };
  const handleHit = () => setState(hit(state));
  const handleStand = () => setState(stand(state));
  const handleNew = () => setState({ ...initBj(), chips: state.chips });

  const player = state.player;
  const dealer = state.dealer;

  return (
    <div className="game-container texas-bg">
      <div className="game-header"><h2>🃏 21点 (Blackjack)</h2><button className="btn-restart" onClick={handleNew}>新一局</button></div>
      {state.message && <div className="game-message">{state.message}</div>}
      <div style={{ textAlign: 'center', marginBottom: 10 }}>
        <span style={{ color: '#e9c46a', fontSize: 18, fontWeight: 700 }}>筹码: ${state.chips}</span>
      </div>

      {/* Dealer */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <h4 style={{ color: '#e9c46a', marginBottom: 8 }}>{dealer.name} ({state.phase === 'finished' || state.phase === 'dealer_turn' ? dealer.score : '?'})</h4>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          {dealer.cards.map((c, i) => (
            <CardFace key={i} suit={c.suit} rank={c.rank} size={64}
              faceDown={i === 1 && state.phase === 'playing'} />
          ))}
        </div>
      </div>

      {/* Player */}
      <div style={{ textAlign: 'center' }}>
        <h4 style={{ color: '#fff', marginBottom: 8 }}>{player.name} ({player.score})</h4>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 16 }}>
          {player.cards.map((c, i) => (
            <CardFace key={i} suit={c.suit} rank={c.rank} size={72} />
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        {state.phase === 'betting' && (
          <>
            <input type="range" min={10} max={state.chips} step={10} value={betAmt} onChange={e => setBetAmt(Number(e.target.value))}
              style={{ width: 120, accentColor: '#e9c46a' }} />
            <button className="btn-texas btn-raise" onClick={handleBet}>下注 ${betAmt}</button>
          </>
        )}
        {state.phase === 'playing' && (
          <>
            <button className="btn-texas btn-call" onClick={handleHit}>要牌</button>
            <button className="btn-texas btn-check" onClick={handleStand}>停牌</button>
          </>
        )}
      </div>
    </div>
  );
};
