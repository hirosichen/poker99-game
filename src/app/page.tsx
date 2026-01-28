'use client';

import React, { useState } from 'react';
import Poker99Game from '@/components/Poker99Game';

export default function Home() {
  const [numPlayers, setNumPlayers] = useState<number>(2);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">撲克牌99遊戲</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            一款有趣的卡牌遊戲，目標是第一個出完手中所有卡牌的玩家獲勝。
            遊戲規則：只能出與中心牌相同花色或相同點數的牌，9可以當作萬能牌隨時打出。
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-4xl mx-auto mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">遊戲設定</h2>
              <p className="text-gray-600">選擇玩家數量</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-gray-700">玩家數量:</label>
              <select
                value={numPlayers}
                onChange={(e) => setNumPlayers(parseInt(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[2, 3, 4].map(num => (
                  <option key={num} value={num}>{num} 人</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="text-sm text-gray-600 mb-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">遊戲規則：</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>每位玩家開始時有5張牌</li>
              <li>只能出與中心牌相同花色或相同點數的牌</li>
              <li>9是特殊牌，可以隨時打出（視為99，回到當前玩家）</li>
              <li>第一個出完手中所有卡牌的玩家獲勝</li>
              <li>當玩家出牌後，若手牌少於5張則自動補牌</li>
            </ul>
          </div>
        </div>
        
        <Poker99Game numPlayers={numPlayers} />
      </div>
    </main>
  );
}