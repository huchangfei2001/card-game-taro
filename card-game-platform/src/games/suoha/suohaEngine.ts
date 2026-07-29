// 梭哈 (ShowHand / 5-Card Stud) Engine

import type { Card } from '../../types';

export interface ShPlayer {
  id: number; name: string; holeCards: Card[]; faceCards: Card[]; chips: number; bet: number;
  totalBet: number; folded: boolean; isAI: boolean; handType: string;
}

export interface ShState {
  players: ShPlayer[];
  deck: Card[];
  pot: number;
  currentBet: number;
  currentPlayer: number;
  dealerIdx: number;
  round: number; // 0-4: hole, 3rd, 4th, 5th, river
  phase: 'dealing' | 'betting' | 'showdown' | 'finished';
  message: string;
  minBet: number;
}

function createDeck(): Card[] {
  const deck: Card[] = [];
  const suits: Card['suit'][] = ['spades', 'hearts', 'diamonds', 'clubs'];
  for (const suit of suits) for (let r = 1; r <= 13; r++) deck.push({ suit, rank: r, display: '' });
  return shuffle(deck);
}

function shuffle<T>(arr: T[]): T[] { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

function cardVal(c: Card): number { return c.rank === 1 ? 14 : c.rank; }

function evalHand5(cards: Card[]): { type: string; rank: number; highCards: number[] } {
  const ranks = cards.map(cardVal).sort((a, b) => b - a);
  const suits = cards.map(c => c.suit);
  const isFlush = new Set(suits).size === 1;
  const isStraight = ranks.length === 5 &&
    ((ranks[0] - ranks[4] === 4 && new Set(ranks).size === 5) ||
     (ranks[0] === 14 && ranks[1] === 5 && ranks[2] === 4 && ranks[3] === 3 && ranks[4] === 2));
  const countMap = new Map<number, number>();
  ranks.forEach(r => countMap.set(r, (countMap.get(r) || 0) + 1));
  const counts = [...countMap.values()].sort((a, b) => b - a);
  if (isFlush && isStraight && ranks[0] === 14) return { type: '皇家同花顺', rank: 10, highCards: ranks };
  if (isFlush && isStraight) return { type: '同花顺', rank: 9, highCards: ranks };
  if (counts[0] === 4) return { type: '四条', rank: 8, highCards: ranks };
  if (counts[0] === 3 && counts[1] === 2) return { type: '葫芦', rank: 7, highCards: ranks };
  if (isFlush) return { type: '同花', rank: 6, highCards: ranks };
  if (isStraight) return { type: '顺子', rank: 5, highCards: ranks };
  if (counts[0] === 3) return { type: '三条', rank: 4, highCards: ranks };
  if (counts[0] === 2 && counts[1] === 2) return { type: '两对', rank: 3, highCards: ranks };
  if (counts[0] === 2) return { type: '一对', rank: 2, highCards: ranks };
  return { type: '高牌', rank: 1, highCards: ranks };
}

export function initSuoha(): ShState {
  const deck = shuffle(createDeck());
  const players: ShPlayer[] = [
    { id: 0, name: '你', holeCards: [], faceCards: [], chips: 1000, bet: 0, totalBet: 0, folded: false, isAI: false, handType: '' },
    { id: 1, name: '电脑A', holeCards: [], faceCards: [], chips: 1000, bet: 0, totalBet: 0, folded: false, isAI: true, handType: '' },
    { id: 2, name: '电脑B', holeCards: [], faceCards: [], chips: 1000, bet: 0, totalBet: 0, folded: false, isAI: true, handType: '' },
  ];
  // Deal 2 hole cards each
  for (const p of players) p.holeCards = [deck.pop()!, deck.pop()!];
  return { players, deck, pot: 0, currentBet: 5, currentPlayer: 0, dealerIdx: 0, round: 0, phase: 'betting', message: '下注回合', minBet: 5 };
}

export function suohaBet(state: ShState, action: 'fold' | 'call' | 'raise', amount?: number): ShState {
  const p = state.players[state.currentPlayer];
  if (p.folded) return state;
  const players = state.players.map(pl => ({ ...pl, holeCards: [...pl.holeCards], faceCards: [...pl.faceCards] }));

  switch (action) {
    case 'fold': players[state.currentPlayer].folded = true; break;
    case 'call': {
      const diff = state.currentBet - p.bet;
      const pay = Math.min(diff, p.chips);
      players[state.currentPlayer].chips -= pay;
      players[state.currentPlayer].bet += pay;
      players[state.currentPlayer].totalBet += pay;
      state = { ...state, pot: state.pot + pay };
      break;
    }
    case 'raise': {
      const raiseTo = amount || state.currentBet * 2;
      const pay = raiseTo - p.bet;
      const actual = Math.min(pay, p.chips);
      players[state.currentPlayer].chips -= actual;
      players[state.currentPlayer].bet = p.bet + actual;
      players[state.currentPlayer].totalBet += actual;
      state = { ...state, currentBet: raiseTo, pot: state.pot + actual };
      break;
    }
  }

  // Next player
  let next = (state.currentPlayer + 1) % 3;
  while (players[next].folded && next !== state.currentPlayer) next = (next + 1) % 3;

  const active = players.filter(p => !p.folded);
  const allEqual = active.every(p => p.bet === state.currentBet);

  if (active.length === 1) {
    active[0].chips += state.pot;
    return { ...state, players, phase: 'finished', message: `${active[0].name} 赢得底池 $${state.pot}` };
  }

  if (allEqual && state.round >= 4) {
    // Showdown
    let best = active[0];
    let bestHand = evalHand5([...best.holeCards, ...best.faceCards]);
    for (let i = 1; i < active.length; i++) {
      const h = evalHand5([...active[i].holeCards, ...active[i].faceCards]);
      if (h.rank > bestHand.rank || (h.rank === bestHand.rank && h.highCards[0] > bestHand.highCards[0])) {
        best = active[i]; bestHand = h;
      }
    }
    best.chips += state.pot;
    return { ...state, players, phase: 'finished', message: `${best.name} 以 ${bestHand.type} 赢得底池 $${state.pot}` };
  }

  if (allEqual) {
    // Next round - deal face-up cards
    const round = state.round + 1;
    for (const p of players) {
      if (!p.folded && p.faceCards.length < 3) p.faceCards.push(state.deck.pop()!);
      p.bet = 0;
    }
    return { ...state, players, round, currentPlayer: state.dealerIdx, phase: 'betting', currentBet: state.minBet, message: `第${round}轮下注` };
  }

  return { ...state, players, currentPlayer: next, message: `轮到 ${players[next].name}` };
}

export function suohaAI(state: ShState, playerId: number): { action: 'fold' | 'call' | 'raise'; amount?: number } {
  const p = state.players[playerId];
  const allCards = [...p.holeCards, ...p.faceCards];
  const hand = allCards.length >= 5 ? evalHand5(allCards) : { rank: 1 };
  if (hand.rank >= 7) return { action: 'raise', amount: state.currentBet * 2 };
  if (hand.rank >= 4) return { action: 'call' };
  if (state.currentBet > p.chips * 0.3) return { action: 'fold' };
  return Math.random() < 0.4 ? { action: 'call' } : { action: 'fold' };
}
