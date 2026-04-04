import React, { useEffect, useRef, useCallback, useState } from 'react';

// 地形类型
// 0 = 草地（可行走）
// 1 = 地面/路（可行走）
// 2 = 墙壁（不可通行）
// 3 = 水（不可通行）

export type TerrainType = 0 | 1 | 2 | 3;

export interface Monster {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  name: string;
  emoji: string;
  // AI状态
  state: 'patrol' | 'chase' | 'attack';
  patrolDir: { dx: number; dy: number };
  patrolTimer: number;
  attackCooldown: number;
}

export interface Player {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  level: number;
  exp: number;
  attack: number;
  attackCooldown: number;
  invincible: number; // 无敌时间
}

export interface DamageNumber {
  id: number;
  x: number;
  y: number;
  value: number;
  isPlayer: boolean;
  timer: number;
}

interface GameMapProps {
  player: Player;
  monsters: Monster[];
  damages: DamageNumber[];
  onPlayerMove: (x: number, y: number) => void;
  onPlayerAttack: () => void;
  onPlayerSkill1: () => void;
  onPlayerSkill2: () => void;
  onPlayerDodge: () => void;
  onMonsterMove: (id: number, x: number, y: number) => void;
  onMonsterHit: (id: number, damage: number) => void;
  onMonsterDie: (id: number) => void;
  onPlayerHit: (damage: number) => void;
}

