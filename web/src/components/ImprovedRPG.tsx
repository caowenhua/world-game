'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Character } from '@/types';
import { characterSave } from '@/lib/api';
import {
  playMoveSound, playAttackSound, playHurtLightSound, playHurtHeavySound,
  playLevelUpSound, playItemSound, playSaveSound, playChestSound,
  playMonsterCry, playMPInsufficientSound, startBGM, stopBGM, resumeAudio, setBGMVolume,
} from './audio';

// ============================================================
//  Pokemon像素风RPG游戏 - 剧情卡牌版
//  核心理念：卡牌是剧情的碎片，推进世界用的
//  第四部分：卡牌类型系统 & 第七部分：发牌员系统
// ============================================================

const TILE_SIZE = 16;
const MAP_WIDTH = 80;
const MAP_HEIGHT = 60;

// ============================================================
//  元素属性系统 (12种属性)
// ============================================================
export type ElementType =
  | 'normal' | 'fire' | 'water' | 'grass' | 'electric'
  | 'ice' | 'fighting' | 'poison' | 'ground' | 'psychic'
  | 'ghost' | 'dragon' | 'dark';

type TypeChart = Record<ElementType, Record<ElementType, number>>;

const TYPE_CHART: TypeChart = {
  normal:   { normal: 1, fire: 1, water: 1, grass: 1, electric: 1, ice: 1, fighting: 1, poison: 1, ground: 1, psychic: 1, ghost: 0, dragon: 1, dark: 1 },
  fire:     { normal: 1, fire: 0.5, water: 0.5, grass: 2, electric: 1, ice: 2, fighting: 1, poison: 1, ground: 1, psychic: 1, ghost: 1, dragon: 0.5, dark: 1 },
  water:    { normal: 1, fire: 2, water: 0.5, grass: 0.5, electric: 1, ice: 1, fighting: 1, poison: 1, ground: 2, psychic: 1, ghost: 1, dragon: 0.5, dark: 1 },
  grass:    { normal: 1, fire: 0.5, water: 2, grass: 0.5, electric: 1, ice: 1, fighting: 1, poison: 0.5, ground: 2, psychic: 1, ghost: 1, dragon: 0.5, dark: 1 },
  electric: { normal: 1, fire: 1, water: 2, grass: 0.5, electric: 0.5, ice: 1, fighting: 1, poison: 1, ground: 0, psychic: 1, ghost: 1, dragon: 0.5, dark: 1 },
  ice:      { normal: 1, fire: 0.5, water: 0.5, grass: 2, electric: 1, ice: 0.5, fighting: 1, poison: 1, ground: 2, psychic: 1, ghost: 1, dragon: 2, dark: 1 },
  fighting: { normal: 2, fire: 1, water: 1, grass: 1, electric: 1, ice: 2, fighting: 1, poison: 0.5, ground: 1, psychic: 0.5, ghost: 0, dragon: 1, dark: 2 },
  poison:   { normal: 1, fire: 1, water: 1, grass: 2, electric: 1, ice: 1, fighting: 1, poison: 0.5, ground: 0.5, psychic: 1, ghost: 0.5, dragon: 1, dark: 1 },
  ground:   { normal: 1, fire: 2, water: 1, grass: 0.5, electric: 2, ice: 1, fighting: 1, poison: 2, ground: 1, psychic: 1, ghost: 1, dragon: 1, dark: 1 },
  psychic:  { normal: 1, fire: 1, water: 1, grass: 1, electric: 1, ice: 1, fighting: 2, poison: 2, ground: 1, psychic: 0.5, ghost: 1, dragon: 1, dark: 0 },
  ghost:    { normal: 0, fire: 1, water: 1, grass: 1, electric: 1, ice: 1, fighting: 1, poison: 1, ground: 1, psychic: 2, ghost: 2, dragon: 1, dark: 0.5 },
  dragon:   { normal: 1, fire: 1, water: 1, grass: 1, electric: 1, ice: 1, fighting: 1, poison: 1, ground: 1, psychic: 1, ghost: 1, dragon: 2, dark: 1 },
  dark:     { normal: 1, fire: 1, water: 1, grass: 1, electric: 1, ice: 1, fighting: 0.5, poison: 1, ground: 1, psychic: 2, ghost: 2, dragon: 1, dark: 0.5 },
};

const ELEMENT_COLORS: Record<ElementType, string> = {
  normal: '#A8A878', fire: '#F08030', water: '#6890F0', grass: '#78C850',
  electric: '#F8D030', ice: '#98D8D8', fighting: '#C03028', poison: '#A040A0',
  ground: '#E0C068', psychic: '#F85888', ghost: '#705898', dragon: '#7038F8', dark: '#705848',
};

const ELEMENT_ICONS: Record<ElementType, string> = {
  normal: '⚪', fire: '🔥', water: '💧', grass: '🌿', electric: '⚡',
  ice: '❄️', fighting: '👊', poison: '☠️', ground: '🌍',
  psychic: '🔮', ghost: '👻', dragon: '🐉', dark: '🌑',
};

const ELEMENT_NAMES: Record<ElementType, string> = {
  normal: '一般', fire: '火', water: '水', grass: '草', electric: '电',
  ice: '冰', fighting: '格斗', poison: '毒', ground: '地面',
  psychic: '超能', ghost: '幽灵', dragon: '龙', dark: '恶',
};

function getTypeEffectivenessText(attackType: ElementType, defenseType: ElementType): string {
  const mult = TYPE_CHART[attackType][defenseType];
  if (mult === 0) return '没有效果';
  if (mult === 2) return '效果拔群!';
  if (mult === 0.5) return '效果不太好';
  return '';
}

function calculateDamage(baseDamage: number, attackType: ElementType, defenseType: ElementType): { damage: number; effectiveness: number } {
  const effectiveness = TYPE_CHART[attackType][defenseType];
  const randomFactor = 0.85 + Math.random() * 0.15;
  const damage = Math.floor(baseDamage * effectiveness * randomFactor);
  return { damage, effectiveness };
}

const COLORS: Record<string, string> = {
  grass1: '#4CAF50', grass2: '#66BB6A', grassAccent: '#81C784',
  path1: '#D7CCC8', path2: '#BCAAA4',
  wall1: '#78909C', wall2: '#607D8B', wallTop: '#90A4AE',
  water1: '#29B6F6', water2: '#4FC3F7', waterShine: '#B3E5FC',
  treeTrunk: '#795548', treeLeaves: '#388E3C', treeLeavesLight: '#4CAF50',
  building: '#FFCA28', buildingRoof: '#E53935', buildingDoor: '#5D4037',
  skyTop: '#E3F2FD', skyBottom: '#BBDEFB',
};

const TERRAIN = {
  GRASS: 0, PATH: 1, WALL: 2, WATER: 3, TREE: 4, BUILDING: 5, BRIDGE: 6, FLOWER: 7,
  DENSE_GRASS: 8, CAVE_ENTRANCE: 9, HIDDEN_PATH: 10, DOOR: 11,
  GYM_FLOOR: 12, SHOP_FLOOR: 13, HOSPITAL_FLOOR: 14, PC_FLOOR: 15,
};

// ============================================================
//  室内地图系统
// ============================================================
type IndoorMapId = 'none' | 'pokemon_gym' | 'shop' | 'hospital' | 'pc_center' | 'cave';

interface IndoorMap {
  id: IndoorMapId; name: string; width: number; height: number;
  terrain: number[][]; playerStart: { x: number; y: number }; exitPos: { x: number; y: number };
}

function createGymMap(): IndoorMap {
  const w = 20, h = 15;
  const terrain: number[][] = [];
  for (let y = 0; y < h; y++) {
    const row: number[] = [];
    for (let x = 0; x < w; x++) {
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) row.push(TERRAIN.WALL);
      else if (x === w - 2 && y === h - 2) row.push(TERRAIN.DOOR);
      else row.push(TERRAIN.GYM_FLOOR);
    }
    terrain.push(row);
  }
  return { id: 'pokemon_gym', name: '平和道馆', width: w, height: h, terrain, playerStart: { x: 10, y: 12 }, exitPos: { x: w - 1, y: h - 2 } };
}

function createShopMap(): IndoorMap {
  const w = 16, h = 12;
  const terrain: number[][] = [];
  for (let y = 0; y < h; y++) {
    const row: number[] = [];
    for (let x = 0; x < w; x++) {
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) row.push(TERRAIN.WALL);
      else if (x === 0 && y === Math.floor(h / 2)) row.push(TERRAIN.DOOR);
      else row.push(TERRAIN.SHOP_FLOOR);
    }
    terrain.push(row);
  }
  return { id: 'shop', name: '平和商店', width: w, height: h, terrain, playerStart: { x: w - 3, y: Math.floor(h / 2) }, exitPos: { x: 0, y: Math.floor(h / 2) } };
}

function createHospitalMap(): IndoorMap {
  const w = 18, h = 14;
  const terrain: number[][] = [];
  for (let y = 0; y < h; y++) {
    const row: number[] = [];
    for (let x = 0; x < w; x++) {
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) row.push(TERRAIN.WALL);
      else if (x === 0 && y === Math.floor(h / 2)) row.push(TERRAIN.DOOR);
      else row.push(TERRAIN.HOSPITAL_FLOOR);
    }
    terrain.push(row);
  }
  return { id: 'hospital', name: '平和医院', width: w, height: h, terrain, playerStart: { x: w - 3, y: Math.floor(h / 2) }, exitPos: { x: 0, y: Math.floor(h / 2) } };
}

function createPCMap(): IndoorMap {
  const w = 20, h = 14;
  const terrain: number[][] = [];
  for (let y = 0; y < h; y++) {
    const row: number[] = [];
    for (let x = 0; x < w; x++) {
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) row.push(TERRAIN.WALL);
      else if (x === 0 && y === Math.floor(h / 2)) row.push(TERRAIN.DOOR);
      else row.push(TERRAIN.PC_FLOOR);
    }
    terrain.push(row);
  }
  return { id: 'pc_center', name: 'PC中心', width: w, height: h, terrain, playerStart: { x: w - 3, y: Math.floor(h / 2) }, exitPos: { x: 0, y: Math.floor(h / 2) } };
}

function createCaveMap(): IndoorMap {
  const w = 30, h = 25;
  const terrain: number[][] = [];
  for (let y = 0; y < h; y++) {
    const row: number[] = [];
    for (let x = 0; x < w; x++) {
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) row.push(TERRAIN.WALL);
      else if (x === Math.floor(w / 2) && y === 1) row.push(TERRAIN.DOOR);
      else row.push(TERRAIN.WALL);
    }
    terrain.push(row);
  }
  for (let y = 2; y < h - 1; y++) {
    for (let x = 2; x < w - 2; x++) {
      const r = (x * 7919 + y * 6271) % 100;
      if (r < 60) terrain[y][x] = TERRAIN.PATH;
    }
  }
  return { id: 'cave', name: '羊蹄山洞窟', width: w, height: h, terrain, playerStart: { x: Math.floor(w / 2), y: 2 }, exitPos: { x: Math.floor(w / 2), y: 0 } };
}

const INDOOR_MAPS: Record<IndoorMapId, IndoorMap> = {
  none: { id: 'none', name: '', width: 0, height: 0, terrain: [], playerStart: { x: 0, y: 0 }, exitPos: { x: 0, y: 0 } },
  pokemon_gym: createGymMap(), shop: createShopMap(), hospital: createHospitalMap(),
  pc_center: createPCMap(), cave: createCaveMap(),
};

// 建筑入口位置
interface BuildingEntry { x: number; y: number; indoorMapId: IndoorMapId; }
const BUILDING_ENTRIES: BuildingEntry[] = [
  { x: 30, y: 32, indoorMapId: 'pokemon_gym' },
  { x: 50, y: 35, indoorMapId: 'shop' },
  { x: 36, y: 38, indoorMapId: 'hospital' },
  { x: 44, y: 40, indoorMapId: 'pc_center' },
  { x: 38, y: 8, indoorMapId: 'cave' },
];

// ============================================================
//  第四部分：卡牌类型（CardType）
// ============================================================
type CardType =
  | 'MAIN_STORY'    // 主线剧情
  | 'SIDE_STORY'    // 支线故事
  | 'MECHANISM'     // 机制体验（武器解锁等）
  | 'STAT_UP'       // 数值提升（生命值等）
  | 'EMOTION'       // 情感联结（同伴羁绊）
  | 'MOOD'          // 情绪目标（孤寂感等）
  | 'ECONOMY'       // 经济系统（商人交互）
  | 'EMPTY';        // 空白（什么都不做）

// ============================================================
//  事件卡牌接口
// ============================================================
interface EventCard {
  id: string;
  name: string;
  type: CardType;
  rarity: 1 | 2 | 3 | 4 | 5;
  description: string;
  cost?: string;          // 黄金法则1：告诉玩家成本
  storyContent?: string;  // 黄金法则4：交付方式
  effect?: string;         // 对玩家状态的影响
}

const RARITY_COLORS: Record<number, string> = {
  1: '#9CA3AF',
  2: '#22C55E',
  3: '#3B82F6',
  4: '#A855F7',
  5: '#F59E0B',
};

const RARITY_NAMES: Record<number, string> = {
  1: '⭐', 2: '⭐⭐', 3: '⭐⭐⭐', 4: '⭐⭐⭐⭐', 5: '⭐⭐⭐⭐⭐',
};

const CARD_TYPE_NAMES: Record<CardType, string> = {
  MAIN_STORY: '主线剧情',
  SIDE_STORY: '支线故事',
  MECHANISM: '机制体验',
  STAT_UP: '数值提升',
  EMOTION: '情感联结',
  MOOD: '情绪目标',
  ECONOMY: '经济系统',
  EMPTY: '空白',
};

const CARD_TYPE_ICONS: Record<CardType, string> = {
  MAIN_STORY: '📜',
  SIDE_STORY: '📖',
  MECHANISM: '⚔️',
  STAT_UP: '📈',
  EMOTION: '💕',
  MOOD: '🌙',
  ECONOMY: '💰',
  EMPTY: '💨',
};

// ============================================================
//  主线剧情卡（MAIN_STORY）
// ============================================================
const MAIN_STORY_CARDS: EventCard[] = [
  {
    id: 'ms_001',
    name: '千年契约',
    type: 'MAIN_STORY',
    rarity: 5,
    description: '揭示虚渊古神契约的真相',
    cost: '需要集齐"觉醒者碎片"×5',
    storyContent: '羊蹄山之魂在呼唤你...命运的红线已经绑在你的手上。',
  },
  {
    id: 'ms_002',
    name: '觉醒者之血',
    type: 'MAIN_STORY',
    rarity: 5,
    description: '林夜的真实身份揭晓',
    cost: '需要击败"亡灵巫妖"',
    storyContent: '你的血液中流淌着千年初代觉醒者的力量...',
  },
  {
    id: 'ms_003',
    name: '虚渊的威胁',
    type: 'MAIN_STORY',
    rarity: 4,
    description: '王城政变的序幕',
    cost: '需要"残破的密信"',
    storyContent: '一封密信，揭开了一场惊天的阴谋...',
  },
  {
    id: 'ms_004',
    name: '影子契约',
    type: 'MAIN_STORY',
    rarity: 4,
    description: '与黑影的交易',
    cost: '需要收集"暗影碎片"×3',
    storyContent: '"签下契约，你将获得我的帮助...但代价是——"',
  },
];

// ============================================================
//  支线故事卡（SIDE_STORY）
// ============================================================
const SIDE_STORY_CARDS: EventCard[] = [
  {
    id: 'ss_001',
    name: '老猎人的往事',
    type: 'SIDE_STORY',
    rarity: 3,
    description: '初代觉醒者徒弟的秘密',
    cost: '需要与老猎人对话',
    storyContent: '"孩子，有些真相知道了会让人痛苦..."',
  },
  {
    id: 'ss_002',
    name: '月石项链',
    type: 'SIDE_STORY',
    rarity: 4,
    description: '苏婉儿母亲的遗物',
    cost: '需要完成苏婉儿的信任任务',
    storyContent: '月光下，项链闪烁着神秘的光芒...',
  },
  {
    id: 'ss_003',
    name: '铁面的抉择',
    type: 'SIDE_STORY',
    rarity: 4,
    description: '赏金猎人的内心独白',
    cost: '需要击败铁面',
    storyContent: '"别跟我谈感情。感情值多少钱？"',
  },
  {
    id: 'ss_004',
    name: '失踪的商队',
    type: 'SIDE_STORY',
    rarity: 3,
    description: '边境神秘商队失踪事件',
    cost: '需要调查商队营地',
    storyContent: '空荡荡的帐篷里，只留下一封未完成的信...',
  },
  {
    id: 'ss_005',
    name: '亡眼印记',
    type: 'SIDE_STORY',
    rarity: 3,
    description: '虚渊势力的追踪标记',
    cost: '需要被敌人命中',
    storyContent: '你的手臂上出现了诡异的印记——它在召唤着什么...',
  },
];

// ============================================================
//  机制体验卡（MECHANISM）
// ============================================================
const MECHANISM_CARDS: EventCard[] = [
  {
    id: 'mc_001',
    name: '武器解锁：破魔剑',
    type: 'MECHANISM',
    rarity: 3,
    description: '解锁新武器',
    cost: '击败"黑暗骑士"',
    effect: '攻击力+20',
  },
  {
    id: 'mc_002',
    name: '技能解锁：影分身',
    type: 'MECHANISM',
    rarity: 4,
    description: '解锁新技能',
    cost: '收集"暗影碎片"×3',
    effect: '可召唤分身',
  },
  {
    id: 'mc_003',
    name: '武器解锁：龙鳞弓',
    type: 'MECHANISM',
    rarity: 4,
    description: '解锁远程武器',
    cost: '击败"精英灰狼"',
    effect: '远程攻击能力',
  },
  {
    id: 'mc_004',
    name: '防具解锁：铁壁甲',
    type: 'MECHANISM',
    rarity: 3,
    description: '解锁新防具',
    cost: '击败"哥布林战士"',
    effect: '防御力+15',
  },
];

// ============================================================
//  数值提升卡（STAT_UP）
// ============================================================
const STAT_UP_CARDS: EventCard[] = [
  {
    id: 'stat_001',
    name: '生命强化',
    type: 'STAT_UP',
    rarity: 1,
    description: '最大生命值+10',
    cost: '消耗100金币',
    effect: 'HP上限+10',
  },
  {
    id: 'stat_002',
    name: '攻击强化',
    type: 'STAT_UP',
    rarity: 2,
    description: '攻击力+5',
    cost: '击败10只怪物',
    effect: 'ATK+5',
  },
  {
    id: 'stat_003',
    name: '防御强化',
    type: 'STAT_UP',
    rarity: 2,
    description: '防御力+3',
    cost: '击败8只怪物',
    effect: 'DEF+3',
  },
  {
    id: 'stat_004',
    name: '生命强化Ⅱ',
    type: 'STAT_UP',
    rarity: 3,
    description: '最大生命值+25',
    cost: '消耗300金币',
    effect: 'HP上限+25',
  },
  {
    id: 'stat_005',
    name: '攻击强化Ⅱ',
    type: 'STAT_UP',
    rarity: 3,
    description: '攻击力+10',
    cost: '击败25只怪物',
    effect: 'ATK+10',
  },
];

// ============================================================
//  情感联结卡（EMOTION）
// ============================================================
const EMOTION_CARDS: EventCard[] = [
  {
    id: 'emo_001',
    name: '陈岳的信任',
    type: 'EMOTION',
    rarity: 3,
    description: '与哨兵队长的羁绊',
    cost: '完成3次商队护送任务',
    storyContent: '"你是值得信赖的人..." - 陈岳',
  },
  {
    id: 'emo_002',
    name: '苏婉儿的心',
    type: 'EMOTION',
    rarity: 4,
    description: '与苏婉儿的羁绊',
    cost: '帮她找到月石项链',
    storyContent: '"我会记住你的..." - 苏婉儿',
  },
  {
    id: 'emo_003',
    name: '老猎人的认可',
    type: 'EMOTION',
    rarity: 3,
    description: '与老猎人的羁绊',
    cost: '听完老猎人的故事',
    storyContent: '"你有权知道真相，年轻人..." - 老猎人',
  },
  {
    id: 'emo_004',
    name: '黑影的敬意',
    type: 'EMOTION',
    rarity: 4,
    description: '与影子首领的羁绊',
    cost: '完成影子组织任务',
    storyContent: '"有意思...你比我想象的要强。" - 黑影',
  },
];

// ============================================================
//  情绪目标卡（MOOD）
// ============================================================
const MOOD_CARDS: EventCard[] = [
  {
    id: 'mood_001',
    name: '孤寂之旅',
    type: 'MOOD',
    rarity: 2,
    description: '在荒野中独自行走',
    cost: '不与任何人对话，直达目的地',
    storyContent: '风在耳边呼啸，只有你自己的脚步声...',
  },
  {
    id: 'mood_002',
    name: '篝火边的安宁',
    type: 'MOOD',
    rarity: 2,
    description: '在营地休息',
    cost: '找到篝火营地',
    storyContent: '火光温暖，驱散了夜晚的寒意...',
  },
  {
    id: 'mood_003',
    name: '迷雾中的迷茫',
    type: 'MOOD',
    rarity: 2,
    description: '在迷雾区域探索',
    cost: '进入羊蹄山迷雾',
    storyContent: '白色的迷雾包围着你，分不清方向...',
  },
  {
    id: 'mood_004',
    name: '月下的沉思',
    type: 'MOOD',
    rarity: 3,
    description: '在月光下思考人生',
    cost: '在夜晚找到安静的地方',
    storyContent: '月光洒在你的脸上，思绪飘向远方...',
  },
];

// ============================================================
//  经济系统卡（ECONOMY）
// ============================================================
const ECONOMY_CARDS: EventCard[] = [
  {
    id: 'eco_001',
    name: '神秘商人',
    type: 'ECONOMY',
    rarity: 2,
    description: '随机购买道具',
    cost: '金币',
    storyContent: '"来看看我的货物吧，冒险者..."',
  },
  {
    id: 'eco_002',
    name: '悬赏公告板',
    type: 'ECONOMY',
    rarity: 2,
    description: '接取悬赏任务',
    cost: '无',
    storyContent: '最新的悬赏令：消灭10只哥布林，赏金500金币！',
  },
  {
    id: 'eco_003',
    name: '宝藏商人',
    type: 'ECONOMY',
    rarity: 3,
    description: '稀有道具商人',
    cost: '大量金币',
    storyContent: '"这可是难得一见的宝贝，要看看吗？"',
  },
  {
    id: 'eco_004',
    name: '碎片兑换',
    type: 'ECONOMY',
    rarity: 2,
    description: '用碎片兑换奖励',
    cost: '收集3个相同碎片',
    storyContent: '"这些碎片...或许能合成些有趣的东西。"',
  },
];

// ============================================================
//  空白卡（EMPTY）
// ============================================================
const EMPTY_CARDS: EventCard[] = [
  {
    id: 'empty_001',
    name: '平静的一天',
    type: 'EMPTY',
    rarity: 1,
    description: '今天什么都没发生',
    cost: '无',
    storyContent: '风平浪静，继续前进吧...',
  },
  {
    id: 'empty_002',
    name: '宁静时刻',
    type: 'EMPTY',
    rarity: 1,
    description: '短暂的休息时光',
    cost: '无',
    storyContent: '享受这片刻的宁静吧...',
  },
];

// 合并所有卡牌
const ALL_EVENT_CARDS: EventCard[] = [
  ...MAIN_STORY_CARDS,
  ...SIDE_STORY_CARDS,
  ...MECHANISM_CARDS,
  ...STAT_UP_CARDS,
  ...EMOTION_CARDS,
  ...MOOD_CARDS,
  ...ECONOMY_CARDS,
  ...EMPTY_CARDS,
];

