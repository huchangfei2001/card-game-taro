export type GameType = 'doudizhu' | 'texas' | 'chess' | 'go' | 'mahjong' | 'gomoku' | 'blackjack' | 'zhajinhua' | 'niuniu' | 'ludo' | 'intlchess' | 'othello' | 'tetris' | 'tankbattle' | 'pacman' | 'puzzlebobble' | 'strikers1945' | 'guandan' | 'shengji' | 'shisanshui' | 'paodekuai' | 'suoha' | 'junqi' | 'tiaoqi' | 'scmj' | 'riichimahjong';

export interface GameInfo {
  id: GameType;
  name: string;
  nameCN: string;
  description: string;
  players: string;
  icon: string;
}

export type CardSuit = 'spades' | 'hearts' | 'diamonds' | 'clubs' | 'joker';

export interface Card {
  suit: CardSuit;
  rank: number;
  display: string;
}

export type PlayerPosition = 'bottom' | 'right' | 'left' | 'top';

export interface Player {
  id: number;
  name: string;
  chips: number;
  cards: Card[];
  isAI: boolean;
  isDealer: boolean;
  hasFolded: boolean;
  currentBet: number;
  position: PlayerPosition;
}
