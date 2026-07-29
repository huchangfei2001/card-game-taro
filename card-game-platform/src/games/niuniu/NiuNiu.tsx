import React, { useState } from 'react';
import { CardFace } from '../../assets/svg/CardFace';
import { initNn, placeNnBet, dealNn } from './niuniuEngine';
import type { NnState } from './niuniuEngine';

export const NiuNiu: React.FC = () => {
  const [state, setState] = useState<NnState>(initNn());
  const [bet, setBet] = useState(20);

  const handleBet = () => {
    const s = placeNnBet(state, bet);
    if (s !== state) {
      setTimeout(() => setState(dealNn(s)), 500);
      setState(s);
    }
  };

  const player = state.players[0];
  const ais = state.players.slice(1);

  return (
    <div className="game-container texas-bg">
      <div className="game-header"><h2>🐂 牛牛</h2><button className="btn-restart" onClick={() => setState(initNn())}>重新开始</button></div>
      {state.message && <div className="game-message">{state.message}</div>}
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <span style={{ color: '#e9c46a', fontWeight: 700 }}>筹码: ${player.chips}</span>
      </div>

      {/* AI players */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 12 }}>
        {ais.map(ai => (
          <div key={ai.id} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: 10, textAlign: 'center', minWidth: 150 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>{ai.name} (${ai.chips})</div>
            <div style={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              {ai.cards.map((c, i) => (
                <CardFace key={i} suit={c.suit} rank={c.rank} size={36} small faceDown={state.phase !== 'result'} />
              ))}
            </div>
            {state.phase === 'result' && <div style={{ fontSize: 13, color: '#e9c46a', marginTop: 4 }}>{ai.niuType}</div>}
            <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>下注: ${ai.bet}</div>
          </div>
        ))}
      </div>

      {/* Player */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 600, marginBottom: 8, color: '#fff' }}>{player.name}</div>
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 12 }}>
          {state.phase === 'dealing' || state.phase === 'result'
            ? player.cards.map((c, i) => <CardFace key={i} suit={c.suit} rank={c.rank} size={64} />)
            : Array.from({ length: 5 }).map((_, i) => (
              <CardFace key={i} suit="spades" rank={1} size={64} faceDown />
            ))}
        </div>
        {state.phase === 'result' && (
          <div style={{ fontSize: 16, color: '#e9c46a', fontWeight: 700, marginBottom: 8 }}>{player.niuType}</div>
        )}
      </div>

      {state.phase === 'betting' && (
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'center' }}>
          <input type="range" min={10} max={player.chips} step={10} value={bet} onChange={e => setBet(Number(e.target.value))}
            style={{ width: 100, accentColor: '#e9c46a' }} />
          <button className="btn-texas btn-raise" onClick={handleBet}>下注 ${bet}</button>
        </div>
      )}
      {state.phase === 'result' && (
        <div style={{ textAlign: 'center', marginTop: 10 }}>
          <button className="btn-texas btn-raise" onClick={() => setState(initNn())}>再来一局</button>
        </div>
      )}
    </div>
  );
};
