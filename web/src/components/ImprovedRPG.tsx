'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Character } from '@/types';
import { characterSave } from '@/lib/api';

// ============================================================
//  Pokemon像素风RPG游戏 - 剧情卡牌版
//  核心理念：卡牌是剧情的碎片，推进世界用的
//  第四部分：卡牌类型系统 & 第七部分：发牌员系统
// ============================================================

const TILE_SIZE = 16;
const MAP_WIDTH = 80;
const MAP_HEIGHT = 60;

const COLORS: Record<string, string> = {
  grass1: '#4CAF50', grass2: '#66BB6A', grassAccent: '#81C784',
  path1: '#D7CCC8', path2: '#BCAAA4',
  wall1: '#78909C', wall2: '#607D8B', wallTop: '#90A4AE',
  water1: '#29B6F6', water2: '#4FC3F7', waterShine: '#B3E5FC',
  treeTrunk: '#795548', treeLeaves: '#388E3C', treeLeavesLight: '#4CAF50',
  building: '#FFCA28', buildingRoof: '#E53935', buildingDoor: '#5D4037',
  skyTop: '#E3F2FD', skyBottom: '#BBDEFB',
};

const TERRAIN = { GRASS: 0, PATH: 1, WALL: 2, WATER: 3, TREE: 4, BUILDING: 5, BRIDGE: 6, FLOWER: 7 };

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
type DealerType = 'NPC' | 'BOARD' | 'ENEMY' | 'CAMP' | 'ENCOUNTER' | 'MERCHANT' | 'ENVIRONMENT';

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
];

const DEALER_TYPE_NAMES: Record<DealerType, string> = {
  NPC: 'NPC',
  BOARD: '公告板',
  ENEMY: '敌人',
  CAMP: '营地',
  ENCOUNTER: '遭遇',
  MERCHANT: '商人',
  ENVIRONMENT: '环境',
};

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

const STORY_LINES = [
  { speaker: '旁白', title: '', content: '西境王国边境，羊蹄山脚下。\n一个流浪剑客踏上这片神秘的土地...' },
  { speaker: '神秘声音', title: '???', content: '觉醒者...你终于来了。\n羊蹄山之魂在呼唤你。' },
  { speaker: '哨兵队长', title: '边境哨站', content: '站住！你是新来的冒险者？\n最近城外不太平，小心怪物。' },
  { speaker: '哨兵队长', title: '边境哨站', content: '在镇子里是安全的。\n去草地打怪练级吧！' },
  { speaker: '发牌员', title: '酒馆门口', content: '嘿，冒险者！想来一把卡牌游戏吗？\n靠近我就可以开始游戏！' },
];

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

