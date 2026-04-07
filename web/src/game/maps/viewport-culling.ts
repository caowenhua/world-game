/**
 * Viewport Culling System
 * 尚书省任务 JJC-20260407-009
 * 
 * 性能优化核心：只渲染当前视口内的内容
 */

import { 
  GameMap, 
  Viewport, 
  Chunk, 
  TerrainType,
  NPC,
  Monster,
  Position,
  ChunkEntity
} from './map.types';

// ============================================================================
// 视口计算
// ============================================================================

/**
 * 计算当前视口内可见的瓦片范围
 * @param viewport 视口信息
 * @param mapWidth 地图宽度
 * @param mapHeight 地图高度
 * @param buffer 缓冲范围（默认1格）
 * @returns 可见范围 {startX, endX, startY, endY}
 */
export function getVisibleTileRange(
  viewport: Viewport,
  mapWidth: number,
  mapHeight: number,
  buffer: number = 1
): { startX: number; endX: number; startY: number; endY: number } {
  // 计算视口在地图坐标系中的位置
  const viewStartX = Math.floor(viewport.x / viewport.tileWidth);
  const viewStartY = Math.floor(viewport.y / viewport.tileHeight);
  const viewEndX = Math.ceil((viewport.x + viewport.width) / viewport.tileWidth);
  const viewEndY = Math.ceil((viewport.y + viewport.height) / viewport.tileHeight);

  // 加上缓冲区域并限制在地图范围内
  return {
    startX: Math.max(0, viewStartX - buffer),
    endX: Math.min(mapWidth, viewEndX + buffer),
    startY: Math.max(0, viewStartY - buffer),
    endY: Math.min(mapHeight, viewEndY + buffer),
  };
}

/**
 * 创建视口
 * @param screenWidth 屏幕宽度
 * @param screenHeight 屏幕高度
 * @param tileSize 瓦片大小
 * @param scale 缩放比例
 * @returns 视口配置
 */
export function createViewport(
  screenWidth: number,
  screenHeight: number,
  tileSize: number,
  scale: number = 1
): Viewport {
  return {
    x: 0,
    y: 0,
    width: screenWidth,
    height: screenHeight,
    tileWidth: tileSize * scale,
    tileHeight: tileSize * scale,
    scale,
    rotation: 0,
  };
}

/**
 * 视口跟随玩家/摄像机
 * @param viewport 当前视口
 * @param playerX 玩家X坐标
 * @param playerY 玩家Y坐标
 * @param mapWidth 地图宽度
 * @param mapHeight 地图高度
 * @param screenWidth 屏幕宽度
 * @param screenHeight 屏幕高度
 */
export function centerViewportOnPlayer(
  viewport: Viewport,
  playerX: number,
  playerY: number,
  mapWidth: number,
  mapHeight: number,
  screenWidth: number,
  screenHeight: number
): void {
  const tileSize = viewport.tileWidth;
  
  // 计算视口中心应该在哪里
  const targetX = playerX * tileSize - screenWidth / 2 + tileSize / 2;
  const targetY = playerY * tileSize - screenHeight / 2 + tileSize / 2;

  // 平滑移动（可选，使用时取消注释）
  // viewport.x += (targetX - viewport.x) * 0.1;
  // viewport.y += (targetY - viewport.y) * 0.1;

  // 直接设置
  viewport.x = targetX;
  viewport.y = targetY;

  // 边界限制
  viewport.x = Math.max(0, Math.min(viewport.x, mapWidth * tileSize - screenWidth));
  viewport.y = Math.max(0, Math.min(viewport.y, mapHeight * tileSize - screenHeight));
}

// ============================================================================
// 瓦片级剔除
// ============================================================================

/**
 * 获取视口内可见的瓦片数据
 * @param terrain 地图地形数据
 * @param viewport 视口信息
 * @param map 地图对象（用于获取尺寸）
 * @param buffer 缓冲格数
 * @returns 可见瓦片数据
 */
