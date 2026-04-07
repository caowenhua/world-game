/**
 * 平和镇 (map_pingfu_town)
 * 尚书省任务 JJC-20260407-009
 * 
 * 边境小镇新手区
 * 尺寸: 200×200
 * 类型: outdoor
 * 战斗: disabled (安全区)
 */

import { GameMap, TerrainType, NPC, Monster, MonsterSpawnPoint, Entry, NPCPosition } from './map.types';

// ============================================================================
// 地形生成 (200×200)
// ============================================================================

function generatePingfuTownTerrain(): TerrainType[][] {
  const width = 200;
  const height = 200;
  const terrain: TerrainType[][] = [];

  // 初始化为草地
  for (let y = 0; y < height; y++) {
    terrain[y] = [];
    for (let x = 0; x < width; x++) {
      terrain[y][x] = 0; // 草地
    }
  }

  // 边界围墙
  for (let x = 0; x < width; x++) {
    terrain[0][x] = 2; // 墙壁
    terrain[height - 1][x] = 2; // 墙壁
  }
  for (let y = 0; y < height; y++) {
    terrain[y][0] = 2; // 墙壁
    terrain[y][width - 1] = 2; // 墙壁
  }

  // 镇中心广场 (80-120, 80-120) - 硬石地面
  for (let y = 80; y <= 120; y++) {
    for (let x = 80; x <= 120; x++) {
      terrain[y][x] = 1; // 地板
    }
  }

  // 东西向主街 (100, 40-160)
  for (let y = 40; y <= 160; y++) {
    for (let x = 95; x <= 105; x++) {
      if (y >= 80 && y <= 120) continue; // 跳过广场
      terrain[y][x] = 1;
    }
  }

  // 南北向主街 (40-160, 100)
  for (let y = 95; y <= 105; y++) {
    for (let x = 40; x <= 160; x++) {
      if (x >= 80 && x <= 120) continue; // 跳过广场
      terrain[y][x] = 1;
    }
  }

  // 镇长宅邸 (左上区域 30-60, 30-60)
  for (let y = 30; y <= 60; y++) {
    for (let x = 30; x <= 60; x++) {
      if (y === 30 || y === 60 || x === 30 || x === 60) {
        terrain[y][x] = 2; // 墙壁
      } else if (y === 35 && x >= 43 && x <= 47) {
        terrain[y][x] = 5; // 大门
      } else {
        terrain[y][x] = 1;
      }
    }
  }

  // 武器店 (右上区域 140-170, 30-60)
  for (let y = 30; y <= 60; y++) {
    for (let x = 140; x <= 170; x++) {
      if (y === 30 || y === 60 || x === 140 || x === 170) {
        terrain[y][x] = 2;
      } else if (y === 35 && x >= 153 && x <= 157) {
        terrain[y][x] = 5;
      } else {
        terrain[y][x] = 1;
      }
    }
  }

  // 防具店 (右下区域 140-170, 140-170)
  for (let y = 140; y <= 170; y++) {
    for (let x = 140; x <= 170; x++) {
      if (y === 140 || y === 170 || x === 140 || x === 170) {
        terrain[y][x] = 2;
      } else if (y === 145 && x >= 153 && x <= 157) {
        terrain[y][x] = 5;
      } else {
        terrain[y][x] = 1;
      }
    }
  }

  // 药店 (左下区域 30-60, 140-170)
  for (let y = 140; y <= 170; y++) {
    for (let x = 30; x <= 60; x++) {
      if (y === 140 || y === 170 || x === 30 || x === 170) {
        terrain[y][x] = 2;
      } else if (y === 145 && x >= 43 && x <= 47) {
        terrain[y][x] = 5;
      } else {
        terrain[y][x] = 1;
      }
    }
  }

  // 旅馆 (上方 85-115, 20-40)
  for (let y = 20; y <= 40; y++) {
    for (let x = 85; x <= 115; x++) {
      if (y === 20 || y === 40 || x === 85 || x === 115) {
        terrain[y][x] = 2;
      } else if (y === 25 && x >= 97 && x <= 103) {
        terrain[y][x] = 5;
      } else {
        terrain[y][x] = 1;
      }
    }
  }

  // 出口标记 (南门 98-102, 195)
  for (let x = 98; x <= 102; x++) {
    terrain[195][x] = 7; // 出口
  }

  // 装饰树木 (镇外周边)
  const treePositions = [
    [10, 10], [15, 10], [10, 15],
    [185, 10], [190, 10], [185, 15],
    [10, 185], [15, 185], [10, 190],
    [185, 185], [190, 185], [185, 190],
    [50, 10], [150, 10], [50, 190], [150, 190],
  ];
  for (const [x, y] of treePositions) {
    terrain[y][x] = 4; // 树木
  }

  // 井口 (广场中央 100, 100)
  terrain[98][100] = 1;
  terrain[99][100] = 1;
  terrain[100][98] = 1;
  terrain[100][99] = 1;
  terrain[100][100] = 12; // 装饰物(井)
  terrain[100][101] = 1;
  terrain[101][100] = 1;

  return terrain;
}

