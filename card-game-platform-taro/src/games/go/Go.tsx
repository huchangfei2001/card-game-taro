import React, { useState, useEffect, useCallback } from 'react';
import { GoStone } from '../../assets/svg/GamePieces';
import type { GoGameState } from './goEngine';
import { initGoGame, placeGoStone, passGoTurn, getGoAIMove } from './goEngine';

export const Go: React.FC = () => {
  const [game, setGame] = useState<GoGameState>(initGoGame(9));
  const size = game.boardSize;
  const cellSize = 44;
  const padding = 22;
  const boardPixel = cellSize * (size - 1) + padding * 2;

  const handleClick = useCallback((row: number, col: number) => {
    if (game.winner || game.currentPlayer !== 'black') return;
    const newState = placeGoStone(game, row, col);
    if (newState !== game) setGame(newState);
  }, [game]);

  useEffect(() => {
    if (game.winner || game.currentPlayer === 'black') return;
    const timer = setTimeout(() => {
      const aiMove = getGoAIMove(game);
      if (aiMove) {
        const newState = placeGoStone(game, aiMove[0], aiMove[1]);
        setGame(newState);
      } else {
        setGame(passGoTurn(game));
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [game]);

  return (
    <div className="game-container go-bg">
      <div className="game-header">
        <h2>⚫⚪ 围棋 (9路)</h2>
        <button className="btn-restart" onClick={() => setGame(initGoGame(9))}>重新开始</button>
      </div>
      {game.message && <div className="game-message">{game.message}</div>}

      <div className="go-info">
        <span>⚫ 黑棋 提子: {game.captures.black}</span>
        <span>⚪ 白棋 提子: {game.captures.white}</span>
        <span>{game.currentPlayer === 'black' ? '⚫ 黑棋走' : '⚪ 白棋走'}</span>
      </div>

      <div className="go-board-wrapper">
        <div className="go-outer-frame">
          <div className="go-board" style={{ width: boardPixel, height: boardPixel, position: 'relative' }}>
            {/* Grid lines rendered via SVG */}
            <svg className="go-board-grid" width={boardPixel} height={boardPixel}
              style={{ position: 'absolute', top: 0, left: 0 }}>
              {Array.from({ length: size }).map((_, i) => (
                <React.Fragment key={i}>
                  <line x1={padding} y1={padding + i * cellSize} x2={padding + (size - 1) * cellSize}
                    y2={padding + i * cellSize} stroke="#8b6914" strokeWidth="1"/>
                  <line x1={padding + i * cellSize} y1={padding} x2={padding + i * cellSize}
                    y2={padding + (size - 1) * cellSize} stroke="#8b6914" strokeWidth="1"/>
                </React.Fragment>
              ))}
              {/* Star points for 9x9 */}
              {[[2,2],[2,6],[4,4],[6,2],[6,6]].map(([r,c]) => (
                <circle key={`s-${r}-${c}`} cx={padding + c * cellSize} cy={padding + r * cellSize}
                  r="3" fill="#8b6914"/>
              ))}
            </svg>

            {/* Stones */}
            {game.board.map((row, r) =>
              row.map((stone, c) => (
                <div key={`${r}-${c}`} className="go-cell"
                  onClick={() => handleClick(r, c)}
                  style={{
                    position: 'absolute',
                    left: padding + c * cellSize - cellSize / 2,
                    top: padding + r * cellSize - cellSize / 2,
                    width: cellSize, height: cellSize,
                    cursor: game.winner || game.currentPlayer !== 'black' ? 'default' : 'pointer',
                  }}>
                  {stone && (
                    <div className="go-stone-wrapper">
                      <GoStone color={stone} size={cellSize - 4}
                        lastMove={game.lastMove?.[0] === r && game.lastMove?.[1] === c}/>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="go-actions">
        <button className="btn-go-action"
          onClick={() => setGame(passGoTurn(game))}
          disabled={game.currentPlayer !== 'black' || !!game.winner}>
          停一手
        </button>
      </div>
    </div>
  );
};
