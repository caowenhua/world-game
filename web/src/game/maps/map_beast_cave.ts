/**
 * 猛兽洞穴 (map_beast_cave)
 * 尚书省任务 JJC-20260407-009
 * 
 * 尺寸: 250×250
 * 类型: outdoor (洞穴环境)
 * 战斗: enabled
 * 怪物: 洞穴蝙蝠、洞穴熊、精英洞穴领主体
 */

import { GameMap, TerrainType, NPC, Monster, MonsterSpawnPoint, Entry, NPCPosition } from './map.types';

// ============================================================================
// 怪物定义
// ============================================================================

export const beastCaveMonsters: Monster[] = [
  {
    id: 'mon_cave_bat',
    name: '洞穴蝙蝠',
    sprite: '🦇',
    level: 4,
    hp: 40,
    maxHp: 40,
    mp: 10,
    maxMp: 10,
    attack: 15,
    defense: 5,
    intelligence: 2,
    agility: 18,
    exp: 35,
    gold: { min: 3, max: 10 },
    drops: [
      { itemId: 'item_bat_wing', name: '蝙蝠翅膀', dropRate: 0.5, quantity: { min: 1, max: 2 } },
      { itemId: 'item_bat_cave', name: '洞穴蝙蝠', dropRate: 0.2, quantity: { min: 1, max: 1 } },
    ],
    skills: ['skill_sonic_scream', 'skill_dive_attack'],
    behavior: 'aggressive',
    sightRange: 10,
    attackRange: 2,
    moveSpeed: 120,
    isElite: false,
    isBoss: false,
    spawnConditions: [
      { type: 'difficulty', value: 1 },
    ],
  },
  {
    id: 'mon_cave_bear',
    name: '洞穴熊',
    sprite: '🐻',
    level: 6,
    hp: 120,
    maxHp: 120,
    mp: 0,
    maxMp: 0,
    attack: 22,
    defense: 18,
    intelligence: 4,
    agility: 6,
    exp: 80,
    gold: { min: 15, max: 35 },
    drops: [
      { itemId: 'item_bear_pelt', name: '熊皮', dropRate: 0.6, quantity: { min: 1, max: 2 } },
      { itemId: 'item_bear_claw', name: '熊爪', dropRate: 0.4, quantity: { min: 2, max: 4 } },
      { itemId: 'item_bear_gall', name: '熊胆', dropRate: 0.15, quantity: { min: 1, max: 1 } },
    ],
    skills: ['skill_heavy_swipe', 'skill_ground_slam'],
    behavior: 'aggressive',
    sightRange: 6,
    attackRange: 1,
    moveSpeed: 50,
    isElite: false,
    isBoss: false,
  },
  {
    id: 'mon_elite_beast',
    name: '精英洞穴领主体',
    sprite: '👹',
    level: 10,
    hp: 500,
    maxHp: 500,
    mp: 50,
    maxMp: 50,
    attack: 35,
    defense: 25,
    intelligence: 10,
    agility: 12,
    exp: 500,
    gold: { min: 100, max: 200 },
    drops: [
      { itemId: 'item_beast_heart', name: '野兽心脏', dropRate: 1.0, quantity: { min: 1, max: 1 } },
      { itemId: 'item_elite_essence', name: '精英精华', dropRate: 0.8, quantity: { min: 1, max: 2 } },
      { itemId: 'item_beast_trophy', name: '野兽战利品', dropRate: 0.5, quantity: { min: 1, max: 1 } },
    ],
    skills: ['skill_beast_roar', 'skill_massive_charge', 'skill_regeneration'],
    behavior: 'aggressive',
    sightRange: 15,
    attackRange: 2,
    moveSpeed: 70,
    isElite: true,
    isBoss: false,
  },
];

// ============================================================================
// 地形生成 (250×250)
// ============================================================================

