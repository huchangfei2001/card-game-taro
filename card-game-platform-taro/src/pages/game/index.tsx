import { View, Text, Canvas, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useState, useEffect, useRef, useCallback } from 'react'
import { TaroCard } from '../../components/TaroCard'
import { GAME_LIST } from '../../utils/gameList'
import { useUser } from '../../utils/UserContext'

// Mobile responsive helpers
const getScreenWidth = () => {
  try {
    const info = Taro.getSystemInfoSync()
    return info.windowWidth || 375
  } catch {
    return 375
  }
}

const getCardSize = () => {
  const w = getScreenWidth()
  if (w < 350) return 44
  if (w < 400) return 52
  return 60
}

const getCanvasSize = (baseWidth: number, baseHeight: number) => {
  const w = getScreenWidth()
  const scale = Math.min(1, (w - 20) / baseWidth)
  return { width: Math.round(baseWidth * scale), height: Math.round(baseHeight * scale) }
}

// Correct engine imports
import { initBj, placeBet, hit, stand } from '../../games/blackjack/blackjackEngine'
import type { BjState } from '../../games/blackjack/blackjackEngine'
import { initGame as initDdz, dealCards as ddzDeal, playCards as ddzPlay, aiPlay as ddzAi, cardKey as ddzKey } from '../../games/doudizhu/doudizhuEngine'
import type { DdzState } from '../../games/doudizhu/doudizhuEngine'
import { initChessGame, getValidMoves, makeChessMove, getChessAIMove } from '../../games/chess/chessEngine'
import type { ChessGameState } from '../../games/chess/chessEngine'
import { initTexasGame, processTexasAction, getTexasAIAction } from '../../games/texas/texasEngine'
import type { TexasGameState } from '../../games/texas/texasEngine'
import { initNn, dealNn } from '../../games/niuniu/niuniuEngine'
import type { NnState } from '../../games/niuniu/niuniuEngine'
import { initZjh, dealZjh, zjhAction, zjhAI } from '../../games/zhajinhua/zhajinhuaEngine'
import type { ZjhState } from '../../games/zhajinhua/zhajinhuaEngine'
import { initGomoku, placeGomoku, gomokuAI } from '../../games/gomoku/gomokuEngine'
import type { GomokuState } from '../../games/gomoku/gomokuEngine'
import { initOthello, getValidMoves as getOthelloValid, placeOthello, othelloAI } from '../../games/othello/othelloEngine'
import type { OthelloState } from '../../games/othello/othelloEngine'
import { initGuandan, playGdCards, gdAI } from '../../games/guandan/guandanEngine'
import type { GdState } from '../../games/guandan/guandanEngine'
import { initShengji, shengjiAI, buryCards, bidTrump } from '../../games/shengji/shengjiEngine'
import type { SjState as SjAiState } from '../../games/shengji/shengjiEngine'
import { initPaodekuai, playPdkCards, pdkAI } from '../../games/paodekuai/paodekuaiEngine'
import type { PdkState } from '../../games/paodekuai/paodekuaiEngine'
import { initSuoha, suohaBet, suohaAI } from '../../games/suoha/suohaEngine'
import type { ShState } from '../../games/suoha/suohaEngine'
import { initScMj, scmjAction, scmjAI } from '../../games/scmj/scmjEngine'
import type { ScMjState } from '../../games/scmj/scmjEngine'
import { initRiichi, riichiAction, riichiAI } from '../../games/riichimahjong/riichimahjongEngine'
import type { RiichiState } from '../../games/riichimahjong/riichimahjongEngine'
import { initGoGame, placeGoStone, getGoAIMove, passGoTurn } from '../../games/go/goEngine'
import type { GoGameState } from '../../games/go/goEngine'
import { initJunqi, selectJunqi, moveJunqi, junqiAI } from '../../games/junqi/junqiEngine'
import type { JunqiState } from '../../games/junqi/junqiEngine'
import { initTiaoqi, selectTq, moveTq, tqAI } from '../../games/tiaoqi/tiaoqiEngine'
import type { TqState } from '../../games/tiaoqi/tiaoqiEngine'
import { initLudo, rollDice, movePiece, ludoAI } from '../../games/ludo/ludoEngine'
import type { LudoState } from '../../games/ludo/ludoEngine'
import { initTet, startTet, moveTet, rotateTet, hardDropTet, dropTet, spawnTet } from '../../games/arcade/tetrisEngine'
import type { TetState } from '../../games/arcade/tetrisEngine'
import { initTankBattle, moveTank, playerShoot, tickTankBattle } from '../../games/arcade/tankbattleEngine'
import type { TankBattleState, Direction as TankDir, Bullet as TBullet } from '../../games/arcade/tankbattleEngine'
import { initPacman, setPacmanDir, tickPacman } from '../../games/arcade/pacmanEngine'
import type { PacManState, Direction as PacDir, GhostName } from '../../games/arcade/pacmanEngine'
import { initPuzzleBobble, setAngle, shootBobble, tickPuzzleBobble } from '../../games/arcade/puzzlebobbleEngine'
import type { Bobble, PuzzleBobbleState } from '../../games/arcade/puzzlebobbleEngine'
import { initS1945, movePlayer, playerShootS1945, tickS1945, useBomb as s1945UseBomb } from '../../games/arcade/strikers1945Engine'
import type { S1945State, Bullet as SBullet, Enemy as SEnemy, Item as SItem } from '../../games/arcade/strikers1945Engine'
import { initGravitySnake, setGravity, tickGravitySnake, pauseGravitySnake, restartGravitySnake, type GravitySnakeState } from '../../games/arcade/gravitySnakeEngine'
import { initPinball, startDrawing, updateDrawing, endDrawing, tickPinball, clearLines, pausePinball, nextLevel, restartPinball, type PinballState } from '../../games/arcade/pinballEngine'
import type { Card } from '../../types'
import './index.scss'

// ============================================================================
// Utility
// ============================================================================

const RESTART_COLORS = [
  '#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7',
  '#DDA0DD','#98D8C8','#F7DC6F','#BB8FCE','#85C1E9',
]

function suitEmoji(suit: string): string {
  switch (suit) {
    case 'spades': return '♠';
    case 'hearts': return '♥';
    case 'diamonds': return '♦';
    case 'clubs': return '♣';
    case 'joker': return '🃏';
    default: return '?';
  }
}

function rankStr(rank: number): string {
  if (rank === 1) return 'A';
  if (rank === 11) return 'J';
  if (rank === 12) return 'Q';
  if (rank === 13) return 'K';
  if (rank === 16) return '小王';
  if (rank === 17) return '大王';
  return String(rank);
}

// Color helpers
function hexToRgb(hex: string): [number, number, number] {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

function darken(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgb(${Math.max(0,r-amount)},${Math.max(0,g-amount)},${Math.max(0,b-amount)})`;
}

// Keep using consistent Direction union for tank controls
type TankControlKey = 'u' | 'd' | 'l' | 'r' | 'fire';
const TANK_DIR_MAP: Record<TankControlKey, TankDir> = { u:'up', d:'down', l:'left', r:'right' };

// ============================================================================
// TETRIS - Full Canvas Rendering
// ============================================================================

function TetrisCanvasGame({ onRestart }: { onRestart: () => void }) {
  const [, force] = useState(0)
  const sRef = useRef<TetState>(startTet(initTet()))

  // Auto-drop every 500ms
  useEffect(() => {
    const id = setInterval(() => {
      const s = sRef.current;
      if (!s || s.gameOver) return;
      const d = dropTet(s);
      sRef.current = d === s ? spawnTet(d) : d;
      force(n => n + 1);
    }, Math.max(100, 500 - (sRef.current.level - 1) * 30));
    return () => clearInterval(id);
  }, []);

  // Draw once
  useEffect(() => {
    const fn = () => {
      try {
        const query = Taro.createSelectorQuery();
        query.select('#tetCanvas').node().exec((res: any) => {
          if (!res?.[0]?.node) return;
          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          const W = canvas.width, H = canvas.height;
          const BOARD_OX = 20, BOARD_OY = 40, CELL = 22;
          const COLS = 10, ROWS = 20;
          const SIDEX = BOARD_OX + COLS * CELL + 30;
          const COLORS = ['#333','#00f0f0','#f0f000','#a000f0','#00f000','#f00000','#0000f0','#f0a000'];

          // Background
          ctx.fillStyle = '#0a0a0a';
          ctx.fillRect(0, 0, W, H);

          // Board border
          ctx.strokeStyle = '#555';
          ctx.lineWidth = 2;
          ctx.strokeRect(BOARD_OX, BOARD_OY, COLS * CELL, ROWS * CELL);

          // Board cells
          const b = sRef.current.board;
          for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
              const v = b[r]?.[c] ?? 0;
              ctx.fillStyle = v === 0 ? '#111' : COLORS[v];
              ctx.fillRect(BOARD_OX + c * CELL + 1, BOARD_OY + r * CELL + 1, CELL - 2, CELL - 2);
            }
          }

          // Current piece + shadow
          const cur = sRef.current.current;
          if (cur && !sRef.current.gameOver) {
            // Drop shadow
            let sy = cur.y;
            while (sy + 1 < ROWS && !cur.shape.some((rr, ri) => rr.some(v => v && b[sy + 1 + ri]?.[cur.x + ri] ? false : true))) {
              let valid = true;
              for (let ri = 0; ri < cur.shape.length; ri++) {
                for (let ci = 0; ci < cur.shape[ri].length; ci++) {
                  if (cur.shape[ri][ci] && (b[sy + 1 + ri]?.[cur.x + ci])) valid = false;
                }
              }
              if (!valid) break;
              sy++;
            }
            if (sy !== cur.y) {
              ctx.globalAlpha = 0.2;
              for (let ri = 0; ri < cur.shape.length; ri++) {
                for (let ci = 0; ci < cur.shape[ri].length; ci++) {
                  if (cur.shape[ri][ci]) {
                    ctx.fillStyle = COLORS['IOT SZJL'.indexOf(cur.type) + 1] || '#fff';
                    ctx.fillRect(BOARD_OX + (cur.x + ci) * CELL + 1, BOARD_OY + (sy + ri) * CELL + 1, CELL - 2, CELL - 2);
                  }
                }
              }
              ctx.globalAlpha = 1;
            }

            // Piece itself
            for (let ri = 0; ri < cur.shape.length; ri++) {
              for (let ci = 0; ci < cur.shape[ri].length; ci++) {
                if (cur.shape[ri][ci]) {
                  ctx.fillStyle = COLORS[cur.type === 'I' ? 1 : cur.type === 'O' ? 2 : cur.type === 'T' ? 3 : cur.type === 'S' ? 4 : cur.type === 'Z' ? 5 : cur.type === 'J' ? 6 : 7];
                  ctx.fillRect(BOARD_OX + (cur.x + ci) * CELL + 1, BOARD_OY + (cur.y + ri) * CELL + 1, CELL - 2, CELL - 2);
                }
              }
            }
          }

          // Right sidebar
          ctx.fillStyle = '#fff';
          ctx.font = '16px sans-serif';

          // NEXT preview
          ctx.fillText('NEXT:', SIDEX, BOARD_OY + 30);
          const nextType = sRef.current.next;
          const nextShapes: Record<string, number[][][]> = {
            I: [[[0,0,0,0],[1,1,1,1]]], O: [[[1,1],[1,1]]], T: [[[0,1,0],[1,1,1]]],
            S: [[[0,1,1],[1,1,0]]], Z: [[[1,1,0],[0,1,1]]], J: [[[1,0,0],[1,1,1]]], L: [[[0,0,1],[1,1,1]]],
          };
          const ns = nextShapes[nextType]?.[0] || [[1]];
          for (let ri = 0; ri < ns.length; ri++) {
            for (let ci = 0; ci < ns[ri].length; ci++) {
              if (ns[ri][ci]) {
                ctx.fillStyle = COLORS[nextType === 'I' ? 1 : nextType === 'O' ? 2 : nextType === 'T' ? 3 : nextType === 'S' ? 4 : nextType === 'Z' ? 5 : nextType === 'J' ? 6 : 7];
                ctx.fillRect(SIDEX + ci * 14 + 5, BOARD_OY + 40 + ri * 14, 12, 12);
              }
            }
          }

          // Score / Lines / Level
          ctx.fillStyle = '#ddd'; ctx.font = '14px sans-serif';
          ctx.fillText(`Score: ${sRef.current.score}`, SIDEX, BOARD_OY + 120);
          ctx.fillText(`Lines: ${sRef.current.lines}`, SIDEX, BOARD_OY + 140);
          ctx.fillText(`Level: ${sRef.current.level}`, SIDEX, BOARD_OY + 160);

          // Center current preview (below board)
          ctx.fillText('Current:', SIDEX, BOARD_OY + ROWS * CELL + 30);
          const ct = sRef.current.current;
          if (ct) {
            for (let ri = 0; ri < ct.shape.length; ri++) {
              for (let ci = 0; ci < ct.shape[ri].length; ci++) {
                if (ct.shape[ri][ci]) {
                  ctx.fillStyle = COLORS[ct.type === 'I' ? 1 : ct.type === 'O' ? 2 : ct.type === 'T' ? 3 : ct.type === 'S' ? 4 : ct.type === 'Z' ? 5 : ct.type === 'J' ? 6 : 7];
                  ctx.fillRect(SIDEX + ci * 14, BOARD_OY + ROWS * CELL + 40 + ri * 14, 12, 12);
                }
              }
            }
          }

          // Game Over overlay
          if (sRef.current.gameOver) {
            ctx.fillStyle = 'rgba(0,0,0,0.75)';
            ctx.fillRect(BOARD_OX, BOARD_OY, COLS * CELL, ROWS * CELL);
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 28px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('游戏结束!', SIDEX - 10, BOARD_OY + (ROWS * CELL) / 2 - 20);
            ctx.font = '18px sans-serif';
            ctx.fillText(`分数: ${sRef.current.score}`, SIDEX - 10, BOARD_OY + (ROWS * CELL) / 2 + 15);
            ctx.fillStyle = '#ff6b6b';
            ctx.font = '16px sans-serif';
            ctx.fillText('点击重来', SIDEX - 10, BOARD_OY + (ROWS * CELL) / 2 + 50);
            ctx.textAlign = 'left';
          }

          // Controls hint
          ctx.fillStyle = '#888'; ctx.font = '12px sans-serif';
          ctx.fillText('◀▶旋转  ▼下落', 10, H - 10);
        });
      } catch (e) { /* gracefully skip */ }
    };
    fn();
    const id = setInterval(fn, 50);
    return () => clearInterval(id);
  }, [force]);

  const tap = useCallback((dir: string) => {
    const s = sRef.current;
    if (!s || s.gameOver) return;
    if (dir === 'l') sRef.current = moveTet(s, -1, 0);
    else if (dir === 'r') sRef.current = moveTet(s, 1, 0);
    else if (dir === 'u') sRef.current = rotateTet(s, 1);
    else if (dir === 'd') sRef.current = dropTet(s);
    else if (dir === 'fire') sRef.current = spawnTet(hardDropTet(s));
  }, []);

  return (
    <View className='game-body arcade-bg'>
      <View className='info-bar'><Text className='gold-text'>🧱 俄罗斯方块</Text></View>
      {(() => { const cs = getCanvasSize(240, 480); return <Canvas id='tetCanvas' className='arcade-canvas' style={`width:${cs.width}px;height:${cs.height}px;background:#0a0a0a;border:2px solid #333`} /> })()}
      <View className='touch-controls'>
        <View className='ctrl-row'><View className='ctrl-btn' onTap={tap.bind(null,'u')}>⟳</View></View>
        <View className='ctrl-row'>
          <View className='ctrl-btn' onTap={tap.bind(null,'l')}>◀</View>
          <View className='ctrl-btn ctrl-fire' onTap={tap.bind(null,'fire')}>⬇</View>
          <View className='ctrl-btn' onTap={tap.bind(null,'r')}>▶</View>
        </View>
        <View className='ctrl-row'><View className='ctrl-btn btn-game btn-gold' onTap={onRestart}><Text>重来</Text></View><View className='ctrl-btn' onTap={tap.bind(null,'d')}>▼</View></View>
      </View>
    </View>
  );
}

