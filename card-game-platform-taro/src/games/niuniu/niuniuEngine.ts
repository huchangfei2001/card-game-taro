import type { Card } from '../../types';

export interface NnPlayer { id: number; name: string; cards: Card[]; chips: number; bet: number; niuType: string; niuValue: number; isAI: boolean; }

export interface NnState {
  players: NnPlayer[];
  phase: 'betting' | 'dealing' | 'result' | 'finished';
  message: string;
}

function createDeck(): Card[] {
  const deck: Card[] = [];
  const suits: Card['suit'][] = ['spades', 'hearts', 'diamonds', 'clubs'];
  for (const suit of suits) for (let r = 1; r <= 13; r++) deck.push({ suit, rank: r, display: '' });
  return shuffle(deck);
}

function shuffle<T>(arr: T[]): T[] { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

function cardPoint(r: number): number { return r > 10 ? 10 : r; }

function calcNiu(cards: Card[]): { type: string; value: number } {
  if (cards.length !== 5) return { type: '无牛', value: 0 };
  const pts = cards.map(c => cardPoint(c.rank));
  const total = pts.reduce((a,b) => a+b, 0);

  // Check for 5-card flush (五花牛)
  if (cards.every(c => c.rank > 10)) return { type: '五花牛', value: 10 };
  // Check for bomb (四炸)
  const counts = new Map<number, number>();
  cards.forEach(c => counts.set(c.rank, (counts.get(c.rank)||0)+1));
  for (const [_, c] of counts) if (c === 4) return { type: '四炸', value: 9 };

  // Check combinations summing to 10
  for (let i = 0; i < 5; i++) {
    for (let j = i + 1; j < 5; j++) {
      for (let k = j + 1; k < 5; k++) {
        if ((pts[i] + pts[j] + pts[k]) % 10 === 0) {
          const rest = (total - pts[i] - pts[j] - pts[k]) % 10;
          const v = rest === 0 ? 10 : rest;
          return { type: `牛${v}`, value: v };
        }
      }
    }
  }
  return { type: '无牛', value: 0 };
}

export function initNn(): NnState {
  return {
    players: [
      { id: 0, name: '你', cards: [], chips: 1000, bet: 0, niuType: '', niuValue: 0, isAI: false },
      { id: 1, name: '电脑A', cards: [], chips: 1000, bet: 0, niuType: '', niuValue: 0, isAI: true },
      { id: 2, name: '电脑B', cards: [], chips: 1000, bet: 0, niuType: '', niuValue: 0, isAI: true },
    ],
    phase: 'betting', message: '请下注',
  };
}

export function placeNnBet(state: NnState, bet: number): NnState {
  if (state.phase !== 'betting' || bet > state.players[0].chips) return state;
  const s: NnState = {
    ...state, phase: 'dealing', message: '发牌中...',
    players: state.players.map(p => ({ ...p, bet: p.isAI ? 10 + Math.floor(Math.random() * 30) : bet, cards: [] })),
  };
  s.players[0].chips -= bet;
  // Deal after a brief delay - handled in UI
  return s;
}

export function dealNn(state: NnState): NnState {
  const deck = createDeck();
  const players = state.players.map(p => ({
    ...p, cards: [deck.pop()!, deck.pop()!, deck.pop()!, deck.pop()!, deck.pop()!]
  }));
  players.forEach(p => {
    const niu = calcNiu(p.cards);
    p.niuType = niu.type;
    p.niuValue = niu.value;
  });

  // Compare: player vs each AI
  const playerCards = players[0];
  let net = 0;
  for (let i = 1; i < players.length; i++) {
    if (playerCards.niuValue > players[i].niuValue) {
      net += players[i].bet;
      players[i].chips -= players[i].bet;
    } else if (playerCards.niuValue < players[i].niuValue) {
      net -= playerCards.bet;
    } else {
      // tie - higher card value wins
      const pMax = Math.max(...playerCards.cards.map(c => c.rank === 1 ? 14 : c.rank));
      const aMax = Math.max(...players[i].cards.map(c => c.rank === 1 ? 14 : c.rank));
      if (pMax > aMax) { net += players[i].bet; players[i].chips -= players[i].bet; }
      else { net -= playerCards.bet; }
    }
  }
  players[0].chips += net + playerCards.bet;

  const winMsg = net > 0 ? `赢了 $${net}` : net < 0 ? `输了 $${-net}` : '平局';
  return { ...state, players, phase: 'result', message: `${playerCards.niuType} - ${winMsg}` };
}
