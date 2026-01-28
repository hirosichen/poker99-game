export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  suit: Suit;
  rank: Rank;
  value: number; // 數字值，A=1, J=10, Q=20, K=99
  id: string;
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  score: number;
  isHuman: boolean; // 是否為人類玩家
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  centerCard: Card | null;
  deck: Card[];
  gameStatus: 'waiting' | 'playing' | 'ended';
  winner: string | null;
  round: number;
  currentTotal: number; // 當前總分
}