function generateBeastCaveTerrain(): TerrainType[][] {
  const width = 250;
  const height = 250;
  const terrain: TerrainType[][] = [];

  const seed = 0xBEEF;
  let rand = seed;
  const random = () => {
    rand = (rand * 1103515245 + 12345) & 0x7fffffff;
    return rand / 0x7fffffff;
  };

  // 初始化为普通地面
  for (let y = 0; y < height; y++) {
    terrain[y] = [];
    for (let x = 0; x < width; x++) {
      terrain[y][x] = 1; // 洞穴地面
    }
  }

  // 边界岩壁
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < 8; y++) terrain[y][x] = 2;
    for (let y = height - 8; y < height; y++) terrain[y][x] = 2;
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < 8; x++) terrain[y][x] = 2;
    for (let x = width - 8; x < width; x++) terrain[y][x] = 2;
  }

  // 洞穴入口区域 (上方)
  for (let y = 8; y <= 25; y++) {
    for (let x = 100; x <= 150; x++) {
      terrain[y][x] = 0; // 草地过渡
    }
  }

  // 主通道 (蜿蜒的洞穴通道)
  // 入口到Boss房间的路径
  const mainPath: { x: number; y: number }[] = [];
  let cx = 125;
  let cy = 30;
  mainPath.push({ x: cx, y: cy });
  
  for (let i = 0; i < 15; i++) {
    cx += Math.floor(random() * 20) - 10;
    cy += Math.floor(random() * 15) + 10;
    cx = Math.max(40, Math.min(cx, width - 40));
    cy = Math.min(cy, 200);
    mainPath.push({ x: cx, y: cy });
  }

  // 绘制主通道
  for (const p of mainPath) {
    for (let dy = -5; dy <= 5; dy++) {
      for (let dx = -5; dx <= 5; dx++) {
        const tx = p.x + dx;
        const ty = p.y + dy;
        if (tx > 8 && tx < width - 8 && ty > 25 && ty < height - 8) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 4) {
            terrain[ty][tx] = 1; // 通道地面
          }
        }
      }
    }
  }

  // 蝙蝠栖息区 (洞穴顶部区域)
  for (let y = 30; y <= 80; y++) {
    for (let x = 180; x <= 240; x++) {
      if (random() < 0.3) {
        terrain[y][x] = 2; // 岩壁
      } else {
        terrain[y][x] = 1;
      }
    }
  }

  // 熊穴区域 (右下角)
  for (let y = 150; y <= 220; y++) {
    for (let x = 150; x <= 220; x++) {
      if (y === 150 || y === 220 || x === 150 || x === 220) {
        terrain[y][x] = 2;
      } else if (random() < 0.2) {
        terrain[y][x] = 14; // 岩石
      }
    }
  }

  // Boss房间 (洞穴最深处)
  for (let y = 180; y <= 240; y++) {
    for (let x = 80; x <= 170; x++) {
      if (y === 180 || y === 240 || x === 80 || x === 170) {
        terrain[y][x] = 2; // Boss房间墙壁
      } else {
        terrain[y][x] = 1;
      }
    }
  }
  // Boss房间入口
  for (let x = 120; x <= 130; x++) {
    terrain[240][x] = 1;
  }

  // 水池/陷阱区域
  // 毒水池 (中间区域)
  for (let y = 100; y <= 130; y++) {
    for (let x = 30; x <= 60; x++) {
      const dist = Math.sqrt((x - 45) ** 2 + (y - 115) ** 2);
      if (dist < 15) {
        terrain[y][x] = 18; // 深水/毒水
      } else if (dist < 18) {
        terrain[y][x] = 3; // 水边缘
      }
    }
  }

  // 岩石陷阱区域
  for (let i = 0; i < 20; i++) {
    const rx = Math.floor(random() * 100) + 60;
    const ry = Math.floor(random() * 60) + 80;
    terrain[ry][rx] = 14; // 岩石
  }

  // 矿脉区域 (有价值的资源点)
  for (let y = 60; y <= 100; y++) {
    for (let x = 180; x <= 240; x++) {
      if (random() < 0.15) {
        terrain[y][x] = 14; // 矿石岩石
      }
    }
  }

  // 出口 (返回森林)
  for (let x = 120; x <= 130; x++) {
    terrain[8][x] = 7; // 出口
  }

  return terrain;
}

// ============================================================================
// 怪物刷新点
// ============================================================================

export const beastCaveMonsterSpawns: MonsterSpawnPoint[] = [
  // 蝙蝠刷新点 (顶部区域)
  { id: 'spawn_cave_bat_1', monsterId: 'mon_cave_bat', position: { x: 200, y: 40, z: 0, region: 'map_beast_cave' }, respawnTime: 30, maxCount: 5, active: true },
  { id: 'spawn_cave_bat_2', monsterId: 'mon_cave_bat', position: { x: 220, y: 70, z: 0, region: 'map_beast_cave' }, respawnTime: 30, maxCount: 5, active: true },
  { id: 'spawn_cave_bat_3', monsterId: 'mon_cave_bat', position: { x: 190, y: 55, z: 0, region: 'map_beast_cave' }, respawnTime: 30, maxCount: 5, active: true },
  { id: 'spawn_cave_bat_4', monsterId: 'mon_cave_bat', position: { x: 210, y: 85, z: 0, region: 'map_beast_cave' }, respawnTime: 30, maxCount: 5, active: true },

  // 熊刷新点 (熊穴区域)
  { id: 'spawn_cave_bear_1', monsterId: 'mon_cave_bear', position: { x: 175, y: 185, z: 0, region: 'map_beast_cave' }, respawnTime: 120, maxCount: 2, active: true },
  { id: 'spawn_cave_bear_2', monsterId: 'mon_cave_bear', position: { x: 200, y: 200, z: 0, region: 'map_beast_cave' }, respawnTime: 120, maxCount: 2, active: true },
  { id: 'spawn_cave_bear_3', monsterId: 'mon_cave_bear', position: { x: 185, y: 210, z: 0, region: 'map_beast_cave' }, respawnTime: 120, maxCount: 2, active: true },

  // Boss刷新点 (最深处)
  { id: 'spawn_elite_beast', monsterId: 'mon_elite_beast', position: { x: 125, y: 210, z: 0, region: 'map_beast_cave' }, respawnTime: 600, maxCount: 1, active: true },

  // 游荡怪物 (通道中)
  { id: 'spawn_wander_bat_1', monsterId: 'mon_cave_bat', position: { x: 125, y: 60, z: 0, region: 'map_beast_cave' }, respawnTime: 45, maxCount: 3, active: true },
  { id: 'spawn_wander_bear_1', monsterId: 'mon_cave_bear', position: { x: 100, y: 120, z: 0, region: 'map_beast_cave' }, respawnTime: 180, maxCount: 1, active: true },
];

