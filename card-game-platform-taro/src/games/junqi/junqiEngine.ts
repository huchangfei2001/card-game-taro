// 军棋 (Junqi / Military Chess) Engine
// Two-player game with hidden pieces on a railway board

export type JqPiece = { type: string; rank: number; color: 'red' | 'blue'; revealed: boolean; id: number };
export type JqCell = JqPiece | null;

export interface JunqiState {
  board: JqCell[][];
  currentPlayer: 'red' | 'blue';
  selected: [number, number] | null;
  validMoves: [number, number][];
  winner: string | null;
  message: string;
  redPieces: number;
  bluePieces: number;
}

const ROWS = 11, COLS = 5;
const PIECES = [
  { type: '司令', rank: 9, count: 1 },
  { type: '军长', rank: 8, count: 1 },
  { type: '师长', rank: 7, count: 2 },
  { type: '旅长', rank: 6, count: 2 },
  { type: '团长', rank: 5, count: 2 },
  { type: '营长', rank: 4, count: 2 },
  { type: '连长', rank: 3, count: 3 },
  { type: '排长', rank: 2, count: 3 },
  { type: '工兵', rank: 1, count: 3 },
  { type: '炸弹', rank: 0, count: 2 },
  { type: '地雷', rank: -1, count: 3 },
  { type: '军旗', rank: -2, count: 1 },
];

function createPieces(color: 'red' | 'blue'): JqPiece[] {
  const pieces: JqPiece[] = [];
  let id = 0;
  for (const p of PIECES) {
    for (let i = 0; i < p.count; i++) {
      pieces.push({ type: p.type, rank: p.rank, color, revealed: false, id: id++ });
    }
  }
  return shuffle(pieces);
}

function shuffle<T>(arr: T[]): T[] { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// Board layout: 0=normal, 1=railway, 2=camp, 3=fortress (back row)
const BOARD_MAP = [
  [3,3,3,3,3],
  [1,2,1,2,1],
  [1,1,1,1,1],
  [1,1,0,1,1],
  [1,1,0,1,1],
  [0,0,0,0,0],
  [1,1,0,1,1],
  [1,1,0,1,1],
  [1,1,1,1,1],
  [1,2,1,2,1],
  [3,3,3,3,3],
];

export function initJunqi(): JunqiState {
  const board: JqCell[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  const redPieces = createPieces('red');
  const bluePieces = createPieces('blue');

  // Place blue in top 2 rows, red in bottom 2 rows
  let idx = 0;
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < COLS; c++) {
      if (BOARD_MAP[r][c] === 3) { board[r][c] = bluePieces[idx++]; }
    }
  }
  idx = 0;
  for (let r = 9; r < 11; r++) {
    for (let c = 0; c < COLS; c++) {
      if (BOARD_MAP[r][c] === 3) { board[r][c] = redPieces[idx++]; }
    }
  }

  return {
    board, currentPlayer: 'red', selected: null, validMoves: [],
    winner: null, message: '军棋 - 红方先行', redPieces: 25, bluePieces: 25,
  };
}

function inBounds(r: number, c: number) { return r >= 0 && r < ROWS && c >= 0 && c < COLS; }
function isRailway(r: number, c: number) { return BOARD_MAP[r]?.[c] === 1; }
function isCamp(r: number, c: number) { return BOARD_MAP[r]?.[c] === 2; }

function getMoves(board: JqCell[][], r: number, c: number): [number, number][] {
  const piece = board[r][c];
  if (!piece) return [];
  const moves: [number, number][] = [];
  const opp = piece.color === 'red' ? 'blue' : 'red';
  const isEngineer = piece.type === '工兵';

  if (piece.type === '军旗' || piece.type === '地雷') return [];

  const dirs: [number, number][] = [[-1,0],[1,0],[0,-1],[0,1]];

  if (isEngineer && isRailway(r, c)) {
    // Engineer can travel along railway
    for (const [dr, dc] of dirs) {
      let nr = r + dr, nc = c + dc;
      while (inBounds(nr, nc) && isRailway(nr, nc) && !board[nr][nc]) {
        moves.push([nr, nc]);
        nr += dr; nc += dc;
      }
      if (inBounds(nr, nc) && isRailway(nr, nc) && board[nr][nc]?.color === opp) moves.push([nr, nc]);
    }
  } else {
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (!inBounds(nr, nc)) continue;
      if (board[nr][nc]) {
        if (board[nr][nc]!.color === opp && !isCamp(nr, nc) && !isCamp(r, c)) moves.push([nr, nc]);
        continue;
      }
      if (BOARD_MAP[nr][nc] === 3 && piece.color === (nr < 5 ? 'red' : 'blue')) continue;
      moves.push([nr, nc]);
    }
  }
  return moves;
}

