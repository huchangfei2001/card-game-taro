import type { Card } from '../../types';

function createDeck(): Card[] {
  const deck: Card[] = [];
  const suits: Card['suit'][] = ['spades', 'hearts', 'diamonds', 'clubs'];
  for (const suit of suits) {
    for (let r = 3; r <= 15; r++) {
      deck.push({ suit, rank: r, display: '' });
    }
  }
  deck.push({ suit: 'joker', rank: 16, display: '' });
  deck.push({ suit: 'joker', rank: 17, display: '' });
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

function sortCards(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => b.rank - a.rank);
}

function cardKey(c: Card): string {
  return `${c.suit}-${c.rank}`;
}

// --- Hand type detection ---

interface HandType {
  type: string;
  mainRank: number;
  weight: number;
}

function getCounts(cards: Card[]): Map<number, number> {
  const m = new Map<number, number>();
  cards.forEach(c => m.set(c.rank, (m.get(c.rank) || 0) + 1));
  return m;
}

function identify(cards: Card[]): HandType | null {
  const n = cards.length;
  if (n === 0) return null;
  const r0 = cards[0].rank;
  const counts = getCounts(cards);
  const entries = [...counts.entries()].sort((a, b) => b[1] - a[1]);

  // Single
  if (n === 1) return { type: 'single', mainRank: r0, weight: 0 };

  // Rocket
  if (n === 2 && cards.some(c => c.rank === 16) && cards.some(c => c.rank === 17))
    return { type: 'rocket', mainRank: 99, weight: 100 };

  // Pair
  if (n === 2 && counts.size === 1 && r0 < 16)
    return { type: 'pair', mainRank: r0, weight: 1 };

  // Trio
  if (n === 3 && counts.size === 1 && r0 < 16)
    return { type: 'trio', mainRank: r0, weight: 2 };

  // Bomb
  if (n === 4 && counts.size === 1 && r0 < 16)
    return { type: 'bomb', mainRank: r0, weight: 50 };

  // Trio+1
  if (n === 4 && entries[0][1] === 3)
    return { type: 'trio+1', mainRank: entries[0][0], weight: 3 };

  // Trio+2
  if (n === 5 && entries[0][1] === 3 && entries[1][1] === 2)
    return { type: 'trio+2', mainRank: entries[0][0], weight: 4 };

  // Four+2
  if (n === 6 && entries[0][1] === 4)
    return { type: 'four+2', mainRank: entries[0][0], weight: 8 };

  // Straight (>=5 consecutive singles, no 2/jokers)
  const ranks = [...counts.keys()].sort((a, b) => a - b);
  if (n >= 5 && counts.size === n && ranks.every((r, i) => i === 0 || r === ranks[i - 1] + 1)
      && ranks[ranks.length - 1] <= 14 && ranks.every(r => r < 16)) {
    return { type: 'straight', mainRank: ranks[ranks.length - 1], weight: 5 };
  }

  // Consecutive pairs
  if (n >= 6 && n % 2 === 0 && counts.size === n / 2
      && [...counts.values()].every(v => v === 2)
      && ranks.every((r, i) => i === 0 || r === ranks[i - 1] + 1)
      && ranks[ranks.length - 1] <= 14 && ranks.every(r => r < 16)) {
    return { type: 'consecPairs', mainRank: ranks[ranks.length - 1], weight: 6 };
  }

  // Plane (consecutive trios)
  const trios = entries.filter(e => e[1] >= 3).map(e => e[0]).sort((a, b) => a - b);
  if (trios.length >= 2 && trios.every((r, i) => i === 0 || r === trios[i - 1] + 1)
      && trios[trios.length - 1] <= 14) {
    const trioCardCount = trios.reduce((s, r) => s + (counts.get(r) || 0), 0);
    if (n === trioCardCount)
      return { type: 'plane', mainRank: trios[trios.length - 1], weight: 10 + trios.length };
    if (n === trioCardCount + trios.length)
      return { type: 'plane+1s', mainRank: trios[trios.length - 1], weight: 11 + trios.length };
    if (n === trioCardCount + trios.length * 2)
      return { type: 'plane+2s', mainRank: trios[trios.length - 1], weight: 12 + trios.length };
  }

  return null;
}

