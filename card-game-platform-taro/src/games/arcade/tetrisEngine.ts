// SRS Tetris Engine

export type TetCell = number; // 0=empty, 1-7=colors
export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export interface TetState {
  board: TetCell[][];
  current: { type: TetrominoType; rotation: number; x: number; y: number; shape: number[][] } | null;
  next: TetrominoType;
  score: number;
  level: number;
  lines: number;
  gameOver: boolean;
  paused: boolean;
  bag: TetrominoType[];
  lockTimer: number;
  combo: number;
  sendLines: number;
}

const W = 10;
const H = 22;

const TETROMINOES: Record<TetrominoType, number[][][]> = {
  I: [[[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],[[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]],[[0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0]],[[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]]],
  O: [[[1,1],[1,1]],[[1,1],[1,1]],[[1,1],[1,1]],[[1,1],[1,1]]],
  T: [[[0,1,0],[1,1,1],[0,0,0]],[[0,1,0],[0,1,1],[0,1,0]],[[0,0,0],[1,1,1],[0,1,0]],[[0,1,0],[1,1,0],[0,1,0]]],
  S: [[[0,1,1],[1,1,0],[0,0,0]],[[0,1,0],[0,1,1],[0,0,1]],[[0,0,0],[0,1,1],[1,1,0]],[[1,0,0],[1,1,0],[0,1,0]]],
  Z: [[[1,1,0],[0,1,1],[0,0,0]],[[0,0,1],[0,1,1],[0,1,0]],[[0,0,0],[1,1,0],[0,1,1]],[[0,1,0],[1,1,0],[1,0,0]]],
  J: [[[1,0,0],[1,1,1],[0,0,0]],[[0,1,1],[0,1,0],[0,1,0]],[[0,0,0],[1,1,1],[0,0,1]],[[0,1,0],[0,1,0],[1,1,0]]],
  L: [[[0,0,1],[1,1,1],[0,0,0]],[[0,1,0],[0,1,0],[0,1,1]],[[0,0,0],[1,1,1],[1,0,0]],[[1,1,0],[0,1,0],[0,1,0]]],
};

function shuffleBag(): TetrominoType[] {
  const b: TetrominoType[] = ['I','O','T','S','Z','J','L'];
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i+1)); [b[i],b[j]] = [b[j],b[i]]; }
  return b;
}

function getShape(type: TetrominoType, rotation: number): number[][] {
  return TETROMINOES[type][rotation % 4];
}

function collides(board: TetCell[][], shape: number[][], x: number, y: number): boolean {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const bx = x + c, by = y + r;
      if (bx < 0 || bx >= W || by >= H) return true;
      if (by < 0) continue;
      if (board[by][bx]) return true;
    }
  }
  return false;
}

export function initTet(): TetState {
  return {
    board: Array.from({ length: H }, () => Array(W).fill(0)),
    current: null, next: 'T', score: 0, level: 1, lines: 0,
    gameOver: false, paused: false, bag: shuffleBag(),
    lockTimer: 0, combo: -1, sendLines: 0,
  };
}

export function spawnTet(state: TetState): TetState {
  const s = { ...state, board: state.board.map(r => [...r]), lockTimer: 0 };
  if (s.bag.length <= 1) s.bag = [...s.bag, ...shuffleBag()];
  const type = s.bag.shift()!;
  const next = s.bag[0];
  const shape = getShape(type, 0);
  const x = Math.floor((W - shape[0].length) / 2);
  const y = 0;
  if (collides(s.board, shape, x, y)) {
    return { ...s, gameOver: true, current: null };
  }
  s.current = { type, rotation: 0, x, y, shape };
  s.next = next;
  return s;
}

export function startTet(state: TetState): TetState {
  const s = { ...state, board: Array.from({ length: H }, () => Array(W).fill(0)), score: 0, level: 1, lines: 0, gameOver: false, combo: -1, sendLines: 0 };
  return spawnTet(s);
}

export function moveTet(state: TetState, dx: number, dy: number): TetState {
  if (!state.current || state.gameOver) return state;
  const { shape, x, y } = state.current;
  if (!collides(state.board, shape, x + dx, y + dy)) {
    return { ...state, current: { ...state.current, x: x + dx, y: y + dy }, lockTimer: 0 };
  }
  return state;
}

// SRS wall kick data
const JLSTZ_KICKS: Record<string, [number,number][]> = {
  '0>1': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
  '1>0': [[0,0],[1,0],[1,-1],[0,2],[1,2]],
  '1>2': [[0,0],[1,0],[1,-1],[0,2],[1,2]],
  '2>1': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
  '2>3': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
  '3>2': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  '3>0': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  '0>3': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
};
const I_KICKS: Record<string, [number,number][]> = {
  '0>1': [[0,0],[-2,0],[1,0],[-2,-1],[1,2]],
  '1>0': [[0,0],[2,0],[-1,0],[2,1],[-1,-2]],
  '1>2': [[0,0],[-1,0],[2,0],[-1,2],[2,-1]],
  '2>1': [[0,0],[1,0],[-2,0],[1,-2],[-2,1]],
  '2>3': [[0,0],[2,0],[-1,0],[2,1],[-1,-2]],
  '3>2': [[0,0],[-2,0],[1,0],[-2,-1],[1,2]],
  '3>0': [[0,0],[1,0],[-2,0],[1,-2],[-2,1]],
  '0>3': [[0,0],[-1,0],[2,0],[-1,2],[2,-1]],
};

