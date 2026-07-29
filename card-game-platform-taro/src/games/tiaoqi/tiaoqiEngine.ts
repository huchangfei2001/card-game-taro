// 跳棋 (Chinese Checkers / Tiaoqi) Engine
// Six-pointed star board, 2-6 players

export interface TqState {
  board: number[][]; // 0=empty, 1-6=player colors
  players: { id: number; name: string; color: number; isAI: boolean; pieces: [number, number][]; finished: boolean }[];
  currentPlayer: number;
  selected: [number, number] | null;
  validMoves: [number, number][];
  winner: number | null;
  message: string;
  phase: 'playing' | 'finished';
}

// Hex board mapping: row, col within a diamond shape
const SIZE = 17;

function generateBoard(): number[][] {
  const board: number[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  // Fill hex positions
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const dr = Math.abs(r - 8), dc = Math.abs(c - 8);
      if (dr + dc > 8) continue;
      if (dr + dc <= 4) board[r][c] = 0; // center area empty
    }
  }

  // Define start zones based on numPlayers
  const colorPositions: [number, number][][] = [];
  // Player 1 (top): rows 0-3
  const p1: [number, number][] = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < SIZE; c++) {
    const dr = Math.abs(r - 8), dc = Math.abs(c - 8);
    if (dr + dc <= 8 && (r <= 4 || board[r]?.[c] !== undefined)) {
      if (r < 4 || (r === 4 && c >= 4 && c <= 12)) p1.push([r, c]);
    }
  }
  // Actually let me use a simpler approach - predefined start positions
  // Player 1: top triangle (rows 0-3, cols 4-12)
  for (let r = 0; r <= 3; r++) {
    const start = 8 - r, end = 8 + r;
    for (let c = start; c <= end; c++) if (c >= 0 && c < SIZE) p1.push([r, c]);
  }
  colorPositions.push(p1.slice(0, 10));
  // Player 2: bottom
  const p2: [number, number][] = [];
  for (let r = 13; r <= 16; r++) {
    const start = 8 - (16 - r), end = 8 + (16 - r);
    for (let c = start; c <= end; c++) if (c >= 0 && c < SIZE) p2.push([r, c]);
  }
  colorPositions.push(p2.slice(0, 10));
  // Player 3: left
  const p3: [number, number][] = [];
  for (let c = 0; c <= 3; c++) {
    for (let r = 5 - c; r <= 11 + c; r++) {
      const dr = Math.abs(r - 8), dc = Math.abs(c - 8);
      if (dr + dc <= 8 && dr + dc >= 5) p3.push([r, c]);
    }
  }
  colorPositions.push(p3.slice(0, 10));
  // Player 4: right
  const p4: [number, number][] = [];
  for (let c = 13; c <= 16; c++) {
    for (let r = c - 3; r <= 19 - c; r++) {
      const dr = Math.abs(r - 8), dc = Math.abs(c - 8);
      if (dr + dc <= 8) p4.push([r, c]);
    }
  }
  colorPositions.push(p4.slice(0, 10));

  return board;
}

export function initTiaoqi(): TqState {
  const board = generateBoard();
  // 2 players: opposite sides
  const p1Pieces: [number, number][] = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (Math.abs(r - 8) + Math.abs(c - 8) <= 3 && r < 8) p1Pieces.push([r, c]);
  const p2Pieces: [number, number][] = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (Math.abs(r - 8) + Math.abs(c - 8) <= 3 && r > 8) p2Pieces.push([r, c]);

  const players = [
    { id: 0, name: '红方', color: 1, isAI: false, pieces: p1Pieces, finished: false },
    { id: 1, name: '蓝方', color: 2, isAI: true, pieces: p2Pieces, finished: false },
  ];
  return { board, players, currentPlayer: 0, selected: null, validMoves: [], winner: null, message: '跳棋 - 红方先行', phase: 'playing' };
}

const DIRS: [number, number][] = [[-1,0],[1,0],[0,-1],[0,1],[-1,1],[1,-1]];

function getTqMoves(board: number[][], r: number, c: number): [number, number][] {
  const moves: [number, number][] = [];
  for (const [dr, dc] of DIRS) {
    const nr = r + dr, nc = c + dc;
    if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) continue;
    const dr2 = Math.abs(nr - 8), dc2 = Math.abs(nc - 8);
    if (dr2 + dc2 > 8) continue;
    if (!board[nr]?.[nc]) {
      // Also check if the hex cell exists in our board
      if (dr2 + dc2 <= 8) moves.push([nr, nc]);
    } else {
      // Try to jump
      const jr = nr + dr, jc = nc + dc;
      if (jr >= 0 && jr < SIZE && jc >= 0 && jc < SIZE && !board[jr]?.[jc]) {
        const dr3 = Math.abs(jr - 8), dc3 = Math.abs(jc - 8);
        if (dr3 + dc3 <= 8) moves.push([jr, jc]);
      }
    }
  }
  return moves;
}

export function selectTq(state: TqState, row: number, col: number): TqState {
  if (state.phase !== 'playing') return state;
  const player = state.players[state.currentPlayer];
  if (player.isAI) return state;
  const pieceIdx = player.pieces.findIndex(([r, c]) => r === row && c === col);
  if (pieceIdx < 0) return { ...state, selected: null, validMoves: [] };
  return { ...state, selected: [row, col], validMoves: getTqMoves(state.board, row, col) };
}

export function moveTq(state: TqState, toRow: number, toCol: number): TqState {
  if (!state.selected || !state.validMoves.some(([r, c]) => r === toRow && c === toCol)) return state;
  const [fr, fc] = state.selected;
  const player = state.players[state.currentPlayer];
  const board = state.board.map(r => [...r]);

  // Remove from old position
  const idx = player.pieces.findIndex(([r, c]) => r === fr && c === fc);
  if (idx >= 0) player.pieces[idx] = [toRow, toCol];

  // Update board
  board[fr][fc] = 0;
  board[toRow][toCol] = player.color;

  // Check if reached opposite zone
  const oppositeZone = player.color === 1
    ? player.pieces.every(([r]) => r > 12)
    : player.pieces.every(([r]) => r < 4);

  if (oppositeZone) {
    return { ...state, board, selected: null, validMoves: [], winner: state.currentPlayer, phase: 'finished', message: `${player.name} 获胜！` };
  }

  const next = (state.currentPlayer + 1) % state.players.length;
  return { ...state, board, currentPlayer: next, selected: null, validMoves: [], message: `轮到 ${state.players[next].name}` };
}

export function tqAI(state: TqState): { from: [number, number]; to: [number, number] } | null {
  const player = state.players[1];
  if (!player.pieces.length) return null;
  const piece = player.pieces[Math.floor(Math.random() * player.pieces.length)];
  const moves = getTqMoves(state.board, piece[0], piece[1]);
  if (!moves.length) return null;
  // Prefer moves toward opposite zone (lower rows for blue)
  moves.sort((a, b) => a[0] - b[0]);
  return { from: piece, to: moves[0] };
}
