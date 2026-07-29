import React, { useState, useEffect } from 'react';
import { GoStone } from '../../assets/svg/GamePieces';
import { initOthello, placeOthello, othelloAI } from './othelloEngine';
import type { OthelloState } from './othelloEngine';

export const Othello: React.FC = () => {
  const [state, setState] = useState<OthelloState>(initOthello());
  const cellSize = 48;

  useEffect(() => {
    if (state.winner || state.gameOver || state.currentPlayer === 'black') return;
    const t = setTimeout(() => {
      const m = othelloAI(state);
      if (m) setState(placeOthello(state, m[0], m[1]));
    }, 400);
    return () => clearTimeout(t);
  }, [state]);

  return (
    <div className="game-container go-bg">
      <div className="game-header"><h2>⚫⚪ 黑白棋</h2><button className="btn-restart" onClick={() => setState(initOthello())}>重新开始</button></div>
      {state.message && <div className="game-message">{state.message}</div>}
      <div className="go-info" style={{ gap: 20 }}>
        <span>⚫ {state.blackCount}</span>
        <span>⚪ {state.whiteCount}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ background: '#2d5a1e', borderRadius: 8, padding: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
          {state.board.map((row, r) => (
            <div key={r} style={{ display: 'flex' }}>
              {row.map((cell, c) => {
                const isValid = state.validMoves.some(([vr,vc]) => vr===r && vc===c);
                return (
                  <div key={c} onClick={() => setState(placeOthello(state, r, c))}
                    style={{ width: cellSize, height: cellSize, background: '#1a6b20',
                      border: '1px solid #2a4a1e', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: isValid && state.currentPlayer==='black' ? 'pointer' : 'default', position: 'relative' }}>
                    {cell && <GoStone color={cell} size={cellSize-6} />}
                    {isValid && !cell && <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,255,255,0.4)' }}/>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
