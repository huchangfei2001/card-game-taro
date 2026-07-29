import React, { useRef, useEffect, useState } from 'react';
import { initPuzzleBobble, setAngle, shootBobble, tickPuzzleBobble } from './puzzlebobbleEngine';
import type { PuzzleBobbleState } from './puzzlebobbleEngine';

const BUBBLE_R = 18;
const CW = 360, CH = 560;

const colors = ['#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6','#e67e22'];

function drawPuzzleBobble(ctx: CanvasRenderingContext2D, state: PuzzleBobbleState) {
  ctx.fillStyle = '#0d0d1a';
  ctx.fillRect(0, 0, CW, CH);

  // Ceiling line
  ctx.strokeStyle = '#e74c3c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 38); ctx.lineTo(CW, 38);
  ctx.stroke();

  // Bubbles
  const offsetX = (CW - 8 * BUBBLE_R * 2) / 2;
  const offsetY = 40;
  for (let r = 0; r < state.bubbles.length; r++) {
    const row = state.bubbles[r];
    const isOdd = r % 2 === 1;
    for (let c = 0; c < row.length; c++) {
      const b = row[c];
      if (b.color < 0) continue;
      const bx = offsetX + c * BUBBLE_R * 2 + BUBBLE_R + (isOdd ? BUBBLE_R : 0);
      const by = offsetY + r * BUBBLE_R * Math.sqrt(3) + BUBBLE_R;
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.arc(bx + 2, by + 2, BUBBLE_R - 1, 0, Math.PI * 2);
      ctx.fill();
      // Bubble
      const grad = ctx.createRadialGradient(bx - 3, by - 3, BUBBLE_R * 0.1, bx, by, BUBBLE_R);
      grad.addColorStop(0, 'rgba(255,255,255,0.6)');
      grad.addColorStop(0.3, colors[b.color]);
      grad.addColorStop(1, colors[b.color]);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(bx, by, BUBBLE_R - 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // Flying bubble
  if (state.flying) {
    const f = state.flying;
    const grad = ctx.createRadialGradient(f.x - 3, f.y - 3, BUBBLE_R * 0.1, f.x, f.y, BUBBLE_R);
    grad.addColorStop(0, 'rgba(255,255,255,0.6)');
    grad.addColorStop(0.3, colors[f.color]);
    grad.addColorStop(1, colors[f.color]);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(f.x, f.y, BUBBLE_R - 1, 0, Math.PI * 2);
    ctx.fill();
  }

  // Shooter
  const sx = CW / 2, sy = CH - 45;
  ctx.fillStyle = '#555';
  ctx.fillRect(sx - 2, sy - 15, 4, 20);
  // Aiming line
  const ax = sx + Math.cos(state.shooter.angle) * 50;
  const ay = sy + Math.sin(state.shooter.angle) * 50;
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(sx, sy); ctx.lineTo(ax, ay);
  ctx.stroke();
  ctx.setLineDash([]);

  // Next bubble
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(CW - 50, CH - 50, 40, 40);
  const ng = ctx.createRadialGradient(CW - 30, CH - 36, 3, CW - 30, CH - 30, BUBBLE_R);
  ng.addColorStop(0, 'rgba(255,255,255,0.6)');
  ng.addColorStop(0.3, colors[state.shooter.nextColor]);
  ng.addColorStop(1, colors[state.shooter.nextColor]);
  ctx.fillStyle = ng;
  ctx.beginPath();
  ctx.arc(CW - 30, CH - 30, BUBBLE_R - 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#aaa';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('NEXT', CW - 30, CH - 52);

  // Current bubble on shooter
  const cg = ctx.createRadialGradient(sx - 3, sy - 3, 2, sx, sy, BUBBLE_R);
  cg.addColorStop(0, 'rgba(255,255,255,0.6)');
  cg.addColorStop(0.3, colors[state.shooter.color]);
  cg.addColorStop(1, colors[state.shooter.color]);
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.arc(sx, sy, BUBBLE_R - 1, 0, Math.PI * 2);
  ctx.fill();

  // Score
  ctx.fillStyle = '#e9c46a';
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(state.message, CW / 2, 22);

  if (state.gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, CH / 2 - 30, CW, 60);
    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 28px monospace';
    ctx.fillText('GAME OVER', CW / 2, CH / 2 + 10);
  }
}

export const PuzzleBobble: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<PuzzleBobbleState>(initPuzzleBobble());
  const [, forceRender] = useState(0);
  const mouseRef = useRef({ x: CW / 2, y: CH - 40 });

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      const sx = CW / 2, sy = CH - 45;
      const angle = Math.atan2(mouseRef.current.y - sy, mouseRef.current.x - sx);
      stateRef.current = setAngle(stateRef.current, Math.max(-Math.PI / 2, Math.min(-0.2, angle)));
    };
    const handleClick = () => {
      stateRef.current = shootBobble(stateRef.current);
    };
    window.addEventListener('mousemove', handleMouse);
    window.addEventListener('click', handleClick);

    const interval = setInterval(() => {
      stateRef.current = tickPuzzleBobble(stateRef.current, CW, CH);
      forceRender(n => n + 1);
    }, 30);

    return () => { clearInterval(interval); window.removeEventListener('mousemove', handleMouse); window.removeEventListener('click', handleClick); };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawPuzzleBobble(ctx, stateRef.current);
  });

  return (
    <div className="game-container texas-bg" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="game-header"><h2>🫧 泡泡龙</h2><button className="btn-restart" onClick={() => { stateRef.current = initPuzzleBobble(); forceRender(n => n + 1); }}>重新开始</button></div>
      <canvas ref={canvasRef} width={CW} height={CH} style={{ borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.5)', cursor: 'crosshair' }} />
      <div style={{ color: '#aaa', fontSize: 12, marginTop: 6 }}>鼠标移动瞄准 | 点击发射</div>
    </div>
  );
};