// ============================================================================
// NPC定义
// ============================================================================

export const beastCaveNPCs: NPC[] = [
  {
    id: 'npc_cave_hermit',
    name: '洞穴隐士',
    sprite: '🧙',
    position: { x: 45, y: 115, z: 0, region: 'map_beast_cave' },
    level: 8,
    faction: '中立',
    dialogueEnabled: true,
    dialogue: [
      {
        id: 'ch1',
        speaker: '洞穴隐士',
        content: '咳咳... 又一个闯入这片禁地的冒险者。',
        nextNodeId: 'ch2',
      },
      {
        id: 'ch2',
        speaker: '洞穴隐士',
        content: '这个洞穴深处住着一只可怕的精英野兽，普通武器伤不了它。',
        nextNodeId: 'ch3',
      },
      {
        id: 'ch3',
        speaker: '洞穴隐士',
        content: '如果你执意要挑战它，至少带上解毒剂...这里的蝙蝠可不好惹。',
        choices: [
          { text: '多谢指点', nextNodeId: 'ch4' },
          { text: '为什么要住在这里？', nextNodeId: 'ch5' },
        ],
      },
      {
        id: 'ch4',
        speaker: '洞穴隐士',
        content: '去吧，愿你平安归来。',
      },
      {
        id: 'ch5',
        speaker: '洞穴隐士',
        content: '外面的世界...太喧嚣了。这里只有黑暗和野兽，但至少很安静。',
      },
    ],
    interactionType: 'dialogue',
    isHostile: false,
  },
];

// ============================================================================
// 猛兽洞穴完整地图对象
// ============================================================================

export const mapBeastCave: GameMap = {
  id: 'map_beast_cave',
  name: '猛兽洞穴',
  description: '北部森林深处的天然洞穴，内部阴暗潮湿，是各种凶猛野兽的巢穴。洞穴深处居住着一只精英洞穴领主体，是这一带最危险的生物。',
  type: 'outdoor', // 洞穴视为野外，因为是天然环境
  width: 250,
  height: 250,
  combatEnabled: true, // 有战斗
  safeZone: false,
  terrain: generateBeastCaveTerrain(),
  npcs: beastCaveNPCs,
  monsters: beastCaveMonsters,
  monsterSpawns: beastCaveMonsterSpawns,
  entries: [
    {
      id: 'entry_cave_south',
      name: '洞穴入口',
      position: { x: 125, y: 8, z: 0, region: 'map_beast_cave' },
      targetMapId: 'map_north_forest', // 北部森林
      targetPosition: { x: 150, y: 290, z: 0, region: 'map_north_forest' },
      entryType: 'cave_entrance',
      isLocked: false,
      isHidden: false,
    },
  ],
  portals: [],
  npcPositions: beastCaveNPCs.map(npc => ({
    npcId: npc.id,
    position: npc.position,
  })),
  region: {
    id: 'region_beast_cave',
    name: '猛兽洞穴区域',
    description: '野兽横行的危险洞穴',
    dangerLevel: 'high',
    pointsOfInterest: [
      { id: 'poi_cave_entrance', name: '洞穴入口', description: '通往外界的出口', position: { x: 125, y: 15, z: 0, region: 'map_beast_cave' }, type: 'landmark' },
      { id: 'poi_bat_area', name: '蝙蝠栖息区', description: '大量蝙蝠聚集', position: { x: 210, y: 55, z: 0, region: 'map_beast_cave' }, type: 'landmark' },
      { id: 'poi_bear_den', name: '熊穴', description: '洞穴熊的领地', position: { x: 185, y: 195, z: 0, region: 'map_beast_cave' }, type: 'landmark' },
      { id: 'poi_boss_room', name: '精英巢穴', description: '精英洞穴领主体的巢穴', position: { x: 125, y: 210, z: 0, region: 'map_beast_cave' }, type: 'dungeon' },
      { id: 'poi_poison_pool', name: '毒水池', description: '危险的毒水区', position: { x: 45, y: 115, z: 0, region: 'map_beast_cave' }, type: 'landmark' },
    ],
  },
  dangerLevel: 'high',
  recommendedLevel: 6,
  backgroundMusic: 'cave_ambient.ogg',
  ambientSound: 'cave_dripping.ogg',
  chunkSize: 16,
  tileSize: 32,
  renderDistance: 20,
  isPvPEnabled: false,
  isRestAllowed: false,
  tileset: 'cave_tileset',
  minimapStyle: 'auto',
  version: '1.0.0',
  lastUpdated: '2026-04-07',
};

export default mapBeastCave;
