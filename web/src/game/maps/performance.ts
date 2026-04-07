/**
 * Performance Optimization Utilities
 * 尚书省任务 JJC-20260407-009
 * 
 * 性能优化核心：
 * - 分块加载
 * - 懒加载
 * - 请求动画帧控制
 * - 怪物AI节流
 */

import { GameMap, RenderConfig, Viewport, Monster } from './map.types';

// ============================================================================
// 分块加载系统
// ============================================================================

/** 分块缓存 */
const chunkCache = new Map<string, ArrayBuffer>();
const MAX_CACHE_SIZE = 50; // 最大缓存分块数

/**
 * 分块数据加载器
 */
export class ChunkLoader {
  private loadedChunks = new Set<string>();
  private loadingChunks = new Set<string>();
  private chunkCallbacks = new Map<string, ((data: ArrayBuffer) => void)[]>();

  /**
   * 异步加载分块
   * @param chunkId 分块ID
   * @param loadFn 实际加载函数
   */
  async loadChunk(chunkId: string, loadFn: () => Promise<ArrayBuffer>): Promise<ArrayBuffer> {
    // 已加载
    if (this.loadedChunks.has(chunkId)) {
      const cached = chunkCache.get(chunkId);
      if (cached) return cached;
    }

    // 正在加载
    if (this.loadingChunks.has(chunkId)) {
      return new Promise((resolve) => {
        const callbacks = this.chunkCallbacks.get(chunkId) || [];
        callbacks.push(resolve);
        this.chunkCallbacks.set(chunkId, callbacks);
      });
    }

    // 开始加载
    this.loadingChunks.add(chunkId);
    
    try {
      const data = await loadFn();
      this.loadedChunks.add(chunkId);
      
      // 缓存管理
      if (chunkCache.size >= MAX_CACHE_SIZE) {
        const oldestKey = chunkCache.keys().next().value;
        if (oldestKey) chunkCache.delete(oldestKey);
      }
      chunkCache.set(chunkId, data);

      // 触发等待中的回调
      const callbacks = this.chunkCallbacks.get(chunkId) || [];
      callbacks.forEach(cb => cb(data));
      this.chunkCallbacks.delete(chunkId);

      return data;
    } finally {
      this.loadingChunks.delete(chunkId);
    }
  }

  /**
   * 预加载周围分块
   * @param currentChunkId 当前分块ID
   * @param requiredChunks 需要加载的分块列表
   * @param loadFn 加载函数
   */
  preloadAdjacentChunks(
    currentChunkId: string,
    requiredChunks: string[],
    loadFn: (id: string) => Promise<ArrayBuffer>
  ): void {
    const current = this.parseChunkId(currentChunkId);
    if (!current) return;

    for (const chunkId of requiredChunks) {
      if (!this.loadedChunks.has(chunkId) && !this.loadingChunks.has(chunkId)) {
        const parsed = this.parseChunkId(chunkId);
        if (parsed) {
          // 只预加载相邻分块（距离<=2）
          const dx = Math.abs(parsed.chunkX - current.chunkX);
          const dy = Math.abs(parsed.chunkY - current.chunkY);
          if (dx <= 2 && dy <= 2) {
            this.loadChunk(chunkId, () => loadFn(chunkId)).catch(() => {});
          }
        }
      }
    }
  }

  private parseChunkId(chunkId: string): { chunkX: number; chunkY: number } | null {
    const match = chunkId.match(/chunk_(-?\d+)_(-?\d+)/);
    if (match) {
      return { chunkX: parseInt(match[1]), chunkY: parseInt(match[2]) };
    }
    return null;
  }

  /**
   * 卸载远距离分块
   * @param currentChunkId 当前分块ID
   * @param loadedChunks 已加载分块列表
   * @param unloadDistance 卸载距离
   */
  unloadDistantChunks(
    currentChunkId: string,
    loadedChunks: string[],
    unloadDistance: number = 3
  ): string[] {
    const current = this.parseChunkId(currentChunkId);
    if (!current) return [];

    const toUnload: string[] = [];
    
    for (const chunkId of loadedChunks) {
      if (chunkId === currentChunkId) continue;
      
      const parsed = this.parseChunkId(chunkId);
      if (parsed) {
        const dx = Math.abs(parsed.chunkX - current.chunkX);
        const dy = Math.abs(parsed.chunkY - current.chunkY);
        if (dx > unloadDistance || dy > unloadDistance) {
          toUnload.push(chunkId);
          this.loadedChunks.delete(chunkId);
          chunkCache.delete(chunkId);
        }
      }
    }

    return toUnload;
  }

