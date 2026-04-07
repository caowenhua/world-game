/**
 * Map System V2 - Type Definitions
 * 尚书省任务 JJC-20260407-009
 */

// ============================================================================
// 基础类型定义
// ============================================================================

/** 地图类型枚举 */
export type MAP_TYPE = 'indoor' | 'outdoor';

/** 地形类型枚举 */
export type TerrainType = 
  | 0  // 草地（可行走，会遇敌）
  | 1  // 地面/路（可行走，不遇敌）
  | 2  // 墙壁/障碍（不可通行）
  | 3  // 水（不可通行）
  | 4  // 树木（不可通行）
  | 5  // 门口（进入建筑）
  | 6  // NPC站立点
  | 7  // 出口/传送点
  | 8  // 楼梯（上）
  | 9  // 楼梯（下）
  | 10 // 陷阱（室内危险）
  | 11 // 宝箱
  | 12 // 装饰物（可通行）
  | 13 // 灌木（隐蔽）
  | 14 // 岩石（障碍）
  | 15 // 熔岩（不可通行）
  | 16 // 冰面（滑动）
  | 17 // 沙地（减速）
  | 18 // 深水（游泳区域）
  | 19 // 桥梁
  | 20; // 悬崖边缘（危险）

/** 危险等级 */
export type DangerLevel = 'safe' | 'low' | 'medium' | 'high' | 'extreme';

/** 怪物AI行为类型 */
export type MonsterBehavior = 'passive' | 'aggressive' | 'patrol' | 'stationary';

/** 掉落物类型 */
export interface DropItem {
  itemId: string;
  name: string;
  dropRate: number; // 0-1
  quantity: { min: number; max: number };
}

/** 区域类型 */
export interface Region {
  id: string;
  name: string;
  description: string;
  dangerLevel: DangerLevel;
  pointsOfInterest: POI[];
}

/** 兴趣点 */
export interface POI {
  id: string;
  name: string;
  description: string;
  position: Position;
  type: 'npc' | 'dungeon' | 'treasure' | 'landmark' | 'shop' | 'inn';
}

/** 位置坐标 */
export interface Position {
  x: number;
  y: number;
  z: number; // 楼层索引
  region: string;
}

/** 尺寸 */
export interface MapSize {
  width: number;
  height: number;
}

// ============================================================================
// NPC相关类型
// ============================================================================

/** NPC交互类型 */
export type NPCInteractionType = 'dialogue' | 'shop' | 'quest' | 'teleport' | 'combat';

/** 对话节点 */
export interface DialogueNode {
  id: string;
  speaker: string;
  content: string;
  choices?: DialogueChoice[];
  nextNodeId?: string;
  condition?: string;
}

/** 对话选项 */
export interface DialogueChoice {
  text: string;
  nextNodeId: string;
  condition?: string;
  reward?: Record<string, number>;
}

/** NPC数据 */
export interface NPC {
  id: string;
  name: string;
  title?: string;
  sprite: string; // emoji或sprite key
  position: Position;
  level: number;
  faction?: string;
  dialogue?: DialogueNode[];
  interactionType: NPCInteractionType;
  shopItems?: string[]; // 商品ID列表
  questId?: string; // 关联任务ID
  teleportMapId?: string; // 传送目标地图ID
  teleportPosition?: Position; // 传送目标位置
  isHostile: boolean;
  dialogueEnabled: boolean;
}

// ============================================================================
// 怪物相关类型
// ============================================================================

/** 怪物数据 */
export interface Monster {
  id: string;
  name: string;
  sprite: string; // emoji
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attack: number;
  defense: number;
  intelligence: number;
  agility: number;
  exp: number; // 击杀经验
  gold: { min: number; max: number }; // 金币掉落范围
  drops: DropItem[];
  skills: string[]; // 技能ID列表
  behavior: MonsterBehavior;
  sightRange: number; // 警戒范围
  attackRange: number; // 攻击范围
  moveSpeed: number; // 移动速度（像素/秒）
  isElite: boolean; // 精英怪
  isBoss: boolean; // Boss怪
  spawnConditions?: SpawnCondition[];
}

/** 生成条件 */
export interface SpawnCondition {
  type: 'time' | 'event' | 'quest' | 'difficulty';
  value: string | number;
  probability?: number;
}

/** 怪物刷新点 */
export interface MonsterSpawnPoint {
  id: string;
  monsterId: string;
  position: Position;
  respawnTime: number; // 秒
  maxCount: number; // 最大同时存在数量
  active: boolean;
}

/** 怪物波次 */
export interface MonsterWave {
  waveId: number;
  monsters: { monsterId: string; count: number }[];
  spawnDelay: number; // 秒
  isBossWave: boolean;
}

// ============================================================================
// 楼层相关类型（多层地图）
// ============================================================================

