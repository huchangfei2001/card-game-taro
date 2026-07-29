import React, { useState, useEffect, useRef } from 'react';
import { initLudo, rollDice, movePiece, ludoAI } from './ludoEngine';
import type { LudoState } from './ludoEngine';

const BOARD_POSITIONS: [number, number][] = [
  [6,13],[6,12],[6,11],[6,10],[6,9],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8],[0,7],[0,6],
  [1,6],[2,6],[3,6],[4,6],[5,6],[6,5],[6,4],[6,3],[6,2],[6,1],[6,0],[7,0],[8,0],
  [8,1],[8,2],[8,3],[8,4],[8,5],[9,6],[10,6],[11,6],[12,6],[13,6],[14,6],[14,7],[14,8],
  [13,8],[12,8],[11,8],[10,8],[9,8],[8,9],[8,10],[8,11],[8,12],[8,13],[8,14],[7,14],[6,14],
];

const HOME_POS: [number, number][] = [
  [2, 2], [12, 2], [12, 12], [2, 12],
];

const COLORS = ['#e63946', '#2a9d8f', '#e9c46a', '#457b9d'];

export const Ludo: React.FC = () => {
  const [state, setState] = useState<LudoState>(initLudo());
  const hasRolled = useRef(false);

  useEffect(() => {
    if (state.phase === 'finished' || state.winner !== null) return;

    const p = state.players[state.currentPlayer];
    if (!p.isAI) {
      if (state.phase === 'rolling') hasRolled.current = false;
      return;
    }

    if (state.phase === 'rolling') {
      if (hasRolled.current) return;
      hasRolled.current = true;
      const t1 = setTimeout(() => {
        const s = rollDice(state);
        setState(s);
      }, 800);
      return () => clearTimeout(t1);
    }

    if (state.phase === 'moving') {
      const t2 = setTimeout(() => {
        const m = ludoAI(state);
        if (m !== null) setState(movePiece(state, m));
      }, 600);
      return () => clearTimeout(t2);
    }
  }, [state]);

  const handleRoll = () => { hasRolled.current = true; setState(rollDice(state)); };
  const handleMove = (pieceId: number) => { hasRolled.current = false; setState(movePiece(state, pieceId)); };

  const boardSize = 400;
  const cellSize = boardSize / 15;

  return (
    <div className="game-container texas-bg">
      <div className="game-header"><h2>🎲 飞行棋</h2><button className="btn-restart" onClick={() => { setState(initLudo()); hasRolled.current = false; }}>重新开始</button></div>
      {state.message && <div className="game-message">{state.message}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Dice display */}
        <div style={{
          width: 50, height: 50, background: '#f4e4c1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, fontWeight: 800, color: '#333', marginBottom: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
        }}>
          {state.dice}
        </div>

        {/* Board */}
        <div style={{ position: 'relative', width: boardSize, height: boardSize, background: '#f4e4c1', borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
          {/* Grid lines */}
          {Array.from({ length: 15 }).map((_, i) => (
            <React.Fragment key={i}>
              <div style={{ position: 'absolute', top: i * cellSize, left: 0, width: '100%', height: 1, background: '#ddd' }}/>
              <div style={{ position: 'absolute', left: i * cellSize, top: 0, width: 1, height: '100%', background: '#ddd' }}/>
            </React.Fragment>
          ))}

          {/* Path cells */}
          {BOARD_POSITIONS.map(([r, c], i) => {
            return (
              <div key={i} style={{
                position: 'absolute', left: c * cellSize + cellSize*0.15, top: r * cellSize + cellSize*0.15,
                width: cellSize * 0.7, height: cellSize * 0.7, borderRadius: 4,
                border: '1px solid rgba(0,0,0,0.15)', background: 'rgba(255,255,255,0.3)',
              }}>
                {state.players.map(p => p.pieces.filter(pc => !pc.atHome && !pc.finished && pc.pos === i).map(pc => (
                  <div key={`${p.id}-${pc.id}`} style={{
                    width: '50%', height: '50%', borderRadius: '50%', background: COLORS[p.id],
                    boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                  }}/>
                )))}
              </div>
            );
          })}

          {/* Home bases */}
          {HOME_POS.map(([r, c], i) => (
            <div key={`home-${i}`} style={{
              position: 'absolute', left: c * cellSize, top: r * cellSize,
              width: cellSize * 3, height: cellSize * 3,
              background: COLORS[i] + '30', borderRadius: 6, border: `2px solid ${COLORS[i]}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap',
            }}>
              {state.players[i].pieces.filter(pc => pc.atHome || pc.finished).map(pc => (
                <div key={pc.id} style={{
                  width: cellSize * 0.8, height: cellSize * 0.8, borderRadius: '50%',
                  background: COLORS[i], margin: 2,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                  opacity: pc.finished ? 0.5 : 1,
                }}/>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
        {state.phase === 'rolling' && state.currentPlayer === 0 && (
          <button className="btn-texas btn-raise" onClick={handleRoll}>掷骰子</button>
        )}
        {state.phase === 'moving' && state.currentPlayer === 0 && (
          state.players[0].pieces.map(pc => {
            const canMove = (state.dice === 6 && pc.atHome) || (!pc.atHome && !pc.finished);
            return canMove ? (
              <button key={pc.id} className="btn-texas btn-call" onClick={() => handleMove(pc.id)}>
                棋子 {pc.id + 1}
              </button>
            ) : null;
          })
        )}
      </div>
    </div>
  );
};
