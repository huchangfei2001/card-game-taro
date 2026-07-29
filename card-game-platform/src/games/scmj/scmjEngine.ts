// 四川血战到底 (Sichuan Mahjong) Engine
// 108 tiles (no flowers), 缺一门 rule, 刮风下雨

export type ScMjTile = { suit: 'wan' | 'tiao' | 'tong'; num: number; id: number };

export interface ScMjPlayer {
  id: number; name: string; hand: ScMjTile[]; discards: ScMjTile[];
  melds: { type: 'chi' | 'peng' | 'angang' | 'minggang' | 'bugang'; tiles: ScMjTile[] }[];
  hu: boolean; isAI: boolean; score: number; que: string | null;
}

export interface ScMjState {
  players: ScMjPlayer[];
  wall: ScMjTile[];
  currentPlayer: number;
  phase: 'dealing' | 'que_select' | 'playing' | 'finished';
  lastDiscard: ScMjTile | null;
  remaining: number;
  turn: number;
  message: string;
}

function createWall(): ScMjTile[] {
  const wall: ScMjTile[] = [];
  let id = 0;
  const suits: ScMjTile['suit'][] = ['wan', 'tiao', 'tong'];
  for (const suit of suits) {
    for (let n = 1; n <= 9; n++) {
      for (let i = 0; i < 4; i++) wall.push({ suit, num: n, id: id++ });
    }
  }
  return shuffle(wall);
}

function shuffle<T>(arr: T[]): T[] { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

export function tileName(t: ScMjTile): string {
  const s = { wan: '万', tiao: '条', tong: '筒' };
  return `${t.num}${s[t.suit]}`;
}

export function initScMj(): ScMjState {
  const wall = createWall();
  const players: ScMjPlayer[] = [
    { id: 0, name: '你', hand: [], discards: [], melds: [], hu: false, isAI: false, score: 0, que: null },
    { id: 1, name: '电脑A', hand: [], discards: [], melds: [], hu: false, isAI: true, score: 0, que: null },
    { id: 2, name: '电脑B', hand: [], discards: [], melds: [], hu: false, isAI: true, score: 0, que: null },
    { id: 3, name: '电脑C', hand: [], discards: [], melds: [], hu: false, isAI: true, score: 0, que: null },
  ];
  for (const p of players) {
    p.hand = wall.splice(0, 13);
    p.hand.sort((a, b) => a.suit.localeCompare(b.suit) || a.num - b.num);
  }
  return { players, wall, currentPlayer: 0, phase: 'que_select', lastDiscard: null, remaining: wall.length, turn: 0, message: '血战到底 - 请选择缺一门' };
}

export function selectQue(state: ScMjState, suit: ScMjTile['suit'] | null): ScMjState {
  if (state.phase !== 'que_select') return state;
  const players = state.players.map(p => ({ ...p, hand: [...p.hand], discards: [...p.discards], melds: [...p.melds] }));
  players[state.currentPlayer].que = suit;
  const next = (state.currentPlayer + 1) % 4;
  if (next === 0) {
    // Steal wall if AI
    for (let i = 1; i < players.length; i++) {
      if (!players[i].que) players[i].que = aiSelectQue(players[i]);
    }
    return { ...state, players, phase: 'playing', currentPlayer: 0, message: '游戏开始' };
  }
  return { ...state, players, currentPlayer: next };
}

function aiSelectQue(p: ScMjPlayer): ScMjTile['suit'] {
  const counts = { wan: 0, tiao: 0, tong: 0 };
  p.hand.forEach(t => counts[t.suit]++);
  const sorted = Object.entries(counts).sort((a, b) => a[1] - b[1]);
  return sorted[0][0] as ScMjTile['suit'];
}

function canHu(hand: ScMjTile[]): boolean {
  if (hand.length % 3 !== 2) return false;
  const sorted = [...hand].sort((a, b) => a.suit.localeCompare(b.suit) || a.num - b.num);

  // Try each possible pair
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].suit === sorted[i+1].suit && sorted[i].num === sorted[i+1].num) {
      const remaining = sorted.filter((_, idx) => idx !== i && idx !== i+1);
      if (canMeld(remaining)) return true;
    }
  }
  return false;
}

function canMeld(tiles: ScMjTile[]): boolean {
  if (tiles.length === 0) return true;
  const sorted = [...tiles].sort((a, b) => a.suit.localeCompare(b.suit) || a.num - b.num);

  // Try triple
  if (sorted.length >= 3 && sorted[0].suit === sorted[1].suit && sorted[1].suit === sorted[2].suit &&
      sorted[0].num === sorted[1].num && sorted[1].num === sorted[2].num) {
    if (canMeld(sorted.slice(3))) return true;
  }

  // Try sequence
  if (sorted.length >= 3) {
    const idx1 = sorted.findIndex(t => t.suit === sorted[0].suit && t.num === sorted[0].num + 1);
    const idx2 = sorted.findIndex(t => t.suit === sorted[0].suit && t.num === sorted[0].num + 2);
    if (idx1 > 0 && idx2 > 0 && idx1 !== idx2) {
      const remaining = sorted.filter((_, i) => i !== 0 && i !== idx1 && i !== idx2);
      if (canMeld(remaining)) return true;
    }
  }
  return false;
}

export function scmjAction(state: ScMjState, playerId: number, action: string, tile?: ScMjTile): ScMjState {
  if (state.phase !== 'playing' || playerId !== state.currentPlayer) return state;
  const players = state.players.map(p => ({ ...p, hand: [...p.hand], discards: [...p.discards], melds: [...p.melds] }));
  const wall = [...state.wall];
  const p = players[playerId];

  if (action === 'discard' && tile) {
    const idx = p.hand.findIndex(t => t.id === tile.id);
    if (idx < 0) return state;
    p.discards.push(p.hand.splice(idx, 1)[0]);
    const lastDiscard = p.discards[p.discards.length - 1];

    // Check if discard violates que
    if (p.que && lastDiscard.suit !== p.que) {
      // must keep discarding that suit until no more
      const stillHas = p.hand.some(t => t.suit !== p.que);
      if (stillHas) return { ...state, players, message: `${p.name} 必须出${p.que}门` };
    }

    return { ...state, players, currentPlayer: (playerId + 1) % 4, lastDiscard, message: `${p.name} 出 ${tileName(lastDiscard)}` };
  }

  if (action === 'draw') {
    const drawn = wall.pop();
    if (!drawn) return state;
    p.hand.push(drawn);
    p.hand.sort((a, b) => a.suit.localeCompare(b.suit) || a.num - b.num);

    // Check hu
    if (canHu(p.hand)) {
      p.hu = true;
      return { ...state, players, wall, phase: 'finished', message: `${p.name} 自摸胡牌！` };
    }
    return { ...state, players, wall, message: `${p.name} 摸牌` };
  }

  return state;
}

export function scmjAI(state: ScMjState, playerId: number): { action: string; tile?: ScMjTile } {
  const p = state.players[playerId];
  if (p.hand.length % 3 === 0) return { action: 'draw' };
  // Discard random tile not in que
  const nonQue = p.hand.filter(t => t.suit !== p.que);
  if (nonQue.length) return { action: 'discard', tile: nonQue[0] };
  return { action: 'discard', tile: p.hand[p.hand.length - 1] };
}
