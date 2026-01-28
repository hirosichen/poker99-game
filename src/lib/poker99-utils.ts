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
      else if (rank === 'J') value = 10; // J = 跳過
      else if (rank === 'Q') value = 20; // Q = +20 或 -20
      else if (rank === 'K') value = 99; // K = 99 (固定值)
      else if (rank === '4') value = -1; // 4 = 迴轉
      else if (rank === '5') value = 0; // 5 = 指定下家
      else if (rank === '10') value = 10; // 10 = +10 或 -10
      else value = parseInt(rank);
      
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
  
  // 設置初始中心牌，避免特殊牌
  let initialCenterCard: Card | null = null;
  let remainingDeckAfterInitial = [...remainingDeck];
  
  while (remainingDeckAfterInitial.length > 0) {
    const card = remainingDeckAfterInitial.shift();
    if (card && !['4', '5', 'J', 'Q', 'K'].includes(card.rank)) {
      initialCenterCard = card;
      break;
    }
  }
  
  return {
    players,
    currentPlayerIndex: 0,
    centerCard: initialCenterCard,
    deck: remainingDeckAfterInitial,
    gameStatus: 'playing',
    winner: null,
    round: 1
  };
};

// 檢查玩家是否可以出牌
export const canPlayCard = (card: Card, centerCard: Card | null): boolean => {
  if (!centerCard) return true; // 如果中心沒有牌，可以出任何牌
  
  // 4, 5, J, Q, K 可以在任何時候打出（特殊規則）
  if (['4', '5', 'J', 'Q', 'K'].includes(card.rank)) return true;
  
  // 同花色或同點數可以出
  return card.suit === centerCard.suit || card.rank === centerCard.rank;
};

// 計算新總分（考慮各種特殊牌的效果）
export const calculateNewTotal = (currentTotal: number, playedCard: Card, centerCard: Card | null): number => {
  // 如果中心沒有牌，則使用玩家出的牌作為初始值
  if (!centerCard) {
    return playedCard.value;
  }
  
  let newTotal = currentTotal;
  let cardValue = playedCard.value;
  
  switch (playedCard.rank) {
    case '4': // 迴轉 - 不改變總數，但改變方向（這裡簡化為跳過下一個人）
      break;
    case '5': // 指定 - 下一家由出牌者指定（這裡簡化為當前玩家繼續）
      break;
    case '10': // +10 或 -10
      // 如果當前總分加上10會超過99，則減10；否則加10
      if (currentTotal + 10 <= 99) {
        newTotal = currentTotal + 10;
      } else {
        newTotal = currentTotal - 10;
      }
      break;
    case 'J': // 跳過 - 不改變總數，跳過下一個玩家
      break;
    case 'Q': // +20 或 -20
      // 如果當前總分加上20會超過99，則減20；否則加20
      if (currentTotal + 20 <= 99) {
        newTotal = currentTotal + 20;
      } else {
        newTotal = currentTotal - 20;
      }
      break;
    case 'K': // 99 - 總分直接變成99
      newTotal = 99;
      break;
    default:
      newTotal = currentTotal + cardValue;
  }

  // 確保總分不超過99
  if (newTotal > 99) {
    newTotal = 99; // 根據您的說明，超過99時不爆掉，而是保持在99
  }
  
  // 確保總分不小於0
  if (newTotal < 0) {
    newTotal = 0;
  }
  
  return newTotal;
};

// 執行出牌動作
export const playCard = (gameState: GameState, playerId: string, cardId: string, newTotal: number): GameState => {
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
  
  // 根據特殊牌決定下一個玩家
  switch (cardToPlay.rank) {
    case '4': // 迴轉 - 當前玩家繼續
      nextPlayerIndex = gameState.currentPlayerIndex;
      break;
    case '5': // 指定 - 當前玩家可以指定下一個玩家
      nextPlayerIndex = gameState.currentPlayerIndex;
      break;
    case 'J': // 跳過 - 跳過下一個玩家
      nextPlayerIndex = (gameState.currentPlayerIndex + 2) % gameState.players.length;
      break;
    default:
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
  
  // 檢查是否有人分數超過99（爆掉）
  if (newTotal > 99) {
    // 如果有人爆掉，遊戲結束，其他玩家勝利
    const remainingPlayers = newPlayers.filter(p => p.id !== playerId);
    if (remainingPlayers.length > 0) {
      winner = remainingPlayers[0].id;
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

// 檢查遊戲是否結束（有人爆掉）
export const checkGameOver = (total: number): boolean => {
  return total > 99;
};