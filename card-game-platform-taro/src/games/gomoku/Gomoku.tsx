import React, { useState, useEffect } from 'react';
import { GoStone } from '../../assets/svg/GamePieces';
import { initGomoku, placeGomoku, gomokuAI } from './gomokuEngine';
import type { GomokuState } from './gomokuEngine';

export const Gomoku: React.FC = () => {
  const [state, setState] = useState<GomokuState>(initGomoku(15));
  const size = state.size;
  const cellSize = 32;
  const pad = 16;
  const bp = cellSize * (size - 1) + pad * 2;

  useEffect(() => {
    if (state.winner || state.currentPlayer === 'black') return;
    const t = setTimeout(() => {
      const m = gomokuAI(state);
      if (m) setState(placeGomoku(state, m[0], m[1]));
    }, 300);
    return () => clearTimeout(t);
  }, [state]);

  return (
    <div className="game-container go-bg">
      <div className="game-header"><h2>⚫⚪ 五子棋</h2><button className="btn-restart" onClick={() => setState(initGomoku(15))}>重新开始</button></div>
      {state.message && <div className="game-message">{state.message}</div>}
      <div className="go-board-wrapper">
        <div className="go-outer-frame">
          <div className="go-board" style={{ width: bp, height: bp, position: 'relative' }}>
            <svg width={bp} height={bp} style={{ position: 'absolute', top: 0, left: 0 }}>
              {Array.from({ length: size }).map((_, i) => (
                <React.Fragment key={i}>
                  <line x1={pad} y1={pad + i * cellSize} x2={pad + (size-1) * cellSize} y2={pad + i * cellSize} stroke="#8b6914" strokeWidth="0.8"/>
                  <line x1={pad + i * cellSize} y1={pad} x2={pad + i * cellSize} y2={pad + (size-1) * cellSize} stroke="#8b6914" strokeWidth="0.8"/>
                </React.Fragment>
              ))}
            </svg>
            {state.board.map((row, r) => row.map((cell, c) => (
              <div key={`${r}-${c}`} onClick={() => setState(placeGomoku(state, r, c))}
                style={{ position: 'absolute', left: pad + c * cellSize - cellSize/2, top: pad + r * cellSize - cellSize/2,
                  width: cellSize, height: cellSize, cursor: state.winner || state.currentPlayer !== 'black' || cell ? 'default' : 'pointer' }}>
                {cell && <div className="go-stone-wrapper"><GoStone color={cell as 'black' | 'white'} size={cellSize-2}
                  lastMove={state.winLine?.some(([wr,wc]) => wr===r && wc===c)}/></div>}
              </div>
            )))}
          </div>
        </div>
      </div>
    </div>
  );
};