function canBeat(my: HandType, last: HandType): boolean {
  if (my.type === 'rocket') return true;
  if (last.type === 'rocket') return false;
  if (my.type === 'bomb' && last.type !== 'bomb') return true;
  if (my.type === 'bomb' && last.type === 'bomb') return my.mainRank > last.mainRank;
  if (my.type !== last.type) return false;
  return my.mainRank > last.mainRank;
}

// --- AI ---

function allSubsets(cards: Card[], maxSize: number): Card[][] {
  const results: Card[][] = [];
  function dfs(start: number, cur: Card[]) {
    if (cur.length > 0 && cur.length <= maxSize) {
      const h = identify(cur);
      if (h) results.push([...cur]);
    }
    if (cur.length >= maxSize) return;
    for (let i = start; i < cards.length; i++) {
      cur.push(cards[i]);
      dfs(i + 1, cur);
      cur.pop();
    }
  }
  dfs(0, []);
  return results;
}

export function aiPlay(hand: Card[], lastPlayType: string | null, lastPlayRank: number, isFree: boolean): Card[] | null {
  const sorted = sortCards(hand);

  if (isFree || !lastPlayType) {
    const subsets = allSubsets(sorted, 1);
    if (subsets.length > 0) return subsets[0];
    return [sorted[sorted.length - 1]];
  }

  const lastType: HandType = { type: lastPlayType, mainRank: lastPlayRank, weight: 0 };

  const subsets = allSubsets(sorted, Math.min(sorted.length, 12));

  // Try same type
  const sameType = subsets.filter(s => {
    const h = identify(s);
    return h && h.type === lastType.type && canBeat(h, lastType);
  });
  if (sameType.length > 0) {
    sameType.sort((a, b) => (identify(a)?.mainRank || 0) - (identify(b)?.mainRank || 0));
    return sameType[0];
  }

  // Try bomb
  const bombs = subsets.filter(s => {
    const h = identify(s);
    return h && h.type === 'bomb' && canBeat(h, lastType);
  });
  if (bombs.length > 0) {
    bombs.sort((a, b) => (identify(a)?.mainRank || 0) - (identify(b)?.mainRank || 0));
    return bombs[0];
  }

  // Rocket
  const rocketCards = sorted.filter(c => c.rank >= 16);
  if (rocketCards.length >= 2 && rocketCards.some(c => c.rank === 16) && rocketCards.some(c => c.rank === 17)) {
    if (lastType.type !== 'rocket') return [rocketCards.find(c => c.rank === 16)!, rocketCards.find(c => c.rank === 17)!];
  }

  return null;
}

// --- Game State ---

export interface DdzPlayer {
  id: number;
  name: string;
  cards: Card[];
  isLandlord: boolean;
  isAI: boolean;
}

export interface DdzState {
  players: DdzPlayer[];
  landlordCards: Card[];
  currentPlayer: number;
  lastPlayCardIds: string[] | null;
  lastPlayPlayer: number;
  lastPlayType: string | null;
  lastPlayRank: number;
  passCount: number;
  phase: 'bidding' | 'playing' | 'finished';
  winner: number | null;
  message: string;
}

export function initGame(): DdzState {
  return {
    players: [
      { id: 0, name: '你', cards: [], isLandlord: false, isAI: false },
      { id: 1, name: '电脑A', cards: [], isLandlord: false, isAI: true },
      { id: 2, name: '电脑B', cards: [], isLandlord: false, isAI: true },
    ],
    landlordCards: [],
    currentPlayer: 0,
    lastPlayCardIds: null,
    lastPlayPlayer: -1,
    lastPlayType: null,
    lastPlayRank: 0,
    passCount: 0,
    phase: 'bidding',
    winner: null,
    message: '叫地主阶段',
  };
}

