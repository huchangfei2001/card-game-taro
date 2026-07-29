export interface LudoPiece { id: number; pos: number; atHome: boolean; finished: boolean; }

export interface LudoPlayer {
  id: number; name: string; color: string; pieces: LudoPiece[];
  startPos: number; homePos: number; isAI: boolean;
}

export interface LudoState {
  players: LudoPlayer[];
  currentPlayer: number;
  dice: number;
  phase: 'rolling' | 'moving' | 'finished';
  winner: number | null;
  message: string;
}

const COLORS = ['#e63946', '#2a9d8f', '#e9c46a', '#457b9d'];
const STARTS = [0, 13, 26, 39];

export function initLudo(): LudoState {
  const players: LudoPlayer[] = [0, 1, 2, 3].map(i => ({
    id: i, name: i === 0 ? '你' : `电脑${'ABCD'[i]}`,
    color: COLORS[i], pieces: [0,1,2,3].map(j => ({ id: j, pos: -1, atHome: true, finished: false })),
    startPos: STARTS[i], homePos: (STARTS[i] + 50) % 52, isAI: i !== 0,
  }));
  return { players, currentPlayer: 0, dice: 1, phase: 'rolling', winner: null, message: '掷骰子开始' };
}

export function rollDice(state: LudoState): LudoState {
  if (state.phase !== 'rolling') return state;
  const dice = Math.floor(Math.random() * 6) + 1;
  const p = state.players[state.currentPlayer];
  let canMove = false;

  if (dice === 6) {
    // Can move a piece out of home or move 6
    canMove = p.pieces.some(pc => pc.atHome) || p.pieces.some(pc => !pc.atHome && !pc.finished);
  } else {
    canMove = p.pieces.some(pc => !pc.atHome && !pc.finished);
  }

  if (!canMove) {
    const next = (state.currentPlayer + 1) % 4;
    return { ...state, dice, currentPlayer: next, message: `${p.name} 无法移动，轮到${state.players[next].name}` };
  }

  return { ...state, dice, phase: 'moving', message: `${p.name} 掷出 ${dice}，请选择棋子` };
}

export function movePiece(state: LudoState, pieceId: number): LudoState {
  if (state.phase !== 'moving') return state;
  const p = state.players[state.currentPlayer];
  const piece = p.pieces.find(pc => pc.id === pieceId);
  if (!piece) return state;

  if (piece.atHome) {
    if (state.dice === 6) {
      piece.atHome = false;
      piece.pos = p.startPos;
    } else return state;
  } else if (!piece.finished) {
    let newPos = piece.pos;
    // Check if entering home stretch
    const homeEntry = p.startPos === 0 ? 50 : p.startPos === 13 ? 11 : p.startPos === 26 ? 24 : 37;
    const distToHome = (homeEntry - piece.pos + 52) % 52;

    if (distToHome <= state.dice && distToHome > 0) {
      // Enter home stretch
      const remaining = state.dice - distToHome;
      if (remaining < 6) {
        // Simplified: mark as finished
        piece.finished = true;
      } else {
        newPos = (piece.pos + state.dice) % 52;
        piece.pos = newPos;
      }
    } else {
      newPos = (piece.pos + state.dice) % 52;
      piece.pos = newPos;
      // Check capture
      for (const op of state.players) {
        if (op.id === p.id) continue;
        for (const opPiece of op.pieces) {
          if (!opPiece.atHome && !opPiece.finished && opPiece.pos === newPos) {
            opPiece.atHome = true;
            opPiece.pos = -1;
          }
        }
      }
    }
  }

  // Check win
  if (p.pieces.every(pc => pc.finished)) {
    return { ...state, phase: 'finished', winner: p.id, message: `${p.name} 赢了！` };
  }

  const next = state.dice === 6 ? state.currentPlayer : (state.currentPlayer + 1) % 4;
  return { ...state, phase: 'rolling', currentPlayer: next, message: `轮到 ${state.players[next].name}` };
}

export function ludoAI(state: LudoState): number | null {
  const p = state.players[state.currentPlayer];
  if (!p.isAI) return null;

  if (state.dice === 6) {
    const homePiece = p.pieces.find(pc => pc.atHome);
    if (homePiece) return homePiece.id;
  }
  const movable = p.pieces.filter(pc => !pc.atHome && !pc.finished);
  if (!movable.length) return null;
  // Prefer most advanced piece
  movable.sort((a, b) => b.pos - a.pos);
  return movable[0].id;
}
