import React from 'react';

const GameRules: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">遊戲規則</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">基本規則</h3>
          <ul className="list-disc pl-5 space-y-2 text-gray-600">
            <li>每位玩家開始時有5張牌</li>
            <li>只能出與中心牌相同花色或相同點數的牌</li>
            <li>第一個出完手中所有卡牌的玩家獲勝</li>
            <li>當玩家出牌後，若手牌少於5張則自動補牌</li>
          </ul>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">特殊牌規則</h3>
          <ul className="list-disc pl-5 space-y-2 text-gray-600">
            <li><strong>9 = 99</strong>：可以隨時打出，回到當前玩家（跳過下一位）</li>
            <li><strong>A = 1</strong>：最小點數</li>
            <li><strong>J = 11, Q = 12, K = 13</strong>：人頭牌</li>
          </ul>
        </div>
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">遊戲流程</h3>
        <ol className="list-decimal pl-5 space-y-2 text-gray-600">
          <li>系統隨機發給每位玩家5張牌</li>
          <li>翻開第一張中心牌</li>
          <li>按順序輪流出牌或抽牌</li>
          <li>直到有玩家出完所有手牌為止</li>
        </ol>
      </div>
    </div>
  );
};

export default GameRules;