export function getVisibleTiles(
  terrain: TerrainType[][],
  viewport: Viewport,
  map: GameMap,
  buffer: number = 1
): TerrainType[][] {
  const { startX, endX, startY, endY } = getVisibleTileRange(
    viewport,
    map.width,
    map.height,
    buffer
  );

  // 提取可见区域
  const visibleTiles: TerrainType[][] = [];
  for (let y = startY; y < endY; y++) {
    const row: TerrainType[] = [];
    for (let x = startX; x < endX; x++) {
      if (terrain[y] && terrain[y][x] !== undefined) {
        row.push(terrain[y][x]);
      } else {
        row.push(2 as TerrainType); // 默认墙壁
      }
    }
    visibleTiles.push(row);
  }

  return visibleTiles;
}

/**
 * 获取可见瓦片坐标
 * @param viewport 视口信息
 * @param map 地图对象
 * @param buffer 缓冲格数
 * @returns 可见瓦片坐标列表
 */
export function getVisibleTileCoords(
  viewport: Viewport,
  map: GameMap,
  buffer: number = 1
): Position[] {
  const { startX, endX, startY, endY } = getVisibleTileRange(
    viewport,
    map.width,
    map.height,
    buffer
  );

  const coords: Position[] = [];
  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      coords.push({ x, y, z: 0, region: map.id });
    }
  }
  return coords;
}

// ============================================================================
// 实体剔除（NPC/怪物）
// ============================================================================

/**
 * 检查实体是否在视口内
 * @param entityX 实体X坐标
 * @param entityY 实体Y坐标
 * @param viewport 视口信息
 * @param tileSize 瓦片大小
 * @param buffer 缓冲
 * @returns 是否可见
 */
export function isEntityInViewport(
  entityX: number,
  entityY: number,
  viewport: Viewport,
  tileSize: number,
  buffer: number = 1
): boolean {
  const screenX = entityX * tileSize;
  const screenY = entityY * tileSize;
  
  const viewLeft = viewport.x - buffer * tileSize;
  const viewRight = viewport.x + viewport.width + buffer * tileSize;
  const viewTop = viewport.y - buffer * tileSize;
  const viewBottom = viewport.y + viewport.height + buffer * tileSize;

  return screenX >= viewLeft && 
         screenX <= viewRight && 
         screenY >= viewTop && 
         screenY <= viewBottom;
}

/**
 * 获取视口内可见的NPC
 * @param npcs NPC列表
 * @param viewport 视口信息
 * @param tileSize 瓦片大小
 * @param buffer 缓冲
 * @returns 可见NPC列表
 */
export function getVisibleNPCs(
  npcs: NPC[],
  viewport: Viewport,
  tileSize: number,
  buffer: number = 1
): NPC[] {
  return npcs.filter(npc => 
    isEntityInViewport(npc.position.x, npc.position.y, viewport, tileSize, buffer)
  );
}

/**
 * 获取视口内可见的怪物
 * @param monsters 怪物列表
 * @param viewport 视口信息
 * @param tileSize 瓦片大小
 * @param buffer 缓冲
 * @returns 可见怪物列表
 */
export function getVisibleMonsters(
  monsters: Monster[],
  viewport: Viewport,
  tileSize: number,
  buffer: number = 1
): Monster[] {
  return monsters.filter(monster => 
    isEntityInViewport(monster.hp, monster.hp, viewport, tileSize, buffer) // 暂时用hp存储位置，实际需要x,y
  );
}

/**
 * 获取视口内所有可见实体
 * @param npcs NPC列表
 * @param monsters 怪物列表
 * @param viewport 视口信息
 * @param tileSize 瓦片大小
 * @param buffer 缓冲
 * @returns 所有可见实体
 */