// 20x15 地图
// W=墙(2) .=地板(1) G=草地(0)
const DEMO_MAP: TerrainType[][] = [
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
  [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
  [2,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,2],
  [2,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,2],
  [2,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,2],
  [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
  [2,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,2],
  [2,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,2],
  [2,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,2],
  [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
  [2,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,2],
  [2,0,0,1,1,1,1,0,0,0,0,0,0,0,1,1,1,0,0,2],
  [2,0,0,1,1,1,1,0,0,0,0,0,0,0,1,1,1,0,0,2],
  [2,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,2],
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
];

const TILE_SIZE = 36;
const MAP_COLS = 20;
const MAP_ROWS = 15;

const TERRAIN_COLORS: Record<TerrainType, string> = {
  0: '#2d5a27', // 草地
  1: '#8b7355', // 地板
  2: '#4a4a4a', // 墙壁
  3: '#1e3a5f', // 水
};

// 初始怪物配置
export const INITIAL_MONSTERS: Omit<Monster, 'state' | 'patrolDir' | 'patrolTimer' | 'attackCooldown'>[] = [
  { id: 1, x: 7, y: 3, hp: 60, maxHp: 60, attack: 10, defense: 5, name: '史莱姆', emoji: '🟢' },
  { id: 2, x: 8, y: 4, hp: 60, maxHp: 60, attack: 10, defense: 5, name: '史莱姆', emoji: '🟢' },
  { id: 3, x: 13, y: 7, hp: 80, maxHp: 80, attack: 15, defense: 8, name: '哥布林', emoji: '👺' },
  { id: 4, x: 14, y: 8, hp: 80, maxHp: 80, attack: 15, defense: 8, name: '哥布林', emoji: '👺' },
  { id: 5, x: 14, y: 9, hp: 80, maxHp: 80, attack: 15, defense: 8, name: '哥布林', emoji: '👺' },
  { id: 6, x: 4, y: 11, hp: 100, maxHp: 100, attack: 20, defense: 12, name: '狼人', emoji: '🐺' },
];

export const GameMap: React.FC<GameMapProps> = ({
  player,
  monsters,
  damages,
  onPlayerMove,
  onPlayerAttack,
  onPlayerSkill1,
  onPlayerSkill2,
  onPlayerDodge,
  onMonsterMove,
  onMonsterHit,
  onMonsterDie,
  onPlayerHit,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysPressed = useRef<Set<string>>(new Set());
  const lastMoveTime = useRef<number>(0);
  const MOVE_COOLDOWN = 150;

  // 碰撞检测
  const canMoveTo = useCallback((x: number, y: number): boolean => {
    if (x < 0 || x >= MAP_COLS || y < 0 || y >= MAP_ROWS) return false;
    const terrain = DEMO_MAP[y][x];
    if (terrain === 2 || terrain === 3) return false;
    return true;
  }, []);

  // 键盘移动
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase());
      
      if (e.key === ' ' || e.key.toLowerCase() === 'j') {
        onPlayerAttack();
      }
      if (e.key.toLowerCase() === 'k') {
        onPlayerSkill1();
      }
      if (e.key.toLowerCase() === 'l') {
        onPlayerSkill2();
      }
      if (e.key.toLowerCase() === 'shift') {
        onPlayerDodge();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };

    const moveInterval = setInterval(() => {
      const keys = keysPressed.current;
      let dx = 0, dy = 0;
      
      if (keys.has('w') || keys.has('arrowup')) dy = -1;
      if (keys.has('s') || keys.has('arrowdown')) dy = 1;
      if (keys.has('a') || keys.has('arrowleft')) dx = -1;
      if (keys.has('d') || keys.has('arrowright')) dx = 1;
      
      if (dx !== 0 || dy !== 0) {
        const now = Date.now();
        if (now - lastMoveTime.current >= MOVE_COOLDOWN) {
          lastMoveTime.current = now;
          onPlayerMove(dx, dy);
        }
      }
    }, 50);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      clearInterval(moveInterval);
    };
  }, [onPlayerMove, onPlayerAttack, onPlayerSkill1, onPlayerSkill2, onPlayerDodge]);

  // Canvas渲染
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = MAP_COLS * TILE_SIZE;
    const height = MAP_ROWS * TILE_SIZE;
    canvas.width = width;
    canvas.height = height;

    // 清空
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    // 绘制地形
    for (let y = 0; y < MAP_ROWS; y++) {
      for (let x = 0; x < MAP_COLS; x++) {
        const terrain = DEMO_MAP[y][x];
        ctx.fillStyle = TERRAIN_COLORS[terrain];
        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        
        // 草地纹理
        if (terrain === 0) {
          ctx.fillStyle = '#3d7a37';
          for (let i = 0; i < 3; i++) {
            const ox = Math.random() * TILE_SIZE;
            const oy = Math.random() * TILE_SIZE;
            ctx.fillRect(x * TILE_SIZE + ox, y * TILE_SIZE + oy, 2, 4);
          }
        }
        
        // 墙壁纹理
        if (terrain === 2) {
          ctx.strokeStyle = '#3a3a3a';
          ctx.lineWidth = 1;
          ctx.strokeRect(x * TILE_SIZE + 1, y * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2);
        }
      }
    }

    // 绘制怪物
    monsters.forEach(monster => {
      if (monster.hp <= 0) return;
      
      const mx = monster.x * TILE_SIZE + TILE_SIZE / 2;
      const my = monster.y * TILE_SIZE + TILE_SIZE / 2;
      
      // 怪物身体
      ctx.fillStyle = monster.state === 'chase' ? '#ff4444' : '#cc3333';
      ctx.beginPath();
      ctx.arc(mx, my, TILE_SIZE / 2.5, 0, Math.PI * 2);
      ctx.fill();
      
      // 怪物emoji
      ctx.font = '20px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(monster.emoji, mx, my);
      
      // 怪物血条背景
      const hpBarWidth = TILE_SIZE - 4;
      const hpBarHeight = 4;
      const hpBarX = monster.x * TILE_SIZE + 2;
      const hpBarY = monster.y * TILE_SIZE - 6;
      
      ctx.fillStyle = '#333';
      ctx.fillRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);
      
      // 怪物血条
      const hpPercent = monster.hp / monster.maxHp;
      ctx.fillStyle = hpPercent > 0.5 ? '#4ade80' : hpPercent > 0.25 ? '#fbbf24' : '#ef4444';
      ctx.fillRect(hpBarX, hpBarY, hpBarWidth * hpPercent, hpBarHeight);
      
      // 攻击范围指示（追击中）
      if (monster.state === 'chase') {
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(mx, my, TILE_SIZE * 1.5, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    // 绘制玩家
    const px = player.x * TILE_SIZE + TILE_SIZE / 2;
    const py = player.y * TILE_SIZE + TILE_SIZE / 2;
    
    // 玩家闪烁（受伤时）
    if (player.invincible <= 0 || Math.floor(Date.now() / 100) % 2 === 0) {
      // 玩家身体
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(px, py, TILE_SIZE / 2.5, 0, Math.PI * 2);
      ctx.fill();
      
      // 玩家边框
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // 玩家是🔵
      ctx.font = '22px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🔵', px, py);
    }
    
    // 玩家血条
    const playerHpBarWidth = TILE_SIZE + 8;
    const playerHpBarHeight = 5;
    const playerHpBarX = player.x * TILE_SIZE - 4;
    const playerHpBarY = player.y * TILE_SIZE - 10;
    
    ctx.fillStyle = '#333';
    ctx.fillRect(playerHpBarX, playerHpBarY, playerHpBarWidth, playerHpBarHeight);
    
    const playerHpPercent = player.hp / player.maxHp;
    ctx.fillStyle = playerHpPercent > 0.5 ? '#4ade80' : playerHpPercent > 0.25 ? '#fbbf24' : '#ef4444';
    ctx.fillRect(playerHpBarX, playerHpBarY, playerHpBarWidth * playerHpPercent, playerHpBarHeight);

    // 绘制伤害数字
    damages.forEach(dmg => {
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const alpha = Math.max(0, 1 - dmg.timer / 30);
      ctx.fillStyle = dmg.isPlayer 
        ? `rgba(255, 100, 100, ${alpha})` 
        : `rgba(255, 255, 100, ${alpha})`;
      
      ctx.fillText(
        `-${dmg.value}`,
        dmg.x * TILE_SIZE + TILE_SIZE / 2,
        dmg.y * TILE_SIZE - 10 - (30 - dmg.timer)
      );
    });

  }, [player, monsters, damages]);

  // 触屏方向键移动
  const handleTouchMove = (dx: number, dy: number) => {
    const now = Date.now();
    if (now - lastMoveTime.current >= MOVE_COOLDOWN) {
      lastMoveTime.current = now;
      onPlayerMove(dx, dy);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* 游戏画布 */}
      <div className="border-4 border-yellow-600 rounded-lg overflow-hidden shadow-xl">
        <canvas ref={canvasRef} className="block" />
      </div>
      
      {/* 状态栏 */}
      <div className="bg-gray-900 rounded-xl px-6 py-3 text-white flex gap-8 items-center">
        <div className="flex items-center gap-2">
          <span className="text-red-400">❤️</span>
          <span className="font-bold">{player.hp}/{player.maxHp}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-blue-400">💧</span>
          <span className="font-bold">{player.mp}/{player.maxMp}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-yellow-400">⭐</span>
          <span>Lv.{player.level}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>👹</span>
          <span className="text-green-400">{monsters.filter(m => m.hp > 0).length}</span>
        </div>
      </div>
      
      {/* 操作区域 */}
      <div className="flex gap-4 items-end">
        {/* 方向键 - 左侧 */}
        <div className="grid grid-cols-3 gap-1">
          <div />
          <button
            onTouchStart={() => handleTouchMove(0, -1)}
            onClick={() => handleTouchMove(0, -1)}
            className="w-14 h-14 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-2xl active:bg-gray-500 transition-colors"
          >
            ⬆️
          </button>
          <div />
          <button
            onTouchStart={() => handleTouchMove(-1, 0)}
            onClick={() => handleTouchMove(-1, 0)}
            className="w-14 h-14 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-2xl active:bg-gray-500 transition-colors"
          >
            ⬅️
          </button>
          <div className="w-14 h-14 bg-gray-800 rounded-lg flex items-center justify-center text-gray-500">
            🧭
          </div>
          <button
            onTouchStart={() => handleTouchMove(1, 0)}
            onClick={() => handleTouchMove(1, 0)}
            className="w-14 h-14 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-2xl active:bg-gray-500 transition-colors"
          >
            ➡️
          </button>
          <div />
          <button
            onTouchStart={() => handleTouchMove(0, 1)}
            onClick={() => handleTouchMove(0, 1)}
            className="w-14 h-14 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-2xl active:bg-gray-500 transition-colors"
          >
            ⬇️
          </button>
          <div />
        </div>
        
        {/* 技能按钮 - 右侧 */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onPlayerDodge}
            className="px-4 py-3 bg-purple-700 hover:bg-purple-600 rounded-lg text-white font-bold active:bg-purple-500 transition-colors"
          >
            闪避
          </button>
          <button
            onClick={onPlayerAttack}
            className="px-6 py-4 bg-red-600 hover:bg-red-500 rounded-lg text-white font-bold text-xl active:bg-red-400 transition-colors shadow-lg"
          >
            ⚔️ 攻击
          </button>
          <button
            onClick={onPlayerSkill1}
            className="px-4 py-3 bg-orange-600 hover:bg-orange-500 rounded-lg text-white font-bold active:bg-orange-400 transition-colors"
          >
            🔥 火焰术
          </button>
          <button
            onClick={onPlayerSkill2}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-bold active:bg-blue-400 transition-colors"
          >
            ⚡ 雷电术
          </button>
        </div>
      </div>
      
      {/* 控制提示 */}
      <div className="text-gray-400 text-sm">
        WASD/方向键移动 | 空格/J攻击 | K火焰术 | L雷电术 | Shift闪避
      </div>
    </div>
  );
};

export default GameMap;
