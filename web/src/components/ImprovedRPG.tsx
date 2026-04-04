'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

// 地图配色 - 参考经典像素RPG
const MAP_THEME = {
  sky: '#1a0533',
  grass: '#228b22',
  grassDark: '#1a6b1a',
  path: '#c4a574',
  pathDark: '#a08050',
  water: '#4169e1',
  waterLight: '#6495ed',
  wall: '#5a5a6a',
  wallTop: '#7a7a8a',
  tree: '#0d4d0d',
  treeTop: '#228b22',
  building: '#8b4513',
  buildingRoof: '#a0522d',
  safeZone: '#daa520',
};

// 地形类型
const TERRAIN = {
  GRASS: 0,
  PATH: 1,
  WALL: 2,
  WATER: 3,
  TREE: 4,
  BUILDING: 5,
};

// 剧情对话
const STORY = [
  { speaker: '旁白', title: '', content: '西境王国边境，羊蹄山脚下。\n一个流浪剑客踏上这片神秘的土地...' },
  { speaker: '神秘声音', title: '???', content: '觉醒者...你终于来了。\n羊蹄山之魂在呼唤你。' },
  { speaker: '哨兵队长', title: '边境哨站', content: '站住！你是新来的冒险者？\n最近城外不太平，小心怪物。' },
  { speaker: '哨兵队长', title: '边境哨站', content: '在镇子里是安全的。\n去草地打怪练级吧，记住先在小怪身上练习！' },
  { speaker: '发牌员', title: '酒馆门口', content: '嘿，冒险者！想来一把卡牌游戏吗？\n靠近我就可以开始游戏！' },
];

