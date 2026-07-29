// 十三水 (13 Cards / Chinese Poker) Engine

import type { Card } from '../../types';

export interface ShsPlayer {
  id: number; name: string; cards: Card[];
  front: Card[]; middle: Card[]; back: Card[];
  isAI: boolean; chips: number; bet: number;
  handType: string; ready: boolean;
}

export interface ShsState {
  players: ShsPlayer[];
  phase: 'dealing' | 'arranging' | 'showdown' | 'finished';
  message: string;
  deck: Card[];
}

function createDeck(): Card[] {
  const deck: Card[] = [];
  const suits: Card['suit'][] = ['spades', 'hearts', 'diamonds', 'clubs'];
  for (const suit of suits) for (let r = 1; r <= 13; r++) deck.push({ suit, rank: r, display: '' });
  return deck;
}

function shuffle<T>(arr: T[]): T[] { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

export function initShisanshui(): ShsState {
  const deck = shuffle(createDeck());
  const players: ShsPlayer[] = [
    { id: 0, name: '你', cards: [], front: [], middle: [], back: [], isAI: false, chips: 1000, bet: 10, handType: '', ready: false },
    { id: 1, name: '电脑A', cards: [], front: [], middle: [], back: [], isAI: true, chips: 1000, bet: 10, handType: '', ready: false },
    { id: 2, name: '电脑B', cards: [], front: [], middle: [], back: [], isAI: true, chips: 1000, bet: 10, handType: '', ready: false },
  ];
  // Deal 13 each
  for (const p of players) {
    p.cards = [deck.pop()!, deck.pop()!, deck.pop()!, deck.pop()!, deck.pop()!, deck.pop()!, deck.pop()!, deck.pop()!, deck.pop()!, deck.pop()!, deck.pop()!, deck.pop()!, deck.pop()!];
  }
  // AI auto-arranges
  for (let i = 1; i < players.length; i++) autoArrange(players[i]);
  return { players, phase: 'arranging', message: '十三水 - 排列3+5+5', deck };
}

function cardVal(c: Card): number { return c.rank === 1 ? 14 : c.rank; }

type HandRank = { type: string; rank: number; highCards: number[] };

function evalHand5(cards: Card[]): HandRank {
  const ranks = cards.map(cardVal).sort((a, b) => b - a);
  const suits = cards.map(c => c.suit);
  const isFlush = new Set(suits).size === 1;
  const isStraight = ranks.length === 5 &&
    ((ranks[0] - ranks[4] === 4 && new Set(ranks).size === 5) ||
     (ranks[0] === 14 && ranks[1] === 5 && ranks[2] === 4 && ranks[3] === 3 && ranks[4] === 2));
  const countMap = new Map<number, number>();
  ranks.forEach(r => countMap.set(r, (countMap.get(r) || 0) + 1));
  const counts = [...countMap.values()].sort((a, b) => b - a);

  if (isFlush && isStraight && ranks[0] === 14 && ranks[1] === 10) return { type: '皇家同花顺', rank: 10, highCards: ranks };
  if (isFlush && isStraight) return { type: '同花顺', rank: 9, highCards: ranks };
  if (counts[0] === 4) return { type: '铁支', rank: 8, highCards: ranks };
  if (counts[0] === 3 && counts[1] === 2) return { type: '葫芦', rank: 7, highCards: ranks };
  if (isFlush) return { type: '同花', rank: 6, highCards: ranks };
  if (isStraight) return { type: '顺子', rank: 5, highCards: ranks };
  if (counts[0] === 3) return { type: '三条', rank: 4, highCards: ranks };
  if (counts[0] === 2 && counts[1] === 2) return { type: '两对', rank: 3, highCards: ranks };
  if (counts[0] === 2) return { type: '一对', rank: 2, highCards: ranks };
  return { type: '高牌', rank: 1, highCards: ranks };
}

function evalHand3(cards: Card[]): HandRank {
  const ranks = cards.map(cardVal).sort((a, b) => b - a);
  const countMap = new Map<number, number>();
  ranks.forEach(r => countMap.set(r, (countMap.get(r) || 0) + 1));
  const counts = [...countMap.values()].sort((a, b) => b - a);
  if (counts[0] === 3) return { type: '三条', rank: 4, highCards: ranks };
  if (counts[0] === 2) return { type: '一对', rank: 2, highCards: ranks };
  return { type: '高牌', rank: 1, highCards: ranks };
}

export function autoArrange(p: ShsPlayer): ShsPlayer {
  const sorted = [...p.cards].sort((a, b) => cardVal(b) - cardVal(a));
  // Simple: best 5 to back, next 5 to middle, worst 3 to front
  const back = sorted.slice(0, 5).sort((a, b) => cardVal(a) - cardVal(b));
  const middle = sorted.slice(5, 10).sort((a, b) => cardVal(a) - cardVal(b));
  const front = sorted.slice(10, 13).sort((a, b) => cardVal(a) - cardVal(b));
  const backEval = evalHand5(back);
  const midEval = evalHand5(middle);
  const frontEval = evalHand3(front);
  return { ...p, back, middle, front, ready: true, handType: `${backEval.type}-${midEval.type}-${frontEval.type}` };
}

export function arrangeShs(state: ShsState, front: Card[], middle: Card[], back: Card[]): ShsState {
  const players = state.players.map(p => ({ ...p }));
  players[0] = { ...players[0], front, middle, back, ready: true, handType: `${evalHand5(back).type}-${evalHand5(middle).type}-${evalHand3(front).type}` };
  if (players.every(p => p.ready)) {
    return showdown(players, state);
  }
  return { ...state, players, message: '等待所有玩家排列完成' };
}

function showdown(players: ShsPlayer[], state: ShsState): ShsState {
  const p0 = players[0];
  let wins = 0;
  for (let i = 1; i < players.length; i++) {
    const opp = players[i];
    let pWins = 0;
    // Compare back
    const back0 = evalHand5(p0.back), back1 = evalHand5(opp.back);
    if (back0.rank > back1.rank) pWins++;
    else if (back0.rank === back1.rank) {
      for (let j = 0; j < back0.highCards.length; j++) {
        if (back0.highCards[j] > back1.highCards[j]) { pWins++; break; }
        if (back0.highCards[j] < back1.highCards[j]) { pWins--; break; }
      }
    } else pWins--;
    // Compare middle
    const mid0 = evalHand5(p0.middle), mid1 = evalHand5(opp.middle);
    if (mid0.rank > mid1.rank) pWins++;
    else if (mid0.rank === mid1.rank) {
      for (let j = 0; j < mid0.highCards.length; j++) {
        if (mid0.highCards[j] > mid1.highCards[j]) { pWins++; break; }
        if (mid0.highCards[j] < mid1.highCards[j]) { pWins--; break; }
      }
    } else pWins--;
    // Compare front
    const front0 = evalHand3(p0.front), front1 = evalHand3(opp.front);
    if (front0.rank > front1.rank) pWins++;
    else if (front0.rank === front1.rank) {
      for (let j = 0; j < front0.highCards.length; j++) {
        if (front0.highCards[j] > front1.highCards[j]) { pWins++; break; }
        if (front0.highCards[j] < front1.highCards[j]) { pWins--; break; }
      }
    } else pWins--;
    wins += pWins > 0 ? 1 : pWins < 0 ? -1 : 0;
  }
  p0.chips += wins * p0.bet;
  return { ...state, players, phase: 'finished', message: `胜负: ${wins > 0 ? '+' : ''}${wins * p0.bet} 筹码` };
}