/** 楼层配置 */
export interface Floor {
  floorIndex: number;
  name: string;
  width: number;
  height: number;
  terrain: TerrainType[][];
  npcPositions: NPCPosition[];
  monsterSpawns: MonsterSpawnPoint[];
  connections: FloorConnection[];
}

/** NPC位置 */
export interface NPCPosition {
  npcId: string;
  position: Position;
  direction?: 'north' | 'south' | 'east' | 'west';
}

/** 楼层连接（楼梯） */
export interface FloorConnection {
  fromFloor: number;
  toFloor: number;
  fromPosition: Position;
  toPosition: Position;
  connectionType: 'stairs_up' | 'stairs_down' | 'ladder' | 'teleport';
}

// ============================================================================
// 入口/出口相关
// ============================================================================

/** 地图入口/出口 */
export interface Entry {
  id: string;
  name: string;
  position: Position;
  targetMapId: string;
  targetPosition: Position;
  entryType: 'door' | 'gate' | 'portal' | 'stairs' | 'cave_entrance' | 'transition';
  requiredLevel?: number;
  requiredQuest?: string;
  isLocked: boolean;
  unlockCondition?: string;
  isHidden: boolean;
}

/** 传送门 */
export interface Portal {
  id: string;
  name: string;
  position: Position;
  targetMapId: string;
  targetPosition: Position;
  color: string;
  isActive: boolean;
  requiredLevel?: number;
  requiredItem?: string;
}

// ============================================================================
// 地图数据结构
// ============================================================================

/** 地图对象（扩展后完整版） */
export interface GameMap {
  // 基础信息
  id: string;
  name: string;
  description: string;
  type: MAP_TYPE;
  
  // 尺寸（第一层或唯一层）
  width: number;
  height: number;
  
  // 战斗配置
  combatEnabled: boolean; // 室内=false，野外=true
  safeZone: boolean; // 安全区标记
  
  // 地形数据（单层地图）
  terrain?: TerrainType[][];
  
  // 多楼层配置
  floors?: Floor[];
  
  // 实体列表
  npcs: NPC[];
  monsters: Monster[];
  
  // 刷新点
  monsterSpawns: MonsterSpawnPoint[];
  
  // 入口/出口
  entries: Entry[];
  portals: Portal[];
  
  // 位置标记
  npcPositions: NPCPosition[];
  
  // 区域信息
  region: Region;
  
  // 元数据
  dangerLevel: DangerLevel;
  recommendedLevel: number;
  backgroundMusic?: string;
  ambientSound?: string;
  
  // 性能优化
  chunkSize: number; // 分块大小
  tileSize: number; // 瓦片尺寸
  renderDistance: number; // 渲染距离
  
  // 特殊标记
  isPvPEnabled: boolean;
  isRestAllowed: boolean; // 是否可以休息
  
  // 美术资源（由工部提供）
  tileset?: string;
  backgroundImage?: string;
  minimapStyle?: 'auto' | 'manual' | 'none';
  
  // 版本控制
  version: string;
  lastUpdated: string;
}

/** 简化版地图（用于列表展示） */
export interface MapSummary {
  id: string;
  name: string;
  type: MAP_TYPE;
  width: number;
  height: number;
  dangerLevel: DangerLevel;
  recommendedLevel: number;
  monsterCount: number;
  npcCount: number;
  thumbnail?: string;
}

// ============================================================================
// 性能优化相关
// ============================================================================

/** 视口信息 */
export interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
  tileWidth: number;
  tileHeight: number;
  scale: number;
  rotation: number;
}

/** 分块信息 */
export interface Chunk {
  chunkX: number;
  chunkY: number;
  tiles: TerrainType[][];
  entities: ChunkEntity[];
  isLoaded: boolean;
  lastAccessTime: number;
}

/** 分块实体 */
export interface ChunkEntity {
  entityType: 'npc' | 'monster' | 'item' | 'portal';
  entityId: string;
  x: number;
  y: number;
}

/** 渲染配置 */
export interface RenderConfig {
  enableCulling: boolean;
  enableChunking: boolean;
  enableLOD: boolean;
  maxVisibleTiles: number;
  updateInterval: number; // 毫秒
  cullingBuffer: number; // 视口缓冲
}

// ============================================================================
// 地图管理器状态
// ============================================================================

/** 地图加载状态 */
export type MapLoadState = 'idle' | 'loading' | 'loaded' | 'error';

/** 地图管理器状态 */
export interface MapManagerState {
  currentMapId: string | null;
  currentFloor: number;
  loadState: MapLoadState;
  error: string | null;
  loadedChunks: Set<string>;
  visibleEntities: Set<string>;
  lastUpdateTime: number;
}

// ============================================================================
// 地图注册表
// ============================================================================

