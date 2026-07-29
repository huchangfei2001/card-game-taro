// 日本立直麻将 (Japanese Riichi Mahjong) Engine
// 34 tile types (man/pin/sou + winds + dragons), riichi, dora

export type RiichiTile = { type: string; id: number; red: boolean };

export interface RiichiPlayer {
  id: number; name: string; hand: RiichiTile[]; discards: RiichiTile[];
  melds: { type: 'chi' | 'pon' | 'kan'; tiles: RiichiTile[] }[];
  riichi: boolean; ippatsu: boolean; isAI: boolean; score: number;
}

export interface RiichiState {
  players: RiichiPlayer[];
  wall: RiichiTile[];
  doraIndicators: RiichiTile[];
  currentPlayer: number;
  phase: 'dealing' | 'playing' | 'finished';
  lastDiscard: RiichiTile | null;
  turn: number;
  message: string;
  dealer: number;
  roundWind: number; // 0=E, 1=S, 2=W, 3=N
}

function createRiichiWall(): RiichiTile[] {
  const wall: RiichiTile[] = [];
  let id = 0;
  const types = ['man','pin','sou'];
  for (const t of types) {
    for (let n = 1; n <= 9; n++) {
      for (let i = 0; i < 4; i++) {
        wall.push({ type: `${t}${n}`, id: id++, red: false });
      }
    }
  }
  // Winds
  const winds = ['east','south','west','north'];
  for (const w of winds) for (let i = 0; i < 4; i++) wall.push({ type: w, id: id++, red: false });
  // Dragons
  for (const d of ['haku','hatsu','chun']) for (let i = 0; i < 4; i++) wall.push({ type: d, id: id++, red: false });
  return shuffle(wall);
}

function shuffle<T>(arr: T[]): T[] { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

export function initRiichi(): RiichiState {
  const wall = createRiichiWall();
  const doraIndicators = [wall.pop()!];
  const players: RiichiPlayer[] = [
    { id: 0, name: '你', hand: [], discards: [], melds: [], riichi: false, ippatsu: false, isAI: false, score: 25000 },
    { id: 1, name: '电脑A', hand: [], discards: [], melds: [], riichi: false, ippatsu: false, isAI: true, score: 25000 },
    { id: 2, name: '电脑B', hand: [], discards: [], melds: [], riichi: false, ippatsu: false, isAI: true, score: 25000 },
    { id: 3, name: '电脑C', hand: [], discards: [], melds: [], riichi: false, ippatsu: false, isAI: true, score: 25000 },
  ];
  for (const p of players) {
    p.hand = wall.splice(0, 13);
    p.hand.sort((a, b) => a.type.localeCompare(b.type));
  }
  return { players, wall, doraIndicators, currentPlayer: 0, phase: 'playing', lastDiscard: null, turn: 0, message: '立直麻将 - 你的回合', dealer: 0, roundWind: 0 };
}

function tileDisplay(t: RiichiTile): string {
  if (t.type.startsWith('man')) return t.type[3] + '万';
  if (t.type.startsWith('pin')) return t.type[3] + '筒';
  if (t.type.startsWith('sou')) return t.type[3] + '条';
  const windNames: Record<string, string> = { east: '東', south: '南', west: '西', north: '北' };
  const dragonNames: Record<string, string> = { haku: '白', hatsu: '發', chun: '中' };
  return windNames[t.type] || dragonNames[t.type] || t.type;
}

export function riichiAction(state: RiichiState, playerId: number, action: string, tile?: RiichiTile): RiichiState {
  if (state.phase !== 'playing' || playerId !== state.currentPlayer) return state;
  const players = state.players.map(p => ({ ...p, hand: [...p.hand], discards: [...p.discards], melds: [...p.melds] }));
  const wall = [...state.wall];
  const p = players[playerId];

  if (action === 'draw') {
    const drawn = wall.pop();
    if (!drawn) return { ...state, phase: 'finished', message: '流局 - 牌墙耗尽' };
    p.hand.push(drawn);
    p.hand.sort((a, b) => a.type.localeCompare(b.type));

    // Check tsumo
    if (canRiichiHu(p.hand, p.melds)) {
      return { ...state, players, wall, phase: 'finished', message: `${p.name} 自摸！ツモ！` };
    }
    return { ...state, players, wall, message: `${p.name} 摸牌` };
  }

  if (action === 'discard' && tile) {
    const idx = p.hand.findIndex(t => t.id === tile.id);
    if (idx < 0) return state;
    p.discards.push(p.hand.splice(idx, 1)[0]);
    if (p.riichi) p.ippatsu = false;
    return { ...state, players, currentPlayer: (playerId + 1) % 4, lastDiscard: p.discards[p.discards.length - 1], message: `${p.name} 打出 ${tileDisplay(tile)}` };
  }

  if (action === 'riichi') {
    if (p.melds.length > 0 || p.riichi) return state;
    p.riichi = true;
    p.ippatsu = true;
    p.score -= 1000;
    return { ...state, players, message: `${p.name} 立直！` };
  }

  return state;
}

function canRiichiHu(hand: RiichiTile[], melds: { type: string; tiles: RiichiTile[] }[]): boolean {
  const meldCount = melds.reduce((s, m) => s + m.tiles.length, 0);
  if (hand.length + meldCount !== 14) return false;
  return hasValidPattern(hand);
}

function hasValidPattern(tiles: RiichiTile[]): boolean {
  if (tiles.length === 0) return true;
  if (tiles.length % 3 === 2) {
    // Try each pair
    const sorted = [...tiles].sort((a, b) => a.type.localeCompare(b.type));
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i].type === sorted[i+1].type) {
        const rest = sorted.filter((_, idx) => idx !== i && idx !== i+1);
        if (canMeld(rest)) return true;
      }
    }
    return false;
  }
  return canMeld(tiles);
}

function canMeld(tiles: RiichiTile[]): boolean {
  if (tiles.length === 0) return true;
  const types = tiles.map(t => t.type).sort();

  // Try triple
  if (types[0] === types[1] && types[1] === types[2]) return canMeld(tiles.slice(3));

  // Try sequence (only suited tiles)
  const t0 = types[0];
  if (t0.match(/^(man|pin|sou)(\d)$/)) {
    const prefix = t0.slice(0, 3), num = parseInt(t0[3]);
    const i1 = types.findIndex((t, i) => i > 0 && t === `${prefix}${num + 1}`);
    const i2 = types.findIndex((t, i) => i > 0 && t === `${prefix}${num + 2}`);
    if (i1 > 0 && i2 > 0 && i1 !== i2) {
      const remaining = tiles.filter((_, i) => i !== 0 && i !== i1 && i !== i2);
      if (canMeld(remaining)) return true;
    }
  }
  return false;
}

export function riichiAI(state: RiichiState, playerId: number): { action: string; tile?: RiichiTile } {
  const p = state.players[playerId];
  // Draw if needed
  if (p.hand.length % 3 !== 2) return { action: 'draw' };

  // Discard worst tile - just pick last one
  if (p.riichi) return { action: 'discard', tile: p.hand[p.hand.length - 1] };

  // Try riichi
  p.hand.sort((a, b) => a.type.localeCompare(b.type));
  if (canRiichiHu(p.hand.slice(0, 13), []) && Math.random() < 0.3) return { action: 'riichi' };

  return { action: 'discard', tile: p.hand[p.hand.length - 1] };
}
