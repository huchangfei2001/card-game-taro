export type StoneColor = 'black' | 'white';

export interface GoGameState {
  board: (StoneColor | null)[][];
  currentPlayer: StoneColor;
  lastMove: [number, number] | null;
  captures: { black: number; white: number };
  passes: number;
  winner: StoneColor | null;
  message: string;
  boardSize: number;
}

export function initGoGame(boardSize: number = 9): GoGameState {
  return {
    board: Array.from({ length: boardSize }, () => Array(boardSize).fill(null)),
    currentPlayer: 'black',
    lastMove: null,
    captures: { black: 0, white: 0 },
    passes: 0,
    winner: null,
    message: '黑棋先行',
    boardSize,
  };
}

function inBounds(r: number, c: number, size: number): boolean {
  return r >= 0 && r < size && c >= 0 && c < size;
}

function getGroup(board: (StoneColor | null)[][], row: number, col: number, color: StoneColor): [number,number][] {
  const size = board.length;
  const group: [number,number][] = [];
  const visited = new Set<string>();
  const stack: [number,number][] = [[row, col]];

  while (stack.length > 0) {
    const [r, c] = stack.pop()!;
    const key = `${r},${c}`;
    if (visited.has(key)) continue;
    if (!inBounds(r, c, size)) continue;
    if (board[r][c] !== color) continue;
    visited.add(key);
    group.push([r, c]);
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      stack.push([r+dr, c+dc]);
    }
  }
  return group;
}

function getLiberties(board: (StoneColor | null)[][], group: [number,number][]): number {
  const size = board.length;
  const liberties = new Set<string>();
  for (const [r, c] of group) {
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const nr = r + dr, nc = c + dc;
      if (inBounds(nr, nc, size) && board[nr][nc] === null) {
        liberties.add(`${nr},${nc}`);
      }
    }
  }
  return liberties.size;
}

function removeGroup(board: (StoneColor | null)[][], group: [number,number][]): number {
  group.forEach(([r, c]) => { board[r][c] = null; });
  return group.length;
}

export function placeGoStone(state: GoGameState, row: number, col: number): GoGameState {
  if (state.winner) return state;
  if (!inBounds(row, col, state.boardSize)) return state;
  if (state.board[row][col] !== null) return state;

  const board = state.board.map(r => [...r]);
  board[row][col] = state.currentPlayer;

  const opponent: StoneColor = state.currentPlayer === 'black' ? 'white' : 'black';
  let captured = 0;
  const captures = { ...state.captures };

  for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
    const nr = row + dr, nc = col + dc;
    if (inBounds(nr, nc, state.boardSize) && board[nr][nc] === opponent) {
      const group = getGroup(board, nr, nc, opponent);
      if (getLiberties(board, group) === 0) {
        captured += removeGroup(board, group);
      }
    }
  }

  const myGroup = getGroup(board, row, col, state.currentPlayer);
  if (getLiberties(board, myGroup) === 0 && captured === 0) {
    return state; // suicide not allowed
  }

  if (captured > 0) {
    if (state.currentPlayer === 'black') captures.black += captured;
    else captures.white += captured;
  }

  return {
    ...state,
    board,
    lastMove: [row, col],
    passes: 0,
    currentPlayer: opponent,
    captures,
    message: `${opponent === 'black' ? '黑' : '白'}棋走`,
  };
}

export function passGoTurn(state: GoGameState): GoGameState {
  if (state.winner) return state;
  const passes = state.passes + 1;
  const opponent: StoneColor = state.currentPlayer === 'black' ? 'white' : 'black';
  if (passes >= 2) {
    return {
      ...state, passes,
      winner: state.captures.black > state.captures.white ? 'black' : 'white',
      message: `${state.captures.black > state.captures.white ? '黑' : '白'}棋获胜！`,
    };
  }
  return {
    ...state, passes,
    currentPlayer: opponent,
    message: `${state.currentPlayer === 'black' ? '黑' : '白'}棋停了一手，${opponent === 'black' ? '黑' : '白'}棋走`,
  };
}

export function getGoAIMove(state: GoGameState): [number, number] | null {
  const size = state.boardSize;
  const candidates: { r: number; c: number; score: number }[] = [];
  const aiColor = state.currentPlayer;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (state.board[r][c] !== null) continue;

      const testBoard = state.board.map(row => [...row]);
      testBoard[r][c] = aiColor;

      let score = 0;
      const opponent = aiColor === 'black' ? 'white' : 'black';

      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        const nr = r + dr, nc = c + dc;
        if (inBounds(nr, nc, size) && testBoard[nr][nc] === opponent) {
          const group = getGroup(testBoard, nr, nc, opponent);
          if (getLiberties(testBoard, group) === 0) score += group.length * 10;
        }
      }

      const myGroup = getGroup(testBoard, r, c, aiColor);
      const libs = getLiberties(testBoard, myGroup);
      if (libs === 0) continue;
      score += libs * 2;

      const centerDist = Math.abs(r - size/2) + Math.abs(c - size/2);
      score += (size - centerDist) * 0.1;

      score += Math.random() * 3;
      candidates.push({ r, c, score });
    }
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.score - a.score);
  const top = candidates.slice(0, 5);
  const pick = top[Math.floor(Math.random() * Math.min(3, top.length))];
  return [pick.r, pick.c];
}