  /**
   * 检查分块是否已加载
   */
  isChunkLoaded(chunkId: string): boolean {
    return this.loadedChunks.has(chunkId);
  }

  /**
   * 清空所有缓存
   */
  clearCache(): void {
    this.loadedChunks.clear();
    this.loadingChunks.clear();
    chunkCache.clear();
    this.chunkCallbacks.clear();
  }
}

// ============================================================================
// 懒加载系统
// ============================================================================

/**
 * 懒加载任务队列
 */
export class LazyLoadQueue {
  private queue: (() => Promise<void>)[] = [];
  private running = false;
  private maxConcurrent = 2;

  /**
   * 添加懒加载任务
   */
  add(task: () => Promise<void>): void {
    this.queue.push(task);
    if (!this.running) {
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.running) return;
    this.running = true;

    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.maxConcurrent);
      await Promise.all(batch.map(task => task().catch(() => {})));
      
      // 批次间延迟
      await new Promise(resolve => setTimeout(resolve, 16));
    }

    this.running = false;
  }

  /**
   * 清空队列
   */
  clear(): void {
    this.queue = [];
  }
}

// ============================================================================
// 帧率控制
// ============================================================================

/** 帧率控制器 */
export class FrameRateController {
  private lastFrameTime = 0;
  private frameCount = 0;
  private fps = 0;
  private fpsUpdateTime = 0;
  private targetFPS: number;
  private frameInterval: number;

  constructor(targetFPS: number = 30) {
    this.targetFPS = targetFPS;
    this.frameInterval = 1000 / targetFPS;
  }

  /**
   * 等待下一帧
   * @returns 是否应该渲染
   */
  shouldRender(): boolean {
    const now = performance.now();
    const elapsed = now - this.lastFrameTime;

    if (elapsed >= this.frameInterval) {
      this.lastFrameTime = now - (elapsed % this.frameInterval);
      return true;
    }

    return false;
  }

  /**
   * 获取当前FPS
   */
  getFPS(): number {
    const now = performance.now();
    if (now - this.fpsUpdateTime > 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsUpdateTime = now;
    }
    this.frameCount++;
    return this.fps;
  }

  /**
   * 设置目标帧率
   */
  setTargetFPS(fps: number): void {
    this.targetFPS = fps;
    this.frameInterval = 1000 / fps;
  }
}

// ============================================================================
// 怪物AI节流
// ============================================================================

/** 怪物AI更新器 */
export class MonsterAIThrottler {
  private updateIntervals = new Map<string, number>();
  private defaultInterval: number;

  constructor(defaultInterval: number = 500) {
    this.defaultInterval = defaultInterval;
  }

  /**
   * 检查怪物是否应该更新AI
   * @param monsterId 怪物ID
   * @param customInterval 自定义间隔（毫秒）
   */
  shouldUpdate(monsterId: string, customInterval?: number): boolean {
    const interval = customInterval || this.defaultInterval;
    const lastUpdate = this.updateIntervals.get(monsterId) || 0;
    const now = performance.now();

    if (now - lastUpdate >= interval) {
      this.updateIntervals.set(monsterId, now);
      return true;
    }

    return false;
  }

  /**
   * 批量检查多个怪物
   * @param monsterIds 怪物ID列表
   * @param interval 间隔
   */
  filterMonstersToUpdate(monsterIds: string[], interval?: number): string[] {
    return monsterIds.filter(id => this.shouldUpdate(id, interval));
  }

  /**
   * 设置默认更新间隔
   */
  setDefaultInterval(interval: number): void {
    this.defaultInterval = interval;
  }

  /**
   * 清空记录
   */
  reset(): void {
    this.updateIntervals.clear();
  }
}

// ============================================================================
// 渲染配置管理
// ============================================================================

/** 默认渲染配置 */
export const DEFAULT_RENDER_CONFIG: RenderConfig = {
  enableCulling: true,
  enableChunking: true,
  enableLOD: true,
  maxVisibleTiles: 10000,
  updateInterval: 100,
  cullingBuffer: 1,
};

/**
 * 自适应渲染配置
 * 根据设备性能自动调整配置
 */
