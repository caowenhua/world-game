/**
 * 边境酒馆 (map_border_tavern)
 * 尚书省任务 JJC-20260407-009
 * 
 * 三层建筑
 * 尺寸: 80×80 (每层)
 * 类型: indoor
 * 战斗: disabled
 */

import { GameMap, TerrainType, NPC, Monster, MonsterSpawnPoint, Entry, Floor, FloorConnection, NPCPosition } from './map.types';

// ============================================================================
// 地形生成
// ============================================================================

/** 第一层：底层酒馆大厅 */
function generateFloor1Terrain(): TerrainType[][] {
  const width = 80;
  const height = 80;
  const terrain: TerrainType[][] = [];

  for (let y = 0; y < height; y++) {
    terrain[y] = [];
    for (let x = 0; x < width; x++) {
      terrain[y][x] = 1; // 默认地板
    }
  }

  // 边界墙壁
  for (let x = 0; x < width; x++) {
    terrain[0][x] = 2;
    terrain[height - 1][x] = 2;
  }
  for (let y = 0; y < height; y++) {
    terrain[y][0] = 2;
    terrain[y][width - 1] = 2;
  }

  // 吧台区域 (上方中间)
  for (let y = 5; y <= 15; y++) {
    for (let x = 30; x <= 50; x++) {
      if (y === 5 || y === 15) {
        terrain[y][x] = 2; // 吧台墙壁
      } else if (y === 10 && x >= 40 && x <= 42) {
        terrain[y][x] = 5; // 吧台门口
      } else {
        terrain[y][x] = 1;
      }
    }
  }

  // 酒馆桌椅区域
  // 左区
  for (let y = 25; y <= 35; y++) {
    for (let x = 10; x <= 25; x++) {
      if ((y === 25 || y === 35) && (x === 10 || x === 25)) {
        terrain[y][x] = 12; // 桌子角
      } else if (y === 30 && (x === 10 || x === 25)) {
        terrain[y][x] = 12; // 椅子
      }
    }
  }
  // 右区
  for (let y = 25; y <= 35; y++) {
    for (let x = 55; x <= 70; x++) {
      if ((y === 25 || y === 35) && (x === 55 || x === 70)) {
        terrain[y][x] = 12;
      } else if (y === 30 && (x === 55 || x === 70)) {
        terrain[y][x] = 12;
      }
    }
  }
  // 中央区域
  for (let y = 45; y <= 55; y++) {
    for (let x = 30; x <= 50; x++) {
      if ((y === 45 || y === 55) && (x === 30 || x === 50)) {
        terrain[y][x] = 12;
      }
    }
  }

  // 壁炉 (右侧墙)
  for (let y = 20; y <= 30; y++) {
    for (let x = 70; x <= 76; x++) {
      if (x === 70) {
        terrain[y][x] = 2; // 壁炉外墙
      } else if (y === 20 || y === 30) {
        terrain[y][x] = 2;
      } else {
        terrain[y][x] = 15; // 熔岩/火焰效果
      }
    }
  }

  // 通向二楼的楼梯 (右下角)
  for (let y = 60; y <= 70; y++) {
    for (let x = 60; x <= 70; x++) {
      terrain[y][x] = 9; // 楼梯下
    }
  }

  // 出口门 (底层出口)
  terrain[78][38] = 5;
  terrain[78][39] = 5;
  terrain[78][40] = 5;
  terrain[78][41] = 5;
  terrain[78][42] = 5;

  return terrain;
}

