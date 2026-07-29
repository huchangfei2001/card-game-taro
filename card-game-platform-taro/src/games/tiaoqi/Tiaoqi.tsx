import React, { useRef, useEffect, useState } from 'react';
import { initTiaoqi, selectTq, moveTq, tqAI } from './tiaoqiEngine';
import type { TqState } from './tiaoqiEngine';

const SIZE = 17;
const HEX_R = 12;
const HEX_DX = HEX_R * Math.sqrt(3);
const HEX_DY = HEX_R * 1.5;
const BOARD_CX = 225, BOARD_CY = 225;
const CW = 450, CH = 500;

const PLAYER_COLORS: Record<number, string> = { 1: '#E53935', 2: '#1E88E5', 3: '#43A047', 4: '#FB8C00', 5: '#8E24AA', 6: '#00ACC1' };

function hexToPixel(r: number, c: number): [number, number] {
  const x = BOARD_CX + (c - 8) * HEX_DX + (r % 2) * HEX_DX * 0.5;
  const y = BOARD_CY + (r - 8) * HEX_DY;
  return [x, y];
}

function isValidCell(r: number, c: number): boolean {
  if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) return false;
  const dr = Math.abs(r - 8), dc = Math.abs(c - 8);
  return dr + dc <= 8;
}

function drawTiaoqi(ctx: CanvasRenderingContext2D, state: TqState) {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, CW, CH);

  // Hex cells
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (!isValidCell(r, c)) continue;

      const [px, py] = hexToPixel(r, c);
      const dr = Math.abs(r - 8), dc = Math.abs(c - 8);

      ctx.fillStyle = '#2a2a3e';
      ctx.strokeStyle = '#444';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(px, py, HEX_R - 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Home zone shading
      if (dr + dc <= 3) {
        if (r < 8) {
          ctx.fillStyle = 'rgba(229,57,53,0.15)';
          ctx.beginPath();
          ctx.arc(px, py, HEX_R - 1, 0, Math.PI * 2);
          ctx.fill();
        } else if (r > 8) {
          ctx.fillStyle = 'rgba(30,136,229,0.15)';
          ctx.beginPath();
          ctx.arc(px, py, HEX_R - 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  // Pieces
  for (const player of state.players) {
    const color = PLAYER_COLORS[player.color];
    for (const [pr, pc] of player.pieces) {
      const [px, py] = hexToPixel(pr, pc);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(px, py, HEX_R - 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  // Selected piece highlight
  if (state.selected) {
    const [sr, sc] = state.selected;
    const [px, py] = hexToPixel(sr, sc);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(px, py, HEX_R - 1, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Valid moves
  for (const [vr, vc] of state.validMoves) {
    const [px, py] = hexToPixel(vr, vc);
    ctx.fillStyle = 'rgba(255, 215, 0, 0.45)';
    ctx.beginPath();
    ctx.arc(px, py, HEX_R / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Status bar
  const statusY = CH - 35;
  ctx.fillStyle = '#e9c46a';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(state.message, CW / 2, statusY);

  // Turn indicator
  if (state.phase === 'playing' && !state.winner) {
    const currentPlayer = state.players[state.currentPlayer];
    const color = PLAYER_COLORS[currentPlayer.color];
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(CW / 2 - 60, statusY - 6, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e9c46a';
    ctx.textAlign = 'left';
    ctx.fillText(`: ${currentPlayer.name}`, CW / 2 - 50, statusY);
  }

  ctx.textAlign = 'left';

  if (state.winner !== null) {
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(70, BOARD_CY - 25, CW - 140, 50);
    ctx.fillStyle = PLAYER_COLORS[state.players[state.winner].color];
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${state.players[state.winner].name} 获胜!`, CW / 2, BOARD_CY);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }
}

export const Tiaoqi: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<TqState>(initTiaoqi());
  const [, forceRender] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animId: number;
    const render = () => {
      drawTiaoqi(ctx, stateRef.current);
      animId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animId);
  }, []);

  useEffect(() => {
    const state = stateRef.current;
    if (state.phase !== 'playing' || state.winner !== null) return;
    const currentPlayer = state.players[state.currentPlayer];
    if (!currentPlayer.isAI) return;
    const timer = setTimeout(() => {
      const aiMove = tqAI(stateRef.current);
      if (aiMove) {
        let s = selectTq(stateRef.current, aiMove.from[0], aiMove.from[1]);
        stateRef.current = moveTq(s, aiMove.to[0], aiMove.to[1]);
        forceRender(n => n + 1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [stateRef.current.currentPlayer, stateRef.current.phase, stateRef.current.winner]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CW / rect.width;
    const scaleY = CH / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    let closestR = -1, closestC = -1, closestDist = Infinity;
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (!isValidCell(r, c)) continue;
        const [px, py] = hexToPixel(r, c);
        const dist = Math.sqrt((mx - px) ** 2 + (my - py) ** 2);
        if (dist < closestDist && dist < HEX_R + 4) {
          closestDist = dist;
          closestR = r;
          closestC = c;
        }
      }
    }

    if (closestR < 0 || closestC < 0) return;

    const state = stateRef.current;
    if (state.phase !== 'playing' || state.winner !== null) return;
    const currentPlayer = state.players[state.currentPlayer];
    if (currentPlayer.isAI) return;

    const isMove = state.validMoves.some(([r, c]) => r === closestR && c === closestC);
    if (isMove) {
      stateRef.current = moveTq(state, closestR, closestC);
    } else {
      stateRef.current = selectTq(state, closestR, closestC);
    }
    forceRender(n => n + 1);
  };

  const restart = () => {
    stateRef.current = initTiaoqi();
    forceRender(n => n + 1);
  };

  return (
    <div className="game-container texas-bg" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="game-header"><h2>🎯 跳棋</h2><button className="btn-restart" onClick={restart}>重新开始</button></div>
      <canvas ref={canvasRef} width={CW} height={CH} onClick={handleClick} style={{ borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }} />
      <div style={{ color: '#aaa', fontSize: 12, marginTop: 6 }}>点击己方棋子再点击目标位置移动</div>
    </div>
  );
};
