import type { Card } from '../../types';

export interface BjPlayer { name: string; cards: Card[]; score: number; isAI: boolean; busted: boolean; stood: boolean; id: number; }

export interface BjState {
  deck: Card[];
  player: BjPlayer;
  dealer: BjPlayer;
  phase: 'betting' | 'playing' | 'dealer_turn' | 'finished';
  message: string;
  bet: number;
  chips: number;
  result: 'win' | 'lose' | 'push' | 'blackjack' | '';
}

function createDeck(): Card[] {
  const deck: Card[] = [];
  const suits: Card['suit'][] = ['spades', 'hearts', 'diamonds', 'clubs'];
  for (const suit of suits) {
    for (let r = 1; r <= 13; r++) {
      deck.push({ suit, rank: r, display: '' });
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

function calcScore(cards: Card[]): number {
  let score = 0, aces = 0;
  for (const c of cards) {
    if (c.rank === 1) { aces++; score += 11; }
    else if (c.rank > 10) score += 10;
    else score += c.rank;
  }
  while (score > 21 && aces > 0) { score -= 10; aces--; }
  return score;
}

export function initBj(): BjState {
  const deck = createDeck();
  return {
    deck,
    player: { name: '你', cards: [], score: 0, isAI: false, busted: false, stood: false, id: 0 },
    dealer: { name: '庄家', cards: [], score: 0, isAI: true, busted: false, stood: false, id: 1 },
    phase: 'betting', message: '请下注', bet: 0, chips: 1000, result: '',
  };
}

export function placeBet(state: BjState, amount: number): BjState {
  if (state.phase !== 'betting' || amount > state.chips) return state;
  const deck = createDeck();
  const playerCards = [deck.pop()!, deck.pop()!];
  const dealerCards = [deck.pop()!, deck.pop()!];
  return {
    ...state, deck, bet: amount, chips: state.chips - amount,
    player: { ...state.player, cards: playerCards, score: calcScore(playerCards), busted: false, stood: false },
    dealer: { ...state.dealer, cards: dealerCards, score: calcScore([dealerCards[0]]), busted: false, stood: false },
    phase: 'playing', message: '要牌还是停牌？', result: '',
  };
}

export function hit(state: BjState): BjState {
  if (state.phase !== 'playing') return state;
  const card = state.deck.pop()!;
  const cards = [...state.player.cards, card];
  const score = calcScore(cards);
  if (score > 21) {
    return { ...state, deck: [...state.deck], player: { ...state.player, cards, score, busted: true },
      phase: 'finished', result: 'lose', message: '爆牌！你输了', chips: state.chips };
  }
  if (score === 21) {
    return { ...state, deck: [...state.deck], player: { ...state.player, cards, score, stood: true },
      message: '21点！', phase: 'dealer_turn' };
  }
  return { ...state, deck: [...state.deck], player: { ...state.player, cards, score }, message: '继续要牌或停牌' };
}

export function stand(state: BjState): BjState {
  if (state.phase !== 'playing') return state;
  return dealerPlay({ ...state, player: { ...state.player, stood: true }, phase: 'dealer_turn', message: '庄家回合' });
}

function dealerPlay(state: BjState): BjState {
  let deck = [...state.deck];
  let dealerCards = [...state.dealer.cards];
  let score = calcScore(dealerCards);

  while (score < 17) {
    dealerCards.push(deck.pop()!);
    score = calcScore(dealerCards);
  }

  const dealerBusted = score > 21;
  const playerScore = state.player.score;
  const isBj = state.player.cards.length === 2 && playerScore === 21;
  const dealerBj = dealerCards.length === 2 && score === 21;

  let result: BjState['result'] = '';
  let chips = state.chips;

  if (isBj && !dealerBj) { result = 'blackjack'; chips += Math.floor(state.bet * 2.5); }
  else if (dealerBusted || playerScore > score) { result = 'win'; chips += state.bet * 2; }
  else if (playerScore === score) { result = 'push'; chips += state.bet; }
  else { result = 'lose'; }

  return {
    ...state, deck,
    dealer: { ...state.dealer, cards: dealerCards, score, busted: dealerBusted },
    phase: 'finished', result, chips,
    message: result === 'win' ? '你赢了！' : result === 'lose' ? '你输了' : result === 'push' ? '平局' : 'Blackjack！',
  };
}

export function bjAI(): 'hit' | 'stand' {
  return Math.random() < 0.5 ? 'hit' : 'stand';
}