/** 第二层：客房 */
function generateFloor2Terrain(): TerrainType[][] {
  const width = 80;
  const height = 80;
  const terrain: TerrainType[][] = [];

  for (let y = 0; y < height; y++) {
    terrain[y] = [];
    for (let x = 0; x < width; x++) {
      terrain[y][x] = 1;
    }
  }

  // 边界墙壁
  for (let x = 0; x < width; x++) {
    terrain[0][x] = 2;
    terrain[height - 1][x] = 2;
  }
  for (let y = 0; y < height; y++) {
    terrain[y][0] = 2;
    terrain[y][width - 1] = 2;
  }

  // 走廊 (中间纵向)
  for (let y = 0; y < height; y++) {
    for (let x = 35; x <= 45; x++) {
      terrain[y][x] = 1;
    }
  }

  // 客房1 (左上)
  for (let y = 5; y <= 25; y++) {
    for (let x = 5; x <= 30; x++) {
      if (y === 5 || y === 25 || x === 5 || x === 30) {
        terrain[y][x] = 2;
      } else if (y === 15 && x >= 15 && x <= 20) {
        terrain[y][x] = 1; // 床
      } else {
        terrain[y][x] = 1;
      }
    }
  }

  // 客房2 (右上)
  for (let y = 5; y <= 25; y++) {
    for (let x = 50; x <= 75; x++) {
      if (y === 5 || y === 25 || x === 50 || x === 75) {
        terrain[y][x] = 2;
      } else if (y === 15 && x >= 55 && x <= 65) {
        terrain[y][x] = 1; // 床
      } else {
        terrain[y][x] = 1;
      }
    }
  }

  // 客房3 (左下)
  for (let y = 50; y <= 70; y++) {
    for (let x = 5; x <= 30; x++) {
      if (y === 50 || y === 70 || x === 5 || x === 30) {
        terrain[y][x] = 2;
      } else if (y === 60 && x >= 10 && x <= 20) {
        terrain[y][x] = 1; // 床
      } else {
        terrain[y][x] = 1;
      }
    }
  }

  // 客房4 (右下)
  for (let y = 50; y <= 70; y++) {
    for (let x = 50; x <= 75; x++) {
      if (y === 50 || y === 70 || x === 50 || x === 75) {
        terrain[y][x] = 2;
      } else if (y === 60 && x >= 55 && x <= 65) {
        terrain[y][x] = 1; // 床
      } else {
        terrain[y][x] = 1;
      }
    }
  }

  // 楼梯1 (通往一楼，左侧)
  for (let y = 30; y <= 45; y++) {
    for (let x = 10; x <= 20; x++) {
      terrain[y][x] = 8; // 楼梯上
    }
  }

  // 楼梯2 (通往三楼，右侧)
  for (let y = 30; y <= 45; y++) {
    for (let x = 60; x <= 70; x++) {
      terrain[y][x] = 9; // 楼梯下
    }
  }

  return terrain;
}

/** 第三层：阁楼/储藏室 */
function generateFloor3Terrain(): TerrainType[][] {
  const width = 80;
  const height = 80;
  const terrain: TerrainType[][] = [];

  for (let y = 0; y < height; y++) {
    terrain[y] = [];
    for (let x = 0; x < width; x++) {
      terrain[y][x] = 1;
    }
  }

  // 边界墙壁
  for (let x = 0; x < width; x++) {
    terrain[0][x] = 2;
    terrain[height - 1][x] = 2;
  }
  for (let y = 0; y < height; y++) {
    terrain[y][0] = 2;
    terrain[y][width - 1] = 2;
  }

  // 倾斜屋顶效果 (斜坡)
  for (let y = 5; y <= 20; y++) {
    for (let x = 0; x < width; x++) {
      if (y < 5 + Math.floor(x / 10)) {
        terrain[y][x] = 2; // 天花板
      }
    }
  }

  // 储藏箱区域
  for (let y = 25; y <= 45; y++) {
    for (let x = 10; x <= 35; x++) {
      if ((y === 25 || y === 45) && (x === 10 || x === 35 || x === 22)) {
        terrain[y][x] = 11; // 宝箱
      } else if (y > 25 && y < 45 && x > 10 && x < 35 && (x === 10 || x === 22 || x === 35)) {
        terrain[y][x] = 11;
      }
    }
  }

  // 旧家具区
  for (let y = 50; y <= 70; y++) {
    for (let x = 20; x <= 60; x++) {
      if ((y === 50 || y === 70) && (x === 20 || x === 60)) {
        terrain[y][x] = 12; // 旧家具
      }
    }
  }

  // 窗户 (东侧)
  for (let y = 30; y <= 50; y++) {
    terrain[y][78] = 1; // 窗户
  }

  // 楼梯 (通往二楼)
  for (let y = 60; y <= 75; y++) {
    for (let x = 60; x <= 70; x++) {
      terrain[y][x] = 8; // 楼梯上
    }
  }

  return terrain;
}