export default function ImprovedRPG() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'story' | 'playing' | 'gameover' | 'victory'>('story');
  const [storyIdx, setStoryIdx] = useState(0);
  const [showText, setShowText] = useState('');
  const [typingDone, setTypingDone] = useState(false);
  const [showCardGame, setShowCardGame] = useState(false);

  // 玩家
  const [player, setPlayer] = useState({
    x: 50, y: 50, hp: 100, maxHp: 100, mp: 50, maxMp: 50,
    level: 1, exp: 0, atk: 25, cooldown: 0, facing: 'down' as 'up' | 'down' | 'left' | 'right',
    isAttacking: false
  });

  // 摄像机
  const [camera, setCamera] = useState({ x: 40, y: 40 });

  // 动画时间
  const [animTime, setAnimTime] = useState(0);

  // 怪物
  const [monsters, setMonsters] = useState<Array<{
    id: number; x: number; y: number; hp: number; maxHp: number; name: string;
    atk: number; color: string; state: 'patrol' | 'chase' | 'attack' | 'dead'; dir: number; cd: number;
    type: 'slime' | 'wolf' | 'goblin';
  }>>([
    { id: 1, x: 58, y: 42, hp: 40, maxHp: 40, name: '史莱姆', atk: 8, color: '#7bed9f', state: 'patrol', dir: 1, cd: 0, type: 'slime' },
    { id: 2, x: 62, y: 48, hp: 50, maxHp: 50, name: '灰狼', atk: 12, color: '#6b7280', state: 'patrol', dir: -1, cd: 0, type: 'wolf' },
    { id: 3, x: 42, y: 40, hp: 35, maxHp: 35, name: '哥布林', atk: 10, color: '#22c55e', state: 'patrol', dir: 1, cd: 0, type: 'goblin' },
    { id: 4, x: 60, y: 38, hp: 45, maxHp: 45, name: '史莱姆', atk: 8, color: '#7bed9f', state: 'patrol', dir: 1, cd: 0, type: 'slime' },
    { id: 5, x: 38, y: 52, hp: 55, maxHp: 55, name: '哥布林', atk: 10, color: '#22c55e', state: 'patrol', dir: -1, cd: 0, type: 'goblin' },
  ]);

  // 发牌员NPC
  const [cardDealer] = useState({ x: 48, y: 48, name: '发牌员' });

  // 伤害飘字
  const [damages, setDamages] = useState<{ id: number; x: number; y: number; v: number; p: boolean; t: number }[]>([]);
  const didRef = useRef(0);

  // 地图 (100x100)
  const mapData = useRef<number[][]>(createMap());

  function createMap(): number[][] {
    const m: number[][] = [];
    for (let y = 0; y < 100; y++) {
      const row: number[] = [];
      for (let x = 0; x < 100; x++) {
        if (x === 0 || y === 0 || x === 99 || y === 99) row.push(TERRAIN.WALL);
        else if (x >= 45 && x <= 55 && y >= 45 && y <= 55) row.push(TERRAIN.PATH);
        else if (x >= 47 && x <= 53 && y >= 47 && y <= 53 && (x === 47 || x === 53 || y === 47 || y === 53)) row.push(TERRAIN.BUILDING);
        else if (y >= 30 && y <= 32) row.push(TERRAIN.WATER);
        else if (x >= 20 && x <= 35 && y >= 20 && y <= 35) {
          const r = Math.random();
          row.push(r < 0.6 ? TERRAIN.GRASS : r < 0.85 ? TERRAIN.TREE : TERRAIN.WALL);
        } else {
          const r = Math.random();
          row.push(r < 0.7 ? TERRAIN.GRASS : r < 0.85 ? TERRAIN.TREE : TERRAIN.WALL);
        }
      }
      m.push(row);
    }
    return m;
  }

  const keysRef = useRef<Set<string>>(new Set());
  const lastRef = useRef(0);

  // 打字效果
  useEffect(() => {
    if (gameState !== 'story') return;
    const txt = STORY[storyIdx].content;
    let i = 0;
    setShowText('');
    setTypingDone(false);
    const t = setInterval(() => {
      if (i < txt.length) {
        setShowText(txt.slice(0, ++i));
      } else {
        setTypingDone(true);
        clearInterval(t);
      }
    }, 40);
    return () => clearInterval(t);
  }, [storyIdx, gameState]);

  // 键盘
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      if (e.key === 'j') attack();
      if (e.key === 'k') skill1();
      if (e.key === ' ') dodge();
      if (e.key === 'e' && checkCardDealer()) setShowCardGame(true);
    };
    const onUp = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, [player]);

  const addDmg = useCallback((x: number, y: number, v: number, p: boolean) => {
    setDamages(d => [...d, { id: didRef.current++, x, y, v, p, t: 50 }]);
  }, []);

  const attack = useCallback(() => {
    if (player.cooldown > 0) return;
    setPlayer(p => ({ ...p, cooldown: 25, isAttacking: true }));
    setTimeout(() => setPlayer(p => ({ ...p, isAttacking: false })), 300);
    setMonsters(mons => mons.map(m => {
      if (m.state === 'dead') return m;
      const dx = Math.abs(m.x - player.x), dy = Math.abs(m.y - player.y);
      if (dx <= 1.5 && dy <= 1.5) {
        const nh = m.hp - player.atk;
        addDmg(m.x, m.y, player.atk, false);
        return { ...m, hp: nh, state: nh <= 0 ? 'dead' : m.state };
      }
      return m;
    }));
  }, [player, addDmg]);

  const skill1 = useCallback(() => {
    if (player.mp < 20 || player.cooldown > 0) return;
    setPlayer(p => ({ ...p, mp: p.mp - 20, cooldown: 40 }));
    setMonsters(mons => mons.map(m => {
      if (m.state === 'dead') return m;
      const dx = Math.abs(m.x - player.x), dy = Math.abs(m.y - player.y);
      if (dx <= 3 && dy <= 3) {
        const nh = m.hp - 40;
        addDmg(m.x, m.y, 40, false);
        return { ...m, hp: nh, state: nh <= 0 ? 'dead' : m.state };
      }
      return m;
    }));
  }, [player, addDmg]);

  const dodge = useCallback(() => {
    if (player.cooldown > 0) return;
    const dirs = player.facing === 'up' ? [0, -2] : player.facing === 'down' ? [0, 2] : player.facing === 'left' ? [-2, 0] : [2, 0];
    let nx = player.x + dirs[0], ny = player.y + dirs[1];
    nx = Math.max(1, Math.min(98, nx));
    ny = Math.max(1, Math.min(98, ny));
    const tile = mapData.current[ny][nx];
    if (tile !== TERRAIN.WALL && tile !== TERRAIN.WATER && tile !== TERRAIN.BUILDING) {
      setPlayer(p => ({ ...p, x: nx, y: ny, cooldown: 30 }));
    }
  }, [player]);

  const checkCardDealer = useCallback(() => {
    const dx = Math.abs(player.x - cardDealer.x);
    const dy = Math.abs(player.y - cardDealer.y);
    return dx <= 1.5 && dy <= 1.5;
  }, [player.x, player.y, cardDealer]);

  // 游戏循环
  useEffect(() => {
    if (gameState !== 'playing') return;
    let raf: number;
    let animRaf: number;
    const loop = (time: number) => {
      if (!lastRef.current) lastRef.current = time;
      const dt = time - lastRef.current;
      if (dt >= 100) {
        lastRef.current = time;
        let dx = 0, dy = 0;
        if (keysRef.current.has('w') || keysRef.current.has('arrowup')) { dy = -1; setPlayer(p => ({ ...p, facing: 'up' })); }
        if (keysRef.current.has('s') || keysRef.current.has('arrowdown')) { dy = 1; setPlayer(p => ({ ...p, facing: 'down' })); }
        if (keysRef.current.has('a') || keysRef.current.has('arrowleft')) { dx = -1; setPlayer(p => ({ ...p, facing: 'left' })); }
        if (keysRef.current.has('d') || keysRef.current.has('arrowright')) { dx = 1; setPlayer(p => ({ ...p, facing: 'right' })); }
        if (dx || dy) {
          setPlayer(p => {
            let nx = p.x + dx, ny = p.y + dy;
            nx = Math.max(1, Math.min(98, nx));
            ny = Math.max(1, Math.min(98, ny));
            const tile = mapData.current[ny][nx];
            if (tile === TERRAIN.WALL || tile === TERRAIN.WATER || tile === TERRAIN.BUILDING) return p;
            return { ...p, x: nx, y: ny };
          });
        }
        setPlayer(p => ({ ...p, cooldown: Math.max(0, p.cooldown - 1) }));
        setCamera(c => ({
          x: Math.max(0, Math.min(80, player.x - 10)),
          y: Math.max(0, Math.min(85, player.y - 7))
        }));
        setMonsters(mons => mons.map(m => {
          if (m.state === 'dead') return m;
          const pdx = player.x - m.x, pdy = player.y - m.y;
          const dist = Math.sqrt(pdx * pdx + pdy * pdy);
          let nx = m.x, ny = m.y, ns = m.state, ncd = Math.max(0, m.cd - 1);
          if (dist < 6) { ns = 'chase'; }
          else if (dist > 10) { ns = 'patrol'; }
          if (ns === 'chase') {
            const targetX = Math.floor(m.x + pdx / dist * 0.5);
            const targetY = Math.floor(m.y + pdy / dist * 0.5);
            if (mapData.current[targetY] && mapData.current[targetY][targetX] !== TERRAIN.WALL && mapData.current[targetY][targetX] !== TERRAIN.WATER && mapData.current[targetY][targetX] !== TERRAIN.BUILDING) {
              nx = m.x + pdx / dist * 0.4;
              ny = m.y + pdy / dist * 0.4;
            }
          }
          if (ns === 'patrol') {
            nx = m.x + m.dir * 0.3;
            if (mapData.current[Math.floor(m.y)] && mapData.current[Math.floor(m.y)][Math.floor(nx)] === TERRAIN.WALL) { nx = m.x; }
          }
          if (dist < 1.2 && ncd <= 0) {
            addDmg(player.x, player.y, m.atk, true);
            setPlayer(p => ({ ...p, hp: Math.max(0, p.hp - m.atk) }));
            ncd = 50;
          }
          return { ...m, x: nx, y: ny, state: ns, cd: ncd };
        }));
        setDamages(d => d.filter(x => { x.t--; x.y -= 0.3; return x.t > 0; }));
        if (player.hp <= 0) setGameState('gameover');
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const animLoop = (time: number) => {
      setAnimTime(time);
      animRaf = requestAnimationFrame(animLoop);
    };
    animRaf = requestAnimationFrame(animLoop);
    return () => { cancelAnimationFrame(raf); cancelAnimationFrame(animRaf); };
  }, [gameState, player.x, player.y, player.hp, addDmg]);

  // 绘制地形
  const drawTile = (ctx: CanvasRenderingContext2D, terrain: number, screenX: number, screenY: number, time: number) => {
    const TS = 32;
    switch(terrain) {
      case TERRAIN.GRASS: {
        ctx.fillStyle = MAP_THEME.grass;
        ctx.fillRect(screenX, screenY, TS, TS);
        ctx.fillStyle = MAP_THEME.grassDark;
        for (let i = 0; i < 5; i++) {
          const gx = screenX + ((i * 7 + 3) % 28) + 2;
          const gy = screenY + ((i * 11 + 5) % 28) + 2;
          const sway = Math.sin(time / 500 + i + screenX) * 1;
          ctx.fillRect(gx + sway, gy, 2, 4);
        }
        break;
      }
      case TERRAIN.PATH: {
        ctx.fillStyle = MAP_THEME.path;
        ctx.fillRect(screenX, screenY, TS, TS);
        ctx.strokeStyle = MAP_THEME.pathDark;
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX + 2, screenY + 2, TS - 4, TS - 4);
        ctx.fillStyle = MAP_THEME.pathDark;
        ctx.fillRect(screenX + 6, screenY + 6, 3, 3);
        ctx.fillRect(screenX + 18, screenY + 12, 4, 3);
        ctx.fillRect(screenX + 10, screenY + 22, 3, 3);
        break;
      }
      case TERRAIN.WALL: {
        ctx.fillStyle = MAP_THEME.wall;
        ctx.fillRect(screenX, screenY, TS, TS);
        ctx.fillStyle = MAP_THEME.wallTop;
        ctx.fillRect(screenX + 2, screenY + 2, 12, 8);
        ctx.fillRect(screenX + 18, screenY + 2, 12, 8);
        ctx.fillRect(screenX + 8, screenY + 14, 12, 8);
        ctx.fillRect(screenX + 2, screenY + 14, 12, 8);
        ctx.fillStyle = '#4a4a5a';
        ctx.fillRect(screenX + 14, screenY + 2, 4, 8);
        ctx.fillRect(screenX + 2, screenY + 12, 6, 2);
        ctx.fillRect(screenX + 24, screenY + 12, 6, 2);
        break;
      }
      case TERRAIN.WATER: {
        ctx.fillStyle = MAP_THEME.water;
        ctx.fillRect(screenX, screenY, TS, TS);
        ctx.fillStyle = MAP_THEME.waterLight;
        const waveOffset = Math.sin(time / 300 + screenX / 20) * 2;
        ctx.fillRect(screenX + 4 + waveOffset, screenY + 8, 16, 2);
        ctx.fillRect(screenX + 8 - waveOffset, screenY + 20, 20, 2);
        ctx.fillRect(screenX + 12 + waveOffset, screenY + 14, 12, 2);
        break;
      }
      case TERRAIN.TREE: {
        ctx.fillStyle = MAP_THEME.grass;
        ctx.fillRect(screenX, screenY, TS, TS);
        ctx.fillStyle = MAP_THEME.tree;
        ctx.fillRect(screenX + 12, screenY + 16, 8, 16);
        ctx.fillStyle = MAP_THEME.treeTop;
        ctx.beginPath();
        ctx.arc(screenX + 16, screenY + 12, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2d9f2d';
        ctx.beginPath();
        ctx.arc(screenX + 12, screenY + 8, 8, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case TERRAIN.BUILDING: {
        ctx.fillStyle = MAP_THEME.path;
        ctx.fillRect(screenX, screenY, TS, TS);
        ctx.fillStyle = MAP_THEME.building;
        ctx.fillRect(screenX + 4, screenY + 8, 24, 24);
        ctx.fillStyle = MAP_THEME.buildingRoof;
        ctx.beginPath();
        ctx.moveTo(screenX + 2, screenY + 10);
        ctx.lineTo(screenX + 16, screenY);
        ctx.lineTo(screenX + 30, screenY + 10);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#5c3317';
        ctx.fillRect(screenX + 12, screenY + 18, 8, 14);
        break;
      }
    }
  };

  // 绘制玩家
  const drawPlayer = (ctx: CanvasRenderingContext2D, x: number, y: number, facing: string, isAttacking: boolean) => {
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(x - 8, y - 12, 16, 20);
    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(x - 6, y - 8, 4, 12);
    ctx.fillRect(x + 2, y - 8, 4, 12);
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(x, y - 16, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1f2937';
    ctx.beginPath();
    ctx.arc(x, y - 20, 7, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.fillRect(x - 4, y - 18, 2, 2);
    ctx.fillRect(x + 2, y - 18, 2, 2);
    ctx.fillStyle = '#fff';
    ctx.fillRect(x - 4, y - 18, 1, 1);
    ctx.fillRect(x + 2, y - 18, 1, 1);
    if (facing === 'right' || facing === 'down' || isAttacking) {
      ctx.fillStyle = '#9ca3af';
      ctx.fillRect(x + 10, y - 8, 4, 20);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(x + 8, y + 8, 8, 3);
      if (isAttacking) {
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 28, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (facing === 'left') {
      ctx.fillStyle = '#9ca3af';
      ctx.fillRect(x - 14, y - 8, 4, 20);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(x - 16, y + 8, 8, 3);
    } else if (facing === 'up') {
      ctx.fillStyle = '#9ca3af';
      ctx.fillRect(x - 2, y - 28, 4, 16);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(x - 4, y - 16, 8, 3);
    }
  };

  // 绘制怪物
  const drawMonster = (ctx: CanvasRenderingContext2D, m: typeof monsters[0], time: number) => {
    const bounce = Math.sin(time / 200 + m.id) * 2;
    if (m.type === 'slime') {
      ctx.fillStyle = '#7bed9f';
      ctx.beginPath();
      ctx.ellipse(m.x, m.y + bounce, 14, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#a8f0c4';
      ctx.beginPath();
      ctx.ellipse(m.x - 4, m.y - 4 + bounce, 4, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(m.x - 5, m.y - 2 + bounce, 4, 0, Math.PI * 2);
      ctx.arc(m.x + 5, m.y - 2 + bounce, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(m.x - 5, m.y - 1 + bounce, 2, 0, Math.PI * 2);
      ctx.arc(m.x + 5, m.y - 1 + bounce, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (m.type === 'wolf') {
      ctx.fillStyle = '#6b7280';
      ctx.fillRect(m.x - 14, m.y - 8 + bounce, 28, 14);
      ctx.beginPath();
      ctx.moveTo(m.x - 14, m.y - 8 + bounce);
      ctx.lineTo(m.x - 24, m.y - 14 + bounce);
      ctx.lineTo(m.x - 14, m.y - 2 + bounce);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#4b5563';
      ctx.fillRect(m.x - 10, m.y + 6, 4, 8);
      ctx.fillRect(m.x + 6, m.y + 6, 4, 8);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(m.x - 18, m.y - 10 + bounce, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (m.type === 'goblin') {
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(m.x - 8, m.y - 14 + bounce, 16, 18);
      ctx.beginPath();
      ctx.arc(m.x, m.y - 20 + bounce, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(m.x - 9, m.y - 22 + bounce);
      ctx.lineTo(m.x - 16, m.y - 28 + bounce);
      ctx.lineTo(m.x - 7, m.y - 20 + bounce);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(m.x + 9, m.y - 22 + bounce);
      ctx.lineTo(m.x + 16, m.y - 28 + bounce);
      ctx.lineTo(m.x + 7, m.y - 20 + bounce);
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(m.x - 4, m.y - 22 + bounce, 3, 0, Math.PI * 2);
      ctx.arc(m.x + 4, m.y - 22 + bounce, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(m.x - 4, m.y - 21 + bounce, 1.5, 0, Math.PI * 2);
      ctx.arc(m.x + 4, m.y - 21 + bounce, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // 绘制发牌员NPC
  const drawCardDealer = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number) => {
    const glow = Math.sin(time / 300) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(218, 165, 32, ${glow * 0.3})`;
    ctx.beginPath();
    ctx.arc(x, y, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7c3aed';
    ctx.fillRect(x - 10, y - 16, 20, 24);
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(x, y - 22, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5b21b6';
    ctx.beginPath();
    ctx.moveTo(x - 12, y - 26);
    ctx.lineTo(x, y - 42);
    ctx.lineTo(x + 12, y - 26);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fbbf24';
    ctx.font = '16px sans-serif';
    ctx.fillText('🃏', x - 8, y + 2);
    ctx.fillText('🎴', x + 2, y + 2);
  };

  // 渲染
  useEffect(() => {
    if (gameState !== 'playing' || !canvasRef.current) return;
    const cvs = canvasRef.current;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;
    const W = cvs.width, H = cvs.height;
    const TS = 32;
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, '#1a0533');
    gradient.addColorStop(0.5, '#2d1b4e');
    gradient.addColorStop(1, '#1a0533');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);
    const ox = -camera.x * TS, oy = -camera.y * TS;
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 25; x++) {
        const mx = Math.floor(camera.x) + x, my = Math.floor(camera.y) + y;
        if (mx < 0 || my < 0 || mx >= 100 || my >= 100) continue;
        const t = mapData.current[my][mx];
        drawTile(ctx, t, x * TS + ox, y * TS + oy, animTime);
      }
    }
    const inSafeZone = player.x >= 45 && player.x <= 55 && player.y >= 45 && player.y <= 55;
    if (inSafeZone) {
      const glowAlpha = Math.sin(animTime / 500) * 0.1 + 0.15;
      ctx.fillStyle = `rgba(218, 165, 32, ${glowAlpha})`;
      for (let sy = 0; sy < 20; sy++) {
        for (let sx = 0; sx < 25; sx++) {
          const mx = Math.floor(camera.x) + sx, my = Math.floor(camera.y) + sy;
          if (mx >= 45 && mx <= 55 && my >= 45 && my <= 55) {
            ctx.fillRect(sx * TS + ox, sy * TS + oy, TS, TS);
          }
        }
      }
    }
    const cardDealerScreenX = (cardDealer.x - camera.x) * TS + TS/2;
    const cardDealerScreenY = (cardDealer.y - camera.y) * TS + TS/2;
    if (cardDealerScreenX > -TS && cardDealerScreenX < W + TS && cardDealerScreenY > -TS && cardDealerScreenY < H + TS) {
      drawCardDealer(ctx, cardDealerScreenX, cardDealerScreenY, animTime);
    }
    monsters.forEach(m => {
      if (m.state === 'dead') return;
      const sx = (m.x - camera.x) * TS + TS/2, sy = (m.y - camera.y) * TS + TS/2;
      if (sx < -TS || sx > W+TS || sy < -TS || sy > H+TS) return;
      drawMonster(ctx, m, animTime);
      const hp = m.hp / m.maxHp;
      ctx.fillStyle = '#333';
      ctx.fillRect(sx - 15, sy - 28, 30, 4);
      ctx.fillStyle = hp > 0.5 ? '#4ade80' : hp > 0.25 ? '#fbbf24' : '#ef4444';
      ctx.fillRect(sx - 15, sy - 28, 30 * hp, 4);
      if (m.state === 'chase') {
        ctx.fillStyle = '#ff6b6b';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText('!', sx + 12, sy - 20);
      }
    });
    const px = (player.x - camera.x) * TS + TS/2, py = (player.y - camera.y) * TS + TS/2;
    drawPlayer(ctx, px, py, player.facing, player.isAttacking);
    if (inSafeZone) {
      ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
      ctx.fillRect(0, 0, W, 28);
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('🏰 安全区域 - 怪物无法进入', 8, 18);
      if (checkCardDealer()) {
        ctx.fillStyle = 'rgba(124, 58, 237, 0.9)';
        ctx.fillRect(W/2 - 100, H - 80, 200, 36);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('按 E 与发牌员对话', W/2, H - 56);
        ctx.textAlign = 'left';
      }
    }
    damages.forEach(d => {
      ctx.fillStyle = d.p ? '#ff6b6b' : '#ffd93d';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(`-${d.v}`, (d.x - camera.x) * TS, (d.y - camera.y) * TS);
    });
  }, [player, camera, monsters, damages, gameState, animTime, cardDealer]);

  // 剧情界面
  if (gameState === 'story') {
    const cur = STORY[storyIdx];
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-lg bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-600 shadow-2xl">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold ${cur.speaker === '旁白' ? 'bg-gray-700' : cur.speaker === '哨兵队长' ? 'bg-blue-700' : cur.speaker === '发牌员' ? 'bg-purple-700' : 'bg-purple-800'}`}>
              {cur.speaker === '旁白' ? '📜' : cur.speaker === '哨兵队长' ? 'CY' : cur.speaker === '发牌员' ? '🃏' : 'YT'}
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">{cur.speaker}</h3>
              {cur.title && <p className="text-slate-400 text-sm">{cur.title}</p>}
            </div>
          </div>
          <div className="bg-slate-700/50 rounded-xl p-4 mb-6 min-h-[80px]">
            <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{showText}<span className="animate-pulse">▍</span></p>
          </div>
          <div className="flex gap-1 mb-4 justify-center">
            {STORY.map((_, i) => <div key={i} className={`w-2 h-2 rounded-full ${i === storyIdx ? 'bg-amber-400' : i < storyIdx ? 'bg-green-500' : 'bg-slate-600'}`} />)}
          </div>
          <button
            onClick={() => { if (storyIdx < STORY.length - 1) { setStoryIdx(storyIdx + 1); } else { setGameState('playing'); }}}
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold transition-colors"
          >
            {storyIdx < STORY.length - 1 ? (typingDone ? '继续 →' : '跳过') : '开始冒险！'}
          </button>
        </div>
      </div>
    );
  }

  // 游戏结束
  if (gameState === 'gameover') {
    return (
      <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold text-red-500 mb-4">💀 游戏结束</h1>
        <p className="text-slate-300 mb-8">你被怪物击败了...</p>
        <button onClick={() => { setPlayer(p => ({...p, x:50, y:50, hp:100, mp:50})); setMonsters(m => m.map(x => ({...x, hp: x.maxHp, state: 'patrol'}))); setGameState('playing'); }}
          className="px-8 py-3 bg-amber-600 text-white rounded-xl font-bold">
          重新开始
        </button>
      </div>
    );
  }

  // 卡牌游戏弹窗
  if (showCardGame) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl p-8 border border-purple-500 shadow-2xl max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold text-purple-400 mb-4 text-center">🃏 卡牌游戏</h2>
          <p className="text-slate-300 text-center mb-6">发牌员正在洗牌...</p>
          <p className="text-slate-400 text-center mb-6 text-sm">（卡牌系统开发中，敬请期待！）</p>
          <button onClick={() => setShowCardGame(false)} className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-colors">
            返回游戏
          </button>
        </div>
      </div>
    );
  }

  // 游戏主界面
  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* 顶部状态栏 */}
      <div className="h-14 bg-slate-900/90 border-b border-slate-700 flex items-center px-4 gap-6 z-10">
        <div className="flex items-center gap-2">
          <span className="text-yellow-400">👤</span>
          <span className="text-white font-bold">{player.level}级</span>
        </div>
        <div className="flex-1 max-w-[200px]">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>HP</span><span>{player.hp}/{player.maxHp}</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 transition-all" style={{width: `${player.hp/player.maxHp*100}%`}} />
          </div>
        </div>
        <div className="flex-1 max-w-[150px]">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>MP</span><span>{player.mp}/{player.maxMp}</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 transition-all" style={{width: `${player.mp/player.maxMp*100}%`}} />
          </div>
        </div>
        <div className="text-slate-400 text-sm">EXP: {player.exp}</div>
      </div>

      {/* 地图画布 */}
      <div className="flex-1 relative overflow-hidden">
        <canvas ref={canvasRef} width={800} height={480} className="w-full h-full" />

        {/* 虚拟摇杆（移动） */}
        <div className="absolute bottom-20 left-4 flex flex-col items-center gap-1">
          <button className="w-12 h-12 bg-slate-800/80 rounded-lg flex items-center justify-center text-white text-xl border border-slate-600 active:bg-slate-700"
            onTouchStart={() => keysRef.current.add('w')} onTouchEnd={() => keysRef.current.delete('w')}
            onMouseDown={() => keysRef.current.add('w')} onMouseUp={() => keysRef.current.delete('w')} onMouseLeave={() => keysRef.current.delete('w')}>↑</button>
          <div className="flex gap-1">
            <button className="w-12 h-12 bg-slate-800/80 rounded-lg flex items-center justify-center text-white text-xl border border-slate-600 active:bg-slate-700"
              onTouchStart={() => keysRef.current.add('a')} onTouchEnd={() => keysRef.current.delete('a')}
              onMouseDown={() => keysRef.current.add('a')} onMouseUp={() => keysRef.current.delete('a')} onMouseLeave={() => keysRef.current.delete('a')}>←</button>
            <button className="w-12 h-12 bg-slate-800/80 rounded-lg flex items-center justify-center text-white text-xl border border-slate-600 active:bg-slate-700"
              onTouchStart={() => keysRef.current.add('s')} onTouchEnd={() => keysRef.current.delete('s')}
              onMouseDown={() => keysRef.current.add('s')} onMouseUp={() => keysRef.current.delete('s')} onMouseLeave={() => keysRef.current.delete('s')}>↓</button>
            <button className="w-12 h-12 bg-slate-800/80 rounded-lg flex items-center justify-center text-white text-xl border border-slate-600 active:bg-slate-700"
              onTouchStart={() => keysRef.current.add('d')} onTouchEnd={() => keysRef.current.delete('d')}
              onMouseDown={() => keysRef.current.add('d')} onMouseUp={() => keysRef.current.delete('d')} onMouseLeave={() => keysRef.current.delete('d')}>→</button>
          </div>
        </div>

        {/* 技能按钮 */}
        <div className="absolute bottom-20 right-4 flex flex-col gap-2">
          <button onClick={attack} disabled={player.cooldown > 0}
            className="w-16 h-16 bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-xl flex flex-col items-center justify-center text-white font-bold shadow-lg active:scale-95 transition-transform">
            <span className="text-xl">⚔️</span>
            <span className="text-[10px]">J攻击</span>
          </button>
          <button onClick={skill1} disabled={player.mp < 20 || player.cooldown > 0}
            className="w-16 h-16 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-xl flex flex-col items-center justify-center text-white font-bold shadow-lg active:scale-95 transition-transform">
            <span className="text-xl">🔥</span>
            <span className="text-[10px]">K火焰</span>
          </button>
          <button onClick={dodge}
            className="w-16 h-16 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 rounded-xl flex flex-col items-center justify-center text-white font-bold shadow-lg active:scale-95 transition-transform">
            <span className="text-xl">💨</span>
            <span className="text-[10px]">空格闪避</span>
          </button>
        </div>
      </div>

      {/* 底部提示 */}
      <div className="h-10 bg-slate-900/90 border-t border-slate-700 flex items-center justify-center gap-8 text-slate-400 text-xs">
        <span>🎮 WASD/方向键移动</span>
        <span>⚔️ J攻击 K技能 空格闪避</span>
        <span>🏰 城镇内无怪物</span>
        <span>🃏 靠近发牌员按E</span>
      </div>
    </div>
  );
}