// ============================================================
//  第七部分：发牌员类型（DealerType）
// ============================================================
type DealerType = 'NPC' | 'BOARD' | 'ENEMY' | 'CAMP' | 'ENCOUNTER' | 'MERCHANT' | 'ENVIRONMENT' | 'WANDERER';

// 发牌员配置
interface Dealer {
  id: string;
  type: DealerType;
  x: number;
  y: number;
  name: string;
  supportedCardTypes: CardType[];
  color: string;
  icon: string;
}

// 发牌员出现在地图上
const DEALERS: Dealer[] = [
  // NPC发牌员
  {
    id: 'dealer_chency',
    type: 'NPC',
    x: 40,
    y: 36,
    name: '陈岳',
    supportedCardTypes: ['MAIN_STORY', 'EMOTION'],
    color: '#2962D4',
    icon: 'CY',
  },
  {
    id: 'dealer_suwaner',
    type: 'NPC',
    x: 55,
    y: 40,
    name: '苏婉儿',
    supportedCardTypes: ['SIDE_STORY', 'EMOTION'],
    color: '#E0E7FF',
    icon: 'SW',
  },
  {
    id: 'dealer_oldhunter',
    type: 'NPC',
    x: 25,
    y: 25,
    name: '老猎人',
    supportedCardTypes: ['SIDE_STORY', 'MECHANISM'],
    color: '#78350F',
    icon: 'LH',
  },
  // 公告板
  {
    id: 'board_001',
    type: 'BOARD',
    x: 42,
    y: 38,
    name: '悬赏公告板',
    supportedCardTypes: ['ECONOMY', 'STAT_UP'],
    color: '#7C3AED',
    icon: '📋',
  },
  // 营地（全局）
  {
    id: 'camp_001',
    type: 'CAMP',
    x: 45,
    y: 45,
    name: '篝火营地',
    supportedCardTypes: ['MOOD', 'STAT_UP'],
    color: '#F59E0B',
    icon: '🔥',
  },
  // 商人
  {
    id: 'merchant_001',
    type: 'MERCHANT',
    x: 50,
    y: 42,
    name: '流浪商人',
    supportedCardTypes: ['ECONOMY', 'MECHANISM'],
    color: '#22C55E',
    icon: '💰',
  },
  // 环境线索
  {
    id: 'env_001',
    type: 'ENVIRONMENT',
    x: 30,
    y: 20,
    name: '古老石碑',
    supportedCardTypes: ['MAIN_STORY', 'EMPTY'],
    color: '#6B7280',
    icon: '🗿',
  },
  // P2-3: 酒馆浪人类型 - 神秘线索型NPC
  {
    id: 'dealer_wanderer',
    type: 'WANDERER',
    x: 40,
    y: 36,
    name: '神秘浪人',
    supportedCardTypes: ['MAIN_STORY', 'SIDE_STORY', 'MOOD'],
    color: '#9B59B6',
    icon: '🌙',
  },
];

const DEALER_TYPE_NAMES: Record<DealerType, string> = {
  NPC: 'NPC',
  BOARD: '公告板',
  ENEMY: '敌人',
  CAMP: '营地',
  ENCOUNTER: '遭遇',
  MERCHANT: '商人',
  ENVIRONMENT: '环境',
  WANDERER: '浪人',
};

// ============================================================
//  剧情FLAG系统 - 修复#1: 剧情与地图联动
// ============================================================
type StoryFlag =
  | 'awakening'      // 觉醒篇章触发 - 石碑发光
  | 'chapter_1'       // 第一章完成
  | 'chapter_2'       // 第二章完成
  | 'boss_skeleton'   // 击杀骷髅战士
  | 'boss_dragon'    // 击杀龙蜥
  | 'npc_chenyu_trust' // 陈岳信任
  | 'npc_suwaner_heart' // 苏婉儿心
  | 'merchant_first'  // 首次与商人交易
  | 'camp_rest'       // 首次在营地休息
  | 'stone_tablet_read'; // 首次阅读石碑

interface DialogueBubble {
  id: string;
  x: number;
  y: number;
  text: string;
  speaker?: string;
  duration: number; // ms
}

// ============================================================
//  P0-2: 动态遭遇系统
// ============================================================
interface DynamicEncounter {
  id: string;
  type: 'TRAVELER' | 'BANDIT_PATROL';
  x: number;
  y: number;
  name: string;
  dialogue: string;
  despawnTimer: number;
  active: boolean;
}

const DYNAMIC_ENCOUNTERS: DynamicEncounter[] = [
  { id: 'traveler_001', type: 'TRAVELER', x: 0, y: 0, name: '路过的旅人', dialogue: '"前面不太平，小心点。"', despawnTimer: 0, active: false },
  { id: 'bandit_001', type: 'BANDIT_PATROL', x: 0, y: 0, name: '巡逻匪帮', dialogue: '"此路是我开..."', despawnTimer: 0, active: false },
];

// ============================================================
//  P1-2: 营地访客系统
// ============================================================
const CAMP_VISITORS: { name: string; dialogue: string; cardType: CardType }[] = [
  { name: '神秘访客', dialogue: '"你也在寻找虚渊的秘密吗？"', cardType: 'MAIN_STORY' },
  { name: '老兵', dialogue: '"年轻人，这片土地曾经..."', cardType: 'SIDE_STORY' },
  { name: '走失的孩子', dialogue: '"我找不到回家的路了..."', cardType: 'EMOTION' },
];

// 剧情碎片 - 显示在屏幕边缘
const EDGE_NARRATIVES: Record<StoryFlag, string[]> = {
  awakening: [
    '虚渊的阴影正在逼近...',
    '觉醒者，你的命运已经注定。',
  ],
  chapter_1: [
    '在羊蹄山的脚下，新的冒险开始了。',
    '那个神秘的声音...究竟是谁？',
  ],
  chapter_2: [
    '王城的政变即将拉开序幕。',
    '影子们在暗中蠢蠢欲动...',
  ],
  boss_skeleton: [
    '骷髅战士倒下了，它的灵魂去了哪里？',
  ],
  boss_dragon: [
    '龙蜥幼体的咆哮回荡在山谷中...',
  ],
  npc_chenyu_trust: [
    '陈岳拍了拍你的肩膀："好样的，冒险者！"',
  ],
  npc_suwaner_heart: [
    '月光下，苏婉儿的眼眸闪烁着泪光...',
  ],
  merchant_first: [
    '流浪商人露出了狡黠的笑容...',
  ],
  camp_rest: [
    '篝火的温暖驱散了夜晚的寒意。',
    '今夜的星空格外明亮...',
  ],
  stone_tablet_read: [
    '石碑上的文字似乎在诉说着千年的秘密...',
  ],
};

// NPC对话内容 - 根据flag变化
const NPC_DIALOGUES: Record<string, { default: string[]; flagged: Partial<Record<StoryFlag, string[]>> }> = {
  dealer_chency: {
    default: [
      '我是陈岳，边境哨站的队长。',
      '最近城外不太平，小心怪物。',
    ],
    flagged: {
      awakening: ['觉醒者...你的眼神变了。', '羊蹄山之魂在注视着你。'],
      npc_chenyu_trust: ['你已经成为值得信赖的伙伴了。', '继续前进吧，冒险者！'],
    },
  },
  dealer_suwaner: {
    default: [
      '我叫苏婉儿，是镇上的医生。',
      '有什么事可以来找我。',
    ],
    flagged: {
      npc_suwaner_heart: ['你帮我找到了月石项链...谢谢你。', '愿月光守护你。'],
    },
  },
  dealer_oldhunter: {
    default: [
      '老夫是老猎人，在这片土地生活了一辈子。',
      '有些真相...知道了反而是负担。',
    ],
    flagged: {
      awakening: ['你终于来了，觉醒者。', '羊蹄山的传说是真的...'],
    },
  },
};

// 石碑铭文 - 环境发牌员对话
const STONE_TABLET_INScriptions: string[][] = [
  ['羊蹄山之魂，沉睡千年...'],
  ['觉醒者的血脉，注定要醒来。'],
  ['虚渊之门，终将开启...'],
  ['命运的牌局，已经开始。'],
  ['继续前进吧，觉醒者。没有回头路。'],
];

// ============================================================
//  从发牌员获取卡牌
// ============================================================
function getCardsFromDealer(dealer: Dealer): EventCard[] {
  const cards: EventCard[] = [];
  for (const cardType of dealer.supportedCardTypes) {
    const typeCards = ALL_EVENT_CARDS.filter(c => c.type === cardType);
    cards.push(...typeCards);
  }
  return cards;
}

function drawRandomCardFromDealer(dealer: Dealer): EventCard | null {
  const cards = getCardsFromDealer(dealer);
  if (cards.length === 0) return null;
  const weights = cards.map(c => 6 - c.rarity);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  for (let i = 0; i < cards.length; i++) {
    random -= weights[i];
    if (random <= 0) return cards[i];
  }
  return cards[cards.length - 1];
}

// ============================================================
//  P0-1: 发牌员对话生成
// ============================================================
function getDealerDialogues(dealer: Dealer): string[] {
  const defaultDialogues: Record<DealerType, string[]> = {
    NPC: [
      '我是这片土地的守护者，见证了无数冒险者的来来去去。',
      '虚渊的阴影正在逼近，但你并不孤单。',
    ],
    BOARD: [
      '悬赏公告板上记录着这片土地上最危险的任务。',
      '完成悬赏可以获得丰厚的奖励，快来看看吧！',
    ],
    ENEMY: [
      '这些怪物盘踞在荒野中，威胁着过往的旅人。',
    ],
    CAMP: [
      '篝火在夜色中跳动，驱散了寒冷与恐惧。',
      '在这里休息一会儿吧，明天的路还很长。',
    ],
    ENCOUNTER: [
      '路途中总会遇到意想不到的人或事。',
      '每一次相遇都是命运的安排。',
    ],
    MERCHANT: [
      '我收集了各种珍稀物品，或许有你需要的。',
      '金币在这里很有用，考虑一下我的货物吧。',
    ],
    ENVIRONMENT: [
      '石碑上刻着古老的文字，诉说着久远的故事。',
      '这片土地蕴藏着无数秘密，等待着被发现。',
    ],
    WANDERER: [
      '我是一个流浪者，在这个世界中寻找着什么。',
      '羊蹄山的传说...你听说过吗？',
    ],
  };

  const dialogues = defaultDialogues[dealer.type] || defaultDialogues.NPC;
  // 添加发牌员个性化台词
  const personalizedHint = `发牌员 ${dealer.name} 注视着你，命运的牌局即将开始...`;
  return [dialogues[Math.floor(Math.random() * dialogues.length)], personalizedHint];
}

const STORY_LINES = [
  { speaker: '旁白', title: '', content: '西境王国边境，羊蹄山脚下。\n一个流浪剑客踏上这片神秘的土地...' },
  { speaker: '神秘声音', title: '???', content: '觉醒者...你终于来了。\n羊蹄山之魂在呼唤你。' },
  { speaker: '哨兵队长', title: '边境哨站', content: '站住！你是新来的冒险者？\n最近城外不太平，小心怪物。' },
  { speaker: '哨兵队长', title: '边境哨站', content: '在镇子里是安全的。\n去草地打怪练级吧！' },
  { speaker: '发牌员', title: '酒馆门口', content: '嘿，冒险者！想来一把卡牌游戏吗？\n靠近我就可以开始游戏！' },
];

// ============================================================
//  修复#3: 完整存档系统 - SaveData接口
// ============================================================
interface SaveData {
  x: number;
  y: number;
  hasSeenIntro: boolean;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  level: number;
  exp: number;
  expToLevel: number;
  gold: number;
  collectedCards: EventCard[];
  deckIndex: number;
  storyFlags: StoryFlag[];
  consecutiveDeaths: number;
  // 玩家永久属性
  atk: number;
  def: number;
  // 室内地图位置
  indoorMapId: IndoorMapId;
  outdoorPlayerPos: { x: number; y: number };
  // Bug #10: 悬赏板任务进度
  boardProgress: Record<string, number>;
}

const SAVE_KEY = 'improved_rpg_save';

function saveGame(data: SaveData): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    playSaveSound();
  } catch (e) {
    console.warn('Failed to save game:', e);
  }
}

function loadGame(): SaveData | null {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      return JSON.parse(saved) as SaveData;
    }
  } catch (e) {
    console.warn('Failed to load game:', e);
  }
  return null;
}

// ============================================================
//  修复#2: 自适应难度系统
// ============================================================
interface AdaptiveDifficulty {
  consecutiveDeaths: number;
  atkBonus: number;    // 百分比加成
  defBonus: number;    // 百分比加成
  isBuffed: boolean;
}

const DEATH_THRESHOLD = 3;
const DEATH_ATK_BONUS = 20;  // 20%
const DEATH_DEF_BONUS = 10;  // 10%

// 地图区域设计（20个联通区域）
function createWorldMap(): number[][] {
  const m: number[][] = [];
  const rng = (x: number, y: number, seed: number): number => {
    return ((x * 7919 + y * 6271 + seed * 104729) % 233280) / 233280;
  };
  for (let y = 0; y < MAP_HEIGHT; y++) {
    const row: number[] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      const r = () => rng(x, y, Date.now() >> 10);
      // === 边界 ===
      if (x === 0 || y === 0 || x === MAP_WIDTH - 1 || y === MAP_HEIGHT - 1) { row.push(TERRAIN.WALL); }
      // 区域1: 平和镇中心 - 中央广场
      else if (x >= 35 && x <= 45 && y >= 32 && y <= 42) {
        row.push(TERRAIN.PATH);
      }
      // 区域2: 平和镇建筑群 - 东侧
      else if (x >= 28 && x <= 34 && y >= 30 && y <= 44) {
        const isBuilding = ((x + y) % 3 === 0) || ((x === 28 || x === 34 || y === 30 || y === 44));
        row.push(isBuilding ? TERRAIN.BUILDING : TERRAIN.PATH);
      }
      // 区域3: 平和镇建筑群 - 西侧
      else if (x >= 46 && x <= 52 && y >= 30 && y <= 44) {
        const isBuilding = ((x + y) % 3 === 1) || ((x === 46 || x === 52 || y === 30 || y === 44));
        row.push(isBuilding ? TERRAIN.BUILDING : TERRAIN.PATH);
      }
      // 区域4: 平和镇北门 - 通往北方
      else if (x >= 37 && x <= 43 && y >= 24 && y <= 28) {
        row.push(TERRAIN.PATH);
      }
      // 区域5: 平和镇南门 - 通往南方
      else if (x >= 37 && x <= 43 && y >= 46 && y <= 50) {
        row.push(TERRAIN.PATH);
      }
      // 区域6: 东门 - 通往东海
      else if (x >= 53 && x <= 58 && y >= 35 && y <= 39) {
        row.push(TERRAIN.PATH);
      }
      // 区域7: 西城门外 - 通往西山
      else if (x >= 27 && x <= 30 && y >= 35 && y <= 39) {
        row.push(TERRAIN.PATH);
      }
      // 区域8: 北部草原（新手区）- 羊蹄山脚
      else if (x >= 20 && x <= 60 && y >= 10 && y <= 22) {
        row.push(r() < 0.85 ? TERRAIN.GRASS : TERRAIN.TREE);
      }
      // 区域9: 北部森林（怪物区1）
      else if (x >= 5 && x <= 18 && y >= 8 && y <= 20) {
        row.push(r() < 0.65 ? TERRAIN.TREE : r() < 0.85 ? TERRAIN.GRASS : TERRAIN.TREE);
      }
      // 区域10: 北部花海
      else if (x >= 56 && x <= 75 && y >= 5 && y <= 18) {
        row.push(r() < 0.5 ? TERRAIN.FLOWER : r() < 0.9 ? TERRAIN.GRASS : TERRAIN.TREE);
      }
      // 区域11: 东海海岸 - 东南沿海
      else if (x >= 70 && x <= 78 && y >= 10 && y <= 55) {
        row.push(r() < 0.6 ? TERRAIN.WATER : r() < 0.85 ? TERRAIN.GRASS : TERRAIN.TREE);
      }
      // 区域12: 东海岸小路
      else if (x >= 62 && x <= 68 && y >= 8 && y <= 55) {
        row.push(r() < 0.75 ? TERRAIN.PATH : TERRAIN.GRASS);
      }
      // 区域13: 西山森林（怪物区2）
      else if (x >= 2 && x <= 18 && y >= 25 && y <= 55) {
        row.push(r() < 0.6 ? TERRAIN.GRASS : r() < 0.85 ? TERRAIN.TREE : TERRAIN.TREE);
      }
      // 区域14: 西山古道
      else if (x >= 18 && x <= 26 && y >= 25 && y <= 50) {
        row.push(r() < 0.8 ? TERRAIN.PATH : TERRAIN.GRASS);
      }
      // 区域15: 南部平原（主线推进区）
      else if (x >= 20 && x <= 60 && y >= 50 && y <= 58) {
        row.push(r() < 0.9 ? TERRAIN.GRASS : TERRAIN.TREE);
      }
      // 区域16: 东南沼泽（前哨区域）
      else if (x >= 60 && x <= 68 && y >= 48 && y <= 58) {
        row.push(r() < 0.4 ? TERRAIN.WATER : r() < 0.7 ? TERRAIN.GRASS : TERRAIN.TREE);
      }
      // 区域17: 羊蹄山脚下（主线剧情触发点）
      else if (x >= 30 && x <= 50 && y >= 2 && y <= 8) {
        row.push(r() < 0.6 ? TERRAIN.GRASS : r() < 0.85 ? TERRAIN.TREE : TERRAIN.PATH);
      }
      // 区域18: 中央河流
      else if (x >= 26 && x <= 28 && y >= 5 && y <= 55) {
        row.push(TERRAIN.WATER);
      }
      // 区域19: 中央河流桥梁
      else if (x >= 25 && x <= 30 && y >= 30 && y <= 33) {
        row.push(TERRAIN.BRIDGE);
      }
      // 区域20: 城外荒野（自由探索区）
      else if (x >= 55 && x <= 70 && y >= 22 && y <= 48) {
        row.push(r() < 0.7 ? TERRAIN.GRASS : r() < 0.9 ? TERRAIN.TREE : TERRAIN.TREE);
      }
      // 区域21: 森林湖泊
      else if (x >= 8 && x <= 16 && y >= 18 && y <= 24) {
        row.push(r() < 0.5 ? TERRAIN.WATER : r() < 0.85 ? TERRAIN.GRASS : TERRAIN.TREE);
      }
      // 区域22: 隐秘山谷
      else if (x >= 1 && x <= 12 && y >= 1 && y <= 7) {
        row.push(r() < 0.5 ? TERRAIN.GRASS : r() < 0.8 ? TERRAIN.TREE : TERRAIN.PATH);
      }
      // 区域23: 南门外的古道
      else if (x >= 30 && x <= 50 && y >= 48 && y <= 52) {
        row.push(TERRAIN.PATH);
      }
      // 区域24: 西北荒原（高级区）
      else if (x >= 1 && x <= 18 && y >= 50 && y <= 58) {
        row.push(r() < 0.6 ? TERRAIN.GRASS : r() < 0.85 ? TERRAIN.TREE : TERRAIN.WALL);
      }
      // 区域25: 其他草地
      else {
        row.push(r() < 0.8 ? TERRAIN.GRASS : TERRAIN.TREE);
      }
    }
    m.push(row);
  }
  return m;
}