export function getAdaptiveRenderConfig(
  mapSize: { width: number; height: number },
  devicePixelRatio: number = 1
): RenderConfig {
  const totalTiles = mapSize.width * mapSize.height;
  
  // 大地图启用更多优化
  if (totalTiles > 100000) {
    return {
      enableCulling: true,
      enableChunking: true,
      enableLOD: true,
      maxVisibleTiles: 5000,
      updateInterval: 150,
      cullingBuffer: 1,
    };
  }

  // 中等地图
  if (totalTiles > 10000) {
    return {
      enableCulling: true,
      enableChunking: true,
      enableLOD: true,
      maxVisibleTiles: 8000,
      updateInterval: 100,
      cullingBuffer: 1,
    };
  }

  // 小地图
  return {
    enableCulling: false,
    enableChunking: false,
    enableLOD: false,
    maxVisibleTiles: totalTiles,
    updateInterval: 50,
    cullingBuffer: 0,
  };
}

// ============================================================================
// 内存管理
// ============================================================================

/**
 * 内存监控
 */
export class MemoryMonitor {
  private static instance: MemoryMonitor;
  private samples: number[] = [];
  private maxSamples = 60;

  static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor();
    }
    return MemoryMonitor.instance;
  }

  /**
   * 记录内存使用
   */
  record(): number {
    // @ts-ignore
    if (performance.memory) {
      // @ts-ignore
      const used = performance.memory.usedJSHeapSize / (1024 * 1024);
      this.samples.push(used);
      if (this.samples.length > this.maxSamples) {
        this.samples.shift();
      }
      return used;
    }
    return 0;
  }

  /**
   * 获取平均内存使用
   */
  getAverage(): number {
    if (this.samples.length === 0) return 0;
    return this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
  }

  /**
   * 获取峰值内存使用
   */
  getPeak(): number {
    return Math.max(...this.samples, 0);
  }

  /**
   * 检查是否内存不足
   */
  isMemoryLow(threshold: number = 100): boolean {
    const avg = this.getAverage();
    return avg > threshold;
  }
}

// ============================================================================
// 性能统计
// ============================================================================

/** 性能统计收集器 */
export class PerformanceStats {
  private stats = {
    frameTime: 0,
    renderTime: 0,
    updateTime: 0,
    totalEntities: 0,
    visibleEntities: 0,
    culledTiles: 0,
    chunksLoaded: 0,
    memoryMB: 0,
  };

  private frameTimes: number[] = [];
  private maxFrameTimeSamples = 60;

  /**
   * 记录帧时间
   */
  recordFrame(frameTime: number): void {
    this.stats.frameTime = frameTime;
    this.frameTimes.push(frameTime);
    if (this.frameTimes.length > this.maxFrameTimeSamples) {
      this.frameTimes.shift();
    }
  }

  /**
   * 记录渲染时间
   */
  recordRender(renderTime: number): void {
    this.stats.renderTime = renderTime;
  }

  /**
   * 记录更新时间
   */
  recordUpdate(updateTime: number): void {
    this.stats.updateTime = updateTime;
  }

  /**
   * 设置实体统计
   */
  setEntityStats(total: number, visible: number): void {
    this.stats.totalEntities = total;
    this.stats.visibleEntities = visible;
  }

  /**
   * 设置剔除统计
   */
  setCullingStats(culled: number): void {
    this.stats.culledTiles = culled;
  }

  /**
   * 设置分块统计
   */
  setChunkStats(loaded: number): void {
    this.stats.chunksLoaded = loaded;
  }

  /**
   * 获取平均帧时间
   */
  getAverageFrameTime(): number {
    if (this.frameTimes.length === 0) return 0;
    return this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
  }

  /**
   * 获取FPS
   */
  getFPS(): number {
    const avg = this.getAverageFrameTime();
    return avg > 0 ? 1000 / avg : 0;
  }

  /**
   * 获取所有统计
   */
  getStats() {
    return {
      ...this.stats,
      fps: this.getFPS(),
      avgFrameTime: this.getAverageFrameTime(),
    };
  }

  /**
   * 重置统计
   */
  reset(): void {
    this.frameTimes = [];
    this.stats = {
      frameTime: 0,
      renderTime: 0,
      updateTime: 0,
      totalEntities: 0,
      visibleEntities: 0,
      culledTiles: 0,
      chunksLoaded: 0,
      memoryMB: 0,
    };
  }
}

// ============================================================================
// 导出
// ============================================================================

export const chunkLoader = new ChunkLoader();
export const lazyLoadQueue = new LazyLoadQueue();
export const frameRateController = new FrameRateController(30);
export const monsterAIThrottler = new MonsterAIThrottler();
export const performanceStats = new PerformanceStats();
export const memoryMonitor = MemoryMonitor.getInstance();
