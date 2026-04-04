'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

// ============================================================
//  Pokemon像素风RPG游戏 - 完全重写版
// ============================================================

const TILE_SIZE = 32;
const MAP_WIDTH = 80;
const MAP_HEIGHT = 60;

const COLORS: Record<string, string> = {
  grass1: '#7ECF7B', grass2: '#5FB55F', grassAccent: '#4A9A4A',
  path1: '#C8A86B', path2: '#A88855',
  wall1: '#8B8B9E', wall2: '#6B6B7E', wallTop: '#ABABBE',
  water1: '#5A9AE8', water2: '#7AB8F5', waterShine: '#9AD4F5',
  treeTrunk: '#6B4423', treeLeaves: '#2E8B2E', treeLeavesLight: '#3EAB3E',
  building: '#B8860B', buildingRoof: '#8B0000', buildingDoor: '#654321',
  skyTop: '#1a0533', skyBottom: '#2d1b4e',
};

const TERRAIN = { GRASS: 0, PATH: 1, WALL: 2, WATER: 3, TREE: 4, BUILDING: 5, BRIDGE: 6, FLOWER: 7 };

interface CardEffect {
  type: 'damage' | 'aoe_damage' | 'heal' | 'shield' | 'buff_atk' | 'debuff';
  value?: number;
  element?: 'fire' | 'ice' | 'thunder' | 'wind' | 'dark' | 'light';
}

interface Card {
  id: string; name: string; type: 'character' | 'skill' | 'item' | 'story';
  rarity: 1 | 2 | 3 | 4 | 5; description: string; effects: CardEffect[]; energyCost: number;
}

const RARITY_NAMES: Record<number, string> = {
  1: '⭐', 2: '⭐⭐', 3: '⭐⭐⭐', 4: '⭐⭐⭐⭐', 5: '⭐⭐⭐⭐⭐',
};

const ALL_CARDS: Card[] = [
  { id: 'basic_attack', name: '重击', type: 'skill', rarity: 1, description: '造成100%攻击力的伤害', effects: [{ type: 'damage', value: 100 }], energyCost: 1 },
  { id: 'flame_burst', name: '火焰术', type: 'skill', rarity: 2, description: '对所有敌人造成80%火属性伤害', effects: [{ type: 'aoe_damage', element: 'fire', value: 80 }], energyCost: 2 },
  { id: 'ice_shard', name: '冰碎片', type: 'skill', rarity: 2, description: '对单体造成120%冰属性伤害', effects: [{ type: 'damage', element: 'ice', value: 120 }], energyCost: 2 },
  { id: 'thunder_bolt', name: '雷击', type: 'skill', rarity: 3, description: '对单体造成200%雷属性伤害', effects: [{ type: 'damage', element: 'thunder', value: 200 }], energyCost: 3 },
  { id: 'heal_light', name: '圣光术', type: 'skill', rarity: 2, description: '恢复30%最大生命值', effects: [{ type: 'heal', value: 30 }], energyCost: 2 },
  { id: 'wind_cut', name: '风刃', type: 'skill', rarity: 3, description: '对所有敌人造成100%风属性伤害', effects: [{ type: 'aoe_damage', element: 'wind', value: 100 }], energyCost: 2 },
  { id: 'dark_arrow', name: '暗影箭', type: 'skill', rarity: 3, description: '造成150%暗属性伤害', effects: [{ type: 'damage', element: 'dark', value: 150 }], energyCost: 3 },
  { id: 'shield_wall', name: '护盾', type: 'skill', rarity: 2, description: '获得50%最大生命值的护盾', effects: [{ type: 'shield', value: 50 }], energyCost: 2 },
  { id: 'rage', name: '狂怒', type: 'skill', rarity: 3, description: '攻击力提升50%', effects: [{ type: 'buff_atk', value: 50 }], energyCost: 2 },
  { id: 'poison_dart', name: '毒镖', type: 'skill', rarity: 2, description: '使敌人中毒', effects: [{ type: 'debuff', value: 10 }], energyCost: 2 },
  { id: 'dragon_slayer', name: '屠龙斩', type: 'skill', rarity: 5, description: '对单体造成500%光属性伤害', effects: [{ type: 'damage', element: 'light', value: 500 }], energyCost: 5 },
  { id: 'inferno', name: '地狱火', type: 'skill', rarity: 5, description: '对所有敌人造成300%火属性伤害', effects: [{ type: 'aoe_damage', element: 'fire', value: 300 }], energyCost: 5 },
];

const STORY_LINES = [
  { speaker: '旁白', title: '', content: '西境王国边境，羊蹄山脚下。\n一个流浪剑客踏上这片神秘的土地...' },
  { speaker: '神秘声音', title: '???', content: '觉醒者...你终于来了。\n羊蹄山之魂在呼唤你。' },
  { speaker: '哨兵队长', title: '边境哨站', content: '站住！你是新来的冒险者？\n最近城外不太平，小心怪物。' },
  { speaker: '哨兵队长', title: '边境哨站', content: '在镇子里是安全的。\n去草地打怪练级吧！' },
  { speaker: '发牌员', title: '酒馆门口', content: '嘿，冒险者！想来一把卡牌游戏吗？\n靠近我就可以开始游戏！' },
];

function createWorldMap(): number[][] {
  const m: number[][] = [];
  for (let y = 0; y < MAP_HEIGHT; y++) {
    const row: number[] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      if (x === 0 || y === 0 || x === MAP_WIDTH - 1 || y === MAP_HEIGHT - 1) { row.push(TERRAIN.WALL); }
      else if (x >= 32 && x <= 48 && y >= 28 && y <= 44) {
        if ((x === 32 || x === 48 || y === 28 || y === 44) && !(x >= 37 && x <= 43 && y >= 34 && y <= 38)) row.push(TERRAIN.BUILDING);
        else if (x >= 37 && x <= 43 && y >= 34 && y <= 38) row.push(TERRAIN.BUILDING);
        else row.push(TERRAIN.PATH);
      } else if (y >= 10 && y <= 14 && x >= 5 && x <= 75) {
        row.push(x >= 30 && x <= 50 ? TERRAIN.BRIDGE : TERRAIN.WATER);
      } else if (x >= 3 && x <= 18 && y >= 3 && y <= 18) {
        const r = Math.random(); row.push(r < 0.5 ? TERRAIN.TREE : r < 0.75 ? TERRAIN.GRASS : TERRAIN.WALL);
      } else if (x >= 60 && x <= 75 && y >= 3 && y <= 18) {
        const r = Math.random(); row.push(r < 0.4 ? TERRAIN.FLOWER : r < 0.8 ? TERRAIN.GRASS : TERRAIN.TREE);
      } else {
        const r = Math.random(); row.push(r < 0.7 ? TERRAIN.GRASS : r < 0.88 ? TERRAIN.TREE : TERRAIN.WALL);
      }
    }
    m.push(row);
  }
  return m;
}

