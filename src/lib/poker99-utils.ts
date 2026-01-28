import { Card, Suit, Rank, Player, GameState } from '@/types/poker99';

// 創建一副標準撲克牌
export const createDeck = (): Card[] => {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  
  const deck: Card[] = [];
  let id = 1;
  
  for (const suit of suits) {
    for (const rank of ranks) {
      let value = 0;
      if (rank === 'A') value = 1;
      else if (rank === 'J') value = 11;
      else if (rank === 'Q') value = 12;
      else if (rank === 'K') value = 13;
      else value = parseInt(rank);
      
      // 9 的特殊規則：9 = 99 (回到起始玩家)
      if (rank === '9') value = 99;
      
      deck.push({
        suit,
        rank,
        value,
        id: `card-${id++}`
      });
    }
  }
  
  return deck;
};

// 洗牌函數
export const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// 發牌給玩家
export const dealCards = (deck: Card[], numPlayers: number, cardsPerPlayer: number = 5): { players: Player[], remainingDeck: Card[] } => {
  const players: Player[] = [];
  let deckIndex = 0;
  
  for (let i = 0; i < numPlayers; i++) {
    const hand: Card[] = [];
    for (let j = 0; j < cardsPerPlayer; j++) {
      if (deckIndex < deck.length) {
        hand.push(deck[deckIndex]);
        deckIndex++;
      }
    }
    
    players.push({
      id: `player-${i + 1}`,
      name: `玩家 ${i + 1}`,
      hand,
      score: 0
    });
  }
  
  return {
    players,
    remainingDeck: deck.slice(deckIndex)
  };
};

// 初始化遊戲狀態
export const initializeGameState = (numPlayers: number = 2): GameState => {
  let deck = createDeck();
  deck = shuffleDeck(deck);
  
  const { players, remainingDeck } = dealCards(deck, numPlayers, 5);
  
  return {
    players,
    currentPlayerIndex: 0,
    centerCard: null,
    deck: remainingDeck,
    gameStatus: 'playing',
    winner: null,
    round: 1
  };
};

// 檢查玩家是否可以出牌
export const canPlayCard = (card: Card, centerCard: Card | null): boolean => {
  if (!centerCard) return true; // 如果中心沒有牌，可以出任何牌
  
  // 9 可以在任何時候打出（特殊規則）
  if (card.rank === '9') return true;
  
  // 同花色或同點數可以出
  return card.suit === centerCard.suit || card.rank === centerCard.rank;
};

// 執行出牌動作
export const playCard = (gameState: GameState, playerId: string, cardId: string): GameState => {
  const playerIndex = gameState.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) return gameState;
  
  const player = gameState.players[playerIndex];
  const cardIndex = player.hand.findIndex(c => c.id === cardId);
  if (cardIndex === -1) return gameState;
  
  const cardToPlay = player.hand[cardIndex];
  if (!canPlayCard(cardToPlay, gameState.centerCard)) return gameState;
  
  // 創建新的遊戲狀態
  const newPlayers = [...gameState.players];
  const newPlayerHand = [...player.hand];
  newPlayerHand.splice(cardIndex, 1);
  
  // 更新玩家手牌
  newPlayers[playerIndex] = {
    ...player,
    hand: newPlayerHand
  };
  
  // 更新中心牌
  let newCenterCard = cardToPlay;
  let nextPlayerIndex = gameState.currentPlayerIndex;
  
  // 特殊牌的處理
  if (cardToPlay.rank === '9') {
    // 9 = 99，回到當前玩家（跳過下一個人）
    nextPlayerIndex = gameState.currentPlayerIndex;
  } else {
    // 正常情況下輪到下一位玩家
    nextPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
  }
  
  // 檢查是否有人贏了（手牌為空）
  let winner: string | null = null;
  for (const p of newPlayers) {
    if (p.hand.length === 0) {
      winner = p.id;
      break;
    }
  }
  
  // 如果沒牌了，從牌堆補牌
  let updatedDeck = [...gameState.deck];
  if (newPlayerHand.length < 5 && updatedDeck.length > 0) {
    // 補牌直到達到5張
    while (newPlayerHand.length < 5 && updatedDeck.length > 0) {
      const newCard = updatedDeck.shift();
      if (newCard) {
        newPlayerHand.push(newCard);
      }
    }
    
    // 更新玩家手牌（如果有補牌）
    if (newPlayerHand !== newPlayers[playerIndex].hand) {
      newPlayers[playerIndex] = {
        ...newPlayers[playerIndex],
        hand: newPlayerHand
      };
    }
  }
  
  return {
    ...gameState,
    players: newPlayers,
    currentPlayerIndex: nextPlayerIndex,
    centerCard: newCenterCard,
    deck: updatedDeck,
    winner,
    gameStatus: winner ? 'ended' : 'playing'
  };
};

// 玩家抽牌
export const drawCard = (gameState: GameState, playerId: string): GameState => {
  if (gameState.deck.length === 0) return gameState; // 如果沒牌了就無法抽牌
  
  const playerIndex = gameState.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) return gameState;
  
  const newPlayers = [...gameState.players];
  const drawnCard = gameState.deck[0];
  
  const newPlayerHand = [...newPlayers[playerIndex].hand, drawnCard];
  
  newPlayers[playerIndex] = {
    ...newPlayers[playerIndex],
    hand: newPlayerHand
  };
  
  // 更新遊戲狀態
  const updatedDeck = gameState.deck.slice(1);
  const nextPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
  
  return {
    ...gameState,
    players: newPlayers,
    deck: updatedDeck,
    currentPlayerIndex: nextPlayerIndex
  };
};