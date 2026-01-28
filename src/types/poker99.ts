export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  suit: Suit;
  rank: Rank;
  value: number; // 數字值，A=1, J=11, Q=12, K=13
  id: string;
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  score: number;
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  centerCard: Card | null;
  deck: Card[];
  gameStatus: 'waiting' | 'playing' | 'ended';
  winner: string | null;
  round: number;
}