// ============================================================================
// NPC定义
// ============================================================================

export const pingfuTownNPCs: NPC[] = [
  {
    id: 'npc_town_headman',
    name: '平和镇镇长',
    title: '老村长',
    sprite: '👴',
    position: { x: 45, y: 45, z: 0, region: 'map_pingfu_town' },
    level: 1,
    faction: '平和镇',
    dialogueEnabled: true,
    dialogue: [
      {
        id: 'd1',
        speaker: '平和镇镇长',
        content: '欢迎来到平和镇，年轻的冒险者。我是这里的镇长，希望你能在这里度过愉快的时光。',
        nextNodeId: 'd2',
      },
      {
        id: 'd2',
        speaker: '平和镇镇长',
        content: '镇子虽小，但五脏俱全。武器店、防具店、药店、旅馆，应有尽有。如果需要帮助，尽管来找我。',
        choices: [
          { text: '谢谢镇长', nextNodeId: 'd3' },
          { text: '这里有什么任务吗？', nextNodeId: 'd4' },
        ],
      },
      {
        id: 'd3',
        speaker: '平和镇镇长',
        content: '去吧，祝你旅途顺利！',
      },
      {
        id: 'd4',
        speaker: '平和镇镇长',
        content: '北部的森林最近有些野兽出没，如果有空可以去帮忙清理一下。',
      },
    ],
    interactionType: 'dialogue',
    isHostile: false,
  },
  {
    id: 'npc_merchant',
    name: '杂货商人',
    title: '老王头',
    sprite: '🧔',
    position: { x: 50, y: 100, z: 0, region: 'map_pingfu_town' },
    level: 1,
    faction: '平和镇',
    dialogueEnabled: true,
    dialogue: [
      {
        id: 'm1',
        speaker: '杂货商人',
        content: '哟，客人来了！要买些什么吗？',
        choices: [
          { text: '看看商品', nextNodeId: 'm2' },
          { text: '改天再说', nextNodeId: 'm3' },
        ],
      },
      {
        id: 'm2',
        speaker: '杂货商人',
        content: '基础道具都有，便宜卖给你！',
      },
      {
        id: 'm3',
        speaker: '杂货商人',
        content: '好嘞，欢迎下次光临！',
      },
    ],
    interactionType: 'shop',
    shopItems: ['item_herb', 'item_bandage', 'item_torch'],
    isHostile: false,
  },
  {
    id: 'npc_guide',
    name: '新手引导员',
    title: '冒险者公会接待员',
    sprite: '🧑',
    position: { x: 100, y: 90, z: 0, region: 'map_pingfu_town' },
    level: 1,
    faction: '冒险者公会',
    dialogueEnabled: true,
    dialogue: [
      {
        id: 'g1',
        speaker: '新手引导员',
        content: '你好，新来的冒险者！我是冒险者公会的接待员。',
        nextNodeId: 'g2',
      },
      {
        id: 'g2',
        speaker: '新手引导员',
        content: '在野外探索时，多注意自己的生命值和魔法值。遇到危险记得逃跑哦！',
        choices: [
          { text: '明白了', nextNodeId: 'g3' },
          { text: '有什么建议吗？', nextNodeId: 'g4' },
        ],
      },
      {
        id: 'g3',
        speaker: '新手引导员',
        content: '祝你在这个世界冒险愉快！',
      },
      {
        id: 'g4',
        speaker: '新手引导员',
        content: '多准备些药水，和同伴一起行动会更安全。记住，活着最重要！',
      },
    ],
    interactionType: 'dialogue',
    isHostile: false,
  },
];

