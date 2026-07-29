export type PieceType = 'king'|'advisor'|'elephant'|'knight'|'rook'|'cannon'|'pawn';

export interface ChessPiece {
  type: PieceType;
  isRed: boolean;
}

export type Board = (ChessPiece | null)[][];

export interface ChessGameState {
  board: Board;
  currentPlayer: 'red' | 'black';
  selectedRow: number | null;
  selectedCol: number | null;
  winner: 'red' | 'black' | null;
  moveHistory: string[];
  message: string;
}

const INITIAL_BOARD: Board = [
  [
    {type:'rook',isRed:false},{type:'knight',isRed:false},{type:'elephant',isRed:false},
    {type:'advisor',isRed:false},{type:'king',isRed:false},{type:'advisor',isRed:false},
    {type:'elephant',isRed:false},{type:'knight',isRed:false},{type:'rook',isRed:false}
  ],
  [null,null,null,null,null,null,null,null,null],
  [null,{type:'cannon',isRed:false},null,null,null,null,null,{type:'cannon',isRed:false},null],
  [{type:'pawn',isRed:false},null,{type:'pawn',isRed:false},null,{type:'pawn',isRed:false},null,{type:'pawn',isRed:false},null,{type:'pawn',isRed:false}],
  [null,null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null,null],
  [{type:'pawn',isRed:true},null,{type:'pawn',isRed:true},null,{type:'pawn',isRed:true},null,{type:'pawn',isRed:true},null,{type:'pawn',isRed:true}],
  [null,{type:'cannon',isRed:true},null,null,null,null,null,{type:'cannon',isRed:true},null],
  [null,null,null,null,null,null,null,null,null],
  [
    {type:'rook',isRed:true},{type:'knight',isRed:true},{type:'elephant',isRed:true},
    {type:'advisor',isRed:true},{type:'king',isRed:true},{type:'advisor',isRed:true},
    {type:'elephant',isRed:true},{type:'knight',isRed:true},{type:'rook',isRed:true}
  ],
];

export function initChessGame(): ChessGameState {
  return {
    board: INITIAL_BOARD.map(row => [...row]),
    currentPlayer: 'red',
    selectedRow: null, selectedCol: null, winner: null,
    moveHistory: [], message: '红方先行'
  };
}

function isInPalace(row: number, col: number, isRed: boolean): boolean {
  if (isRed) return row >= 7 && row <= 9 && col >= 3 && col <= 5;
  return row >= 0 && row <= 2 && col >= 3 && col <= 5;
}

function inBounds(r: number, c: number): boolean {
  return r >= 0 && r <= 9 && c >= 0 && c <= 8;
}

