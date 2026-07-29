import type { Card } from '../../types';

export interface TexasPlayer {
  id: number;
  name: string;
  chips: number;
  cards: Card[];
  currentBet: number;
  totalBet: number;
  hasFolded: boolean;
  isAllIn: boolean;
  isAI: boolean;
  isDealer: boolean;
}

export interface TexasGameState {
  players: TexasPlayer[];
  deck: Card[];
  communityCards: Card[];
  pot: number;
  currentBet: number;
  currentPlayer: number;
  phase: 'preflop' | 'flop' | 'turn' | 'river' | 'showdown' | 'finished';
  dealerIndex: number;
  smallBlind: number;
  bigBlind: number;
  message: string;
  roundBets: Map<number, number>;
}

const SUITS: Card['suit'][] = ['spades', 'hearts', 'diamonds', 'clubs'];
const DISPLAY: Record<number, string> = { 1:'A',11:'J',12:'Q',13:'K' };

function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (let r = 1; r <= 13; r++) {
      deck.push({ suit, rank: r, display: DISPLAY[r] || String(r) });
    }
  }
  return shuffle(deck);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function initTexasGame(): TexasGameState {
  const players: TexasPlayer[] = [
    { id:0, name:'你', chips:1000, cards:[], currentBet:0, totalBet:0, hasFolded:false, isAllIn:false, isAI:false, isDealer:false },
    { id:1, name:'电脑A', chips:1000, cards:[], currentBet:0, totalBet:0, hasFolded:false, isAllIn:false, isAI:true, isDealer:false },
    { id:2, name:'电脑B', chips:1000, cards:[], currentBet:0, totalBet:0, hasFolded:false, isAllIn:false, isAI:true, isDealer:false },
    { id:3, name:'电脑C', chips:1000, cards:[], currentBet:0, totalBet:0, hasFolded:false, isAllIn:false, isAI:true, isDealer:false },
  ];
  players[0].isDealer = true;
  return {
    players, deck: createDeck(), communityCards: [], pot: 0,
    currentBet: 0, currentPlayer: 0, phase: 'preflop',
    dealerIndex: 0, smallBlind: 10, bigBlind: 20, message: '新一局开始',
    roundBets: new Map(),
  };
}

function dealCards(state: TexasGameState): TexasGameState {
  const s = deepClone(state);
  const deck = s.deck;
  s.players.forEach(p => { p.cards = [deck.pop()!, deck.pop()!]; });
  s.communityCards = [];

  const activeCount = s.players.filter(p => !p.hasFolded).length;
  if (activeCount <= 1) { s.phase = 'showdown'; return s; }

  const sbIndex = (s.dealerIndex + 1) % s.players.length;
  const bbIndex = (s.dealerIndex + 2) % s.players.length;

  postBlind(s, sbIndex, s.smallBlind);
  postBlind(s, bbIndex, s.bigBlind);

  s.currentBet = s.bigBlind;
  s.currentPlayer = (s.dealerIndex + 3) % s.players.length;
  s.phase = 'preflop';
  s.message = `小盲 $${s.smallBlind}，大盲 $${s.bigBlind}`;
  return s;
}

function postBlind(state: TexasGameState, playerIndex: number, amount: number) {
  const p = state.players[playerIndex];
  const actual = Math.min(amount, p.chips);
  p.chips -= actual;
  p.currentBet = actual;
  p.totalBet += actual;
  state.pot += actual;
  if (p.chips === 0) p.isAllIn = true;
}

function deepClone(state: TexasGameState): TexasGameState {
  return {
    ...state,
    players: state.players.map(p => ({ ...p, cards: [...p.cards] })),
    deck: [...state.deck],
    communityCards: [...state.communityCards],
    roundBets: new Map(state.roundBets),
  };
}

export function startTexasRound(state: TexasGameState): TexasGameState {
  let s: TexasGameState = { ...state, deck: createDeck(), pot: 0, communityCards: [] as Card[], roundBets: new Map() };
  s.players = s.players.map(p => ({
    ...p, cards: [], currentBet: 0, totalBet: 0, hasFolded: false, isAllIn: false,
  }));
  s = dealCards(s);
  advanceToActive(s);
  return s;
}

function advanceToActive(state: TexasGameState) {
  while (true) {
    const cp = state.players[state.currentPlayer];
    if (!cp.hasFolded && !cp.isAllIn) break;
    state.currentPlayer = (state.currentPlayer + 1) % state.players.length;
    if (allBetsMatched(state)) { nextPhase(state); return; }
  }
}

