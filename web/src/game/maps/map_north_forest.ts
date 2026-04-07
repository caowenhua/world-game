/**
 * 北部森林 (map_north_forest)
 * 尚书省任务 JJC-20260407-009
 * 
 * 尺寸: 300×300
 * 类型: outdoor
 * 战斗: enabled
 * 怪物: 野猪、灰狼、巨型蜘蛛
 */

import { GameMap, TerrainType, NPC, Monster, MonsterSpawnPoint, Entry, NPCPosition } from './map.types';

// ============================================================================
// 怪物定义
// ============================================================================

export const northForestMonsters: Monster[] = [
  {
    id: 'mon_wild_boar',
    name: '野猪',
    sprite: '🐗',
    level: 2,
    hp: 60,
    maxHp: 60,
    mp: 0,
    maxMp: 0,
    attack: 12,
    defense: 8,
    intelligence: 3,
    agility: 5,
    exp: 30,
    gold: { min: 5, max: 15 },
    drops: [
      { itemId: 'item_wild_boar_meat', name: '野猪肉', dropRate: 0.6, quantity: { min: 1, max: 2 } },
      { itemId: 'item_tusk', name: '野猪獠牙', dropRate: 0.3, quantity: { min: 1, max: 1 } },
    ],
    skills: ['skill_charge'],
    behavior: 'aggressive',
    sightRange: 5,
    attackRange: 1,
    moveSpeed: 80,
    isElite: false,
    isBoss: false,
  },
  {
    id: 'mon_gray_wolf',
    name: '灰狼',
    sprite: '🐺',
    level: 3,
    hp: 55,
    maxHp: 55,
    mp: 10,
    maxMp: 10,
    attack: 14,
    defense: 6,
    intelligence: 5,
    agility: 12,
    exp: 40,
    gold: { min: 8, max: 20 },
    drops: [
      { itemId: 'item_wolf_pelt', name: '狼皮', dropRate: 0.5, quantity: { min: 1, max: 2 } },
      { itemId: 'item_wolf_fang', name: '狼牙', dropRate: 0.4, quantity: { min: 1, max: 3 } },
    ],
    skills: ['skill_bite', 'skill_howl'],
    behavior: 'aggressive',
    sightRange: 8,
    attackRange: 1,
    moveSpeed: 100,
    isElite: false,
    isBoss: false,
  },
  {
    id: 'mon_giant_spider',
    name: '巨型蜘蛛',
    sprite: '🕷️',
    level: 4,
    hp: 70,
    maxHp: 70,
    mp: 20,
    maxMp: 20,
    attack: 16,
    defense: 10,
    intelligence: 4,
    agility: 14,
    exp: 50,
    gold: { min: 10, max: 25 },
    drops: [
      { itemId: 'item_spider_silk', name: '蜘蛛丝', dropRate: 0.7, quantity: { min: 2, max: 4 } },
      { itemId: 'item_spider_venom', name: '蜘蛛毒液', dropRate: 0.3, quantity: { min: 1, max: 2 } },
    ],
    skills: ['skill_web_shot', 'skill_poison_bite'],
    behavior: 'aggressive',
    sightRange: 7,
    attackRange: 3,
    moveSpeed: 90,
    isElite: false,
    isBoss: false,
  },
];

// ============================================================================
// 地形生成 (300×300)
// ============================================================================

