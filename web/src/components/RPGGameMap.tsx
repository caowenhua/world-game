import React, { useEffect, useRef, useCallback, useState } from 'react';
import { BatchCharacterRenderer, MONSTER_TEMPLATES } from './CharacterModel';
import { getCharacterDesign, CHARACTER_TEMPLATES, CharacterState } from './CharacterSprites';

// 地形类型
// 0 = 草地（可行走）
// 1 = 地面/路（可行走）
// 2 = 墙壁（不可通行）
// 3 = 水（不可通行）

export type TerrainType = 0 | 1 | 2 | 3;

// 角色模板类型映射
type MonsterTemplateType = 'slime' | 'goblin' | 'wolfman' | 'fire_spirit';

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
  templateId: string; // 角色模板ID：slime, goblin, wolfman, fire_spirit
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

// 改进的配色方案 - 更有质感的像素RPG风格
const TERRAIN_COLORS: Record<TerrainType, string> = {
  0: '#2d5a27', // 草地 - 深沉的森林绿
  1: '#8b7355', // 地板 - 温暖的土棕色
  2: '#4a4a5a', // 墙壁 - 石灰色
  3: '#1a4a6a', // 水 - 深沉的湖蓝
};

// 改进的地形细节色 - 4色系统增加层次感
const TERRAIN_DETAILS: Record<TerrainType, string[]> = {
  0: ['#3d7a37', '#1d4a17', '#5daa47', '#0d3a07'], // 草地4色：亮、中亮、中暗、极暗
  1: ['#a08365', '#6b5335', '#c0a385', '#4b3315'], // 地板4色
  2: ['#6a6a7a', '#4a4a5a', '#8a8a9a', '#3a3a4a'], // 墙壁4色：亮、中、极亮、暗
  3: ['#2a7ab2', '#1a4a72', '#4a9ad2', '#0a2a52'], // 水面4色
};

