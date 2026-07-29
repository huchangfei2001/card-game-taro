import type { Card } from '../../types';

export interface ZjhPlayer { id: number; name: string; cards: Card[]; chips: number; bet: number; folded: boolean; isAI: boolean; }

export interface ZjhState {
  deck: Card[];
  players: ZjhPlayer[];
  pot: number;
  currentBet: number;
  currentPlayer: number;
  phase: 'dealing' | 'betting' | 'showdown' | 'finished';
  message: string;
}

function createDeck(): Card[] {
  const deck: Card[] = [];
  const suits: Card['suit'][] = ['spades', 'hearts', 'diamonds', 'clubs'];
  for (const suit of suits) {
    for (let r = 1; r <= 13; r++) deck.push({ suit, rank: r, display: '' });
  }
  return shuffle(deck);
}

function shuffle<T>(arr: T[]): T[] { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

export function initZjh(): ZjhState {
  return {
    deck: createDeck(),
    players: [
      { id: 0, name: '你', cards: [], chips: 1000, bet: 0, folded: false, isAI: false },
      { id: 1, name: '电脑A', cards: [], chips: 1000, bet: 0, folded: false, isAI: true },
      { id: 2, name: '电脑B', cards: [], chips: 1000, bet: 0, folded: false, isAI: true },
      { id: 3, name: '电脑C', cards: [], chips: 1000, bet: 0, folded: false, isAI: true },
    ],
    pot: 0, currentBet: 0, currentPlayer: 0, phase: 'dealing', message: '准备发牌',
  };
}

export function dealZjh(state: ZjhState): ZjhState {
  const deck = createDeck();
  const players = state.players.map(p => ({
    ...p, cards: [deck.pop()!, deck.pop()!, deck.pop()!], bet: 5, folded: false
  }));
  players.forEach(p => { p.chips -= 5; });
  return { ...state, deck, players, pot: 20, currentBet: 5, currentPlayer: 0, phase: 'betting', message: '请下注（看牌/跟注/加注/弃牌）' };
}

function handRank(cards: Card[]): { rank: number; name: string } {
  const ranks = cards.map(c => c.rank === 1 ? 14 : c.rank).sort((a,b) => b-a);
  const suits = cards.map(c => c.suit);
  const isFlush = new Set(suits).size === 1;
  const isStraight = ranks[0] - ranks[1] === 1 && ranks[1] - ranks[2] === 1;
  const isPair = ranks[0] === ranks[1] || ranks[1] === ranks[2];
  const isTriple = ranks[0] === ranks[1] && ranks[1] === ranks[2];
  const isA23 = ranks[0] === 14 && ranks[1] === 3 && ranks[2] === 2;

  if (isTriple) return { rank: 5, name: '豹子' };
  if ((isStraight && isFlush) || (isA23 && isFlush)) return { rank: 4, name: '同花顺' };
  if (isFlush) return { rank: 3, name: '同花' };
  if (isStraight || isA23) return { rank: 2, name: '顺子' };
  if (isPair) return { rank: 1, name: '对子' };
  return { rank: 0, name: '单张' };
}

export function zjhAction(state: ZjhState, playerId: number, action: 'fold' | 'call' | 'raise' | 'see', amount?: number): ZjhState {
  if (state.phase !== 'betting' || playerId !== state.currentPlayer) return state;
  const s = { ...state, players: state.players.map(p => ({ ...p, cards: [...p.cards] })) };
  const p = s.players[playerId];
  if (p.folded) return state;

  switch (action) {
    case 'fold': p.folded = true; s.message = `${p.name} 弃牌`; break;
    case 'call': {
      const diff = s.currentBet - p.bet;
      const actual = Math.min(diff, p.chips);
      p.chips -= actual; p.bet += actual; s.pot += actual;
      s.message = `${p.name} 跟注`;
      break;
    }
    case 'raise': {
      const raiseAmt = amount || s.currentBet + 10;
      const diff = raiseAmt - p.bet;
      const actual = Math.min(diff, p.chips);
      p.chips -= actual; p.bet = raiseAmt; s.currentBet = raiseAmt; s.pot += actual;
      s.message = `${p.name} 加注`;
      break;
    }
  }

  const alive = s.players.filter(p => !p.folded);
  if (alive.length === 1) {
    alive[0].chips += s.pot;
    return { ...s, phase: 'finished', message: `${alive[0].name} 赢得底池 $${s.pot}` };
  }

  s.currentPlayer = (s.currentPlayer + 1) % s.players.length;
  while (s.players[s.currentPlayer].folded) s.currentPlayer = (s.currentPlayer + 1) % s.players.length;

  // Auto showdown after 2 rounds
  if (s.players.every(p => p.folded || p.bet >= s.currentBet)) {
    const active = s.players.filter(p => !p.folded);
    let best = active[0], bestRank = handRank(best.cards);
    for (let i = 1; i < active.length; i++) {
      const r = handRank(active[i].cards);
      if (r.rank > bestRank.rank || (r.rank === bestRank.rank && Math.random() < 0.5)) { best = active[i]; bestRank = r; }
    }
    best.chips += s.pot;
    return { ...s, phase: 'finished', message: `${best.name} 以 ${bestRank.name} 赢得底池 $${s.pot}` };
  }

  return s;
}

export function zjhAI(state: ZjhState, playerId: number): { action: 'fold' | 'call' | 'raise'; amount?: number } {
  const p = state.players[playerId];
  const rank = handRank(p.cards);
  if (rank.rank >= 4) return { action: 'raise', amount: state.currentBet + 20 };
  if (rank.rank >= 2) return { action: 'call' };
  if (state.currentBet - p.bet > p.chips * 0.3) return { action: 'fold' };
  if (Math.random() < 0.3) return { action: 'raise', amount: state.currentBet + 10 };
  return { action: 'call' };
}
