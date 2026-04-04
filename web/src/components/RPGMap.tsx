import React, { useEffect, useRef, useCallback } from 'react';

// Terrain types
// 0 = 草地（可行走，会遇敌）
// 1 = 地面/路（可行走，不遇敌）
// 2 = 墙壁/障碍
// 3 = 水（不可通行）
// 4 = 树木
// 5 = 门口（进入建筑）
// 6 = NPC站立点
// 7 = 出口/传送点

export type TerrainType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface Monster {
  name: string;
  emoji: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
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
}

// Demo map 30x20
// W=墙(2) G=草地(0) .=地板(1) T=地板(1) N=NPC(6)
const DEMO_MAP: TerrainType[][] = [
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
  [2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2],
  [2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2],
  [2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2],
  [2,2,0,0,0,0,0,0,0,0,0,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2],
  [2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2],
  [2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2],
  [2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2],
  [2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2],
  [2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2],
  [2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2],
  [2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2],
  [2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2],
  [2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2],
  [2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2],
  [2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2],
  [2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2],
  [2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2],
  [2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2],
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
];

const TILE_SIZE = 32; // 显示尺寸
const MAP_COLS = 30;
const MAP_ROWS = 20;

const TERRAIN_EMOJI: Record<TerrainType, string> = {
  0: '🌿', // 草地
  1: '⬜', // 地板/路
  2: '🧱', // 墙壁
  3: '🌊', // 水
  4: '🌲', // 树木
  5: '🚪', // 门口
  6: '👤', // NPC
  7: '✨', // 出口
};

const ENCOUNTER_RATE = 0.15; // 15%遇敌概率

const RANDOM_MONSTERS: Monster[] = [
  { name: '小火龙', emoji: '🔴', hp: 80, maxHp: 80, attack: 15, defense: 10 },
  { name: '杰尼龟', emoji: '🐢', hp: 70, maxHp: 70, attack: 12, defense: 15 },
  { name: '妙蛙种子', emoji: '🐸', hp: 75, maxHp: 75, attack: 13, defense: 12 },
  { name: '波加曼', emoji: '🐧', hp: 65, maxHp: 65, attack: 14, defense: 11 },
  { name: '火稚鸡', emoji: '🐤', hp: 70, maxHp: 70, attack: 11, defense: 13 },
  { name: '木木枭', emoji: '🦉', hp: 72, maxHp: 72, attack: 14, defense: 10 },
];

interface RPGMapProps {
  player: Player;
  onPlayerMove: (newX: number, newY: number) => void;
  onEncounter: (monster: Monster) => void;
  onNPCInteract?: () => void;
}