// ============================================================================
// NPC位置
// ============================================================================

export const pingfuTownNPCPositions: NPCPosition[] = pingfuTownNPCs.map(npc => ({
  npcId: npc.id,
  position: npc.position,
}));

// ============================================================================
// 平和镇完整地图对象
// ============================================================================

export const mapPingfuTown: GameMap = {
  id: 'map_pingfu_town',
  name: '平和镇',
  description: '位于边境的小镇，气氛祥和，是冒险者们的起点。镇上有各种商店和设施，适合新手冒险者休整。',
  type: 'outdoor',
  width: 200,
  height: 200,
  combatEnabled: false, // 安全区，无战斗
  safeZone: true,
  terrain: generatePingfuTownTerrain(),
  npcs: pingfuTownNPCs,
  monsters: [], // 安全区无怪物
  monsterSpawns: [],
  entries: [
    {
      id: 'entry_south_gate',
      name: '平和镇南门',
      position: { x: 100, y: 195, z: 0, region: 'map_pingfu_town' },
      targetMapId: 'map_north_forest', // 北部森林
      targetPosition: { x: 100, y: 5, z: 0, region: 'map_north_forest' },
      entryType: 'gate',
      isLocked: false,
      isHidden: false,
    },
  ],
  portals: [],
  npcPositions: pingfuTownNPCPositions,
  region: {
    id: 'region_pingfu',
    name: '平和镇区域',
    description: '边境平和镇，冒险者的摇篮',
    dangerLevel: 'safe',
    pointsOfInterest: [
      { id: 'poi_town_center', name: '镇中心广场', description: '平和镇的核心区域', position: { x: 100, y: 100, z: 0, region: 'map_pingfu_town' }, type: 'landmark' },
      { id: 'poi_weapon_shop', name: '武器店', description: '出售各种武器', position: { x: 155, y: 45, z: 0, region: 'map_pingfu_town' }, type: 'shop' },
      { id: 'poi_armor_shop', name: '防具店', description: '出售各种防具', position: { x: 155, y: 155, z: 0, region: 'map_pingfu_town' }, type: 'shop' },
      { id: 'poi_pharmacy', name: '药店', description: '出售药水和解毒剂', position: { x: 45, y: 155, z: 0, region: 'map_pingfu_town' }, type: 'shop' },
      { id: 'poi_inn', name: '旅馆', description: '可以休息恢复生命', position: { x: 100, y: 30, z: 0, region: 'map_pingfu_town' }, type: 'inn' },
    ],
  },
  dangerLevel: 'safe',
  recommendedLevel: 1,
  backgroundMusic: 'peaceful_village.ogg',
  ambientSound: 'birds_chirping.ogg',
  chunkSize: 16,
  tileSize: 32,
  renderDistance: 20,
  isPvPEnabled: false,
  isRestAllowed: true,
  tileset: 'village_tileset',
  backgroundImage: 'village_bg',
  minimapStyle: 'auto',
  version: '1.0.0',
  lastUpdated: '2026-04-07',
};

export default mapPingfuTown;
