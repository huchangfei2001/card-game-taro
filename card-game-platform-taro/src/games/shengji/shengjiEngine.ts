// 升级 (Sheng Ji / Tractor) Engine
// 4 players 2v2, 2 decks 108 cards, trump bidding, bottom cards, point scoring

import type { Card } from '../../types';

export interface SjPlayer {
  id: number; name: string; cards: Card[]; team: 0 | 1; isAI: boolean; isDealer: boolean;
}

export interface SjState {
  players: SjPlayer[];
  currentPlayer: number;
  trump: Card['suit'] | 'none';
  trumpRank: number;
  bottom: Card[];
  phase: 'dealing' | 'bidding' | 'burying' | 'playing' | 'finished';
  trick: { playerId: number; card: Card }[];
  trickWinner: number;
  teamScores: [number, number]; // [defenders, attackers]
  currentLevel: number; // 2 to A
  dealerTeam: 0 | 1;
  deck: Card[];
  message: string;
  trickCount: number;
}

function createDeck(): Card[] {
  const deck: Card[] = [];
  const suits: Card['suit'][] = ['spades', 'hearts', 'diamonds', 'clubs'];
  for (let d = 0; d < 2; d++) {
    for (const suit of suits) for (let r = 1; r <= 13; r++) deck.push({ suit, rank: r, display: '' });
    deck.push({ suit: 'joker', rank: 16, display: '' });
    deck.push({ suit: 'joker', rank: 17, display: '' });
  }
  return deck;
}

function shuffle<T>(arr: T[]): T[] { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

export function initShengji(): SjState {
  const deck = shuffle(createDeck());
  const players: SjPlayer[] = [
    { id: 0, name: '你', cards: [], team: 0, isAI: false, isDealer: false },
    { id: 1, name: '电脑A', cards: [], team: 1, isAI: true, isDealer: false },
    { id: 2, name: '电脑B', cards: [], team: 0, isAI: true, isDealer: false },
    { id: 3, name: '电脑C', cards: [], team: 1, isAI: true, isDealer: false },
  ];
  // Deal 25 each, 8 bottom
  for (let i = 0; i < 25; i++) for (const p of players) p.cards.push(deck.pop()!);
  // Who gets the bottom: player 0 starts
  players[0].isDealer = true;
  return {
    players, currentPlayer: 0, trump: 'none', trumpRank: 2, bottom: deck.splice(0, 8),
    phase: 'bidding', trick: [], trickWinner: -1, teamScores: [0, 0],
    currentLevel: 2, dealerTeam: 0, deck, message: '请叫主牌', trickCount: 0,
  };
}

const SUIT_ORDER: Record<string, string> = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣', none: '无主' };

export function bidTrump(state: SjState, suit: Card['suit'] | 'none'): SjState {
  if (state.phase !== 'bidding' || state.currentPlayer !== 0) return state;
  // Accept the bid, player becomes dealer
  const players = state.players.map(p => ({ ...p, isDealer: p.id === 0, cards: [...p.cards] }));
  // Give bottom cards to dealer
  players[0].cards.push(...state.bottom);
  // Dealer discards 8 cards
  return { ...state, players, trump: suit, phase: 'burying', message: `主牌: ${SUIT_ORDER[suit]} - 请埋底牌8张`, dealerTeam: 0, bottom: [] };
}

export function buryCards(state: SjState, cards: Card[]): SjState {
  if (state.phase !== 'burying' || cards.length !== 8) return state;
  const players = state.players.map(p => ({ ...p, isDealer: p.id === 0, cards: [...p.cards] }));
  const cardStr = (c: Card) => `${c.suit}-${c.rank}`;
  const toBury = new Set(cards.map(cardStr));
  players[0].cards = players[0].cards.filter(c => !toBury.has(cardStr(c)));
  return { ...state, players, bottom: cards, phase: 'playing', currentPlayer: 0, message: '出牌' };
}

export function shengjiAI(state: SjState, playerId: number): { action: string; cards: Card[]; suit?: Card['suit'] } {
  const p = state.players[playerId];
  if (state.phase === 'bidding') {
    // AI bids 50% of the time
    if (Math.random() < 0.5) {
      const suits: Card['suit'][] = ['spades', 'hearts', 'diamonds', 'clubs'];
      return { action: 'bid', cards: [], suit: suits[Math.floor(Math.random() * 4)] };
    }
    return { action: 'pass', cards: [] };
  }
  // Playing phase: play lowest card
  if (p.cards.length > 0) return { action: 'play', cards: [p.cards[p.cards.length - 1]] };
  return { action: 'pass', cards: [] };
}