export function dealCards(state: DdzState, landlordId: number): DdzState {
  const deck = createDeck();
  const players = state.players.map(p => ({ ...p, cards: [] as Card[], isLandlord: p.id === landlordId }));
  for (let i = 0; i < 51; i++) {
    players[i % 3].cards.push(deck[i]);
  }
  const landlordCards = deck.slice(51);

  const landlord = players[landlordId];
  landlord.cards = sortCards([...landlord.cards, ...landlordCards]);

  for (let i = 0; i < 3; i++) {
    if (i !== landlordId) players[i].cards = sortCards(players[i].cards);
  }

  return {
    ...state,
    players,
    landlordCards,
    currentPlayer: landlordId,
    lastPlayCardIds: null,
    lastPlayPlayer: -1,
    lastPlayType: null,
    lastPlayRank: 0,
    passCount: 0,
    phase: 'playing',
    message: `${players[landlordId].name} 是地主，请出牌`,
  };
}

export function playCards(state: DdzState, playerId: number, cardIds: string[]): DdzState | null {
  if (state.phase !== 'playing') return null;
  if (playerId !== state.currentPlayer) return null;

  const player = state.players[playerId];
  const newCards = [...player.cards];

  // Pass
  if (cardIds.length === 0) {
    if (!state.lastPlayCardIds) return null; // can't pass on free play
    const passCount = state.passCount + 1;
    const nextPlayer = (playerId + 1) % 3;
    if (passCount >= 2) {
      return {
        ...state,
        currentPlayer: nextPlayer,
        lastPlayCardIds: null,
        lastPlayPlayer: -1,
        lastPlayType: null,
        lastPlayRank: 0,
        passCount: 0,
        players: state.players.map((p, i) => i === playerId ? { ...p, cards: newCards } : p),
        message: `${state.players[nextPlayer].name} 自由出牌`,
      };
    }
    return {
      ...state,
      currentPlayer: nextPlayer,
      passCount,
      players: state.players.map((p, i) => i === playerId ? { ...p, cards: newCards } : p),
      message: `${player.name} 不出`,
    };
  }

  // Find and remove the played cards from the hand
  const playedCards: Card[] = [];
  const remainingIds = new Set(cardIds);
  const remaining: Card[] = [];

  for (const c of newCards) {
    const cid = `${c.suit}-${c.rank}`;
    if (remainingIds.has(cid)) {
      playedCards.push(c);
      remainingIds.delete(cid);
    } else {
      remaining.push(c);
    }
  }

  if (remainingIds.size > 0) return null; // Card not found

  // Validate the hand
  const handType = identify(playedCards);
  if (!handType) return null;

  // Check against previous play
  if (state.lastPlayType && state.lastPlayCardIds && state.lastPlayCardIds.length > 0) {
    if (state.lastPlayPlayer !== playerId) {
      const lastType: HandType = { type: state.lastPlayType, mainRank: state.lastPlayRank, weight: 0 };
      if (!canBeat(handType, lastType)) return null;
    }
  }

  // Update player's hand
  const updatedPlayers = state.players.map((p, i) =>
    i === playerId ? { ...p, cards: sortCards(remaining) } : p
  );

  // Check win
  if (remaining.length === 0) {
    const isLandlord = player.isLandlord;
    const winner = isLandlord ? playerId : updatedPlayers.findIndex((p, i) => i !== playerId && !p.isLandlord);
    return {
      ...state,
      players: updatedPlayers,
      currentPlayer: playerId,
      lastPlayCardIds: cardIds,
      lastPlayPlayer: playerId,
      lastPlayType: handType.type,
      lastPlayRank: handType.mainRank,
      passCount: 0,
      phase: 'finished',
      winner: winner >= 0 ? winner : playerId,
      message: `${player.name} 赢了！`,
    };
  }

  return {
    ...state,
    players: updatedPlayers,
    currentPlayer: (playerId + 1) % 3,
    lastPlayCardIds: cardIds,
    lastPlayPlayer: playerId,
    lastPlayType: handType.type,
    lastPlayRank: handType.mainRank,
    passCount: 0,
    message: `${player.name} 出牌`,
  };
}

export { cardKey, sortCards };
