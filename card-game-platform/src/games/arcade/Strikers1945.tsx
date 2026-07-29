import React, { useRef, useEffect, useState } from 'react';
import { initS1945, movePlayer, playerShootS1945, useBomb, tickS1945 } from './strikers1945Engine';
import type { S1945State } from './strikers1945Engine';

const CW = 480, CH = 600;

function drawS1945(ctx: CanvasRenderingContext2D, state: S1945State) {
  // Background - scrolling starfield
  ctx.fillStyle = '#000511';
  ctx.fillRect(0, 0, CW, CH);

  // Stars (static for simplicity)
  const stars = 60;
  ctx.fillStyle = '#445';
  for (let i = 0; i < stars; i++) {
    const sx = ((i * 137 + 50) % CW);
    const sy = ((i * 97 + state.scrollY * 3) % CH);
    ctx.fillRect(sx, sy, 1.5, 1.5);
  }

  // Items
  for (const it of state.items) {
    ctx.fillStyle = it.type === 'power' ? '#f39c12' : it.type === 'bomb' ? '#e74c3c' : '#2ecc71';
    ctx.beginPath();
    ctx.arc(it.x, it.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(it.type[0].toUpperCase(), it.x, it.y + 3);
    ctx.textAlign = 'left';
  }

  // Enemies
  for (const e of state.enemies) {
    // Enemy body
    ctx.fillStyle = e.color;
    if (e.type === 'boss') {
      // Boss - bigger, hexagon
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3 - Math.PI / 6;
        const px = e.x + Math.cos(a) * e.size;
        const py = e.y + Math.sin(a) * e.size;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      // HP bar
      const hpW = e.size * 2;
      ctx.fillStyle = '#333';
      ctx.fillRect(e.x - hpW / 2, e.y - e.size - 8, hpW, 6);
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(e.x - hpW / 2, e.y - e.size - 8, hpW * (e.hp / e.maxHp), 6);
    } else {
      // Small/medium - diamond
      ctx.beginPath();
      ctx.moveTo(e.x, e.y - e.size);
      ctx.lineTo(e.x + e.size / 1.5, e.y);
      ctx.lineTo(e.x, e.y + e.size / 1.5);
      ctx.lineTo(e.x - e.size / 1.5, e.y);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Bullets
  for (const b of state.bullets) {
    ctx.fillStyle = b.isEnemy ? (b.size > 4 ? '#e74c3c' : '#f39c12') : '#00f0ff';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
    ctx.fill();
  }

  // Player
  const p = state.player;
  if (p.invincible > 0 && p.invincible % 4 < 2) {
    // Blinking
  } else {
    // Ship body
    ctx.fillStyle = '#f0f0f0';
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - 18);
    ctx.lineTo(p.x + 10, p.y + 5);
    ctx.lineTo(p.x, p.y + 10);
    ctx.lineTo(p.x - 10, p.y + 5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#3498db';
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - 10);
    ctx.lineTo(p.x + 6, p.y + 2);
    ctx.lineTo(p.x, p.y + 6);
    ctx.lineTo(p.x - 6, p.y + 2);
    ctx.closePath();
    ctx.fill();
    // Engine glow
    ctx.fillStyle = '#f39c12';
    ctx.beginPath();
    ctx.arc(p.x, p.y + 10, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Charge indicator
  if (p.charge > 0) {
    ctx.fillStyle = '#f39c12';
    ctx.fillRect(CW - 30, CH - 15, 20, -p.charge * 2);
  }

  // HUD
  ctx.fillStyle = '#e9c46a';
  ctx.font = 'bold 14px monospace';
  ctx.fillText(`分数: ${state.score}`, 10, 20);
  ctx.fillText(`HP: ${'♥'.repeat(Math.max(0, p.hp))}`, 10, 38);
  ctx.fillText(`炸弹: ${p.bombs}`, 10, 56);
  ctx.fillText(`威力: ${p.power}`, 10, 74);
  ctx.fillText(state.message, 10, 95);

  if (state.gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, CH / 2 - 30, CW, 60);
    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', CW / 2, CH / 2 + 12);
    ctx.textAlign = 'left';
  }
}

export const Strikers1945: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<S1945State>(initS1945());
  const [, forceRender] = useState(0);

  useEffect(() => {
    const keys = new Set<string>();
    const handleKey = (e: KeyboardEvent) => {
      keys.add(e.key);
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') e.preventDefault();
    };
    const handleKeyUp = (e: KeyboardEvent) => { keys.delete(e.key); };
    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleKeyUp);

    const interval = setInterval(() => {
      const s = stateRef.current;
      if (s.gameOver) return;
      // Movement
      let dx = 0, dy = 0;
      if (keys.has('ArrowLeft') || keys.has('a')) dx -= 4;
      if (keys.has('ArrowRight') || keys.has('d')) dx += 4;
      if (keys.has('ArrowUp') || keys.has('w')) dy -= 4;
      if (keys.has('ArrowDown') || keys.has('s')) dy += 4;
      if (dx || dy) stateRef.current = movePlayer(s, dx, dy);
      // Shooting
      if (keys.has(' ')) stateRef.current = playerShootS1945(stateRef.current);
      if (keys.has('z') || keys.has('x')) { keys.delete('z'); keys.delete('x'); stateRef.current = useBomb(stateRef.current); }

      stateRef.current = tickS1945(stateRef.current, CW, CH);
      forceRender(n => n + 1);
    }, 16);

    return () => { clearInterval(interval); window.removeEventListener('keydown', handleKey); window.removeEventListener('keyup', handleKeyUp); };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawS1945(ctx, stateRef.current);
  });

  return (
    <div className="game-container texas-bg" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="game-header"><h2>✈️ Strikes 1945</h2><button className="btn-restart" onClick={() => { stateRef.current = initS1945(); forceRender(n => n + 1); }}>重新开始</button></div>
      <canvas ref={canvasRef} width={CW} height={CH} style={{ borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }} />
      <div style={{ color: '#aaa', fontSize: 12, marginTop: 6 }}>方向键移动 | 空格射击 | Z/X 炸弹 | 按住空格蓄力</div>
    </div>
  );
};