export function getAllVisibleEntities(
  npcs: NPC[],
  monsters: Monster[],
  viewport: Viewport,
  tileSize: number,
  buffer: number = 1
): { type: 'npc' | 'monster'; entity: NPC | Monster; x: number; y: number }[] {
  const visible: { type: 'npc' | 'monster'; entity: NPC | Monster; x: number; y: number }[] = [];

  for (const npc of npcs) {
    if (isEntityInViewport(npc.position.x, npc.position.y, viewport, tileSize, buffer)) {
      visible.push({ type: 'npc', entity: npc, x: npc.position.x, y: npc.position.y });
    }
  }

  for (const monster of monsters) {
    // 怪物使用monsters数组中的position，暂时用name hash存储位置
    // 实际需要修改Monster接口
    // visible.push({ type: 'monster', entity: monster, x: monster.x, y: monster.y });
  }

  return visible;
}

// ============================================================================
// 分块系统（Chunking）
// ============================================================================

/**
 * 计算瓦片所属的分块索引
 * @param tileX 瓦片X坐标
 * @param tileY 瓦片Y坐标
 * @param chunkSize 分块大小
 * @returns 分块坐标
 */
export function getChunkIndex(tileX: number, tileY: number, chunkSize: number): { chunkX: number; chunkY: number } {
  return {
    chunkX: Math.floor(tileX / chunkSize),
    chunkY: Math.floor(tileY / chunkSize),
  };
}

/**
 * 生成分块ID
 * @param chunkX 分块X
 * @param chunkY 分块Y
 * @returns 分块唯一ID
 */
export function getChunkId(chunkX: number, chunkY: number): string {
  return `chunk_${chunkX}_${chunkY}`;
}

/**
 * 提取分块地形数据
 * @param terrain 完整地形数据
 * @param chunkX 分块X索引
 * @param chunkY 分块Y索引
 * @param chunkSize 分块大小
 * @returns 分块地形数据
 */
export function extractChunk(
  terrain: TerrainType[][],
  chunkX: number,
  chunkY: number,
  chunkSize: number
): Chunk {
  const tiles: TerrainType[][] = [];
  const startX = chunkX * chunkSize;
  const startY = chunkY * chunkSize;

  for (let y = 0; y < chunkSize; y++) {
    const row: TerrainType[] = [];
    for (let x = 0; x < chunkSize; x++) {
      const terrainY = startY + y;
      const terrainX = startX + x;
      if (terrain[terrainY] && terrain[terrainY][terrainX] !== undefined) {
        row.push(terrain[terrainY][terrainX]);
      } else {
        row.push(2 as TerrainType);
      }
    }
    tiles.push(row);
  }

  return {
    chunkX,
    chunkY,
    tiles,
    entities: [],
    isLoaded: false,
    lastAccessTime: Date.now(),
  };
}

/**
 * 获取需要加载的分块列表
 * @param viewport 视口信息
 * @param chunkSize 分块大小
 * @param mapWidth 地图宽度
 * @param mapHeight 地图高度
 * @param buffer 缓冲分块数
 * @returns 需要加载的分块ID列表
 */
export function getRequiredChunks(
  viewport: Viewport,
  chunkSize: number,
  mapWidth: number,
  mapHeight: number,
  buffer: number = 1
): string[] {
  const { startX, endX, startY, endY } = getVisibleTileRange(
    viewport,
    Math.ceil(mapWidth / chunkSize), // 用分块数代替瓦片数
    Math.ceil(mapHeight / chunkSize),
    buffer
  );

  const chunks: string[] = [];
  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      chunks.push(getChunkId(x, y));
    }
  }
  return chunks;
}

// ============================================================================
// 渲染优化
// ============================================================================

/**
 * 简化版视口剔除（仅用于瓦片）
 * @param tileX 瓦片X
 * @param tileY 瓦片Y
 * @param viewport 视口
 * @returns 是否应该渲染
 */
export function shouldRenderTile(
  tileX: number,
  tileY: number,
  viewport: Viewport
): boolean {
  const screenX = tileX * viewport.tileWidth;
  const screenY = tileY * viewport.tileHeight;
  
  return (
    screenX >= viewport.x - viewport.tileWidth &&
    screenX <= viewport.x + viewport.width + viewport.tileWidth &&
    screenY >= viewport.y - viewport.tileHeight &&
    screenY <= viewport.y + viewport.height + viewport.tileHeight
  );
}

