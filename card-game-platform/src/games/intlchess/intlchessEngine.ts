export type IChessPiece = { type: string; color: 'white' | 'black'; hasMoved: boolean } | null;

export interface IChessState {
  board: IChessPiece[][];
  currentPlayer: 'white' | 'black';
  selected: [number, number] | null;
  validMoves: [number, number][];
  winner: string | null;
  message: string;
  moveHistory: string[];
  enPassant: [number, number] | null;
}

const PIECE_VALUES: Record<string, number> = { king: 0, queen: 9, rook: 5, bishop: 3, knight: 3, pawn: 1 };

function initBoard(): IChessPiece[][] {
  const back: string[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
  const board: IChessPiece[][] = Array.from({ length: 8 }, () => Array(8).fill(null));

  for (let c = 0; c < 8; c++) {
    board[0][c] = { type: back[c], color: 'black', hasMoved: false };
    board[7][c] = { type: back[c], color: 'white', hasMoved: false };
    board[1][c] = { type: 'pawn', color: 'black', hasMoved: false };
    board[6][c] = { type: 'pawn', color: 'white', hasMoved: false };
  }
  return board;
}

export function initIChess(): IChessState {
  const state: IChessState = {
    board: initBoard(), currentPlayer: 'white', selected: null,
    validMoves: [], winner: null, message: '白棋先行', moveHistory: [], enPassant: null,
  };
  return state;
}

function inBounds(r: number, c: number) { return r >= 0 && r < 8 && c >= 0 && c < 8; }

function cloneBoard(board: IChessPiece[][]): IChessPiece[][] {
  return board.map(r => r.map(c => c ? { ...c } : null));
}

function isInCheck(board: IChessPiece[][], color: 'white' | 'black'): boolean {
  const kingPos = findKing(board, color);
  if (!kingPos) return false;
  const oppColor = color === 'white' ? 'black' : 'white';

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === oppColor) {
        const moves = getRawMoves(board, r, c, piece, null);
        if (moves.some(([tr, tc]) => tr === kingPos[0] && tc === kingPos[1])) return true;
      }
    }
  }
  return false;
}

function findKing(board: IChessPiece[][], color: 'white' | 'black'): [number, number] | null {
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    if (board[r][c]?.type === 'king' && board[r][c]?.color === color) return [r, c];
  }
  return null;
}

function getRawMoves(board: IChessPiece[][], r: number, c: number, piece: IChessPiece, enPassant: [number, number] | null): [number, number][] {
  if (!piece) return [];
  const moves: [number, number][] = [];
  const opp = piece.color === 'white' ? 'black' : 'white';
  const dir = piece.color === 'white' ? -1 : 1;

  function add(rr: number, cc: number) {
    if (!inBounds(rr, cc)) return false;
    if (board[rr][cc]?.color === piece!.color) return false;
    moves.push([rr, cc]);
    return board[rr][cc]?.color === opp;
  }

  switch (piece.type) {
    case 'pawn': {
      const fwd = r + dir;
      if (inBounds(fwd, c) && !board[fwd][c]) {
        moves.push([fwd, c]);
        const startRow = piece.color === 'white' ? 6 : 1;
        if (r === startRow && !board[r + 2 * dir][c]) moves.push([r + 2 * dir, c]);
      }
      for (const dc of [-1, 1]) {
        const nc = c + dc;
        if (inBounds(fwd, nc)) {
          if (board[fwd][nc]?.color === opp) moves.push([fwd, nc]);
          if (enPassant && enPassant[0] === fwd && enPassant[1] === nc) moves.push([fwd, nc]);
        }
      }
      break;
    }
    case 'knight':
      for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) add(r + dr, c + dc);
      break;
    case 'bishop':
      for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
        let nr = r + dr, nc = c + dc;
        while (inBounds(nr, nc) && !board[nr][nc]) { moves.push([nr, nc]); nr += dr; nc += dc; }
        if (inBounds(nr, nc) && board[nr][nc]?.color === opp) moves.push([nr, nc]);
      }
      break;
    case 'rook':
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        let nr = r + dr, nc = c + dc;
        while (inBounds(nr, nc) && !board[nr][nc]) { moves.push([nr, nc]); nr += dr; nc += dc; }
        if (inBounds(nr, nc) && board[nr][nc]?.color === opp) moves.push([nr, nc]);
      }
      break;
    case 'queen':
      for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
        let nr = r + dr, nc = c + dc;
        while (inBounds(nr, nc) && !board[nr][nc]) { moves.push([nr, nc]); nr += dr; nc += dc; }
        if (inBounds(nr, nc) && board[nr][nc]?.color === opp) moves.push([nr, nc]);
      }
      break;
    case 'king': {
      for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) add(r + dr, c + dc);
      // Castling
      if (!piece.hasMoved) {
        const row = piece.color === 'white' ? 7 : 0;
        // Kingside
        if (board[row][7]?.type === 'rook' && !board[row][7]!.hasMoved && !board[row][5] && !board[row][6]) {
          if (!isInCheck(board, piece.color)) {
            const testB = cloneBoard(board);
            testB[row][5] = testB[row][4]; testB[row][4] = null;
            if (!isInCheck(testB, piece.color)) moves.push([row, 6]);
          }
        }
        // Queenside
        if (board[row][0]?.type === 'rook' && !board[row][0]!.hasMoved && !board[row][1] && !board[row][2] && !board[row][3]) {
          if (!isInCheck(board, piece.color)) {
            const testB = cloneBoard(board);
            testB[row][3] = testB[row][4]; testB[row][4] = null;
            if (!isInCheck(testB, piece.color)) moves.push([row, 2]);
          }
        }
      }
      break;
    }
  }
  return moves;
}