// ============================================================================
// NPC定义
// ============================================================================

export const borderTavernNPCs: NPC[] = [
  {
    id: 'npc_tavern_owner',
    name: '酒馆老板',
    title: '老板娘',
    sprite: '👩',
    position: { x: 40, y: 10, z: 0, region: 'map_border_tavern' },
    level: 1,
    faction: '边境酒馆',
    dialogueEnabled: true,
    dialogue: [
      {
        id: 't1',
        speaker: '酒馆老板',
        content: '欢迎光临边境酒馆！来来来，喝一杯暖暖身子。',
        nextNodeId: 't2',
      },
      {
        id: 't2',
        speaker: '酒馆老板',
        content: '我们这里有上好的麦酒，还有各地的奇闻异事。旅人们都喜欢在这儿歇脚。',
        choices: [
          { text: '来杯酒', nextNodeId: 't3' },
          { text: '有什么消息吗？', nextNodeId: 't4' },
        ],
      },
      {
        id: 't3',
        speaker: '酒馆老板',
        content: '好嘞！请慢用～',
      },
      {
        id: 't4',
        speaker: '酒馆老板',
        content: '听说北边的森林最近不太平，野兽比往常多了不少。冒险者们可要小心啊。',
      },
    ],
    interactionType: 'dialogue',
    isHostile: false,
  },
  {
    id: 'npc_traveler',
    name: '旅行商人',
    sprite: '🧳',
    position: { x: 35, y: 50, z: 0, region: 'map_border_tavern' },
    level: 2,
    faction: '旅行商人公会',
    dialogueEnabled: true,
    dialogue: [
      {
        id: 'tr1',
        speaker: '旅行商人',
        content: '哟，年轻的冒险者！我从远方来，带来了一些稀奇的货物。',
        nextNodeId: 'tr2',
      },
      {
        id: 'tr2',
        speaker: '旅行商人',
        content: '要看看吗？保证是市面上见不到的好东西！',
        choices: [
          { text: '看看商品', nextNodeId: 'tr3' },
          { text: '改天再说', nextNodeId: 'tr4' },
        ],
      },
      {
        id: 'tr3',
        speaker: '旅行商人',
        content: '这些都是我从各地收集来的，保证童叟无欺！',
      },
      {
        id: 'tr4',
        speaker: '旅行商人',
        content: '也好，有需要随时来找我。',
      },
    ],
    interactionType: 'shop',
    shopItems: ['item_rare_gem', 'item_travel_cloak', 'item_lucky_charm'],
    isHostile: false,
  },
  {
    id: 'npc_waiter',
    name: '服务员',
    sprite: '🧑‍🍳',
    position: { x: 45, y: 35, z: 0, region: 'map_border_tavern' },
    level: 1,
    faction: '边境酒馆',
    dialogueEnabled: true,
    dialogue: [
      {
        id: 'w1',
        speaker: '服务员',
        content: '客人您好，需要点什么？',
      },
    ],
    interactionType: 'dialogue',
    isHostile: false,
  },
];

// ============================================================================
// 楼层配置
// ============================================================================

