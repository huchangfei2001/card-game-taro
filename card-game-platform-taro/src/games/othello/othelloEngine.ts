export type OthCell = 'black' | 'white' | null;

export interface OthelloState {
  board: OthCell[][];
  currentPlayer: 'black' | 'white';
  winner: string | null;
  blackCount: number;
  whiteCount: number;
  validMoves: [number, number][];
  message: string;
  size: number;
  gameOver: boolean;
}

export function initOthello(): OthelloState {
  const size = 8;
  const board: OthCell[][] = Array.from({ length: size }, () => Array(size).fill(null));
  const mid = size / 2;
  board[mid - 1][mid - 1] = 'white';
  board[mid][mid] = 'white';
  board[mid - 1][mid] = 'black';
  board[mid][mid - 1] = 'black';

  const state: OthelloState = {
    board, currentPlayer: 'black', winner: null, blackCount: 2, whiteCount: 2,
    validMoves: [], message: '黑棋先行', size, gameOver: false,
  };
  state.validMoves = getValidMoves(state);
  return state;
}

function inBounds(r: number, c: number, s: number) { return r >= 0 && r < s && c >= 0 && c < s; }

const DIRS = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

export function getValidMoves(state: OthelloState): [number, number][] {
  const moves: [number, number][] = [];
  const { board, currentPlayer, size } = state;
  const opp: OthCell = currentPlayer === 'black' ? 'white' : 'black';

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] !== null) continue;
      let valid = false;
      for (const [dr, dc] of DIRS) {
        let nr = r + dr, nc = c + dc;
        let found = false;
        while (inBounds(nr, nc, size) && board[nr][nc] === opp) { nr += dr; nc += dc; found = true; }
        if (found && inBounds(nr, nc, size) && board[nr][nc] === currentPlayer) { valid = true; break; }
      }
      if (valid) moves.push([r, c]);
    }
  }
  return moves;
}

export function placeOthello(state: OthelloState, row: number, col: number): OthelloState {
  if (!state.validMoves.some(([r, c]) => r === row && c === col)) return state;
  const board = state.board.map(r => [...r]);
  const opp: OthCell = state.currentPlayer === 'black' ? 'white' : 'black';
  board[row][col] = state.currentPlayer;

  for (const [dr, dc] of DIRS) {
    const toFlip: [number, number][] = [];
    let nr = row + dr, nc = col + dc;
    while (inBounds(nr, nc, state.size) && board[nr][nc] === opp) { toFlip.push([nr, nc]); nr += dr; nc += dc; }
    if (toFlip.length > 0 && inBounds(nr, nc, state.size) && board[nr][nc] === state.currentPlayer) {
      toFlip.forEach(([fr, fc]) => { board[fr][fc] = state.currentPlayer; });
    }
  }

  let b = 0, w = 0;
  board.forEach(r => r.forEach(c => { if (c === 'black') b++; else if (c === 'white') w++; }));

  const next: 'black' | 'white' = state.currentPlayer === 'black' ? 'white' : 'black';
  const newState: OthelloState = { ...state, board, blackCount: b, whiteCount: w, currentPlayer: next, validMoves: [] };
  newState.validMoves = getValidMoves(newState);

  if (newState.validMoves.length === 0) {
    newState.currentPlayer = state.currentPlayer;
    newState.validMoves = getValidMoves({ ...newState, currentPlayer: state.currentPlayer });
    if (newState.validMoves.length === 0) {
      newState.gameOver = true;
      newState.winner = b > w ? 'black' : w > b ? 'white' : 'draw';
      newState.message = `${b > w ? '黑棋' : w > b ? '白棋' : '双方'}获胜！${b}:${w}`;
      return newState;
    }
    newState.message = `${next === 'black' ? '黑' : '白'}无合法位置，${state.currentPlayer === 'black' ? '黑' : '白'}继续`;
    return newState;
  }

  newState.message = `${next === 'black' ? '黑' : '白'}棋走 (${b}:${w})`;
  return newState;
}

export function othelloAI(state: OthelloState): [number, number] | null {
  const moves = state.validMoves;
  if (!moves.length) return null;

  // Corners are best, edges next, avoid C-squares
  const size = state.size;
  const scores = moves.map(([r, c]) => {
    let s = 0;
    if ((r === 0 || r === size - 1) && (c === 0 || c === size - 1)) s += 100;
    else if (r === 0 || r === size - 1 || c === 0 || c === size - 1) s += 10;
    else if ((r === 0 || r === size - 1) && (c === 1 || c === size - 2)) s -= 50;
    else if ((c === 0 || c === size - 1) && (r === 1 || r === size - 2)) s -= 50;
    s += Math.floor(Math.random() * 5);
    return { r, c, score: s };
  });
  scores.sort((a, b) => b.score - a.score);
  return [scores[0].r, scores[0].c];
}
