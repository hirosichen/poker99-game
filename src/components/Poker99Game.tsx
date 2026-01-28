'use client';

import React, { useState, useEffect } from 'react';
import { initializeGameState, playCard, drawCard, canPlayCard } from '@/lib/poker99-utils';
import { Card, Player, GameState } from '@/types/poker99';

interface Poker99GameProps {
  numPlayers?: number;
}

const Poker99Game: React.FC<Poker99GameProps> = ({ numPlayers = 2 }) => {
  const [gameState, setGameState] = useState<GameState>(() => initializeGameState(numPlayers));
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('遊戲開始！');

  // 初始化遊戲
  useEffect(() => {
    setGameState(initializeGameState(numPlayers));
    setMessage('遊戲開始！輪到 ' + gameState.players[gameState.currentPlayerIndex]?.name);
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
    
    // 出牌
    const newGameState = playCard(gameState, currentPlayer.id, cardId);
    setGameState(newGameState);
    
    if (newGameState.centerCard) {
      setMessage(`${currentPlayer.name} 出了 ${newGameState.centerCard.suit}${newGameState.centerCard.rank}！輪到 ${newGameState.players[newGameState.currentPlayerIndex].name}`);
    }
    
    // 檢查是否有人贏了
    if (newGameState.winner) {
      const winner = newGameState.players.find(p => p.id === newGameState.winner);
      setMessage(`${winner?.name} 贏了！`);
    }
    
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
    setGameState(initializeGameState(numPlayers));
    setMessage('遊戲重新開始！');
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
    
    return (
      <div
        key={card.id}
        className={`
          w-16 h-24 rounded-md border border-gray-300 flex flex-col justify-between p-2 cursor-pointer
          ${isSelected ? 'ring-4 ring-blue-500 scale-105' : 'hover:scale-105 hover:shadow-md'}
          ${bgColor} ${textColor} transition-transform duration-200
        `}
        onClick={onClick}
      >
        <div className="text-left font-bold">{card.rank}</div>
        <div className="text-center text-xl">{suitSymbols[card.suit]}</div>
        <div className="text-right font-bold rotate-180">{card.rank}</div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">撲克牌99遊戲</h1>
      
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="text-lg font-semibold">
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
              <div className="w-16 h-24 border-2 border-dashed border-gray-400 rounded-md flex items-center justify-center">
                <span className="text-gray-500">空</span>
              </div>
            )}
          </div>
        </div>
        
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
                    說明：9 = 99 (回到當前玩家)，點擊牌出牌
                  </div>
                </div>
              </div>
            ) : (
              // 其他玩家 - 只顯示手牌數量
              <div className="flex flex-wrap gap-2 opacity-70">
                {player.hand.map((_, idx) => (
                  <div key={idx} className="w-16 h-24 bg-blue-100 border border-gray-300 rounded-md"></div>
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