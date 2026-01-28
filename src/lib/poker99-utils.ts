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
      name: i === 0 ? '人類玩家' : `電腦玩家 ${i}`,
      hand,
      score: 0,
      isHuman: i === 0 // 第一個玩家是人類，其餘是電腦
    });
  }
  
  return {
    players,
    remainingDeck: deck.slice(deckIndex)
  };
};

// 初始化遊戲狀態
export const initializeGameState = (numPlayers: number = 4): GameState => {
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
    round: 1,
    currentTotal: initialCenterCard ? initialCenterCard.value : 0
  };
};

// 檢查玩家是否可以出牌
export const canPlayCard = (card: Card, centerCard: Card | null): boolean => {
  // 在撲克牌99中，任何牌都可以出，不限制花色或點數
  return true;
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
    newTotal = 99;
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
    currentTotal: newTotal,
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

// AI 選擇最佳出牌
export const selectBestMoveForAI = (player: Player, centerCard: Card | null, currentTotal: number, players: Player[]): { cardId: string, newTotal: number } | null => {
  // 獲取所有可以出的牌
  const playableCards = player.hand.filter(card => canPlayCard(card, centerCard));
  
  if (playableCards.length === 0) {
    // 如果沒有可出的牌，則返回 null 表示需要抽牌
    return null;
  }
  
  // 評估每張可出的牌
  let bestCard: Card | null = null;
  let bestNewTotal: number = -1;
  let minRisk = Infinity; // 最小風險值
  
  for (const card of playableCards) {
    // 計算出這張牌後的新總分
    const newTotal = calculateNewTotal(currentTotal, card, centerCard);
    
    // 計算風險值
    let risk = calculateRisk(newTotal);
    
    // 特殊牌的優先級
    if (card.rank === 'K') { // K = 99，直接將總分設為99
      // 如果當前總分接近99且低於99，出K可以控制局面
      risk = 0; // 最低風險
    } else if (card.rank === 'J') { // J = 跳過下家
      // 跳過可能即將爆掉的玩家
      risk -= 5;
    } else if (card.rank === '4') { // 4 = 迴轉
      // 迴轉可以讓自己多一次機會
      risk -= 3;
    } else if (card.rank === '5') { // 5 = 指定下家
      // 指定可以控制遊戲流向
      risk -= 4;
    }
    
    // 如果風險更低，或者風險相同但更接近安全值，則選擇這張牌
    if (risk < minRisk || (risk === minRisk && Math.abs(newTotal - 90) < Math.abs(bestNewTotal - 90))) {
      minRisk = risk;
      bestCard = card;
      bestNewTotal = newTotal;
    }
  }
  
  if (bestCard) {
    return {
      cardId: bestCard.id,
      newTotal: bestNewTotal
    };
  }
  
  return null;
};

// 計算風險值
const calculateRisk = (total: number): number => {
  // 總分越接近99，風險越高
  if (total >= 90) {
    // 90以上風險急劇增加
    return (total - 90) * 10;
  } else if (total >= 80) {
    // 80-89中等風險
    return (total - 80) * 5;
  } else {
    // 80以下低風險
    return 90 - total;
  }
};

// AI 抽牌策略
export const aiShouldDrawCard = (player: Player, currentTotal: number, players: Player[]): boolean => {
  // 如果手牌少於3張，優先補牌
  if (player.hand.length < 3) {
    return true;
  }
  
  // 如果當前總分較高（接近爆掉），且手牌中有安全牌，則優先出牌
  if (currentTotal > 85) {
    // 檢查是否有安全牌
    const safeCards = player.hand.filter(card => {
      const newTotal = calculateNewTotal(currentTotal, card, null);
      return newTotal <= 85;
    });
    
    if (safeCards.length > 0) {
      return false; // 有安全牌，優先出牌
    }
  }
  
  // 一般情況下，如果手牌數量適中，可以考慮抽牌
  return Math.random() > 0.7; // 30% 機率抽牌
};