export function rotateTet(state: TetState, dir: 1 | -1): TetState {
  if (!state.current || state.gameOver || state.current.type === 'O') return state;
  const { type, rotation, x, y } = state.current;
  const newRot = ((rotation + dir) % 4 + 4) % 4;
  const newShape = getShape(type, newRot);
  const kickKey = `${rotation}>${newRot}`;
  const kicks = type === 'I' ? I_KICKS[kickKey] : JLSTZ_KICKS[kickKey];
  if (!kicks) return state;
  for (const [dx, dy] of kicks) {
    if (!collides(state.board, newShape, x + dx, y - dy)) {
      return { ...state, current: { ...state.current, rotation: newRot, shape: newShape, x: x + dx, y: y - dy }, lockTimer: 0 };
    }
  }
  return state;
}

export function hardDropTet(state: TetState): TetState {
  if (state.gameOver || !state.current) return state;
  let s = { ...state, current: { ...state.current } };
  let dropped = 0;
  while (true) {
    const { shape, x, y } = s.current!;
    if (collides(s.board, shape, x, y + 1)) break;
    s = { ...s, current: { ...s.current!, y: y + 1 } };
    dropped++;
  }
  s = { ...s, score: s.score + dropped * 2 };
  return lockTet(s);
}

function lockTet(state: TetState): TetState {
  if (!state.current) return state;
  const b = state.board.map(r => [...r]);
  const { shape, x, y, type } = state.current;
  const colorIdx = ['I','O','T','S','Z','J','L'].indexOf(type) + 1;
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const by = y + r, bx = x + c;
      if (by >= 0 && by < H && bx >= 0 && bx < W) b[by][bx] = colorIdx;
    }
  }
  // Clear lines
  let cleared = 0;
  for (let r = H - 1; r >= 0; r--) {
    if (b[r].every(c => c !== 0)) {
      b.splice(r, 1);
      b.unshift(Array(W).fill(0));
      cleared++;
      r++;
    }
  }
  const s = { ...state, board: b, current: null, sendLines: 0 };
  if (cleared > 0) {
    const combo = s.combo + 1;
    const points = [0, 100, 300, 500, 800][cleared] || cleared * 200;
    // Send garbage lines in multiplayer: 0,1,2,4 for 1-4 lines
    const garbage = [0, 0, 1, 2, 4][cleared] || 4;
    return { ...s, lines: s.lines + cleared, score: s.score + points * s.level + combo * 50, combo, sendLines: garbage, level: Math.floor(s.lines / 10) + 1 };
  }
  return { ...s, combo: -1 };
}

export function dropTet(state: TetState): TetState {
  if (state.gameOver || !state.current) return state;
  return moveTet(state, 0, 1);
}

// AI: simple heuristic evaluation
export function tetAI(state: TetState): { targetX: number; targetRot: number } | null {
  if (!state.current) return null;
  let bestScore = -Infinity;
  let bestX = state.current.x;
  let bestRot = state.current.rotation;

  const { type } = state.current;
  for (let rot = 0; rot < 4; rot++) {
    const shape = getShape(type, rot);
    for (let x = -2; x < W + 2; x++) {
      if (collides(state.board, shape, x, 0)) continue;
      // Drop
      let y = 0;
      while (!collides(state.board, shape, x, y + 1)) y++;
      // Simulate placement
      const testBoard = state.board.map(r => [...r]);
      const ci = ['I','O','T','S','Z','J','L'].indexOf(type) + 1;
      for (let r = 0; r < shape.length; r++)
        for (let c = 0; c < shape[r].length; c++)
          if (shape[r][c]) { const by = y + r, bx = x + c; if (by>=0&&by<H&&bx>=0&&bx<W) testBoard[by][bx] = ci; }
      const evalScore = evaluateBoard(testBoard);
      if (evalScore > bestScore) { bestScore = evalScore; bestX = x; bestRot = rot; }
    }
  }
  return { targetX: bestX, targetRot: bestRot };
}

function evaluateBoard(board: TetCell[][]): number {
  let score = 0;
  // Clear lines bonus
  for (let r = 0; r < H; r++) {
    if (board[r].every(c => c !== 0)) score += 500;
  }
  // Aggregate height penalty
  let totalH = 0, bumps = 0;
  const heights: number[] = [];
  for (let c = 0; c < W; c++) {
    let h = H;
    for (let r = 0; r < H; r++) { if (board[r][c]) { h = r; break; } }
    heights.push(H - h);
    totalH += H - h;
  }
  for (let c = 0; c < W - 1; c++) bumps += Math.abs(heights[c] - heights[c + 1]);
  score -= totalH * 4;
  score -= bumps * 2;
  // Holes penalty
  let holes = 0;
  for (let c = 0; c < W; c++) {
    let filled = false;
    for (let r = 0; r < H; r++) {
      if (board[r][c]) filled = true;
      else if (filled) holes++;
    }
  }
  score -= holes * 15;
  // Well/column bonus
  for (let c = 0; c < W; c++) {
    if (heights[c] > 2 && (c === 0 || heights[c - 1] <= heights[c] - 3) && (c === W - 1 || heights[c + 1] <= heights[c] - 3)) {
      score += 10;
    }
  }
  return score;
}

export function receiveGarbage(state: TetState, lines: number): TetState {
  if (state.gameOver) return state;
  const b = state.board.map(r => [...r]);
  for (let i = 0; i < lines; i++) {
    const holeCol = Math.floor(Math.random() * W);
    const row: TetCell[] = Array(W).fill(8);
    row[holeCol] = 0;
    b.push(row);
    b.shift();
  }
  return { ...state, board: b };
}