export default function ImprovedRPG() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 480 });
  const [gameState, setGameState] = useState<'story' | 'playing' | 'gameover' | 'victory'>('story');
  const [storyIdx, setStoryIdx] = useState(0);
  const [showText, setShowText] = useState('');
  const [typingDone, setTypingDone] = useState(false);

  const [player, setPlayer] = useState({
    x: 40, y: 36, hp: 100, maxHp: 100, mp: 50, maxMp: 50,
    energy: 3, maxEnergy: 5, level: 1, exp: 0, expToLevel: 100, atk: 25, def: 10,
    facing: 'down' as 'up' | 'down' | 'left' | 'right',
    isAttacking: false, attackFrame: 0, cooldown: 0, invincible: 0, atkBuff: 0,
  });

  const [camera, setCamera] = useState({ x: 30, y: 28 });
  const [animFrame, setAnimFrame] = useState(0);

  const [monsters, setMonsters] = useState<Array<{
    id: number; x: number; y: number; hp: number; maxHp: number; atk: number; name: string;
    type: 'slime' | 'wolf' | 'goblin'; state: 'patrol' | 'chase' | 'attack' | 'dead'; dir: number; cd: number; dropCard: boolean; isElite?: boolean;
  }>>([
    { id: 1, x: 25, y: 20, hp: 40, maxHp: 40, atk: 8, name: '史莱姆', type: 'slime', state: 'patrol', dir: 1, cd: 0, dropCard: false },
    { id: 2, x: 55, y: 18, hp: 50, maxHp: 50, atk: 12, name: '灰狼', type: 'wolf', state: 'patrol', dir: -1, cd: 0, dropCard: false },
    { id: 3, x: 15, y: 35, hp: 35, maxHp: 35, atk: 10, name: '哥布林', type: 'goblin', state: 'patrol', dir: 1, cd: 0, dropCard: false },
    { id: 4, x: 60, y: 25, hp: 45, maxHp: 45, atk: 8, name: '史莱姆', type: 'slime', state: 'patrol', dir: 1, cd: 0, dropCard: false },
    { id: 5, x: 65, y: 40, hp: 80, maxHp: 80, atk: 18, name: '精英灰狼', type: 'wolf', state: 'patrol', dir: 1, cd: 0, dropCard: true, isElite: true },
    { id: 6, x: 10, y: 50, hp: 60, maxHp: 60, atk: 15, name: '哥布林战士', type: 'goblin', state: 'patrol', dir: 1, cd: 0, dropCard: true, isElite: true },
    { id: 7, x: 70, y: 50, hp: 100, maxHp: 100, atk: 20, name: '巨型史莱姆', type: 'slime', state: 'patrol', dir: 1, cd: 0, dropCard: true, isElite: true },
  ]);

  const [treasures] = useState([
    { id: 1, x: 20, y: 22, opened: false },
    { id: 2, x: 65, y: 15, opened: false },
    { id: 3, x: 70, y: 35, opened: false },
  ]);

  const [npcs] = useState([
    { id: 'chen_yue', x: 40, y: 32, name: '哨兵队长', color: '#2962D4', icon: 'CY' },
    { id: 'card_dealer', x: 42, y: 38, name: '发牌员', color: '#7C3AED', icon: '🃏' },
  ]);

  const [damages, setDamages] = useState<{ id: number; x: number; y: number; v: number; t: number; color: string }[]>([]);
  const dmgIdRef = useRef(0);

  const [showCardGame, setShowCardGame] = useState(false);
  const [hand, setHand] = useState<Card[]>(ALL_CARDS.slice(0, 3).map(c => ({ ...c })));
  const [deck, setDeck] = useState<Card[]>(ALL_CARDS.slice(3));
  const [cardRewards, setCardRewards] = useState<Card[]>([]);
  const [showRewards, setShowRewards] = useState(false);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [battleEnemyHp, setBattleEnemyHp] = useState({ hp: 0, maxHp: 0, name: '' });
  const [battleState, setBattleState] = useState<'idle' | 'battle' | 'victory' | 'defeat'>('idle');
  const [usedCardIndex, setUsedCardIndex] = useState<number | null>(null);
  const [battleResult, setBattleResult] = useState<string>('');

  const keysRef = useRef<Set<string>>(new Set());
  const mapDataRef = useRef<number[][]>(createWorldMap());
  const battleTurnRef = useRef<'player' | 'enemy'>('player');
  const battleLogRef = useRef<string[]>([]);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) setDimensions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    if (gameState !== 'story') return;
    const txt = STORY_LINES[storyIdx].content;
    let i = 0; setShowText(''); setTypingDone(false);
    const t = setInterval(() => {
      if (i < txt.length) setShowText(txt.slice(0, ++i));
      else { setTypingDone(true); clearInterval(t); }
    }, 40);
    return () => clearInterval(t);
  }, [storyIdx, gameState]);

  const addDmg = useCallback((x: number, y: number, v: number, color: string) => {
    setDamages(d => [...d, { id: dmgIdRef.current++, x, y, v, t: 60, color }]);
  }, []);

  const dropCard = useCallback((isElite: boolean): Card | null => {
    if (Math.random() > (isElite ? 1.0 : 0.3)) return null;
    const pool = isElite ? ALL_CARDS.filter(c => c.rarity >= 3) : ALL_CARDS.filter(c => c.rarity <= 3);
    return pool[Math.floor(Math.random() * pool.length)] || null;
  }, []);

  const attack = useCallback(() => {
    if (player.cooldown > 0) return;
    const atkVal = Math.floor(player.atk * (1 + player.atkBuff / 100));
    setPlayer(p => ({ ...p, cooldown: 20, isAttacking: true, attackFrame: 10 }));
    setTimeout(() => setPlayer(p => ({ ...p, isAttacking: false })), 250);
    setMonsters(mons => mons.map(m => {
      if (m.state === 'dead') return m;
      const dx = Math.abs(m.x - player.x), dy = Math.abs(m.y - player.y);
      if (dx <= 1.5 && dy <= 1.5) {
        const nh = m.hp - atkVal;
        addDmg(m.x, m.y, atkVal, '#ffd93d');
        if (nh <= 0) {
          const card = dropCard(m.isElite || false);
          if (card) { setCardRewards([card]); setShowRewards(true); }
          setPlayer(p => ({ ...p, exp: p.exp + (m.isElite ? 50 : 10) }));
        }
        return { ...m, hp: nh, state: nh <= 0 ? 'dead' : m.state };
      }
      return m;
    }));
  }, [player, addDmg, dropCard]);

  const dodge = useCallback(() => {
    if (player.cooldown > 0) return;
    const dirs: Record<string, [number, number]> = { up: [0, -3], down: [0, 3], left: [-3, 0], right: [3, 0] };
    const [dx, dy] = dirs[player.facing];
    let nx = Math.max(1, Math.min(MAP_WIDTH - 2, player.x + dx));
    let ny = Math.max(1, Math.min(MAP_HEIGHT - 2, player.y + dy));
    const tile = mapDataRef.current[Math.floor(ny)][Math.floor(nx)];
    if (tile !== TERRAIN.WALL && tile !== TERRAIN.WATER && tile !== TERRAIN.BUILDING) {
      setPlayer(p => ({ ...p, x: nx, y: ny, cooldown: 15, invincible: 10 }));
    }
  }, [player]);

  const checkInteraction = useCallback(() => {
    for (const npc of npcs) {
      if (npc.id === 'card_dealer') {
        const dx = Math.abs(player.x - npc.x), dy = Math.abs(player.y - npc.y);
        if (dx <= 1.5 && dy <= 1.5) return 'card_dealer';
      }
    }
    for (const t of treasures) {
      if (!t.opened) {
        const dx = Math.abs(player.x - t.x), dy = Math.abs(player.y - t.y);
        if (dx <= 1.5 && dy <= 1.5) return `treasure_${t.id}`;
      }
    }
    return null;
  }, [player, npcs, treasures]);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      if (e.key === 'j' || e.key === 'J') attack();
      if (e.key === ' ') { e.preventDefault(); dodge(); }
      if ((e.key === 'e' || e.key === 'E') && checkInteraction() === 'card_dealer') setShowCardGame(true);
    };
    const onUp = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, [player, attack, dodge, checkInteraction]);

  const interactionHint = checkInteraction();
  const inSafeZone = player.x >= 32 && player.x <= 48 && player.y >= 28 && player.y <= 44;

  // 卡牌游戏
  const startCardBattle = (monsterName: string, monsterHp: number, monsterMaxHp: number) => {
    setBattleEnemyHp({ hp: monsterHp, maxHp: monsterMaxHp, name: monsterName });
    setBattleState('battle');
    setBattleLog(['卡牌对战开始！']);
    battleLogRef.current = ['卡牌对战开始！'];
    battleTurnRef.current = 'player';
    setUsedCardIndex(null);
    setBattleResult('');
  };

  const playCard = (cardIndex: number) => {
    const card = hand[cardIndex];
    if (!card || player.energy < card.energyCost) return;
    setUsedCardIndex(cardIndex);
    const newEnergy = player.energy - card.energyCost;
    setPlayer(p => ({ ...p, energy: newEnergy }));

    let logMsg = `你使用了「${card.name}」！`;
    const atkVal = Math.floor(player.atk * (1 + player.atkBuff / 100));
    let newEnemyHp = battleEnemyHp.hp;
    let newPlayerHp = player.hp;
    let newPlayerMaxHp = player.maxHp;

    for (const eff of card.effects) {
      if (eff.type === 'damage') {
        const dmg = Math.floor((eff.value || 100) / 100 * atkVal);
        newEnemyHp = Math.max(0, newEnemyHp - dmg);
        logMsg += ` 造成${dmg}点伤害！`;
      } else if (eff.type === 'aoe_damage') {
        const dmg = Math.floor((eff.value || 80) / 100 * atkVal);
        newEnemyHp = Math.max(0, newEnemyHp - dmg);
        logMsg += ` 对所有敌人造成${dmg}点${eff.element || ''}伤害！`;
      } else if (eff.type === 'heal') {
        const heal = Math.floor((eff.value || 30) / 100 * newPlayerMaxHp);
        newPlayerHp = Math.min(newPlayerMaxHp, newPlayerHp + heal);
        logMsg += ` 恢复了${heal}点生命！`;
      }
    }

    setBattleEnemyHp(e => ({ ...e, hp: newEnemyHp }));
    setPlayer(p => ({ ...p, hp: newPlayerHp, energy: newEnergy }));
    const newLog = [...battleLogRef.current, logMsg];
    battleLogRef.current = newLog;
    setBattleLog([...newLog]);

    if (newEnemyHp <= 0) {
      setBattleState('victory');
      setBattleResult('你赢了！');
      const nh = hand.filter((_, i) => i !== cardIndex);
      setHand(nh);
      if (nh.length === 0) {
        const newCards = deck.length > 0 ? [...deck] : ALL_CARDS.slice(0, 3).map(c => ({ ...c }));
        setDeck([]);
        setHand(newCards);
      }
      return;
    }

    battleTurnRef.current = 'enemy';
    setTimeout(() => {
      const enemyDmg = 10 + Math.floor(Math.random() * 10);
      newPlayerHp = Math.max(0, newPlayerHp - enemyDmg);
      const enemyLog = [`${battleEnemyHp.name}攻击你！ 造成${enemyDmg}点伤害！`];
      battleLogRef.current = [...battleLogRef.current, ...enemyLog];
      setBattleLog([...battleLogRef.current]);
      setPlayer(p => ({ ...p, hp: newPlayerHp }));

      if (newPlayerHp <= 0) {
        setBattleState('defeat');
        setBattleResult('你输了...');
      } else {
        battleTurnRef.current = 'player';
        if (newEnergy < card.energyCost && deck.length > 0) {
          const drawn = deck.slice(0, 1);
          const newDeckList = deck.slice(1);
          const nh = hand.filter((_, i) => i !== cardIndex);
          setHand([...nh, ...drawn]);
          setDeck(newDeckList);
          setPlayer(p => ({ ...p, energy: p.maxEnergy }));
        }
      }
      setUsedCardIndex(null);
    }, 800);
  };

  // 游戏主循环
  useEffect(() => {
    if (gameState !== 'playing') return;
    let raf: number; let lastTime = 0;
    const loop = (time: number) => {
      if (time - lastTime >= 16) {
        lastTime = time;
        setAnimFrame(f => f + 1);

        let dx = 0, dy = 0;
        if (keysRef.current.has('w') || keysRef.current.has('arrowup')) { dy = -1; setPlayer(p => ({ ...p, facing: 'up' })); }
        if (keysRef.current.has('s') || keysRef.current.has('arrowdown')) { dy = 1; setPlayer(p => ({ ...p, facing: 'down' })); }
        if (keysRef.current.has('a') || keysRef.current.has('arrowleft')) { dx = -1; setPlayer(p => ({ ...p, facing: 'left' })); }
        if (keysRef.current.has('d') || keysRef.current.has('arrowright')) { dx = 1; setPlayer(p => ({ ...p, facing: 'right' })); }

        if (dx !== 0 || dy !== 0) {
          setPlayer(p => {
            let nx = p.x + dx * 0.08, ny = p.y + dy * 0.08;
            nx = Math.max(1, Math.min(MAP_WIDTH - 2, nx));
            ny = Math.max(1, Math.min(MAP_HEIGHT - 2, ny));
            const tile = mapDataRef.current[Math.floor(ny)][Math.floor(nx)];
            if (tile === TERRAIN.WALL || tile === TERRAIN.WATER || tile === TERRAIN.BUILDING) return p;
            return { ...p, x: nx, y: ny };
          });
        }

        setPlayer(p => ({ ...p, cooldown: Math.max(0, p.cooldown - 1), invincible: Math.max(0, p.invincible - 1), attackFrame: Math.max(0, p.attackFrame - 1) }));

        setPlayer(p => {
          if (p.exp >= p.expToLevel) return { ...p, level: p.level + 1, exp: p.exp - p.expToLevel, expToLevel: Math.floor(p.expToLevel * 1.5), maxHp: p.maxHp + 20, hp: p.maxHp + 20, atk: p.atk + 5, maxMp: p.maxMp + 10, mp: p.maxMp + 10 };
          return p;
        });

        setCamera(c => ({ x: Math.max(0, Math.min(MAP_WIDTH - 25, player.x - 12)), y: Math.max(0, Math.min(MAP_HEIGHT - 15, player.y - 7)) }));

        setMonsters(mons => mons.map(m => {
          if (m.state === 'dead') return m;
          const pdx = player.x - m.x, pdy = player.y - m.y, dist = Math.sqrt(pdx * pdx + pdy * pdy);
          let nx = m.x, ny = m.y, ns = m.state, ncd = Math.max(0, m.cd - 1);
          const inTown = m.x >= 32 && m.x <= 48 && m.y >= 28 && m.y <= 44;
          if (dist < 6 && !inTown) ns = 'chase';
          else if (dist > 12) ns = 'patrol';
          if (ns === 'chase' && !inTown) {
            nx = m.x + pdx / dist * 0.35; ny = m.y + pdy / dist * 0.35;
            const tile = mapDataRef.current[Math.floor(ny)][Math.floor(nx)];
            if (tile === TERRAIN.WALL || tile === TERRAIN.WATER || tile === TERRAIN.BUILDING) { nx = m.x; ny = m.y; }
          }
          if (ns === 'patrol') {
            nx = m.x + m.dir * 0.2;
            const tile = mapDataRef.current[Math.floor(m.y)][Math.floor(nx)];
            if (tile === TERRAIN.WALL || tile === TERRAIN.WATER || tile === TERRAIN.BUILDING) nx = m.x;
            if (Math.abs(nx - m.x) > 3) return { ...m, x: nx, y: ny, state: ns, cd: ncd, dir: -m.dir };
          }
          if (dist < 1.2 && ncd <= 0 && player.invincible <= 0 && !inTown) {
            const dmg = m.atk;
            addDmg(player.x, player.y, dmg, '#ff6b6b');
            setPlayer(p => ({ ...p, hp: Math.max(0, p.hp - dmg) }));
            ncd = 60;
          }
          return { ...m, x: nx, y: ny, state: ns, cd: ncd };
        }));

        setDamages(d => d.map(x => ({ ...x, t: x.t - 1, y: x.y - 0.4 })).filter(x => x.t > 0));
        if (player.hp <= 0) setGameState('gameover');
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [gameState, player, addDmg]);

  // 绘制函数
  const drawGrassTile = (ctx: CanvasRenderingContext2D, sx: number, sy: number, tileX: number, tileY: number, frame: number) => {
    ctx.fillStyle = COLORS.grass1;
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    const seed = (tileX * 7 + tileY * 13) % 5;
    ctx.fillStyle = COLORS.grass2;
    for (let i = 0; i < 4; i++) {
      const gx = sx + ((seed + i * 3) % 28) + 2;
      const gy = sy + ((seed + i * 7) % 28) + 2;
      const sway = Math.sin(frame * 0.05 + i + tileX * 0.3) * 1;
      ctx.fillRect(gx + sway, gy, 2, 4);
    }
    ctx.fillStyle = COLORS.grassAccent;
    if (seed > 1) ctx.fillRect(sx + 15, sy + 8, 2, 6);
  };

  const drawPathTile = (ctx: CanvasRenderingContext2D, sx: number, sy: number) => {
    ctx.fillStyle = COLORS.path1;
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = COLORS.path2;
    ctx.fillRect(sx, sy, TILE_SIZE, 1); ctx.fillRect(sx, sy, 1, TILE_SIZE);
    ctx.fillRect(sx + 6, sy + 6, 3, 3); ctx.fillRect(sx + 18, sy + 12, 4, 3); ctx.fillRect(sx + 10, sy + 22, 3, 3);
  };

  const drawWallTile = (ctx: CanvasRenderingContext2D, sx: number, sy: number) => {
    ctx.fillStyle = COLORS.wall1;
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = COLORS.wall2;
    ctx.fillRect(sx, sy, TILE_SIZE, 1); ctx.fillRect(sx, sy, 1, TILE_SIZE);
    ctx.fillRect(sx + 16, sy, 1, 16); ctx.fillRect(sx, sy + 16, 16, 1);
    ctx.fillStyle = COLORS.wallTop;
    ctx.fillRect(sx + 2, sy + 2, 12, 2); ctx.fillRect(sx + 18, sy + 2, 12, 2);
    ctx.fillRect(sx + 2, sy + 18, 12, 2); ctx.fillRect(sx + 18, sy + 18, 12, 2);
  };

  const drawWaterTile = (ctx: CanvasRenderingContext2D, sx: number, sy: number, frame: number) => {
    ctx.fillStyle = COLORS.water1;
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = COLORS.water2;
    const wave = Math.sin(frame * 0.1 + sx * 0.1) * 4;
    ctx.fillRect(sx + wave, sy + 10, 16, 2);
    ctx.fillRect(sx - wave / 2 + 4, sy + 22, 12, 2);
    ctx.fillStyle = COLORS.waterShine;
    ctx.fillRect(sx + 8, sy + 4, 6, 2); ctx.fillRect(sx + 20, sy + 16, 4, 2);
  };

  const drawBridgeTile = (ctx: CanvasRenderingContext2D, sx: number, sy: number) => {
    ctx.fillStyle = COLORS.water1;
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = COLORS.path1;
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = COLORS.treeTrunk;
    ctx.fillRect(sx, sy + 2, TILE_SIZE, 3); ctx.fillRect(sx, sy + TILE_SIZE - 5, TILE_SIZE, 3);
    ctx.fillStyle = COLORS.path2;
    ctx.fillRect(sx + 4, sy + 8, 6, 2); ctx.fillRect(sx + 20, sy + 20, 6, 2);
  };

  const drawTreeTile = (ctx: CanvasRenderingContext2D, sx: number, sy: number) => {
    ctx.fillStyle = COLORS.grass1;
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = COLORS.treeTrunk;
    ctx.fillRect(sx + 12, sy + 18, 8, 14);
    ctx.fillStyle = COLORS.treeLeaves;
    ctx.beginPath(); ctx.arc(sx + 16, sy + 12, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = COLORS.treeLeavesLight;
    ctx.beginPath(); ctx.arc(sx + 12, sy + 8, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4abd4a';
    ctx.beginPath(); ctx.arc(sx + 20, sy + 14, 6, 0, Math.PI * 2); ctx.fill();
  };

  const drawFlowerTile = (ctx: CanvasRenderingContext2D, sx: number, sy: number, tileX: number, tileY: number, frame: number) => {
    ctx.fillStyle = COLORS.grass1;
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    const seed = (tileX * 11 + tileY * 17) % 4;
    const flowerColors = ['#FF6B6B', '#FFE66D', '#C56CF0', '#FF9FF3'];
    for (let i = 0; i < 3; i++) {
      const fx = sx + ((seed + i * 5) % 24) + 4;
      const fy = sy + ((seed + i * 7) % 24) + 4;
      const sway = Math.sin(frame * 0.03 + i + tileX) * 1;
      ctx.fillStyle = '#4A9A4A';
      ctx.fillRect(fx + 1, fy + 4, 2, 6);
      ctx.fillStyle = flowerColors[(seed + i) % flowerColors.length];
      ctx.beginPath(); ctx.arc(fx + sway, fy + 2, 4, 0, Math.PI * 2); ctx.fill();
    }
  };

  const drawBuildingTile = (ctx: CanvasRenderingContext2D, sx: number, sy: number) => {
    ctx.fillStyle = COLORS.path1;
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = COLORS.building;
    ctx.fillRect(sx + 2, sy + 10, 28, 22);
    ctx.fillStyle = COLORS.buildingRoof;
    ctx.beginPath();
    ctx.moveTo(sx, sy + 12); ctx.lineTo(sx + 16, sy); ctx.lineTo(sx + 32, sy + 12);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = COLORS.buildingDoor;
    ctx.fillRect(sx + 12, sy + 18, 8, 14);
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(sx + 14, sy + 22, 4, 2);
  };

  const drawTile = (ctx: CanvasRenderingContext2D, terrain: number, sx: number, sy: number, mx: number, my: number, frame: number) => {
    switch (terrain) {
      case TERRAIN.GRASS: drawGrassTile(ctx, sx, sy, mx, my, frame); break;
      case TERRAIN.PATH: drawPathTile(ctx, sx, sy); break;
      case TERRAIN.WALL: drawWallTile(ctx, sx, sy); break;
      case TERRAIN.WATER: drawWaterTile(ctx, sx, sy, frame); break;
      case TERRAIN.TREE: drawTreeTile(ctx, sx, sy); break;
      case TERRAIN.BUILDING: drawBuildingTile(ctx, sx, sy); break;
      case TERRAIN.BRIDGE: drawBridgeTile(ctx, sx, sy); break;
      case TERRAIN.FLOWER: drawFlowerTile(ctx, sx, sy, mx, my, frame); break;
      default: drawGrassTile(ctx, sx, sy, mx, my, frame);
    }
  };

  // ===================== 精灵绘制 =====================
  const drawPlayerSprite = (ctx: CanvasRenderingContext2D, sx: number, sy: number, facing: string, frame: number, isAttacking: boolean, invincible: number) => {
    const bounce = Math.sin(frame * 0.15) * 2;
    if (invincible > 0 && Math.floor(frame / 4) % 2 === 0) return;
    // 身体 - 蓝色战士外套
    ctx.fillStyle = '#2962D4';
    ctx.fillRect(sx - 10, sy - 20 + bounce, 20, 24);
    ctx.fillStyle = '#42A5F5';
    ctx.fillRect(sx - 8, sy - 18 + bounce, 4, 8);
    // 头部
    ctx.fillStyle = '#FFCC80';
    ctx.beginPath(); ctx.arc(sx, sy - 28 + bounce, 10, 0, Math.PI * 2); ctx.fill();
    // 头发
    ctx.fillStyle = '#424242';
    ctx.beginPath(); ctx.arc(sx, sy - 32 + bounce, 9, Math.PI, 0); ctx.fill();
    // 眼睛
    ctx.fillStyle = '#212121';
    ctx.fillRect(sx - 5, sy - 30 + bounce, 3, 3);
    ctx.fillRect(sx + 2, sy - 30 + bounce, 3, 3);
    // 腿部
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(sx - 8, sy + 4 + bounce, 6, 8);
    ctx.fillRect(sx + 2, sy + 4 + bounce, 6, 8);
    // 武器
    if (facing === 'right' || facing === 'down' || isAttacking) {
      ctx.fillStyle = '#9E9E9E';
      ctx.fillRect(sx + 12, sy - 18 + bounce, 4, 24);
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(sx + 10, sy - 14 + bounce, 8, 4);
      if (isAttacking) {
        ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(sx, sy - 8 + bounce, 28, 0, Math.PI * 2); ctx.stroke();
      }
    } else if (facing === 'left') {
      ctx.fillStyle = '#9E9E9E';
      ctx.fillRect(sx - 16, sy - 18 + bounce, 4, 24);
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(sx - 18, sy - 14 + bounce, 8, 4);
    } else if (facing === 'up') {
      ctx.fillStyle = '#9E9E9E';
      ctx.fillRect(sx - 2, sy - 38 + bounce, 4, 18);
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(sx - 4, sy - 26 + bounce, 8, 4);
    }
  };

  // 史莱姆
  const drawSlime = (ctx: CanvasRenderingContext2D, sx: number, sy: number, frame: number, isElite: boolean = false) => {
    const squish = Math.sin(frame * 0.15) * 3;
    const scale = isElite ? 1.5 : 1;
    ctx.fillStyle = isElite ? '#9C27B0' : '#69F0AE';
    ctx.beginPath(); ctx.ellipse(sx, sy, (14 + squish) * scale, (12 - squish / 2) * scale, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = isElite ? '#CE93D8' : '#B9F6CA';
    ctx.beginPath(); ctx.ellipse(sx - 4 * scale, sy - 4 * scale, 4 * scale, 3 * scale, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.fillRect(sx - 5 * scale, sy - 2 * scale, 3 * scale, 3 * scale);
    ctx.fillRect(sx + 2 * scale, sy - 2 * scale, 3 * scale, 3 * scale);
    if (isElite) {
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 8px sans-serif';
      ctx.fillText('★', sx - 4, sy - 18);
    }
  };

  // 灰狼
  const drawWolf = (ctx: CanvasRenderingContext2D, sx: number, sy: number, frame: number, isElite: boolean = false) => {
    const run = Math.abs(Math.sin(frame * 0.3)) * 4;
    const col = isElite ? '#374151' : '#757575';
    ctx.fillStyle = col;
    ctx.fillRect(sx - 16, sy - 10, 32, 16);
    ctx.beginPath();
    ctx.moveTo(sx + 16, sy - 14); ctx.lineTo(sx + 28, sy - 8); ctx.lineTo(sx + 16, sy - 4);
    ctx.fill();
    ctx.fillStyle = isElite ? '#1F2937' : '#4B5563';
    ctx.fillRect(sx - 12, sy + 6, 6, 8 - run);
    ctx.fillRect(sx + 6, sy + 6, 6, 8 + run);
    ctx.fillStyle = isElite ? '#EF4444' : '#F44336';
    ctx.fillRect(sx + 20, sy - 10, 3, 3);
    if (isElite) {
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 8px sans-serif';
      ctx.fillText('★', sx - 18, sy - 14);
    }
  };

  // 哥布林
  const drawGoblin = (ctx: CanvasRenderingContext2D, sx: number, sy: number, frame: number, isElite: boolean = false) => {
    const hop = Math.abs(Math.sin(frame * 0.2)) * 3;
    const col = isElite ? '#1B5E20' : '#66BB6A';
    ctx.fillStyle = col;
    ctx.fillRect(sx - 8, sy - 16 + hop, 16, 20);
    ctx.beginPath(); ctx.arc(sx, sy - 22 + hop, 10, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(sx - 10, sy - 26 + hop); ctx.lineTo(sx - 16, sy - 34 + hop); ctx.lineTo(sx - 6, sy - 22 + hop);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(sx + 10, sy - 26 + hop); ctx.lineTo(sx + 16, sy - 34 + hop); ctx.lineTo(sx + 6, sy - 22 + hop);
    ctx.fill();
    ctx.fillStyle = '#FFEB3B';
    ctx.fillRect(sx - 5, sy - 24 + hop, 4, 4);
    ctx.fillRect(sx + 1, sy - 24 + hop, 4, 4);
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(sx - 4, sy - 23 + hop, 1.5, 0, Math.PI * 2); ctx.arc(sx + 4, sy - 23 + hop, 1.5, 0, Math.PI * 2); ctx.fill();
    if (isElite) {
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 8px sans-serif';
      ctx.fillText('★', sx - 4, sy - 36);
    }
  };

  const drawMonsterSprite = (ctx: CanvasRenderingContext2D, m: typeof monsters[0], frame: number) => {
    if (m.type === 'slime') drawSlime(ctx, m.x, m.y, frame, m.isElite);
    else if (m.type === 'wolf') drawWolf(ctx, m.x, m.y, frame, m.isElite);
    else if (m.type === 'goblin') drawGoblin(ctx, m.x, m.y, frame, m.isElite);
  };

  // NPC
  const drawNPC = (ctx: CanvasRenderingContext2D, sx: number, sy: number, npc: typeof npcs[0], frame: number) => {
    const glow = Math.sin(frame * 0.08) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(218, 165, 32, ${glow * 0.3})`;
    ctx.beginPath(); ctx.arc(sx, sy, 24, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = npc.color;
    ctx.fillRect(sx - 10, sy - 16, 20, 24);
    ctx.fillStyle = '#FFCC80';
    ctx.beginPath(); ctx.arc(sx, sy - 22, 10, 0, Math.PI * 2); ctx.fill();
    if (npc.id === 'chen_yue') {
      ctx.fillStyle = '#1565C0';
      ctx.beginPath(); ctx.arc(sx, sy - 26, 9, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#424242';
      ctx.fillRect(sx - 12, sy - 20, 24, 3);
    } else {
      ctx.fillStyle = '#7C3AED';
      ctx.beginPath();
      ctx.moveTo(sx - 12, sy - 26); ctx.lineTo(sx, sy - 42); ctx.lineTo(sx + 12, sy - 26);
      ctx.closePath(); ctx.fill();
    }
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText(npc.icon, sx - 6, sy + 2);
  };

  // 宝箱
  const drawTreasure = (ctx: CanvasRenderingContext2D, sx: number, sy: number, opened: boolean, frame: number) => {
    if (opened) return;
    const bounce = Math.sin(frame * 0.1) * 2;
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(sx - 14, sy - 10 + bounce, 28, 20);
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(sx - 16, sy - 12 + bounce, 32, 6);
    ctx.fillRect(sx - 4, sy - 14 + bounce, 8, 8);
    ctx.fillStyle = '#FFA500';
    ctx.beginPath(); ctx.arc(sx, sy - 10 + bounce, 4, 0, Math.PI * 2); ctx.fill();
  };

  // 渲染
  useEffect(() => {
    if (gameState !== 'playing' || !canvasRef.current) return;
    const cvs = canvasRef.current;
    const ctx = cvs.getContext('2d'); if (!ctx) return;
    const W = cvs.width, H = cvs.height;
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, COLORS.skyTop); gradient.addColorStop(1, COLORS.skyBottom);
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, W, H);
    const ox = -camera.x * TILE_SIZE + TILE_SIZE / 2;
    const oy = -camera.y * TILE_SIZE + TILE_SIZE / 2;

    const tilesX = Math.ceil(W / TILE_SIZE) + 2;
    const tilesY = Math.ceil(H / TILE_SIZE) + 2;

    for (let ty = 0; ty < tilesY; ty++) {
      for (let tx = 0; tx < tilesX; tx++) {
        const mx = Math.floor(camera.x) + tx, my = Math.floor(camera.y) + ty;
        if (mx < 0 || my < 0 || mx >= MAP_WIDTH || my >= MAP_HEIGHT) continue;
        drawTile(ctx, mapDataRef.current[my][mx], tx * TILE_SIZE + ox, ty * TILE_SIZE + oy, mx, my, animFrame);
      }
    }

    // 安全区光晕
    const inSafeZone = player.x >= 32 && player.x <= 48 && player.y >= 28 && player.y <= 44;
    if (inSafeZone) {
      const glowAlpha = Math.sin(animFrame * 0.05) * 0.08 + 0.12;
      ctx.fillStyle = `rgba(255, 215, 0, ${glowAlpha})`;
      for (let ty = 0; ty < tilesY; ty++) {
        for (let tx = 0; tx < tilesX; tx++) {
          const mx = Math.floor(camera.x) + tx, my = Math.floor(camera.y) + ty;
          if (mx >= 32 && mx <= 48 && my >= 28 && my <= 44) {
            ctx.fillRect(tx * TILE_SIZE + ox, ty * TILE_SIZE + oy, TILE_SIZE, TILE_SIZE);
          }
        }
      }
    }

    // NPC
    npcs.forEach(npc => {
      const sx = (npc.x - camera.x) * TILE_SIZE + TILE_SIZE / 2 + ox;
      const sy = (npc.y - camera.y) * TILE_SIZE + TILE_SIZE / 2 + oy;
      if (sx < -50 || sx > W + 50 || sy < -50 || sy > H + 50) return;
      drawNPC(ctx, sx, sy, npc, animFrame);
    });

    // 宝箱
    treasures.forEach(t => {
      if (t.opened) return;
      const sx = (t.x - camera.x) * TILE_SIZE + TILE_SIZE / 2 + ox;
      const sy = (t.y - camera.y) * TILE_SIZE + TILE_SIZE / 2 + oy;
      if (sx < -50 || sx > W + 50 || sy < -50 || sy > H + 50) return;
      drawTreasure(ctx, sx, sy, t.opened, animFrame);
    });

    // 怪物
    monsters.forEach(m => {
      if (m.state === 'dead') return;
      const sx = (m.x - camera.x) * TILE_SIZE + TILE_SIZE / 2 + ox;
      const sy = (m.y - camera.y) * TILE_SIZE + TILE_SIZE / 2 + oy;
      if (sx < -50 || sx > W + 50 || sy < -50 || sy > H + 50) return;
      drawMonsterSprite(ctx, m, animFrame);
      const hp = m.hp / m.maxHp;
      ctx.fillStyle = '#333'; ctx.fillRect(sx - 15, sy - 28, 30, 4);
      ctx.fillStyle = hp > 0.5 ? '#4ade80' : hp > 0.25 ? '#fbbf24' : '#ef4444';
      ctx.fillRect(sx - 15, sy - 28, 30 * hp, 4);
      if (m.state === 'chase') {
        ctx.fillStyle = '#ff6b6b'; ctx.font = 'bold 14px sans-serif';
        ctx.fillText('!', sx + 12, sy - 20);
      }
      if (m.isElite) {
        ctx.fillStyle = '#FFD700'; ctx.font = 'bold 10px sans-serif';
        ctx.fillText('精英', sx - 12, sy - 32);
      }
    });

    // 玩家
    const px = (player.x - camera.x) * TILE_SIZE + TILE_SIZE / 2 + ox;
    const py = (player.y - camera.y) * TILE_SIZE + TILE_SIZE / 2 + oy;
    drawPlayerSprite(ctx, px, py, player.facing, animFrame, player.isAttacking, player.invincible);

    // 伤害数字
    damages.forEach(d => {
      ctx.fillStyle = d.color;
      ctx.font = 'bold 14px sans-serif';
      const dx = (d.x - camera.x) * TILE_SIZE + TILE_SIZE / 2 + ox;
      const dy = (d.y - camera.y) * TILE_SIZE + TILE_SIZE / 2 + oy;
      ctx.fillText(`-${d.v}`, dx, dy);
    });
  }, [player, camera, monsters, damages, gameState, animFrame]);

  // ===================== 剧情界面 =====================
  if (gameState === 'story') {
    const cur = STORY_LINES[storyIdx];
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
            {STORY_LINES.map((_, i) => <div key={i} className={`w-2 h-2 rounded-full ${i === storyIdx ? 'bg-amber-400' : i < storyIdx ? 'bg-green-500' : 'bg-slate-600'}`} />)}
          </div>
          <button onClick={() => { if (storyIdx < STORY_LINES.length - 1) setStoryIdx(storyIdx + 1); else setGameState('playing'); }}
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold transition-colors">
            {storyIdx < STORY_LINES.length - 1 ? (typingDone ? '继续 →' : '跳过') : '开始冒险！'}
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
        <button onClick={() => { setPlayer(p => ({ ...p, x: 40, y: 36, hp: 100, mp: 50, energy: 3 })); setMonsters(m => m.map(x => ({ ...x, hp: x.maxHp, state: 'patrol' }))); setGameState('playing'); }}
          className="px-8 py-3 bg-amber-600 text-white rounded-xl font-bold">重新开始</button>
      </div>
    );
  }

  // 奖励弹窗
  if (showRewards && cardRewards.length > 0) {
    const card = cardRewards[0];
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-gradient-to-b from-yellow-900 to-slate-900 rounded-2xl p-8 border border-yellow-500 shadow-2xl max-w-sm w-full mx-4 text-center">
          <div className="text-4xl mb-4">🎉</div>
          <h2 className="text-xl font-bold text-yellow-400 mb-2">获得卡牌！</h2>
          <div className={`bg-slate-800 rounded-xl p-4 mb-4 ${card.rarity >= 4 ? 'border-2 border-yellow-400' : card.rarity >= 3 ? 'border-2 border-purple-400' : 'border border-slate-600'}`}>
            <div className="text-white font-bold text-lg">{card.name}</div>
            <div className="text-yellow-400 text-sm">{RARITY_NAMES[card.rarity]}</div>
            <div className="text-slate-400 text-xs mt-1">{card.description}</div>
            <div className="text-blue-400 text-xs mt-1">费用: {card.energyCost} 能量</div>
          </div>
          <button onClick={() => { setShowRewards(false); setCardRewards([]); }} className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl font-bold">收入卡组</button>
        </div>
      </div>
    );
  }

  // 卡牌游戏弹窗
  if (showCardGame) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl p-6 border border-purple-500 shadow-2xl max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold text-purple-400 mb-4 text-center">🃏 卡牌收藏</h2>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {ALL_CARDS.map(card => (
              <div key={card.id} className={`bg-slate-700 rounded-lg p-2 text-center ${card.rarity >= 4 ? 'border border-yellow-400' : card.rarity >= 3 ? 'border border-purple-400' : ''}`}>
                <div className="text-white text-xs font-bold">{card.name}</div>
                <div className="text-yellow-400 text-[10px]">{RARITY_NAMES[card.rarity]}</div>
                <div className="text-blue-400 text-[10px]">⚡{card.energyCost}</div>
              </div>
            ))}
          </div>
          <button onClick={() => setShowCardGame(false)} className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold">返回游戏</button>
        </div>
      </div>
    );
  }

  // ===================== 游戏主界面 =====================
  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* 顶部状态栏 */}
      <div className="h-14 bg-slate-900/90 border-b border-slate-700 flex items-center px-4 gap-6 z-10">
        <div className="flex items-center gap-2"><span className="text-yellow-400">👤</span><span className="text-white font-bold">{player.level}级</span></div>
        <div className="flex-1 max-w-[200px]">
          <div className="flex justify-between text-xs text-slate-400 mb-1"><span>HP</span><span>{player.hp}/{player.maxHp}</span></div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-green-500 transition-all" style={{ width: `${player.hp / player.maxHp * 100}%` }} /></div>
        </div>
        <div className="flex-1 max-w-[150px]">
          <div className="flex justify-between text-xs text-slate-400 mb-1"><span>MP</span><span>{player.mp}/{player.maxMp}</span></div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-blue-500 transition-all" style={{ width: `${player.mp / player.maxMp * 100}%` }} /></div>
        </div>
        <div className="flex-1 max-w-[150px]">
          <div className="flex justify-between text-xs text-slate-400 mb-1"><span>能量</span><span>{player.energy}/{player.maxEnergy}</span></div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-yellow-500 transition-all" style={{ width: `${player.energy / player.maxEnergy * 100}%` }} /></div>
        </div>
        <div className="text-slate-400 text-sm">EXP: {player.exp}/{player.expToLevel}</div>
      </div>

      {/* 地图画布 */}
      <div className="flex-1 relative overflow-hidden" ref={containerRef}>
        <canvas ref={canvasRef} width={dimensions.width} height={dimensions.height} className="w-full h-full" />

        {/* 虚拟摇杆 */}
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
            <span className="text-xl">⚔️</span><span className="text-[10px]">J攻击</span>
          </button>
          <button onClick={dodge}
            className="w-16 h-16 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 rounded-xl flex flex-col items-center justify-center text-white font-bold shadow-lg active:scale-95 transition-transform">
            <span className="text-xl">💨</span><span className="text-[10px]">空格闪避</span>
          </button>
        </div>

        {/* 安全区提示 */}
        {inSafeZone && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-yellow-600/90 px-4 py-1 rounded-full text-white text-xs font-bold flex items-center gap-2">
            <span>🏰</span> 安全区域
          </div>
        )}

        {/* 交互提示 */}
        {interactionHint && (
          <div className="absolute bottom-28 left-1/2 -translate-x-1/2 bg-purple-600/90 px-4 py-2 rounded-xl text-white text-sm font-bold flex items-center gap-2">
            <span>🃏</span> 按 E 与发牌员对话
          </div>
        )}
      </div>

      {/* 底部提示 */}
      <div className="h-10 bg-slate-900/90 border-t border-slate-700 flex items-center justify-center gap-8 text-slate-400 text-xs">
        <span>🎮 WASD/方向键移动</span>
        <span>⚔️ J攻击 空格闪避</span>
        <span>🏰 城镇内无怪物</span>
        <span>🃏 靠近发牌员按E</span>
      </div>
    </div>
  );
}