function allBetsMatched(state: TexasGameState): boolean {
  const active = state.players.filter(p => !p.hasFolded && !p.isAllIn);
  if (active.length <= 1) return true;
  return active.every(p => p.currentBet === state.currentBet);
}

function nextPhase(state: TexasGameState) {
  state.players.forEach(p => { state.pot += p.currentBet; p.totalBet += p.currentBet; p.currentBet = 0; });
  state.currentBet = 0;

  switch (state.phase) {
    case 'preflop':
      state.communityCards.push(state.deck.pop()!, state.deck.pop()!, state.deck.pop()!);
      state.phase = 'flop';
      state.message = '翻牌';
      break;
    case 'flop':
      state.communityCards.push(state.deck.pop()!);
      state.phase = 'turn';
      state.message = '转牌';
      break;
    case 'turn':
      state.communityCards.push(state.deck.pop()!);
      state.phase = 'river';
      state.message = '河牌';
      break;
    case 'river':
      state.phase = 'showdown';
      state.message = '摊牌';
      return;
    default: return;
  }

  state.currentPlayer = (state.dealerIndex + 1) % state.players.length;
  const active = state.players.filter(p => !p.hasFolded && !p.isAllIn);
  if (active.length <= 1) { state.phase = 'showdown'; state.message = '摊牌'; }
  advanceToActive(state);
}

export function processTexasAction(
  state: TexasGameState,
  playerId: number,
  action: 'fold' | 'check' | 'call' | 'raise',
  amount?: number
): TexasGameState {
  const s = deepClone(state);
  const p = s.players[playerId];
  if (p.hasFolded || p.isAllIn || playerId !== s.currentPlayer) return state;

  switch (action) {
    case 'fold':
      p.hasFolded = true;
      s.message = `${p.name} 弃牌`;
      break;
    case 'check':
      if (s.currentBet !== p.currentBet) return state;
      s.message = `${p.name} 过牌`;
      break;
    case 'call': {
      const toCall = s.currentBet - p.currentBet;
      const actual = Math.min(toCall, p.chips);
      p.chips -= actual;
      p.currentBet += actual;
      s.pot += actual;
      if (p.chips === 0) p.isAllIn = true;
      s.message = `${p.name} 跟注 $${actual}`;
      break;
    }
    case 'raise': {
      const minRaise = s.currentBet > 0 ? s.currentBet * 2 : s.bigBlind;
      const raiseAmt = amount || minRaise;
      if (raiseAmt < minRaise || raiseAmt > p.chips + p.currentBet) return state;
      const toAdd = raiseAmt - p.currentBet;
      p.chips -= toAdd;
      p.currentBet = raiseAmt;
      s.currentBet = raiseAmt;
      s.pot += toAdd;
      if (p.chips === 0) p.isAllIn = true;
      s.message = `${p.name} 加注到 $${raiseAmt}`;
      break;
    }
  }

  s.currentPlayer = (s.currentPlayer + 1) % s.players.length;

  const nonFolded = s.players.filter(p => !p.hasFolded);
  if (nonFolded.length <= 1) {
    const winner = nonFolded[0];
    winner.chips += s.pot;
    s.message = `${winner.name} 赢得底池 $${s.pot}!`;
    s.phase = 'finished';
    return s;
  }

  if (allBetsMatched(s)) {
    s.players.forEach(p => { s.pot += p.currentBet; p.totalBet += p.currentBet; p.currentBet = 0; });
    s.currentBet = 0;
    nextPhase(s);
    if (s.phase === 'showdown') {
      const result = resolveShowdown(s);
      s.message = result.message;
      s.phase = 'finished';
      result.winners.forEach(w => {
        s.players[w].chips += Math.floor(s.pot / result.winners.length);
      });
    }
    return s;
  }

  advanceToActive(s);
  return s;
}

interface HandRank { rank: number; name: string; cards: Card[] }

interface ShowdownResult { winners: number[]; message: string }

function resolveShowdown(state: TexasGameState): ShowdownResult {
  const active = state.players.filter(p => !p.hasFolded);
  let bestPlayers: number[] = [];
  let bestRank: HandRank | null = null;

  active.forEach(p => {
    const allCards = [...p.cards, ...state.communityCards];
    const handRank = evaluateHand(allCards);
    if (!bestRank || compareHands(handRank, bestRank) > 0) {
      bestRank = handRank;
      bestPlayers = [p.id];
    } else if (compareHands(handRank, bestRank) === 0) {
      bestPlayers.push(p.id);
    }
  });

  const winnerNames = bestPlayers.map(id => state.players[id].name).join(', ');
  return { winners: bestPlayers, message: `${winnerNames} 以 ${bestRank!.name} 赢得底池 $${state.pot}!` };
}

