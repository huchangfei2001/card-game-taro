import React, { useState, useEffect } from 'react';
import { ChessPiece } from '../../assets/svg/GamePieces';
import { initIChess, selectIChessPiece, makeIChessMove, ichessAI } from './intlchessEngine';
import type { IChessState } from './intlchessEngine';

const PIECE_SYMBOLS: Record<string, Record<string, string>> = {
  white: { king: 'ichess_king_w', queen: 'iQueen', rook: 'iRook', bishop: 'iBishop', knight: 'iKnight', pawn: 'iPawn' },
  black: { king: 'ichess_king_b', queen: 'iqueen', rook: 'irook', bishop: 'ibishop', knight: 'iknight', pawn: 'ipawn' },
};

function mapPieceType(type: string, color: 'white' | 'black'): string {
  const mapped = PIECE_SYMBOLS[color]?.[type];
  return mapped || type;
}

export const IntlChess: React.FC = () => {
  const [state, setState] = useState<IChessState>(initIChess());
  const [flipped, setFlipped] = useState(false);
  const cellSize = 56;

  useEffect(() => {
    if (state.winner || state.currentPlayer === 'white') return;
    const t = setTimeout(() => {
      const m = ichessAI(state);
      if (m) {
        const s1 = selectIChessPiece(state, m.from[0], m.from[1]);
        const s2 = makeIChessMove(s1, m.from[0], m.from[1], m.to[0], m.to[1]);
        setState(s2);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [state]);

  const handleClick = (row: number, col: number) => {
    if (state.winner || state.currentPlayer !== 'white') return;
    const piece = state.board[row][col];
    if (state.selected && state.validMoves.some(([r, c]) => r === row && c === col)) {
      setState(makeIChessMove(state, state.selected[0], state.selected[1], row, col));
    } else if (piece && piece.color === state.currentPlayer) {
      setState(selectIChessPiece(state, row, col));
    } else {
      setState({ ...state, selected: null, validMoves: [] });
    }
  };

  const toggleFlipped = () => setFlipped(!flipped);

  return (
    <div className="game-container go-bg">
      <div className="game-header">
        <h2>♔ 国际象棋</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-texas btn-check" onClick={toggleFlipped}>翻转棋盘</button>
          <button className="btn-restart" onClick={() => setState(initIChess())}>重新开始</button>
        </div>
      </div>
      {state.message && <div className="game-message">{state.message}</div>}

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ border: '3px solid #5c3a1e', borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
          {Array.from({ length: 8 }).map((_, ri) => {
            const r = flipped ? 7 - ri : ri;
            return (
              <div key={r} style={{ display: 'flex' }}>
                {Array.from({ length: 8 }).map((_, ci) => {
                  const c = flipped ? 7 - ci : ci;
                  const isLight = (r + c) % 2 === 0;
                  const isSelected = state.selected?.[0] === r && state.selected?.[1] === c;
                  const isValidTarget = state.validMoves.some(([vr, vc]) => vr === r && vc === c);
                  const piece = state.board[r][c];
                  const isLastMove = state.moveHistory.length > 0 &&
                    (() => {
                      const last = state.moveHistory[state.moveHistory.length - 1];
                      return (parseInt(last[2]) === r && parseInt(last[3]) === c) || (parseInt(last[0]) === r && parseInt(last[1]) === c);
                    })();

                  return (
                    <div key={c} onClick={() => handleClick(r, c)}
                      style={{
                        width: cellSize, height: cellSize,
                        background: isSelected ? '#b8e6ff' : isLastMove ? '#f0e68c80' : isLight ? '#e8d5b7' : '#8b6914',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: (piece?.color === 'white' || isValidTarget) ? 'pointer' : 'default',
                        position: 'relative',
                      }}>
                      {isValidTarget && !piece && (
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(0,0,0,0.25)' }}/>
                      )}
                      {isValidTarget && piece && (
                        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(255,0,0,0.3)' }}/>
                      )}
                      {piece && (
                        <ChessPiece type={mapPieceType(piece.type, piece.color)} isRed={piece.color === 'white'} size={cellSize * 0.85} />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Captured pieces display */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 10 }}>
        <div style={{ color: '#ccc', fontSize: 13 }}>
          白棋: {state.currentPlayer === 'white' ? '← 走棋中' : ''}
        </div>
        <div style={{ color: '#aaa', fontSize: 13 }}>
          黑棋: {state.currentPlayer === 'black' ? '← 走棋中' : ''}
        </div>
      </div>
    </div>
  );
};
