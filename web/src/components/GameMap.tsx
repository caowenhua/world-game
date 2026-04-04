// 原有的GameMap组件 - 最小化恢复版
// 完整功能需要根据原始代码恢复

'use client';

import React from 'react';
import { Character } from '@/types';

interface GameMapProps {
  character: Character;
  onLogout: () => void;
}

export default function GameMap({ character, onLogout }: GameMapProps) {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold text-yellow-400 mb-4">
        🎮 羊蹄山之魂
      </h1>
      <p className="text-gray-300 mb-4">
        欢迎, {character.name}! (Lv.{character.level})
      </p>
      <p className="text-gray-500 mb-8">
        即时战斗RPG正在开发中...
      </p>
      <a 
        href="/rpg"
        className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg text-white font-bold mb-4"
      >
        🎮 进入即时战斗Demo
      </a>
      <button
        onClick={onLogout}
        className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white"
      >
        退出登录
      </button>
    </div>
  );
}