export function selectJunqi(state: JunqiState, row: number, col: number): JunqiState {
  const piece = state.board[row][col];
  if (piece && piece.color === state.currentPlayer) {
    return { ...state, selected: [row, col], validMoves: getMoves(state.board, row, col) };
  }
  return { ...state, selected: null, validMoves: [] };
}

export function moveJunqi(state: JunqiState, toRow: number, toCol: number): JunqiState {
  if (!state.selected || !state.validMoves.some(([r, c]) => r === toRow && c === toCol)) return state;
  const [fr, fc] = state.selected;
  const atk = state.board[fr][fc]!;
  const def = state.board[toRow][toCol];
  const board = state.board.map(r => [...r]);
  let winner: string | null = null;
  let message = '';

  if (!def) {
    board[toRow][toCol] = { ...atk, revealed: true };
    board[fr][fc] = null;
    message = `${atk.color === 'red' ? '红' : '蓝'}${atk.type} 移动`;
  } else {
    atk.revealed = true;
    def.revealed = true;
    // Combat
    if (atk.type === '炸弹') {
      board[fr][fc] = null;
      board[toRow][toCol] = null;
      message = '炸弹同归于尽!';
    } else if (atk.type === '工兵' && def.type === '地雷') {
      board[toRow][toCol] = { ...atk, revealed: true };
      board[fr][fc] = null;
      message = '工兵挖雷!';
    } else if (atk.rank > def.rank) {
      board[toRow][toCol] = { ...atk, revealed: true };
      board[fr][fc] = null;
      message = `${atk.color === 'red' ? '红' : '蓝'}${atk.type} 击败 ${def.type}`;
    } else if (atk.rank === def.rank) {
      board[fr][fc] = null;
      board[toRow][toCol] = null;
      message = '同归于尽!';
    } else {
      board[fr][fc] = null;
      message = `${atk.color === 'red' ? '红' : '蓝'}${atk.type} 被 ${def.type} 击败`;
    }
    // Check flag capture
    if (def.type === '军旗' || (board[toRow][toCol]?.type === '军旗')) {
      winner = atk.color;
      message = `${atk.color === 'red' ? '红' : '蓝'}方缴获军旗！获胜！`;
    }
  }

  const redPieces = board.flat().filter(p => p?.color === 'red').length;
  const bluePieces = board.flat().filter(p => p?.color === 'blue').length;
  if (!winner && bluePieces === 0) winner = 'red';
  if (!winner && redPieces === 0) winner = 'blue';

  const next = state.currentPlayer === 'red' ? 'blue' : 'red';
  return {
    ...state, board, currentPlayer: winner ? state.currentPlayer : next,
    selected: null, validMoves: [], winner,
    message: winner ? message : `${message || (next === 'red' ? '红' : '蓝') + '方走'}`,
    redPieces, bluePieces,
  };
}

export function junqiAI(state: JunqiState): { from: [number, number]; to: [number, number] } | null {
  const pieces: [number, number, JqPiece][] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const p = state.board[r][c];
      if (p && p.color === 'blue') pieces.push([r, c, p]);
    }
  }
  if (!pieces.length) return null;
  const [r, c] = pieces[Math.floor(Math.random() * pieces.length)];
  const moves = getMoves(state.board, r, c);
  if (!moves.length) return null;
  // Prefer moving toward opponent
  const target = moves.sort(([a], [b]) => a - b)[0];
  return { from: [r, c], to: target };
}
