import React, { useRef, useEffect, useState } from 'react';
import { initPacman, setPacmanDir, tickPacman } from './pacmanEngine';
import type { PacManState } from './pacmanEngine';

const CELL = 18;
const W = 28, H = 31;
const CW = W * CELL, CH = H * CELL;

const GHOST_COLORS: Record<string, string> = { blinky: '#e74c3c', pinky: '#ffb8c6', inky: '#3498db', clyde: '#f39c12' };

function drawPacman(ctx: CanvasRenderingContext2D, state: PacManState) {
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, CW, CH + 40);

  // Maze
  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      const v = state.map[r][c];
      if (v === 0) {
        ctx.fillStyle = '#2121de';
        ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
      }
      if (state.dots[r]?.[c]) {
        ctx.fillStyle = '#f5cba7';
        ctx.beginPath();
        ctx.arc(c * CELL + CELL / 2, r * CELL + CELL / 2, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      if (state.powerPellets[r]?.[c]) {
        ctx.fillStyle = '#f5cba7';
        ctx.beginPath();
        ctx.arc(c * CELL + CELL / 2, r * CELL + CELL / 2, 6, 0, Math.PI * 2);
        ctx.fill();
        const pulse = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255,255,255,${pulse})`;
        ctx.beginPath();
        ctx.arc(c * CELL + CELL / 2, r * CELL + CELL / 2, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Pac-Man
  const p = state.pacman;
  ctx.fillStyle = '#ffff00';
  ctx.beginPath();
  const mouthAngle = state.pacman.mouth * Math.PI * 0.5;
  const dirAngles: Record<string, number> = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };
  const startAngle = dirAngles[p.dir] + mouthAngle;
  const endAngle = dirAngles[p.dir] + Math.PI * 2 - mouthAngle;
  ctx.arc(p.x * CELL, p.y * CELL, CELL * 0.4, startAngle, endAngle);
  ctx.lineTo(p.x * CELL, p.y * CELL);
  ctx.fill();

  // Ghosts
  for (const g of state.ghosts) {
    const color = g.mode === 'frightened' ? '#2121de' : GHOST_COLORS[g.name];
    ctx.fillStyle = color;
    const gx = g.x * CELL, gy = g.y * CELL;
    // Ghost body
    ctx.beginPath();
    ctx.arc(gx, gy - CELL * 0.1, CELL * 0.4, Math.PI, 0);
    ctx.lineTo(gx + CELL * 0.4, gy + CELL * 0.3);
    // Wavy bottom
    for (let i = 0; i < 3; i++) {
      const sx = gx + CELL * 0.4 - i * CELL * 0.25;
      ctx.lineTo(sx - CELL * 0.05, gy + CELL * 0.15);
      ctx.lineTo(sx - CELL * 0.2, gy + CELL * 0.3);
    }
    ctx.lineTo(gx - CELL * 0.4, gy + CELL * 0.3);
    ctx.closePath();
    ctx.fill();
    // Eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(gx - 3, gy - 4, 4, 0, Math.PI * 2);
    ctx.arc(gx + 3, gy - 4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#00f';
    ctx.beginPath();
    ctx.arc(gx - 3 + (g.x > p.x ? 1 : -1) * 1.5, gy - 4, 2, 0, Math.PI * 2);
    ctx.arc(gx + 3 + (g.x > p.x ? 1 : -1) * 1.5, gy - 4, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Score bar
  ctx.fillStyle = '#e9c46a';
  ctx.font = 'bold 14px monospace';
  ctx.fillText(`分数: ${state.score}  生命: ${state.lives}  第${state.level}关`, 10, CH + 25);

  if (state.gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, CH / 2 - 30, CW, 50);
    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', CW / 2, CH / 2 + 8);
    ctx.textAlign = 'left';
  }
}

export const Pacman: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<PacManState>(initPacman());
  const [, forceRender] = useState(0);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const dirMap: Record<string, 'up'|'down'|'left'|'right'> = {
        ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      };
      if (dirMap[e.key]) { e.preventDefault(); stateRef.current = setPacmanDir(stateRef.current, dirMap[e.key]); }
    };
    window.addEventListener('keydown', handleKey);

    const interval = setInterval(() => {
      stateRef.current = tickPacman(stateRef.current);
      forceRender(n => n + 1);
    }, 30);

    return () => { clearInterval(interval); window.removeEventListener('keydown', handleKey); };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawPacman(ctx, stateRef.current);
  });

  return (
    <div className="game-container texas-bg" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="game-header"><h2>👻 吃豆人</h2><button className="btn-restart" onClick={() => { stateRef.current = initPacman(); forceRender(n => n + 1); }}>重新开始</button></div>
      <canvas ref={canvasRef} width={CW} height={CH + 40} style={{ borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }} />
      <div style={{ color: '#aaa', fontSize: 12, marginTop: 6 }}>方向键移动</div>
    </div>
  );
};