export const RPGMap: React.FC<RPGMapProps> = ({
  player,
  onPlayerMove,
  onEncounter,
  onNPCInteract,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysPressed = useRef<Set<string>>(new Set());
  const lastMoveTime = useRef<number>(0);
  const MOVE_COOLDOWN = 200; // 200ms移动间隔

  // 碰撞检测
  const canMoveTo = useCallback((x: number, y: number): boolean => {
    if (x < 0 || x >= MAP_COLS || y < 0 || y >= MAP_ROWS) return false;
    const terrain = DEMO_MAP[y][x];
    // 不可通行: 墙壁(2)、水(3)、树木(4)
    if (terrain === 2 || terrain === 3 || terrain === 4) return false;
    return true;
  }, []);

  // 处理移动
  const tryMove = useCallback((dx: number, dy: number) => {
    const now = Date.now();
    if (now - lastMoveTime.current < MOVE_COOLDOWN) return;
    
    const newX = player.x + dx;
    const newY = player.y + dy;
    
    if (canMoveTo(newX, newY)) {
      lastMoveTime.current = now;
      onPlayerMove(newX, newY);
      
      // 检查遇敌（草地上15%概率）
      const terrain = DEMO_MAP[newY][newX];
      if (terrain === 0 && Math.random() < ENCOUNTER_RATE) {
        const monster = RANDOM_MONSTERS[Math.floor(Math.random() * RANDOM_MONSTERS.length)];
        onEncounter({ ...monster });
      }
      
      // 检查NPC交互
      if (terrain === 6 && onNPCInteract) {
        onNPCInteract();
      }
    }
  }, [player.x, player.y, canMoveTo, onPlayerMove, onEncounter, onNPCInteract]);

  // 键盘事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase());
      
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          tryMove(0, -1);
          break;
        case 's':
        case 'arrowdown':
          tryMove(0, 1);
          break;
        case 'a':
        case 'arrowleft':
          tryMove(-1, 0);
          break;
        case 'd':
        case 'arrowright':
          tryMove(1, 0);
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [tryMove]);

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

    // 清空画布
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    // 绘制地形
    ctx.font = '24px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    for (let y = 0; y < MAP_ROWS; y++) {
      for (let x = 0; x < MAP_COLS; x++) {
        const terrain = DEMO_MAP[y][x];
        const emoji = TERRAIN_EMOJI[terrain];
        
        // 根据地形设置背景色
        let bgColor = '#1a1a2e';
        switch (terrain) {
          case 0: bgColor = '#2d5a27'; break; // 草地 - 深绿
          case 1: bgColor = '#8b7355'; break; // 地板 - 棕色
          case 2: bgColor = '#4a4a4a'; break; // 墙壁 - 灰色
          case 3: bgColor = '#1e3a5f'; break; // 水 - 深蓝
          case 4: bgColor = '#1a4726'; break; // 树木 - 墨绿
          case 5: bgColor = '#5a4a3a'; break; // 门口 - 深棕
          case 6: bgColor = '#8b7355'; break; // NPC点 - 棕色
          case 7: bgColor = '#9b59b6'; break; // 出口 - 紫色
        }
        
        ctx.fillStyle = bgColor;
        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        
        // 绘制emoji
        ctx.fillText(
          emoji,
          x * TILE_SIZE + TILE_SIZE / 2,
          y * TILE_SIZE + TILE_SIZE / 2
        );
      }
    }

    // 绘制玩家（红色方块）
    const playerX = player.x * TILE_SIZE + TILE_SIZE / 2;
    const playerY = player.y * TILE_SIZE + TILE_SIZE / 2;
    
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(playerX, playerY, TILE_SIZE / 3, 0, Math.PI * 2);
    ctx.fill();
    
    // 玩家边框
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

  }, [player.x, player.y]);

  // 触屏方向按钮
  const handleTouchMove = (dx: number, dy: number) => {
    tryMove(dx, dy);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 游戏画布 */}
      <div className="border-4 border-yellow-500 rounded-lg overflow-hidden shadow-lg">
        <canvas
          ref={canvasRef}
          className="block"
        />
      </div>
      
      {/* 状态栏 */}
      <div className="bg-gray-800 rounded-lg px-4 py-2 text-white flex gap-6">
        <div className="flex items-center gap-2">
          <span>❤️ HP:</span>
          <span className="font-bold text-red-400">{player.hp}/{player.maxHp}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>💧 MP:</span>
          <span className="font-bold text-blue-400">{player.mp}/{player.maxMp}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>⭐ Lv.{player.level}</span>
        </div>
      </div>
      
      {/* 触屏方向按钮 */}
      <div className="grid grid-cols-3 gap-1 md:hidden">
        <div />
        <button
          onTouchStart={() => handleTouchMove(0, -1)}
          onClick={() => handleTouchMove(0, -1)}
          className="w-14 h-14 bg-gray-700 rounded-lg text-white text-2xl active:bg-gray-600"
        >
          ⬆️
        </button>
        <div />
        <button
          onTouchStart={() => handleTouchMove(-1, 0)}
          onClick={() => handleTouchMove(-1, 0)}
          className="w-14 h-14 bg-gray-700 rounded-lg text-white text-2xl active:bg-gray-600"
        >
          ⬅️
        </button>
        <button
          onTouchStart={() => handleTouchMove(0, 0)}
          className="w-14 h-14 bg-gray-600 rounded-lg text-white text-xl"
        >
          🧭
        </button>
        <button
          onTouchStart={() => handleTouchMove(1, 0)}
          onClick={() => handleTouchMove(1, 0)}
          className="w-14 h-14 bg-gray-700 rounded-lg text-white text-2xl active:bg-gray-600"
        >
          ➡️
        </button>
        <div />
        <button
          onTouchStart={() => handleTouchMove(0, 1)}
          onClick={() => handleTouchMove(0, 1)}
          className="w-14 h-14 bg-gray-700 rounded-lg text-white text-2xl active:bg-gray-600"
        >
          ⬇️
        </button>
        <div />
      </div>
      
      {/* 控制提示 */}
      <div className="text-gray-400 text-sm hidden md:block">
        按 WASD 或 方向键 移动 | 在草地上可能遇到野生宝可梦！
      </div>
    </div>
  );
};

export default RPGMap;
