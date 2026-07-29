export type GomokuState = {
  board: (string | null)[][];
  currentPlayer: 'black' | 'white';
  winner: string | null;
  winLine: [number, number][] | null;
  message: string;
  size: number;
};

export function initGomoku(size = 15): GomokuState {
  return {
    board: Array.from({ length: size }, () => Array(size).fill(null)),
    currentPlayer: 'black',
    winner: null,
    winLine: null,
    message: '黑棋先行',
    size,
  };
}

function checkWin(board: (string | null)[][], r: number, c: number, player: string): [number, number][] | null {
  const size = board.length;
  const dirs = [[0,1],[1,0],[1,1],[1,-1]];
  for (const [dr, dc] of dirs) {
    const line: [number, number][] = [[r, c]];
    for (let i = 1; i < 5; i++) {
      const nr = r + dr * i, nc = c + dc * i;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size && board[nr][nc] === player) line.push([nr, nc]);
      else break;
    }
    for (let i = 1; i < 5; i++) {
      const nr = r - dr * i, nc = c - dc * i;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size && board[nr][nc] === player) line.push([nr, nc]);
      else break;
    }
    if (line.length >= 5) return line;
  }
  return null;
}

export function placeGomoku(state: GomokuState, row: number, col: number): GomokuState {
  if (state.winner || state.board[row][col]) return state;
  const board = state.board.map(r => [...r]);
  board[row][col] = state.currentPlayer;
  const line = checkWin(board, row, col, state.currentPlayer);
  if (line) {
    return { ...state, board, winner: state.currentPlayer, winLine: line, message: `${state.currentPlayer === 'black' ? '黑' : '白'}棋获胜！` };
  }
  const isDraw = board.every(r => r.every(c => c !== null));
  if (isDraw) return { ...state, board, winner: 'draw', winLine: null, message: '平局' };
  const next = state.currentPlayer === 'black' ? 'white' : 'black';
  return { ...state, board, currentPlayer: next, message: `${next === 'black' ? '黑' : '白'}棋走` };
}

export function gomokuAI(state: GomokuState): [number, number] | null {
  const { board, size } = state;
  const candidates: { r: number; c: number; score: number }[] = [];
  const me = 'white';

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c]) continue;
      let score = 0;
      // Check if near existing stones
      let nearStone = false;
      for (let dr = -2; dr <= 2 && !nearStone; dr++) {
        for (let dc = -2; dc <= 2 && !nearStone; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size && board[nr][nc]) nearStone = true;
        }
      }
      if (!nearStone) continue;

      // Evaluate position
      board[r][c] = me;
      if (checkWin(board, r, c, me)) score += 10000;
      const tempB = [...board.map(row => [...row])];
      tempB[r][c] = 'black';
      if (checkWin(tempB, r, c, 'black')) score += 5000;
      board[r][c] = null;
      score += evaluatePosition(board, r, c, me);
      score += Math.random() * 5;
      candidates.push({ r, c, score });
    }
  }
  if (!candidates.length) return null;
  candidates.sort((a, b) => b.score - a.score);
  return [candidates[0].r, candidates[0].c];
}

function evaluatePosition(board: (string | null)[][], r: number, c: number, player: string): number {
  const dirs = [[0,1],[1,0],[1,1],[1,-1]];
  let score = 0;
  const size = board.length;
  for (const [dr, dc] of dirs) {
    let count = 0, open = 0;
    for (let i = 1; i <= 4; i++) {
      const nr = r + dr * i, nc = c + dc * i;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size) { if (board[nr][nc] === player) count++; else if (!board[nr][nc]) { open++; break; } else break; }
      else break;
    }
    for (let i = 1; i <= 4; i++) {
      const nr = r - dr * i, nc = c - dc * i;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size) { if (board[nr][nc] === player) count++; else if (!board[nr][nc]) { open++; break; } else break; }
      else break;
    }
    if (count >= 4) score += 1000;
    else if (count === 3 && open >= 1) score += 100;
    else if (count === 2 && open >= 2) score += 10;
    else if (count === 1 && open >= 2) score += 2;
  }
  return score;
}
