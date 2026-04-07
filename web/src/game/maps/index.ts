/**
 * Map System V2 - Entry Point
 * 尚书省任务 JJC-20260407-009
 */

export * from './map.types';
export * from './viewport-culling';
export * from './performance';

// Map exports
export { mapPingfuTown, default as mapPingfuTownDefault } from './map_pingfu_town';
export { mapBorderTavern, default as mapBorderTavernDefault } from './map_border_tavern';
export { mapNorthForest, default as mapNorthForestDefault } from './map_north_forest';
export { mapBeastCave, default as mapBeastCaveDefault } from './map_beast_cave';
export { mapYingtianCapital, default as mapYingtianCapitalDefault } from './map_yingtian_capital';

// Re-export types for convenience
import { GameMap, MapSummary, MAP_TYPE } from './map.types';
import { mapPingfuTown } from './map_pingfu_town';
import { mapBorderTavern } from './map_border_tavern';
import { mapNorthForest } from './map_north_forest';
import { mapBeastCave } from './map_beast_cave';
import { mapYingtianCapital } from './map_yingtian_capital';

/**
 * 所有已实现的地图
 */
export const ALL_MAPS: GameMap[] = [
  mapPingfuTown,
  mapBorderTavern,
  mapNorthForest,
  mapBeastCave,
  mapYingtianCapital,
];

/**
 * 地图注册表
 */
class MapRegistry {
  private maps = new Map<string, GameMap>();

  constructor() {
    // 注册所有地图
    for (const map of ALL_MAPS) {
      this.maps.set(map.id, map);
    }
  }

  /**
   * 根据ID获取地图
   */
  getMapById(id: string): GameMap | undefined {
    return this.maps.get(id);
  }

  /**
   * 获取所有地图
   */
  getAllMaps(): GameMap[] {
    return Array.from(this.maps.values());
  }

  /**
   * 按类型获取地图
   */
  getMapsByType(type: MAP_TYPE): GameMap[] {
    return Array.from(this.maps.values()).filter(m => m.type === type);
  }

  /**
   * 获取所有室内地图
   */
  getIndoorMaps(): GameMap[] {
    return this.getMapsByType('indoor');
  }

  /**
   * 获取所有室外地图
   */
  getOutdoorMaps(): GameMap[] {
    return this.getMapsByType('outdoor');
  }

  /**
   * 获取地图摘要列表
   */
  getMapSummaries(): MapSummary[] {
    return Array.from(this.maps.values()).map(map => ({
      id: map.id,
      name: map.name,
      type: map.type,
      width: map.width,
      height: map.height,
      dangerLevel: map.dangerLevel,
      recommendedLevel: map.recommendedLevel,
      monsterCount: map.monsters.length,
      npcCount: map.npcs.length,
    }));
  }

  /**
   * 搜索地图
   */
  searchMaps(query: string): GameMap[] {
    const lower = query.toLowerCase();
    return Array.from(this.maps.values()).filter(
      m => m.name.toLowerCase().includes(lower) || 
           m.description.toLowerCase().includes(lower) ||
           m.id.toLowerCase().includes(lower)
    );
  }
}

// 导出单例
export const mapRegistry = new MapRegistry();

// 默认导出
export default mapRegistry;
