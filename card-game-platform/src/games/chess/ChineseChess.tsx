import React, { useState, useEffect, useCallback } from 'react';
import { ChessPiece } from '../../assets/svg/GamePieces';
import type { ChessGameState } from './chessEngine';
import { initChessGame, getValidMoves, makeChessMove, getChessAIMove } from './chessEngine';

export const ChineseChess: React.FC = () => {
  const [game, setGame] = useState<ChessGameState>(initChessGame());
  const [validMoves, setValidMoves] = useState<[number, number][]>([]);

  const handleCell = useCallback((row: number, col: number) => {
    if (game.winner) return;
    if (game.selectedRow !== null && game.selectedCol !== null) {
      if (validMoves.some(([r,c]) => r === row && c === col)) {
        const newState = makeChessMove(game, game.selectedRow, game.selectedCol, row, col);
        setGame(newState);
        setValidMoves([]);
        return;
      }
      setGame({ ...game, selectedRow: null, selectedCol: null });
      setValidMoves([]);
      return;
    }
    const piece = game.board[row][col];
    if (piece && piece.isRed === (game.currentPlayer === 'red')) {
      const moves = getValidMoves(game, row, col);
      setGame({ ...game, selectedRow: row, selectedCol: col });
      setValidMoves(moves);
    }
  }, [game, validMoves]);

  useEffect(() => {
    if (game.winner || game.currentPlayer === 'red') return;
    const timer = setTimeout(() => {
      const aiMove = getChessAIMove(game);
      if (aiMove) {
        const newState = makeChessMove(game, aiMove.fromRow, aiMove.fromCol, aiMove.toRow, aiMove.toCol);
        setGame(newState);
        setValidMoves([]);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [game]);

  return (
    <div className="game-container chess-bg">
      <div className="game-header">
        <h2>🐴 中国象棋</h2>
        <button className="btn-restart" onClick={() => { setGame(initChessGame()); setValidMoves([]); }}>重新开始</button>
      </div>
      {game.message && <div className="game-message">{game.message}</div>}

      <div className="chess-board-wrapper">
        <div className="chess-outer-frame">
          <div className="chess-board">
            {game.board.map((row, r) => (
              <div key={r} className="chess-row">
                {row.map((piece, c) => {
                  const isSel = game.selectedRow === r && game.selectedCol === c;
                  const isValid = validMoves.some(([vr, vc]) => vr === r && vc === c);
                  const isCapture = isValid && piece !== null;

                  return (
                    <div key={c} className="chess-cell" onClick={() => handleCell(r, c)}>
                      <div className="chess-grid" style={{ position: 'relative' }}>
                        {piece && (
                          <div style={{ position: 'relative', zIndex: 5 }}>
                            <ChessPiece type={piece.type} isRed={piece.isRed} size={42} selected={isSel} />
                          </div>
                        )}
                        {isValid && !isCapture && <div className="valid-move-dot" />}
                        {isValid && isCapture && <div className="valid-move-ring" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="river-text">楚 河 &nbsp;&nbsp;&nbsp; 汉 界</div>
      </div>
    </div>
  );
};