export const borderTavernFloors: Floor[] = [
  {
    floorIndex: 0,
    name: '酒馆大厅',
    width: 80,
    height: 80,
    terrain: generateFloor1Terrain(),
    npcPositions: [
      { npcId: 'npc_tavern_owner', position: { x: 40, y: 10, z: 0, region: 'map_border_tavern' } },
      { npcId: 'npc_traveler', position: { x: 35, y: 50, z: 0, region: 'map_border_tavern' } },
      { npcId: 'npc_waiter', position: { x: 45, y: 35, z: 0, region: 'map_border_tavern' } },
    ],
    monsterSpawns: [],
    connections: [
      {
        fromFloor: 0,
        toFloor: 1,
        fromPosition: { x: 65, y: 65, z: 0, region: 'map_border_tavern' },
        toPosition: { x: 15, y: 35, z: 1, region: 'map_border_tavern' },
        connectionType: 'stairs_up',
      },
    ],
  },
  {
    floorIndex: 1,
    name: '客房',
    width: 80,
    height: 80,
    terrain: generateFloor2Terrain(),
    npcPositions: [],
    monsterSpawns: [],
    connections: [
      {
        fromFloor: 1,
        toFloor: 0,
        fromPosition: { x: 15, y: 35, z: 1, region: 'map_border_tavern' },
        toPosition: { x: 65, y: 65, z: 0, region: 'map_border_tavern' },
        connectionType: 'stairs_down',
      },
      {
        fromFloor: 1,
        toFloor: 2,
        fromPosition: { x: 65, y: 35, z: 1, region: 'map_border_tavern' },
        toPosition: { x: 65, y: 65, z: 2, region: 'map_border_tavern' },
        connectionType: 'stairs_up',
      },
    ],
  },
  {
    floorIndex: 2,
    name: '阁楼',
    width: 80,
    height: 80,
    terrain: generateFloor3Terrain(),
    npcPositions: [],
    monsterSpawns: [],
    connections: [
      {
        fromFloor: 2,
        toFloor: 1,
        fromPosition: { x: 65, y: 65, z: 2, region: 'map_border_tavern' },
        toPosition: { x: 65, y: 35, z: 1, region: 'map_border_tavern' },
        connectionType: 'stairs_down',
      },
    ],
  },
];

// ============================================================================
// 边境酒馆完整地图对象
// ============================================================================

export const mapBorderTavern: GameMap = {
  id: 'map_border_tavern',
  name: '边境酒馆',
  description: '位于边境的三层酒馆，一楼是酒馆大厅，二楼是客房，三楼是阁楼。这里是旅人们歇脚交流的好去处。',
  type: 'indoor',
  width: 80,
  height: 80,
  combatEnabled: false, // 室内，无战斗
  safeZone: true,
  floors: borderTavernFloors,
  // 使用第一层作为默认显示
  terrain: borderTavernFloors[0].terrain,
  npcs: borderTavernNPCs,
  monsters: [],
  monsterSpawns: [],
  entries: [
    {
      id: 'entry_tavern_main',
      name: '酒馆正门',
      position: { x: 40, y: 78, z: 0, region: 'map_border_tavern' },
      targetMapId: 'map_pingfu_town', // 连接平和镇
      targetPosition: { x: 50, y: 100, z: 0, region: 'map_pingfu_town' },
      entryType: 'door',
      isLocked: false,
      isHidden: false,
    },
  ],
  portals: [],
  npcPositions: borderTavernFloors[0].npcPositions,
  region: {
    id: 'region_border',
    name: '边境区域',
    description: '危险的边境地带',
    dangerLevel: 'medium',
    pointsOfInterest: [
      { id: 'poi_tavern_bar', name: '吧台', description: '酒馆的核心区域', position: { x: 40, y: 10, z: 0, region: 'map_border_tavern' }, type: 'landmark' },
      { id: 'poi_tavern_fireplace', name: '壁炉', description: '温暖的壁炉', position: { x: 73, y: 25, z: 0, region: 'map_border_tavern' }, type: 'landmark' },
    ],
  },
  dangerLevel: 'safe',
  recommendedLevel: 1,
  backgroundMusic: 'tavern_ambient.ogg',
  ambientSound: 'fire_crackling.ogg',
  chunkSize: 16,
  tileSize: 32,
  renderDistance: 15,
  isPvPEnabled: false,
  isRestAllowed: true,
  tileset: 'tavern_tileset',
  minimapStyle: 'auto',
  version: '1.0.0',
  lastUpdated: '2026-04-07',
};

export default mapBorderTavern;
