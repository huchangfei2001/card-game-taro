// 掼蛋 (Guandan) Engine
// 2 decks of 54 cards = 108 total, 4 players 2v2, bomb hierarchy, level progression

import type { Card } from '../../types';

export interface GdPlayer {
  id: number; name: string; cards: Card[]; team: 0 | 1; isAI: boolean;
}

export interface GdState {
  players: GdPlayer[];
  currentPlayer: number;
  lastPlay: { cards: Card[]; type: string; playerId: number } | null;
  passCount: number;
  level: number; // 2 to A (14)
  phase: 'playing' | 'finished';
  winner: number | null;
  message: string;
  deck: Card[];
}

function createDeck(): Card[] {
  const deck: Card[] = [];
  const suits: Card['suit'][] = ['spades', 'hearts', 'diamonds', 'clubs'];
  // 2 full decks + 2 small jokers + 2 big jokers
  for (let d = 0; d < 2; d++) {
    for (const suit of suits) {
      for (let r = 1; r <= 13; r++) deck.push({ suit, rank: r, display: '' });
    }
    deck.push({ suit: 'joker', rank: 16, display: '' }); // 小王
    deck.push({ suit: 'joker', rank: 17, display: '' }); // 大王
  }
  return shuffle(deck);
}

function shuffle<T>(arr: T[]): T[] { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// 掼蛋 hand types and comparison
function getCardValue(c: Card, level: number): number {
  if (c.rank === 17) return 18; // 大王
  if (c.rank === 16) return 17; // 小王
  if (c.rank === level) return 16; // level card is wild
  if (c.rank === 15) return 15; // 2 is permanent wild
  return c.rank; // For comparison: A=14, K=13...3=3
}

function cardRank(c: Card, level: number): number {
  if (c.rank === level) return level;
  if (c.rank === 15) return 15;
  return c.rank;
}

function identifyHand(cards: Card[], level: number): { type: string; rank: number } | null {
  if (!cards.length) return null;
  const n = cards.length;
  const sorted = [...cards].sort((a, b) => getCardValue(b, level) - getCardValue(a, level));
  const vals = sorted.map(c => getCardValue(c, level));
  const ranks = sorted.map(c => cardRank(c, level));

  // 火箭 (double joker)
  if (n === 2 && vals[0] === 18 && vals[1] === 17) return { type: '火箭', rank: 18 };
  // 炸弹 (4 of same rank)
  const countMap = new Map<number, number>();
  ranks.forEach(r => countMap.set(r, (countMap.get(r) || 0) + 1));
  if (n === 4 && countMap.size === 1) return { type: '炸弹', rank: vals[0] };
  if (n === 5 && countMap.size === 1) return { type: '炸弹', rank: vals[0] };
  if (n === 6 && countMap.size === 1) return { type: '炸弹', rank: vals[0] };
  if (n === 7 && countMap.size === 1) return { type: '炸弹', rank: vals[0] };
  if (n === 8 && countMap.size === 1) return { type: '炸弹', rank: vals[0] };

  // 同花顺 (flush straight of length 5)
  if (n === 5) {
    const suits = new Set(sorted.map(c => c.suit));
    if (suits.size === 1) {
      let isStraight = true;
      for (let i = 0; i < vals.length - 1; i++) {
        if (vals[i] - vals[i + 1] !== 1) { isStraight = false; break; }
      }
      if (isStraight && !suits.has('joker')) return { type: '同花顺', rank: vals[0] };
    }
  }

  // 顺子 (straight, length >= 5)
  if (n >= 5) {
    let isStraight = true;
    for (let i = 0; i < vals.length - 1; i++) {
      if (vals[i] - vals[i + 1] !== 1) { isStraight = false; break; }
    }
    if (isStraight && vals.every(v => v < 15)) return { type: '顺子', rank: vals[0], length: n } as any;
  }

  // 连对 (consecutive pairs, >= 3 pairs)
  if (n >= 6 && n % 2 === 0) {
    const pairs = [...countMap.entries()].filter(([_, c]) => c === 2).map(([r]) => r).sort((a, b) => b - a);
    if (pairs.length === n / 2 && pairs.length >= 3) {
      let cons = true;
      for (let i = 0; i < pairs.length - 1; i++) { if (pairs[i] - pairs[i + 1] !== 1) { cons = false; break; } }
      if (cons) return { type: '连对', rank: pairs[0], length: pairs.length } as any;
    }
  }

  // 钢板 (triple pair, >= 2 triples)
  if (n === 6) {
    const triples = [...countMap.entries()].filter(([_, c]) => c === 3).map(([r]) => r).sort((a, b) => b - a);
    if (triples.length === 2 && Math.abs(triples[0] - triples[1]) === 1) return { type: '钢板', rank: triples[0] };
  }

  // 三带二 (triple + pair)
  if (n === 5) {
    const triple = [...countMap.entries()].find(([_, c]) => c === 3);
    const pair = [...countMap.entries()].find(([_, c]) => c === 2);
    if (triple && pair) return { type: '三带二', rank: triple[0] };
  }

  // 三张 (triple)
  if (n === 3 && countMap.size === 1) return { type: '三张', rank: vals[0] };

  // 对子 (pair)
  if (n === 2 && countMap.size === 1) return { type: '对子', rank: vals[0] };

  // 单张 (single)
  if (n === 1) return { type: '单张', rank: vals[0] };

  return null;
}

function canBeat(newType: any, lastType: any): boolean {
  if (lastType.type === '火箭') return false;
  if (newType.type === '火箭') return true;
  if (newType.type === '炸弹' && lastType.type !== '炸弹') return true;
  if (newType.type === '炸弹' && lastType.type === '炸弹') {
    if (newType.rank > lastType.rank) return true;
    // Check bomb size: 6 > 5 > 4
    // Actually in guandan, rank matters more. Same rank different size is rare.
    return false;
  }
  if (newType.type === '同花顺' && (lastType.type === '同花顺' || lastType.type === '顺子')) return newType.rank > lastType.rank;
  if (newType.type === lastType.type) return newType.rank > lastType.rank;
  return false;
}

export function initGuandan(): GdState {
  const deck = createDeck();
  const players: GdPlayer[] = [
    { id: 0, name: '你', cards: [], team: 0, isAI: false },
    { id: 1, name: '电脑A', cards: [], team: 1, isAI: true },
    { id: 2, name: '电脑B', cards: [], team: 0, isAI: true },
    { id: 3, name: '电脑C', cards: [], team: 1, isAI: true },
  ];
  // Deal 27 cards each
  for (let i = 0; i < 27; i++) {
    for (const p of players) p.cards.push(deck.pop()!);
  }
  players.forEach(p => p.cards.sort((a, b) => getCardValue(b, 2) - getCardValue(a, 2)));
  return { players, currentPlayer: 0, lastPlay: null, passCount: 0, level: 2, phase: 'playing', winner: null, deck, message: '掼蛋 - 级牌: 2' };
}

export function playGdCards(state: GdState, playerId: number, cards: Card[]): GdState {
  if (state.phase !== 'playing' || playerId !== state.currentPlayer || !cards.length) return state;
  const p = state.players[playerId];

  if (cards.length === 0) {
    // Pass
    const passCount = state.passCount + 1;
    const next = (state.currentPlayer + 1) % 4;
    if (passCount >= 3 && state.lastPlay) {
      // Last play was free - current becomes free
      const lp = state.players[state.lastPlay.playerId];
      return { ...state, currentPlayer: state.lastPlay.playerId, lastPlay: null, passCount: 0, message: `${lp.name} 自由出牌` };
    }
    return { ...state, currentPlayer: next, passCount, message: `${p.name} 过` };
  }

  const hand = identifyHand(cards, state.level);
  if (!hand) return { ...state, message: '无效牌型' };

  if (state.lastPlay && state.lastPlay.playerId !== playerId) {
    if (!canBeat(hand, state.lastPlay)) return { ...state, message: '打不过上家' };
  }

  // Remove cards from hand
  const cardStr = (c: Card) => `${c.suit}-${c.rank}`;
  const played = new Set(cards.map(cardStr));
  p.cards = p.cards.filter(c => !played.has(cardStr(c)));

  if (p.cards.length === 0) {
    return { ...state, winner: playerId, phase: 'finished', message: `${p.name} 获胜！`, lastPlay: { cards: [], type: hand.type, playerId } };
  }

  const next = (state.currentPlayer + 1) % 4;
  return { ...state, currentPlayer: next, lastPlay: { cards, type: hand.type, playerId }, passCount: 0, message: `${p.name} 出 ${hand.type}` };
}

export function gdAI(state: GdState, playerId: number): Card[] {
  const p = state.players[playerId];
  if (!state.lastPlay || state.lastPlay.playerId === playerId) {
    // Free play - play lowest single
    const sorted = [...p.cards].sort((a, b) => getCardValue(b, state.level) - getCardValue(a, state.level));
    return [sorted[sorted.length - 1]];
  }
  // Try to beat last play
  const sorted = [...p.cards].sort((a, b) => getCardValue(b, state.level) - getCardValue(a, state.level));
  const lastType = state.lastPlay;

  // Try same type
  if (lastType.type === '单张') {
    const better = sorted.find(c => getCardValue(c, state.level) > (lastType as any).rank);
    return better ? [better] : [];
  }
  if (lastType.type === '对子') {
    for (let i = 0; i < sorted.length - 1; i++) {
      if (getCardValue(sorted[i], state.level) === getCardValue(sorted[i+1], state.level) && getCardValue(sorted[i], state.level) > (lastType as any).rank) {
        return [sorted[i], sorted[i+1]];
      }
    }
    return []; // Pass
  }
  // Default: pass
  if (Math.random() < 0.7) return [];
  return [sorted[0]]; // Play highest single if lucky
}
