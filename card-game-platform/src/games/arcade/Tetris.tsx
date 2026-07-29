import React, { useRef, useEffect, useState } from 'react';
import {
  initTet, startTet, moveTet, rotateTet, hardDropTet, dropTet, spawnTet,
} from './tetrisEngine';
import type { TetState } from './tetrisEngine';

const CELL = 28;
const BOARD_X = 40;
const BOARD_Y = 20;
const COLORS = ['#000','#00f0f0','#f0f000','#a000f0','#00f000','#f00000','#0000f0','#f0a000'];

function drawTetris(ctx: CanvasRenderingContext2D, state: TetState) {
  const { board, current } = state;
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, 480, 620);

  // Board
  ctx.fillStyle = '#0d0d1a';
  ctx.fillRect(BOARD_X, BOARD_Y, CELL * 10, CELL * 20);

  // Grid
  ctx.strokeStyle = '#1a1a3a';
  ctx.lineWidth = 0.5;
  for (let r = 0; r < 20; r++) {
    for (let c = 0; c < 10; c++) {
      ctx.strokeRect(BOARD_X + c * CELL, BOARD_Y + r * CELL, CELL, CELL);
    }
  }

  // Board cells (skip 2 hidden rows)
  for (let r = 2; r < 22; r++) {
    for (let c = 0; c < 10; c++) {
      const v = board[r][c];
      if (v) {
        ctx.fillStyle = COLORS[v];
        ctx.fillRect(BOARD_X + c * CELL + 1, BOARD_Y + (r - 2) * CELL + 1, CELL - 2, CELL - 2);
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(BOARD_X + c * CELL + 1, BOARD_Y + (r - 2) * CELL + 1, CELL - 2, CELL / 2 - 2);
      }
    }
  }

  // Current piece
  if (current) {
    const ci = ['I','O','T','S','Z','J','L'].indexOf(current.type) + 1;
    ctx.fillStyle = COLORS[ci];
    for (let r = 0; r < current.shape.length; r++) {
      for (let c = 0; c < current.shape[r].length; c++) {
        if (!current.shape[r][c]) continue;
        const x = BOARD_X + (current.x + c) * CELL;
        const y = BOARD_Y + (current.y + r - 2) * CELL;
        if (current.y + r < 2) continue;
        ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(x + 1, y + 1, CELL - 2, CELL / 2 - 2);
        ctx.fillStyle = COLORS[ci];
      }
    }
  }

  // Side panel
  ctx.fillStyle = '#e9c46a';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('NEXT', BOARD_X + CELL * 10 + 25, 50);
  ctx.fillText(`分数: ${state.score}`, BOARD_X + CELL * 10 + 15, 280);
  ctx.fillText(`行数: ${state.lines}`, BOARD_X + CELL * 10 + 15, 310);
  ctx.fillText(`等级: ${state.level}`, BOARD_X + CELL * 10 + 15, 340);

  if (state.gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(BOARD_X, BOARD_Y + CELL * 7, CELL * 10, CELL * 3);
    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', BOARD_X + CELL * 5, BOARD_Y + CELL * 8.5);
    ctx.textAlign = 'left';
  }
}

export const Tetris: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<TetState>(startTet(initTet()));
  const keys = useRef<Set<string>>(new Set());
  const [, setMsg] = useState('');

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      keys.current.add(e.key);
      e.preventDefault();
    };
    const handleKeyUp = (e: KeyboardEvent) => { keys.current.delete(e.key); };
    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKey); window.removeEventListener('keyup', handleKeyUp); };
  }, []);

  useEffect(() => {
    let dropTimer = 0;
    const DAS = { left: 0, right: 0 };
    let interval = setInterval(() => {
      const s = stateRef.current;
      if (s.gameOver) return;
      const keyset = keys.current;
      // Soft drop
      if (keyset.has('ArrowDown') || keyset.has('s')) {
        stateRef.current = dropTet(s);
      }
      // Left/Right with DAS
      if (keyset.has('ArrowLeft') || keyset.has('a')) {
        DAS.left++;
        if (DAS.left === 1 || (DAS.left > 10 && DAS.left % 2 === 0)) stateRef.current = moveTet(stateRef.current, -1, 0);
      } else DAS.left = 0;
      if (keyset.has('ArrowRight') || keyset.has('d')) {
        DAS.right++;
        if (DAS.right === 1 || (DAS.right > 10 && DAS.right % 2 === 0)) stateRef.current = moveTet(stateRef.current, 1, 0);
      } else DAS.right = 0;
      // Rotate
      if (keyset.has('ArrowUp') || keyset.has('w')) {
        keyset.delete('ArrowUp'); keyset.delete('w');
        stateRef.current = rotateTet(stateRef.current, 1);
      }
      if (keyset.has(' ')) {
        keyset.delete(' ');
        stateRef.current = hardDropTet(stateRef.current);
        if (stateRef.current.gameOver || !stateRef.current.current) stateRef.current = spawnTet(stateRef.current);
        else stateRef.current = spawnTet(stateRef.current);
      }

      dropTimer++;
      if (dropTimer >= 20) {
        dropTimer = 0;
        const d = dropTet(stateRef.current);
        if (d === stateRef.current) {
          stateRef.current = spawnTet(stateRef.current);
        } else {
          stateRef.current = d;
        }
      }
    }, 16);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animId: number;
    const render = () => {
      drawTetris(ctx, stateRef.current);
      animId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animId);
  }, []);

  const restart = () => {
    stateRef.current = startTet(initTet());
    setMsg('');
  };

  return (
    <div className="game-container texas-bg" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="game-header"><h2>🧱 俄罗斯方块</h2><button className="btn-restart" onClick={restart}>重新开始</button></div>
      <canvas ref={canvasRef} width={480} height={620} style={{ borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }} tabIndex={0} />
      <div style={{ color: '#aaa', fontSize: 12, marginTop: 8 }}>方向键移动/旋转 | 空格硬降 | 按R重新开始</div>
    </div>
  );
};
