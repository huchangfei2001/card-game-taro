import React, { useRef, useEffect, useState } from 'react';
import { initJunqi, selectJunqi, moveJunqi, junqiAI } from './junqiEngine';
import type { JunqiState } from './junqiEngine';

const COLS = 5, ROWS = 11;
const CELL_W = 56, CELL_H = 52;
const PAD_X = 10, PAD_Y = 10;
const CW = COLS * CELL_W + PAD_X * 2, CH = ROWS * CELL_H + PAD_Y * 2 + 60;

const BOARD_MAP = [
  [3, 3, 3, 3, 3],
  [1, 2, 1, 2, 1],
  [1, 1, 1, 1, 1],
  [1, 1, 0, 1, 1],
  [1, 1, 0, 1, 1],
  [0, 0, 0, 0, 0],
  [1, 1, 0, 1, 1],
  [1, 1, 0, 1, 1],
  [1, 1, 1, 1, 1],
  [1, 2, 1, 2, 1],
  [3, 3, 3, 3, 3],
];

const CELL_BG: Record<number, string> = { 0: '#8B7355', 1: '#9E9E9E', 2: '#6B8E23', 3: '#8B0000' };

function drawJunqi(ctx: CanvasRenderingContext2D, state: JunqiState) {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, CW, CH);

  const OY = PAD_Y + 20;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = PAD_X + c * CELL_W;
      const y = OY + r * CELL_H;
      const cellType = BOARD_MAP[r][c];
      const bg = CELL_BG[cellType];

      ctx.fillStyle = bg;
      ctx.fillRect(x + 2, y + 2, CELL_W - 4, CELL_H - 4);
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 2, y + 2, CELL_W - 4, CELL_H - 4);

      if (cellType === 1) {
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + CELL_W / 2, y + 4);
        ctx.lineTo(x + CELL_W / 2, y + CELL_H - 4);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 4, y + CELL_H / 2);
        ctx.lineTo(x + CELL_W - 4, y + CELL_H / 2);
        ctx.stroke();
      }

      if (cellType === 2) {
        ctx.fillStyle = 'rgba(107,142,35,0.4)';
        ctx.beginPath();
        ctx.arc(x + CELL_W / 2, y + CELL_H / 2, CELL_W / 3, 0, Math.PI * 2);
        ctx.fill();
      }

      const piece = state.board[r][c];
      if (piece) {
        if (!piece.revealed) {
          ctx.fillStyle = '#6E6E6E';
          ctx.fillRect(x + 6, y + 6, CELL_W - 12, CELL_H - 12);
          ctx.fillStyle = '#FFF';
          ctx.font = 'bold 16px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('?', x + CELL_W / 2, y + CELL_H / 2);
          ctx.textAlign = 'left';
          ctx.textBaseline = 'alphabetic';
        } else {
          const isRed = piece.color === 'red';
          ctx.fillStyle = isRed ? '#FFF8E1' : '#1a1a3e';
          ctx.fillRect(x + 6, y + 6, CELL_W - 12, CELL_H - 12);
          ctx.fillStyle = isRed ? '#C62828' : '#42A5F5';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(piece.type, x + CELL_W / 2, y + CELL_H / 2);
          ctx.textAlign = 'left';
          ctx.textBaseline = 'alphabetic';
        }
      }

      if (state.selected && state.selected[0] === r && state.selected[1] === c) {
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.strokeRect(x + 2, y + 2, CELL_W - 4, CELL_H - 4);
      }

      if (state.validMoves.some(([vr, vc]) => vr === r && vc === c)) {
        ctx.fillStyle = 'rgba(255, 215, 0, 0.35)';
        ctx.fillRect(x + 2, y + 2, CELL_W - 4, CELL_H - 4);
      }
    }
  }

  const infoY = OY + ROWS * CELL_H + 8;
  ctx.fillStyle = '#e9c46a';
  ctx.font = 'bold 13px monospace';
  ctx.fillText(`红方: ${state.redPieces}  蓝方: ${state.bluePieces}`, PAD_X + 5, infoY);
  ctx.fillText(state.message, PAD_X + 5, infoY + 16);

  if (state.winner) {
    const winColor = state.winner === 'red' ? '#C62828' : '#42A5F5';
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(PAD_X + 20, OY + ROWS * CELL_H / 2 - 25, COLS * CELL_W - 40, 50);
    ctx.fillStyle = winColor;
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${state.winner === 'red' ? '红方' : '蓝方'} 获胜!`, CW / 2, OY + ROWS * CELL_H / 2);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }
}

export const Junqi: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<JunqiState>(initJunqi());
  const [, forceRender] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animId: number;
    const render = () => {
      drawJunqi(ctx, stateRef.current);
      animId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animId);
  }, []);

  useEffect(() => {
    if (stateRef.current.currentPlayer !== 'blue' || stateRef.current.winner) return;
    const timer = setTimeout(() => {
      const aiMove = junqiAI(stateRef.current);
      if (aiMove) {
        let s = selectJunqi(stateRef.current, aiMove.from[0], aiMove.from[1]);
        stateRef.current = moveJunqi(s, aiMove.to[0], aiMove.to[1]);
        forceRender(n => n + 1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [stateRef.current.currentPlayer, stateRef.current.winner]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CW / rect.width;
    const scaleY = CH / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    const OY = PAD_Y + 20;
    const col = Math.floor((mx - PAD_X) / CELL_W);
    const row = Math.floor((my - OY) / CELL_H);
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return;

    const state = stateRef.current;
    if (state.winner) return;
    if (state.currentPlayer !== 'red') return;

    const isMove = state.validMoves.some(([r, c]) => r === row && c === col);
    if (isMove) {
      stateRef.current = moveJunqi(state, row, col);
    } else {
      stateRef.current = selectJunqi(state, row, col);
    }
    forceRender(n => n + 1);
  };

  const restart = () => {
    stateRef.current = initJunqi();
    forceRender(n => n + 1);
  };

  return (
    <div className="game-container texas-bg" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="game-header"><h2>🎖️ 军棋</h2><button className="btn-restart" onClick={restart}>重新开始</button></div>
      <canvas ref={canvasRef} width={CW} height={CH} onClick={handleClick} style={{ borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }} />
      <div style={{ color: '#aaa', fontSize: 12, marginTop: 6 }}>点击棋子选择，再点击目标移动</div>
    </div>
  );
};