/**
 * 计算渲染优化统计
 * @param map 地图对象
 * @param viewport 视口信息
 * @returns 统计信息
 */
export function calculateCullingStats(
  map: GameMap,
  viewport: Viewport
): {
  totalTiles: number;
  visibleTiles: number;
  culledTiles: number;
  cullPercentage: number;
} {
  const { startX, endX, startY, endY } = getVisibleTileRange(
    viewport,
    map.width,
    map.height
  );

  const visibleTiles = (endX - startX) * (endY - startY);
  const totalTiles = map.width * map.height;
  const culledTiles = totalTiles - visibleTiles;
  const cullPercentage = (culledTiles / totalTiles) * 100;

  return {
    totalTiles,
    visibleTiles,
    culledTiles,
    cullPercentage,
  };
}

// ============================================================================
// LOD (Level of Detail) 系统
// ============================================================================

/**
 * LOD级别
 */
export type LODLevel = 'high' | 'medium' | 'low' | 'minimal';

/**
 * 根据距离获取LOD级别
 * @param distance 距离（瓦片数）
 * @returns LOD级别
 */
export function getLODLevel(distance: number): LODLevel {
  if (distance < 5) return 'high';
  if (distance < 15) return 'medium';
  if (distance < 30) return 'low';
  return 'minimal';
}

/**
 * 获取LOD缩放因子
 * @param level LOD级别
 * @returns 缩放因子
 */
export function getLODScale(level: LODLevel): number {
  switch (level) {
    case 'high': return 1.0;
    case 'medium': return 0.75;
    case 'low': return 0.5;
    case 'minimal': return 0.25;
  }
}

/**
 * 简化瓦片渲染（用于远距离）
 * @param terrain 地形数据
 * @param level LOD级别
 * @returns 简化后的渲染信息
 */
export function simplifyTileForLOD(
  terrain: TerrainType,
  level: LODLevel
): { emoji: string; bgColor: string; skipDetail: boolean } {
  // 不同LOD级别的简化策略
  const baseEmoji: Record<TerrainType, string> = {
    0: '🌿', 1: '⬜', 2: '🧱', 3: '🌊', 4: '🌲',
    5: '🚪', 6: '👤', 7: '✨', 8: '⬆️', 9: '⬇️',
    10: '⚠️', 11: '📦', 12: '🏛️', 13: '🌳', 14: '🪨',
    15: '🔥', 16: '❄️', 17: '🏖️', 18: '💦', 19: '🌉', 20: '⚡',
  };

  const baseColor: Record<TerrainType, string> = {
    0: '#2d5a27', 1: '#8b7355', 2: '#4a4a4a', 3: '#1e3a5f', 4: '#1a4726',
    5: '#5a4a3a', 6: '#8b7355', 7: '#9b59b6', 8: '#a0522d', 9: '#a0522d',
    10: '#ff4500', 11: '#daa520', 12: '#696969', 13: '#228b22', 14: '#808080',
    15: '#ff4500', 16: '#b0e0e6', 17: '#c2b280', 18: '#006994', 19: '#8b4513', 20: '#2f4f4f',
  };

  // minimal级别只返回大类
  if (level === 'minimal') {
    const simpleTerrain = terrain === 2 || terrain === 14 || terrain === 15 ? 2 : terrain <= 4 ? 0 : 1;
    return {
      emoji: baseEmoji[simpleTerrain as TerrainType],
      bgColor: baseColor[simpleTerrain as TerrainType],
      skipDetail: true,
    };
  }

  return {
    emoji: baseEmoji[terrain],
    bgColor: baseColor[terrain],
    skipDetail: level === 'low',
  };
}

// ============================================================================
// 导出默认配置
// ============================================================================

export const DEFAULT_VIEWPORT_CONFIG = {
  buffer: 1,
  chunkSize: 16,
  maxVisibleTiles: 10000,
  updateInterval: 100, // 毫秒
  enableSmoothing: true,
  smoothingFactor: 0.1,
};