export default function ImprovedRPG({ character }: { character?: Character }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 480 });
  // 初始化：看过剧情就不再展示
  const [gameState, setGameState] = useState<'story' | 'playing' | 'gameover' | 'victory'>(
    character?.has_seen_intro ? 'playing' : 'story'
  );
  const [storyIdx, setStoryIdx] = useState(0);
  const [showText, setShowText] = useState('');
  const [typingDone, setTypingDone] = useState(false);

  // 从角色存档初始化玩家状态
  const [player, setPlayer] = useState({
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
  });

  const [camera, setCamera] = useState({ x: 30, y: 30 });
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

  const [attackWarning, setAttackWarning] = useState<number>(0);
  const [treasures, setTreasures] = useState([
    { id: 1, x: 20, y: 22, opened: false },
    { id: 2, x: 65, y: 15, opened: false },
    { id: 3, x: 70, y: 35, opened: false },
  ]);

  const [damages, setDamages] = useState<{ id: number; x: number; y: number; v: number; t: number; color: string }[]>([]);
  const dmgIdRef = useRef(0);

  const [showCardGame, setShowCardGame] = useState(false);
  const [cardRewards, setCardRewards] = useState<EventCard[]>([]);
  const [showRewards, setShowRewards] = useState(false);
  const [collectedCards, setCollectedCards] = useState<EventCard[]>([]);
  const [cardFilter, setCardFilter] = useState<CardType | 'all'>('all');

  // 当前交互的发牌员
  const [nearbyDealer, setNearbyDealer] = useState<Dealer | null>(null);
  const [dealerCards, setDealerCards] = useState<EventCard[]>([]);

  const keysRef = useRef<Set<string>>(new Set());
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
          if (card) {
            setCardRewards([card]);
            setShowRewards(true);
          }
          // 击杀奖励金币
          setPlayer(p => ({ ...p, exp: p.exp + (m.isElite ? 50 : 10), gold: p.gold + (m.isElite ? 50 : 10) }));
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

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      if (e.key === 'j' || e.key === 'J') attack();
      if (e.key === ' ') { e.preventDefault(); dodge(); }
      // E键交互：发牌员 或 宝箱
      if ((e.key === 'e' || e.key === 'E')) {
        if (nearbyDealer) {
          const dealerHints = [
            `发牌员 ${nearbyDealer.name} 注视着你..."`,
            `在这个世界上，命运就像一副牌——你永远不知道下一张会抽到什么。`,
            `羊蹄山的传说还在继续...但时机未到。`,
            `继续探索吧，旅人。你会遇到该遇到的人，发生该发生的事。`,
            `有时候，最重要的不是目的地，而是路上的风景。`,
          ];
          alert(dealerHints[Math.floor(Math.random() * dealerHints.length)]);
        } else if (interactionHint && interactionHint.startsWith('treasure_')) {
          // 开启宝箱
          const treasureId = interactionHint.split('_')[1];
          const tid = parseInt(treasureId);
          setTreasures(ts => ts.map(t => t.id === tid ? { ...t, opened: true } : t));
          const reward = ALL_EVENT_CARDS[Math.floor(Math.random() * 3)]; // 随机奖励
          setCardRewards([reward]);
          setShowRewards(true);
          setClickTarget(null);
        }
      }
    };
    const onUp = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, [player, attack, dodge, nearbyDealer]);

  // 更新附近发牌员状态
  useEffect(() => {
    if (gameState === 'playing') {
      const dealer = checkDealerInteraction();
      setNearbyDealer(dealer);
    }
  }, [player, gameState, checkDealerInteraction]);

  const interactionHint = checkInteraction();
  const inSafeZone = player.x >= 32 && player.x <= 48 && player.y >= 28 && player.y <= 44;

  // 游戏主循环
  useEffect(() => {
    if (gameState !== 'playing') return;
    let raf: number; let lastTime = 0;
    const loop = (time: number) => {
      if (time - lastTime >= 16) {
        lastTime = time;
        setAnimFrame(f => f + 1);

        let dx = 0, dy = 0;
        // 点击移动：如果有目标，持续向目标移动
        if (clickTarget && !keysRef.current.has('w') && !keysRef.current.has('a') && !keysRef.current.has('s') && !keysRef.current.has('d')) {
          const dx = clickTarget.x - player.x;
          const dy = clickTarget.y - player.y;
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

        // 点击移动目标移动
        if (clickTarget && (dx === 0 && dy === 0)) {
          const cdx = clickTarget.x - player.x;
          const cdy = clickTarget.y - player.y;
          const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
          if (cdist >= 0.5) {
            dx = cdx / cdist;
            dy = cdy / cdist;
          }
        }
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

        setCamera(c => ({ 
          x: Math.max(0, Math.min(MAP_WIDTH - Math.ceil(dimensions.width / TILE_SIZE), player.x - Math.ceil(dimensions.width / TILE_SIZE / 2))), 
          y: Math.max(0, Math.min(MAP_HEIGHT - Math.ceil(dimensions.height / TILE_SIZE), player.y - Math.ceil(dimensions.height / TILE_SIZE / 2))) 
        }));

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
  }, [gameState, player, addDmg, dimensions]);

  // 绘制函数

  // Map tile renderer (delegates to Pokemon-style tile functions)
  const drawTile = (ctx: CanvasRenderingContext2D, terrain: number, sx: number, sy: number, mx: number, my: number, frame: number) => {
    switch (terrain) {
      case TERRAIN.GRASS: drawGrassTile(ctx, sx, sy, mx, my, frame); break;
      case TERRAIN.PATH: drawPathTile(ctx, sx, sy, mx, my); break;
      case TERRAIN.WALL: drawWallTile(ctx, sx, sy, mx, my); break;
      case TERRAIN.WATER: drawWaterTile(ctx, sx, sy, mx, my, frame); break;
      case TERRAIN.TREE: drawTreeTile(ctx, sx, sy, mx, my, frame); break;
      case TERRAIN.BUILDING: drawBuildingTile(ctx, sx, sy, mx, my); break;
      case TERRAIN.BRIDGE: drawBridgeTile(ctx, sx, sy, mx, my); break;
      case TERRAIN.FLOWER: drawFlowerTile(ctx, sx, sy, mx, my, frame); break;
      default: drawGrassTile(ctx, sx, sy, mx, my, frame);
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
  const drawGrassTile = (ctx: CanvasRenderingContext2D, sx: number, sy: number, tileX: number, tileY: number, frame: number) => {
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

  const drawPathTile = (ctx: CanvasRenderingContext2D, sx: number, sy: number, tileX: number, tileY: number) => {
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

  const drawWallTile = (ctx: CanvasRenderingContext2D, sx: number, sy: number, tileX: number, tileY: number) => {
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

  const drawWaterTile = (ctx: CanvasRenderingContext2D, sx: number, sy: number, tileX: number, tileY: number, frame: number) => {
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

  const drawBridgeTile = (ctx: CanvasRenderingContext2D, sx: number, sy: number, tileX: number, tileY: number) => {
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
  const drawTreeTile = (ctx: CanvasRenderingContext2D, sx: number, sy: number, tileX: number, tileY: number, frame: number) => {
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
  const drawFlowerTile = (ctx: CanvasRenderingContext2D, sx: number, sy: number, tileX: number, tileY: number, frame: number) => {
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
  const drawBuildingTile = (ctx: CanvasRenderingContext2D, sx: number, sy: number, tileX: number, tileY: number) => {
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

// GBC Pokemon-style player sprite (32x32): Red cap+visor, yellow hair, skin face, blue tunic, brown pants, boots, sword, black outline
const drawPlayerSprite = (ctx: CanvasRenderingContext2D, sx: number, sy: number, facing: string, frame: number, isAttacking: boolean, invincible: number) => {
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
  const drawSlime = (ctx: CanvasRenderingContext2D, sx: number, sy: number, frame: number, isElite: boolean = false) => {
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
  const drawWolf = (ctx: CanvasRenderingContext2D, sx: number, sy: number, frame: number, isElite: boolean = false) => {
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
  const drawGoblin = (ctx: CanvasRenderingContext2D, sx: number, sy: number, frame: number, isElite: boolean = false) => {
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

  const drawMonsterSprite = (ctx: CanvasRenderingContext2D, m: typeof monsters[0], frame: number) => {
    if (m.type === 'slime') drawSlime(ctx, m.x, m.y, frame, m.isElite);
    else if (m.type === 'wolf') drawWolf(ctx, m.x, m.y, frame, m.isElite);
    else if (m.type === 'goblin') drawGoblin(ctx, m.x, m.y, frame, m.isElite);
  };

  const drawDealer = (ctx: CanvasRenderingContext2D, sx: number, sy: number, dealer: Dealer, frame: number) => {
    const glow = Math.sin(frame * 0.08) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(218, 165, 32, ${glow * 0.3})`;
    ctx.beginPath(); ctx.arc(sx, sy, 24, 0, Math.PI * 2); ctx.fill();
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
    } else if (dealer.type === 'ENVIRONMENT') {
      ctx.fillStyle = '#6B7280';
      ctx.fillRect(sx - 12, sy - 24, 24, 32);
      ctx.fillStyle = '#9CA3AF';
      ctx.fillRect(sx - 8, sy - 20, 16, 8);
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
        if (mx < 0 || my < 0 || mx >= MAP_WIDTH || my >= MAP_HEIGHT) continue;
        drawTile(ctx, mapDataRef.current[my][mx], tx * TILE_SIZE + ox, ty * TILE_SIZE + oy, mx, my, animFrame);
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

    // 绘制发牌员（包括NPC和公告板等）
    DEALERS.forEach(dealer => {
      const sx = (dealer.x - camera.x) * TILE_SIZE + TILE_SIZE / 2;
      const sy = (dealer.y - camera.y) * TILE_SIZE + TILE_SIZE / 2;
      if (sx < -50 || sx > W + 50 || sy < -50 || sy > H + 50) return;
      drawDealer(ctx, sx, sy, dealer, animFrame);
    });

    treasures.forEach(t => {
      if (t.opened) return;
      const sx = (t.x - camera.x) * TILE_SIZE + TILE_SIZE / 2;
      const sy = (t.y - camera.y) * TILE_SIZE + TILE_SIZE / 2;
      if (sx < -50 || sx > W + 50 || sy < -50 || sy > H + 50) return;
      drawTreasure(ctx, sx, sy, t.opened, animFrame);
    });

    monsters.forEach(m => {
      if (m.state === 'dead') return;
      const sx = (m.x - camera.x) * TILE_SIZE + TILE_SIZE / 2;
      const sy = (m.y - camera.y) * TILE_SIZE + TILE_SIZE / 2;
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
  }, [player, camera, monsters, damages, gameState, animFrame]);

  // ===================== 剧情界面 =====================
  if (gameState === 'story') {
    const cur = STORY_LINES[storyIdx];
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-4">
        <button
          onClick={async () => {
            if (character?.id) {
              try {
                await characterSave.save(character.id, {
                  x: player.x, y: player.y,
                  hasSeenIntro: true,
                });
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
              // 完成剧情，保存状态
              if (character?.id) {
                try {
                  await characterSave.save(character.id, {
                    x: player.x, y: player.y,
                    hasSeenIntro: true,
                  });
                } catch(e) { /* ignore save error */ }
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
  }

  // 游戏结束
  if (gameState === 'gameover') {
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
  }

  // 事件卡奖励弹窗
  if (showRewards && cardRewards.length > 0) {
    const card = cardRewards[0];
    const rarityColor = RARITY_COLORS[card.rarity];
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-gradient-to-b from-yellow-900 to-slate-900 rounded-2xl p-8 border-2 shadow-2xl max-w-sm w-full mx-4 text-center" style={{ borderColor: rarityColor }}>
          <div className="text-4xl mb-4">🎉</div>
          <h2 className="text-xl font-bold text-yellow-400 mb-2">获得事件卡！</h2>
          <div style={{ borderColor: rarityColor, borderWidth: 2, borderRadius: 12, padding: 16, background: '#1a1a2e', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 20 }}>
                {CARD_TYPE_ICONS[card.type]}
              </span>
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
  }

  // 发牌员界面 - 卡组系统隐藏在游戏表层之下，按E触发剧情对话
  // （已移除卡牌收藏UI，发牌员直接触发事件）

  // 卡组查看弹窗（顶部按钮触发）
  if (showCardGame) {
    const nextCard = cardRewards.length > 0 ? cardRewards[0] : (collectedCards.length < ALL_EVENT_CARDS.length ? ALL_EVENT_CARDS.find(c => !collectedCards.some(x => x.id === c.id)) : null);
    const upcomingCards = collectedCards.slice(0, 5);
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50" onClick={() => setShowCardGame(false)}>
        <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl p-6 border border-purple-500 shadow-2xl max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-purple-400">🃏 事件卡组</h2>
            <button onClick={() => setShowCardGame(false)} className="text-slate-400 hover:text-white text-2xl">&times;</button>
          </div>

          {/* 下一张卡 */}
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

          {/* 已收集的卡（预览5张） */}
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

          <button onClick={() => setShowCardGame(false)} className="w-full mt-4 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold">返回游戏</button>
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
            if (nearbyDealer) {
              const dx = Math.abs(worldX - nearbyDealer.x);
              const dy = Math.abs(worldY - nearbyDealer.y);
              if (dx < 2 && dy < 2) {
                // 点击了发牌员附近，触发对话
                const dealerHints = [
                  `发牌员 ${nearbyDealer.name} 注视着你...`,
                  `在这个世界上，命运就像一副牌——你永远不知道下一张会抽到什么。`,
                  `羊蹄山的传说还在继续...但时机未到。`,
                  `继续探索吧，旅人。你会遇到该遇到的人，发生该发生的事。`,
                  `有时候，最重要的不是目的地，而是路上的风景。`,
                ];
                alert(dealerHints[Math.floor(Math.random() * dealerHints.length)]);
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
          <button onClick={(e) => { e.stopPropagation(); attack(); }}
            disabled={player.cooldown > 0}
            className="w-16 h-16 bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-xl flex flex-col items-center justify-center text-white font-bold shadow-lg active:scale-95 transition-transform">
            <span className="text-xl">⚔️</span><span className="text-[10px]">J攻击</span>
          </button>
          <button onClick={(e) => { e.stopPropagation(); dodge(); }}
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

        {/* 发牌员交互提示 - 已隐藏（卡组系统隐藏在游戏表层之下） */}

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