export function getValidMoves(state: ChessGameState, row: number, col: number): [number,number][] {
  const piece = state.board[row][col];
  if (!piece) return [];
  if ((piece.isRed && state.currentPlayer === 'black') || (!piece.isRed && state.currentPlayer === 'red')) return [];

  const moves: [number,number][] = [];
  const isRed = piece.isRed;
  const board = state.board;

  function addMove(r: number, c: number) {
    if (!inBounds(r,c)) return;
    const target = board[r][c];
    if (target && target.isRed === isRed) return;
    moves.push([r,c]);
  }

  switch (piece.type) {
    case 'king':
      for (const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        const nr = row+dr, nc = col+dc;
        if (inBounds(nr,nc) && isInPalace(nr,nc,isRed)) addMove(nr,nc);
      }
      break;
    case 'advisor':
      for (const [dr,dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
        const nr = row+dr, nc = col+dc;
        if (inBounds(nr,nc) && isInPalace(nr,nc,isRed)) addMove(nr,nc);
      }
      break;
    case 'elephant':
      for (const [dr,dc,br,bc] of [[-2,-2,-1,-1],[-2,2,-1,1],[2,-2,1,-1],[2,2,1,1]]) {
        const nr = row+dr, nc = col+dc;
        const blockR = row+br, blockC = col+bc;
        if (inBounds(nr,nc) && !board[blockR][blockC] && (isRed ? nr>=5 : nr<=4)) addMove(nr,nc);
      }
      break;
    case 'knight':
      for (const [dr,dc,br,bc] of [[-2,-1,-1,0],[-2,1,-1,0],[2,-1,1,0],[2,1,1,0],[-1,-2,0,-1],[-1,2,0,1],[1,-2,0,-1],[1,2,0,1]]) {
        const nr = row+dr, nc = col+dc;
        if (inBounds(nr,nc) && !board[row+br][col+bc]) addMove(nr,nc);
      }
      break;
    case 'rook':
      for (const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        let nr = row+dr, nc = col+dc;
        while (inBounds(nr,nc)) {
          if (board[nr][nc]) {
            if (board[nr][nc]!.isRed !== isRed) addMove(nr,nc);
            break;
          }
          addMove(nr,nc);
          nr += dr; nc += dc;
        }
      }
      break;
    case 'cannon':
      for (const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        let nr = row+dr, nc = col+dc;
        while (inBounds(nr,nc) && !board[nr][nc]) { addMove(nr,nc); nr+=dr; nc+=dc; }
        nr += dr; nc += dc;
        while (inBounds(nr,nc)) {
          if (board[nr][nc]) {
            if (board[nr][nc]!.isRed !== isRed) addMove(nr,nc);
            break;
          }
          nr += dr; nc += dc;
        }
      }
      break;
    case 'pawn':
      if (isRed) {
        addMove(row-1,col);
        if (row <= 4) { addMove(row,col-1); addMove(row,col+1); }
      } else {
        addMove(row+1,col);
        if (row >= 5) { addMove(row,col-1); addMove(row,col+1); }
      }
      break;
  }
  return moves;
}

export function makeChessMove(state: ChessGameState, fromRow: number, fromCol: number, toRow: number, toCol: number): ChessGameState {
  const board = state.board.map(row => [...row]);
  const piece = board[fromRow][fromCol];
  const target = board[toRow][toCol];

  if (target?.type === 'king') {
    return {
      board, currentPlayer: state.currentPlayer === 'red' ? 'black' : 'red',
      selectedRow: null, selectedCol: null,
      winner: piece?.isRed ? 'red' : 'black',
      moveHistory: [...state.moveHistory, `${fromRow},${fromCol}-${toRow},${toCol}`],
      message: `${piece?.isRed ? '红' : '黑'}方获胜！`
    };
  }

  board[toRow][toCol] = piece;
  board[fromRow][fromCol] = null;

  return {
    board,
    currentPlayer: state.currentPlayer === 'red' ? 'black' : 'red',
    selectedRow: null, selectedCol: null, winner: null,
    moveHistory: [...state.moveHistory, `${fromRow},${fromCol}-${toRow},${toCol}`],
    message: `${state.currentPlayer === 'red' ? '黑' : '红'}方走棋`
  };
}

export function getChessAIMove(state: ChessGameState): { fromRow: number; fromCol: number; toRow: number; toCol: number } | null {
  const allMoves: { fromRow: number; fromCol: number; toRow: number; toCol: number; score: number }[] = [];

  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const piece = state.board[r][c];
      if (!piece || piece.isRed === (state.currentPlayer === 'red')) continue;
      if ((piece.isRed && state.currentPlayer === 'black') || (!piece.isRed && state.currentPlayer === 'red')) continue;
      const moves = getValidMoves(state, r, c);
      for (const [tr, tc] of moves) {
        const target = state.board[tr][tc];
        let score = 0;
        if (target) {
          const val: Record<string,number> = { king:10000, rook:500, cannon:300, knight:300, elephant:200, advisor:200, pawn:100 };
          score += val[target.type] || 0;
          if (target.type === 'king') score += 999999;
        }
        score += Math.random() * 10;
        allMoves.push({ fromRow: r, fromCol: c, toRow: tr, toCol: tc, score });
      }
    }
  }

  if (allMoves.length === 0) return null;
  allMoves.sort((a,b) => b.score - a.score);
  const top = allMoves.slice(0, 3);
  return top[Math.floor(Math.random() * top.length)];
}
