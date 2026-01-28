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
            <li>目標是避免讓總分超過99點</li>
            <li>當玩家沒牌時，遊戲結束，該玩家獲勝</li>
            <li>當總分超過99點時，出最後一張牌的玩家爆掉</li>
          </ul>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">特殊牌規則</h3>
          <ul className="list-disc pl-5 space-y-2 text-gray-600">
            <li><strong>4 = 迴轉</strong>：改變出牌順序方向</li>
            <li><strong>5 = 指定</strong>：出牌者可指定下一個出牌的人</li>
            <li><strong>10 = ±10</strong>：可選擇加10或減10</li>
            <li><strong>J = 跳過</strong>：跳過下一位玩家</li>
            <li><strong>Q = ±20</strong>：可選擇加20或減20</li>
            <li><strong>K = 99</strong>：總分直接變成99</li>
            <li><strong>A = 1</strong>：最小點數</li>
            <li><strong>2-9 = 各自點數</strong></li>
          </ul>
        </div>
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">遊戲流程</h3>
        <ol className="list-decimal pl-5 space-y-2 text-gray-600">
          <li>系統隨機發給每位玩家5張牌</li>
          <li>翻開第一張中心牌（非特殊牌）</li>
          <li>按順序輪流出牌或抽牌</li>
          <li>根據出的牌調整總分</li>
          <li>當玩家沒牌或有人爆掉時遊戲結束</li>
        </ol>
      </div>
    </div>
  );
};

export default GameRules;