/** 地图注册表 */
export interface MapRegistry {
  maps: Map<string, GameMap>;
  summaries: MapSummary[];
  getMapById(id: string): GameMap | undefined;
  getMapsByType(type: MAP_TYPE): GameMap[];
  getOutdoorMaps(): GameMap[];
  getIndoorMaps(): GameMap[];
  searchMaps(query: string): GameMap[];
}

// ============================================================================
// 常量
// ============================================================================

/** 地形emoji映射 */
export const TERRAIN_EMOJI: Record<TerrainType, string> = {
  0: '🌿',  // 草地
  1: '⬜',  // 地板/路
  2: '🧱',  // 墙壁
  3: '🌊',  // 水
  4: '🌲',  // 树木
  5: '🚪',  // 门口
  6: '👤',  // NPC
  7: '✨',  // 出口
  8: '⬆️',  // 楼梯（上）
  9: '⬇️',  // 楼梯（下）
  10: '⚠️', // 陷阱
  11: '📦', // 宝箱
  12: '🏛️', // 装饰物
  13: '🌳', // 灌木
  14: '🪨', // 岩石
  15: '🔥', // 熔岩
  16: '❄️', // 冰面
  17: '🏖️', // 沙地
  18: '💦', // 深水
  19: '🌉', // 桥梁
  20: '⚡', // 悬崖边缘
};

/** 地形背景色映射 */
export const TERRAIN_BG_COLOR: Record<TerrainType, string> = {
  0: '#2d5a27', // 草地 - 深绿
  1: '#8b7355', // 地板 - 棕色
  2: '#4a4a4a', // 墙壁 - 灰色
  3: '#1e3a5f', // 水 - 深蓝
  4: '#1a4726', // 树木 - 墨绿
  5: '#5a4a3a', // 门口 - 深棕
  6: '#8b7355', // NPC点 - 棕色
  7: '#9b59b6', // 出口 - 紫色
  8: '#a0522d', // 楼梯上 - 棕色
  9: '#a0522d', // 楼梯下 - 棕色
  10: '#ff4500', // 陷阱 - 红色
  11: '#daa520', // 宝箱 - 金色
  12: '#696969', // 装饰物 - 灰色
  13: '#228b22', // 灌木 - 绿色
  14: '#808080', // 岩石 - 灰色
  15: '#ff4500', // 熔岩 - 橙红
  16: '#b0e0e6', // 冰面 - 浅蓝
  17: '#c2b280', // 沙地 - 沙色
  18: '#006994', // 深水 - 深蓝
  19: '#8b4513', // 桥梁 - 深棕
  20: '#2f4f4f', // 悬崖边缘 - 深灰
};

/** 地形通行性 */
export const TERRAIN_PASSABLE: Record<TerrainType, boolean> = {
  0: true,  // 草地 - 可通行
  1: true,  // 地板 - 可通行
  2: false, // 墙壁 - 不可通行
  3: false, // 水 - 不可通行（游泳除外）
  4: false, // 树木 - 不可通行
  5: true,  // 门口 - 可通行
  6: true,  // NPC点 - 可通行
  7: true,  // 出口 - 可通行
  8: true,  // 楼梯 - 可通行
  9: true,  // 楼梯 - 可通行
  10: true, // 陷阱 - 可通行但有效果
  11: true, // 宝箱 - 可交互
  12: true, // 装饰物 - 可通行
  13: true, // 灌木 - 可通行（隐蔽）
  14: false, // 岩石 - 不可通行
  15: false, // 熔岩 - 不可通行
  16: true,  // 冰面 - 可通行（滑动效果）
  17: true,  // 沙地 - 可通行（减速）
  18: false, // 深水 - 不可通行（需游泳）
  19: true,  // 桥梁 - 可通行
  20: true,  // 悬崖边缘 - 可通行（危险）
};

/** 地形是否触发遇敌 */
export const TERRAIN_ENCOUNTER: Record<TerrainType, boolean> = {
  0: true,  // 草地 - 遇敌
  1: false, // 地板 - 不遇敌
  2: false, // 墙壁 - 不遇敌
  3: false, // 水 - 不遇敌
  4: false, // 树木 - 不遇敌
  5: false, // 门口 - 不遇敌
  6: false, // NPC点 - 不遇敌
  7: false, // 出口 - 不遇敌
  8: false, // 楼梯 - 不遇敌
  9: false, // 楼梯 - 不遇敌
  10: true, // 陷阱 - 可能遇敌
  11: false, // 宝箱 - 不遇敌
  12: false, // 装饰物 - 不遇敌
  13: true,  // 灌木 - 隐蔽中可能遇敌
  14: false, // 岩石 - 不遇敌
  15: false, // 熔岩 - 不遇敌
  16: false, // 冰面 - 不遇敌
  17: false, // 沙地 - 不遇敌
  18: false, // 深水 - 不遇敌
  19: false, // 桥梁 - 不遇敌
  20: true,  // 悬崖边缘 - 可能遇敌
};

export default GameMap;
