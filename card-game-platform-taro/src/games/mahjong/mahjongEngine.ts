export interface MahjongPlayer {
  id: number;
  name: string;
  tiles: string[];
  melds: { type: 'chi' | 'peng' | 'gang' | 'angang'; tiles: string[] }[];
  discarded: string[];
  isAI: boolean;
  isDealer: boolean;
}

export interface MahjongGameState {
  players: MahjongPlayer[];
  wall: string[];
  currentPlayer: number;
  lastDiscard: { playerId: number; tile: string } | null;
  laizi: string;
  phase: 'dealing' | 'playing' | 'finished';
  winner: number | null;
  message: string;
  turnPhase: 'draw' | 'discard';
}

const SUIT_TILES = {
  wan: ['一萬','二萬','三萬','四萬','五萬','六萬','七萬','八萬','九萬'],
  tong: ['一筒','二筒','三筒','四筒','五筒','六筒','七筒','八筒','九筒'],
  tiao: ['一條','二條','三條','四條','五條','六條','七條','八條','九條'],
};
const WINDS = ['東','南','西','北'];
const DRAGONS = ['中','發','白'];

function createMahjongWall(): string[] {
  const tiles: string[] = [];
  for (const suit of Object.values(SUIT_TILES)) {
    for (const t of suit) {
      for (let i = 0; i < 4; i++) tiles.push(t);
    }
  }
  for (const w of WINDS) {
    for (let i = 0; i < 4; i++) tiles.push(w);
  }
  for (const d of DRAGONS) {
    for (let i = 0; i < 4; i++) tiles.push(d);
  }
  return shuffle(tiles);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function initMahjongGame(): MahjongGameState {
  const wall = createMahjongWall();
  const laizi = wall[wall.length - 5];
  const players: MahjongPlayer[] = [
    { id:0, name:'你', tiles:[], melds:[], discarded:[], isAI:false, isDealer:true },
    { id:1, name:'电脑A', tiles:[], melds:[], discarded:[], isAI:true, isDealer:false },
    { id:2, name:'电脑B', tiles:[], melds:[], discarded:[], isAI:true, isDealer:false },
    { id:3, name:'电脑C', tiles:[], melds:[], discarded:[], isAI:true, isDealer:false },
  ];

  for (const p of players) {
    p.tiles = wall.splice(0, 13);
    p.tiles.sort();
  }
  players[0].tiles = wall.splice(0, 14);
  players[0].tiles.sort();

  return {
    players, wall, laizi, currentPlayer: 0,
    lastDiscard: null, phase: 'playing', winner: null,
    message: `赖子: ${laizi}，请出牌`, turnPhase: 'discard',
  };
}

function getTileSuit(tile: string): string | null {
  for (const [suit, tiles] of Object.entries(SUIT_TILES)) {
    if (tiles.includes(tile)) return suit;
  }
  if (WINDS.includes(tile)) return 'wind';
  if (DRAGONS.includes(tile)) return 'dragon';
  return null;
}

function getTileNumber(tile: string): number {
  for (const [, tiles] of Object.entries(SUIT_TILES)) {
    const idx = tiles.indexOf(tile);
    if (idx >= 0) return idx + 1;
  }
  return 0;
}

function isLaizi(tile: string, laizi: string): boolean {
  if (tile === '中') return true; // 红中是万能牌
  if (tile === laizi) return true;
  return false;
}

function getNextTile(tile: string): string {
  const suit = getTileSuit(tile);
  if (!suit || suit === 'wind' || suit === 'dragon') return '';
  const num = getTileNumber(tile);
  if (num >= 9) return '';
  return SUIT_TILES[suit as keyof typeof SUIT_TILES][num];
}

function getPrevTile(tile: string): string {
  const suit = getTileSuit(tile);
  if (!suit || suit === 'wind' || suit === 'dragon') return '';
  const num = getTileNumber(tile);
  if (num <= 1) return '';
  return SUIT_TILES[suit as keyof typeof SUIT_TILES][num - 2];
}

function countTiles(tiles: string[]): Map<string, number> {
  const map = new Map<string, number>();
  tiles.forEach(t => map.set(t, (map.get(t) || 0) + 1));
  return map;
}

function canWin(tiles: string[], laizi: string): boolean {
  const nonLaizi = tiles.filter(t => !isLaizi(t, laizi));
  const laiziCount = tiles.length - nonLaizi.length;

  const counts = countTiles(nonLaizi);
  return checkMahjongHand(counts, nonLaizi.length + laiziCount, laiziCount);
}

function checkMahjongHand(counts: Map<string,number>, total: number, laiziCount: number): boolean {
  if (total === 0) return true;
  if (total % 3 !== 2) return false;

  const tiles = [...counts.keys()].sort();
  for (const tile of tiles) {
    const cnt = counts.get(tile) || 0;

    if (cnt >= 2) {
      const newCounts = new Map(counts);
      newCounts.set(tile, cnt - 2);
      if (canFormMelds(newCounts, total - 2, laiziCount)) return true;
    }

    if (laiziCount >= 1 && cnt >= 1) {
      const newCounts = new Map(counts);
      newCounts.set(tile, cnt - 1);
      if (canFormMelds(newCounts, total - 2, laiziCount - 1)) return true;
    }

    if (laiziCount >= 2) {
      if (canFormMelds(counts, total - 2, laiziCount - 2)) return true;
    }
  }

  if (laiziCount >= 2) {
    return canFormMelds(counts, total - 2, laiziCount - 2);
  }

  return false;
}

function canFormMelds(counts: Map<string,number>, total: number, laiziCount: number): boolean {
  if (total === 0) return true;

  const tiles = [...counts.keys()].filter(t => (counts.get(t) || 0) > 0).sort();
  if (tiles.length === 0 && laiziCount >= 3) return true;

  const first = tiles[0];
  if (!first) return false;
  const cnt = counts.get(first) || 0;

  if (cnt >= 3) {
    const newCounts = new Map(counts);
    newCounts.set(first, cnt - 3);
    if (canFormMelds(newCounts, total - 3, laiziCount)) return true;
  }

  if (cnt >= 1 && laiziCount >= 2) {
    const newCounts = new Map(counts);
    newCounts.set(first, cnt - 1);
    if (canFormMelds(newCounts, total - 3, laiziCount - 2)) return true;
  }

  if (cnt >= 2 && laiziCount >= 1) {
    const newCounts = new Map(counts);
    newCounts.set(first, cnt - 2);
    if (canFormMelds(newCounts, total - 3, laiziCount - 1)) return true;
  }

  const suit = getTileSuit(first);
  if (suit && suit !== 'wind' && suit !== 'dragon') {
    const next = getNextTile(first);
    const nextNext = next ? getNextTile(next) : '';
    if (next && nextNext) {
      const n1 = counts.get(next) || 0;
      const n2 = counts.get(nextNext) || 0;
      if (n1 > 0 && n2 > 0) {
        const newCounts = new Map(counts);
        newCounts.set(first, cnt - 1);
        newCounts.set(next, n1 - 1);
        newCounts.set(nextNext, n2 - 1);
        if (canFormMelds(newCounts, total - 3, laiziCount)) return true;
      }
    }
  }

  return false;
}

export function discardTile(state: MahjongGameState, playerId: number, tileIndex: number): MahjongGameState {
  const s = cloneState(state);
  const p = s.players[playerId];
  if (playerId !== s.currentPlayer || s.turnPhase !== 'discard') return state;
  if (tileIndex < 0 || tileIndex >= p.tiles.length) return state;

  const tile = p.tiles.splice(tileIndex, 1)[0];
  p.discarded.push(tile);
  s.lastDiscard = { playerId, tile };
  s.currentPlayer = (s.currentPlayer + 1) % 4;
  s.turnPhase = 'draw';
  s.message = `${p.name} 打出 ${tile}`;

  checkWinAfterDiscard(s);

  return s;
}

function checkWinAfterDiscard(state: MahjongGameState) {
  for (let i = 0; i < 4; i++) {
    if (i === state.currentPlayer || (state.currentPlayer + 3) % 4 === i) continue;
    const p = state.players[i];
    const tiles = [...p.tiles, state.lastDiscard!.tile];
    if (canWin(tiles, state.laizi)) {
      state.winner = i;
      state.phase = 'finished';
      state.message = `${p.name} 胡了！`;
    }
  }
}

export function drawTile(state: MahjongGameState, playerId: number): MahjongGameState {
  const s = cloneState(state);
  if (playerId !== s.currentPlayer || s.turnPhase !== 'draw') return state;

  if (s.wall.length === 0) {
    s.phase = 'finished';
    s.message = '流局';
    return s;
  }

  const tile = s.wall.pop()!;
  const p = s.players[playerId];
  p.tiles.push(tile);
  p.tiles.sort();

  if (canWin(p.tiles, s.laizi)) {
    s.winner = playerId;
    s.phase = 'finished';
    s.message = `${p.name} 自摸！`;
    return s;
  }

  s.turnPhase = 'discard';
  s.message = `${p.name} 摸牌，请出牌`;
  return s;
}

export function pengTile(state: MahjongGameState, playerId: number): MahjongGameState {
  const s = cloneState(state);
  if (!s.lastDiscard) return state;
  const tile = s.lastDiscard.tile;
  const p = s.players[playerId];
  const count = p.tiles.filter(t => t === tile).length;
  if (count < 2) return state;

  const idx1 = p.tiles.indexOf(tile);
  const idx2 = p.tiles.indexOf(tile, idx1 + 1);
  p.tiles.splice(idx2, 1);
  p.tiles.splice(idx1, 1);
  p.melds.push({ type: 'peng', tiles: [tile, tile, tile] });
  s.lastDiscard = null;
  s.currentPlayer = playerId;
  s.turnPhase = 'discard';
  s.message = `${p.name} 碰 ${tile}，请出牌`;
  return s;
}

export function gangTile(state: MahjongGameState, playerId: number): MahjongGameState {
  const s = cloneState(state);
  const p = s.players[playerId];

  if (s.lastDiscard && s.lastDiscard.playerId !== playerId) {
    const tile = s.lastDiscard.tile;
    const count = p.tiles.filter(t => t === tile).length;
    if (count >= 3) {
      for (let i = 0; i < 3; i++) {
        const idx = p.tiles.indexOf(tile);
        p.tiles.splice(idx, 1);
      }
      p.melds.push({ type: 'gang', tiles: [tile, tile, tile, tile] });
      s.lastDiscard = null;
      s.currentPlayer = playerId;
      const drawn = s.wall.pop();
      if (drawn) p.tiles.push(drawn);
      p.tiles.sort();
      s.turnPhase = 'discard';
      s.message = `${p.name} 杠 ${tile}，请出牌`;
      return s;
    }
  }

  for (const tile of [...new Set(p.tiles)]) {
    const count = p.tiles.filter(t => t === tile).length;
    if (count >= 4) {
      for (let i = 0; i < 4; i++) {
        const idx = p.tiles.indexOf(tile);
        p.tiles.splice(idx, 1);
      }
      p.melds.push({ type: 'angang', tiles: [tile, tile, tile, tile] });
      const drawn = s.wall.pop();
      if (drawn) p.tiles.push(drawn);
      p.tiles.sort();
      s.currentPlayer = playerId;
      s.turnPhase = 'discard';
      s.message = `${p.name} 暗杠 ${tile}，请出牌`;
      return s;
    }
  }

  return state;
}

export function getMahjongAIAction(state: MahjongGameState, playerId: number): { action: 'discard'; tileIndex: number } | { action: 'draw' } | { action: 'peng' } | { action: 'gang' } | { action: 'win' } {
  const p = state.players[playerId];

  if (state.lastDiscard && state.lastDiscard.playerId !== playerId) {
    const tiles = [...p.tiles, state.lastDiscard.tile];
    if (canWin(tiles, state.laizi)) return { action: 'win' };
  }

  if (state.lastDiscard && state.lastDiscard.playerId !== playerId) {
    const tile = state.lastDiscard.tile;
    const count = p.tiles.filter(t => t === tile).length;
    if (count >= 3 && Math.random() < 0.7) return { action: 'gang' };
    if (count >= 2 && Math.random() < 0.5) return { action: 'peng' };
  }

  if (state.turnPhase === 'draw') return { action: 'draw' };

  const gangCheck = gangTile(state, playerId);
  if (gangCheck !== state) return { action: 'gang' };

  // Discard the most isolated tile
  let bestIdx = 0;
  let bestScore = Infinity;
  for (let i = 0; i < p.tiles.length; i++) {
    const tile = p.tiles[i];
    if (isLaizi(tile, state.laizi)) continue;
    let score = 0;
    const suit = getTileSuit(tile);
    if (suit && suit !== 'wind' && suit !== 'dragon') {
      const prev = getPrevTile(tile);
      const next = getNextTile(tile);
      if (p.tiles.includes(prev)) score -= 3;
      if (p.tiles.includes(next)) score -= 3;
      if (prev && next && p.tiles.includes(prev) && p.tiles.includes(next)) score -= 5;
    }
    const same = p.tiles.filter(t => t === tile).length;
    score -= same * 2;
    score += Math.random() * 2;
    if (score < bestScore) { bestScore = score; bestIdx = i; }
  }

  return { action: 'discard', tileIndex: bestIdx };
}

function cloneState(state: MahjongGameState): MahjongGameState {
  return {
    ...state,
    players: state.players.map(p => ({
      ...p, tiles: [...p.tiles], melds: p.melds.map(m => ({ ...m, tiles: [...m.tiles] })),
      discarded: [...p.discarded]
    })),
    wall: [...state.wall],
    lastDiscard: state.lastDiscard ? { ...state.lastDiscard } : null,
  };
}
