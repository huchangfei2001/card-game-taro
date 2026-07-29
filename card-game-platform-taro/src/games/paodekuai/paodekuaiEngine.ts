// 跑得快 (Paodekuai) Engine
// 3 players, 16 cards each, first to empty wins

import type { Card } from '../../types';

export interface PdkPlayer { id: number; name: string; cards: Card[]; isAI: boolean; }
export interface PdkState {
  players: PdkPlayer[];
  currentPlayer: number;
  lastPlay: { cards: Card[]; type: string; rank: number; playerId: number } | null;
  passCount: number;
  phase: 'playing' | 'finished';
  winner: number | null;
  message: string;
}

function createDeck(): Card[] {
  const deck: Card[] = [];
  const suits: Card['suit'][] = ['spades', 'hearts', 'diamonds', 'clubs'];
  for (const suit of suits) for (let r = 2; r <= 14; r++) deck.push({ suit, rank: r === 14 ? 1 : r, display: '' });
  return deck;
}

function shuffle<T>(arr: T[]): T[] { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

function cardVal(c: Card): number { return c.rank === 2 ? 15 : c.rank === 1 ? 14 : c.rank; }
function cardRank(c: Card): number { return c.rank; }

function identifyPdk(cards: Card[]): { type: string; rank: number } | null {
  if (!cards.length) return null;
  const n = cards.length;
  const sorted = [...cards].sort((a, b) => cardVal(b) - cardVal(a));
  const vals = sorted.map(cardVal);
  const ranks = sorted.map(cardRank);

  const countMap = new Map<number, number>();
  ranks.forEach(r => countMap.set(r, (countMap.get(r) || 0) + 1));

  // Bomb (4 of same)
  if (n === 4 && countMap.size === 1) return { type: '炸弹', rank: vals[0] };

  // Straight (>= 5 cards)
  if (n >= 5) {
    let isStraight = true;
    for (let i = 0; i < vals.length - 1; i++) { if (vals[i] - vals[i + 1] !== 1) { isStraight = false; break; } }
    if (isStraight && vals.every(v => v < 15)) return { type: '顺子', rank: vals[0] };
  }

  // Consecutive pairs (>= 3 pairs)
  if (n >= 6 && n % 2 === 0) {
    const pairs = [...countMap.entries()].filter(([_, c]) => c === 2).map(([r]) => r).sort((a, b) => b - a);
    if (pairs.length === n / 2 && pairs.length >= 2) {
      let cons = true;
      for (let i = 0; i < pairs.length - 1; i++) { if (pairs[i] - pairs[i + 1] !== 1) { cons = false; break; } }
      if (cons) return { type: '连对', rank: pairs[0] };
    }
  }

  // Plane (>= 2 triples)
  if (n >= 6 && n % 3 === 0 && n / 3 <= 4) {
    const triples = [...countMap.entries()].filter(([_, c]) => c === 3).map(([r]) => r).sort((a, b) => b - a);
    if (triples.length === n / 3 && triples.length >= 2) {
      let cons = true;
      for (let i = 0; i < triples.length - 1; i++) { if (triples[i] - triples[i + 1] !== 1) { cons = false; break; } }
      if (cons) return { type: '飞机', rank: triples[0] };
    }
  }

  // Triple + 1 or 2 kickers
  if (n >= 4) {
    const tripleEntry = [...countMap.entries()].find(([_, c]) => c === 3);
    if (tripleEntry) {
      const others = n - 3;
      if (others <= 2) return { type: '三带', rank: tripleEntry[0] };
    }
  }

  if (n === 2 && countMap.size === 1) return { type: '对子', rank: vals[0] };
  if (n === 1) return { type: '单张', rank: vals[0] };
  return null;
}

function canBeatPdk(newType: { type: string; rank: number }, lastType: { type: string; rank: number }): boolean {
  if (newType.type === '炸弹' && lastType.type !== '炸弹') return true;
  if (newType.type === lastType.type) return newType.rank > lastType.rank;
  return false;
}

export function initPaodekuai(): PdkState {
  const deck = shuffle(createDeck());
  const players: PdkPlayer[] = [
    { id: 0, name: '你', cards: [], isAI: false },
    { id: 1, name: '电脑A', cards: [], isAI: true },
    { id: 2, name: '电脑B', cards: [], isAI: true },
  ];
  for (let i = 0; i < 16; i++) for (const p of players) p.cards.push(deck.pop()!);
  players.forEach(p => p.cards.sort((a, b) => cardVal(b) - cardVal(a)));
  return { players, currentPlayer: 0, lastPlay: null, passCount: 0, phase: 'playing', winner: null, message: '跑得快 - 黑桃3先出' };
}

export function playPdkCards(state: PdkState, cards: Card[], pass: boolean): PdkState {
  if (state.phase !== 'playing') return state;
  const p = state.players[state.currentPlayer];

  if (pass) {
    const pc = state.passCount + 1;
    if (pc >= 2 && state.lastPlay) {
      const lp = state.players[state.lastPlay.playerId];
      const next = state.lastPlay.playerId;
      return { ...state, currentPlayer: next, lastPlay: null, passCount: 0, message: `${lp.name} 自由出牌` };
    }
    const next = (state.currentPlayer + 1) % 3;
    return { ...state, currentPlayer: next, passCount: pc, message: `${p.name} 过` };
  }

  const hand = identifyPdk(cards);
  if (!hand) return { ...state, message: '无效牌型' };

  if (state.lastPlay && state.lastPlay.playerId !== state.currentPlayer) {
    if (!canBeatPdk(hand, state.lastPlay)) return { ...state, message: '打不过上家' };
  }

  const cardStr = (c: Card) => `${c.suit}-${c.rank}`;
  const played = new Set(cards.map(cardStr));
  p.cards = p.cards.filter(c => !played.has(cardStr(c)));

  if (p.cards.length === 0) {
    return { ...state, winner: state.currentPlayer, phase: 'finished', message: `${p.name} 跑得快！获胜！` };
  }

  const next = (state.currentPlayer + 1) % 3;
  return { ...state, currentPlayer: next, lastPlay: { cards, type: hand.type, rank: hand.rank, playerId: state.currentPlayer }, passCount: 0, message: `${p.name} 出 ${hand.type}` };
}

export function pdkAI(state: PdkState, playerId: number): { cards: Card[]; pass: boolean } {
  const p = state.players[playerId];
  const sorted = [...p.cards].sort((a, b) => cardVal(b) - cardVal(a));

  if (!state.lastPlay || state.lastPlay.playerId === playerId) {
    return { cards: [sorted[sorted.length - 1]], pass: false }; // Free play lowest
  }
  // Try to beat
  if (state.lastPlay.type === '单张') {
    const better = sorted.find(c => cardVal(c) > state.lastPlay!.rank);
    return better ? { cards: [better], pass: false } : { cards: [], pass: true };
  }
  if (state.lastPlay.type === '对子') {
    for (let i = 0; i < sorted.length - 1; i++) {
      if (cardVal(sorted[i]) === cardVal(sorted[i+1]) && cardVal(sorted[i]) > state.lastPlay!.rank) {
        return { cards: [sorted[i], sorted[i+1]], pass: false };
      }
    }
    return { cards: [], pass: true };
  }
  // Default pass
  return Math.random() < 0.3 ? { cards: [sorted[0]], pass: false } : { cards: [], pass: true };
}