function generateNorthForestTerrain(): TerrainType[][] {
  const width = 300;
  const height = 300;
  const terrain: TerrainType[][] = [];

  // 使用 seeded random 保持一致性
  const seed = 0x1337;
  let rand = seed;
  const random = () => {
    rand = (rand * 1103515245 + 12345) & 0x7fffffff;
    return rand / 0x7fffffff;
  };

  // 初始化为草地
  for (let y = 0; y < height; y++) {
    terrain[y] = [];
    for (let x = 0; x < width; x++) {
      terrain[y][x] = 0; // 草地
    }
  }

  // 边界树林
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < 5; y++) terrain[y][x] = 4;
    for (let y = height - 5; y < height; y++) terrain[y][x] = 4;
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < 5; x++) terrain[y][x] = 4;
    for (let x = width - 5; x < width; x++) terrain[y][x] = 4;
  }

  // 随机树木群
  for (let i = 0; i < 3000; i++) {
    const tx = Math.floor(random() * (width - 20)) + 10;
    const ty = Math.floor(random() * (height - 20)) + 10;
    // 避开中央道路
    if (Math.abs(tx - 150) < 30 || Math.abs(ty - 150) < 30) continue;
    // 避免密集
    let nearby = 0;
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        if (terrain[ty + dy] && terrain[ty + dy][tx + dx] === 4) nearby++;
      }
    }
    if (nearby < 3) terrain[ty][tx] = 4;
  }

  // 中央道路 (南北向)
  for (let y = 20; y < height - 20; y++) {
    for (let x = 135; x <= 165; x++) {
      terrain[y][x] = 1; // 土路
    }
  }

  // 中央道路 (东西向)
  for (let x = 20; x < width - 20; x++) {
    for (let y = 135; y <= 165; y++) {
      terrain[y][x] = 1;
    }
  }

  // 岩石群 (北部区域)
  for (let i = 0; i < 50; i++) {
    const rx = Math.floor(random() * 80) + 30;
    const ry = Math.floor(random() * 80) + 30;
    terrain[ry][rx] = 14; // 岩石
  }

  // 灌木丛 (隐蔽点)
  for (let i = 0; i < 100; i++) {
    const bx = Math.floor(random() * (width - 40)) + 20;
    const by = Math.floor(random() * (height - 40)) + 20;
    if (terrain[by][bx] === 0) {
      terrain[by][bx] = 13; // 灌木
    }
  }

  // 小池塘
  const pondX = 60;
  const pondY = 220;
  for (let py = pondY - 10; py <= pondY + 10; py++) {
    for (let px = pondX - 10; px <= pondX + 10; px++) {
      const dist = Math.sqrt((px - pondX) ** 2 + (py - pondY) ** 2);
      if (dist < 8) {
        terrain[py][px] = 3; // 水
      } else if (dist < 10) {
        terrain[py][px] = 4; // 岸边树木
      }
    }
  }

  // 空地/营地 (道路交叉口附近)
  for (let y = 140; y <= 160; y++) {
    for (let x = 140; x <= 160; x++) {
      terrain[y][x] = 1;
    }
  }

  return terrain;
}

// ============================================================================
// 怪物刷新点
// ============================================================================

export const northForestMonsterSpawns: MonsterSpawnPoint[] = [
  // 野猪刷新点 (分布在地图各处)
  { id: 'spawn_wild_boar_1', monsterId: 'mon_wild_boar', position: { x: 80, y: 80, z: 0, region: 'map_north_forest' }, respawnTime: 60, maxCount: 3, active: true },
  { id: 'spawn_wild_boar_2', monsterId: 'mon_wild_boar', position: { x: 220, y: 80, z: 0, region: 'map_north_forest' }, respawnTime: 60, maxCount: 3, active: true },
  { id: 'spawn_wild_boar_3', monsterId: 'mon_wild_boar', position: { x: 80, y: 220, z: 0, region: 'map_north_forest' }, respawnTime: 60, maxCount: 3, active: true },
  { id: 'spawn_wild_boar_4', monsterId: 'mon_wild_boar', position: { x: 220, y: 220, z: 0, region: 'map_north_forest' }, respawnTime: 60, maxCount: 3, active: true },
  
  // 灰狼刷新点 (主动攻击区域)
  { id: 'spawn_gray_wolf_1', monsterId: 'mon_gray_wolf', position: { x: 50, y: 150, z: 0, region: 'map_north_forest' }, respawnTime: 45, maxCount: 2, active: true },
  { id: 'spawn_gray_wolf_2', monsterId: 'mon_gray_wolf', position: { x: 250, y: 150, z: 0, region: 'map_north_forest' }, respawnTime: 45, maxCount: 2, active: true },
  { id: 'spawn_gray_wolf_3', monsterId: 'mon_gray_wolf', position: { x: 150, y: 50, z: 0, region: 'map_north_forest' }, respawnTime: 45, maxCount: 2, active: true },
  
  // 巨型蜘蛛刷新点 (蜘蛛网区域)
  { id: 'spawn_giant_spider_1', monsterId: 'mon_giant_spider', position: { x: 230, y: 230, z: 0, region: 'map_north_forest' }, respawnTime: 90, maxCount: 2, active: true },
  { id: 'spawn_giant_spider_2', monsterId: 'mon_giant_spider', position: { x: 70, y: 230, z: 0, region: 'map_north_forest' }, respawnTime: 90, maxCount: 2, active: true },
  { id: 'spawn_giant_spider_3', monsterId: 'mon_giant_spider', position: { x: 50, y: 60, z: 0, region: 'map_north_forest' }, respawnTime: 90, maxCount: 2, active: true },
];

