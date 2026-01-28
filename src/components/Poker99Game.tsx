'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { initializeGameState, playCard, drawCard, canPlayCard, calculateNewTotal, checkGameOver, selectBestMoveForAI, aiShouldDrawCard } from '@/lib/poker99-utils';
import { Card, Player, GameState } from '@/types/poker99';

interface Poker99GameProps {
  numPlayers?: number;
}

const Poker99Game: React.FC<Poker99GameProps> = ({ numPlayers = 4 }) => {
  const [gameState, setGameState] = useState<GameState>(() => initializeGameState(numPlayers));
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('遊戲開始！');
  const [totalScore, setTotalScore] = useState<number>(0);
  const [showSpecialCardOptions, setShowSpecialCardOptions] = useState<boolean>(false);
  const [specialCardAction, setSpecialCardAction] = useState<{cardId: string, action: string} | null>(null);
  const [isAITurn, setIsAITurn] = useState<boolean>(false);

  // 初始化遊戲
  useEffect(() => {
    const initialGameState = initializeGameState(numPlayers);
    setGameState(initialGameState);
    
    // 設置初始總分
    setTotalScore(initialGameState.currentTotal);
    setMessage(`遊戲開始！當前總分: ${initialGameState.currentTotal}，輪到 ${initialGameState.players[initialGameState.currentPlayerIndex]?.name}`);
    
    // 檢查是否是AI回合
    const currentPlayer = initialGameState.players[initialGameState.currentPlayerIndex];
    if (currentPlayer && !currentPlayer.isHuman) {
      setIsAITurn(true);
      // 延遲一點執行AI回合，讓玩家能看到當前狀態
      setTimeout(() => executeAITurn(), 1000);
    }
  }, [numPlayers]);

  // AI 回合處理
  const executeAITurn = useCallback(() => {
    if (gameState.gameStatus !== 'playing') {
      setIsAITurn(false);
      return;
    }

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.isHuman) {
      setIsAITurn(false);
      return;
    }

    // AI 思考時間
    setTimeout(() => {
      // 決定 AI 要出牌還是抽牌
      const shouldDraw = aiShouldDrawCard(currentPlayer, gameState.currentTotal, gameState.players);
      
      if (shouldDraw && gameState.deck.length > 0) {
        // AI 抽牌
        const newGameState = drawCard(gameState, currentPlayer.id);
        setGameState(newGameState);
        
        const nextPlayer = newGameState.players[newGameState.currentPlayerIndex];
        setMessage(`${currentPlayer.name} 抽了一張牌！輪到 ${nextPlayer.name}`);
        
        // 檢查下一個玩家是否也是AI
        if (nextPlayer && !nextPlayer.isHuman) {
          setIsAITurn(true);
          setTimeout(() => {
            executeAITurn();
          }, 1500); // 延遲一下讓玩家能看到狀態變化
        } else {
          setIsAITurn(false);
        }
      } else {
        // AI 出牌
        const move = selectBestMoveForAI(currentPlayer, gameState.centerCard, gameState.currentTotal, gameState.players);
        
        if (move) {
          // 計算新總分
          const cardToPlay = currentPlayer.hand.find(c => c.id === move.cardId);
          if (cardToPlay) {
            const newTotal = calculateNewTotal(gameState.currentTotal, cardToPlay, gameState.centerCard);
            
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
              return;
            }
            
            // 執行出牌
            const newGameState = playCard(gameState, currentPlayer.id, move.cardId, newTotal);
            setGameState(newGameState);
            setTotalScore(newTotal);
            
            if (newGameState.centerCard) {
              setMessage(`${currentPlayer.name} 出了 ${newGameState.centerCard.suit}${newGameState.centerCard.rank}！總分: ${newTotal}，輪到 ${newGameState.players[newGameState.currentPlayerIndex].name}`);
            }
            
            // 檢查是否有人贏了
            if (newGameState.winner) {
              const winner = newGameState.players.find(p => p.id === newGameState.winner);
              setMessage(`${winner?.name} 贏了！`);
            } else {
              // 檢查下一個玩家是否也是AI
              const nextPlayer = newGameState.players[newGameState.currentPlayerIndex];
              if (nextPlayer && !nextPlayer.isHuman) {
                setIsAITurn(true);
                setTimeout(() => {
                  executeAITurn();
                }, 1500); // 延遲一下讓玩家能看到狀態變化
              } else {
                setIsAITurn(false);
              }
            }
          } else {
            // 如果找不到對應的卡片，AI抽牌作為備用方案
            if (gameState.deck.length > 0) {
              const newGameState = drawCard(gameState, currentPlayer.id);
              setGameState(newGameState);
              
              const nextPlayer = newGameState.players[newGameState.currentPlayerIndex];
              setMessage(`${currentPlayer.name} 沒有找到可出的牌，抽了一張牌！輪到 ${nextPlayer.name}`);
              
              // 檢查下一個玩家是否也是AI
              if (nextPlayer && !nextPlayer.isHuman) {
                setIsAITurn(true);
                setTimeout(() => {
                  executeAITurn();
                }, 1500); // 延遲一下讓玩家能看到狀態變化
              } else {
                setIsAITurn(false);
              }
            } else {
              // 如果牌堆也沒牌了，跳過回合
              const nextPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
              const nextPlayer = gameState.players[nextPlayerIndex];
              setMessage(`${currentPlayer.name} 無法出牌也無法抽牌，跳過回合。輪到 ${nextPlayer.name}`);
              
              setGameState({
                ...gameState,
                currentPlayerIndex: nextPlayerIndex
              });
              
              // 檢查下一個玩家是否也是AI
              if (nextPlayer && !nextPlayer.isHuman) {
                setIsAITurn(true);
                setTimeout(() => {
                  executeAITurn();
                }, 1500); // 延遲一下讓玩家能看到狀態變化
              } else {
                setIsAITurn(false);
              }
            }
          }
        } else {
          // 沒有可出的牌，AI 抽牌
          if (gameState.deck.length > 0) {
            const newGameState = drawCard(gameState, currentPlayer.id);
            setGameState(newGameState);
            
            const nextPlayer = newGameState.players[newGameState.currentPlayerIndex];
            setMessage(`${currentPlayer.name} 沒有可出的牌，抽了一張牌！輪到 ${nextPlayer.name}`);
            
            // 檢查下一個玩家是否也是AI
            if (nextPlayer && !nextPlayer.isHuman) {
              setIsAITurn(true);
              setTimeout(() => {
                executeAITurn();
              }, 1500); // 延遲一下讓玩家能看到狀態變化
            } else {
              setIsAITurn(false);
            }
          }
        }
      }
    }, 1000);
  }, [gameState]);

  const handleCardClick = (cardId: string) => {
    if (gameState.gameStatus !== 'playing') return;
    
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (!currentPlayer || !currentPlayer.isHuman) return; // 只有人類玩家可以操作
    
    // 檢查是否是當前玩家的手牌
    const cardInHand = currentPlayer.hand.find(card => card.id === cardId);
    if (!cardInHand) return;
    
    // 計算新總分
    const newTotal = calculateNewTotal(totalScore, cardInHand, gameState.centerCard);
    
    // 處理特殊牌
    if (['4', '5', 'J', 'Q', 'K'].includes(cardInHand.rank)) {
      // 顯示特殊牌選項
      setSpecialCardAction({ cardId, action: cardInHand.rank });
      setShowSpecialCardOptions(true);
      setSelectedCard(cardId);
      return;
    }
    
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
    } else {
      // 檢查下一個玩家是否是AI
      const nextPlayer = newGameState.players[newGameState.currentPlayerIndex];
      if (nextPlayer && !nextPlayer.isHuman) {
        setIsAITurn(true);
        setTimeout(() => executeAITurn(), 1000);
      }
    }
    
    setSelectedCard(null);
  };

  const handleSpecialCardAction = (action: string) => {
    if (!specialCardAction) return;
    
    const { cardId } = specialCardAction;
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    
    if (!currentPlayer || !currentPlayer.isHuman) return;
    
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
    
    // 檢查下一個玩家是否是AI
    const nextPlayer = newGameState.players[newGameState.currentPlayerIndex];
    if (nextPlayer && !nextPlayer.isHuman) {
      setIsAITurn(true);
      setTimeout(() => executeAITurn(), 1000);
    }
  };

  const handleDrawCard = () => {
    if (gameState.gameStatus !== 'playing') return;
    
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (!currentPlayer || !currentPlayer.isHuman) return; // 只有人類玩家可以操作
    
    // 檢查是否還有牌可以抽
    if (gameState.deck.length === 0) {
      setMessage('牌堆沒牌了！');
      return;
    }
    
    const newGameState = drawCard(gameState, currentPlayer.id);
    setGameState(newGameState);
    setMessage(`${currentPlayer.name} 抽了一張牌！輪到 ${newGameState.players[newGameState.currentPlayerIndex].name}`);
    
    // 檢查下一個玩家是否是AI
    const nextPlayer = newGameState.players[newGameState.currentPlayerIndex];
    if (nextPlayer && !nextPlayer.isHuman) {
      setIsAITurn(true);
      setTimeout(() => executeAITurn(), 1000);
    }
  };

  const resetGame = () => {
    const newGameState = initializeGameState(numPlayers);
    setGameState(newGameState);
    
    // 設置初始總分
    setTotalScore(newGameState.currentTotal);
    setMessage(`遊戲重新開始！當前總分: ${newGameState.currentTotal}，輪到 ${newGameState.players[newGameState.currentPlayerIndex].name}`);
    
    // 檢查是否是AI回合
    const currentPlayer = newGameState.players[newGameState.currentPlayerIndex];
    if (currentPlayer && !currentPlayer.isHuman) {
      setIsAITurn(true);
      setTimeout(() => executeAITurn(), 1000);
    }
  };

  const renderCard = (card: Card, onClick?: () => void, isSelected: boolean = false, hidden: boolean = false) => {
    if (hidden) {
      // 隱藏的牌（其他玩家的牌）
      return (
        <div
          className={`
            w-16 h-28 rounded-md border border-gray-300 flex items-center justify-center
            bg-gradient-to-br from-blue-500 to-blue-700 text-white
          `}
        >
          <div className="text-4xl">?</div>
        </div>
      );
    }

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
        <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
          <div className="text-lg font-semibold">
            總分: <span className="text-red-600 text-xl font-bold">{totalScore}</span>
          </div>
          <div className="text-lg">
            輪到: <span className="text-blue-600">{gameState.players[gameState.currentPlayerIndex]?.name}</span>
            {isAITurn && <span className="ml-2 text-orange-500">(AI思考中...)</span>}
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
                {player.name} {index === gameState.currentPlayerIndex && '(當前玩家)'} {!player.isHuman && '(AI)'}
              </h2>
              <div className="text-gray-600">手牌: {player.hand.length} 張</div>
            </div>
            
            {player.isHuman ? (
              // 人類玩家 - 顯示手牌和操作
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
              // AI 玩家 - 只顯示手牌數量和隱藏的牌
              <div className="flex flex-wrap gap-2 opacity-70">
                {Array.from({ length: player.hand.length }).map((_, idx) => (
                  <div key={idx}>
                    {renderCard(player.hand[idx] || { suit: 'hearts', rank: 'A', value: 1, id: `hidden-${idx}` }, undefined, false, true)}
                  </div>
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