// 初始怪物配置 - 使用模板ID
export const INITIAL_MONSTERS: Omit<Monster, 'state' | 'patrolDir' | 'patrolTimer' | 'attackCooldown'>[] = [
  { id: 1, x: 7, y: 3, hp: 60, maxHp: 60, attack: 10, defense: 5, name: '史莱姆', emoji: '🟢', templateId: 'slime_green' },
  { id: 2, x: 8, y: 4, hp: 60, maxHp: 60, attack: 10, defense: 5, name: '史莱姆', emoji: '🟢', templateId: 'slime_green' },
  { id: 3, x: 13, y: 7, hp: 80, maxHp: 80, attack: 15, defense: 8, name: '哥布林', emoji: '👺', templateId: 'goblin' },
  { id: 4, x: 14, y: 8, hp: 80, maxHp: 80, attack: 15, defense: 8, name: '哥布林', emoji: '👺', templateId: 'goblin' },
  { id: 5, x: 14, y: 9, hp: 80, maxHp: 80, attack: 15, defense: 8, name: '哥布林', emoji: '👺', templateId: 'goblin' },
  { id: 6, x: 4, y: 11, hp: 100, maxHp: 100, attack: 20, defense: 12, name: '狼人', emoji: '🐺', templateId: 'werewolf' },
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

    // 绘制渐变背景 - 深夜星空，从深黑到深蓝，无紫色
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#050510');
    bgGradient.addColorStop(0.3, '#0a0a1f');
    bgGradient.addColorStop(0.6, '#0f1525');
    bgGradient.addColorStop(1, '#0a1520');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // 添加星空粒子效果 - 更丰富的星星
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (let i = 0; i < 50; i++) {
      const sx = (i * 37 + 7) % width;
      const sy = (i * 23 + 11) % height;
      const size = 0.3 + (i % 3) * 0.3;
      const alpha = 0.2 + (i % 5) * 0.1;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(sx, sy, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // 绘制地形
    for (let y = 0; y < MAP_ROWS; y++) {
      for (let x = 0; x < MAP_COLS; x++) {
        const terrain = DEMO_MAP[y][x];
        ctx.fillStyle = TERRAIN_COLORS[terrain];
        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        
        // 草地纹理 - 更丰富的细节
        if (terrain === 0) {
          const details = TERRAIN_DETAILS[0];
          for (let i = 0; i < 4; i++) {
            ctx.fillStyle = details[i % details.length];
            const ox = ((x * 7 + i * 13) % (TILE_SIZE - 4)) + 2;
            const oy = ((y * 11 + i * 17) % (TILE_SIZE - 4)) + 2;
            ctx.fillRect(x * TILE_SIZE + ox, y * TILE_SIZE + oy, 2, 3);
          }
        }
        
        // 墙壁纹理 - 石头质感
        if (terrain === 2) {
          const details = TERRAIN_DETAILS[2];
          // 顶部高光
          ctx.fillStyle = '#7a7a8a';
          ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, 3);
          // 左侧高光
          ctx.fillStyle = '#6a6a7a';
          ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, 3, TILE_SIZE);
          // 底部阴影
          ctx.fillStyle = '#3a3a4a';
          ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE + TILE_SIZE - 3, TILE_SIZE, 3);
          // 右侧阴影
          ctx.fillStyle = '#4a4a5a';
          ctx.fillRect(x * TILE_SIZE + TILE_SIZE - 3, y * TILE_SIZE, 3, TILE_SIZE);
        }
        
        // 水面波光效果
        if (terrain === 3) {
          const time = Date.now() / 1000;
          const waveOffset = Math.sin(time * 2 + x + y) * 2;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.fillRect(
            x * TILE_SIZE + 4 + waveOffset,
            y * TILE_SIZE + 4,
            8, 2
          );
          ctx.fillRect(
            x * TILE_SIZE + 18 - waveOffset,
            y * TILE_SIZE + 14,
            6, 2
          );
        }
      }
    }

    // 绘制怪物 - 使用新的角色设计系统
    monsters.forEach(monster => {
      if (monster.hp <= 0) return;
      
      const mx = monster.x * TILE_SIZE + TILE_SIZE / 2;
      const my = monster.y * TILE_SIZE + TILE_SIZE / 2;
      
      // 获取角色设计模板
      const design = getCharacterDesign(monster.templateId);
      
      // 怪物外发光效果 - 根据角色类型调整
      const glowColor = monster.state === 'chase' 
        ? (design.type === 'boss' ? 'rgba(255, 50, 50, 0.6)' : 'rgba(255, 80, 80, 0.5)')
        : (design.type === 'boss' ? 'rgba(200, 50, 50, 0.4)' : 'rgba(200, 100, 100, 0.3)');
      const gradient = ctx.createRadialGradient(mx, my, TILE_SIZE / 4, mx, my, TILE_SIZE / 1.5);
      gradient.addColorStop(0, glowColor);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(mx, my, TILE_SIZE / 1.5, 0, Math.PI * 2);
      ctx.fill();
      
      // idle动画 - 上下浮动
      const idleBounce = Math.sin(Date.now() / 400) * 2;
      const bodyY = my + (design.bodyShape === 'blob' ? idleBounce : 0);
      
      // 绘制角色身体 - 根据身体类型
      if (design.bodyShape === 'blob') {
        // 史莱姆/果冻类 - 滴溜溜的形状
        const blobScale = design.bodyShape === 'blob' ? 1 + Math.sin(Date.now() / 500) * 0.05 : 1;
        const rx = TILE_SIZE / 2.5 * blobScale;
        const ry = TILE_SIZE / 3 * blobScale;
        
        // 身体主体
        ctx.beginPath();
        ctx.ellipse(mx, bodyY, rx, ry * 0.9, 0, 0, Math.PI * 2);
        ctx.fillStyle = design.bodyColor;
        ctx.fill();
        
        // 身体高光
        const highlightGrad = ctx.createRadialGradient(mx - rx * 0.3, bodyY - ry * 0.3, 0, mx, bodyY, rx);
        highlightGrad.addColorStop(0, 'rgba(255,255,255,0.5)');
        highlightGrad.addColorStop(0.3, 'rgba(255,255,255,0.2)');
        highlightGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = highlightGrad;
        ctx.beginPath();
        ctx.ellipse(mx, bodyY, rx, ry * 0.9, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 眼睛
        const eyeY = bodyY - 2;
        const eyeSpacing = rx * 0.4;
        // 左眼
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.ellipse(mx - eyeSpacing, eyeY, 4, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        // 右眼
        ctx.beginPath();
        ctx.ellipse(mx + eyeSpacing, eyeY, 4, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        // 瞳孔
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(mx - eyeSpacing + 1, eyeY + 1, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(mx + eyeSpacing + 1, eyeY + 1, 2.5, 0, Math.PI * 2);
        ctx.fill();
        // 眼睛高光
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(mx - eyeSpacing - 1, eyeY - 2, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(mx + eyeSpacing - 1, eyeY - 2, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // 嘴巴
        if (design.hasMouth) {
          ctx.strokeStyle = design.bodyColorDark;
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.arc(mx, bodyY + ry * 0.3, rx * 0.3, 0.1 * Math.PI, 0.9 * Math.PI);
          ctx.stroke();
        }
        
        // 水滴效果（史莱姆）
        if (design.specialFeature === 'drip') {
          ctx.fillStyle = design.bodyColor;
          ctx.beginPath();
          ctx.ellipse(mx - rx * 0.8, bodyY + ry * 0.5, 3, 5, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // 火焰效果
        if (design.specialFeature === 'flame') {
          const flameOffset = Math.sin(Date.now() / 100) * 2;
          ctx.fillStyle = design.accentColor;
          ctx.beginPath();
          ctx.moveTo(mx - 8, bodyY - ry * 0.5);
          ctx.quadraticCurveTo(mx - 4, bodyY - ry - 10 + flameOffset, mx, bodyY - ry * 0.5);
          ctx.quadraticCurveTo(mx + 4, bodyY - ry - 8 + flameOffset, mx + 8, bodyY - ry * 0.5);
          ctx.fill();
        }
        
      } else if (design.bodyShape === 'oval') {
        // 哥布林/狼人类 - 椭圆形
        const rx = TILE_SIZE / 2.5;
        const ry = TILE_SIZE / 2.2;
        
        // 身体
        const bodyGrad = ctx.createRadialGradient(mx - 3, bodyY - 3, 0, mx, bodyY, rx);
        bodyGrad.addColorStop(0, design.bodyColor);
        bodyGrad.addColorStop(1, design.bodyColorDark);
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.ellipse(mx, bodyY, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 耳朵（哥布林）
        if (design.specialFeature === 'ears') {
          ctx.fillStyle = design.bodyColor;
          // 左耳
          ctx.beginPath();
          ctx.moveTo(mx - rx, bodyY - ry * 0.3);
          ctx.lineTo(mx - rx - 8, bodyY - ry - 8);
          ctx.lineTo(mx - rx + 5, bodyY - ry * 0.5);
          ctx.fill();
          // 右耳
          ctx.beginPath();
          ctx.moveTo(mx + rx, bodyY - ry * 0.3);
          ctx.lineTo(mx + rx + 8, bodyY - ry - 8);
          ctx.lineTo(mx + rx - 5, bodyY - ry * 0.5);
          ctx.fill();
        }
        
        // 尾巴（狼人）
        if (design.hasTail) {
          ctx.fillStyle = design.bodyColor;
          ctx.beginPath();
          ctx.moveTo(mx + rx * 0.7, bodyY + ry * 0.5);
          ctx.quadraticCurveTo(mx + rx + 12, bodyY + ry + 5, mx + rx + 8, bodyY);
          ctx.quadraticCurveTo(mx + rx + 10, bodyY - 5, mx + rx * 0.7, bodyY);
          ctx.fill();
        }
        
        // 眼睛
        const eyeY = bodyY - ry * 0.2;
        ctx.fillStyle = design.accentColor;
        ctx.beginPath();
        ctx.ellipse(mx - rx * 0.35, eyeY, 3, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(mx + rx * 0.35, eyeY, 3, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        // 瞳孔
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(mx - rx * 0.35 + 1, eyeY + 1, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(mx + rx * 0.35 + 1, eyeY + 1, 2, 0, Math.PI * 2);
        ctx.fill();
        // 高光
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(mx - rx * 0.35 - 1, eyeY - 1, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(mx + rx * 0.35 - 1, eyeY - 1, 1, 0, Math.PI * 2);
        ctx.fill();
        
        // 嘴巴
        if (design.hasMouth) {
          ctx.strokeStyle = design.bodyColorDark;
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.arc(mx, bodyY + ry * 0.3, rx * 0.25, 0.1 * Math.PI, 0.9 * Math.PI);
          ctx.stroke();
        }
        
      } else {
        // 默认圆形
        const bodyGradient = ctx.createRadialGradient(mx - 3, bodyY - 3, 0, mx, bodyY, TILE_SIZE / 2.5);
        bodyGradient.addColorStop(0, monster.state === 'chase' ? '#ff6666' : '#ee5555');
        bodyGradient.addColorStop(1, monster.state === 'chase' ? '#cc2222' : '#aa3333');
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.arc(mx, bodyY, TILE_SIZE / 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        // 怪物emoji
        ctx.font = '20px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(monster.emoji, mx, bodyY);
      }
      
      // 怪物血条背景
      const hpBarWidth = TILE_SIZE - 4;
      const hpBarHeight = 4;
      const hpBarX = monster.x * TILE_SIZE + 2;
      const hpBarY = monster.y * TILE_SIZE - 8;
      
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.roundRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight, 2);
      ctx.fill();
      
      // 怪物血条
      const hpPercent = monster.hp / monster.maxHp;
      const hpColor = hpPercent > 0.5 ? '#4ade80' : hpPercent > 0.25 ? '#fbbf24' : '#ef4444';
      ctx.fillStyle = hpColor;
      ctx.beginPath();
      ctx.roundRect(hpBarX, hpBarY, hpBarWidth * hpPercent, hpBarHeight, 2);
      ctx.fill();
      
      // 攻击范围指示（追击中）
      if (monster.state === 'chase') {
        const pulseScale = 1 + Math.sin(Date.now() / 200) * 0.1;
        ctx.strokeStyle = design.type === 'boss' ? 'rgba(255, 50, 50, 0.5)' : 'rgba(255, 100, 100, 0.4)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(mx, bodyY, TILE_SIZE * 1.5 * pulseScale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    // 绘制玩家 - 使用新的勇者设计
    const px = player.x * TILE_SIZE + TILE_SIZE / 2;
    const py = player.y * TILE_SIZE + TILE_SIZE / 2;
    
    // 玩家闪烁（受伤时）
    if (player.invincible <= 0 || Math.floor(Date.now() / 100) % 2 === 0) {
      // 玩家外发光 - 蓝色光晕
      const playerGlow = ctx.createRadialGradient(px, py, TILE_SIZE / 4, px, py, TILE_SIZE * 1.2);
      playerGlow.addColorStop(0, 'rgba(100, 180, 255, 0.6)');
      playerGlow.addColorStop(0.5, 'rgba(60, 130, 250, 0.3)');
      playerGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = playerGlow;
      ctx.beginPath();
      ctx.arc(px, py, TILE_SIZE * 1.2, 0, Math.PI * 2);
      ctx.fill();
      
      // idle动画 - 上下浮动
      const idleBounce = Math.sin(Date.now() / 400) * 2;
      const bodyY = py + idleBounce;
      
      // 玩家身体 - 圆形带渐变
      const bodyGrad = ctx.createRadialGradient(px - 3, bodyY - 3, 0, px, bodyY, TILE_SIZE / 2.5);
      bodyGrad.addColorStop(0, '#60a5fa');
      bodyGrad.addColorStop(1, '#2563eb');
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.arc(px, bodyY, TILE_SIZE / 2.5, 0, Math.PI * 2);
      ctx.fill();
      
      // 身体高光
      const highlightGrad = ctx.createRadialGradient(px - 5, bodyY - 5, 0, px, bodyY, TILE_SIZE / 2.5);
      highlightGrad.addColorStop(0, 'rgba(255,255,255,0.4)');
      highlightGrad.addColorStop(0.5, 'rgba(255,255,255,0.1)');
      highlightGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = highlightGrad;
      ctx.beginPath();
      ctx.arc(px, bodyY, TILE_SIZE / 2.5, 0, Math.PI * 2);
      ctx.fill();
      
      // 玩家边框 - 发光效果
      ctx.strokeStyle = '#93c5fd';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#3b82f6';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(px, bodyY, TILE_SIZE / 2.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
      
      // 眼睛
      const eyeY = bodyY - 2;
      const eyeSpacing = TILE_SIZE / 7;
      // 左眼
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.ellipse(px - eyeSpacing, eyeY, 3, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      // 右眼
      ctx.beginPath();
      ctx.ellipse(px + eyeSpacing, eyeY, 3, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      // 瞳孔
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(px - eyeSpacing + 1, eyeY + 1, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px + eyeSpacing + 1, eyeY + 1, 2, 0, Math.PI * 2);
      ctx.fill();
      // 眼睛高光
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(px - eyeSpacing - 1, eyeY - 1, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px + eyeSpacing - 1, eyeY - 1, 1, 0, Math.PI * 2);
      ctx.fill();
      
      // 王冠（勇者标记）
      ctx.fillStyle = '#ffd700';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.moveTo(px - 8, bodyY - TILE_SIZE / 2.5 + 2);
      ctx.lineTo(px - 6, bodyY - TILE_SIZE / 2.5 - 5);
      ctx.lineTo(px, bodyY - TILE_SIZE / 2.5);
      ctx.lineTo(px + 6, bodyY - TILE_SIZE / 2.5 - 5);
      ctx.lineTo(px + 8, bodyY - TILE_SIZE / 2.5 + 2);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // 王冠宝石
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(px, bodyY - TILE_SIZE / 2.5 - 2, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 玩家血条 - 带边框和圆角
    const playerHpBarWidth = TILE_SIZE + 8;
    const playerHpBarHeight = 6;
    const playerHpBarX = player.x * TILE_SIZE - 4;
    const playerHpBarY = player.y * TILE_SIZE - 12;
    
    // 血条背景
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.roundRect(playerHpBarX - 1, playerHpBarY - 1, playerHpBarWidth + 2, playerHpBarHeight + 2, 3);
    ctx.fill();
    
    // 血条
    const playerHpPercent = player.hp / player.maxHp;
    const hpGrad = ctx.createLinearGradient(playerHpBarX, 0, playerHpBarX + playerHpBarWidth, 0);
    hpGrad.addColorStop(0, playerHpPercent > 0.5 ? '#4ade80' : playerHpPercent > 0.25 ? '#fbbf24' : '#ef4444');
    hpGrad.addColorStop(1, playerHpPercent > 0.5 ? '#22c55e' : playerHpPercent > 0.25 ? '#f59e0b' : '#dc2626');
    ctx.fillStyle = hpGrad;
    ctx.beginPath();
    ctx.roundRect(playerHpBarX, playerHpBarY, playerHpBarWidth * playerHpPercent, playerHpBarHeight, 2);
    ctx.fill();

    // 绘制伤害数字 - 改进的视觉效果
    damages.forEach(dmg => {
      const alpha = Math.max(0, 1 - dmg.timer / 30);
      const scale = 1 + (30 - dmg.timer) / 60; // 数字向上飘时放大
      
      ctx.save();
      ctx.translate(dmg.x * TILE_SIZE + TILE_SIZE / 2, dmg.y * TILE_SIZE - 10 - (30 - dmg.timer));
      ctx.scale(scale, scale);
      
      // 文字阴影
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      if (dmg.isPlayer) {
        // 对玩家的伤害 - 红色
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 4;
        ctx.fillStyle = `rgba(255, 80, 80, ${alpha})`;
      } else {
        // 对敌人的伤害 - 金色
        ctx.shadowColor = '#ffaa00';
        ctx.shadowBlur = 4;
        ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
      }
      
      ctx.fillText(`-${dmg.value}`, 0, 0);
      ctx.restore();
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
      {/* 游戏画布 - 改进的边框效果 */}
      <div className="border-4 border-amber-600 rounded-lg overflow-hidden shadow-2xl" style={{ 
        boxShadow: '0 0 20px rgba(251, 191, 36, 0.3), inset 0 0 30px rgba(0, 0, 0, 0.5)',
        borderColor: '#d97706'
      }}>
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