// ============================================================================
// NPC定义
// ============================================================================

export const northForestNPCs: NPC[] = [
  {
    id: 'npc_forest_ranger',
    name: '森林护林员',
    sprite: '🧑‍🌾',
    position: { x: 150, y: 150, z: 0, region: 'map_north_forest' },
    level: 5,
    faction: '护林者公会',
    dialogueEnabled: true,
    dialogue: [
      {
        id: 'fr1',
        speaker: '森林护林员',
        content: '小心！这片森林里野兽出没，尤其是灰狼非常凶猛。',
        nextNodeId: 'fr2',
      },
      {
        id: 'fr2',
        speaker: '森林护林员',
        content: '如果要采集资源，记得带够药水。遇到危险就往大路上跑。',
        choices: [
          { text: '谢谢提醒', nextNodeId: 'fr3' },
          { text: '有什么任务吗？', nextNodeId: 'fr4' },
        ],
      },
      {
        id: 'fr3',
        speaker: '森林护林员',
        content: '愿森林保佑你。',
      },
      {
        id: 'fr4',
        speaker: '森林护林员',
        content: '最近蜘蛛繁殖得太多了，如果你能清理一些，我会很感激的。',
      },
    ],
    interactionType: 'dialogue',
    questId: 'quest_clear_spiders',
    isHostile: false,
  },
];

// ============================================================================
// 北部森林完整地图对象
// ============================================================================

export const mapNorthForest: GameMap = {
  id: 'map_north_forest',
  name: '北部森林',
  description: '平和镇北方的一片广阔森林，林木茂密，野兽横行。野猪、灰狼和巨型蜘蛛是这里的主要威胁。森林中央有通往各地的道路。',
  type: 'outdoor',
  width: 300,
  height: 300,
  combatEnabled: true, // 野外，有战斗
  safeZone: false,
  terrain: generateNorthForestTerrain(),
  npcs: northForestNPCs,
  monsters: northForestMonsters,
  monsterSpawns: northForestMonsterSpawns,
  entries: [
    {
      id: 'entry_north_south',
      name: '森林南入口',
      position: { x: 150, y: 5, z: 0, region: 'map_north_forest' },
      targetMapId: 'map_pingfu_town', // 平和镇
      targetPosition: { x: 100, y: 194, z: 0, region: 'map_pingfu_town' },
      entryType: 'transition',
      isLocked: false,
      isHidden: false,
    },
    {
      id: 'entry_north_north',
      name: '森林北出口',
      position: { x: 150, y: 295, z: 0, region: 'map_north_forest' },
      targetMapId: 'map_beast_cave', // 猛兽洞穴
      targetPosition: { x: 125, y: 5, z: 0, region: 'map_beast_cave' },
      entryType: 'cave_entrance',
      isLocked: false,
      isHidden: false,
    },
  ],
  portals: [],
  npcPositions: northForestNPCs.map(npc => ({
    npcId: npc.id,
    position: npc.position,
  })),
  region: {
    id: 'region_north_forest',
    name: '北部森林区域',
    description: '野兽横行的原始森林',
    dangerLevel: 'medium',
    pointsOfInterest: [
      { id: 'poi_forest_crossroads', name: '森林十字路口', description: '通往各地的道路交汇处', position: { x: 150, y: 150, z: 0, region: 'map_north_forest' }, type: 'landmark' },
      { id: 'poi_forest_pond', name: '森林池塘', description: '宁静的水池', position: { x: 60, y: 220, z: 0, region: 'map_north_forest' }, type: 'landmark' },
      { id: 'poi_ranger_camp', name: '护林员营地', description: '护林员歇脚的地方', position: { x: 150, y: 150, z: 0, region: 'map_north_forest' }, type: 'landmark' },
    ],
  },
  dangerLevel: 'medium',
  recommendedLevel: 3,
  backgroundMusic: 'forest_ambient.ogg',
  ambientSound: 'forest_wind.ogg',
  chunkSize: 16,
  tileSize: 32,
  renderDistance: 25,
  isPvPEnabled: false,
  isRestAllowed: false,
  tileset: 'forest_tileset',
  minimapStyle: 'auto',
  version: '1.0.0',
  lastUpdated: '2026-04-07',
};

export default mapNorthForest;