export function getLegalMoves(board: IChessPiece[][], r: number, c: number, piece: IChessPiece, enPassant: [number, number] | null): [number, number][] {
  const raw = getRawMoves(board, r, c, piece, enPassant);
  return raw.filter(([tr, tc]) => {
    const test = cloneBoard(board);
    test[tr][tc] = test[r][c];
    test[r][c] = null;
    // Handle en passant capture
    if (piece?.type === 'pawn' && enPassant && tr === enPassant[0] && tc === enPassant[1]) {
      test[r][tc] = null; // Remove captured pawn
    }
    return !isInCheck(test, piece!.color);
  });
}

export function makeIChessMove(state: IChessState, fromRow: number, fromCol: number, toRow: number, toCol: number): IChessState {
  if (!state.validMoves.some(([r, c]) => r === toRow && c === toCol)) return state;

  const board = cloneBoard(state.board);
  const piece = board[fromRow][fromCol]!;
  let enPassant: [number, number] | null = null;

  // En passant capture
  if (piece.type === 'pawn' && state.enPassant && toRow === state.enPassant[0] && toCol === state.enPassant[1]) {
    board[fromRow][toCol] = null;
  }

  // En passant target
  if (piece.type === 'pawn' && Math.abs(toRow - fromRow) === 2) {
    enPassant = [(fromRow + toRow) / 2, fromCol];
  }

  // Castling
  if (piece.type === 'king' && Math.abs(toCol - fromCol) === 2) {
    const row = fromRow;
    if (toCol === 6) { board[row][5] = board[row][7]; board[row][7] = null; board[row][5]!.hasMoved = true; }
    else { board[row][3] = board[row][0]; board[row][0] = null; board[row][3]!.hasMoved = true; }
  }

  // Promotion
  if (piece.type === 'pawn' && (toRow === 0 || toRow === 7)) {
    piece.type = 'queen';
  }

  board[toRow][toCol] = { ...piece, hasMoved: true };
  board[fromRow][fromCol] = null;

  const opp: 'white' | 'black' = state.currentPlayer === 'white' ? 'black' : 'white';
  const isCheck = isInCheck(board, opp);
  const hasMoves = board.some((r, ri) => r.some((p, ci) => p && p.color === opp && getLegalMoves(board, ri, ci, p, enPassant).length > 0));

  if (!hasMoves) {
    const winner = isCheck ? state.currentPlayer : 'draw';
    return { ...state, board, winner, message: winner === 'draw' ? '逼和！平局' : `${state.currentPlayer === 'white' ? '白棋' : '黑棋'}将杀获胜！`, enPassant };
  }

  const nextState: IChessState = {
    ...state, board, currentPlayer: opp, selected: null, validMoves: [],
    message: `${opp === 'white' ? '白棋' : '黑棋'}走${isCheck ? ' (将军!)' : ''}`,
    enPassant, moveHistory: [...state.moveHistory, `${fromRow}${fromCol}${toRow}${toCol}`],
  };
  return nextState;
}

export function selectIChessPiece(state: IChessState, row: number, col: number): IChessState {
  const piece = state.board[row][col];
  if (piece && piece.color === state.currentPlayer) {
    return { ...state, selected: [row, col], validMoves: getLegalMoves(state.board, row, col, piece, state.enPassant) };
  }
  return { ...state, selected: null, validMoves: [] };
}

// Simple AI
export function ichessAI(state: IChessState): { from: [number, number]; to: [number, number] } | null {
  const allMoves: { from: [number, number]; to: [number, number]; score: number }[] = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = state.board[r][c];
      if (!piece || piece.color !== 'black') continue;
      const moves = getLegalMoves(state.board, r, c, piece, state.enPassant);
      for (const [tr, tc] of moves) {
        let score = 0;
        const target = state.board[tr][tc];
        if (target) score += (PIECE_VALUES[target.type] || 0) * 10;
        if (piece.type === 'pawn' && (tr === 0 || tr === 7)) score += 90;
        // Center control
        if (tr >= 2 && tr <= 5 && tc >= 2 && tc <= 5) score += 2;
        score += Math.random() * 3;
        allMoves.push({ from: [r, c], to: [tr, tc], score });
      }
    }
  }
  if (!allMoves.length) return null;
  allMoves.sort((a, b) => b.score - a.score);
  const top = allMoves[0];
  return { from: top.from, to: top.to };
}