// ============================================================
//  卡牌渲染函数
// ============================================================
function renderEventCard(c: EventCard, compact = false) {
  const rarityColor = RARITY_COLORS[c.rarity];
  const typeIcon = CARD_TYPE_ICONS[c.type];
  const typeName = CARD_TYPE_NAMES[c.type];

  if (compact) {
    return (
      <div key={c.id} style={{ borderColor: rarityColor, borderWidth: 1, borderRadius: 4, padding: 4, background: '#1a1a2e' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>{typeIcon}</span>
          <span style={{ color: rarityColor, fontSize: 10 }}>{RARITY_NAMES[c.rarity]}</span>
        </div>
        <div style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>{c.name}</div>
      </div>
    );
  }

  return (
    <div key={c.id} style={{ borderColor: rarityColor, borderWidth: 2, borderRadius: 8, padding: 12, background: '#1a1a2e', marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>{typeIcon}</span>
          <span style={{ color: '#9CA3AF', fontSize: 10 }}>{typeName}</span>
        </div>
        <span style={{ color: rarityColor, fontSize: 11 }}>{RARITY_NAMES[c.rarity]}</span>
      </div>
      <div style={{ color: 'white', fontWeight: 'bold', fontSize: 14, marginBottom: 4 }}>{c.name}</div>
      <div style={{ color: '#9CA3AF', fontSize: 11, lineHeight: 1.4, marginBottom: 6 }}>{c.description}</div>
      {c.cost && (
        <div style={{ color: '#F97316', fontSize: 10, marginBottom: 4 }}>
          💎 成本：{c.cost}
        </div>
      )}
      {c.storyContent && (
        <div style={{ color: '#A78BFA', fontSize: 10, fontStyle: 'italic', marginBottom: 4, paddingTop: 4, borderTop: '1px solid #333' }}>
          📖 {c.storyContent}
        </div>
      )}
      {c.effect && (
        <div style={{ color: '#4ADE80', fontSize: 10, paddingTop: 4, borderTop: '1px solid #333' }}>
          ⚡ 效果：{c.effect}
        </div>
      )}
    </div>
  );
}

// Map tile renderer (delegates to Pokemon-style tile functions)
function drawTile(ctx: CanvasRenderingContext2D, terrain: number, sx: number, sy: number, mx: number, my: number, frame: number) {
  switch (terrain) {
    case TERRAIN.GRASS: drawGrassTile(ctx, sx, sy, mx, my); break;
    case TERRAIN.PATH: drawPathTile(ctx, sx, sy, mx, my); break;
    case TERRAIN.WALL: drawWallTile(ctx, sx, sy, mx, my); break;
    case TERRAIN.WATER: drawWaterTile(ctx, sx, sy, mx, my, frame); break;
    case TERRAIN.TREE: drawTreeTile(ctx, sx, sy, mx, my, frame); break;
    case TERRAIN.BUILDING: drawBuildingTile(ctx, sx, sy, mx, my); break;
    case TERRAIN.BRIDGE: drawBridgeTile(ctx, sx, sy, mx, my); break;
    case TERRAIN.FLOWER: drawFlowerTile(ctx, sx, sy, mx, my, frame); break;
    case TERRAIN.DENSE_GRASS: drawDenseGrassTile(ctx, sx, sy, mx, my); break;
    case TERRAIN.DOOR: drawDoorTile(ctx, sx, sy, mx, my); break;
    case TERRAIN.GYM_FLOOR: drawGymFloorTile(ctx, sx, sy, mx, my); break;
    case TERRAIN.SHOP_FLOOR: drawShopFloorTile(ctx, sx, sy, mx, my); break;
    case TERRAIN.HOSPITAL_FLOOR: drawHospitalFloorTile(ctx, sx, sy, mx, my); break;
    case TERRAIN.PC_FLOOR: drawPCFloorTile(ctx, sx, sy, mx, my); break;
    default: drawGrassTile(ctx, sx, sy, mx, my);
  }
};


// === POKEMON-QUALITY PIXEL MAP TILES ===
// Pokemon GBC-style 16x16 pixel tiles with palette-based rendering

const T = {
  GD: '#2d5a27', GB: '#4a8a37', GL: '#6ab86a', GA: '#8ada8a',
  PD: '#8a6a4a', PB: '#c9a86c', PL: '#d4bc8a',
  WD: '#1a4a7a', WB: '#2a6aaa', WL: '#4a9aca', WSh: '#9adaee',
  BD: '#5a5a6a', BB: '#8a8a9a', BL: '#c0c0d0',
  TD: '#5a3a1a', TB: '#3a7a2a', TL: '#5a9a4a',
  FL: '#ff6a6a', FY: '#ffca6a', FB: '#6a9aff',
};

// GBC Pokemon-style grass tile: 3-pixel-tall grass blades with 3 variants
function drawGrassTile(ctx: CanvasRenderingContext2D, sx: number, sy: number, tileX: number, tileY: number) {
  // Base grass ground
  ctx.fillStyle = T.GB; ctx.fillRect(sx, sy, 16, 16);
  // 3 variants determined by tile position
  const v = (tileX * 7 + tileY * 13) % 3;
  // Draw 3-pixel-tall grass blades (GBC style)
  // Each blade has base (#2d5a27), mid (#4a8a37), tip (#6ab86a)
  const blades = v === 0
    ? [[2,12,2],[4,11,2],[7,12,2],[10,11,2],[13,12,2],[1,13,2],[6,13,2],[11,13,2],[14,13,2],[3,10,2],[9,10,2]]
    : v === 1
    ? [[1,12,2],[4,13,2],[7,12,2],[11,11,2],[14,12,2],[2,13,2],[5,13,2],[9,13,2],[12,13,2],[0,12,2],[8,10,2]]
    : [[3,12,2],[6,11,2],[9,12,2],[12,11,2],[15,12,2],[1,13,2],[4,13,2],[8,13,2],[13,13,2],[2,10,2],[10,10,2]];
  for (const [px, py, pw] of blades) {
    // Base of blade
    ctx.fillStyle = T.GD;
    ctx.fillRect(sx + px, sy + py, pw, 1);
    // Middle of blade
    ctx.fillStyle = T.GB;
    ctx.fillRect(sx + px, sy + py - 1, pw, 1);
    // Tip of blade
    ctx.fillStyle = T.GL;
    ctx.fillRect(sx + px, sy + py - 2, pw, 1);
  }
  // Occasional flower (every ~11th tile)
  if ((tileX * 3 + tileY * 7) % 11 === 0) {
    const fc = (tileX + tileY) % 3;
    const flowerColors = [T.FL, T.FY, T.FB];
    // Flower petals
    ctx.fillStyle = flowerColors[fc];
    ctx.fillRect(sx + 7, sy + 6, 2, 2);
    ctx.fillRect(sx + 6, sy + 7, 1, 1);
    ctx.fillRect(sx + 9, sy + 7, 1, 1);
    // Flower center
    ctx.fillStyle = '#fff';
    ctx.fillRect(sx + 7, sy + 7, 1, 1);
    // Stem
    ctx.fillStyle = T.GD;
    ctx.fillRect(sx + 7, sy + 8, 1, 2);
  }
};

function drawPathTile(ctx: CanvasRenderingContext2D, sx: number, sy: number, tileX: number, tileY: number) {
  ctx.fillStyle = T.PB; ctx.fillRect(sx, sy, 16, 16);
  const v = (tileX * 11 + tileY * 17) % 3;
  const dots = v === 0 ? [[3,2,4,2],[10,4,3,2],[2,8,3,2],[12,10,2,2],[5,13,4,2]]
              : v === 1 ? [[2,1,3,2],[11,3,4,2],[4,7,3,2],[13,9,2,2],[1,14,4,2]]
              : [[5,2,3,2],[1,6,4,2],[9,8,3,2],[14,11,2,2],[3,14,3,2]];
  for (const [px, py, pw, ph] of dots) {
    ctx.fillStyle = py < 8 ? T.PD : T.PL;
    ctx.fillRect(sx + px, sy + py, pw, ph);
  }
};

function drawWallTile(ctx: CanvasRenderingContext2D, sx: number, sy: number, tileX: number, tileY: number) {
  ctx.fillStyle = T.BB; ctx.fillRect(sx, sy, 16, 16);
  // Brick horizontal lines
  ctx.fillStyle = T.BD;
  ctx.fillRect(sx, sy + 3, 16, 1); ctx.fillRect(sx, sy + 7, 16, 1); ctx.fillRect(sx, sy + 11, 16, 1); ctx.fillRect(sx, sy + 15, 16, 1);
  // Brick vertical offsets
  ctx.fillRect(sx + 8, sy, 1, 3); ctx.fillRect(sx, sy, 1, 3);
  ctx.fillRect(sx + 4, sy + 4, 1, 3); ctx.fillRect(sx + 12, sy + 4, 1, 3);
  ctx.fillRect(sx + 8, sy + 8, 1, 3); ctx.fillRect(sx, sy + 8, 1, 3);
  ctx.fillRect(sx + 4, sy + 12, 1, 3); ctx.fillRect(sx + 12, sy + 12, 1, 3);
  // Highlight
  ctx.fillStyle = T.BL; ctx.fillRect(sx, sy, 16, 1);
  ctx.fillRect(sx + 8, sy + 4, 4, 1); ctx.fillRect(sx + 4, sy + 8, 4, 1); ctx.fillRect(sx + 12, sy + 12, 4, 1);
};

function drawWaterTile(ctx: CanvasRenderingContext2D, sx: number, sy: number, tileX: number, tileY: number, frame: number) {
  ctx.fillStyle = T.WD; ctx.fillRect(sx, sy, 16, 16);
  const wf = (frame >> 3) % 2;
  const hl = wf === 0 ? [[3,2,4,2],[12,3,3,2],[6,8,4,2],[1,12,3,2],[13,13,2,2]]
             : [[2,1,3,2],[11,2,4,2],[5,7,3,2],[14,9,2,2],[3,14,4,2]];
  for (const [px, py, pw, ph] of hl) {
    ctx.fillStyle = py < 7 ? T.WL : T.WSh;
    ctx.fillRect(sx + px, sy + py, pw, ph);
  }
  ctx.fillStyle = T.WD;
  ctx.fillRect(sx, sy + 5 + wf, 16, 1); ctx.fillRect(sx, sy + 12 - wf, 16, 1);
};

function drawBridgeTile(ctx: CanvasRenderingContext2D, sx: number, sy: number, tileX: number, tileY: number) {
  ctx.fillStyle = T.PB; ctx.fillRect(sx, sy, 16, 16);
  ctx.fillStyle = T.PD;
  ctx.fillRect(sx, sy + 3, 16, 1); ctx.fillRect(sx, sy + 7, 16, 1); ctx.fillRect(sx, sy + 11, 16, 1); ctx.fillRect(sx, sy + 15, 16, 1);
  // Plank details
  ctx.fillStyle = '#a08060';
  ctx.fillRect(sx + 1, sy + 1, 6, 4); ctx.fillRect(sx + 9, sy + 1, 6, 4);
  ctx.fillRect(sx + 3, sy + 5, 5, 4); ctx.fillRect(sx + 11, sy + 5, 4, 4);
  ctx.fillRect(sx + 1, sy + 9, 6, 4); ctx.fillRect(sx + 9, sy + 9, 6, 4);
  ctx.fillRect(sx + 3, sy + 13, 5, 3); ctx.fillRect(sx + 11, sy + 13, 4, 3);
};

// GBC Pokemon-style tree tile: pixel art with layered circular canopy
function drawTreeTile(ctx: CanvasRenderingContext2D, sx: number, sy: number, tileX: number, tileY: number, frame: number) {
  // Ground
  ctx.fillStyle = T.GB; ctx.fillRect(sx, sy, 16, 16);
  // Trunk (brown pixel)
  ctx.fillStyle = T.TD; ctx.fillRect(sx + 6, sy + 10, 4, 6);
  ctx.fillStyle = '#4a3020'; ctx.fillRect(sx + 7, sy + 10, 1, 4);
  // Canopy layers (pixel circles using rectangles - GBC style)
  // Dark green base canopy
  ctx.fillStyle = '#2a5a20';
  ctx.fillRect(sx + 1, sy + 3, 14, 10);
  ctx.fillRect(sx + 2, sy + 2, 12, 1);
  ctx.fillRect(sx + 2, sy + 13, 12, 1);
  // Medium green middle layer
  ctx.fillStyle = T.TB;
  ctx.fillRect(sx + 2, sy + 3, 12, 9);
  ctx.fillRect(sx + 3, sy + 2, 10, 1);
  ctx.fillRect(sx + 3, sy + 12, 10, 1);
  // Light green highlights (top-left of canopy)
  ctx.fillStyle = T.TL;
  ctx.fillRect(sx + 3, sy + 3, 4, 4);
  ctx.fillRect(sx + 4, sy + 4, 2, 2);
  ctx.fillRect(sx + 2, sy + 4, 1, 2);
  // Dark edge pixels for depth
  ctx.fillStyle = '#1a4010';
  ctx.fillRect(sx + 11, sy + 10, 4, 3);
  ctx.fillRect(sx + 10, sy + 11, 1, 2);
  ctx.fillRect(sx + 12, sy + 11, 1, 2);
};

// GBC Pokemon-style flower tile: grass base + colorful flowers (red/yellow/blue)
function drawFlowerTile(ctx: CanvasRenderingContext2D, sx: number, sy: number, tileX: number, tileY: number, frame: number) {
  // Base grass
  ctx.fillStyle = T.GB; ctx.fillRect(sx, sy, 16, 16);
  const v = (tileX * 7 + tileY * 11) % 4;
  const colors = [T.FL, T.FY, T.FB];
  // Draw 3 flowers with stems
  for (let i = 0; i < 3; i++) {
    const fx = 2 + ((i * 5 + v * 3) % 12);
    const fy = 3 + ((i * 7 + v * 5) % 9);
    const fc = colors[(i + v) % 3];
    // Stem
    ctx.fillStyle = T.GD;
    ctx.fillRect(sx + fx, sy + fy + 2, 1, 3);
    // Flower petals
    ctx.fillStyle = fc;
    ctx.fillRect(sx + fx - 1, sy + fy, 3, 2);
    ctx.fillRect(sx + fx, sy + fy - 1, 1, 1);
    ctx.fillRect(sx + fx, sy + fy + 2, 1, 1);
    // Flower center
    ctx.fillStyle = '#fff';
    ctx.fillRect(sx + fx, sy + fy, 1, 1);
  }
  // Grass blades (3-pixel tall)
  const blades = [[3,11,2],[7,12,2],[11,11,2],[14,12,2],[1,13,2],[5,13,2],[9,13,2],[13,13,2],[2,10,2],[8,10,2],[12,10,2]];
  for (const [px, py, pw] of blades) {
    ctx.fillStyle = T.GD;
    ctx.fillRect(sx + px, sy + py, pw, 1);
    ctx.fillStyle = T.GB;
    ctx.fillRect(sx + px, sy + py - 1, pw, 1);
    ctx.fillStyle = T.GL;
    ctx.fillRect(sx + px, sy + py - 2, pw, 1);
  }
};

// GBC Pokemon-style building tile: pixel art house
function drawBuildingTile(ctx: CanvasRenderingContext2D, sx: number, sy: number, tileX: number, tileY: number) {
  // Stone base/floor
  ctx.fillStyle = T.PB; ctx.fillRect(sx, sy, 16, 16);
  // Building walls (brown)
  ctx.fillStyle = '#8B6914'; ctx.fillRect(sx + 1, sy + 4, 14, 10);
  // Roof - pixel triangle (GBC style)
  ctx.fillStyle = '#C0392B';
  ctx.fillRect(sx + 1, sy + 4, 14, 1);
  ctx.fillRect(sx + 2, sy + 3, 12, 1);
  ctx.fillRect(sx + 3, sy + 2, 10, 1);
  ctx.fillRect(sx + 4, sy + 1, 8, 1);
  ctx.fillRect(sx + 5, sy + 0, 6, 1);
  ctx.fillRect(sx + 6, sy - 1, 4, 1);
  // Roof highlight
  ctx.fillStyle = '#E74C3C';
  ctx.fillRect(sx + 5, sy + 0, 2, 1);
  ctx.fillRect(sx + 5, sy + 1, 3, 1);
  ctx.fillRect(sx + 4, sy + 2, 4, 1);
  // Door
  ctx.fillStyle = '#5D4037'; ctx.fillRect(sx + 6, sy + 8, 4, 6);
  ctx.fillStyle = '#3a2510'; ctx.fillRect(sx + 7, sy + 9, 2, 1);
  // Window
  ctx.fillStyle = '#F9CA24'; ctx.fillRect(sx + 2, sy + 6, 3, 3);
  ctx.fillStyle = '#F39C12'; ctx.fillRect(sx + 11, sy + 6, 3, 3);
  ctx.fillStyle = '#5D4037'; ctx.fillRect(sx + 3, sy + 7, 1, 1);
  ctx.fillRect(sx + 12, sy + 7, 1, 1);
  // Chimney
  ctx.fillStyle = '#7B241C'; ctx.fillRect(sx + 11, sy + 1, 3, 4);
  ctx.fillStyle = '#5a1810'; ctx.fillRect(sx + 12, sy + 2, 1, 2);
};

// 密林草地 - 比普通草地更暗更密
function drawDenseGrassTile(ctx: CanvasRenderingContext2D, sx: number, sy: number, tileX: number, tileY: number) {
  ctx.fillStyle = '#3a6a2a'; ctx.fillRect(sx, sy, 16, 16);
  const blades = [[2,10,2],[5,9,2],[8,11,2],[11,10,2],[14,11,2],[1,12,2],[4,13,2],[7,12,2],[10,13,2],[13,12,2]];
  for (const [px, py, pw] of blades) {
    ctx.fillStyle = '#2a4a20';
    ctx.fillRect(sx + px, sy + py, pw, 1);
    ctx.fillStyle = '#4a8a3a';
    ctx.fillRect(sx + px, sy + py - 1, pw, 1);
    ctx.fillStyle = '#6aaa5a';
    ctx.fillRect(sx + px, sy + py - 2, pw, 1);
  }
};

// 门口 - 用于室内地图入口
function drawDoorTile(ctx: CanvasRenderingContext2D, sx: number, sy: number, tileX: number, tileY: number) {
  ctx.fillStyle = '#5D4037'; ctx.fillRect(sx, sy, 16, 16);
  ctx.fillStyle = '#3E2723'; ctx.fillRect(sx + 2, sy + 2, 12, 14);
  ctx.fillStyle = '#FFD700'; ctx.fillRect(sx + 7, sy + 8, 2, 2);
  ctx.fillStyle = '#8B4513'; ctx.fillRect(sx + 4, sy + 2, 8, 2);
};

// 道馆地板 - 蓝白色方格
function drawGymFloorTile(ctx: CanvasRenderingContext2D, sx: number, sy: number, tileX: number, tileY: number) {
  ctx.fillStyle = (tileX + tileY) % 2 === 0 ? '#1a4a8a' : '#3a7aba';
  ctx.fillRect(sx, sy, 16, 16);
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fillRect(sx, sy, 8, 8);
  ctx.fillRect(sx + 8, sy + 8, 8, 8);
};

// 商店地板 - 木质
function drawShopFloorTile(ctx: CanvasRenderingContext2D, sx: number, sy: number, tileX: number, tileY: number) {
  ctx.fillStyle = '#A1887F'; ctx.fillRect(sx, sy, 16, 16);
  ctx.fillStyle = '#8D6E63';
  ctx.fillRect(sx, sy + 3, 16, 1);
  ctx.fillRect(sx, sy + 7, 16, 1);
  ctx.fillRect(sx, sy + 11, 16, 1);
  ctx.fillRect(sx, sy + 15, 16, 1);
  ctx.fillStyle = '#BCAAA4';
  ctx.fillRect(sx, sy + 1, 16, 1);
  ctx.fillRect(sx, sy + 5, 16, 1);
  ctx.fillRect(sx, sy + 9, 16, 1);
  ctx.fillRect(sx, sy + 13, 16, 1);
};

// 医院地板 - 浅绿色
function drawHospitalFloorTile(ctx: CanvasRenderingContext2D, sx: number, sy: number, tileX: number, tileY: number) {
  ctx.fillStyle = '#E8F5E9'; ctx.fillRect(sx, sy, 16, 16);
  ctx.fillStyle = '#C8E6C9';
  ctx.fillRect(sx, sy + 4, 16, 1);
  ctx.fillRect(sx, sy + 8, 16, 1);
  ctx.fillRect(sx, sy + 12, 16, 1);
  ctx.fillStyle = '#A5D6A7';
  ctx.fillRect(sx, sy + 2, 16, 1);
  ctx.fillRect(sx, sy + 6, 16, 1);
  ctx.fillRect(sx, sy + 10, 16, 1);
  ctx.fillRect(sx, sy + 14, 16, 1);
};

// PC中心地板 - 深蓝色
function drawPCFloorTile(ctx: CanvasRenderingContext2D, sx: number, sy: number, tileX: number, tileY: number) {
  ctx.fillStyle = '#1A237E'; ctx.fillRect(sx, sy, 16, 16);
  ctx.fillStyle = '#283593';
  ctx.fillRect(sx + 2, sy + 2, 12, 12);
  ctx.fillStyle = '#3949AB';
  ctx.fillRect(sx + 4, sy + 4, 8, 8);
  ctx.fillStyle = '#5C6BC0';
  ctx.fillRect(sx + 6, sy + 6, 4, 4);
};

// GBC Pokemon-style player sprite (32x32): Red cap+visor, yellow hair, skin face, blue tunic, brown pants, boots, sword, black outline
function drawPlayerSprite(ctx: CanvasRenderingContext2D, sx: number, sy: number, facing: string, frame: number, isAttacking: boolean, invincible: number) {
  const bounce = Math.sin(frame * 0.15) * 2;
  if (invincible > 0 && Math.floor(frame / 4) % 2 === 0) return;
  // Shadow (pixel ellipse)
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(sx - 8, sy + 12, 16, 4);
  ctx.fillRect(sx - 6, sy + 10, 12, 2);
  // Black outline for body
  ctx.fillStyle = '#000';
  ctx.fillRect(sx - 8, sy - 18 + bounce, 16, 1);
  ctx.fillRect(sx - 9, sy - 17 + bounce, 1, 18);
  ctx.fillRect(sx + 8, sy - 17 + bounce, 1, 18);
  ctx.fillRect(sx - 8, sy + 1 + bounce, 16, 1);
  // Body - blue tunic (Pokemon trainer style)
  ctx.fillStyle = '#2962D4';
  ctx.fillRect(sx - 8, sy - 17 + bounce, 16, 17);
  ctx.fillStyle = '#1a4ab8';
  ctx.fillRect(sx - 8, sy + 1 + bounce, 16, 1);
  // Belt
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(sx - 8, sy - 4 + bounce, 16, 3);
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(sx - 1, sy - 4 + bounce, 2, 3);
  // Head (skin)
  ctx.fillStyle = '#000';
  ctx.fillRect(sx - 7, sy - 28 + bounce, 14, 1);
  ctx.fillRect(sx - 8, sy - 27 + bounce, 1, 10);
  ctx.fillRect(sx + 7, sy - 27 + bounce, 1, 10);
  ctx.fillRect(sx - 7, sy - 17 + bounce, 14, 1);
  ctx.fillStyle = '#FFCC80';
  ctx.fillRect(sx - 7, sy - 27 + bounce, 14, 9);
  // Hair (yellow - GBC style)
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(sx - 7, sy - 28 + bounce, 14, 4);
  ctx.fillStyle = '#E5A500';
  ctx.fillRect(sx - 6, sy - 28 + bounce, 4, 2);
  // Eyes - distinct pixel eyes (only when facing forward/side)
  if (facing === 'down' || facing === 'right' || facing === 'left') {
    ctx.fillStyle = '#fff';
    ctx.fillRect(sx - 5, sy - 23 + bounce, 3, 3);
    ctx.fillRect(sx + 2, sy - 23 + bounce, 3, 3);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(sx - 4, sy - 22 + bounce, 2, 2);
    ctx.fillRect(sx + 3, sy - 22 + bounce, 2, 2);
  }
  // Red cap/visor (Pokemon trainer style)
  ctx.fillStyle = '#E53935';
  ctx.fillRect(sx - 8, sy - 30 + bounce, 16, 3);
  ctx.fillStyle = '#B71C1C';
  ctx.fillRect(sx - 8, sy - 29 + bounce, 16, 1);
  // Visor
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(sx - 8, sy - 28 + bounce, 16, 1);
  // Legs (brown pants)
  ctx.fillStyle = '#000';
  ctx.fillRect(sx - 6, sy + 2 + bounce, 5, 1);
  ctx.fillRect(sx + 1, sy + 2 + bounce, 5, 1);
  ctx.fillStyle = '#795548';
  ctx.fillRect(sx - 6, sy + 3 + bounce, 5, 7);
  ctx.fillRect(sx + 1, sy + 3 + bounce, 5, 7);
  ctx.fillStyle = '#5D4037';
  ctx.fillRect(sx - 5, sy + 4 + bounce, 3, 5);
  ctx.fillRect(sx + 2, sy + 4 + bounce, 3, 5);
  // Boots
  ctx.fillStyle = '#5D4037';
  ctx.fillRect(sx - 7, sy + 9 + bounce, 6, 3);
  ctx.fillRect(sx + 1, sy + 9 + bounce, 6, 3);
  ctx.fillStyle = '#3E2723';
  ctx.fillRect(sx - 7, sy + 11 + bounce, 6, 1);
  ctx.fillRect(sx + 1, sy + 11 + bounce, 6, 1);
  // Sword
  if (facing === 'right' || facing === 'down' || isAttacking) {
    ctx.fillStyle = '#000';
    ctx.fillRect(sx + 11, sy - 16 + bounce, 3, 1);
    ctx.fillStyle = '#9E9E9E';
    ctx.fillRect(sx + 11, sy - 15 + bounce, 3, 14);
    ctx.fillStyle = '#D0D0D0';
    ctx.fillRect(sx + 11, sy - 15 + bounce, 1, 12);
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(sx + 9, sy - 16 + bounce, 7, 3);
    ctx.fillStyle = '#DAA520';
    ctx.fillRect(sx + 9, sy - 14 + bounce, 7, 1);
    if (isAttacking) {
      // Attack arc - pixel style
      ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 2;
      ctx.fillStyle = 'rgba(255,215,0,0.3)';
      ctx.fillRect(sx - 20, sy - 20 + bounce, 40, 40);
    }
  } else if (facing === 'left') {
    ctx.fillStyle = '#000';
    ctx.fillRect(sx - 14, sy - 16 + bounce, 3, 1);
    ctx.fillStyle = '#9E9E9E';
    ctx.fillRect(sx - 14, sy - 15 + bounce, 3, 14);
    ctx.fillStyle = '#D0D0D0';
    ctx.fillRect(sx - 14, sy - 15 + bounce, 1, 12);
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(sx - 16, sy - 16 + bounce, 7, 3);
  } else if (facing === 'up') {
    ctx.fillStyle = '#000';
    ctx.fillRect(sx - 1, sy - 28 + bounce, 3, 1);
    ctx.fillStyle = '#9E9E9E';
    ctx.fillRect(sx - 1, sy - 27 + bounce, 3, 14);
    ctx.fillStyle = '#D0D0D0';
    ctx.fillRect(sx - 1, sy - 27 + bounce, 1, 12);
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(sx - 3, sy - 16 + bounce, 7, 3);
  }
};

// GBC Pokemon-style slime (32x32): Green jelly blob, white highlight, big white eyes, black pupils, cute smile
function drawSlime(ctx: CanvasRenderingContext2D, sx: number, sy: number, frame: number, isElite: boolean = false) {
  const squish = Math.sin(frame * 0.15) * 3;
  const s = isElite ? 1.3 : 1;
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(sx - 10 * s, sy + 8 * s, 20 * s, 4 * s);
  ctx.fillRect(sx - 8 * s, sy + 6 * s, 16 * s, 2 * s);
  // Body outline (dark green)
  ctx.fillStyle = isElite ? '#4A148C' : '#2E7D32';
  ctx.fillRect(sx - 12 * s + squish, sy - 8 * s, (4 + squish) * s, 16 * s);
  ctx.fillRect(sx + 8 * s - squish, sy - 8 * s, (4 + squish) * s, 16 * s);
  ctx.fillRect(sx - 12 * s, sy - 8 * s, 24 * s, 2 * s);
  ctx.fillRect(sx - 12 * s, sy + 8 * s - squish / 2, 24 * s, 2 * s);
  ctx.fillRect(sx - 12 * s, sy - 6 * s, 2 * s, 14 * s);
  ctx.fillRect(sx + 10 * s, sy - 6 * s, 2 * s, 14 * s);
  // Body fill (green jelly)
  ctx.fillStyle = isElite ? '#7B1FA2' : '#43A047';
  ctx.fillRect(sx - 10 * s + squish, sy - 6 * s, (20 - squish * 2) * s, 12 * s);
  ctx.fillRect(sx - 12 * s + squish, sy - 8 * s, (24 - squish * 2) * s, 2 * s);
  ctx.fillRect(sx - 12 * s + squish, sy + 6 * s - squish / 2, (24 - squish * 2) * s, 2 * s);
  // Body highlight
  ctx.fillStyle = isElite ? '#E1BEE7' : '#C8E6C9';
  ctx.fillRect(sx - 8 * s, sy - 5 * s, 6 * s, 4 * s);
  ctx.fillStyle = isElite ? '#F3E5F5' : '#E8F5E9';
  ctx.fillRect(sx - 6 * s, sy - 4 * s, 2 * s, 2 * s);
  // Eyes (big white anime-style)
  ctx.fillStyle = '#fff';
  ctx.fillRect(sx - 6 * s, sy - 2 * s, 5 * s, 5 * s);
  ctx.fillRect(sx + 1 * s, sy - 2 * s, 5 * s, 5 * s);
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(sx - 4 * s, sy - 1 * s, 3 * s, 3 * s);
  ctx.fillRect(sx + 3 * s, sy - 1 * s, 3 * s, 3 * s);
  // Eye shine
  ctx.fillStyle = '#fff';
  ctx.fillRect(sx - 5 * s, sy - 2 * s, 1 * s, 1 * s);
  ctx.fillRect(sx + 2 * s, sy - 2 * s, 1 * s, 1 * s);
  // Cute smile
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(sx - 2 * s, sy + 3 * s, 4 * s, 1 * s);
  ctx.fillRect(sx - 3 * s, sy + 2 * s, 1 * s, 1 * s);
  ctx.fillRect(sx + 2 * s, sy + 2 * s, 1 * s, 1 * s);
  // Elite star
  if (isElite) {
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(sx - 3, sy - 14, 2, 2);
    ctx.fillRect(sx - 4, sy - 13, 4, 1);
    ctx.fillRect(sx - 3, sy - 12, 2, 2);
  }
};

// GBC Pokemon-style wolf (32x32): Gray-brown fur, pointed ears, red eyes, visible fangs, bushy tail
function drawWolf(ctx: CanvasRenderingContext2D, sx: number, sy: number, frame: number, isElite: boolean = false) {
  const run = Math.abs(Math.sin(frame * 0.3)) * 3;
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(sx - 12, sy + 10, 24, 4);
  ctx.fillRect(sx - 10, sy + 8, 20, 2);
  // Body outline
  ctx.fillStyle = '#000';
  ctx.fillRect(sx - 14, sy - 8, 28, 16);
  // Body
  ctx.fillStyle = isElite ? '#37474F' : '#795548';
  ctx.fillRect(sx - 14, sy - 7, 28, 14);
  // Fur detail (lighter patches)
  ctx.fillStyle = isElite ? '#546E7A' : '#8D6E63';
  ctx.fillRect(sx - 10, sy - 5, 8, 4);
  ctx.fillRect(sx + 2, sy - 5, 8, 4);
  // Head outline
  ctx.fillStyle = '#000';
  ctx.fillRect(sx - 8, sy - 22, 16, 16);
  // Head
  ctx.fillStyle = isElite ? '#37474F' : '#795548';
  ctx.fillRect(sx - 7, sy - 21, 14, 14);
  // Snout outline
  ctx.fillStyle = '#000';
  ctx.fillRect(sx - 4, sy - 14, 10, 8);
  // Snout
  ctx.fillStyle = isElite ? '#455A64' : '#8D6E63';
  ctx.fillRect(sx - 3, sy - 13, 9, 6);
  // Nose
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(sx + 3, sy - 13, 3, 3);
  // Eyes (red, menacing)
  ctx.fillStyle = isElite ? '#FF1744' : '#F44336';
  ctx.fillRect(sx - 6, sy - 18, 4, 4);
  ctx.fillRect(sx + 2, sy - 18, 4, 4);
  // Eye shine
  ctx.fillStyle = '#fff';
  ctx.fillRect(sx - 6, sy - 18, 1, 1);
  ctx.fillRect(sx + 2, sy - 18, 1, 1);
  // Pointed ears (pixel triangles)
  ctx.fillStyle = isElite ? '#37474F' : '#795548';
  ctx.fillRect(sx - 8, sy - 24, 4, 4);
  ctx.fillRect(sx - 9, sy - 26, 2, 2);
  ctx.fillRect(sx - 10, sy - 27, 1, 1);
  ctx.fillRect(sx + 4, sy - 24, 4, 4);
  ctx.fillRect(sx + 7, sy - 26, 2, 2);
  ctx.fillRect(sx + 9, sy - 27, 1, 1);
  // Ear inner
  ctx.fillStyle = isElite ? '#546E7A' : '#A1887F';
  ctx.fillRect(sx - 7, sy - 23, 2, 2);
  ctx.fillRect(sx + 5, sy - 23, 2, 2);
  // Tail (bushy)
  ctx.fillStyle = isElite ? '#455A64' : '#8D6E63';
  ctx.fillRect(sx - 18, sy - 6, 6, 8);
  ctx.fillRect(sx - 20, sy - 8, 4, 4);
  ctx.fillRect(sx - 21, sy - 10, 2, 2);
  ctx.fillStyle = '#000';
  ctx.fillRect(sx - 18, sy - 6, 6, 1);
  // Legs
  ctx.fillStyle = '#000';
  ctx.fillRect(sx - 10, sy + 8 - run, 5, 6 + run);
  ctx.fillRect(sx + 5, sy + 8 + run, 5, 6 - run);
  ctx.fillStyle = isElite ? '#263238' : '#5D4037';
  ctx.fillRect(sx - 10, sy + 8 - run, 5, 6 + run);
  ctx.fillRect(sx + 5, sy + 8 + run, 5, 6 - run);
  // Fangs (visible when attacking)
  ctx.fillStyle = '#fff';
  ctx.fillRect(sx - 2, sy - 9, 2, 2);
  ctx.fillRect(sx + 2, sy - 9, 2, 2);
  // Elite aura
  if (isElite) {
    ctx.strokeStyle = '#FF1744'; ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(sx - 20, sy - 24, 40, 48);
    ctx.setLineDash([]);
  }
};

// GBC Pokemon-style goblin (32x32): Green skin, big pointy ears, yellow eyes, wooden club
function drawGoblin(ctx: CanvasRenderingContext2D, sx: number, sy: number, frame: number, isElite: boolean = false) {
  const hop = Math.abs(Math.sin(frame * 0.2)) * 3;
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(sx - 8, sy + 10, 16, 4);
  ctx.fillRect(sx - 6, sy + 8, 12, 2);
  // Body outline
  ctx.fillStyle = '#000';
  ctx.fillRect(sx - 7, sy - 12 + hop, 14, 16);
  // Body (small, cartoon proportion)
  ctx.fillStyle = isElite ? '#1B5E20' : '#558B2F';
  ctx.fillRect(sx - 7, sy - 11 + hop, 14, 14);
  // Body detail
  ctx.fillStyle = isElite ? '#2E7D32' : '#7CB342';
  ctx.fillRect(sx - 5, sy - 9 + hop, 10, 10);
  // Head outline
  ctx.fillStyle = '#000';
  ctx.fillRect(sx - 8, sy - 24 + hop, 16, 14);
  // Head (big ears, small face)
  ctx.fillStyle = isElite ? '#2E7D32' : '#7CB342';
  ctx.fillRect(sx - 7, sy - 23 + hop, 14, 12);
  // Big pointy ears (pixel triangles)
  ctx.fillStyle = isElite ? '#1B5E20' : '#558B2F';
  ctx.fillRect(sx - 12, sy - 26 + hop, 6, 6);
  ctx.fillRect(sx - 14, sy - 28 + hop, 4, 4);
  ctx.fillRect(sx - 15, sy - 30 + hop, 2, 2);
  ctx.fillRect(sx + 6, sy - 26 + hop, 6, 6);
  ctx.fillRect(sx + 10, sy - 28 + hop, 4, 4);
  ctx.fillRect(sx + 13, sy - 30 + hop, 2, 2);
  // Ear inner
  ctx.fillStyle = isElite ? '#4CAF50' : '#AED581';
  ctx.fillRect(sx - 11, sy - 25 + hop, 4, 4);
  ctx.fillRect(sx + 7, sy - 25 + hop, 4, 4);
  // Eyes (big yellow, menacing)
  ctx.fillStyle = '#FFEB3B';
  ctx.fillRect(sx - 6, sy - 20 + hop, 4, 4);
  ctx.fillRect(sx + 2, sy - 20 + hop, 4, 4);
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(sx - 5, sy - 19 + hop, 2, 2);
  ctx.fillRect(sx + 3, sy - 19 + hop, 2, 2);
  // Eye shine
  ctx.fillStyle = '#fff';
  ctx.fillRect(sx - 6, sy - 20 + hop, 1, 1);
  ctx.fillRect(sx + 2, sy - 20 + hop, 1, 1);
  // Nose
  ctx.fillStyle = '#33691E';
  ctx.fillRect(sx - 2, sy - 17 + hop, 4, 3);
  // Mouth with fangs
  ctx.fillStyle = '#000';
  ctx.fillRect(sx - 4, sy - 14 + hop, 8, 2);
  ctx.fillStyle = '#fff';
  ctx.fillRect(sx - 4, sy - 14 + hop, 2, 2);
  ctx.fillRect(sx + 2, sy - 14 + hop, 2, 2);
  // Club/weapon
  ctx.fillStyle = '#000';
  ctx.fillRect(sx + 10, sy - 14 + hop, 4, 18);
  ctx.fillStyle = '#795548';
  ctx.fillRect(sx + 10, sy - 13 + hop, 4, 16);
  ctx.fillStyle = '#5D4037';
  ctx.fillRect(sx + 8, sy - 16 + hop, 8, 6);
  ctx.fillStyle = '#3E2723';
  ctx.fillRect(sx + 9, sy - 15 + hop, 6, 4);
  // Legs
  ctx.fillStyle = '#000';
  ctx.fillRect(sx - 6, sy + 4 + hop, 5, 6);
  ctx.fillRect(sx + 1, sy + 4 + hop, 5, 6);
  ctx.fillStyle = isElite ? '#1B5E20' : '#558B2F';
  ctx.fillRect(sx - 6, sy + 4 + hop, 5, 5);
  ctx.fillRect(sx + 1, sy + 4 + hop, 5, 5);
  // Elite star
  if (isElite) {
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(sx - 3, sy - 32 + hop, 2, 2);
    ctx.fillRect(sx - 4, sy - 31 + hop, 4, 1);
    ctx.fillRect(sx - 3, sy - 30 + hop, 2, 2);
  }
};

// Monster sprite dispatcher - kept inside component for access to monsters type
// (Bug #13: drawXxxTile functions moved to module level, but monster type needs component scope)
function drawMonsterSprite(ctx: CanvasRenderingContext2D, m: { type: string; x: number; y: number; isElite?: boolean }, frame: number) {
  if (m.type === 'slime') drawSlime(ctx, m.x, m.y, frame, m.isElite);
  else if (m.type === 'wolf') drawWolf(ctx, m.x, m.y, frame, m.isElite);
  else if (m.type === 'goblin') drawGoblin(ctx, m.x, m.y, frame, m.isElite);
};

// 修复#1: 剧情与地图联动 - 发牌员发光效果
function drawDealer(ctx: CanvasRenderingContext2D, sx: number, sy: number, dealer: Dealer, frame: number, flags: StoryFlag[]) {
  const glow = Math.sin(frame * 0.08) * 0.3 + 0.7;
  
  // 根据flag决定发光颜色
  let glowColor = `rgba(218, 165, 32, ${glow * 0.3})`; // 默认金色
  let glowRadius = 24;
  
  // 石碑在觉醒篇章后发金色光芒
  if (dealer.type === 'ENVIRONMENT' && flags.includes('awakening')) {
    glowColor = `rgba(255, 215, 0, ${glow * 0.6})`;
    glowRadius = 32;
  }
  // NPC在获得信任后有不同光晕
  if (dealer.type === 'NPC' && (flags.includes('npc_chenyu_trust') || flags.includes('npc_suwaner_heart'))) {
    glowColor = `rgba(100, 200, 255, ${glow * 0.4})`;
    glowRadius = 28;
  }
  // P2-3: WANDERER浪人有神秘的紫色光芒
  if (dealer.type === 'WANDERER') {
    glowColor = `rgba(155, 89, 182, ${glow * 0.5})`;
    glowRadius = 30;
  }

  ctx.fillStyle = glowColor;
  ctx.beginPath(); ctx.arc(sx, sy, glowRadius, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = dealer.color;
  ctx.fillRect(sx - 10, sy - 16, 20, 24);
  ctx.fillStyle = '#FFCC80';
  ctx.beginPath(); ctx.arc(sx, sy - 22, 10, 0, Math.PI * 2); ctx.fill();
  if (dealer.type === 'NPC') {
    ctx.fillStyle = '#1565C0';
    ctx.beginPath(); ctx.arc(sx, sy - 26, 9, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#424242';
    ctx.fillRect(sx - 12, sy - 20, 24, 3);
  } else if (dealer.type === 'BOARD') {
    ctx.fillStyle = '#7C3AED';
    ctx.fillRect(sx - 10, sy - 30, 20, 20);
    ctx.fillStyle = '#fff';
    ctx.font = '10px sans-serif';
    ctx.fillText('📋', sx - 5, sy - 16);
  } else if (dealer.type === 'MERCHANT') {
    ctx.fillStyle = '#22C55E';
    ctx.fillRect(sx - 8, sy - 20, 16, 16);
    ctx.fillStyle = '#FFD700';
    ctx.font = '12px sans-serif';
    ctx.fillText('💰', sx - 6, sy - 8);
  } else if (dealer.type === 'CAMP') {
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath(); ctx.arc(sx, sy - 16, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#EF4444';
    ctx.beginPath(); ctx.arc(sx, sy - 16, 6, 0, Math.PI * 2); ctx.fill();
  } else if (dealer.type === 'WANDERER') {
    // P2-3: 神秘浪人 - 月亮帽+斗篷
    ctx.fillStyle = '#9B59B6';
    ctx.beginPath(); ctx.arc(sx, sy - 26, 9, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#8E44AD';
    ctx.beginPath(); ctx.moveTo(sx - 12, sy - 16); ctx.lineTo(sx, sy - 40); ctx.lineTo(sx + 12, sy - 16); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#6B3FA0';
    ctx.fillRect(sx - 14, sy - 16, 28, 20);
  } else if (dealer.type === 'ENVIRONMENT') {
    // 石碑根据flag变化颜色
    if (flags.includes('awakening')) {
      ctx.fillStyle = '#FFD700'; // 金色石碑
      ctx.fillRect(sx - 12, sy - 24, 24, 32);
      ctx.fillStyle = '#FFF8DC';
      ctx.fillRect(sx - 8, sy - 20, 16, 8);
    } else {
      ctx.fillStyle = '#6B7280';
      ctx.fillRect(sx - 12, sy - 24, 24, 32);
      ctx.fillStyle = '#9CA3AF';
      ctx.fillRect(sx - 8, sy - 20, 16, 8);
    }
  } else {
    ctx.fillStyle = dealer.color;
    ctx.beginPath();
    ctx.moveTo(sx - 12, sy - 26); ctx.lineTo(sx, sy - 42); ctx.lineTo(sx + 12, sy - 26);
    ctx.closePath(); ctx.fill();
  }
  ctx.font = '10px sans-serif';
  ctx.fillStyle = '#fff';
  ctx.fillText(dealer.icon, sx - 6, sy + 2);
};

function drawTreasure(ctx: CanvasRenderingContext2D, sx: number, sy: number, opened: boolean, frame: number) {
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


export default function ImprovedRPG({ character }: { character?: Character }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 480 });
  
  // 尝试从存档加载
  const savedData = useRef(typeof window !== 'undefined' ? loadGame() : null);
  const hasLoadedSave = useRef(false);
  
  // 初始化：看过剧情就不再展示，或从存档加载
  const [gameState, setGameState] = useState<'story' | 'playing' | 'gameover' | 'victory'>(() => {
    if (savedData.current && savedData.current.hasSeenIntro) return 'playing';
    return character?.has_seen_intro ? 'playing' : 'story';
  });
  const [storyIdx, setStoryIdx] = useState(0);
  const [showText, setShowText] = useState('');
  const [typingDone, setTypingDone] = useState(false);

  // 从存档或角色存档初始化玩家状态
  const [player, setPlayer] = useState(() => {
    if (savedData.current) {
      return {
        x: savedData.current.x,
        y: savedData.current.y,
        hp: savedData.current.hp,
        maxHp: savedData.current.maxHp,
        mp: savedData.current.mp,
        maxMp: savedData.current.maxMp,
        energy: 3, maxEnergy: 5,
        level: savedData.current.level,
        exp: savedData.current.exp,
        expToLevel: savedData.current.expToLevel,
        atk: savedData.current.atk,
        def: savedData.current.def,
        facing: 'down' as 'up' | 'down' | 'left' | 'right',
        isAttacking: false, attackFrame: 0, cooldown: 0, invincible: 0, atkBuff: 0,
        gold: savedData.current.gold,
      };
    }
    return {
      x: character?.position?.x || 40,
      y: character?.position?.y || 40,
      hp: character?.health?.current || character?.level ? (character!.level * 30 + 70) : 100,
      maxHp: character?.health?.max || character?.level ? (character!.level * 30 + 70) : 100,
      mp: character?.spirit?.current || 50,
      maxMp: character?.spirit?.max || 50,
      energy: 3, maxEnergy: 5,
      level: character?.level || 1,
      exp: character?.xp || 0,
      expToLevel: character?.level ? character.level * 100 : 100,
      atk: character?.strength || 25,
      def: character?.defense || 10,
      facing: 'down' as 'up' | 'down' | 'left' | 'right',
      isAttacking: false, attackFrame: 0, cooldown: 0, invincible: 0, atkBuff: 0,
      gold: character?.gold || 0,
    };
  });

  const [camera, setCamera] = useState({ x: 30, y: 30 });
  const playerRef = useRef(player);
  const [animFrame, setAnimFrame] = useState(0);
  const [monstersDefeatedCount, setMonstersDefeatedCount] = useState(0);  const [boardProgress, setBoardProgress] = useState<Record<string, number>>({});
  const boardProgressRef = useRef<Record<string, number>>({});

  const monstersDefeatedCountRef = useRef(0);

  // 室内地图状态
  const [indoorMapId, setIndoorMapId] = useState<IndoorMapId>(() => savedData.current?.indoorMapId || 'none');
  const [outdoorPlayerPos, setOutdoorPlayerPos] = useState(() => savedData.current?.outdoorPlayerPos || { x: 40, y: 40 });

  // 自动入口/出口提示状态
  const [proximityPrompt, setProximityPrompt] = useState<{
    type: 'enter_building' | 'exit_indoor';
    mapId: IndoorMapId;
    autoEnterCountdown: number; // 1秒倒计时
  } | null>(null);
  const [proximityPromptTimer, setProximityPromptTimer] = useState<ReturnType<typeof setInterval> | null>(null);
  const proximityTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 获取当前地图数据
  const getCurrentTerrain = useCallback((x: number, y: number): number => {
    if (indoorMapId !== 'none') {
      const map = INDOOR_MAPS[indoorMapId];
      const tx = Math.floor(x);
      const ty = Math.floor(y);
      if (tx >= 0 && tx < map.width && ty >= 0 && ty < map.height) {
        return map.terrain[ty][tx];
      }
      return TERRAIN.WALL;
    }
    if (y >= 0 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) {
      return mapDataRef.current[Math.floor(y)][Math.floor(x)];
    }
    return TERRAIN.WALL;
  }, [indoorMapId]);

  // 进入室内地图（由proximityPrompt触发，不再自动调用）
  const enterIndoorMap = useCallback((mapId: IndoorMapId) => {
    const map = INDOOR_MAPS[mapId];
    if (map.id === 'none') return;
    setOutdoorPlayerPos({ x: player.x, y: player.y });
    setIndoorMapId(mapId);
    setPlayer(p => ({
      ...p,
      x: map.playerStart.x,
      y: map.playerStart.y,
    }));
    setProximityPrompt(null);
    setClickTarget(null);
    resumeAudio();
  }, [player.x, player.y]);

  // 退出室内地图（由proximityPrompt触发，不再自动调用）
  const exitIndoorMap = useCallback(() => {
    if (indoorMapId === 'none') return;
    setIndoorMapId('none');
    setPlayer(p => ({
      ...p,
      x: outdoorPlayerPos.x,
      y: outdoorPlayerPos.y + 1, // 稍微偏移，避免立即重新进入
    }));
    setProximityPrompt(null);
    resumeAudio();
  }, [indoorMapId, outdoorPlayerPos]);

  // 检查是否在建筑入口处
  const checkBuildingEntry = useCallback((): IndoorMapId | null => {
    if (indoorMapId !== 'none') return null; // 已经在室内
    for (const entry of BUILDING_ENTRIES) {
      const dx = Math.abs(player.x - entry.x);
      const dy = Math.abs(player.y - entry.y);
      if (dx < 1.5 && dy < 1.5) {
        return entry.indoorMapId;
      }
    }
    return null;
  }, [player.x, player.y, indoorMapId]);

  const [monsters, setMonsters] = useState<Array<{
    id: number; x: number; y: number; hp: number; maxHp: number; atk: number; def: number; name: string;
    type: 'slime' | 'wolf' | 'goblin' | 'bat' | 'mushroom' | 'zombie' | 'skull' | 'dragon_spawn';
    element: ElementType; element2?: ElementType; level: number; exp: number; gold: number;
    state: 'patrol' | 'chase' | 'attack' | 'dead'; dir: number; cd: number; dropCard: boolean; isElite?: boolean;
    skillName?: string; skillElement?: ElementType; skillBaseDamage?: number;
  }>>([
    // 北部草原 - 新手区
    { id: 101, x: 25, y: 15, hp: 40, maxHp: 40, atk: 8, def: 5, name: '小史莱姆', type: 'slime', element: 'water', level: 1, exp: 10, gold: 10, state: 'patrol', dir: 1, cd: 0, dropCard: false, skillName: '撞击', skillElement: 'normal', skillBaseDamage: 8 },
    { id: 102, x: 52, y: 12, hp: 50, maxHp: 50, atk: 12, def: 8, name: '草蛇', type: 'wolf', element: 'grass', level: 3, exp: 15, gold: 15, state: 'patrol', dir: -1, cd: 0, dropCard: false, skillName: '藤鞭', skillElement: 'grass', skillBaseDamage: 12 },
    // 北部森林
    { id: 201, x: 10, y: 12, hp: 55, maxHp: 55, atk: 14, def: 10, name: '森林蝙蝠', type: 'bat', element: 'dark', level: 4, exp: 20, gold: 20, state: 'patrol', dir: 1, cd: 0, dropCard: false, skillName: '暗袭', skillElement: 'dark', skillBaseDamage: 14 },
    { id: 202, x: 14, y: 18, hp: 60, maxHp: 60, atk: 16, def: 12, name: '蘑菇怪', type: 'mushroom', element: 'poison', level: 5, exp: 25, gold: 25, state: 'patrol', dir: 1, cd: 0, dropCard: false, skillName: '孢子', skillElement: 'poison', skillBaseDamage: 16 },
    // 北部花海
    { id: 301, x: 60, y: 10, hp: 45, maxHp: 45, atk: 11, def: 9, name: '花仙子', type: 'wolf', element: 'grass', level: 4, exp: 18, gold: 18, state: 'patrol', dir: 1, cd: 0, dropCard: false, skillName: '花瓣舞', skillElement: 'grass', skillBaseDamage: 11 },
    // 西山森林
    { id: 401, x: 10, y: 35, hp: 70, maxHp: 70, atk: 18, def: 14, name: '哥布林', type: 'goblin', element: 'normal', level: 6, exp: 30, gold: 30, state: 'patrol', dir: 1, cd: 0, dropCard: false, skillName: '猛击', skillElement: 'normal', skillBaseDamage: 18 },
    { id: 402, x: 15, y: 40, hp: 65, maxHp: 65, atk: 20, def: 12, name: '灰狼', type: 'wolf', element: 'normal', level: 7, exp: 35, gold: 35, state: 'patrol', dir: 1, cd: 0, dropCard: false, skillName: '撕咬', skillElement: 'normal', skillBaseDamage: 20 },
    { id: 403, x: 6, y: 45, hp: 80, maxHp: 80, atk: 22, def: 15, name: '精英灰狼', type: 'wolf', element: 'dark', level: 8, exp: 50, gold: 50, state: 'patrol', dir: 1, cd: 0, dropCard: true, isElite: true, skillName: '暗影撕咬', skillElement: 'dark', skillBaseDamage: 25 },
    // 南部平原
    { id: 501, x: 35, y: 54, hp: 100, maxHp: 100, atk: 25, def: 18, name: '巨型史莱姆', type: 'slime', element: 'water', level: 10, exp: 60, gold: 60, state: 'patrol', dir: 1, cd: 0, dropCard: true, isElite: true, skillName: '水炮', skillElement: 'water', skillBaseDamage: 30 },
    { id: 502, x: 50, y: 52, hp: 90, maxHp: 90, atk: 24, def: 20, name: '骷髅战士', type: 'skull', element: 'ghost', level: 10, exp: 55, gold: 55, state: 'patrol', dir: 1, cd: 0, dropCard: true, isElite: true, skillName: '骨刺', skillElement: 'ghost', skillBaseDamage: 28 },
    // 西北荒原 - 高级区
    { id: 701, x: 10, y: 54, hp: 120, maxHp: 120, atk: 30, def: 22, name: '龙蜥幼体', type: 'dragon_spawn', element: 'dragon', level: 12, exp: 80, gold: 80, state: 'patrol', dir: 1, cd: 0, dropCard: true, isElite: true, skillName: '龙息', skillElement: 'fire', skillBaseDamage: 35 },
    { id: 702, x: 15, y: 56, hp: 95, maxHp: 95, atk: 26, def: 20, name: '骷髅法师', type: 'skull', element: 'ghost', level: 11, exp: 65, gold: 65, state: 'patrol', dir: 1, cd: 0, dropCard: true, isElite: true, skillName: '暗影弹', skillElement: 'ghost', skillBaseDamage: 30 },
  ]);

  const [attackWarning, setAttackWarning] = useState<number>(0);
  const [treasures, setTreasures] = useState([
    { id: 1, x: 20, y: 22, opened: false },
    { id: 2, x: 65, y: 15, opened: false },
    { id: 3, x: 70, y: 35, opened: false },
  ]);

  const [damages, setDamages] = useState<{ id: number; x: number; y: number; v: number; t: number; color: string }[]>([]);
  const dmgIdRef = useRef(0);

  // P2-1: 音频Refs for MOOD卡环境渲染
  const bgmGainNodeRef = useRef<GainNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const [showCardGame, setShowCardGame] = useState(false);

  // P1-1: 可审问敌人系统 - 当前可审问的怪物ID
  const [interrogationTarget, setInterrogationTarget] = useState<number | null>(null);
  const [cardRewards, setCardRewards] = useState<EventCard[]>([]);
  const [showRewards, setShowRewards] = useState(false);
  const [collectedCards, setCollectedCards] = useState<EventCard[]>(() => savedData.current?.collectedCards || []);
  const [deckIndex, setDeckIndex] = useState(() => savedData.current?.deckIndex || 0);
  const [cardFilter, setCardFilter] = useState<CardType | 'all'>('all');

  // 当前交互的发牌员
  const [nearbyDealer, setNearbyDealer] = useState<Dealer | null>(null);

  // ============================================================
  // P0-1: 卡组适配玩家状态机制 - 状态
  // ============================================================
  const [cardQueue, setCardQueue] = useState<EventCard[]>([]);

  // ============================================================
  // P2-1: MOOD卡环境渲染 - 氛围效果状态
  // ============================================================
  const [ambientEffect, setAmbientEffect] = useState<{ type: string; duration: number } | null>(null);
  const [moodOverlay, setMoodOverlay] = useState(false);

  // ============================================================
  // P0-1: 发牌员对话框状态
  // ============================================================
  const [showDealerPanel, setShowDealerPanel] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null);

  // ============================================================
  // P1-1: 边缘叙事增强 - 透明度状态
  // ============================================================
  const [edgeNarrativeOpacity, setEdgeNarrativeOpacity] = useState(0);

  // ============================================================
  // P1-2: 动态遭遇警告状态
  // ============================================================
  const [encounterWarning, setEncounterWarning] = useState<string | null>(null);

  // ============================================================
  // P0-2/P2-2: 门口提示可关闭状态
  // ============================================================
  const [isNearExit, setIsNearExit] = useState(false);

  // ============================================================
  // 修复#2: 自适应难度 - 需要在triggerStoryFlag之前声明
  // ============================================================
  const consecutiveDeathsRef = useRef(savedData.current?.consecutiveDeaths || 0);

  // ============================================================
  // 修复#1: 剧情与地图联动 - 状态
  // ============================================================
  const [storyFlags, setStoryFlags] = useState<StoryFlag[]>(() => savedData.current?.storyFlags || []);
  const [currentEdgeNarrative, setCurrentEdgeNarrative] = useState<string>('');
  const [edgeNarrativeVisible, setEdgeNarrativeVisible] = useState(false);
  const [dialogueBubbles, setDialogueBubbles] = useState<DialogueBubble[]>([]);
  
  // 激活剧情flag并显示边缘叙事
  const triggerStoryFlag = useCallback((flag: StoryFlag) => {
    setStoryFlags(prev => {
      if (prev.includes(flag)) return prev;
      const newFlags = [...prev, flag];
      // 自动保存
      const data: SaveData = {
        x: playerRef_latest.current.x, y: playerRef_latest.current.y,
        hasSeenIntro: true,
        hp: playerRef_latest.current.hp, maxHp: playerRef_latest.current.maxHp,
        mp: playerRef_latest.current.mp, maxMp: playerRef_latest.current.maxMp,
        level: playerRef_latest.current.level, exp: playerRef_latest.current.exp, expToLevel: playerRef_latest.current.expToLevel,
        gold: playerRef_latest.current.gold, collectedCards: collectedCardsRef.current, deckIndex: deckIndexRef.current,
        storyFlags: newFlags, consecutiveDeaths: consecutiveDeathsRef.current,
        atk: playerRef_latest.current.atk, def: playerRef_latest.current.def,
        indoorMapId: indoorMapIdRef.current, outdoorPlayerPos: outdoorPlayerPosRef.current,
        boardProgress: boardProgressRef.current,
      };
      saveGame(data);
      return newFlags;
    });
    // 显示边缘叙事（带淡入淡出效果）
    const narratives = EDGE_NARRATIVES[flag];
    if (narratives && narratives.length > 0) {
      const narrative = narratives[Math.floor(Math.random() * narratives.length)];
      setCurrentEdgeNarrative(narrative);
      setEdgeNarrativeVisible(true);
      setEdgeNarrativeOpacity(1);
      setTimeout(() => {
        setEdgeNarrativeOpacity(0);
        setTimeout(() => setEdgeNarrativeVisible(false), 500);
      }, 3500);
    }
  }, [consecutiveDeathsRef]);

  // 在地图元素上显示对话气泡
  const showDialogueBubble = useCallback((x: number, y: number, text: string, speaker?: string, duration = 3000) => {
    const bubble: DialogueBubble = {
      id: `${Date.now()}-${Math.random()}`,
      x, y, text, speaker, duration,
    };
    setDialogueBubbles(prev => [...prev, bubble]);
    setTimeout(() => {
      setDialogueBubbles(prev => prev.filter(b => b.id !== bubble.id));
    }, duration);
  }, []);

  // ============================================================
  // P0-1: 卡组适配玩家状态机制
  // ============================================================
  // 玩家适配状态类型
  interface PlayerAdaptState {
    hpPercent: number;
    killsCount: number;
    consecutiveDeaths: number;
  }

  // 根据玩家状态计算卡牌优先级
  function getCardPriority(card: EventCard, ps: PlayerAdaptState): number {
    let priority = 0;
    if (ps.hpPercent < 0.3 && card.type === 'STAT_UP') priority += 10; // HP低→数值卡优先
    if (ps.killsCount > 10 && card.type === 'EMOTION') priority += 5;   // 击杀多→情感卡优先
    if (card.type === 'MOOD') priority += 3;                              // MOOD固定+3（留白）
    if (card.type === 'EMPTY') priority += 2;                             // EMPTY+2
    priority -= card.rarity;                                              // 稀有度越高越靠后
    return priority;
  }

  // 构建有序卡组队列
  function buildCardQueue(dealer: Dealer, playerState: PlayerAdaptState): EventCard[] {
    const cards = getCardsFromDealer(dealer);
    return [...cards].sort((a, b) => getCardPriority(b, playerState) - getCardPriority(a, playerState));
  }

  // ============================================================
  // P0-2: 动态遭遇系统
  // ============================================================
  function spawnDynamicEncounter(px: number, py: number): DynamicEncounter | null {
    // 城镇内不生成
    if (px >= 32 && px <= 48 && py >= 28 && py <= 44) return null;
    const inactive = DYNAMIC_ENCOUNTERS.filter(e => !e.active);
    if (inactive.length === 0) return null;
    const chosen = inactive[Math.floor(Math.random() * inactive.length)];
    if (Math.random() > (chosen.type === 'TRAVELER' ? 0.3 : 0.15)) return null;
    const angle = Math.random() * Math.PI * 2;
    const dist = 5 + Math.random() * 10;
    chosen.x = Math.floor(px + Math.cos(angle) * dist);
    chosen.y = Math.floor(py + Math.sin(angle) * dist);
    chosen.despawnTimer = chosen.type === 'TRAVELER' ? 30 : 20;
    chosen.active = true;
    // P1-2: 显示遭遇警告
    setEncounterWarning(`发现${chosen.name}！`);
    setTimeout(() => setEncounterWarning(null), 3000);
    return chosen;
  }

  // ============================================================
  // P1-1: 可审问敌人系统
  // ============================================================
  function interrogateEnemy(monsterId: number): EventCard | null {
    const m = monsters.find(x => x.id === monsterId && x.state === 'dead');
    if (!m) return null;
    const successRate = Math.min(0.9, 0.6 + (player.level - (m.atk / 2)) * 0.05);
    if (Math.random() < successRate) {
      const clueCards = ALL_EVENT_CARDS.filter(c => c.type === 'SIDE_STORY' || c.type === 'MAIN_STORY');
      const card = clueCards[Math.floor(Math.random() * clueCards.length)];
      showDialogueBubble(m.x, m.y - 20, `"${m.name}临死前透露了线索..."`, '审问成功', 3000);
      return card;
    }
    showDialogueBubble(m.x, m.y - 20, '"休想套出任何信息！"', '审问失败', 2000);
    return null;
  }

  // ============================================================
  // P1-3: 黄金法则1-cost验证
  // ============================================================
  function canRevealCard(card: EventCard, ps: PlayerAdaptState): boolean {
    if (card.type === 'MOOD' || card.type === 'EMPTY') return true; // 留白无限制
    if (card.type === 'MAIN_STORY' && ps.consecutiveDeaths > 2) return false; // 连续死亡不显示沉重剧情
    if (card.cost) {
      const match = card.cost.match(/击败(\d+)/);
      if (match && ps.killsCount < parseInt(match[1])) return false;
    }
    return true;
  }

  // ============================================================
  // P2-2: 多途径交付UI
  // ============================================================
  function getDeliveryMethods(card: EventCard): { type: string; label: string }[] {
    const methods: { type: string; label: string }[] = [{ type: 'DIALOGUE', label: '对话' }];
    if (card.type === 'SIDE_STORY' || card.type === 'MAIN_STORY') methods.push({ type: 'INTERROGATE', label: '审问' });
    if (card.type === 'MECHANISM') methods.push({ type: 'BATTLE', label: '战斗' });
    if (card.type === 'ECONOMY') methods.push({ type: 'MERCHANT', label: '商人' });
    return methods;
  }

  // ============================================================
  // P2-1: MOOD卡环境渲染
  // ============================================================
  function triggerMoodAmbient(card: EventCard) {
    if (card.type === 'MOOD' || card.type === 'EMPTY') {
      setAmbientEffect({ type: card.id, duration: 5000 });
      // 降低BGM音量
      setBGMVolume(0.02);
      // 屏幕视觉遮罩
      setMoodOverlay(true);
      // 显示氛围文字（带淡入淡出）
      setCurrentEdgeNarrative(card.storyContent || '...');
      setEdgeNarrativeVisible(true);
      setEdgeNarrativeOpacity(1);
      setTimeout(() => {
        setEdgeNarrativeOpacity(0);
        setTimeout(() => setEdgeNarrativeVisible(false), 500);
      }, 4500);
      // 5秒后恢复
      setTimeout(() => {
        setBGMVolume(0.15);
        setMoodOverlay(false);
      }, 5000);
    }
  }

  // ============================================================
  // 修复#2: 自适应难度 - 状态
  // ============================================================
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState<AdaptiveDifficulty>({
    consecutiveDeaths: consecutiveDeathsRef.current,
    atkBonus: 0,
    defBonus: 0,
    isBuffed: false,
  });
  const [adaptiveBuffMessage, setAdaptiveBuffMessage] = useState('');

  // 玩家死亡时增加连续死亡计数
  const handlePlayerDeath = useCallback(() => {
    consecutiveDeathsRef.current += 1;
    if (consecutiveDeathsRef.current >= DEATH_THRESHOLD) {
      // 激活buff
      setAdaptiveDifficulty({
        consecutiveDeaths: consecutiveDeathsRef.current,
        atkBonus: DEATH_ATK_BONUS,
        defBonus: DEATH_DEF_BONUS,
        isBuffed: true,
      });
      setAdaptiveBuffMessage('世界感受到了你的坚持...获得了力量的加持');
      setTimeout(() => setAdaptiveBuffMessage(''), 4000);
    }
    // 保存
    const data: SaveData = {
      x: player.x, y: player.y, hasSeenIntro: true,
      hp: player.hp, maxHp: player.maxHp, mp: player.mp, maxMp: player.maxMp,
      level: player.level, exp: player.exp, expToLevel: player.expToLevel,
      gold: player.gold, collectedCards, deckIndex: 0,
      storyFlags, consecutiveDeaths: consecutiveDeathsRef.current,
      atk: player.atk, def: player.def, indoorMapId, outdoorPlayerPos,
      boardProgress: boardProgressRef.current,
    };
    saveGame(data);
  }, [player, collectedCards, storyFlags, indoorMapId, outdoorPlayerPos]);

  // 玩家击杀怪物时重置计数
  const resetConsecutiveDeaths = useCallback(() => {
    if (consecutiveDeathsRef.current >= DEATH_THRESHOLD) {
      consecutiveDeathsRef.current = 0;
      setAdaptiveDifficulty({
        consecutiveDeaths: 0,
        atkBonus: 0,
        defBonus: 0,
        isBuffed: false,
      });
      const data: SaveData = {
        x: player.x, y: player.y, hasSeenIntro: true,
        hp: player.hp, maxHp: player.maxHp, mp: player.mp, maxMp: player.maxMp,
        level: player.level, exp: player.exp, expToLevel: player.expToLevel,
        gold: player.gold, collectedCards, deckIndex: 0,
        storyFlags, consecutiveDeaths: 0,
        atk: player.atk, def: player.def, indoorMapId, outdoorPlayerPos,
        boardProgress: boardProgressRef.current,
      };
      saveGame(data);
    }
  }, [player, collectedCards, storyFlags, indoorMapId, outdoorPlayerPos]);

  // ============================================================
  // 修复#5: 发牌员专属UI面板 - 状态
  // ============================================================
  const [showBoardPanel, setShowBoardPanel] = useState(false);   // 悬赏板
  const [showCampPanel, setShowCampPanel] = useState(false);     // 营地休息
  const [showMerchantPanel, setShowMerchantPanel] = useState(false); // 商店
  const [showEnvPanel, setShowEnvPanel] = useState(false);      // 石碑对话
  const [selectedQuest, setSelectedQuest] = useState<{ id: string; name: string; reward: number; desc: string } | null>(null);
  const [merchantItems, setMerchantItems] = useState<{ id: string; name: string; price: number; desc: string; type: 'hp' | 'mp' | 'atk' | 'def' }[]>([]);

  // ============================================================
  // 玩家技能系统
  // ============================================================
  interface PlayerSkill {
    id: string;
    name: string;
    element: ElementType;
    baseDamage: number;
    mpCost: number;
    key: string;
    desc: string;
  }

  const PLAYER_SKILLS: PlayerSkill[] = [
    { id: 'skill_slash', name: '普通斩击', element: 'normal', baseDamage: 20, mpCost: 0, key: '1', desc: '无属性斩击' },
    { id: 'skill_fire', name: '火焰术', element: 'fire', baseDamage: 35, mpCost: 15, key: '2', desc: '火属性攻击' },
    { id: 'skill_thunder', name: '雷电术', element: 'electric', baseDamage: 40, mpCost: 20, key: '3', desc: '电属性攻击' },
  ];

  const [selectedSkill, setSelectedSkill] = useState<PlayerSkill>(PLAYER_SKILLS[0]);
  const [skillEffectivenessText, setSkillEffectivenessText] = useState<string>('');

  // ============================================================
  // 野怪自动刷新系统（替代R键手动刷新）- P1-3优化：1fps刷新
  // ============================================================
  const [monsterRefreshTimer, setMonsterRefreshTimer] = useState<number>(0); // seconds until next auto-refresh

  // 自动刷新死亡野怪（每30-60秒随机）
  const scheduleMonsterRefresh = useCallback(() => {
    const nextRefresh = 30 + Math.floor(Math.random() * 30); // 30-60秒
    setMonsterRefreshTimer(nextRefresh);
  }, []);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const interval = setInterval(() => {
      setMonsterRefreshTimer(prev => {
        if (prev <= 1) {
          // 自动刷新所有死亡野怪
          setMonsters(mons => mons.map(m => {
            if (m.state === 'dead') {
              return { ...m, hp: m.maxHp, state: 'patrol' as const };
            }
            return m;
          }));
          scheduleMonsterRefresh();
          return 0;
        }
        return prev - 1;
      });
    }, 1000); // 1fps tick
    return () => clearInterval(interval);
  }, [gameState, scheduleMonsterRefresh]);

  // 剧情触发野怪刷新（可被外部调用）
  useEffect(() => {
    scheduleMonsterRefresh();
  }, []);
  // Bug #3/#7: Keep closure refs updated
  useEffect(() => { playerRef_latest.current = player; }, [player]);
  useEffect(() => { collectedCardsRef.current = collectedCards; }, [collectedCards]);
  useEffect(() => { storyFlagsRef.current = storyFlags; }, [storyFlags]);
  useEffect(() => { indoorMapIdRef.current = indoorMapId; }, [indoorMapId]);
  useEffect(() => { outdoorPlayerPosRef.current = outdoorPlayerPos; }, [outdoorPlayerPos]);
  useEffect(() => { deckIndexRef.current = deckIndex; }, [deckIndex]);

  useEffect(() => { boardProgressRef.current = boardProgress; }, [boardProgress]);

  // ============================================================
  // P2-1: MOOD卡环境渲染 - 5秒后恢复BGM
  // ============================================================
  useEffect(() => {
    if (ambientEffect) {
      const timer = setTimeout(() => {
        setBGMVolume(0.15); // 恢复默认BGM音量
        setAmbientEffect(null);
      }, ambientEffect.duration);
      return () => clearTimeout(timer);
    }
  }, [ambientEffect]);

  const [dealerCards, setDealerCards] = useState<EventCard[]>([]);

  const keysRef = useRef<Set<string>>(new Set());
  // Refs for stale closure fixes (Bug #3, #7)
  const playerRef_latest = useRef(player);
  const collectedCardsRef = useRef(collectedCards);
  const storyFlagsRef = useRef(storyFlags);
  const indoorMapIdRef = useRef(indoorMapId);
  const outdoorPlayerPosRef = useRef(outdoorPlayerPos);
  const deckIndexRef = useRef(deckIndex);
  const nearbyDealerRef = useRef<Dealer | null>(null);

  // P1-4: 虚拟摇杆 refs
  const joystickRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const joystickActive = useRef(false);
  const joystickContainerRef = useRef<HTMLDivElement | null>(null);

  // P1-4: 摇杆移动处理函数
  const handleJoystickMove = useCallback((clientX: number, clientY: number) => {
    if (!joystickContainerRef.current) return;
    const rect = joystickContainerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = rect.width / 2;
    // 归一化到 -1~1
    joystickRef.current.x = Math.max(-1, Math.min(1, dx / maxDist));
    joystickRef.current.y = Math.max(-1, Math.min(1, dy / maxDist));
  }, []);

  // P1-4: 摇杆复位
  const handleJoystickEnd = useCallback(() => {
    joystickActive.current = false;
    joystickRef.current = { x: 0, y: 0 };
  }, []);

  // 点击移动目标
  const [clickTarget, setClickTarget] = useState<{ x: number; y: number } | null>(null);
  const mapDataRef = useRef<number[][]>(createWorldMap());

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

  // 掉落事件卡（代替技能卡）
  const dropCard = useCallback((isElite: boolean): EventCard | null => {
    if (Math.random() > (isElite ? 1.0 : 0.3)) return null;
    // 精英怪掉落更稀有的卡
    const pool = isElite
      ? [...ALL_EVENT_CARDS.filter(c => c.rarity >= 3)]
      : [...ALL_EVENT_CARDS.filter(c => c.rarity <= 3), ...EMPTY_CARDS];
    return pool[Math.floor(Math.random() * pool.length)] || null;
  }, []);

  // 使用指定技能攻击
  const useSkill = useCallback((skill: PlayerSkill) => {
    if (player.cooldown > 0) return;
    if (skill.mpCost > player.mp) {
      // P0-3: MP不足音效+视觉反馈
      playMPInsufficientSound();
      setSkillEffectivenessText('MP不足！');
      setTimeout(() => setSkillEffectivenessText(''), 1500);
      return;
    }
    playAttackSound();
    // 修复#2: 应用自适应难度加成 (atkBonus百分比)
    const atkBonusMultiplier = 1 + adaptiveDifficulty.atkBonus / 100;
    const atkVal = Math.floor(player.atk * (1 + player.atkBuff / 100) * atkBonusMultiplier * (skill.baseDamage / 20));
    setPlayer(p => ({
      ...p,
      cooldown: 20,
      isAttacking: true,
      attackFrame: 10,
      mp: Math.max(0, p.mp - skill.mpCost),
    }));
    setTimeout(() => setPlayer(p => ({ ...p, isAttacking: false })), 250);
    setSkillEffectivenessText('');
    setMonsters(mons => mons.map(m => {
      if (m.state === 'dead') return m;
      const dx = Math.abs(m.x - player.x), dy = Math.abs(m.y - player.y);
      if (dx <= 1.5 && dy <= 1.5) {
        const defElement = m.element2 || m.element;
        const { damage, effectiveness } = calculateDamage(atkVal, skill.element, m.element);
        const nh = m.hp - damage;
        // 根据属性效果设置颜色和提示文字
        let dmgColor = '#ffd93d';
        let effText = '';
        if (effectiveness === 2) { dmgColor = '#ff6b6b'; effText = '效果拔群!'; }
        else if (effectiveness === 0.5) { dmgColor = '#6bff6b'; effText = '效果甚微...'; }
        else if (effectiveness === 0) { dmgColor = '#ffffff'; effText = '没有效果'; }
        addDmg(m.x, m.y, damage, dmgColor);
        setSkillEffectivenessText(effText);
        setTimeout(() => setSkillEffectivenessText(''), 1500);
        if (nh <= 0) {
          playMonsterCry(m.type);
          const card = dropCard(m.isElite || false);
          if (card) {
            // P1-3: 黄金法则1-cost验证
            const playerAdaptState: PlayerAdaptState = {
              hpPercent: playerRef.current.hp / playerRef.current.maxHp,
              killsCount: monstersDefeatedCountRef.current,
              consecutiveDeaths: consecutiveDeathsRef.current,
            };
            if (canRevealCard(card, playerAdaptState)) {
              // P2-1: 触发MOOD卡环境渲染
              triggerMoodAmbient(card);
              setCardRewards([card]);
              setShowRewards(true);
            }
          }
          setPlayer(p => ({ ...p, exp: p.exp + m.exp, gold: p.gold + m.gold }));
          playItemSound();
          // 修复#2: 击杀怪物后重置连续死亡计数
          resetConsecutiveDeaths();
          // 修复#3: 击杀后自动保存
          const data: SaveData = {
            x: playerRef_latest.current.x, y: playerRef_latest.current.y, hasSeenIntro: true,
            hp: playerRef_latest.current.hp, maxHp: playerRef_latest.current.maxHp, mp: playerRef_latest.current.mp, maxMp: playerRef_latest.current.maxMp,
            level: playerRef_latest.current.level, exp: playerRef_latest.current.exp, expToLevel: playerRef_latest.current.expToLevel,
            gold: playerRef_latest.current.gold, collectedCards: collectedCardsRef.current, deckIndex: deckIndexRef.current,
            storyFlags: storyFlagsRef.current, consecutiveDeaths: consecutiveDeathsRef.current,
            atk: playerRef_latest.current.atk, def: playerRef_latest.current.def, indoorMapId: indoorMapIdRef.current, outdoorPlayerPos: outdoorPlayerPosRef.current,
            boardProgress: boardProgressRef.current,
          };
          saveGame(data);
        // Bug #9: Track monsters defeated for STAT_UP card triggers and quest progress
        if (nh <= 0) {
          const newCount = monstersDefeatedCountRef.current + 1;
          monstersDefeatedCountRef.current = newCount;
          setMonstersDefeatedCount(newCount);
          // Bug #10: Update quest board progress
          const newProgress = { ...boardProgressRef.current };
          newProgress['total_kills'] = (newProgress['total_kills'] || 0) + 1;
          if (m.isElite) {
            newProgress['elite_kills'] = (newProgress['elite_kills'] || 0) + 1;
          }
          boardProgressRef.current = newProgress;
          setBoardProgress(newProgress);
          // STAT_UP card trigger every 10 kills
          if (newCount % 10 === 0) {
            const statCards = STAT_UP_CARDS.filter(c => c.rarity <= 3);
            if (statCards.length > 0) {
              const reward = statCards[Math.floor(Math.random() * statCards.length)];
              setCardRewards([reward]);
              setShowRewards(true);
            }
          }
        }
        }
        return { ...m, hp: nh, state: nh <= 0 ? 'dead' : m.state };
      }
      return m;
    }));
  }, [player, addDmg, dropCard, adaptiveDifficulty, resetConsecutiveDeaths, collectedCards, storyFlags, indoorMapId, outdoorPlayerPos, deckIndex]);

  // 默认普攻（使用当前选中的技能）
  const attack = useCallback(() => {
    useSkill(selectedSkill);
  }, [selectedSkill, useSkill]);

  const dodge = useCallback(() => {
    if (player.cooldown > 0) return;
    const dirs: Record<string, [number, number]> = { up: [0, -3], down: [0, 3], left: [-3, 0], right: [3, 0] };
    const [dx, dy] = dirs[player.facing];
    let nx = player.x + dx;
    let ny = player.y + dy;
    const tile = getCurrentTerrain(Math.floor(nx), Math.floor(ny));
    if (tile !== TERRAIN.WALL && tile !== TERRAIN.WATER && tile !== TERRAIN.BUILDING) {
      setPlayer(p => ({ ...p, x: nx, y: ny, cooldown: 15, invincible: 10 }));
      playMoveSound();
    }
  }, [player, getCurrentTerrain]);

  // 检查与发牌员的交互
  const checkDealerInteraction = useCallback(() => {
    for (const dealer of DEALERS) {
      const dx = Math.abs(player.x - dealer.x), dy = Math.abs(player.y - dealer.y);
      if (dx <= 1.5 && dy <= 1.5) return dealer;
    }
    return null;
  }, [player]);

  const checkInteraction = useCallback(() => {
    for (const t of treasures) {
      if (!t.opened) {
        const dx = Math.abs(player.x - t.x), dy = Math.abs(player.y - t.y);
        if (dx <= 1.5 && dy <= 1.5) return `treasure_${t.id}`;
      }
    }
    return null;
  }, [player, treasures]);

  // 检测是否靠近建筑入口或室内出口（自动弹出提示）
  const checkProximityTrigger = useCallback((): { type: 'enter_building' | 'exit_indoor'; mapId: IndoorMapId } | null => {
    // 在室内：检测是否靠近出口
    if (indoorMapId !== 'none') {
      const map = INDOOR_MAPS[indoorMapId];
      const dx = Math.abs(player.x - map.exitPos.x);
      const dy = Math.abs(player.y - map.exitPos.y);
      if (dx < 1.8 && dy < 1.8) {
        return { type: 'exit_indoor', mapId: indoorMapId };
      }
      return null;
    }
    // 在室外：检测是否靠近建筑入口
    for (const entry of BUILDING_ENTRIES) {
      const dx = Math.abs(player.x - entry.x);
      const dy = Math.abs(player.y - entry.y);
      if (dx < 1.8 && dy < 1.8) {
        return { type: 'enter_building', mapId: entry.indoorMapId };
      }
    }
    return null;
  }, [player.x, player.y, indoorMapId]);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      if (e.key === 'j' || e.key === 'J') attack();
      if (e.key === ' ') { e.preventDefault(); dodge(); }
      // 技能快捷键 1/2/3
      if (e.key === '1') { setSelectedSkill(PLAYER_SKILLS[0]); useSkill(PLAYER_SKILLS[0]); }
      if (e.key === '2') { setSelectedSkill(PLAYER_SKILLS[1]); useSkill(PLAYER_SKILLS[1]); }
      if (e.key === '3') { setSelectedSkill(PLAYER_SKILLS[2]); useSkill(PLAYER_SKILLS[2]); }
      // E键：确认/取消进出提示 或 发牌员交互 或 宝箱
      if ((e.key === 'e' || e.key === 'E')) {
        resumeAudio();
        // 如果有proximity提示，确认执行
        if (proximityPrompt) {
          if (proximityPrompt.type === 'enter_building') {
            enterIndoorMap(proximityPrompt.mapId);
          } else if (proximityPrompt.type === 'exit_indoor') {
            exitIndoorMap();
          }
          return;
        }
        // 如果在室内，尝试退出（兼容无提示的情况）
        if (indoorMapId !== 'none') {
          const map = INDOOR_MAPS[indoorMapId];
          const dx = Math.abs(player.x - map.exitPos.x);
          const dy = Math.abs(player.y - map.exitPos.y);
          if (dx < 2 && dy < 2) {
            exitIndoorMap();
            return;
          }
        }
        // 检查建筑入口（兼容无提示的情况）
        const buildingEntry = checkBuildingEntry();
        if (buildingEntry) {
          enterIndoorMap(buildingEntry);
          return;
        }

        // ============================================================
        // P1-1: 可审问敌人系统 - 检查附近可审问的死亡怪物
        // ============================================================
        // 查找附近有死亡怪物
        const nearbyDeadMonster = monsters.find(m => {
          if (m.state !== 'dead') return false;
          const dist = Math.sqrt(Math.pow(player.x - m.x, 2) + Math.pow(player.y - m.y, 2));
          return dist < 2;
        });
        if (nearbyDeadMonster) {
          const card = interrogateEnemy(nearbyDeadMonster.id);
          if (card) {
            setCardRewards([card]);
            setShowRewards(true);
          }
          return;
        }

        if (nearbyDealer) {
          // 修复#5: 发牌员功能区分 - 根据类型显示专属UI
          if (nearbyDealer.type === 'BOARD') {
            setShowBoardPanel(true);
          } else if (nearbyDealer.type === 'CAMP') {
            setShowCampPanel(true);
            triggerStoryFlag('camp_rest');
          } else if (nearbyDealer.type === 'MERCHANT') {
            // 初始化商人商品
            setMerchantItems([
              { id: 'hp_potion', name: 'HP药水', price: 50, desc: '恢复30HP', type: 'hp' },
              { id: 'mp_potion', name: 'MP药水', price: 40, desc: '恢复20MP', type: 'mp' },
              { id: 'atk_scroll', name: '攻击卷轴', price: 200, desc: '攻击力+5(永久)', type: 'atk' },
              { id: 'def_scroll', name: '防御卷轴', price: 200, desc: '防御力+3(永久)', type: 'def' },
            ]);
            setShowMerchantPanel(true);
            triggerStoryFlag('merchant_first');
          } else if (nearbyDealer.type === 'ENVIRONMENT') {
            // 石碑显示剧情碎片
            const inscriptionIndex = storyFlags.length % STONE_TABLET_INScriptions.length;
            const inscription = STONE_TABLET_INScriptions[inscriptionIndex];
            if (inscription) {
              showDialogueBubble(nearbyDealer.x, nearbyDealer.y - 20, inscription.join(' '), '石碑', 5000);
              triggerStoryFlag('stone_tablet_read');
            }
          } else if (nearbyDealer.type === 'NPC') {
            // NPC显示对话气泡
            const npcData = NPC_DIALOGUES[nearbyDealer.id];
            if (npcData) {
              let dialogueList: string[] = npcData.default;
              // 检查是否有flag触发的对话
              for (const flag of storyFlags) {
                if (npcData.flagged[flag]) {
                  dialogueList = npcData.flagged[flag];
                  break;
                }
              }
              const dialogue = dialogueList[Math.floor(Math.random() * dialogueList.length)];
              showDialogueBubble(nearbyDealer.x, nearbyDealer.y - 20, dialogue, nearbyDealer.name, 4000);
            }
          } else if (nearbyDealer.type === 'WANDERER') {
            // ============================================================
            // P2-3: 酒馆浪人类型 - 神秘线索型NPC
            // 给玩家一个"线索"：告知附近有什么大师/地点
            // ============================================================
            const clues = [
              '"在西北荒原，据说有位隐居的老猎人，他掌握着虚渊的秘密..."',
              '"东海之滨，有一位赏金猎人铁面，他和王城有着千丝万缕的联系..."',
              '"平和医院的苏婉儿小姐，她的家族与虚渊古神有着契约..."',
              '"篝火营地是休息的好地方，但小心夜里的巡逻匪帮..."',
              '"羊蹄山脚下的洞窟，据说藏着初代觉醒者的遗物..."',
            ];
            const clue = clues[Math.floor(Math.random() * clues.length)];
            showDialogueBubble(nearbyDealer.x, nearbyDealer.y - 20, clue, nearbyDealer.name, 6000);

            // P1-3: 黄金法则1-cost验证 - 检查卡牌是否可揭示
            const playerAdaptState: PlayerAdaptState = {
              hpPercent: player.hp / player.maxHp,
              killsCount: monstersDefeatedCountRef.current,
              consecutiveDeaths: consecutiveDeathsRef.current,
            };

            // 给玩家一张对应类型的卡（先验证canRevealCard）
            const wandererCards = ALL_EVENT_CARDS.filter(c =>
              nearbyDealer.supportedCardTypes.includes(c.type)
            );
            // 找出第一张满足canRevealCard条件的卡
            const revealableCard = wandererCards.find(c => canRevealCard(c, playerAdaptState));
            if (revealableCard) {
              // P2-1: 触发MOOD卡环境渲染
              triggerMoodAmbient(revealableCard);
              setCardRewards([revealableCard]);
              setShowRewards(true);
            } else {
              showDialogueBubble(nearbyDealer.x, nearbyDealer.y - 20, '"时机未到...继续努力吧。"', '神秘浪人', 3000);
            }
          } else {
            // P0-1: 默认行为：显示发牌员对话框面板
            setSelectedDealer(nearbyDealer);
            setShowDealerPanel(true);
          }
        } else if (interactionHint && interactionHint.startsWith('treasure_')) {
          playChestSound();
          const treasureId = interactionHint.split('_')[1];
          const tid = parseInt(treasureId);
          setTreasures(ts => ts.map(t => t.id === tid ? { ...t, opened: true } : t));
          const reward = ALL_EVENT_CARDS[Math.floor(Math.random() * 3)];
          // P1-3: 黄金法则1-cost验证
          const playerAdaptState: PlayerAdaptState = {
            hpPercent: player.hp / player.maxHp,
            killsCount: monstersDefeatedCountRef.current,
            consecutiveDeaths: consecutiveDeathsRef.current,
          };
          if (canRevealCard(reward, playerAdaptState)) {
            // P2-1: 触发MOOD卡环境渲染
            triggerMoodAmbient(reward);
            setCardRewards([reward]);
            setShowRewards(true);
          }
          setClickTarget(null);
        }
      }
    };
    const onUp = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, [player, attack, dodge, nearbyDealer, indoorMapId, exitIndoorMap, enterIndoorMap, checkBuildingEntry, proximityPrompt, useSkill, selectedSkill]);

  // 更新附近发牌员状态
  useEffect(() => {
    if (gameState === 'playing') {
      const dealer = checkDealerInteraction();
      setNearbyDealer(dealer);
    }
  }, [player, gameState, checkDealerInteraction]);

  // P0-2/P2-2: 自动检测建筑入口/出口，弹出可关闭的进出提示（不自动进入）
  useEffect(() => {
    if (gameState !== 'playing') return;
    const trigger = checkProximityTrigger();
    if (trigger && (!proximityPrompt || proximityPrompt.mapId !== trigger.mapId || proximityPrompt.type !== trigger.type)) {
      // 清除旧的计时器
      if (proximityTimerRef.current) clearInterval(proximityTimerRef.current);
      // 显示新提示（不自动进入）
      setProximityPrompt({ ...trigger, autoEnterCountdown: 0 });
      setIsNearExit(true);
    } else if (!trigger && proximityPrompt) {
      // 离开了触发区域，清除提示
      if (proximityTimerRef.current) clearInterval(proximityTimerRef.current);
      setProximityPrompt(null);
      setIsNearExit(false);
    }
    return () => {
      if (proximityTimerRef.current) clearInterval(proximityTimerRef.current);
    };
  }, [player.x, player.y, indoorMapId, gameState]);

  const interactionHint = checkInteraction();
  const inSafeZone = player.x >= 32 && player.x <= 48 && player.y >= 28 && player.y <= 44;

  // 游戏主循环
  useEffect(() => {
    if (gameState !== 'playing') return;
        playerRef.current = player;
  let raf: number; let lastTime = 0;
    const loop = (time: number) => {
      if (time - lastTime >= 16) {
        lastTime = time;
        setAnimFrame(f => f + 1);

        let dx = 0, dy = 0;
        // 点击移动：如果有目标，持续向目标移动
        if (clickTarget && !keysRef.current.has('w') && !keysRef.current.has('a') && !keysRef.current.has('s') && !keysRef.current.has('d')) {
          const dx = clickTarget.x - playerRef.current.x;
          const dy = clickTarget.y - playerRef.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 0.5) {
            setClickTarget(null); // 到达目标
          } else {
            const moveX = dx / dist;
            const moveY = dy / dist;
            // 设置facing方向
            if (Math.abs(moveX) > Math.abs(moveY)) {
              setPlayer(p => ({ ...p, facing: moveX > 0 ? 'right' : 'left' }));
            } else {
              setPlayer(p => ({ ...p, facing: moveY > 0 ? 'down' : 'up' }));
            }
          }
        }
        if (keysRef.current.has('w') || keysRef.current.has('arrowup')) { dy = -1; setPlayer(p => ({ ...p, facing: 'up' })); }
        if (keysRef.current.has('s') || keysRef.current.has('arrowdown')) { dy = 1; setPlayer(p => ({ ...p, facing: 'down' })); }
        if (keysRef.current.has('a') || keysRef.current.has('arrowleft')) { dx = -1; setPlayer(p => ({ ...p, facing: 'left' })); }
        if (keysRef.current.has('d') || keysRef.current.has('arrowright')) { dx = 1; setPlayer(p => ({ ...p, facing: 'right' })); }

        // P1-4: 虚拟摇杆输入处理
        const jx = joystickRef.current.x;
        const jy = joystickRef.current.y;
        if (Math.abs(jx) > 0.2 || Math.abs(jy) > 0.2) {
          dx = jx;
          dy = jy;
          // 根据摇杆方向设置facing
          if (Math.abs(jx) > Math.abs(jy)) {
            setPlayer(p => ({ ...p, facing: jx > 0 ? 'right' : 'left' }));
          } else {
            setPlayer(p => ({ ...p, facing: jy > 0 ? 'down' : 'up' }));
          }
        }

        // 点击移动目标移动
        if (clickTarget && (dx === 0 && dy === 0)) {
          const cdx = clickTarget.x - playerRef.current.x;
          const cdy = clickTarget.y - playerRef.current.y;
          const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
          if (cdist >= 0.5) {
            dx = cdx / cdist;
            dy = cdy / cdist;
          }
        }
        if (dx !== 0 || dy !== 0) {
          setPlayer(p => {
            let nx = p.x + dx * 0.08, ny = p.y + dy * 0.08;
            const tile = getCurrentTerrain(Math.floor(nx), Math.floor(ny));
            if (tile === TERRAIN.WALL || tile === TERRAIN.WATER || tile === TERRAIN.BUILDING) return p;
            // 每隔几步播放一次脚步声
            if (animFrame % 8 === 0) playMoveSound();
            return { ...p, x: nx, y: ny };
          });
        }

        setPlayer(p => ({ ...p, cooldown: Math.max(0, p.cooldown - 1), invincible: Math.max(0, p.invincible - 1), attackFrame: Math.max(0, p.attackFrame - 1) }));

        setPlayer(p => {
          if (p.exp >= p.expToLevel) return { ...p, level: p.level + 1, exp: p.exp - p.expToLevel, expToLevel: Math.floor(p.expToLevel * 1.5), maxHp: p.maxHp + 20, hp: p.maxHp + 20, atk: p.atk + 5, maxMp: p.maxMp + 10, mp: p.maxMp + 10 };
          return p;
        });

        setCamera(c => ({ 
          x: Math.max(0, Math.min(MAP_WIDTH - Math.ceil(dimensions.width / TILE_SIZE), playerRef.current.x - Math.ceil(dimensions.width / TILE_SIZE / 2))), 
          y: Math.max(0, Math.min(MAP_HEIGHT - Math.ceil(dimensions.height / TILE_SIZE), playerRef.current.y - Math.ceil(dimensions.height / TILE_SIZE / 2))) 
        }));

        setMonsters(mons => mons.map(m => {
          if (m.state === 'dead') return m;
          const pdx = playerRef.current.x - m.x, pdy = playerRef.current.y - m.y, dist = Math.sqrt(pdx * pdx + pdy * pdy);
          let nx = m.x, ny = m.y, ns = m.state, ncd = Math.max(0, m.cd - 1);
          const inTown = m.x >= 32 && m.x <= 48 && m.y >= 28 && m.y <= 44;
          if (dist < 6 && !inTown) ns = 'chase';
          else if (dist > 12) ns = 'patrol';
          if (ns === 'chase' && !inTown) {
            nx = m.x + pdx / dist * 0.35; ny = m.y + pdy / dist * 0.35;
            const tile = getCurrentTerrain(Math.floor(nx), Math.floor(ny));
            if (tile === TERRAIN.WALL || tile === TERRAIN.WATER || tile === TERRAIN.BUILDING) { nx = m.x; ny = m.y; }
          }
          if (ns === 'patrol') {
            nx = m.x + m.dir * 0.2;
            const tile = getCurrentTerrain(Math.floor(nx), Math.floor(m.y));
            if (tile === TERRAIN.WALL || tile === TERRAIN.WATER || tile === TERRAIN.BUILDING) nx = m.x;
            if (Math.abs(nx - m.x) > 3) return { ...m, x: nx, y: ny, state: ns, cd: ncd, dir: -m.dir };
          }
          if (dist < 1.2 && ncd <= 0 && playerRef.current.invincible <= 0 && !inTown) {
            // 怪物使用技能攻击 (计算属性克制)
            const skillElement = m.skillElement || m.element;
            const baseDmg = m.skillBaseDamage || m.atk;
            // 修复#2: 应用自适应难度防御加成
            const defReduction = 1 - adaptiveDifficulty.defBonus / 100;
            const reducedBaseDmg = Math.floor(baseDmg * defReduction);
            const { damage, effectiveness } = calculateDamage(reducedBaseDmg, skillElement, 'normal');
            // 根据伤害调整音效
            if (damage > 20) playHurtHeavySound();
            else playHurtLightSound();
            addDmg(playerRef.current.x, playerRef.current.y, damage, '#ff6b6b');
            setPlayer(p => ({ ...p, hp: Math.max(0, p.hp - damage) }));
            ncd = 60;
          }
          return { ...m, x: nx, y: ny, state: ns, cd: ncd };
        }));

        setDamages(d => d.map(x => ({ ...x, t: x.t - 1, y: x.y - 0.4 })).filter(x => x.t > 0));

        // ============================================================
        // P0-2: 动态遭遇系统 - 每60帧检测一次
        // ============================================================
        if (animFrame % 60 === 0 && indoorMapId === 'none') {
          const encounter = spawnDynamicEncounter(playerRef.current.x, playerRef.current.y);
          if (encounter) {
            showDialogueBubble(encounter.x, encounter.y - 20, encounter.dialogue, encounter.name, 4000);
          }
          // 倒计时动态遭遇
          DYNAMIC_ENCOUNTERS.forEach(e => {
            if (e.active) {
              e.despawnTimer--;
              if (e.despawnTimer <= 0) e.active = false;
            }
          });
        }

        if (playerRef.current.hp <= 0) {
          // 修复#2: 处理玩家死亡，增加连续死亡计数
          handlePlayerDeath();
          setGameState('gameover');
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [gameState, addDmg, dimensions, handlePlayerDeath, adaptiveDifficulty, indoorMapId]);

  // 绘制函数

  // [Drawing functions moved to module level above]

  // 渲染
  useEffect(() => {
    if (gameState !== 'playing' || !canvasRef.current) return;
    const cvs = canvasRef.current;
    const ctx = cvs.getContext('2d'); if (!ctx) return;
    const W = cvs.width, H = cvs.height;
    // Sky gradient background - lighter for visibility
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, COLORS.skyTop); gradient.addColorStop(1, COLORS.skyBottom);
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, W, H);
    // 星空粒子效果
    const starSeed = 12345;
    for (let i = 0; i < 60; i++) {
      const sx = ((starSeed * (i + 1) * 7) % W);
      const sy = ((starSeed * (i + 1) * 13) % H);
      const sb = 0.3 + ((starSeed * (i + 1)) % 10) / 15;
      const ss = 0.5 + ((starSeed * (i + 1)) % 5) / 10;
      const twinkle = Math.sin(animFrame * 0.03 + i) > 0 ? 1 : 0.6;
      ctx.fillStyle = `rgba(255, 255, 240, ${sb * twinkle})`;
      ctx.beginPath(); ctx.arc(sx, sy, ss, 0, Math.PI * 2); ctx.fill();
    }
    // ox/oy = 0 意味着 tile 0 在 screen 0 开始渲染
    // tile mx 显示在 screen (mx - camera.x) * TILE_SIZE
    // 可见范围是 tile camera.x 到 tile (camera.x + W/TILE_SIZE)
    const ox = 0;
    const oy = 0;

    // tilesX/Y 必须覆盖从 camera 位置到 camera + 可见范围
    const tilesX = Math.ceil(W / TILE_SIZE) + Math.ceil(camera.x) + 2;
    const tilesY = Math.ceil(H / TILE_SIZE) + Math.ceil(camera.y) + 2;

    for (let ty = 0; ty < tilesY; ty++) {
      for (let tx = 0; tx < tilesX; tx++) {
        const mx = Math.floor(camera.x) + tx, my = Math.floor(camera.y) + ty;
        // 获取当前地形（支持室内地图）
        const terrain = getCurrentTerrain(mx, my);
        // 边界检查（仅对室外地图）
        if (indoorMapId === 'none' && (mx < 0 || my < 0 || mx >= MAP_WIDTH || my >= MAP_HEIGHT)) continue;
        // 室内地图边界检查
        if (indoorMapId !== 'none') {
          const map = INDOOR_MAPS[indoorMapId];
          if (mx < 0 || my < 0 || mx >= map.width || my >= map.height) continue;
        }
        drawTile(ctx, terrain, tx * TILE_SIZE + ox, ty * TILE_SIZE + oy, mx, my, animFrame);
      }
    }

    const inSZ = player.x >= 32 && player.x <= 48 && player.y >= 28 && player.y <= 44;
    if (inSZ) {
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

    // 绘制发牌员（包括NPC和公告板等）- 不在室内显示
    if (indoorMapId === 'none') {
      DEALERS.forEach(dealer => {
        const sx = (dealer.x - camera.x) * TILE_SIZE + TILE_SIZE / 2;
        const sy = (dealer.y - camera.y) * TILE_SIZE + TILE_SIZE / 2;
        if (sx < -50 || sx > W + 50 || sy < -50 || sy > H + 50) return;
        drawDealer(ctx, sx, sy, dealer, animFrame, storyFlags);
      });
    }

    // 宝箱（不在室内显示）
    if (indoorMapId === 'none') {
      treasures.forEach(t => {
        if (t.opened) return;
        const sx = (t.x - camera.x) * TILE_SIZE + TILE_SIZE / 2;
        const sy = (t.y - camera.y) * TILE_SIZE + TILE_SIZE / 2;
        if (sx < -50 || sx > W + 50 || sy < -50 || sy > H + 50) return;
        drawTreasure(ctx, sx, sy, t.opened, animFrame);
      });
    }

    monsters.forEach(m => {
      const sx = (m.x - camera.x) * TILE_SIZE + TILE_SIZE / 2;
      const sy = (m.y - camera.y) * TILE_SIZE + TILE_SIZE / 2;
      if (sx < -50 || sx > W + 50 || sy < -50 || sy > H + 50) return;

      // 计算与玩家的距离（用于多个判断）
      const distToPlayer = Math.sqrt(Math.pow(player.x - m.x, 2) + Math.pow(player.y - m.y, 2));

      // ============================================================
      // P1-1: 可审问敌人系统 - 死亡怪物显示审问选项
      // ============================================================
      if (m.state === 'dead') {
        ctx.globalAlpha = 0.35;
        drawMonsterSprite(ctx, m, animFrame);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#666';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('已击杀', sx, sy + 20);
        // 玩家靠近时显示审问选项
        if (distToPlayer < 2) {
          ctx.fillStyle = '#A855F7';
          ctx.font = 'bold 10px sans-serif';
          ctx.fillText('❓ 审问', sx, sy + 32);
        }
        ctx.textAlign = 'left';
        return;
      }

      drawMonsterSprite(ctx, m, animFrame);
      const hp = m.hp / m.maxHp;
      // 血条背景
      ctx.fillStyle = '#333'; ctx.fillRect(sx - 15, sy - 28, 30, 4);
      ctx.fillStyle = hp > 0.5 ? '#4ade80' : hp > 0.25 ? '#fbbf24' : '#ef4444';
      ctx.fillRect(sx - 15, sy - 28, 30 * hp, 4);
      // 属性图标
      ctx.fillStyle = ELEMENT_COLORS[m.element];
      ctx.font = '8px sans-serif';
      ctx.fillText(ELEMENT_ICONS[m.element], sx - 3, sy - 32);
      // 等级
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText(`Lv${m.level}`, sx + 8, sy - 24);
      // 追逐警告
      if (m.state === 'chase') {
        ctx.fillStyle = '#ff6b6b'; ctx.font = 'bold 14px sans-serif';
        ctx.fillText('!', sx + 12, sy - 20);
      }
      if (m.isElite) {
        ctx.fillStyle = '#FFD700'; ctx.font = 'bold 10px sans-serif';
        ctx.fillText('精英', sx - 12, sy - 32);
      }
      // 玩家靠近时显示名称
      if (distToPlayer < 6) {
        ctx.fillStyle = '#fff';
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(m.name, sx, sy + 24);
        ctx.textAlign = 'left';
      }
    });

    const px = (player.x - camera.x) * TILE_SIZE + TILE_SIZE / 2;
    const py = (player.y - camera.y) * TILE_SIZE + TILE_SIZE / 2;
    drawPlayerSprite(ctx, px, py, player.facing, animFrame, player.isAttacking, player.invincible);

    damages.forEach(d => {
      ctx.fillStyle = d.color;
      ctx.font = 'bold 14px sans-serif';
      const dx = (d.x - camera.x) * TILE_SIZE + TILE_SIZE / 2;
      const dy = (d.y - camera.y) * TILE_SIZE + TILE_SIZE / 2;
      ctx.fillText(`-${d.v}`, dx, dy);
    });
  }, [player, camera, monsters, damages, gameState, animFrame, storyFlags]);

  // ===================== 剧情界面（条件渲染，避免hooks违规） =====================
  const renderStoryOverlay = () => {
    const cur = STORY_LINES[storyIdx];
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-4">
        <button
          onClick={async () => {
            if (character?.id) {
              try {
                await characterSave.save(character.id, { x: player.x, y: player.y, hasSeenIntro: true });
              } catch(e) { /* ignore */ }
            }
            setGameState('playing');
          }}
          className="absolute top-4 right-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-bold z-20"
        >
          跳过全部 🚀
        </button>
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
          <button onClick={async () => {
            if (storyIdx < STORY_LINES.length - 1) {
              setStoryIdx(storyIdx + 1);
            } else {
              if (character?.id) {
                try {
                  await characterSave.save(character.id, { x: player.x, y: player.y, hasSeenIntro: true });
                } catch(e) { /* ignore */ }
              }
              setGameState('playing');
            }
          }}
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold transition-colors">
            {storyIdx < STORY_LINES.length - 1 ? (typingDone ? '继续 →' : '跳过') : '开始冒险！'}
          </button>
        </div>
      </div>
    );
  };

  // 游戏结束
  const renderGameoverOverlay = () => {
    return (
      <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold text-red-500 mb-4">💀 游戏结束</h1>
        <p className="text-slate-300 mb-8">你被怪物击败了...</p>
        <button onClick={() => {
          const newPlayer = { ...player, x: 40, y: 36, hp: player.maxHp, mp: player.maxMp, energy: player.maxEnergy };
          setPlayer(newPlayer);
          setMonsters(m => m.map(x => ({ ...x, hp: x.maxHp, state: 'patrol' })));
          if (character?.id) {
            characterSave.save(character.id, { x: 40, y: 36, hp: player.maxHp, maxHp: player.maxHp, mp: player.maxMp, maxMp: player.maxMp });
          }
          setGameState('playing');
        }}
          className="px-8 py-3 bg-amber-600 text-white rounded-xl font-bold">重新开始</button>
      </div>
    );
  };

  // 事件卡奖励弹窗
  const renderRewardsOverlay = () => {
    if (!showRewards || cardRewards.length === 0) return null;
    const card = cardRewards[0];
    const rarityColor = RARITY_COLORS[card.rarity];
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-gradient-to-b from-yellow-900 to-slate-900 rounded-2xl p-8 border-2 shadow-2xl max-w-sm w-full mx-4 text-center" style={{ borderColor: rarityColor }}>
          <div className="text-4xl mb-4">🎉</div>
          <h2 className="text-xl font-bold text-yellow-400 mb-2">获得事件卡！</h2>
          <div style={{ borderColor: rarityColor, borderWidth: 2, borderRadius: 12, padding: 16, background: '#1a1a2e', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 20 }}>{CARD_TYPE_ICONS[card.type]}</span>
              <span style={{ color: rarityColor, fontSize: 16 }}>{RARITY_NAMES[card.rarity]}</span>
            </div>
            <div style={{ color: 'white', fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>{card.name}</div>
            <div style={{ color: '#9CA3AF', fontSize: 12, lineHeight: 1.5, marginBottom: 8 }}>{card.description}</div>
            {card.cost && <div style={{ color: '#F97316', fontSize: 11, marginBottom: 4 }}>💎 成本：{card.cost}</div>}
            {card.storyContent && <div style={{ color: '#A78BFA', fontSize: 11, fontStyle: 'italic', marginBottom: 4 }}>📖 {card.storyContent}</div>}
            {card.effect && <div style={{ color: '#4ADE80', fontSize: 11 }}>⚡ 效果：{card.effect}</div>}
          </div>
          <button
            onClick={() => {
              setCollectedCards(prev => [...prev, card]);
              setShowRewards(false);
              setCardRewards([]);
            }}
            className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl font-bold">
            收入卡组
          </button>
        </div>
      </div>
    );
  };

  // 发牌员界面 - 卡组系统隐藏在游戏表层之下，按E触发剧情对话
  // （已移除卡牌收藏UI，发牌员直接触发事件）

  // 卡组查看弹窗 - 提取为函数避免hooks违规
  const renderCardGameModal = () => {
    const nextCard = cardRewards.length > 0 ? cardRewards[0] : (collectedCards.length < ALL_EVENT_CARDS.length ? ALL_EVENT_CARDS.find(c => !collectedCards.some(x => x.id === c.id)) : null);
    const upcomingCards = collectedCards.slice(0, 5);
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50" onClick={() => setShowCardGame(false)}>
        <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl p-6 border border-purple-500 shadow-2xl max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-purple-400">🃏 事件卡组</h2>
            <button onClick={() => setShowCardGame(false)} className="text-slate-400 hover:text-white text-2xl">&times;</button>
          </div>
          {nextCard ? (
            <div className="mb-4">
              <div className="text-xs text-slate-500 mb-2">🎯 下一张（待触发）</div>
              <div className="rounded-xl p-4 border-2" style={{ borderColor: RARITY_COLORS[nextCard.rarity], background: '#0f0f1a' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{CARD_TYPE_ICONS[nextCard.type]}</span>
                  <span className="text-white font-bold">{nextCard.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded" style={{ background: RARITY_COLORS[nextCard.rarity], color: 'white' }}>{RARITY_NAMES[nextCard.rarity]}</span>
                </div>
                <div className="text-slate-400 text-sm">{nextCard.description}</div>
                {nextCard.storyContent && <div className="text-purple-300 text-xs mt-1 italic">📖 {nextCard.storyContent}</div>}
              </div>
            </div>
          ) : (
            <div className="mb-4 p-4 bg-slate-800 rounded-xl text-center text-slate-500">🎉 所有卡牌已收集！</div>
          )}
          {upcomingCards.length > 0 && (
            <div>
              <div className="text-xs text-slate-500 mb-2">📋 已收集 {collectedCards.length}/{ALL_EVENT_CARDS.length} 张</div>
              <div className="grid grid-cols-5 gap-2">
                {upcomingCards.map(card => (
                  <div key={card.id} className="rounded-lg p-2 text-center" style={{ background: '#1a1a2e', border: `1px solid ${RARITY_COLORS[card.rarity]}` }}>
                    <div className="text-xl mb-1">{CARD_TYPE_ICONS[card.type]}</div>
                    <div className="text-xs text-white truncate">{card.name.substring(0, 6)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <button onClick={() => setShowCardGame(false)} className="w-full mt-4 py-3 bg-purple-600 hover:bg-purple-600 text-white rounded-xl font-bold">返回游戏</button>
        </div>
      </div>
    );
  };

  // ===================== 游戏主界面 =====================
  // BGM和音效
  useEffect(() => {
    if (gameState === 'playing') {
      resumeAudio();
      startBGM(0.04);
    }
    return () => { stopBGM(); resumeAudio(); };
  }, [gameState]);

  // 升级音效
  useEffect(() => {
    if (player.level > 1 && player.exp < player.expToLevel) {
      // 刚升级
      playLevelUpSound();
    }
  }, [player.level]);

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* 所有覆盖层 - 条件渲染，避免hooks违规 */}
      {gameState === 'story' && renderStoryOverlay()}
      {gameState === 'gameover' && renderGameoverOverlay()}
      {showRewards && cardRewards.length > 0 && renderRewardsOverlay()}
      {showCardGame && renderCardGameModal()}
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
        <div className="text-slate-400 text-sm">💰 {player.gold}</div>
        <div className="text-slate-400 text-sm">EXP: {player.exp}/{player.expToLevel}</div>
        <button onClick={() => setShowCardGame(true)} className="ml-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 rounded-lg text-white text-sm font-bold flex items-center gap-1">
          🃏 卡组
        </button>
      </div>

      {/* 地图画布 - 像素精确，不拉伸 */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center" ref={containerRef}>
        <canvas ref={canvasRef} width={dimensions.width} height={dimensions.height}
          className="cursor-pointer object-none"
          onClick={(e) => {
            // Only process clicks directly on the canvas (not bubbled from child elements)
            if (e.target !== canvasRef.current) return;
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const clickX = (e.clientX - rect.left) * scaleX;
            const clickY = (e.clientY - rect.top) * scaleY;
            // 转换为世界坐标
            const worldX = clickX / TILE_SIZE + camera.x;
            const worldY = clickY / TILE_SIZE + camera.y;
            // 检查是否点击了发牌员（附近）
            const dealer = checkDealerInteraction();
            if (dealer) {
              const dx = Math.abs(worldX - dealer.x);
              const dy = Math.abs(worldY - dealer.y);
              if (dx < 2 && dy < 2) {
                // 修复#5: 点击发牌员，显示对应面板
                if (dealer.type === 'BOARD') {
                  setShowBoardPanel(true);
                } else if (dealer.type === 'CAMP') {
                  setShowCampPanel(true);
                  triggerStoryFlag('camp_rest');
                } else if (dealer.type === 'MERCHANT') {
                  setMerchantItems([
                    { id: 'hp_potion', name: 'HP药水', price: 50, desc: '恢复30HP', type: 'hp' },
                    { id: 'mp_potion', name: 'MP药水', price: 40, desc: '恢复20MP', type: 'mp' },
                    { id: 'atk_scroll', name: '攻击卷轴', price: 200, desc: '攻击力+5(永久)', type: 'atk' },
                    { id: 'def_scroll', name: '防御卷轴', price: 200, desc: '防御力+3(永久)', type: 'def' },
                  ]);
                  setShowMerchantPanel(true);
                  triggerStoryFlag('merchant_first');
                } else if (dealer.type === 'ENVIRONMENT') {
                  const inscriptionIndex = storyFlags.length % STONE_TABLET_INScriptions.length;
                  const inscription = STONE_TABLET_INScriptions[inscriptionIndex];
                  if (inscription) {
                    showDialogueBubble(dealer.x, dealer.y - 20, inscription.join(' '), '石碑', 5000);
                    triggerStoryFlag('stone_tablet_read');
                  }
                } else if (dealer.type === 'NPC') {
                  const npcData = NPC_DIALOGUES[dealer.id];
                  if (npcData) {
                    let dialogueList: string[] = npcData.default;
                    for (const flag of storyFlags) {
                      if (npcData.flagged[flag]) {
                        dialogueList = npcData.flagged[flag];
                        break;
                      }
                    }
                    const dialogue = dialogueList[Math.floor(Math.random() * dialogueList.length)];
                    showDialogueBubble(dealer.x, dealer.y - 20, dialogue, dealer.name, 4000);
                  }
                } else if (dealer.type === 'WANDERER') {
                  // P2-3: 酒馆浪人类型 - 点击也显示线索
                  const clues = [
                    '"在西北荒原，据说有位隐居的老猎人..."',
                    '"东海之滨，有一位赏金猎人铁面..."',
                    '"平和医院的苏婉儿小姐，她的家族与虚渊古神有着契约..."',
                    '"篝火营地是休息的好地方..."',
                    '"羊蹄山脚下的洞窟，据说藏着初代觉醒者的遗物..."',
                  ];
                  const clue = clues[Math.floor(Math.random() * clues.length)];
                  showDialogueBubble(dealer.x, dealer.y - 20, clue, dealer.name, 6000);
                  const wandererCards = ALL_EVENT_CARDS.filter(c => dealer.supportedCardTypes.includes(c.type));
                  const playerAdaptState: PlayerAdaptState = {
                    hpPercent: player.hp / player.maxHp,
                    killsCount: monstersDefeatedCountRef.current,
                    consecutiveDeaths: consecutiveDeathsRef.current,
                  };
                  const revealableCard = wandererCards.find(c => canRevealCard(c, playerAdaptState));
                  if (revealableCard) {
                    triggerMoodAmbient(revealableCard);
                    setCardRewards([revealableCard]);
                    setShowRewards(true);
                  }
                } else {
                  // P0-1: 点击发牌员显示对话框面板
                  setSelectedDealer(dealer);
                  setShowDealerPanel(true);
                }
                return;
              }
            }
            // 否则设置移动目标
            setClickTarget({ x: Math.round(worldX), y: Math.round(worldY) });
            keysRef.current.clear(); // 清除键盘按键
          }}
        />
        {!animFrame && gameState === 'playing' && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-white">
            <div className="text-center">
              <div className="text-4xl mb-2">🗺️</div>
              <div>地图加载中...</div>
            </div>
          </div>
        )}

        {/* P1-4: 虚拟双轴摇杆 */}
        <div
          ref={joystickContainerRef}
          className="absolute bottom-24 left-8 w-24 h-24 rounded-full bg-slate-800/60 border-2 border-slate-600/50 flex items-center justify-center touch-none"
          onTouchStart={(e) => {
            joystickActive.current = true;
            handleJoystickMove(e.touches[0].clientX, e.touches[0].clientY);
          }}
          onTouchMove={(e) => {
            if (joystickActive.current) {
              handleJoystickMove(e.touches[0].clientX, e.touches[0].clientY);
            }
          }}
          onTouchEnd={handleJoystickEnd}
          onMouseDown={(e) => {
            joystickActive.current = true;
            handleJoystickMove(e.clientX, e.clientY);
          }}
          onMouseMove={(e) => {
            if (joystickActive.current) {
              handleJoystickMove(e.clientX, e.clientY);
            }
          }}
          onMouseUp={handleJoystickEnd}
          onMouseLeave={handleJoystickEnd}
        >
          <div
            className="w-10 h-10 rounded-full bg-amber-500/80 border-2 border-amber-400 shadow-lg"
            style={{
              transform: `translate(${joystickRef.current.x * 20}px, ${joystickRef.current.y * 20}px)`,
              transition: joystickActive.current ? 'none' : 'transform 0.1s',
            }}
          />
        </div>

        {/* 技能按钮 - P0-3: MP不足时显示红色边框闪烁 */}
        <div className="absolute bottom-20 right-4 flex flex-col gap-2">
          {PLAYER_SKILLS.map((skill, i) => {
            const mpInsufficient = skill.mpCost > player.mp;
            return (
              <button
                key={skill.id}
                onClick={(e) => { e.stopPropagation(); setSelectedSkill(skill); useSkill(skill); }}
                disabled={player.cooldown > 0 || mpInsufficient}
                className={`relative w-16 h-16 rounded-xl flex flex-col items-center justify-center font-bold shadow-lg active:scale-95 transition-all text-white ${
                  selectedSkill?.id === skill.id
                    ? skill.element === 'fire' ? 'bg-orange-600 hover:bg-orange-500 border-2 border-yellow-400'
                    : skill.element === 'electric' ? 'bg-yellow-600 hover:bg-yellow-500 border-2 border-yellow-300'
                    : 'bg-red-600 hover:bg-red-500 border-2 border-yellow-300'
                    : skill.element === 'fire' ? 'bg-orange-700 hover:bg-orange-600'
                    : skill.element === 'electric' ? 'bg-yellow-700 hover:bg-yellow-600'
                    : 'bg-red-700 hover:bg-red-600'
                } disabled:bg-slate-700 disabled:border-0 ${mpInsufficient ? 'animate-mp-warn border-2 border-red-500' : ''}`}
                title={`${skill.name} (${skill.mpCost}MP) - ${skill.desc}`}
              >
                {mpInsufficient && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                )}
                <span className="text-base">{i === 0 ? '⚔️' : i === 1 ? '🔥' : '⚡'}</span>
                <span className="text-[9px]">{skill.key}:{skill.name}</span>
                {skill.mpCost > 0 && <span className="text-[8px] opacity-70">{skill.mpCost}MP</span>}
              </button>
            );
          })}
          <button onClick={(e) => { e.stopPropagation(); dodge(); }}
            className="w-16 h-16 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 rounded-xl flex flex-col items-center justify-center text-white font-bold shadow-lg active:scale-95 transition-transform">
            <span className="text-xl">💨</span><span className="text-[10px]">空格</span>
          </button>
        </div>

        {/* 技能效果文字提示（如效果拔群） */}
        {skillEffectivenessText && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-bold pointer-events-none"
            style={{
              color: skillEffectivenessText.includes('拔群') ? '#ff6b6b' : skillEffectivenessText.includes('甚微') ? '#6bff6b' : '#ffffff',
              textShadow: '0 0 10px rgba(0,0,0,0.8)',
            }}>
            {skillEffectivenessText}
          </div>
        )}

        {/* 安全区提示 */}
        {inSafeZone && indoorMapId === 'none' && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-yellow-600/90 px-4 py-1 rounded-full text-white text-xs font-bold flex items-center gap-2">
            <span>🏰</span> 安全区域
          </div>
        )}

        {/* P0-2/P2-2: 建筑入口/出口可关闭提示 */}
        {proximityPrompt && (
          <div className="absolute bottom-28 left-1/2 -translate-x-1/2 bg-blue-600/90 px-4 py-2 rounded-xl text-white text-sm font-bold flex items-center gap-3 shadow-lg z-30">
            <span>🚪</span>
            <span>
              {proximityPrompt.type === 'enter_building'
                ? `按E进入 ${INDOOR_MAPS[proximityPrompt.mapId]?.name}`
                : `按E返回户外`}
            </span>
            <button
              onClick={() => { setProximityPrompt(null); setIsNearExit(false); }}
              className="text-slate-300 hover:text-white text-lg leading-none ml-1"
            >×</button>
          </div>
        )}

        {/* 室内地图指示器 */}
        {indoorMapId !== 'none' && !proximityPrompt && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-purple-600/90 px-4 py-1 rounded-full text-white text-xs font-bold flex items-center gap-2">
            <span>🏠</span> {INDOOR_MAPS[indoorMapId].name}
          </div>
        )}

        {/* P2-2: 室内出口提示（可关闭） */}
        {indoorMapId !== 'none' && !proximityPrompt && (
          <div className="absolute bottom-28 left-1/2 -translate-x-1/2 bg-purple-500/90 px-4 py-2 rounded-xl text-white text-sm font-bold flex items-center gap-3 shadow-lg">
            <span>🚪</span>
            <span>走向门口按E返回户外</span>
            <button
              onClick={() => setIsNearExit(false)}
              className="text-slate-300 hover:text-white text-lg leading-none"
            >×</button>
          </div>
        )}

        {/* 发牌员交互提示 - 已隐藏（卡组系统隐藏在游戏表层之下） */}

        {/* ============================================================
            修复#5: 发牌员专属UI面板
        ============================================================ */}
        
        {/* 悬赏板面板 - BOARD类型 */}
        {showBoardPanel && nearbyDealer?.type === 'BOARD' && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-40" onClick={() => setShowBoardPanel(false)}>
            <div className="bg-gradient-to-b from-purple-900 to-slate-900 rounded-2xl p-6 border border-purple-500 shadow-2xl max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-purple-400">📋 悬赏公告板</h2>
                <button onClick={() => setShowBoardPanel(false)} className="text-slate-400 hover:text-white text-2xl">&times;</button>
              </div>
              <p className="text-slate-400 text-sm mb-4">选择一项任务完成以获得奖励</p>
              {[
                { id: 'q1', name: '消灭哥布林', desc: '在西山森林消灭5只哥布林', reward: 150, progress: boardProgress['q1'] || 0, target: 5 },
                { id: 'q2', name: '精英猎物', desc: '击败任意一只精英怪物', reward: 300, progress: boardProgress['elite_kills'] || 0, target: 1 },
                { id: 'q3', name: '商队护送', desc: '护送商队安全通过西部道路', reward: 200, progress: 0, target: 1 },
              ].map(quest => (
                <div key={quest.id} className="bg-slate-800 rounded-xl p-4 mb-3 border border-slate-600 hover:border-purple-500 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-bold text-white">{quest.name}</div>
                    <div className="text-yellow-400 text-sm">💰 {quest.reward}</div>
                  </div>
                  <div className="text-slate-400 text-sm mb-2">{quest.desc}</div>
                  <div className="text-xs text-slate-500">进度: {quest.progress}/{quest.target}</div>
                  <button
                    onClick={() => {
                      setShowBoardPanel(false);
                      showDialogueBubble(nearbyDealer.x, nearbyDealer.y - 20, `任务 "${quest.name}" 已接取！`, '公告板', 3000);
                    }}
                    className="mt-2 w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-bold"
                  >
                    接取任务
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 篝火营地面板 - CAMP类型 */}
        {showCampPanel && nearbyDealer?.type === 'CAMP' && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-40" onClick={() => setShowCampPanel(false)}>
            <div className="bg-gradient-to-b from-amber-900 to-slate-900 rounded-2xl p-6 border border-amber-500 shadow-2xl max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-amber-400">🔥 篝火营地</h2>
                <button onClick={() => setShowCampPanel(false)} className="text-slate-400 hover:text-white text-2xl">&times;</button>
              </div>
              <p className="text-slate-300 text-sm mb-4 italic">火光温暖，驱散了夜晚的寒意...</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => {
                    // ============================================================
                    // P1-2: 营地访客系统 - 完全恢复时触发
                    // ============================================================
                    setPlayer(p => ({ ...p, hp: p.maxHp, mp: p.maxMp }));
                    setShowCampPanel(false);
                    setCurrentEdgeNarrative('休息后，你的HP和MP完全恢复了。');
                    setEdgeNarrativeVisible(true);
                    setTimeout(() => setEdgeNarrativeVisible(false), 3000);
                    showDialogueBubble(nearbyDealer.x, nearbyDealer.y - 20, '休息得很好！HP和MP已恢复！', '营地', 3000);

                    // 30%概率触发访客
                    if (Math.random() < 0.3) {
                      const visitor = CAMP_VISITORS[Math.floor(Math.random() * CAMP_VISITORS.length)];
                      showDialogueBubble(player.x, player.y - 20, visitor.dialogue, visitor.name, 5000);
                      // 给一张对应类型的卡
                      const visitorCards = ALL_EVENT_CARDS.filter(c => c.type === visitor.cardType);
                      if (visitorCards.length > 0) {
                        const card = visitorCards[Math.floor(Math.random() * visitorCards.length)];
                        setCardRewards([card]);
                        setShowRewards(true);
                      }
                    }

                    // 随机给MOOD卡（营地本来就是MOOD发牌员）
                    if (Math.random() < 0.5) {
                      const moodCards = MOOD_CARDS.filter(c => !collectedCards.some(x => x.id === c.id));
                      if (moodCards.length > 0) {
                        const moodCard = moodCards[Math.floor(Math.random() * moodCards.length)];
                        setCardRewards(prev => [...prev, moodCard]);
                        setShowRewards(true);
                      }
                    }
                  }}
                  className="py-3 bg-green-700 hover:bg-green-600 text-white rounded-xl font-bold"
                >
                  💚 完全恢复
                </button>
                <button
                  onClick={() => {
                    // ============================================================
                    // P1-2: 营地访客系统 - 短暂休息时触发（较低概率）
                    // ============================================================
                    setPlayer(p => ({ ...p, hp: Math.min(p.maxHp, p.hp + 30), mp: Math.min(p.maxMp, p.mp + 15) }));
                    setShowCampPanel(false);
                    showDialogueBubble(nearbyDealer.x, nearbyDealer.y - 20, '小憩片刻...恢复了少量HP和MP', '营地', 3000);

                    // 15%概率触发访客（短暂休息概率较低）
                    if (Math.random() < 0.15) {
                      const visitor = CAMP_VISITORS[Math.floor(Math.random() * CAMP_VISITORS.length)];
                      showDialogueBubble(player.x, player.y - 20, visitor.dialogue, visitor.name, 5000);
                      const visitorCards = ALL_EVENT_CARDS.filter(c => c.type === visitor.cardType);
                      if (visitorCards.length > 0) {
                        const card = visitorCards[Math.floor(Math.random() * visitorCards.length)];
                        setCardRewards([card]);
                        setShowRewards(true);
                      }
                    }
                  }}
                  className="py-3 bg-amber-700 hover:bg-amber-600 text-white rounded-xl font-bold"
                >
                  🍵 短暂休息
                </button>
              </div>
              <div className="text-center text-slate-500 text-xs">
                夜间叙事：{storyFlags.includes('awakening') ? '羊蹄山之魂在远处闪烁...' : '篝火噼啪作响，星空璀璨...'}
              </div>
            </div>
          </div>
        )}

        {/* 商人商店面板 - MERCHANT类型 */}
        {showMerchantPanel && nearbyDealer?.type === 'MERCHANT' && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-40" onClick={() => setShowMerchantPanel(false)}>
            <div className="bg-gradient-to-b from-green-900 to-slate-900 rounded-2xl p-6 border border-green-500 shadow-2xl max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-green-400">💰 流浪商人</h2>
                <div className="text-yellow-400 text-sm">💰 {player.gold}</div>
                <button onClick={() => setShowMerchantPanel(false)} className="text-slate-400 hover:text-white text-2xl">&times;</button>
              </div>
              <p className="text-slate-300 text-sm mb-4">来看看我的货物吧，冒险者...</p>
              <div className="space-y-3">
                {merchantItems.map(item => (
                  <div key={item.id} className="bg-slate-800 rounded-xl p-4 border border-slate-600 hover:border-green-500 transition-colors">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-bold text-white">{item.name}</div>
                        <div className="text-slate-400 text-sm">{item.desc}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-yellow-400 font-bold">💰 {item.price}</div>
                        <button
                          onClick={() => {
                            if (player.gold >= item.price) {
                              setPlayer(p => {
                                let newAtk = p.atk, newDef = p.def;
                                if (item.type === 'hp') {
                                  return { ...p, hp: Math.min(p.maxHp, p.hp + 30), gold: p.gold - item.price };
                                } else if (item.type === 'mp') {
                                  return { ...p, mp: Math.min(p.maxMp, p.mp + 20), gold: p.gold - item.price };
                                } else if (item.type === 'atk') {
                                  newAtk = p.atk + 5;
                                } else if (item.type === 'def') {
                                  newDef = p.def + 3;
                                }
                                return { ...p, atk: newAtk, def: newDef, gold: p.gold - item.price };
                              });
                              showDialogueBubble(nearbyDealer.x, nearbyDealer.y - 20, `购买成功！${item.name}已获得！`, '商人', 2000);
                              // 保存购买
                              const data: SaveData = {
                                x: player.x, y: player.y, hasSeenIntro: true,
                                hp: player.hp, maxHp: player.maxHp, mp: player.mp, maxMp: player.maxMp,
                                level: player.level, exp: player.exp, expToLevel: player.expToLevel,
                                gold: player.gold - item.price, collectedCards, deckIndex,
                                storyFlags, consecutiveDeaths: consecutiveDeathsRef.current,
                                atk: player.atk, def: player.def, indoorMapId, outdoorPlayerPos,
                                boardProgress: boardProgressRef.current,
                              };
                              saveGame(data);
                            } else {
                              showDialogueBubble(nearbyDealer.x, nearbyDealer.y - 20, '金币不足！', '商人', 2000);
                            }
                          }}
                          disabled={player.gold < item.price}
                          className="mt-2 px-4 py-1 bg-green-700 hover:bg-green-600 disabled:bg-slate-700 text-white rounded-lg text-sm font-bold"
                        >
                          购买
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            P1-1: 剧情与地图联动 - 边缘叙事文字（带淡入淡出）
        ============================================================ */}
        {edgeNarrativeVisible && currentEdgeNarrative && (
          <div
            className="absolute top-16 left-0 right-0 flex justify-center pointer-events-none z-30"
            style={{ opacity: edgeNarrativeOpacity, transition: 'opacity 0.5s ease' }}
          >
            <div className="bg-black/70 px-6 py-3 rounded-lg border border-slate-600/50 max-w-lg">
              <p className="text-slate-300 text-sm italic text-center leading-relaxed">
                {currentEdgeNarrative}
              </p>
            </div>
          </div>
        )}

        {/* ============================================================
            P1-2: 动态遭遇警告
        ============================================================ */}
        {encounterWarning && (
          <>
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent animate-pulse" />
            <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-orange-900/90 px-4 py-1.5 rounded-full text-orange-300 text-xs font-bold border border-orange-500/50 animate-bounce">
              ⚠️ {encounterWarning}
            </div>
          </>
        )}

        {/* ============================================================
            P2-1: MOOD卡环境视觉遮罩
        ============================================================ */}
        {moodOverlay && (
          <div
            className="fixed inset-0 pointer-events-none z-40"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,20,0.3) 100%)',
              animation: 'moodFade 5s ease-out forwards',
            }}
          />
        )}

        {/* ============================================================
            修复#1: 剧情与地图联动 - 对话气泡
        ============================================================ */}
        {dialogueBubbles.map(bubble => {
          const sx = (bubble.x - camera.x) * TILE_SIZE + TILE_SIZE / 2;
          const sy = (bubble.y - camera.y) * TILE_SIZE + TILE_SIZE / 2 - 40;
          if (sx < -100 || sx > dimensions.width + 100 || sy < -100 || sy > dimensions.height + 100) return null;
          return (
            <div
              key={bubble.id}
              className="absolute pointer-events-none z-25"
              style={{
                left: sx,
                top: sy,
                transform: 'translateX(-50%)',
              }}
            >
              <div className="bg-white rounded-lg px-3 py-2 shadow-lg max-w-[150px]">
                {bubble.speaker && (
                  <div className="text-xs font-bold text-purple-600 mb-1">{bubble.speaker}</div>
                )}
                <div className="text-slate-800 text-sm">{bubble.text}</div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
              </div>
            </div>
          );
        })}

        {/* ============================================================
            修复#2: 自适应难度 - BUFF提示
        ============================================================ */}
        {adaptiveBuffMessage && (
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 pointer-events-none z-35">
            <div className="bg-gradient-to-r from-red-900/90 via-orange-900/90 to-red-900/90 px-8 py-4 rounded-2xl border border-orange-500 shadow-lg">
              <p className="text-orange-300 text-lg font-bold animate-pulse">
                {adaptiveBuffMessage}
              </p>
              <p className="text-red-400 text-sm text-center mt-1">
                ATK +{adaptiveDifficulty.atkBonus}% | DEF +{adaptiveDifficulty.defBonus}%
              </p>
            </div>
          </div>
        )}

        {/* 宝箱交互提示 */}
        {interactionHint && interactionHint.startsWith('treasure_') && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              const treasureId = interactionHint.split('_')[1];
              const tid = parseInt(treasureId);
              setTreasures(ts => ts.map(t => t.id === tid ? { ...t, opened: true } : t));
              const reward = ALL_EVENT_CARDS[Math.floor(Math.random() * 3)];
              setCardRewards([reward]);
              setShowRewards(true);
              setClickTarget(null);
            }}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 bg-yellow-600 hover:bg-yellow-500 px-4 py-2 rounded-xl text-white text-sm font-bold flex items-center gap-2 shadow-lg"
          >
            <span>📦</span> 开启宝箱
          </button>
        )}

        {/* ============================================================
            P0-1: 发牌员对话框面板
        ============================================================ */}
        {showDealerPanel && selectedDealer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowDealerPanel(false)}>
            <div
              className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl border border-amber-500/50 p-6 max-w-sm w-full mx-4 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* 标题 */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
                  style={{ backgroundColor: selectedDealer.color }}
                >
                  {selectedDealer.icon}
                </div>
                <div>
                  <h3 className="text-white font-bold">{selectedDealer.name}</h3>
                  <p className="text-slate-400 text-xs">{DEALER_TYPE_NAMES[selectedDealer.type]}</p>
                </div>
                <button
                  onClick={() => setShowDealerPanel(false)}
                  className="ml-auto text-slate-400 hover:text-white text-2xl leading-none"
                >×</button>
              </div>

              {/* 对话内容 */}
              <div className="space-y-2 mb-4">
                {getDealerDialogues(selectedDealer).map((line, i) => (
                  <p key={i} className="text-slate-200 text-sm leading-relaxed">{line}</p>
                ))}
              </div>

              {/* 交互按钮 */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => {
                    // 给予玩家一张卡
                    const cards = getCardsFromDealer(selectedDealer);
                    if (cards.length > 0) {
                      const card = cards[Math.floor(Math.random() * cards.length)];
                      setCardRewards([card]);
                      setShowRewards(true);
                    }
                    setShowDealerPanel(false);
                  }}
                  className="flex-1 py-2 px-4 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-sm"
                >
                  交流
                </button>
                <button
                  onClick={() => setShowDealerPanel(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm"
                >
                  离开
                </button>
              </div>

              {/* P1-5: 多途径交付UI可见化 */}
              {(() => {
                const cards = getCardsFromDealer(selectedDealer);
                if (cards.length === 0) return null;
                const sampleCard = cards[0];
                const methods = getDeliveryMethods(sampleCard);
                return (
                  <div className="border-t border-slate-700 pt-4">
                    <p className="text-xs text-slate-500 mb-2">选择交付方式：</p>
                    <div className="flex flex-wrap gap-2">
                      {methods.map(m => (
                        <button
                          key={m.type}
                          onClick={() => {
                            // 根据交付方式处理
                            if (m.type === 'DIALOGUE') {
                              showDialogueBubble(player.x, player.y - 20, `"${sampleCard.storyContent || '...'}"`, selectedDealer.name, 4000);
                            }
                            setShowDealerPanel(false);
                          }}
                          className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-xs flex items-center gap-1.5"
                        >
                          <span>{m.type === 'DIALOGUE' ? '💬' : m.type === 'INTERROGATE' ? '❓' : m.type === 'BATTLE' ? '⚔️' : '💰'}</span>
                          <span>{m.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* 底部提示 */}
      <div className="h-10 bg-slate-900/90 border-t border-slate-700 flex items-center justify-center gap-8 text-slate-400 text-xs">
        <span>🎮 WASD/方向键移动</span>
        <span>⚔️ 1普攻 2火 3雷 空格闪避</span>
        <span>🏰 城镇内无怪物</span>
        <span>🃏 靠近发牌员按E</span>
      </div>
    </div>
  );
}

// === 修复完成清单 ===
// Bug #1 [x] 键盘事件合并 - 所有keydown/keyup注册在单个useEffect中，用keysRef统一管理
// Bug #2 [x] 游戏主循环ref修复 - playerRef.current包裹player，game loop内使用playerRef.current避免stale closure
// Bug #3 [x] useSkill中saveGame的stale closure - 使用playerRef_latest/collectedCardsRef等refs保存最新值
// Bug #4 [x] proximityPromptTimer未cleanup - proximityTimerRef跟踪timer ID，cleanup中clearInterval
// Bug #5 [x] 点击移动被键盘覆盖 - canvas onClick中点击时调用keysRef.current.clear()
// Bug #6 [x] monsterRefreshTimer未cleanup - 已在原有useEffect cleanup中clearInterval（已存在）
// Bug #7 [x] triggerStoryFlag存档陈旧 - 使用playerRef_latest等refs，dependency array简化为[consecutiveDeathsRef]
// Bug #8 [x] player对象作为useCallback依赖 - checkBuildingEntry等使用player.x/player.y而非整个player
// Bug #9 [x] 击败N只怪条件未追踪 - monstersDefeatedCount计数器，击杀时累加，每10只触发STAT_UP卡
// Bug #10 [x] 悬赏板任务进度不持久化 - boardProgress存入SaveData，完成击杀时更新，进度显示boardProgress[q.id]
// Bug #11 [x] 篝火营地不产出MOOD卡 - 休息选项中grant随机MOOD卡，setCardRewards+setShowRewards
// Bug #12 [x] AudioContext未在所有路径resume - stopBGM()中调用resumeAudio()，BGM cleanup effect中也调用
// Bug #13 [x] drawTile每次render重建 - T和所有drawXxxTile函数提取到组件外作为纯function声明
// Bug #14 [x] canvas click handler中nearbyDealer陈旧 - click handler中重新计算const dealer = checkDealerInteraction()

// ============================================================
// 8项改进（P0+P1+P2）实现完成清单
// ============================================================
/*
=== P0 优先级 ===
[P0-1] 卡组适配玩家状态机制 [x]
  - 新增 cardQueue 状态 (line ~2025)
  - 新增 PlayerAdaptState 接口 (line ~2085)
  - 新增 getCardPriority() 函数 (line ~2091)
  - 新增 buildCardQueue() 函数 (line ~2103)
  - Dealer发牌时使用 buildCardQueue 而非随机抽取

[P0-2] 动态遭遇系统 [x]
  - 新增 DynamicEncounter 接口 (line ~720)
  - 新增 DYNAMIC_ENCOUNTERS 常量 (line ~726)
  - 新增 spawnDynamicEncounter() 函数 (line ~2123)
  - 游戏主循环中每60帧检测一次 (line ~2822)
  - 动态遭遇倒计时despawn机制

=== P1 优先级 ===
[P1-1] 可审问敌人系统 [x]
  - 新增 interrogateEnemy() 函数 (line ~2143)
  - 新增 interrogationTarget 状态 (line ~2575)
  - 死亡怪物显示"已击杀"淡化 + "❓审问"文字 (line ~2975)
  - E键可触发审问 (line ~2645)
  - 审问成功率基于等级差计算 (line ~2145)

[P1-2] 营地访客系统 [x]
  - 新增 CAMP_VISITORS 常量 (line ~736)
  - 完全恢复时30%概率触发访客 (line ~3499)
  - 短暂休息时15%概率触发访客 (line ~3525)
  - 访客给予对应类型事件卡 (line ~3506)
  - 50%概率额外给MOOD卡 (line ~3517)

[P1-3] 黄金法则1-cost验证 [x]
  - 新增 canRevealCard() 函数 (line ~2164)
  - 验证玩家是否满足卡牌揭示条件 (line ~2166)
  - 怪物掉落卡牌前验证 (line ~2460)
  - 宝箱开启时验证 (line ~2723)
  - 发牌员交互时验证 (line ~2663, ~3362)
  - 不满足条件显示"时机未到"提示

=== P2 优先级 ===
[P2-1] MOOD卡环境渲染 [x]
  - 新增 ambientEffect 状态 (line ~2030)
  - 新增 triggerMoodAmbient() 函数 (line ~2194)
  - 5秒后BGM音量恢复 (line ~2353)
  - 氛围文字显示在屏幕边缘 (line ~2200)
  - audio.ts新增 setBGMVolume() 函数 (audio.ts line ~210)

[P2-2] 多途径交付UI [x]
  - 新增 getDeliveryMethods() 函数 (line ~2178)
  - 返回卡牌可用的交付途径数组
  - DIALOGUE/INTERROGATE/BATTLE/MERCHANT

[P2-3] 酒馆浪人类型 [x]
  - DealerType新增 WANDERER (line ~625)
  - DEALER_TYPE_NAMES新增 WANDERER (line ~650)
  - DEALERS新增 dealer_wanderer (line ~690)
  - drawDealer渲染WANDERER外观 (line ~1805)
  - E键/点击与WANDERER交互显示线索 (line ~2670, ~3370)
  - 给予玩家线索型事件卡

=== 辅助改进 ===
- audio.ts新增 setBGMVolume(), getBGMCtx(), getBGMGain() 导出 (audio.ts line ~210)
- drawDealer增加WANDERER的紫色光晕效果 (line ~1775)
- 死亡怪物附近显示"❓审问"提示 (line ~2978)
*/

// ============================================================
// UI/交互问题修复清单 (P0+P1+P2)
// ============================================================
/*
[P0-1] 消除所有alert()发牌员交互 [x]
  - 新增 showDealerPanel/selectedDealer 状态 (line ~2058)
  - 新增 DealerDialoguePanel 组件 (line ~3885)
  - 新增 getDealerDialogues() 函数 (line ~890)
  - 所有 alert() 已替换为 setShowDealerPanel(true)

[P0-2] 修复门口自动倒计时机制 [x]
  - 移除自动倒计时自动进入逻辑
  - 改为按E进入，可点击X关闭
  - proximityPrompt useEffect 修改 (line ~2778)

[P0-3] 添加MP不足的音效+视觉反馈 [x]
  - audio.ts新增 playMPInsufficientSound() 函数
  - useSkill 中调用音效 (line ~2455)
  - 技能按钮添加 animate-mp-warn class 和红色 ping
  - globals.css 新增 @keyframes mp-warn

[P1-1] 重构边缘叙事UI [x]
  - 新增 edgeNarrativeOpacity 状态 (line ~2065)
  - edgeNarrative 渲染添加 opacity transition (line ~3715)
  - triggerStoryFlag/triggerMoodAmbient 使用淡入淡出

[P1-2] 动态遭遇增加屏幕边缘警告 [x]
  - 新增 encounterWarning 状态 (line ~2072)
  - spawnDynamicEncounter 中设置警告 (line ~2167)
  - UI渲染警告条+文字 (line ~3725)

[P1-3] 怪物刷新定时器优化（60fps → 1fps）[x]
  - setInterval 1000/60 改为 1000 (line ~2352)
  - 注释更新为 1fps tick

[P1-4] 虚拟摇杆改为真正的双轴摇杆 [x]
  - 新增 joystickRef/joystickActive/joystickContainerRef (line ~2418)
  - 新增 handleJoystickMove/handleJoystickEnd 函数 (line ~2423)
  - 游戏循环读取摇杆输入 (line ~2870)
  - UI替换为圆形摇杆 (line ~3450)

[P1-5] 多途径交付UI可见化 [x]
  - DealerDialoguePanel 中显示 getDeliveryMethods 按钮
  - 每个按钮有对应图标

[P2-1] MOOD卡环境视觉变化 [x]
  - 新增 moodOverlay 状态 (line ~2057)
  - triggerMoodAmbient 中设置 moodOverlay (line ~2228)
  - UI渲染氛围遮罩 (line ~3738)
  - globals.css 新增 @keyframes moodFade

[P2-2] 出口提示添加主动关闭 [x]
  - 室内出口提示添加×关闭按钮 (line ~3520)
  - isNearExit 状态控制 (line ~2075)
*/
