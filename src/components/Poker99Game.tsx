'use client';

import React, { useState, useEffect } from 'react';
import { initializeGameState, playCard, drawCard, canPlayCard, calculateNewTotal, checkGameOver } from '@/lib/poker99-utils';
import { Card, Player, GameState } from '@/types/poker99';

interface Poker99GameProps {
  numPlayers?: number;
}

const Poker99Game: React.FC<Poker99GameProps> = ({ numPlayers = 2 }) => {
  const [gameState, setGameState] = useState<GameState>(() => initializeGameState(numPlayers));
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('遊戲開始！');
  const [totalScore, setTotalScore] = useState<number>(0);
  const [showSpecialCardOptions, setShowSpecialCardOptions] = useState<boolean>(false);
  const [specialCardAction, setSpecialCardAction] = useState<{cardId: string, action: string} | null>(null);

  // 初始化遊戲
  useEffect(() => {
    const initialGameState = initializeGameState(numPlayers);
    setGameState(initialGameState);
    
    // 計算初始總分
    let initialTotal = 0;
    if (initialGameState.centerCard) {
      initialTotal = initialGameState.centerCard.rank === 'K' ? 99 : initialGameState.centerCard.value;
    }
    setTotalScore(initialTotal);
    
    setMessage(`遊戲開始！當前總分: ${initialTotal}，輪到 ${initialGameState.players[initialGameState.currentPlayerIndex]?.name}`);
  }, [numPlayers]);

  const handleCardClick = (cardId: string) => {
    if (gameState.gameStatus !== 'playing') return;
    
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (!currentPlayer) return;
    
    // 檢查是否是當前玩家的手牌
    const cardInHand = currentPlayer.hand.find(card => card.id === cardId);
    if (!cardInHand) return;
    
    // 檢查是否可以出這張牌
    if (!canPlayCard(cardInHand, gameState.centerCard)) {
      setMessage(`不能出這張牌！需要與中心牌 ${gameState.centerCard?.suit}${gameState.centerCard?.rank} 同花色或同點數`);
      return;
    }
    
    // 處理特殊牌
    if (['4', '5', 'J', 'Q', 'K'].includes(cardInHand.rank)) {
      // 顯示特殊牌選項
      setSpecialCardAction({ cardId, action: cardInHand.rank });
      setShowSpecialCardOptions(true);
      setSelectedCard(cardId);
      return;
    }
    
    // 計算新總分
    const newTotal = calculateNewTotal(totalScore, cardInHand, gameState.centerCard);
    
    // 檢查是否爆掉
    if (checkGameOver(newTotal)) {
      setMessage(`${currentPlayer.name} 出了 ${cardInHand.suit}${cardInHand.rank}！總分超過99，${currentPlayer.name} 爆掉了！`);
      // 遊戲結束，其他玩家勝利
      const otherPlayers = gameState.players.filter(p => p.id !== currentPlayer.id);
      if (otherPlayers.length > 0) {
        const winner = otherPlayers[0];
        setTimeout(() => {
          setGameState({
            ...gameState,
            winner: winner.id,
            gameStatus: 'ended'
          });
          setMessage(`${winner.name} 獲勝！`);
        }, 1000);
      }
      return;
    }
    
    // 出牌
    const newGameState = playCard(gameState, currentPlayer.id, cardId, newTotal);
    setGameState(newGameState);
    setTotalScore(newTotal);
    
    if (newGameState.centerCard) {
      setMessage(`${currentPlayer.name} 出了 ${newGameState.centerCard.suit}${newGameState.centerCard.rank}！總分: ${newTotal}，輪到 ${newGameState.players[newGameState.currentPlayerIndex].name}`);
    }
    
    // 檢查是否有人贏了
    if (newGameState.winner) {
      const winner = newGameState.players.find(p => p.id === newGameState.winner);
      setMessage(`${winner?.name} 贏了！`);
    }
    
    setSelectedCard(null);
  };

  const handleSpecialCardAction = (action: string) => {
    if (!specialCardAction) return;
    
    const { cardId } = specialCardAction;
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    
    if (!currentPlayer) return;
    
    const cardToPlay = currentPlayer.hand.find(card => card.id === cardId);
    if (!cardToPlay) return;
    
    // 根據特殊牌計算新總分
    let newTotal = totalScore;
    
    switch (cardToPlay.rank) {
      case '4': // 迴轉
        newTotal = totalScore;
        setMessage(`${currentPlayer.name} 出了 ${cardToPlay.suit}${cardToPlay.rank}！迴轉，繼續由 ${currentPlayer.name} 出牌`);
        break;
      case '5': // 指定
        newTotal = totalScore;
        setMessage(`${currentPlayer.name} 出了 ${cardToPlay.suit}${cardToPlay.rank}！指定下家，繼續由 ${currentPlayer.name} 出牌`);
        break;
      case '10': // +10 或 -10
        if (totalScore + 10 <= 99) {
          newTotal = totalScore + 10;
        } else {
          newTotal = totalScore - 10;
        }
        setMessage(`${currentPlayer.name} 出了 ${cardToPlay.suit}${cardToPlay.rank}！總分: ${newTotal}，輪到 ${gameState.players[(gameState.currentPlayerIndex + 1) % gameState.players.length].name}`);
        break;
      case 'J': // 跳過
        newTotal = totalScore;
        setMessage(`${currentPlayer.name} 出了 ${cardToPlay.suit}${cardToPlay.rank}！跳過下家，輪到 ${gameState.players[(gameState.currentPlayerIndex + 2) % gameState.players.length].name}`);
        break;
      case 'Q': // +20 或 -20
        if (totalScore + 20 <= 99) {
          newTotal = totalScore + 20;
        } else {
          newTotal = totalScore - 20;
        }
        setMessage(`${currentPlayer.name} 出了 ${cardToPlay.suit}${cardToPlay.rank}！總分: ${newTotal}，輪到 ${gameState.players[(gameState.currentPlayerIndex + 1) % gameState.players.length].name}`);
        break;
      case 'K': // 99
        newTotal = 99;
        setMessage(`${currentPlayer.name} 出了 ${cardToPlay.suit}${cardToPlay.rank}！總分固定為 99，輪到 ${gameState.players[(gameState.currentPlayerIndex + 1) % gameState.players.length].name}`);
        break;
    }
    
    // 檢查是否爆掉
    if (checkGameOver(newTotal)) {
      setMessage(`${currentPlayer.name} 出了 ${cardToPlay.suit}${cardToPlay.rank}！總分超過99，${currentPlayer.name} 爆掉了！`);
      // 遊戲結束，其他玩家勝利
      const otherPlayers = gameState.players.filter(p => p.id !== currentPlayer.id);
      if (otherPlayers.length > 0) {
        const winner = otherPlayers[0];
        setTimeout(() => {
          setGameState({
            ...gameState,
            winner: winner.id,
            gameStatus: 'ended'
          });
          setMessage(`${winner.name} 獲勝！`);
        }, 1000);
      }
      setShowSpecialCardOptions(false);
      setSpecialCardAction(null);
      return;
    }
    
    // 出牌
    const newGameState = playCard(gameState, currentPlayer.id, cardId, newTotal);
    setGameState(newGameState);
    setTotalScore(newTotal);
    
    setShowSpecialCardOptions(false);
    setSpecialCardAction(null);
    setSelectedCard(null);
  };

  const handleDrawCard = () => {
    if (gameState.gameStatus !== 'playing') return;
    
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (!currentPlayer) return;
    
    // 檢查是否還有牌可以抽
    if (gameState.deck.length === 0) {
      setMessage('牌堆沒牌了！');
      return;
    }
    
    const newGameState = drawCard(gameState, currentPlayer.id);
    setGameState(newGameState);
    setMessage(`${currentPlayer.name} 抽了一張牌！輪到 ${newGameState.players[newGameState.currentPlayerIndex].name}`);
  };

  const resetGame = () => {
    const newGameState = initializeGameState(numPlayers);
    setGameState(newGameState);
    
    // 計算初始總分
    let initialTotal = 0;
    if (newGameState.centerCard) {
      initialTotal = newGameState.centerCard.rank === 'K' ? 99 : newGameState.centerCard.value;
    }
    setTotalScore(initialTotal);
    
    setMessage(`遊戲重新開始！當前總分: ${initialTotal}，輪到 ${newGameState.players[newGameState.currentPlayerIndex].name}`);
  };

  const renderCard = (card: Card, onClick?: () => void, isSelected: boolean = false) => {
    const suitSymbols = {
      hearts: '♥',
      diamonds: '♦',
      clubs: '♣',
      spades: '♠'
    };
    
    const bgColor = card.suit === 'hearts' || card.suit === 'diamonds' ? 'bg-red-100' : 'bg-black';
    const textColor = card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-600' : 'text-white';
    
    // 特殊牌標記
    let specialLabel = '';
    if (['4', '5', 'J', 'Q', 'K', '10'].includes(card.rank)) {
      switch (card.rank) {
        case '4': specialLabel = '迴轉'; break;
        case '5': specialLabel = '指定'; break;
        case 'J': specialLabel = '跳過'; break;
        case 'Q': specialLabel = '±20'; break;
        case 'K': specialLabel = '99'; break;
        case '10': specialLabel = '±10'; break;
      }
    }
    
    return (
      <div
        key={card.id}
        className={`
          w-16 h-28 rounded-md border border-gray-300 flex flex-col justify-between p-2 cursor-pointer relative
          ${isSelected ? 'ring-4 ring-blue-500 scale-105' : 'hover:scale-105 hover:shadow-md'}
          ${bgColor} ${textColor} transition-transform duration-200
        `}
        onClick={onClick}
      >
        <div className="text-left font-bold">{card.rank}</div>
        <div className="text-center text-xl">{suitSymbols[card.suit]}</div>
        <div className="text-right font-bold rotate-180">{card.rank}</div>
        {specialLabel && (
          <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs rounded-full w-6 h-6 flex items-center justify-center">
            {specialLabel}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">撲克牌99遊戲</h1>
      
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="text-lg font-semibold">
            總分: <span className="text-red-600 text-xl font-bold">{totalScore}</span>
          </div>
          <div className="text-lg">
            輪到: <span className="text-blue-600">{gameState.players[gameState.currentPlayerIndex]?.name}</span>
          </div>
          <div className="text-lg">
            牌堆剩餘: <span className="font-bold">{gameState.deck.length}</span> 張
          </div>
          <button
            onClick={resetGame}
            className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            重新開始
          </button>
        </div>
        
        <div className="text-center text-xl font-semibold mb-4 min-h-[30px] text-green-700">
          {message}
        </div>
        
        {/* 中心牌 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-2 text-center">中心牌</h2>
          <div className="flex justify-center">
            {gameState.centerCard ? (
              renderCard(gameState.centerCard)
            ) : (
              <div className="w-16 h-28 border-2 border-dashed border-gray-400 rounded-md flex items-center justify-center">
                <span className="text-gray-500">空</span>
              </div>
            )}
          </div>
        </div>
        
        {/* 特殊牌操作彈窗 */}
        {showSpecialCardOptions && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">特殊牌效果</h3>
              <p className="mb-4">
                您出了一張特殊牌：
                {specialCardAction && gameState.players[gameState.currentPlayerIndex] && 
                  (() => {
                    const card = gameState.players[gameState.currentPlayerIndex].hand.find(c => c.id === specialCardAction.cardId);
                    return card ? `${card.suit}${card.rank}` : '';
                  })()
                }
              </p>
              
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => handleSpecialCardAction('confirm')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md"
                >
                  確認
                </button>
                <button
                  onClick={() => {
                    setShowSpecialCardOptions(false);
                    setSpecialCardAction(null);
                  }}
                  className="px-4 py-2 bg-gray-300 rounded-md"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* 所有玩家 */}
        {gameState.players.map((player, index) => (
          <div 
            key={player.id} 
            className={`mb-8 p-4 rounded-lg ${
              index === gameState.currentPlayerIndex 
                ? 'bg-blue-50 border-2 border-blue-300' 
                : 'bg-gray-50'
            }`}
          >
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-bold">
                {player.name} {index === gameState.currentPlayerIndex && '(當前玩家)'}
              </h2>
              <div className="text-gray-600">手牌: {player.hand.length} 張</div>
            </div>
            
            {index === gameState.currentPlayerIndex ? (
              // 當前玩家 - 顯示手牌和操作
              <div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {player.hand.map(card => (
                    <div key={card.id} onClick={() => handleCardClick(card.id)}>
                      {renderCard(card, undefined, selectedCard === card.id)}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleDrawCard}
                    disabled={gameState.deck.length === 0}
                    className="px-4 py-2 bg-green-600 text-white rounded-md disabled:bg-gray-400"
                  >
                    抽牌
                  </button>
                  <div className="text-sm text-gray-600 mt-2">
                    說明：4=迴轉, 5=指定, 10=±10, J=跳過, Q=±20, K=99
                  </div>
                </div>
              </div>
            ) : (
              // 其他玩家 - 只顯示手牌數量
              <div className="flex flex-wrap gap-2 opacity-70">
                {player.hand.map((_, idx) => (
                  <div key={idx} className="w-16 h-28 bg-blue-100 border border-gray-300 rounded-md"></div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Poker99Game;