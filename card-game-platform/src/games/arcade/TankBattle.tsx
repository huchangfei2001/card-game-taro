import React, { useRef, useEffect, useState } from 'react';
import { initTankBattle, moveTank, playerShoot, tickTankBattle } from './tankbattleEngine';
import type { TankBattleState, Tile, Direction } from './tankbattleEngine';

const CELL = 40;
const PAD = 10;
const CANVAS_W = CELL * 13 + PAD * 2;
const CANVAS_H = CELL * 13 + PAD * 2 + 60;

function drawTankBattle(ctx: CanvasRenderingContext2D, state: TankBattleState) {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const tiles: Record<Tile, string> = { 0: '', 1: '#b5651d', 2: '#999', 3: '#4488cc', 4: '#228b22' };

  // Map
  for (let r = 0; r < 13; r++) {
    for (let c = 0; c < 13; c++) {
      const t = state.map[r][c];
      if (t === 1) {
        ctx.fillStyle = tiles[t];
        ctx.fillRect(PAD + c * CELL + 2, PAD + r * CELL + 2, CELL - 4, CELL - 4);
        ctx.strokeStyle = '#8b5e3c';
        ctx.lineWidth = 1;
        ctx.strokeRect(PAD + c * CELL + 2, PAD + r * CELL + 2, CELL - 4, CELL - 4);
      } else if (t === 2) {
        ctx.fillStyle = tiles[t];
        ctx.fillRect(PAD + c * CELL, PAD + r * CELL, CELL, CELL);
        ctx.strokeStyle = '#666';
        ctx.strokeRect(PAD + c * CELL, PAD + r * CELL, CELL, CELL);
      } else if (t === 4) {
        // Base eagle
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(PAD + c * CELL + 8, PAD + r * CELL + 8, CELL - 16, CELL - 16);
        ctx.fillStyle = '#f1c40f';
        ctx.font = '20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('🦅', PAD + c * CELL + CELL / 2, PAD + r * CELL + CELL * 0.7);
      }
    }
  }

  // Grid lines
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 0.5;
  for (let r = 0; r <= 13; r++) {
    ctx.beginPath(); ctx.moveTo(PAD, PAD + r * CELL); ctx.lineTo(PAD + 13 * CELL, PAD + r * CELL); ctx.stroke();
  }
  for (let c = 0; c <= 13; c++) {
    ctx.beginPath(); ctx.moveTo(PAD + c * CELL, PAD); ctx.lineTo(PAD + c * CELL, PAD + 13 * CELL); ctx.stroke();
  }

  // Power-ups
  for (const pu of state.powerUps) {
    ctx.fillStyle = pu.type === 'star' ? '#f39c12' : pu.type === 'bomb' ? '#e74c3c' : pu.type === 'life' ? '#2ecc71' : '#3498db';
    ctx.beginPath();
    ctx.arc(PAD + pu.x * CELL + CELL / 2, PAD + pu.y * CELL + CELL / 2, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(pu.type[0].toUpperCase(), PAD + pu.x * CELL + CELL / 2, PAD + pu.y * CELL + CELL / 2 + 4);
  }

  // Tanks
  const allTanks = [state.player, ...state.tanks];
  for (const t of allTanks) {
    if (t.spawnTimer > 0) continue;
    const tx = PAD + t.x * CELL;
    const ty = PAD + t.y * CELL;
    ctx.save();
    ctx.translate(tx, ty);
    const angles: Record<Direction, number> = { up: 0, right: Math.PI / 2, down: Math.PI, left: -Math.PI / 2 };
    ctx.rotate(angles[t.dir]);
    ctx.fillStyle = t.color;
    ctx.fillRect(-CELL * 0.35, -CELL * 0.35, CELL * 0.7, CELL * 0.7);
    // Barrel
    ctx.fillRect(-CELL * 0.06, -CELL * 0.5, CELL * 0.12, CELL * 0.3);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-CELL * 0.35, -CELL * 0.35, CELL * 0.7, CELL * 0.7);
    ctx.restore();
  }

  // Bullets
  for (const b of state.bullets) {
    ctx.fillStyle = b.owner === 0 ? '#f1c40f' : '#e74c3c';
    ctx.beginPath();
    ctx.arc(PAD + b.x * CELL, PAD + b.y * CELL, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Info bar
  ctx.fillStyle = '#e9c46a';
  ctx.font = '14px monospace';
  ctx.fillText(state.message, 10, CANVAS_H - 20);

  if (state.gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(PAD, PAD + CELL * 4, CELL * 13, CELL * 3);
    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', PAD + CELL * 6.5, PAD + CELL * 5.7);
    ctx.textAlign = 'left';
  }
}

export const TankBattle: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<TankBattleState>(initTankBattle());
  const [, forceRender] = useState(0);

  useEffect(() => {
    const keys = new Set<string>();
    const handleKey = (e: KeyboardEvent) => { keys.add(e.key); e.preventDefault(); };
    const handleKeyUp = (e: KeyboardEvent) => { keys.delete(e.key); };
    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleKeyUp);

    const interval = setInterval(() => {
      const s = stateRef.current;
      const dirMap: Record<string, Direction> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
        w: 'up', s: 'down', a: 'left', d: 'right' };
      for (const [k, d] of Object.entries(dirMap)) {
        if (keys.has(k)) stateRef.current = moveTank(s, d);
      }
      if (keys.has(' ') || keys.has('j')) stateRef.current = playerShoot(stateRef.current);
      stateRef.current = tickTankBattle(stateRef.current);
      forceRender(n => n + 1);
    }, 30);

    return () => { clearInterval(interval); window.removeEventListener('keydown', handleKey); window.removeEventListener('keyup', handleKeyUp); };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawTankBattle(ctx, stateRef.current);
  });

  return (
    <div className="game-container texas-bg" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="game-header"><h2>🚜 坦克大战</h2><button className="btn-restart" onClick={() => { stateRef.current = initTankBattle(); forceRender(n => n + 1); }}>重新开始</button></div>
      <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} style={{ borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }} />
      <div style={{ color: '#aaa', fontSize: 12, marginTop: 6 }}>方向键移动 | 空格射击</div>
    </div>
  );
};