// ============================================================================
// TANK BATTLE - Full Canvas Rendering
// ============================================================================

function TankCanvasGame({ onRestart }: { onRestart: () => void }) {
  const [, force] = useState(0)
  const sRef = useRef<TankBattleState>(initTankBattle())
  const keysRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const id = setInterval(() => {
      const s = sRef.current;
      if (!s || s.gameOver) return;
      const ks = keysRef.current;
      let ns: TankBattleState = s;
      if (ks.has('u')) ns = moveTank(ns, 'up');
      if (ks.has('d')) ns = moveTank(ns, 'down');
      if (ks.has('l')) ns = moveTank(ns, 'left');
      if (ks.has('r')) ns = moveTank(ns, 'right');
      ns = tickTankBattle(ns);
      sRef.current = ns;
      force(n => n + 1);
    }, 50);
    return () => clearInterval(id);
  }, []);

  const drawTank = (ctx: CanvasRenderingContext2D, x: number, y: number, dir: TankDir, color: string, alive: boolean) => {
    if (!alive) return;
    const px = Math.round(x * 32) + 16, py = Math.round(y * 32) + 16;
    // Body
    ctx.fillStyle = color;
    ctx.fillRect(px - 12, py - 12, 24, 24);
    // Tracks
    ctx.fillStyle = '#333';
    ctx.fillRect(px - 14, py - 10, 4, 20);
    ctx.fillRect(px + 10, py - 10, 4, 20);
    // Turret barrel direction
    ctx.fillStyle = darken(color, 30);
    ctx.fillRect(px - 4, py - 4, 8, 8);
    if (dir === 'up' || dir === 'down') ctx.fillRect(px - 3, dir === 'up' ? py - 16 : py + 8, 6, 8);
    else ctx.fillRect(dir === 'left' ? px - 16 : px + 8, py - 3, 8, 6);
  };

  useEffect(() => {
    const fn = () => {
      try {
        const q = Taro.createSelectorQuery();
        q.select('#tankCanvas').node().exec((res: any) => {
          if (!res?.[0]?.node) return;
          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          const c = sRef.current;
          const TILE = 32;
          ctx.fillStyle = '#1a1a1a';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Map
          const tiles: Record<number, string> = { 1: '#c49159', 2: '#888', 3: '#3388cc', 4: '#22aa22' };
          for (let r = 0; r < 13; r++) {
            for (let col = 0; col < 13; col++) {
              const t = c.map[r]?.[col] ?? 0;
              if (t > 0) {
                ctx.fillStyle = tiles[t] || '#333';
                if (t === 1) { ctx.fillRect(col * TILE, r * TILE, TILE, TILE); ctx.strokeStyle='#a07040'; ctx.strokeRect(col*TILE+1,r*TILE+1,TILE-2,TILE-2); }
                else if (t === 2) { ctx.fillRect(col * TILE, r * TILE, TILE, TILE); ctx.strokeStyle='#aaa'; ctx.strokeRect(col*TILE,r*TILE,TILE,TILE); }
                else if (t === 3) { ctx.globalAlpha=0.5; ctx.fillRect(col * TILE, r * TILE, TILE, TILE); ctx.globalAlpha=1; }
                else if (t === 4) { ctx.globalAlpha=0.7; ctx.fillRect(col*TILE,r*TILE,TILE,TILE); ctx.globalAlpha=1; }
              }
            }
          }

          // Base eagle at bottom center
          if (c.baseAlive) {
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            const ex = 6 * TILE + 16, ey = 12 * TILE + 16;
            ctx.moveTo(ex, ey - 14);
            ctx.lineTo(ex + 14, ey + 10);
            ctx.lineTo(ex - 14, ey + 10);
            ctx.closePath();
            ctx.fill();
          }

          // Bullets
          for (const b of c.bullets) {
            ctx.fillStyle = b.owner === 0 ? '#ffff00' : '#ff4444';
            ctx.beginPath(); ctx.arc(b.x * TILE, b.y * TILE, 3, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = b.owner === 0 ? '#ff8800' : '#ff0000';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(b.x * TILE, b.y * TILE);
            const dv: Record<string,[number,number]>={up:[0,-8],down:[0,8],left:[-8,0],right:[8,0]};
            const dr=dv[b.dir]||[0,0];
            ctx.lineTo(b.x*TILE+dr[0],b.y*TILE+dr[1]);
            ctx.stroke();
          }

          // Tanks
          drawTank(ctx, c.player.x, c.player.y, c.player.dir, '#4CAF50', c.player.lives > 0);
          for (const e of c.tanks) drawTank(ctx, e.x, e.y, e.dir, e.color, e.spawnTimer <= 0);

          // Power-ups
          for (const pu of c.powerUps) {
            ctx.fillStyle = pu.type === 'star' ? '#ffd700' : pu.type === 'life' ? '#4CAF50' : '#ff9800';
            ctx.beginPath(); ctx.arc(pu.x * TILE + 16, pu.y * TILE + 16, 8, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#000'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(pu.type[0].toUpperCase(), pu.x * TILE + 16, pu.y * TILE + 20); ctx.textAlign = 'left';
          }

          // HUD
          ctx.fillStyle = '#000'; ctx.fillRect(canvas.width - 140, 2, 138, 50);
          ctx.fillStyle = '#ff4444'; ctx.font = 'bold 14px monospace';
          ctx.fillText(`生命:${c.player.lives} 分数:${c.score}`, canvas.width - 136, 22);
          ctx.fillStyle = '#ffd700';
          ctx.fillText(`剩余:${c.enemiesLeft} Lv.${c.level}`, canvas.width - 136, 42);

          if (c.gameOver) {
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#ffd700'; ctx.font = 'bold 32px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(c.message, canvas.width / 2, canvas.height / 2 - 10);
            ctx.fillStyle = '#ff6b6b'; ctx.font = '18px sans-serif';
            ctx.fillText('点击重来重新开始', canvas.width / 2, canvas.height / 2 + 30);
            ctx.textAlign = 'left';
          }
        });
      } catch(e) {}
    };
    fn(); const id = setInterval(fn, 50);
    return () => clearInterval(id);
  }, [force]);

  // Touch controls: hold-direction auto-move
  const dirTap = (dir: TankDir | 'fire') => {
    if (dir === 'fire') sRef.current = playerShoot(sRef.current);
    else {
      keysRef.current.add(dir);
      sRef.current = moveTank(sRef.current, dir);
      setTimeout(() => keysRef.current.delete(dir), 200);
    }
  };

  return (
    <View className='game-body arcade-bg'>
      <View className='info-bar'><Text className='gold-text'>🔫 坦克大战</Text></View>
      {(() => { const cs = getCanvasSize(416, 450); return <Canvas id='tankCanvas' className='arcade-canvas' style={`width:${cs.width}px;height:${cs.height}px;background:#1a1a1a;border:2px solid #333`} /> })()}
      <View className='touch-controls'>
        <View className='ctrl-row'><View className='ctrl-btn' onTap={() => dirTap('u')}>▲</View></View>
        <View className='ctrl-row'>
          <View className='ctrl-btn' onTap={() => dirTap('l')}>◀</View>
          <View className='ctrl-btn ctrl-fire' onTap={() => dirTap('fire')}>●</View>
          <View className='ctrl-btn' onTap={() => dirTap('r')}>▶</View>
        </View>
        <View className='ctrl-row'>
          <View className='ctrl-btn btn-game btn-gold' onTap={onRestart}><Text>重来</Text></View>
          <View className='ctrl-btn' onTap={() => dirTap('d')}>▼</View>
        </View>
      </View>
    </View>
  );
}

// ============================================================================
// PAC-MAN - Full Canvas Rendering
// ============================================================================

function PacmanCanvasGame({ onRestart }: { onRestart: () => void }) {
  const [, force] = useState(0)
  const sRef = useRef<PacManState>(initPacman())

  useEffect(() => {
    const id = setInterval(() => {
      const s = sRef.current;
      if (!s || s.gameOver) return;
      sRef.current = tickPacman(s);
      force(n => n + 1);
    }, 40);
    return () => clearInterval(id);
  }, []);

  const drawWalls = (ctx: CanvasRenderingContext2D, map: PacManState['map'], offX: number, offY: number, sz: number) => {
    ctx.fillStyle = '#0033aa';
    for (let r = 0; r < map.length; r++) {
      for (let c = 0; c < map[r].length; c++) {
        if (map[r][c] === 0) ctx.fillRect(offX + c * sz, offY + r * sz, sz, sz);
      }
    }
  }

  useEffect(() => {
    const fn = () => {
      try {
        const q = Taro.createSelectorQuery();
        q.select('#pacCanvas').node().exec((res: any) => {
          if (!res?.[0]?.node) return;
          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          const s = sRef.current;
          const sz = Math.floor(canvas.width / 28);
          const offX = Math.floor((canvas.width - 28 * sz) / 2);
          const offY = 40;
          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Walls
          drawWalls(ctx, s.map, offX, offY, sz);
          // Dot paths background
          ctx.fillStyle = 'rgba(0,0,30,1)';
          for (let r = 0; r < s.map.length; r++) {
            for (let c = 0; c < s.map[r].length; c++) {
              if (s.map[r][c] !== 0) ctx.fillRect(offX + c*sz, offY+r*sz, sz, sz);
            }
          }

          // Dots
          for (let r = 0; r < s.dots.length; r++) {
            for (let c = 0; c < s.dots[r].length; c++) {
              if (s.dots[r][c]) { ctx.fillStyle = '#ffb852'; ctx.beginPath(); ctx.arc(offX+c*sz+sz/2,offY+r*sz+sz/2,2,0,Math.PI*2); ctx.fill(); }
            }
          }
          // Power pellets
          for (let r = 0; r < s.powerPellets.length; r++) {
            for (let c = 0; c < s.powerPellets[r].length; c++) {
              if (s.powerPellets[r][c]) {
                ctx.fillStyle = (Date.now() % 500 < 250) ? '#fff' : '#ffa500';
                ctx.beginPath(); ctx.arc(offX+c*sz+sz/2, offY+r*sz+sz/2, sz*0.25, 0, Math.PI*2); ctx.fill();
              }
            }
          }

          // Pac-Man
          const pm = s.pacman;
          const pxm = offX + Math.round(pm.x) * sz + sz / 2;
          const pym = offY + Math.round(pm.y) * sz + sz / 2;
          const mouthAngle = 0.3 + (pm.mouth % 1) * 0.5;
          const dirAngle: Record<string, number> = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };
          const da = dirAngle[pm.dir] || 0;
          ctx.fillStyle = '#ffff00';
          ctx.beginPath();
          ctx.arc(pxm, pym, sz * 0.45, da + mouthAngle * Math.PI, da + (2 - mouthAngle) * Math.PI);
          ctx.lineTo(pxm, pym);
          ctx.fill();

          // Ghosts
          const ghostColors: Record<GhostName, string> = { blinky: '#ff0000', pinky: '#ffb8ff', inky: '#00ffff', clyde: '#ffb852' };
          for (const g of s.ghosts) {
            const gx = offX + Math.round(g.x) * sz + sz / 2;
            const gy = offY + Math.round(g.y) * sz + sz / 2;
            const gc = g.mode === 'frightened' ? '#2222ff' : (g.mode === 'eaten' ? '#888' : ghostColors[g.name]);
            ctx.fillStyle = gc;
            ctx.beginPath();
            ctx.arc(gx, gy - sz * 0.1, sz * 0.45, Math.PI, 0);
            ctx.lineTo(gx + sz * 0.45, gy + sz * 0.35);
            // Feet
            const feetSeg = sz * 0.9 / 3;
            for (let f = 0; f < 3; f++) {
              ctx.quadraticCurveTo(gx + sz * 0.45 - (f + 0.5) * feetSeg, gy + sz * 0.1, gx + sz * 0.45 - (f + 1) * feetSeg, gy + sz * 0.35);
            }
            ctx.closePath();
            ctx.fill();
            // Eyes
            if (g.mode !== 'frightened') {
              ctx.fillStyle = '#fff';
              ctx.beginPath(); ctx.arc(gx - sz * 0.15, gy - sz * 0.15, sz * 0.12, 0, Math.PI * 2); ctx.fill();
              ctx.beginPath(); ctx.arc(gx + sz * 0.15, gy - sz * 0.15, sz * 0.12, 0, Math.PI * 2); ctx.fill();
              ctx.fillStyle = '#00f';
              const eyeOffV: Record<string,[number,number]>={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
              const eo = eyeOffV[g.dir] || [0,0];
              ctx.beginPath(); ctx.arc(gx - sz * 0.15 + eo[0]*3, gy - sz * 0.15 + eo[1]*3, sz * 0.05, 0, Math.PI * 2); ctx.fill();
              ctx.beginPath(); ctx.arc(gx + sz * 0.15 + eo[0]*3, gy - sz * 0.15 + eo[1]*3, sz * 0.05, 0, Math.PI * 2); ctx.fill();
            } else {
              ctx.fillStyle = '#f0c0c0'; ctx.font = `${sz * 0.2}px sans-serif`; ctx.textAlign = 'center';
              ctx.fillText('xx', gx, gy); ctx.textAlign = 'left';
            }
          }

          // HUD
          ctx.fillStyle = '#000'; ctx.fillRect(0, canvas.height - 30, canvas.width, 30);
          ctx.fillStyle = '#fff'; ctx.font = '12px monospace';
          ctx.fillText(`Score: ${s.score}  Life: ${'❤️'.repeat(Math.max(0, s.lives))}`, offX, canvas.height - 10);

          if (s.gameOver) {
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.fillRect(offX, offY, 28 * sz, 31 * sz);
            ctx.fillStyle = '#ffd700'; ctx.font = 'bold 24px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('游戏结束!', offX + 14 * sz, offY + 15 * sz - 10);
            ctx.fillStyle = '#ff6b6b'; ctx.font = '16px sans-serif';
            ctx.fillText('点击重来重新开始', offX + 14 * sz, offY + 15 * sz + 20);
            ctx.textAlign = 'left';
          }
        });
      } catch(e) {}
    };
    fn(); const id = setInterval(fn, 50);
    return () => clearInterval(id);
  }, [force]);

  const dirTap = (dir: PacDir) => {
    sRef.current = setPacmanDir(sRef.current, dir);
  };

  return (
    <View className='game-body arcade-bg'>
      <View className='info-bar'><Text className='gold-text'>😮 吃豆人</Text></View>
      {(() => { const cs = getCanvasSize(364, 400); return <Canvas id='pacCanvas' className='arcade-canvas' style={`width:${cs.width}px;height:${cs.height}px;background:#000;border:2px solid #0033aa`} /> })()}
      <View className='touch-controls'>
        <View className='ctrl-row'><View className='ctrl-btn' onTap={() => dirTap('up')}>▲</View></View>
        <View className='ctrl-row'>
          <View className='ctrl-btn' onTap={() => dirTap('l')}>◀</View>
          <View className='ctrl-btn' style={{background:'transparent',border:'none'}} />
          <View className='ctrl-btn' onTap={() => dirTap('r')}>▶</View>
        </View>
        <View className='ctrl-row'>
          <View className='ctrl-btn btn-game btn-gold' onTap={onRestart}><Text>重来</Text></View>
          <View className='ctrl-btn' onTap={() => dirTap('down')}>▼</View>
        </View>
      </View>
    </View>
  );
}

// ============================================================================
// PUZZLE BOBBLE - Full Canvas Rendering
// ============================================================================

function PuzzleBobbleCanvasGame({ onRestart }: { onRestart: () => void }) {
  const [, force] = useState(0)
  const sRef = useRef<PuzzleBobbleState>(initPuzzleBobble())

  useEffect(() => {
    const id = setInterval(() => {
      const s = sRef.current;
      if (!s || s.gameOver) return;
      sRef.current = tickPuzzleBobble(s, 240, 480);
      force(n => n + 1);
    }, 60);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const fn = () => {
      try {
        const q = Taro.createSelectorQuery();
        q.select('#bobbleCanvas').node().exec((res: any) => {
          if (!res?.[0]?.node) return;
          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          const colors = ['#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6','#1abc9c'];
          const s = sRef.current;
          const BUBBLE_R = 12;
          const CANVAS_W = 240, CANVAS_H = 480;
          const offsetX = (CANVAS_W - 8 * BUBBLE_R * 2) / 2;
          const offsetY = 30;

          ctx.fillStyle = '#000022';
          ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

          // Grid bubbles
          const getBubblePos = (row: number, col: number) => {
            const isOdd = row % 2 === 1;
            return { x: offsetX + col * BUBBLE_R * 2 + BUBBLE_R + (isOdd ? BUBBLE_R : 0), y: offsetY + row * BUBBLE_R * Math.sqrt(3) + BUBBLE_R };
          };

          for (let r = 0; r < s.bubbles.length; r++) {
            for (let c = 0; c < s.bubbles[r].length; c++) {
              const bubble = s.bubbles[r][c];
              const pos = getBubblePos(r, c);
              ctx.fillStyle = colors[bubble.color] || RESTART_COLORS[bubble.color % RESTART_COLORS.length];
              ctx.beginPath(); ctx.arc(pos.x, pos.y, BUBBLE_R - 1, 0, Math.PI * 2); ctx.fill();
              // Highlight
              ctx.fillStyle = 'rgba(255,255,255,0.3)';
              ctx.beginPath(); ctx.arc(pos.x - 3, pos.y - 3, BUBBLE_R * 0.35, 0, Math.PI * 2); ctx.fill();
            }
          }

          // Flying bubble
          if (s.flying) {
            ctx.fillStyle = colors[s.flying.color];
            ctx.beginPath(); ctx.arc(s.flying.x, s.flying.y, BUBBLE_R, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.beginPath(); ctx.arc(s.flying.x - 3, s.flying.y - 3, BUBBLE_R * 0.35, 0, Math.PI * 2); ctx.fill();
          }

          // Arrow line showing aim direction
          const shooter = s.shooter;
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(shooter.x, shooter.y);
          ctx.lineTo(shooter.x + Math.cos(shooter.angle) * 200, shooter.y + Math.sin(shooter.angle) * 200);
          ctx.stroke();
          ctx.setLineDash([]);

          // Shooter platform
          ctx.fillStyle = '#444';
          ctx.fillRect(offsetX - 10, CANVAS_H - 70, CANVAS_W - offsetX * 2 + 10, 60);

          // Current bubble at shooter
          ctx.fillStyle = colors[shooter.color];
          ctx.beginPath(); ctx.arc(shooter.x, shooter.y, BUBBLE_R, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();

          // Next bubble indicator
          ctx.fillStyle = colors[shooter.nextColor];
          ctx.beginPath(); ctx.arc(CANVAS_W - 30, CANVAS_H - 50, BUBBLE_R * 0.6, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#aaa'; ctx.font = '10px sans-serif';
          ctx.fillText('NEXT', CANVAS_W - 44, CANVAS_H - 36);

          // HUD
          ctx.fillStyle = '#fff'; ctx.font = 'bold 16px monospace';
          ctx.fillText(`分数: ${s.score}`, 10, 20);

          if (s.gameOver) {
            ctx.fillStyle = 'rgba(0,0,0,0.75)';
            ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
            ctx.fillStyle = '#ffd700'; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('游戏结束!', CANVAS_W / 2, CANVAS_H / 2 - 10);
            ctx.fillStyle = '#ff6b6b'; ctx.font = '16px sans-serif';
            ctx.fillText('点击重来重新开始', CANVAS_W / 2, CANVAS_H / 2 + 25);
            ctx.textAlign = 'left';
          }
        });
      } catch(e) {}
    };
    fn(); const id = setInterval(fn, 50);
    return () => clearInterval(id);
  }, [force]);

  const tap = (dir: string) => {
    const s = sRef.current;
    if (!s || s.gameOver) return;
    if (dir === 'l') sRef.current = setAngle(s, (s.angle || 0) - 0.12);
    else if (dir === 'r') sRef.current = setAngle(s, (s.angle || 0) + 0.12);
    else if (dir === 'fire') sRef.current = shootBobble(s);
  };

  return (
    <View className='game-body arcade-bg'>
      <View className='info-bar'><Text className='gold-text'>🫧 泡泡龙</Text></View>
      {(() => { const cs = getCanvasSize(240, 480); return <Canvas id='bobbleCanvas' className='arcade-canvas' style={`width:${cs.width}px;height:${cs.height}px;background:#000022;border:2px solid #333`} /> })()}
      <View className='touch-controls'>
        <View className='ctrl-row'><View className='ctrl-btn btn-game btn-gold' onTap={onRestart}><Text>重来</Text></View></View>
        <View className='ctrl-row'>
          <View className='ctrl-btn' onTap={() => tap('l')}>◀</View>
          <View className='ctrl-btn ctrl-fire' onTap={() => tap('fire')}>●</View>
          <View className='ctrl-btn' onTap={() => tap('r')}>▶</View>
        </View>
      </View>
    </View>
  );
}

// ============================================================================
// STRIKERS 1945 - Full Canvas Rendering
// ============================================================================

function strikeDarken(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgb(${Math.max(0, r - 40)},${Math.max(0, g - 40)},${Math.max(0, b - 40)})`;
}

function Strikers1945CanvasGame({ onRestart }: { onRestart: () => void }) {
  const [, force] = useState(0)
  const sRef = useRef<S1945State>(initS1945())

  useEffect(() => {
    const id = setInterval(() => {
      const s = sRef.current;
      if (!s || s.gameOver) return;
      sRef.current = tickS1945(s, 400, 640);
      force(n => n + 1);
    }, 40);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const fn = () => {
      try {
        const q = Taro.createSelectorQuery();
        q.select('#strikersCanvas').node().exec((res: any) => {
          if (!res?.[0]?.node) return;
          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          const W = canvas.width, H = canvas.height;
          const s = sRef.current;
          
          // Sky background
          const grd = ctx.createLinearGradient(0, 0, 0, H);
          grd.addColorStop(0, '#1a3a5c');
          grd.addColorStop(1, '#2a5a8c');
          ctx.fillStyle = grd;
          ctx.fillRect(0, 0, W, H);

          // Scrolling clouds
          ctx.fillStyle = 'rgba(255,255,255,0.15)';
          const cloudY = ((Date.now() / 50 + s.scrollY * 2) % (H + 60)) - 30;
          for (let i = 0; i < 5; i++) {
            const cx = ((i * 97 + Date.now() / 80) % (W + 80)) - 40;
            ctx.beginPath();
            ctx.arc(cx, cloudY + i * 40, 20 + (i % 3) * 8, 0, Math.PI * 2);
            ctx.fill();
          }

          const drawPlane = (x: number, y: number, size: number, color: string, isBoss: boolean) => {
            ctx.fillStyle = color;
            // Body
            ctx.beginPath();
            ctx.ellipse(x, y, size * 0.3, size * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();
            // Wings
            ctx.fillRect(x - size * 0.8, y - size * 0.1, size * 1.6, size * 0.2);
            // Tail
            ctx.fillRect(x - size * 0.15, y + size * 0.5, size * 0.3, size * 0.3);
            if (isBoss) {
              ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 2;
              ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.stroke();
              ctx.strokeStyle = '#ff4444'; ctx.lineWidth = 1;
              ctx.beginPath(); ctx.arc(x, y, size + 5, 0, Math.PI * 2); ctx.stroke();
            }
          };

          const drawEnemyShip = (e: SEnemy) => {
            const hpRatio = e.hp / e.maxHp;
            drawPlane(e.x, e.y, e.size, e.color, e.type === 'boss');
            // HP bar
            ctx.fillStyle = '#333';
            ctx.fillRect(e.x - e.size, e.y - e.size - 8, e.size * 2, 4);
            ctx.fillStyle = hpRatio > 0.5 ? '#4CAF50' : hpRatio > 0.25 ? '#ff9800' : '#f44336';
            ctx.fillRect(e.x - e.size, e.y - e.size - 8, e.size * 2 * hpRatio, 4);
          };

          // Player
          const p = s.player;
          if (p.invincible > 0 && Math.floor(p.invincible / 4) % 2 === 0) {
            ctx.globalAlpha = 0.4;
          }
          drawPlane(p.x, p.y, 15, '#3498db', false);
          // Engine flame
          ctx.fillStyle = '#ff6600';
          ctx.beginPath(); ctx.moveTo(p.x - 4, p.y + 12); ctx.lineTo(p.x, p.y + 20 + Math.random() * 8); ctx.lineTo(p.x + 4, p.y + 12); ctx.fill();
          ctx.globalAlpha = 1;

          // Enemies
          for (const e of s.enemies) drawEnemyShip(e);

          // Player bullets
          ctx.fillStyle = '#ffff00';
          ctx.shadowColor = '#ff8800'; ctx.shadowBlur = 6;
          for (const b of s.bullets) {
            if (b.isEnemy) continue;
            ctx.fillStyle = b.size > 5 ? '#ffffff' : '#ffff00';
            ctx.fillRect(b.x - b.size / 2, b.y - b.size, b.size, b.size * 2);
          }
          ctx.shadowBlur = 0;

          // Enemy bullets
          for (const b of s.bullets) {
            if (!b.isEnemy) continue;
            ctx.fillStyle = '#ff4444';
            ctx.beginPath(); ctx.arc(b.x, b.y, b.size / 2, 0, Math.PI * 2); ctx.fill();
          }

          // Items
          for (const it of s.items) {
            ctx.fillStyle = it.type === 'power' ? '#4CAF50' : it.type === 'bomb' ? '#ff9800' : '#ffd700';
            ctx.beginPath(); ctx.arc(it.x, it.y, 6, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#000'; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(it.type[0].toUpperCase(), it.x, it.y + 3); ctx.textAlign = 'left';
          }

          // HUD
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.fillRect(0, 0, W, 28);
          ctx.fillStyle = '#ffd700'; ctx.font = 'bold 14px monospace';
          ctx.fillText(`SCORE: ${s.score}`, 10, 20);
          ctx.fillStyle = '#4CAF50'; ctx.font = '12px monospace';
          ctx.fillText(`HP:${'♥'.repeat(Math.max(0, p.hp))} Bomb:${'💣'.repeat(p.bombs)} Pow:${'⭐'.repeat(p.power)}`, W - 240, 20);

          if (s.gameOver) {
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = '#ffd700'; ctx.font = 'bold 32px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', W / 2, H / 2 - 15);
            ctx.fillStyle = '#ff6b6b'; ctx.font = '16px sans-serif';
            ctx.fillText(`最终分数: ${s.score}`, W / 2, H / 2 + 15);
            ctx.fillStyle = '#fff'; ctx.font = '14px sans-serif';
            ctx.fillText('点击重来重新开始', W / 2, H / 2 + 50);
            ctx.textAlign = 'left';
          }
        });
      } catch(e) {}
    };
    fn(); const id = setInterval(fn, 50);
    return () => clearInterval(id);
  }, [force]);

  const move = (dx: number, dy: number) => {
    sRef.current = movePlayer(sRef.current, dx, dy);
  };

  const tap = (dir: string) => {
    const s = sRef.current;
    if (!s || s.gameOver) return;
    if (dir === 'l') move(-5, 0);
    else if (dir === 'r') move(5, 0);
    else if (dir === 'u') move(0, -5);
    else if (dir === 'd') move(0, 5);
    else if (dir === 'fire') sRef.current = playerShootS1945(s);
    else if (dir === 'bomb') sRef.current = s1945UseBomb(s);
  };

  return (
    <View className='game-body arcade-bg'>
      <View className='info-bar'><Text className='gold-text'>🛩️ 打击者1945</Text></View>
      {(() => { const cs = getCanvasSize(400, 600); return <Canvas id='strikersCanvas' className='arcade-canvas' style={`width:${cs.width}px;height:${cs.height}px;background:#1a3a5c;border:2px solid #333`} /> })()}
      <View className='touch-controls'>
        <View className='ctrl-row'><View className='ctrl-btn btn-game btn-gold' onTap={onRestart}><Text>重来</Text></View></View>
        <View className='ctrl-row'>
          <View className='ctrl-btn' onTap={() => tap('l')}>◀</View>
          <View className='ctrl-btn ctrl-fire' onTap={() => tap('fire')}>●</View>
          <View className='ctrl-btn' onTap={() => tap('r')}>▶</View>
        </View>
        <View className='ctrl-row'>
          <View className='ctrl-btn' onTap={() => tap('bomb')}>💣</View>
          <View className='ctrl-btn' onTap={() => tap('d')}>▼</View>
          <View className='ctrl-btn' onTap={() => tap('u')}>▲</View>
        </View>
      </View>
    </View>
  );
}

// ============================================================================
// GRAVITY SNAKE - Gravity-controlled snake game (Enhanced UI)
// ============================================================================

function GravitySnakeGame({ onRestart }: { onRestart: () => void }) {
  const [, force] = useState(0)
  const sRef = useRef<GravitySnakeState>(initGravitySnake())
  const particlesRef = useRef<{x: number, y: number, vx: number, vy: number, life: number, color: string}[]>([])
  const frameRef = useRef(0)

  useEffect(() => {
    const id = setInterval(() => {
      const s = sRef.current;
      if (!s || s.gameOver) return;
      sRef.current = tickGravitySnake(s);
      frameRef.current++;
      if (frameRef.current % 5 === 0) {
        particlesRef.current = particlesRef.current.filter(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.life--;
          return p.life > 0;
        });
      }
      force(n => n + 1);
    }, 100);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const fn = () => {
      try {
        const q = Taro.createSelectorQuery();
        q.select('#snakeCanvas').node().exec((res: any) => {
          if (!res?.[0]?.node) return;
          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          const W = canvas.width, H = canvas.height;
          const s = sRef.current;
          const GW = s.gridWidth, GH = s.gridHeight;
          const CELL = Math.min(W / GW, H / GH) - 3;
          const OX = (W - GW * (CELL + 3)) / 2;
          const OY = 50;

          // Gradient background
          const grad = ctx.createLinearGradient(0, 0, 0, H);
          grad.addColorStop(0, '#0f0f23');
          grad.addColorStop(1, '#1a1a3e');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, W, H);

          // Animated grid background
          ctx.strokeStyle = 'rgba(100, 100, 150, 0.15)';
          ctx.lineWidth = 1;
          for (let i = 0; i <= GW; i++) {
            ctx.beginPath();
            ctx.moveTo(OX + i * (CELL + 3), OY);
            ctx.lineTo(OX + i * (CELL + 3), OY + GH * (CELL + 3));
            ctx.stroke();
          }
          for (let i = 0; i <= GH; i++) {
            ctx.beginPath();
            ctx.moveTo(OX, OY + i * (CELL + 3));
            ctx.lineTo(OX + GW * (CELL + 3), OY + i * (CELL + 3));
            ctx.stroke();
          }

          // Particles
          particlesRef.current.forEach(p => {
            ctx.globalAlpha = p.life / 30;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
          });
          ctx.globalAlpha = 1;

          // Pulsing food with glow
          const pulse = Math.sin(frameRef.current * 0.15) * 0.2 + 1;
          ctx.shadowColor = '#ff4757';
          ctx.shadowBlur = 15 * pulse;
          ctx.fillStyle = '#ff4757';
          ctx.beginPath();
          ctx.arc(
            OX + s.food.x * (CELL + 3) + CELL / 2 + 1.5,
            OY + s.food.y * (CELL + 3) + CELL / 2 + 1.5,
            (CELL / 2) * pulse, 0, Math.PI * 2
          );
          ctx.fill();
          ctx.shadowBlur = 0;

          // Snake body with gradient and glow
          s.snake.forEach((seg, i) => {
            const t = i / s.snake.length;
            const r = Math.floor(78 + t * 100);
            const g = Math.floor(205 - t * 100);
            const b = Math.floor(196 - t * 50);
            
            if (i === 0) {
              ctx.shadowColor = '#4ecdc4';
              ctx.shadowBlur = 12;
              ctx.fillStyle = '#4ecdc4';
            } else {
              ctx.shadowBlur = 0;
              ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            }
            
            ctx.beginPath();
            ctx.roundRect(
              OX + seg.x * (CELL + 3) + 1.5,
              OY + seg.y * (CELL + 3) + 1.5,
              CELL, CELL, 4
            );
            ctx.fill();
            
            // Eyes on head
            if (i === 0) {
              ctx.fillStyle = '#fff';
              ctx.beginPath();
              ctx.arc(OX + seg.x * (CELL + 3) + CELL / 2, OY + seg.y * (CELL + 3) + CELL / 3, 3, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#000';
              ctx.beginPath();
              ctx.arc(OX + seg.x * (CELL + 3) + CELL / 2 + 1, OY + seg.y * (CELL + 3) + CELL / 3, 1.5, 0, Math.PI * 2);
              ctx.fill();
            }
          });
          ctx.shadowBlur = 0;

          // Title bar with gradient
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(0, 0, W, 40);
          ctx.fillStyle = '#ffd93d';
          ctx.font = 'bold 18px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('🐍 重力贪吃蛇', W / 2, 27);
          ctx.textAlign = 'left';

          // Score panel
          ctx.fillStyle = 'rgba(255,255,255,0.1)';
          ctx.roundRect(10, 45, 100, 60, 8);
          ctx.fill();
          ctx.fillStyle = '#4ecdc4';
          ctx.font = 'bold 14px Arial';
          ctx.fillText('得分', 18, 62);
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 20px Arial';
          ctx.fillText(`${s.score}`, 18, 85);

          // Level panel
          ctx.fillStyle = 'rgba(255,255,255,0.1)';
          ctx.beginPath();
          ctx.roundRect(W - 110, 45, 100, 60, 8);
          ctx.fill();
          ctx.fillStyle = '#ffd93d';
          ctx.font = 'bold 14px Arial';
          ctx.textAlign = 'right';
          ctx.fillText('等级', W - 18, 62);
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 20px Arial';
          ctx.fillText(`${s.level}`, W - 18, 85);
          ctx.textAlign = 'left';

          // Gravity direction indicator
          const arrowMap = { up: '⬆', down: '⬇', left: '⬅', right: '➡' };
          ctx.fillStyle = 'rgba(255,255,255,0.15)';
          ctx.beginPath();
          ctx.roundRect(W / 2 - 40, H - 35, 80, 28, 14);
          ctx.fill();
          ctx.fillStyle = '#ffd93d';
          ctx.font = 'bold 20px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(arrowMap[s.gravity], W / 2, H - 15);
          ctx.textAlign = 'left';

          // Game over screen
          if (s.gameOver) {
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.fillRect(0, 0, W, H);
            
            // Animated game over text
            const goPulse = Math.sin(frameRef.current * 0.1) * 5;
            ctx.fillStyle = '#ff4757';
            ctx.font = `bold ${36 + goPulse}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('💥 游戏结束', W / 2, H / 2 - 30);
            
            ctx.fillStyle = '#fff';
            ctx.font = '22px Arial';
            ctx.fillText(`最终得分: ${s.score}`, W / 2, H / 2 + 15);
            ctx.fillText(`到达等级: ${s.level}`, W / 2, H / 2 + 45);
            
            ctx.fillStyle = '#4ecdc4';
            ctx.font = '18px Arial';
            ctx.fillText('点击"重来"按钮重新开始', W / 2, H / 2 + 85);
            ctx.textAlign = 'left';
          }
        });
      } catch (e) { console.error('Snake draw error:', e); }
    };
    fn();
  });

  const tap = (dir: 'up' | 'down' | 'left' | 'right') => {
    sRef.current = setGravity(sRef.current, dir);
    const s = sRef.current;
    for (let i = 0; i < 5; i++) {
      const head = s.snake[0];
      const GW = s.gridWidth, GH = s.gridHeight;
      const CELL = Math.min(360 / GW, 500 / GH) - 3;
      const OX = (360 - GW * (CELL + 3)) / 2;
      const OY = 50;
      particlesRef.current.push({
        x: OX + head.x * (CELL + 3) + CELL / 2,
        y: OY + head.y * (CELL + 3) + CELL / 2,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 30,
        color: '#ffd93d'
      });
    }
  };

  const restart = () => {
    sRef.current = restartGravitySnake();
    particlesRef.current = [];
    force(n => n + 1);
  };

  return (
    <View className='game-body arcade-bg'>
      <View className='info-bar'><Text className='gold-text'>🐍 重力贪吃蛇</Text></View>
      {(() => {
        const cs = getCanvasSize(360, 500)
        return <Canvas id='snakeCanvas' className='arcade-canvas' style={`width:${cs.width}px;height:${cs.height}px;background:#0f0f23;border-radius:12px;border:3px solid #4ecdc4;box-shadow:0 0 20px rgba(78,205,196,0.3)`} />
      })()}
      <View className='touch-controls snake-controls'>
        <View className='ctrl-row'>
          <View className='ctrl-btn btn-game btn-gold' onTap={restart}><Text>🔄 重来</Text></View>
        </View>
        <View className='ctrl-row'>
          <View className='ctrl-btn ctrl-sn' onTap={() => tap('up')}><Text>⬆️</Text></View>
        </View>
        <View className='ctrl-row'>
          <View className='ctrl-btn ctrl-sn' onTap={() => tap('left')}><Text>⬅️</Text></View>
          <View className='ctrl-btn ctrl-sn' onTap={() => tap('down')}><Text>⬇️</Text></View>
          <View className='ctrl-btn ctrl-sn' onTap={() => tap('right')}><Text>➡️</Text></View>
        </View>
        <View className='ctrl-hint ctrl-hint-glow'><Text>点击方向按钮改变重力方向</Text></View>
      </View>
    </View>
  );
}

// ============================================================================
// FINGER PINBALL - Draw lines for ball to bounce
// ============================================================================

// ============================================================================
// FINGER PINBALL - Draw lines for ball to bounce (Enhanced UI)
// ============================================================================

function PinballGame({ onRestart }: { onRestart: () => void }) {
  const [, force] = useState(0)
  const sRef = useRef<PinballState>(initPinball(1))
  const lastTouch = useRef<{ x: number; y: number } | null>(null)
  const trailRef = useRef<{x: number, y: number}[]>([])
  const frameRef = useRef(0)

  useEffect(() => {
    const id = setInterval(() => {
      const s = sRef.current;
      if (!s || s.gameOver || s.won) return;
      sRef.current = tickPinball(s);
      
      // Add trail
      trailRef.current.push({ x: s.ball.x, y: s.ball.y });
      if (trailRef.current.length > 15) trailRef.current.shift();
      
      frameRef.current++;
      force(n => n + 1);
    }, 30);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const fn = () => {
      try {
        const q = Taro.createSelectorQuery();
        q.select('#pinballCanvas').node().exec((res: any) => {
          if (!res?.[0]?.node) return;
          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          const W = canvas.width, H = canvas.height;
          const s = sRef.current;

          // Dynamic gradient background
          const time = frameRef.current * 0.01;
          const grad = ctx.createLinearGradient(0, 0, Math.sin(time) * W, H);
          grad.addColorStop(0, '#1a1a2e');
          grad.addColorStop(0.5, '#16213e');
          grad.addColorStop(1, '#0f0f23');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, W, H);

          // Animated grid background
          ctx.strokeStyle = 'rgba(100, 100, 150, 0.1)';
          ctx.lineWidth = 1;
          for (let x = 0; x < W; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x + Math.sin(time + x * 0.01) * 20, H);
            ctx.stroke();
          }

          // Start zone with glow
          ctx.shadowColor = '#2ecc71';
          ctx.shadowBlur = 10;
          ctx.fillStyle = 'rgba(46, 204, 113, 0.3)';
          ctx.beginPath();
          ctx.roundRect(s.startPoint.x - 25, s.startPoint.y - 15, 50, 30, 8);
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#2ecc71';
          ctx.font = 'bold 12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('🚀 起点', s.startPoint.x, s.startPoint.y + 5);
          ctx.textAlign = 'left';

          // End zone with pulsing glow
          const pulse = Math.sin(frameRef.current * 0.1) * 0.3 + 1;
          ctx.shadowColor = '#f39c12';
          ctx.shadowBlur = 25 * pulse;
          ctx.fillStyle = `rgba(243, 156, 18, ${0.8 * pulse})`;
          ctx.beginPath();
          ctx.arc(s.endPoint.x, s.endPoint.y, 30 * pulse, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 14px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('🎯', s.endPoint.x, s.endPoint.y + 5);
          ctx.textAlign = 'left';

          // Ball trail
          trailRef.current.forEach((pos, i) => {
            const alpha = i / trailRef.current.length * 0.5;
            const size = (i / trailRef.current.length) * s.ball.radius;
            ctx.fillStyle = `rgba(255, 107, 107, ${alpha})`;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
            ctx.fill();
          });

          // Drawn lines with neon glow
          s.lines.forEach((line, i) => {
            ctx.shadowColor = i % 2 === 0 ? '#4ecdc4' : '#a29bfe';
            ctx.shadowBlur = 8;
            ctx.strokeStyle = i % 2 === 0 ? '#4ecdc4' : '#a29bfe';
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(line.start.x, line.start.y);
            ctx.lineTo(line.end.x, line.end.y);
            ctx.stroke();
          });
          ctx.shadowBlur = 0;

          // Current drawing line
          if (s.drawing && s.currentLine) {
            ctx.strokeStyle = '#ffd93d';
            ctx.lineWidth = 4;
            ctx.setLineDash([8, 8]);
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(s.currentLine.start.x, s.currentLine.start.y);
            ctx.lineTo(s.currentLine.end.x, s.currentLine.end.y);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Drawing point glow
            ctx.shadowColor = '#ffd93d';
            ctx.shadowBlur = 15;
            ctx.fillStyle = '#ffd93d';
            ctx.beginPath();
            ctx.arc(s.currentLine.start.x, s.currentLine.start.y, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }

          // Ball with gradient and glow
          ctx.shadowColor = '#ff6b6b';
          ctx.shadowBlur = 15;
          const ballGrad = ctx.createRadialGradient(
            s.ball.x - 3, s.ball.y - 3, 0,
            s.ball.x, s.ball.y, s.ball.radius
          );
          ballGrad.addColorStop(0, '#fff');
          ballGrad.addColorStop(0.3, '#ff6b6b');
          ballGrad.addColorStop(1, '#c0392b');
          ctx.fillStyle = ballGrad;
          ctx.beginPath();
          ctx.arc(s.ball.x, s.ball.y, s.ball.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Score and level panels
          ctx.fillStyle = 'rgba(0,0,0,0.4)';
          ctx.beginPath();
          ctx.roundRect(10, 8, 80, 35, 8);
          ctx.fill();
          ctx.fillStyle = '#4ecdc4';
          ctx.font = 'bold 11px Arial';
          ctx.fillText('分数', 18, 22);
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 16px Arial';
          ctx.fillText(`${s.score}`, 18, 38);

          ctx.fillStyle = 'rgba(0,0,0,0.4)';
          ctx.beginPath();
          ctx.roundRect(W - 90, 8, 80, 35, 8);
          ctx.fill();
          ctx.fillStyle = '#ffd93d';
          ctx.font = 'bold 11px Arial';
          ctx.textAlign = 'right';
          ctx.fillText('关卡', W - 18, 22);
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 16px Arial';
          ctx.fillText(`${s.level}`, W - 18, 38);
          ctx.textAlign = 'left';

          // Game over / Win screen
          if (s.gameOver || s.won) {
            ctx.fillStyle = 'rgba(0,0,0,0.85)';
            ctx.fillRect(0, 0, W, H);

            const winPulse = Math.sin(frameRef.current * 0.15) * 3;
            ctx.fillStyle = s.won ? '#4ecdc4' : '#ff6b6b';
            ctx.font = `bold ${38 + winPulse}px Arial`;
            ctx.textAlign = 'center';
            ctx.shadowColor = s.won ? '#4ecdc4' : '#ff6b6b';
            ctx.shadowBlur = 20;
            ctx.fillText(s.won ? '🎉 过关!' : '💥 失败!', W / 2, H / 2 - 40);
            ctx.shadowBlur = 0;

            ctx.fillStyle = '#fff';
            ctx.font = '22px Arial';
            ctx.fillText(`得分: ${s.score}`, W / 2, H / 2 + 5);
            ctx.fillText(`关卡: ${s.level}`, W / 2, H / 2 + 35);

            ctx.fillStyle = s.won ? '#ffd93d' : '#aaa';
            ctx.font = '16px Arial';
            ctx.fillText(s.won ? '点击"下一关"继续挑战' : '点击"重来"再试一次', W / 2, H / 2 + 80);
            ctx.textAlign = 'left';
          }
        });
      } catch (e) { console.error('Pinball draw error:', e); }
    };
    fn();
  });

  const handleTouchStart = (e: any) => {
    const t = e.touches[0];
    if (!t) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = t.clientX - rect.left;
    const y = t.clientY - rect.top;
    lastTouch.current = { x, y };
    sRef.current = startDrawing(sRef.current, { x, y });
    force(n => n + 1);
  };

  const handleTouchMove = (e: any) => {
    const t = e.touches[0];
    if (!t || !lastTouch.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = t.clientX - rect.left;
    const y = t.clientY - rect.top;
    sRef.current = updateDrawing(sRef.current, { x, y });
    force(n => n + 1);
  };

  const handleTouchEnd = () => {
    if (lastTouch.current) {
      sRef.current = endDrawing(sRef.current);
      lastTouch.current = null;
      force(n => n + 1);
    }
  };

  const clearLines = () => {
    sRef.current = clearLines(sRef.current);
    trailRef.current = [];
    force(n => n + 1);
  };

  const restart = () => {
    sRef.current = restartPinball();
    trailRef.current = [];
    force(n => n + 1);
  };

  const next = () => {
    sRef.current = nextLevel(sRef.current);
    trailRef.current = [];
    force(n => n + 1);
  };

  const s = sRef.current;
  return (
    <View className='game-body arcade-bg'>
      <View className='info-bar'><Text className='gold-text'>🎱 指尖弹球</Text></View>
      {(() => {
        const cs = getCanvasSize(360, 600)
        return <Canvas
          id='pinballCanvas'
          className='arcade-canvas'
          style={`width:${cs.width}px;height:${cs.height}px;background:#1a1a2e;border-radius:12px;border:3px solid #4ecdc4;box-shadow:0 0 25px rgba(78,205,196,0.4)`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
      })()}
      <View className='touch-controls pinball-controls'>
        <View className='ctrl-row'>
          <View className='ctrl-btn btn-game btn-gold' onTap={restart}><Text>🔄 重来</Text></View>
          <View className='ctrl-btn btn-game' onTap={clearLines}><Text>🗑️ 清线</Text></View>
          {s.won && <View className='ctrl-btn btn-game btn-green' onTap={next}><Text>➡️ 下一关</Text></View>}
        </View>
        <View className='ctrl-hint ctrl-hint-glow'><Text>👆 在屏幕上画线，让球弹到黄色目标</Text></View>
      </View>
    </View>
  );
}

// ============================================================================
// ARCADE COMBINATOR
// ============================================================================

function ArcadeGame({ gameId, onRestart }: { gameId: string; onRestart: () => void }) {
  switch (gameId) {
    case 'tetris': return <TetrisCanvasGame onRestart={onRestart} />;
    case 'tank': return <TankCanvasGame onRestart={onRestart} />;
    case 'pacman': return <PacmanCanvasGame onRestart={onRestart} />;
    case 'puzzlebobble': return <PuzzleBobbleCanvasGame onRestart={onRestart} />;
    case 'strikers1945': return <Strikers1945CanvasGame onRestart={onRestart} />;
    case 'gravitysnake': return <GravitySnakeGame onRestart={onRestart} />;
    case 'pinball': return <PinballGame onRestart={onRestart} />;
    default: return <View className='game-body arcade-bg'><Text className='game-msg'>{gameId} - 开发中</Text></View>;
  }
}

// ============================================================================
// BLACKJACK
// ============================================================================

function BlackjackGame({ onRestart }: { onRestart: () => void }) {
  const [state, setState] = useState<BjState>(initBj())
  const [betAmt, setBetAmt] = useState(50)
  const handleBet = () => { const s = placeBet(state, betAmt); if (s !== state) setState(s) }
  return (
    <View className='game-body card-bg'>
      <View className='game-header-bar'><Text className='game-title'>🂡 21点</Text></View>
      {state.message && <Text className='game-msg'>{state.message}</Text>}
      <View className='info-bar'><Text className='gold-text'>筹码: ${state.chips}</Text></View>
      <View className='opponent-area'>
        <Text className='ai-name'>庄家 {['finished','dealer_turn'].includes(state.phase) ? `(${state.dealer.score})` : '(?)'}</Text>
        <View className='cards-row'>{state.dealer.cards.map((c, i) => (
          <TaroCard key={i} suit={c.suit} rank={c.rank} size={getCardSize()} faceDown={i === 1 && state.phase === 'playing'} />
        ))}</View>
      </View>
      <View className='player-area'>
        <Text className='player-name-row'>你 ({state.player.score})</Text>
        <View className='cards-row'>{state.player.cards.map((c, i) => (
          <TaroCard key={i} suit={c.suit} rank={c.rank} size={getCardSize()} />
        ))}</View>
      </View>
      <View className='action-buttons'>
        {state.phase === 'betting' && <View className='btn-game btn-gold' onTap={handleBet}><Text>下注 ${betAmt}</Text></View>}
        {state.phase === 'playing' && (
          <>
            <View className='btn-game btn-green' onTap={() => setState(hit(state))}><Text>要牌</Text></View>
            <View className='btn-game btn-gray' onTap={() => setState(stand(state))}><Text>停牌</Text></View>
          </>
        )}
        {state.phase === 'finished' && (
          <>
            <View className='btn-game btn-gold' onTap={() => setState({ ...initBj(), chips: state.chips })}><Text>新一局</Text></View>
            <View className='btn-game btn-blue' onTap={onRestart}><Text>重来</Text></View>
          </>
        )}
      </View>
    </View>
  )
}

// ============================================================================
// DOU DI ZHU
// ============================================================================

function DouDiZhuGame({ onRestart }: { onRestart: () => void }) {
  const [state, setState] = useState<DdzState>(initDdz())
  const [selected, setSelected] = useState<Set<string>>(new Set())
  useEffect(() => {
    if (state.phase !== 'playing' || state.currentPlayer === 0) return
    const timer = setTimeout(() => {
      const cp = state.currentPlayer
      const free = !state.lastPlayCardIds || state.lastPlayCardIds.length === 0
      const result = ddzAi(state.players[cp].cards, state.lastPlayType, state.lastPlayRank, free)
      if (result?.length) { const s = ddzPlay(state, cp, result.map(ddzKey)); if (s) setState(s) }
      else { const s = ddzPlay(state, cp, []); if (s) setState(s) }
    }, 800)
    return () => clearTimeout(timer)
  }, [state])
  const toggleCard = (c: Card) => {
    if (state.currentPlayer !== 0 || state.phase !== 'playing') return
    setSelected(prev => { const n = new Set(prev); const k = ddzKey(c); if (n.has(k)) n.delete(k); else n.add(k); return n })
  }
  return (
    <View className='game-body ddz-bg'>
      <View className='game-header-bar'><Text className='game-title'>🃏 斗地主</Text></View>
      {state.message && <Text className='game-msg'>{state.message}</Text>}
      <View className='ddz-top-row'>
        {[2, 1].map(i => (
          <View key={i} className={`ai-player ${state.currentPlayer === i ? 'ai-active' : ''}`}>
            <View className='ai-info'><Text>{state.players[i].name}</Text>
              {state.players[i].isLandlord && <Text className='landlord-badge'>地主</Text>}</View>
            <Text className='card-count'>🂠 ×{state.players[i].cards.length}</Text>
          </View>
        ))}
      </View>
      {state.phase === 'bidding' && (
        <View className='action-buttons'>
          <View className='btn-game btn-gold' onTap={() => { setState(ddzDeal(state, 0)); setSelected(new Set()) }}><Text>叫地主</Text></View>
          <View className='btn-game btn-gray' onTap={() => {
            const r = Math.random(); setState(ddzDeal(state, r < 0.4 ? 1 : r < 0.7 ? 2 : 0)); setSelected(new Set())
          }}><Text>不叫</Text></View>
        </View>
      )}
      {state.lastPlayCardIds?.length > 0 && <Text className='last-play-info'>上家出了 {state.lastPlayCardIds.length} 张</Text>}
      {state.phase === 'playing' && (
        <View className='hand-area'>
          <View className='player-info-row'>
            <View><Text className='player-name'>{state.players[0].name}</Text>
              {state.players[0].isLandlord && <Text className='landlord-badge'>地主</Text>}</View>
            {state.currentPlayer === 0 && <Text className='turn-indicator'>轮到你</Text>}
          </View>
          <View className='cards-row'>{state.players[0].cards.map(c => (
            <TaroCard key={ddzKey(c)} suit={c.suit} rank={c.rank} size={getCardSize()}
              onClick={() => toggleCard(c)} selected={selected.has(ddzKey(c))} />
          ))}</View>
          <View className='action-buttons'>
            <View className={`btn-game btn-gold ${selected.size === 0 ? 'btn-disabled' : ''}`} onTap={() => {
              if (state.currentPlayer !== 0) return; const s = ddzPlay(state, 0, [...selected]); if (s) { setState(s); setSelected(new Set()) }
            }}><Text>出牌 ({selected.size})</Text></View>
            <View className={`btn-game btn-gray ${!state.lastPlayCardIds?.length ? 'btn-disabled' : ''}`} onTap={() => {
              const s = ddzPlay(state, 0, []); if (s) { setState(s); setSelected(new Set()) }
            }}><Text>不出</Text></View>
          </View>
        </View>
      )}
      {state.phase === 'finished' && (
        <View className='action-buttons'>
          <View className='btn-game btn-gold' onTap={onRestart}><Text>再来一局</Text></View>
        </View>
      )}
    </View>
  )
}

// ============================================================================
// GUANDAN - Standalone Component with Guandan-specific logic
// ============================================================================

function GuandanGame({ onRestart }: { onRestart: () => void }) {
  const [state, setState] = useState<GdState>(() => initGuandan())
  const [selected, setSelected] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!state || state.phase === 'finished' || state.currentPlayer === 0) return
    const timer = setTimeout(() => {
      try {
        const ai = gdAI(state, state.currentPlayer)
        const cardsToPlay: Card[] = []
        if (Array.isArray(ai)) {
          for (const idx of ai as number[]) cardsToPlay.push(state.players[state.currentPlayer].cards[idx])
        } else if ((ai as any)?.keys) {
          for (const idx of (ai as any).keys) cardsToPlay.push(state.players[state.currentPlayer].cards[idx])
        }
        const result = playGdCards(state, state.currentPlayer, cardsToPlay)
        if (result) setState(result)
      } catch {}
    }, 700)
    return () => clearTimeout(timer)
  }, [state])

  const human = state?.players?.[0]
  const cards: Card[] = human?.cards || []
  const isTurn = state?.currentPlayer === 0

  return (
    <View className='game-body card-bg'>
      <View className='game-header-bar'><Text className='game-title'>🎴 掼蛋</Text></View>
      {state?.message && <Text className='game-msg'>{state.message}</Text>}
      <View className='ddz-top-row'>
        {state?.players?.slice(1)?.map((p: GdState['players'][number], i: number) => (
          <View key={i} className={`ai-player ${state.currentPlayer === i + 1 ? 'ai-active' : ''}`}>
            <Text className='ai-name'>{p.name} {p.team === 0 ? '(我队)' : '(敌队)'}</Text>
            <Text className='card-count'>🂠 ×{p.cards?.length || 0}</Text>
          </View>
        ))}
      </View>
      {state?.lastPlayCardIds?.length > 0 && <Text className='last-play-info'>上家出了牌</Text>}
      {human && (
        <View className='hand-area'>
          <View className='player-info-row'>
            <Text className='player-name'>{human.name || '你'}</Text>
            <Text style={{color:'#aaa'}}>{"队" + (human.team === 0 ? '(我)' : '(敌)')}</Text>
            {isTurn && <Text className='turn-indicator'>轮到你</Text>}
          </View>
          {/* Sort cards by value for display */}
          <View className='cards-row'>{cards.sort((a,b) => a.rank - b.rank).map((c: Card, i: number) => (
            <TaroCard key={`${c.suit}_${c.rank}`} suit={c.suit} rank={c.rank} size={getCardSize()}
              onClick={() => setSelected(prev => { const n = new Set(prev); if (n.has(i)) n.delete(i); else n.add(i); return n })}
              selected={selected.has(i)} />
          ))}</View>
          <View className='action-buttons'>
            <View className={`btn-game btn-gold ${!isTurn || selected.size === 0 ? 'btn-disabled' : ''}`} onTap={() => {
              if (!isTurn) return
              const selCards = [...selected].sort().map(i => cards[i]).filter(Boolean)
              const r = playGdCards(state, 0, selCards); if (r) { setState(r); setSelected(new Set()) }
            }}><Text>出牌 ({selected.size})</Text></View>
            <View className={`btn-game btn-gray ${!isTurn ? 'btn-disabled' : ''}`} onTap={() => {
              if (!isTurn) return; const r = playGdCards(state, 0, []); if (r) { setState(r); setSelected(new Set()) }
            }}><Text>不出</Text></View>
          </View>
        </View>
      )}
      <View className='action-buttons'>
        {state?.phase === 'finished' && <View className='btn-game btn-gold' onTap={onRestart}><Text>再来一局</Text></View>}
      </View>
    </View>
  )
}

// ============================================================================
// PAODEKUAI - Standalone Component
// ============================================================================

function PaodekuaiGame({ onRestart }: { onRestart: () => void }) {
  const [state, setState] = useState<PdkState>(() => initPaodekuai())
  const [selected, setSelected] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!state || state.phase === 'finished' || state.currentPlayer === 0) return
    const timer = setTimeout(() => {
      try {
        const ai = pdkAI(state, state.currentPlayer)
        const cardsToPlay: Card[] = []
        if (Array.isArray(ai)) {
          for (const idx of ai as number[]) cardsToPlay.push(state.players[state.currentPlayer].cards[idx])
        } else if ((ai as any)?.cards) {
          for (const idx of (ai as any).cards) cardsToPlay.push(state.players[state.currentPlayer].cards[idx])
        }
        const result = playPdkCards(state, cardsToPlay, 0)
        if (result) setState(result)
      } catch {}
    }, 700)
    return () => clearTimeout(timer)
  }, [state])

  const human = state?.players?.[0]
  const cards: Card[] = human?.cards || []
  const isTurn = state?.currentPlayer === 0

  return (
    <View className='game-body card-bg'>
      <View className='game-header-bar'><Text className='game-title'>🏃 跑得快</Text></View>
      {state?.message && <Text className='game-msg'>{state.message}</Text>}
      <View className='ddz-top-row'>
        {state?.players?.slice(1)?.map((p: PdkState['players'][number], i: number) => (
          <View key={i} className={`ai-player ${state.currentPlayer === i + 1 ? 'ai-active' : ''}`}>
            <Text className='ai-name'>{p.name}</Text>
            <Text className='card-count'>🂠 ×{p.cards?.length || 0}</Text>
          </View>
        ))}
      </View>
      {human && (
        <View className='hand-area'>
          <View className='player-info-row'>
            <Text className='player-name'>{human.name || '你'}</Text>
            {isTurn && <Text className='turn-indicator'>轮到你</Text>}
          </View>
          <View className='cards-row'>{cards.sort((a,b) => a.rank - b.rank).map((c: Card, i: number) => (
            <TaroCard key={`${c.suit}_${c.rank}`} suit={c.suit} rank={c.rank} size={getCardSize()}
              onClick={() => setSelected(prev => { const n = new Set(prev); if (n.has(i)) n.delete(i); else n.add(i); return n })}
              selected={selected.has(i)} />
          ))}</View>
          <View className='action-buttons'>
            <View className={`btn-game btn-gold ${!isTurn || selected.size === 0 ? 'btn-disabled' : ''}`} onTap={() => {
              if (!isTurn) return
              const selCards = [...selected].sort().map(i => cards[i]).filter(Boolean)
              const r = playPdkCards(state, selCards, 0); if (r) { setState(r); setSelected(new Set()) }
            }}><Text>出牌 ({selected.size})</Text></View>
            <View className={`btn-game btn-gray ${!isTurn ? 'btn-disabled' : ''}`} onTap={() => {
              if (!isTurn) return; const r = playPdkCards(state, [], 0); if (r) { setState(r); setSelected(new Set()) }
            }}><Text>不出</Text></View>
          </View>
        </View>
      )}
      <View className='action-buttons'>
        {state?.phase === 'finished' && <View className='btn-game btn-gold' onTap={onRestart}><Text>再来一局</Text></View>}
      </View>
    </View>
  )
}

// ============================================================================
// SHENGJI - With Play Phase Handling
// ============================================================================

function ShengjiGame({ onRestart }: { onRestart: () => void }) {
  const [state, setState] = useState<SjState>(() => initShengji())
  const [burying, setBurying] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState<Set<number>>(new Set())

  // Apply AI during non-human turns
  useEffect(() => {
    if (!state || state.currentPlayer === 0 || state.phase === 'finished') return
    const timer = setTimeout(() => {
      try {
        if (state.phase === 'playing') {
          // In playing phase, apply cards from shuffled hand automatically
          const cp = state.currentPlayer
          const p = state.players[cp]
          if (p.cards.length > 0) {
            const playedCard = p.cards[p.cards.length - 1]
            // For multi-card plays, find consecutive same-suit cards at end
            let cardsToPlay: Card[] = [playedCard]
            // Try to play multiple cards in one go
            if ((state.trick?.length || 0) === 0) {
              // Opening lead - play highest value card (biggest first)
              const sorted = [...p.cards].sort((a, b) => {
                const order = (c: Card) => {
                  if (c.rank >= 16) return 100 + c.rank
                  if (c.suit === state.trump && c.rank >= 14) return 90 + c.rank
                  if (c.rank === 1) return 80
                  if (c.suit === state.trump) return 70 + c.rank
                  return c.rank + (c.suit.charCodeAt(0) % 4) * 20
                }
                return order(a) - order(b)
              })
              // Just play highest card for simplicity
            }
            const result = (state as any).playTrick ? (state as any).playTrick(cp, cardsToPlay) : null
            // Fallback: create new trick entry manually
            if (!result) {
              const players2 = state.players.map(pl => ({ ...pl, cards: [...pl.cards] }))
              players2[cp].cards.pop()
              setState({ ...state, players: players2, trick: [...(state.trick || []), { playerId: cp, card: playedCard }], message: `${p.name} 出牌` })
            }
          }
        } else if (state.phase === 'bidding') {
          const ai = shengjiAI(state as unknown as SjAiState, state.currentPlayer)
          if (ai.action === 'bid' && ai.suit) {
            const players = state.players.map(p => ({ ...p, isDealer: p.id === state.currentPlayer }));
            setState({ ...state, players, trump: ai.suit, currentPlayer: (state.currentPlayer + 1) % 4 })
          }
        }
      } catch {}
    }, 600)
    return () => clearTimeout(timer)
  }, [state])

  // If human has turn to bury cards
  useEffect(() => {
    if (state?.phase === 'burying' && state.currentPlayer === 0) {
      setBurying(true)
    }
  }, [state])

  const human = state?.players?.[0]
  const cards: Card[] = human?.cards || []

  return (
    <View className='game-body card-bg'>
      <View className='game-header-bar'><Text className='game-title'>⬆️ 升级</Text></View>
      {state?.message && <Text className='game-msg'>{state.message}</Text>}
      
      <View className='info-bar'><Text className='white-text'>主牌: {state.trump !== 'none' ? {'spades':'♠','hearts':'♥','diamonds':'♦','clubs':'♣'}[state.trump] : '无主'}</Text></View>
      
      <View className='ddz-top-row'>
        {state?.players?.slice(1)?.map((p, i) => (
          <View key={i} className={`ai-player ${state.currentPlayer === i + 1 ? 'ai-active' : ''}`}>
            <Text className='ai-name'>{p.name}</Text>
            <Text className='card-count'>🂠 ×{p.cards?.length || 0}</Text>
          </View>
        ))}
      </View>

      {human && (
        <View className='hand-area'>
          <View className='player-info-row'>
            <Text className='player-name'>{human.name || '你'}</Text>
            {state.currentPlayer === 0 && <Text className='turn-indicator'>轮到你</Text>}
          </View>

          {/* Burying phase UI */}
          {state.phase === 'burying' && state.currentPlayer === 0 && (
            <View>
              <View className='cards-row'>{cards.sort((a,b) => a.rank - b.rank).map((c, i) => (
                <TaroCard key={`${c.suit}_${c.rank}`} suit={c.suit} rank={c.rank} size={getCardSize()}
                  onClick={() => setSelectedIdx(prev => { const n = new Set(prev); if (n.has(i)) n.delete(i); else n.add(i); return n })}
                  selected={selectedIdx.has(i)} />
              ))}</View>
              <View className='action-buttons'>
                <View className={`btn-game btn-gold ${selectedIdx.size !== 8 ? 'btn-disabled' : ''}`} onTap={() => {
                  const toBury = [...selectedIdx].sort().map(i => cards[i])
                  const updated = buryCards(state, toBury)
                  setState(updated)
                  setBurying(false)
                  setSelectedIdx(new Set())
                }}><Text>埋底牌 ({selectedIdx.size}/8)</Text></View>
              </View>
            </View>
          )}

          {/* Playing phase */}
          {!burying && state.phase === 'playing' && (
            <>
              <View className='cards-row'>{cards.sort((a,b) => a.rank - b.rank).map((c, i) => (
                <TaroCard key={`${c.suit}_${c.rank}`} suit={c.suit} rank={c.rank} size={getCardSize()} />
              ))}</View>
            </>
          )}
        </View>
      )}

      <View className='action-buttons'>
        {state?.phase === 'finished' && <View className='btn-game btn-gold' onTap={onRestart}><Text>再来一局</Text></View>}
      </View>
    </View>
  )
}

// ============================================================================
// NIUNIU - Fixed "revealed" issue
// ============================================================================

function NiuniuGame({ onRestart }: { onRestart: () => void }) {
  const [state, setState] = useState<NnState>(initNn())
  const [betAmt, setBetAmt] = useState(10)

  useEffect(() => {
    if (state.phase === 'betting') return
    if (state.phase === 'dealing') {
      const timer = setTimeout(() => {
        // Deal to all AI players too, then compare
        const allDealt: NnState = {
          ...state,
          phase: 'result',
          players: state.players.map(p => {
            const deck = (() => {
              const d: Card[] = [];
              const suits: Card['suit'][] = ['spades','hearts','diamonds','clubs']
              for (const s of suits) for (let r = 1; r <= 13; r++) d.push({ suit: s, rank: r, display: '' })
              return d.sort(() => Math.random() - 0.5)
            })()
            const hand = [deck.pop()!, deck.pop()!, deck.pop()!, deck.pop()!, deck.pop()!]
            let niuValue = 0; let niuType = '无牛'
            const pts = hand.map(c => c.rank > 10 ? 10 : c.rank)
            const total = pts.reduce((a,b) => a+b, 0)
            // Check combos
            for (let i = 0; i < 5; i++) {
              for (let j = i+1; j < 5; j++) {
                for (let k = j+1; k < 5; k++) {
                  if ((pts[i]+pts[j]+pts[k]) % 10 === 0) {
                    const rest = total % 10
                    niuValue = rest === 0 ? 10 : rest
                    niuType = niuValue === 10 ? '全牛' : `牛${niuValue}`
                  }
                }
              }
            }
            // Five 10/J/Q/K/Nike
            if (hand.every(c => c.rank >= 10)) { niuValue = 10; niuType = '五花牛' }
            if (hand.every(c => c.rank <= 5)) { niuValue = 10; niuType = '五小牛' }
            return { ...p, cards: hand, niuValue, niuType, chips: p.chips - (p.isAI ? Math.floor(Math.random()*30)+10 : betAmt) }
          }),
          chipDiff: 0
        }
        // Compare results
        const pc = state.players[0]
        let net = 0
        for (let i = 1; i < allDealt.players.length; i++) {
          const a = allDealt.players[i]
          if (pc.niuValue > a.niuValue) { net += a.bet; }
          else if (pc.niuValue < a.niuValue) { net -= pc.bet }
          else {
            const pMax = Math.max(...pc.cards.map(c => c.rank === 1 ? 14 : c.rank))
            const aMax = Math.max(...a.cards.map(c => c.rank === 1 ? 14 : c.rank))
            if (pMax > aMax) net += a.bet; else if (pMax < aMax) net -= pc.bet
          }
        }
        if (net > 0) { allDealt.players[0].chips += net + pc.bet; allDealt.message = `赢了 $${net}! (${pc.niuType})` }
        else if (net < 0) { allDealt.chipDiff = net; allDealt.message = `输了 $${-net} (${pc.niuType})` }
        else { allDealt.players[0].chips += pc.bet; allDealt.message = '平局' }
        setState(allDealt)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [state])

  const human = state?.players?.[0]
  const humanCards: Card[] = human?.cards || []
  // Cards are revealed in result phase
  const isResultPhase = state?.phase === 'result'

  return (
    <View className='game-body card-bg'>
      <View className='game-header-bar'><Text className='game-title'>🐂 牛牛</Text></View>
      {state.message && <Text className='game-msg'>{state.message}</Text>}
      <View className='ddz-top-row'>
        {state.players?.slice(1)?.map((p, i) => (
          <View key={i} className='ai-player'>
            <Text className='ai-name'>{p.name}</Text>
            {isResultPhase && <Text style={{color:'#ffd700',fontSize:'20px'}}>{p.niuType} ({p.niuValue})</Text>}
            <Text className='card-count'>🂠 ×{p.cards?.length || 0}</Text>
          </View>
        ))}
      </View>
      {human && (
        <View className='hand-area'>
          <View className='player-info-row'>
            <Text className='player-name'>{human.name || '你'} (${human.chips})</Text>
            {isResultPhase && <Text style={{color:'#ffd700',fontSize:'22px'}}>{human.niuType} ({human.niuValue})</Text>}
          </View>
          <View className='cards-row'>{humanCards.map((c: Card, i: number) => (
            <TaroCard key={i} suit={c.suit} rank={c.rank} size={getCardSize()}
              faceDown={(humanCards.length > 2 && !isResultPhase)} />
          ))}</View>
          <View className='action-buttons'>
            {state.phase === 'betting' && (<>
              <InputRow bet={betAmt} setBet={setBetAmt} />
              <View className='btn-game btn-gold' onTap={() => setState({ ...state, phase: 'dealing', message: '发牌中...', players: state.players.map(p => ({ ...p, cards: [] })) })}><Text>发牌</Text></View>
            </>)}
            {state.phase === 'result' && (<>
              <View className='btn-game btn-gold' onTap={onRestart}><Text>再来一局</Text></View>
            </>)}
          </View>
        </View>
      )}
    </View>
  )
}

function InputRow({ bet, setBet }: { bet: number; setBet: (v: number) => void }) {
  return (
    <View style={{display:'flex',alignItems:'center',gap:'12px',justifyContent:'center',marginBottom:'8px'}}>
      <Text style={{color:'#fff',fontSize:'22px'}}>注码:</Text>
      <View className='btn-game btn-blue' onTap={() => setBet(Math.max(1, bet - 5))}><Text>-</Text></View>
      <Text style={{color:'#ffd700',fontSize:'22px',fontWeight:'700'}}>${bet}</Text>
      <View className='btn-game btn-blue' onTap={() => setBet(bet + 5)}><Text>+</Text></View>
    </View>
  )
}

// ============================================================================
// ZHAJIN HUA
// ============================================================================

function ZhajinhuaGame({ onRestart }: { onRestart: () => void }) {
  const [state, setState] = useState<ZjhState>(() => dealZjh(initZjh()))
  const [bet, setBet] = useState(10)
  useEffect(() => {
    if (!state || state.phase === 'finished' || state.currentPlayer === 0) return
    const timer = setTimeout(() => {
      const ai = zjhAI(state, state.currentPlayer)
      setState(zjhAction(state, state.currentPlayer, ai.action, ai.amount || 0))
    }, 600)
    return () => clearTimeout(timer)
  }, [state])
  const human = state.players?.[0]
  return (
    <View className='game-body card-bg'>
      <View className='game-header-bar'><Text className='game-title'>🔥 炸金花</Text></View>
      {state.message && <Text className='game-msg'>{state.message}</Text>}
      <View className='ddz-top-row'>
        {state.players?.slice(1)?.map((p, i) => (
          <View key={i} className={`ai-player ${state.currentPlayer === i+1 ? 'ai-active' : ''}`}>
            <Text className='ai-name'>{p.name}</Text>
            <Text className='card-count'>{p.folded ? '弃牌' : `🂠 ×${p.cards?.length || '?'}`}</Text>
          </View>
        ))}
      </View>
      {human && !human.folded && (
        <View className='hand-area'>
          <View className='player-info-row'>
            <Text className='player-name'>{human.name} (${human.chips}) {state.phase === 'show' ? `(${getTypeName(human.cards).type})` : human.seeCards ? `看到: ${getTypeName(human.cards).type}` : '? ? ?'}</Text>
            {state.currentPlayer === 0 && <Text className='turn-indicator'>轮到你</Text>}
          </View>
          <View className='cards-row'>{human.cards.map((c, i) => (
            <TaroCard key={i} suit={c.suit} rank={c.rank} size={getCardSize()} faceDown={!human.seeCards} />
          ))}</View>
          <View className='action-buttons'>
            {(state.phase === 'playing' || state.phase === 'show') && state.currentPlayer === 0 && (
              <>
                <View className='btn-game btn-green' onTap={() => setState(zjhAction(state, 0, 'call'))}><Text>跟注</Text></View>
                <View className='btn-game btn-gold' onTap={() => setState(zjhAction(state, 0, 'raise', bet * 2))}><Text>加注</Text></View>
                <View className='btn-game btn-red' onTap={() => setState(zjhAction(state, 0, 'fold'))}><Text>弃牌</Text></View>
                {!human.seeCards && <View className='btn-game btn-blue' onTap={() => setState(zjhAction(state, 0, 'see'))}><Text>看牌</Text></View>}
              </>
            )}
          </View>
        </View>
      )}
      {state.phase === 'finished' && (
        <View className='action-buttons'>
          <View className='btn-game btn-gold' onTap={onRestart}><Text>再来一局</Text></View>
        </View>
      )}
    </View>
  )
}

function getTypeName(cards: Card[]) {
  if (cards.length < 3) return { type: '', value: 0 }
  const ranks = cards.map(c => c.rank).sort((a,b) => b-a)
  const suits = cards.map(c => c.suit)
  const sameSuit = suits[0] === suits[1] && suits[1] === suits[2]
  const straight = ranks[0] - ranks[1] === 1 && ranks[1] - ranks[2] === 1
  const pairCount = new Map<number, number>()
  ranks.forEach(r => pairCount.set(r, (pairCount.get(r)||0)+1))
  const maxPair = Math.max(...pairCount.values())
  if (maxPair === 3) return { type: '豹子', value: 900 + ranks[0] }
  if (sameSuit && straight && ranks[0] === 14 && ranks[1] === 13 && ranks[2] === 12) return { type: '同花顺', value: 800 + 14 }
  if (sameSuit && straight) return { type: '同花顺', value: 800 + ranks[0] }
  if (sameSuit) return { type: '同花', value: 700 + ranks[0] }
  if (maxPair === 2) return { type: '对子', value: 600 + ranks[0] }
  return { type: `单张-${ranks[0]}`, value: ranks[0] }
}

// ============================================================================
// TEXAS HOLD'EM
// ============================================================================

function TexasHoldemGame({ onRestart }: { onRestart: () => void }) {
  const [state, setState] = useState<TexasGameState>(initTexasGame())
  useEffect(() => {
    if (!state || state.currentRound?.phase === 'finished' || state.currentRound?.currentPlayer === 0) return
    const timer = setTimeout(() => {
      const ai = getTexasAIAction(state, state.currentRound!.currentPlayer)
      setState(processTexasAction(state, state.currentRound!.currentPlayer, ai.action, ai.amount || 0))
    }, 500)
    return () => clearTimeout(timer)
  }, [state])
  const human = state.players?.[0]
  const roundState = state.currentRound
  return (
    <View className='game-body card-bg'>
      <View className='game-header-bar'><Text className='game-title'>♠️ 德州扑克</Text></View>
      {state.message && <Text className='game-msg'>{state.message}</Text>}
      <View className='ddz-top-row'>
        {state.players?.slice(1)?.map((p, i) => (
          <View key={i} className={`ai-player ${roundState?.currentPlayer === i+1 ? 'ai-active' : ''}`}>
            <Text className='ai-name'>{p.name} ${p.chips}</Text>
            <Text className='card-count'>{p.folded ? '弃牌' : p.allIn ? '全押！' : `🂠 ×${p.cards?.length || 0}`}</Text>
          </View>
        ))}
      </View>
      {human && roundState && (
        <View className='hand-area'>
          {roundState.communityCards.length > 0 && (
            <View className='cards-row'>{roundState.communityCards.map((c, i) => (
              <TaroCard key={'c'+i} suit={c.suit} rank={c.rank} size={getCardSize()} />
            ))}</View>
          )}
          <View className='player-info-row'>
            <Text className='player-name'>{human.name} (${human.chips})</Text>
            {roundState.currentPlayer === 0 && <Text className='turn-indicator'>轮到你</Text>}
          </View>
          <View className='cards-row'>{human.cards.map((c, i) => (
            <TaroCard key={i} suit={c.suit} rank={c.rank} size={getCardSize()} />
          ))}</View>
          <View className='action-buttons'>
            {['preflop','flop','turn','river'].includes(roundState.phase) && roundState.currentPlayer === 0 && !human.folded && (
              <>
                <View className='btn-game btn-green' onTap={() => setState(processTexasAction(state, 0, 'call', 0))}><Text>跟注</Text></View>
                <View className='btn-game btn-gold' onTap={() => setState(processTexasAction(state, 0, 'raise', 20))}><Text>加注</Text></View>
                <View className='btn-game btn-red' onTap={() => setState(processTexasAction(state, 0, 'fold', 0))}><Text>弃牌</Text></View>
              </>
            )}
            {roundState.phase === 'showdown' && roundState.winner !== undefined && (
              <View className='btn-game btn-gold' onTap={onRestart}><Text>再来一局</Text></View>
            )}
          </View>
        </View>
      )}
    </View>
  )
}

// ============================================================================
// SUOHA (SHOWHAND) - Fixed bet action
// ============================================================================

function SuohaGame({ onRestart }: { onRestart: () => void }) {
  const [state, setState] = useState<ShState>(initSuoha())
  const [betAmt, setBetAmt] = useState(10)

  useEffect(() => {
    if (!state || state.finished || state.turn === 0) return
    const timer = setTimeout(() => {
      const ai = suohaAI(state, state.turn)
      setState(suohaBet(state, ai.action, ai.amount))
    }, 500)
    return () => clearTimeout(timer)
  }, [state])

  const human = state.players?.[0]
  return (
    <View className='game-body card-bg'>
      <View className='game-header-bar'><Text className='game-title'>💎 梭哈</Text></View>
      {state.message && <Text className='game-msg'>{state.message}</Text>}
      <View className='ddz-top-row'>
        {state.players?.slice(1)?.map((p, i) => (
          <View key={i} className={`ai-player ${state.turn === i+1 ? 'ai-active' : ''}`}>
            <Text className='ai-name'>{p.name} ${p.chips}</Text>
            <Text className='card-count'>{p.folded ? '弃牌' : `🂠 ×${p.cards?.length || 0}`}</Text>
          </View>
        ))}
      </View>
      {human && !human.folded && (
        <View className='hand-area'>
          <View className='player-info-row'>
            <Text className='player-name'>{human.name} (${human.chips}) {human.cards.length > 0 ? handStrengthText(human.cards) : ''}</Text>
            {state.turn === 0 && <Text className='turn-indicator'>轮到你</Text>}
          </View>
          <View className='cards-row'>{human.cards.map((c, i) => (
            <TaroCard key={i} suit={c.suit} rank={c.rank} size={getCardSize()} />
          ))}</View>
          <View className='action-buttons'>
            {state.turn === 0 && !state.finished && (
              <>
                <View className='btn-game btn-green' onTap={() => setState(suohaBet(state, 'call', 0))}><Text>跟注</Text></View>
                <View className='btn-game btn-gold' onTap={() => setState(suohaBet(state, 'raise', betAmt))}><Text>加注 ${betAmt}</Text></View>
                <View className='btn-game btn-red' onTap={() => setState(suohaBet(state, 'fold', 0))}><Text>弃牌</Text></View>
              </>
            )}
            {state.finished && (
              <>
                <View className='btn-game btn-gold' onTap={onRestart}><Text>再来一局</Text></View>
              </>
            )}
          </View>
        </View>
      )}
    </View>
  )
}

function handStrengthText(cards: Card[]): string {
  // Simplified poker hand evaluation
  if (cards.length < 3) return ''
  const ranks = cards.map(c => c.rank).sort((a,b) => b-a)
  const suits = cards.map(c => c.suit)
  const sameSuit = suits[0] === suits[1] && suits[1] === suits[2]
  return sameSuit ? '(同花可能)' : `(最大:${ranks[0]})`
}

// ============================================================================
// MAHJONG
// ============================================================================

function MahjongGame({ gameId, onRestart }: { gameId: string; onRestart: () => void }) {
  const [state, setState] = useState<any>(null)
  useEffect(() => {
    if (gameId === 'sichuanmahjong') setState(initScMj())
    else if (gameId === 'riichimahjong') setState(initRiichi())
  }, [])
  useEffect(() => {
    if (!state || state.phase === 'finished' || state.currentPlayer === 0) return
    const timer = setTimeout(() => {
      if (gameId === 'sichuanmahjong') {
        const ai = scmjAI(state, state.currentPlayer)
        setState(scmjAction(state, state.currentPlayer, ai.action, ai.tile))
      } else {
        const ai = riichiAI(state, state.currentPlayer)
        setState(riichiAction(state, state.currentPlayer, ai.action, ai.tile))
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [state])
  if (!state) return <View className='game-body card-bg'><Text className='game-msg'>加载中...</Text></View>
  const human = state.players?.[0]
  const hand = human?.hand || []
  const DISCARD_ICONS = ['','一','二','三','四','五','六','七','八','九']
  const SUIT_SYMBOLS: Record<string, string> = { wan: '万', tong: '筒', tiao: '条', zi: '字' }
  return (
    <View className='game-body card-bg'>
      <View className='game-header-bar'><Text className='game-title'>{gameId === 'sichuanmahjong' ? '🀄 四川血战到底' : '🎋 日本立直麻将'}</Text></View>
      {state.message && <Text className='game-msg'>{state.message}</Text>}
      <View className='ddz-top-row'>
        {state.players?.slice(1)?.map((p, i) => (
          <View key={i} className='ai-player'><Text className='ai-name'>{p.name}</Text>
            <Text className='card-count'>牌: {p.hand?.length || '?'} 张</Text></View>
        ))}
      </View>
      <View className='hand-area'>
        <View className='player-info-row'>
          <Text className='player-name'>{human?.name || '你'}</Text>
          {state.currentPlayer === 0 && <Text className='turn-indicator'>轮到你</Text>}
        </View>
        <View className='tiles-row'>
          {hand.map((t: any, i: number) => (
            <View key={i} className='mahjong-tile' onTap={() => {
              if (state.currentPlayer !== 0) return
              setState(gameId === 'sichuanmahjong' ? scmjAction(state, 0, 'discard', t) : riichiAction(state, 0, 'discard', t))
            }}>
              <Text>{DISCARD_ICONS[t.rank] || t.display || ''}{SUIT_SYMBOLS[t.sub] || ''}</Text>
            </View>
          ))}
        </View>
      </View>
      {state.phase === 'finished' && (
        <View className='action-buttons'>
          <View className='btn-game btn-gold' onTap={onRestart}><Text>再来一局</Text></View>
        </View>
      )}
    </View>
  )
}

// ============================================================================
// CHESS (Chinese Chess) - Removed ScrollView, fixed river-text position
// ============================================================================

function ChessGame({ onRestart }: { onRestart: () => void }) {
  const [game, setGame] = useState<ChessGameState>(initChessGame())
  const [vm, setVm] = useState<[number, number][]>([])
  const PC: Record<string, string> = { king:'帥', advisor:'士', elephant:'象', knight:'馬', rook:'車', cannon:'炮', pawn:'兵' }
  const BC: Record<string, string> = { king:'將', advisor:'士', elephant:'象', knight:'馬', rook:'車', cannon:'砲', pawn:'卒' }
  const CELL_SIZE = 42 // Larger cells so board fits screen
  const BOARD_COLS = 9, BOARD_ROWS = 10
  
  const handleClick = useCallback((r: number, c: number) => {
    if (game.winner) return
    if (game.selectedRow !== null && game.selectedCol !== null && vm.some(([vr,vc]) => vr === r && vc === c)) {
      setGame(makeChessMove(game, game.selectedRow, game.selectedCol, r, c)); setVm([]); return
    }
    const p = game.board[r][c]
    if (p && p.isRed === (game.currentPlayer === 'red')) { setGame({ ...game, selectedRow: r, selectedCol: c }); setVm(getValidMoves(game, r, c)) }
    else { setGame({ ...game, selectedRow: null, selectedCol: null }); setVm([]) }
  }, [game, vm])

  useEffect(() => {
    if (game.winner || game.currentPlayer === 'red') return
    const t = setTimeout(() => { const m = getChessAIMove(game); if (m) { setGame(makeChessMove(game, m.fromRow, m.fromCol, m.toRow, m.toCol)); setVm([]) } }, 400)
    return () => clearTimeout(t)
  }, [game])

  const cellWidth = 64
  const cellHeight = 56
  const boardW = BOARD_COLS * cellWidth
  const boardH = BOARD_ROWS * cellHeight

  return (
    <View className='game-body chess-bg' style={{alignItems:'center'}}>
      <View className='game-header-bar' style={{position:'relative'}}><Text className='game-title'>♚ 中国象棋</Text></View>
      {game.message && <Text className='game-msg'>{game.message}</Text>}
      
      {/* River text OUTSIDE the board */}
      <Text style={{color:'#c9a84c',fontSize:'22px',textAlign:'center',padding:'4px 0',letterSpacing:'24px'}}>楚&nbsp;&nbsp;&nbsp;&nbsp;河&nbsp;&nbsp;&nbsp;&nbsp;汉&nbsp;&nbsp;&nbsp;&nbsp;界</Text>
      
      <View className='chess-board-taro' style={{flexDirection:'column',background:'linear-gradient(145deg, #8b4513, #654321)',border:'4px solid #c9a84c',borderRadius:'8px',overflow:'hidden'}}>
        {game.board.map((row, r) => (
          <View key={r} className='chess-row' style={{flexDirection:'row'}}>
            {row.map((p, c) => {
              const sel = game.selectedRow === r && game.selectedCol === c
              const valid = vm.some(([vr,vc]) => vr === r && vc === c)
              const isCaptureTarget = valid && p !== null
              return (
                <View key={c} className={`chess-cell ${sel ? 'cell-selected' : ''} ${valid ? 'cell-valid' : ''}`} 
                  onTap={() => handleClick(r, c)}
                  style={{
                    width: cellWidth, height: cellHeight,
                    alignItems:'center', justifyContent:'center',
                    borderRight: c < BOARD_COLS-1 ? '1px solid rgba(0,0,0,0.3)' : 'none',
                    borderBottom: r < BOARD_ROWS-1 ? '1px solid rgba(0,0,0,0.3)' : 'none',
                  }}>
                  {/* Show capture target ring more clearly */}
                  {isCaptureTarget && p && (
                    <View style={{position:'absolute',inset:-3,borderRadius:'50%',border:'3px solid #ff4444',boxShadow:'0 0 8px #ff0000'}} />
                  )}
                  {/* Show empty capture target with pulsing dot */}
                  {isCaptureTarget && !p && (
                    <View style={{position:'absolute',inset:'auto',width:16,height:16,borderRadius:'50%',background:'rgba(255,68,68,0.5)',bottom:0,right:0,marginLeft:cellWidth/2-8,marginTop:cellHeight/2-8}} />
                  )}
                  {p && <Text className={`chess-piece ${p.isRed ? 'piece-red' : 'piece-black'}`} style={{fontSize:28,width:cellWidth-8,height:cellHeight-8}}>
                    {p.isRed ? PC[p.type] : BC[p.type]}
                  </Text>}
                </View>
              )
            })}
          </View>
        ))}
      </View>
      <View className='info-bar'><Text className='white-text'>{game.currentPlayer === 'red' ? '红方' : '黑方'}走棋</Text></View>
      {game.winner && <View className='action-buttons'><View className='btn-game btn-gold' onTap={onRestart}><Text>再来一局</Text></View></View>}
    </View>
  )
}

// ============================================================================
// GOMOKU
// ============================================================================

function GomokuGame({ onRestart }: { onRestart: () => void }) {
  const [game, setGame] = useState<GomokuState>(initGomoku())
  useEffect(() => {
    if (game.winner || game.currentPlayer !== 1) return
    const t = setTimeout(() => { const m = gomokuAI(game); if (m) setGame(placeGomoku(game, m[0], m[1])) }, 300)
    return () => clearTimeout(t)
  }, [game])
  return (
    <View className='game-body board-bg'>
      <View className='game-header-bar'><Text className='game-title'>⭕ 五子棋</Text></View>
      {game.message && <Text className='game-msg'>{game.message}</Text>}
      <View className='board-scroll'>
        <View className='grid-board'>{game.board.map((row, r) => (
          <View key={r} className='grid-row'>{row.map((v, c) => (
            <View key={c} className={`grid-cell ${v === 1 ? 'black-stone' : v === 2 ? 'white-stone' : ''}`}
              onTap={() => { if (!game.winner && game.currentPlayer === 0 && v === 0) setGame(placeGomoku(game, r, c)) }} />
          ))}</View>
        ))}</View>
      </View>
      {game.winner && <View className='action-buttons'><View className='btn-game btn-gold' onTap={onRestart}><Text>再来一局</Text></View></View>}
    </View>
  )
}

// ============================================================================
// OTHELLO
// ============================================================================

function OthelloGame({ onRestart }: { onRestart: () => void }) {
  const [game, setGame] = useState<OthelloState>(initOthello())
  const [valids, setValids] = useState<[number, number][]>([])
  useEffect(() => { setValids(getOthelloValid(game)) }, [game])
  useEffect(() => {
    if (game.winner || game.currentPlayer !== 1) return
    const t = setTimeout(() => { const m = othelloAI(game); if (m) setGame(placeOthello(game, m[0], m[1])) }, 400)
    return () => clearTimeout(t)
  }, [game])
  return (
    <View className='game-body board-bg'>
      <View className='game-header-bar'><Text className='game-title'>🔵 黑白棋</Text></View>
      {game.message && <Text className='game-msg'>{game.message}</Text>}
      <View className='board-scroll'>
        <View className='grid-board othello-bg'>{game.board.map((row, r) => (
          <View key={r} className='grid-row'>{row.map((v, c) => {
            const ok = valids.some(([vr,vc]) => vr === r && vc === c)
            return (<View key={c} className={`grid-cell ${v === 1 ? 'black-stone' : v === 2 ? 'white-stone' : ''} ${ok ? 'cell-valid' : ''}`}
              onTap={() => { if (ok) setGame(placeOthello(game, r, c)) }} />)
          })}</View>
        ))}</View>
      </View>
      <View className='info-bar'><Text className='gold-text'>⚫ {game.blackCount} - {game.whiteCount} ⚪</Text></View>
      {game.winner && <View className='action-buttons'><View className='btn-game btn-gold' onTap={onRestart}><Text>再来一局</Text></View></View>}
    </View>
  )
}

// ============================================================================
// GO
// ============================================================================

function GoGame({ onRestart }: { onRestart: () => void }) {
  const [game, setGame] = useState<GoGameState>(initGoGame())
  useEffect(() => {
    if (game.winner || game.currentPlayer !== 1) return
    const t = setTimeout(() => { const m = getGoAIMove(game); if (m) setGame(placeGoStone(game, m[0], m[1])); else setGame(passGoTurn(game)) }, 500)
    return () => clearTimeout(t)
  }, [game])
  return (
    <View className='game-body board-bg'>
      <View className='game-header-bar'><Text className='game-title'>⚫ 围棋</Text></View>
      {game.message && <Text className='game-msg'>{game.message}</Text>}
      <View className='board-scroll'>
        <View className='grid-board go-bg'>{game.board.map((row, r) => (
          <View key={r} className='grid-row'>{row.map((v, c) => (
            <View key={c} className={`grid-cell go-cell ${v === 1 ? 'black-stone' : v === 2 ? 'white-stone' : ''}`}
              onTap={() => { if (game.currentPlayer === 0 && v === 0) setGame(placeGoStone(game, r, c)) }} />
          ))}</View>
        ))}</View>
      </View>
      {game.winner && <View className='action-buttons'><View className='btn-game btn-gold' onTap={onRestart}><Text>再来一局</Text></View></View>}
    </View>
  )
}

// ============================================================================
// JUNQI / TIAOQI
// ============================================================================

function BoardGameWithSelect({ gameId, onRestart }: { gameId: string; onRestart: () => void }) {
  const [state, setState] = useState<any>(null)
  const [sel, setSel] = useState<{row:number,col:number}|null>(null)
  useEffect(() => { setState(gameId === 'jungli' ? initJunqi() : initTiaoqi()) }, [])
  useEffect(() => {
    if (!state || state.winner || state.currentPlayer === 0) return
    const t = setTimeout(() => {
      if (gameId === 'jungli') { const m = junqiAI(state); if (m) { setState(moveJunqi(selectJunqi(state, m.from[0], m.from[1]), m.to[0], m.to[1])); setSel(null) } }
      else { const m = tqAI(state); if (m) { setState(moveTq(selectTq(state, m.from[0], m.from[1]), m.to[0], m.to[1])); setSel(null) } }
    }, 500)
    return () => clearTimeout(t)
  }, [state])
  if (!state) return <View className='game-body board-bg'><Text>加载中...</Text></View>
  const title = gameId === 'jungli' ? '军棋' : '跳棋'
  return (
    <View className='game-body board-bg'>
      <View className='game-header-bar'><Text className='game-title'>{'🎖️'} {title}</Text></View>
      {state.message && <Text className='game-msg'>{state.message}</Text>}
      <View className='board-scroll'>
        <View className='grid-board'>{state.board?.map((row: any[], r: number) => (
          <View key={r} className='grid-row'>{row.map((v: any, c: number) => (
            <View key={c} className={`grid-cell ${v ? 'has-piece' : ''}`} onTap={() => {
              if (state.currentPlayer !== 0) return
              if (sel) {
                try { setState(gameId === 'jungli' ? moveJunqi(state, r, c) : moveTq(state, r, c)) } catch { setSel(null) }
                setSel(null)
              } else if (v) { setSel({row:r,col:c}); setState(gameId === 'jungli' ? selectJunqi(state, r, c) : selectTq(state, r, c)) }
            }}>
              {v && <Text className={`piece-text ${v.isRed !== false ? 'p-red' : 'p-black'}`}>{v.type || '●'}</Text>}
            </View>
          ))}</View>
        ))}</View>
      </View>
      {state.winner && <View className='action-buttons'><View className='btn-game btn-gold' onTap={onRestart}><Text>再来一局</Text></View></View>}
    </View>
  )
}

// ============================================================================
// LUDO
// ============================================================================

function LudoGame({ onRestart }: { onRestart: () => void }) {
  const [state, setState] = useState<LudoState>(initLudo())
  useEffect(() => {
    if (state.currentPlayer === 0 || state.winner) return
    const t = setTimeout(() => { const pid = ludoAI(state); if (pid !== null) setState(movePiece(rollDice(state), pid))
      else setState(rollDice(state)) }, 600)
    return () => clearTimeout(t)
  }, [state])
  return (
    <View className='game-body board-bg'>
      <View className='game-header-bar'><Text className='game-title'>✈️ 飞行棋</Text></View>
      <Text className='game-msg'>飞行棋 - 玩家 {state.currentPlayer + 1} 回合</Text>
      <View className='info-bar'><Text className='gold-text'>骰子: {state.diceValue || '?'}</Text></View>
      <View className='action-buttons'>
        {state.currentPlayer === 0 && <View className='btn-game btn-gold' onTap={() => setState(rollDice(state))}><Text>掷骰子</Text></View>}
        {state.winner && <View className='btn-game btn-gold' onTap={onRestart}><Text>再来一局</Text></View>}
      </View>
    </View>
  )
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function GamePage() {
  const router = useRouter()
  const { user, spendCoins } = useUser()
  const id = router.params.id || ''
  const cost = Number(router.params.cost) || 0
  const game = GAME_LIST.find(g => g.id === id)
  useEffect(() => { if (cost > 0 && user) spendCoins(cost, `进入${game?.nameCn || id}`) }, [])
  const back = () => Taro.switchTab({ url: '/pages/index/index' })
  const restart = () => Taro.redirectTo({ url: `/pages/game/index?id=${id}&cost=0` })
  if (!game) return <View className='game-page'><Text>未找到</Text><View className='btn-game btn-gold' onTap={back}><Text>返回</Text></View></View>

  const render = () => {
    switch (id) {
      // --- Black Jack ---
      case 'blackjack': return <BlackjackGame onRestart={restart} />

      // --- Dou Di Zhu ---
      case 'ddz': return <DouDiZhuGame onRestart={restart} />

      // --- Card betting games (non-trick) ---
      case 'niuniu': return <NiuniuGame onRestart={restart} />
      case 'zhajinhua': return <ZhajinhuaGame onRestart={restart} />
      case 'poker': return <TexasHoldemGame onRestart={restart} />
      case 'showhand': return <SuohaGame onRestart={restart} />

      // --- Trick card games with standalone implementations ---
      case 'guandan': return <GuandanGame onRestart={restart} />
      case 'paodekuai': return <PaodekuaiGame onRestart={restart} />
      case 'shengji': return <ShengjiGame onRestart={restart} />

      // --- Sanshui (Thirteen Water) ---
      case 'sanshui': return <View className='game-body card-bg'>
        <View className='game-header-bar'><Text className='game-title'>💧 十三水</Text></View>
        <View className='info-bar'><Text className='game-msg'>十三水</Text></View>
        <Text className='game-msg' style={{textAlign:'center',padding:'40px'}}>功能开发中，敬请期待</Text>
        <View className='action-buttons'><View className='btn-game btn-gold' onTap={restart}><Text>再来</Text></View></View>
      </View>

      // --- Mahjong ---
      case 'sichuanmahjong': return <MahjongGame gameId='sichuanmahjong' onRestart={restart} />
      case 'riichimahjong': return <MahjongGame gameId='riichimahjong' onRestart={restart} />

      // --- Arcade games with full canvas ---
      case 'tetris': return <ArcadeGame gameId='tetris' onRestart={restart} />
      case 'tank': return <ArcadeGame gameId='tank' onRestart={restart} />
      case 'pacman': return <ArcadeGame gameId='pacman' onRestart={restart} />
      case 'puzzlebobble': return <ArcadeGame gameId='puzzlebobble' onRestart={restart} />
      case 'strikers1945': return <ArcadeGame gameId='strikers1945' onRestart={restart} />
      case 'gravitysnake': return <ArcadeGame gameId='gravitysnake' onRestart={restart} />
      case 'pinball': return <ArcadeGame gameId='pinball' onRestart={restart} />

      // --- Board games ---
      case 'chess': return <ChessGame onRestart={restart} />
      case 'xiangqi': return <ChessGame onRestart={restart} />
      case 'gomoku': return <GomokuGame onRestart={restart} />
      case 'othello': return <OthelloGame onRestart={restart} />
      case 'go': return <GoGame onRestart={restart} />
      case 'jungli': return <BoardGameWithSelect gameId='jungli' onRestart={restart} />
      case 'checkers': return <BoardGameWithSelect gameId='checkers' onRestart={restart} />
      case 'flyingchess': return <LudoGame onRestart={restart} />

      default: return <View className='game-body card-bg'>
        <View className='game-header-bar'><Text className='game-title'>{game.icon} {game.nameCn}</Text></View>
        <Text className='game-msg'>{game.nameCn} - 开发中</Text>
        <View className='action-buttons'><View className='btn-game btn-gold' onTap={back}><Text>返回</Text></View></View>
      </View>
    }
  }

  return (
    <View className='game-page'>
      {render()}
    </View>
  )
}