function evaluateHand(cards: Card[]): HandRank {
  const allCombos: Card[][] = [];
  function combo(arr: Card[], k: number, start: number, cur: Card[]) {
    if (cur.length === k) { allCombos.push([...cur]); return; }
    for (let i = start; i < arr.length; i++) { cur.push(arr[i]); combo(arr, k, i+1, cur); cur.pop(); }
  }
  combo(cards, 5, 0, []);
  return allCombos.map(c => rank5(c)).sort((a,b) => compareHands(b,a))[0];
}

function rank5(cards: Card[]): HandRank {
  const sorted = [...cards].sort((a,b) => {
    const va = a.rank === 1 ? 14 : a.rank;
    const vb = b.rank === 1 ? 14 : b.rank;
    return vb - va;
  });
  const ranks = sorted.map(c => c.rank === 1 ? 14 : c.rank);
  const suits = sorted.map(c => c.suit);
  const isFlush = new Set(suits).size === 1;

  const isStraight = ranks.every((r,i) => i === 0 || r === ranks[i-1] - 1);
  const isWheel = ranks[0] === 14 && ranks[1] === 5 && ranks[2] === 4 && ranks[3] === 3 && ranks[4] === 2;

  if (isFlush && isStraight) {
    return { rank: 8, name: '同花顺', cards: sorted };
  }
  if (isFlush && isWheel) {
    return { rank: 8, name: '同花顺', cards: sorted.map(c => c.rank === 1 ? { ...c, rank: 1 } : c) };
  }

  const countMap = new Map<number, number>();
  ranks.forEach(r => countMap.set(r, (countMap.get(r) || 0) + 1));
  const counts = [...countMap.entries()].sort((a,b) => b[1]-a[1] || b[0]-a[0]);

  if (counts[0][1] === 4) return { rank: 7, name: '四条', cards: sorted };
  if (counts[0][1] === 3 && counts[1][1] === 2) return { rank: 6, name: '葫芦', cards: sorted };
  if (isFlush) return { rank: 5, name: '同花', cards: sorted };
  if (isStraight || isWheel) return { rank: 4, name: '顺子', cards: sorted };
  if (counts[0][1] === 3) return { rank: 3, name: '三条', cards: sorted };
  if (counts[0][1] === 2 && counts[1][1] === 2) return { rank: 2, name: '两对', cards: sorted };
  if (counts[0][1] === 2) return { rank: 1, name: '一对', cards: sorted };
  return { rank: 0, name: '高牌', cards: sorted };
}

function compareHands(a: HandRank, b: HandRank): number {
  if (a.rank !== b.rank) return a.rank - b.rank;
  const aRanks = a.cards.map(c => c.rank === 1 ? 14 : c.rank).sort((x,y) => y-x);
  const bRanks = b.cards.map(c => c.rank === 1 ? 14 : c.rank).sort((x,y) => y-x);
  for (let i = 0; i < 5; i++) {
    if (aRanks[i] !== bRanks[i]) return aRanks[i] - bRanks[i];
  }
  return 0;
}

export function getTexasAIAction(state: TexasGameState, playerId: number): { action: 'fold' | 'check' | 'call' | 'raise'; amount?: number } {
  const p = state.players[playerId];
  const strength = handStrength([...p.cards, ...state.communityCards]);
  const toCall = state.currentBet - p.currentBet;

  if (strength < 0.3 && toCall > p.chips * 0.2) return { action: 'fold' };
  if (strength < 0.5 && toCall > p.chips * 0.4) return { action: 'fold' };
  if (toCall === 0) {
    if (strength > 0.7 && Math.random() < 0.5) {
      return { action: 'raise', amount: Math.min(p.chips + p.currentBet, state.currentBet + state.bigBlind * 2) };
    }
    return { action: 'check' };
  }
  if (strength > 0.8 && Math.random() < 0.4) {
    return { action: 'raise', amount: Math.min(p.chips + p.currentBet, state.currentBet * 3) };
  }
  if (strength > 0.5) {
    return { action: 'call' };
  }
  if (toCall <= p.chips * 0.15) return { action: 'call' };
  return { action: 'fold' };
}

function handStrength(cards: Card[]): number {
  if (cards.length < 2) return 0.3;
  const rank = evaluateHand(cards);
  const strengths: Record<number, number> = { 0:0.1, 1:0.3, 2:0.45, 3:0.55, 4:0.65, 5:0.7, 6:0.8, 7:0.9, 8:1.0 };
  return strengths[rank.rank] || 0.3;
}
