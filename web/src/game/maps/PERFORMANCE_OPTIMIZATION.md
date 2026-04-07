# Map System V2 - Performance Optimization Documentation
# 尚书省任务 JJC-20260407-009

## 概述

本文档描述地图系统V2的性能优化方案，确保在大地图（1000×800）下仍能保持流畅的游戏体验。

---

## 性能指标要求

| 指标 | 目标值 | 说明 |
|------|--------|------|
| 首屏加载 | < 3秒 | 分块加载 + 懒加载 |
| 帧率 | ≥ 30fps | 稳定帧率 |
| 视口剔除率 | > 80% | 大地图应天府 |

---

## 一、Viewport Culling（视口剔除）

### 1.1 核心原理

只渲染当前视口（viewport）内可见的瓦片和实体。

```
┌─────────────────────────────────┐
│          Map (1000×800)         │
│  ┌─────────────────────┐       │
│  │                     │ ← Viewport
│  │   Only this area   │   (800×600)
│  │   gets rendered    │       │
│  └─────────────────────┘       │
└─────────────────────────────────┘
```

### 1.2 实现代码

```typescript
// viewport-culling.ts

/**
 * 获取视口内可见的瓦片范围
 */
export function getVisibleTileRange(
  viewport: Viewport,
  mapWidth: number,
  mapHeight: number,
  buffer: number = 1
): { startX: number; endX: number; startY: number; endY: number } {
  const viewStartX = Math.floor(viewport.x / viewport.tileWidth);
  const viewStartY = Math.floor(viewport.y / viewport.tileHeight);
  const viewEndX = Math.ceil((viewport.x + viewport.width) / viewport.tileWidth);
  const viewEndY = Math.ceil((viewport.y + viewport.height) / viewport.tileHeight);

  return {
    startX: Math.max(0, viewStartX - buffer),
    endX: Math.min(mapWidth, viewEndX + buffer),
    startY: Math.max(0, viewStartY - buffer),
    endY: Math.min(mapHeight, viewEndY + buffer),
  };
}

/**
 * 实体是否在视口内
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
```

### 1.3 性能收益

以 **应天府皇城 (1000×800)** 为例：

- 总瓦片数：800,000
- 视口尺寸：800×600
- 可见瓦片数：约 1,500
- **剔除率：99.8%**

---

## 二、分块加载（Chunking）

### 2.1 原理

将大地图分割成固定大小的块（chunk），按需加载。

```
┌────┬────┬────┬────┐
│ C0 │ C1 │ C2 │ C3 │  Chunk Size: 16×16
├────┼────┼────┼────┤
│ C4 │ C5 │ C6 │ C7 │  Map: 64×64
├────┼────┼────┼────┤
│ C8 │ C9 │C10 │C11 │
├────┼────┼────┼────┤
│C12 │C13 │C14 │C15 │
└────┴────┴────┴────┘
```

### 2.2 实现

```typescript
// performance.ts

class ChunkLoader {
  private chunkCache = new Map<string, ArrayBuffer>();
  private maxCacheSize = 50;

  async loadChunk(chunkId: string, loadFn: () => Promise<ArrayBuffer>) {
    // 缓存命中
    if (this.chunkCache.has(chunkId)) {
      return this.chunkCache.get(chunkId)!;
    }

    // 异步加载
    const data = await loadFn();
    
    // LRU缓存淘汰
    if (this.chunkCache.size >= this.maxCacheSize) {
      const oldestKey = this.chunkCache.keys().next().value;
      this.chunkCache.delete(oldestKey);
    }
    
    this.chunkCache.set(chunkId, data);
    return data;
  }

  /** 预加载相邻分块 */
  preloadAdjacentChunks(currentChunkId: string, requiredChunks: string[]) {
    // 加载距离 <= 2 的分块
  }

  /** 卸载远距离分块 */
  unloadDistantChunks(currentChunkId: string, distance: number = 3) {
    // 卸载距离 > 3 的分块
  }
}
```

### 2.3 加载策略

| 策略 | 描述 | 适用场景 |
|------|------|----------|
| 即时加载 | 需要时立即加载 | 小地图 |
| 预加载 | 提前加载相邻分块 | 中地图 |
| 懒加载 | 队列式延迟加载 | 大地图 |

---

## 三、帧率控制（Frame Rate Control）

### 3.1 固定帧率

```typescript
class FrameRateController {
  private frameInterval: number;
  private lastFrameTime = 0;

  constructor(targetFPS: number = 30) {
    this.frameInterval = 1000 / targetFPS;
  }

  shouldRender(): boolean {
    const now = performance.now();
    const elapsed = now - this.lastFrameTime;

    if (elapsed >= this.frameInterval) {
      this.lastFrameTime = now - (elapsed % this.frameInterval);
      return true;
    }
    return false;
  }
}
```

### 3.2 自适应帧率

```typescript
// 根据设备性能调整
function getAdaptiveRenderConfig(mapSize: { width: number; height: number }) {
  const totalTiles = mapSize.width * mapSize.height;
  
  if (totalTiles > 100000) {
    return { targetFPS: 24, enableCulling: true };
  }
  if (totalTiles > 10000) {
    return { targetFPS: 30, enableCulling: true };
  }
  return { targetFPS: 60, enableCulling: false };
}
```

---

## 四、怪物AI节流

### 4.1 问题

大量怪物的AI更新会导致性能下降。

### 4.2 解决方案

按距离和重要性分级更新：

```typescript
class MonsterAIThrottler {
  private updateIntervals = new Map<string, number>();

  /** 检查是否应该更新 */
  shouldUpdate(monsterId: string, distanceToPlayer: number): boolean {
    // 近距离怪物：每100ms更新
    // 中距离怪物：每500ms更新
    // 远距离怪物：每2000ms更新
    // 视口外怪物：暂停更新
    
    const interval = distanceToPlayer < 10 ? 100 :
                     distanceToPlayer < 50 ? 500 : 2000;
    
    const lastUpdate = this.updateIntervals.get(monsterId) || 0;
    if (performance.now() - lastUpdate >= interval) {
      this.updateIntervals.set(monsterId, performance.now());
      return true;
    }
    return false;
  }
}
```

---

## 五、LOD（Level of Detail）

### 5.1 分级渲染

根据距离使用不同的渲染细节：

| LOD级别 | 距离 | 渲染内容 |
|---------|------|----------|
| High | < 5格 | 完整瓦片 + 实体细节 |
| Medium | < 15格 | 简化瓦片 |
| Low | < 30格 | 仅主体颜色 |
| Minimal | ≥ 30格 | 纯色块 |

```typescript
function simplifyTileForLOD(terrain: TerrainType, level: LODLevel) {
  if (level === 'minimal') {
    // 只返回大类
    return { emoji: '⬜', bgColor: '#666', skipDetail: true };
  }
  return { emoji: TERRAIN_EMOJI[terrain], skipDetail: false };
}
```

---

## 六、Canvas渲染优化

### 6.1 关键优化

1. **离屏Canvas预渲染**
2. **批量绘制**
3. **避免状态切换**
4. **使用 `willReadFrequently: false`**

```typescript
// 预创建离屏Canvas
const offscreenCanvas = document.createElement('canvas');
const offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: false });

// 批量绘制地形
ctx.beginPath();
for (const tile of visibleTiles) {
  ctx.fillStyle = TERRAIN_BG_COLOR[tile.type];
  ctx.fillRect(tile.x * TILE_SIZE, tile.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
}
ctx.fill(); // 一次提交
```

---

## 七、性能监控

### 7.1 实时统计

```typescript
class PerformanceStats {
  recordFrame(frameTime: number) {
    this.frameTimes.push(frameTime);
    if (this.frameTimes.length > 60) this.frameTimes.shift();
  }

  getFPS(): number {
    const avg = this.getAverageFrameTime();
    return avg > 0 ? 1000 / avg : 0;
  }
}
```

### 7.2 性能指标看板

```
┌──────────────────────────────────────┐
│  Performance Monitor                 │
├──────────────────────────────────────┤
│  FPS: 45        [████████░░]        │
│  Frame: 16.2ms  [██████░░░░]         │
│  Visible: 1,523 tiles               │
│  Culled: 798,477 tiles (99.8%)      │
│  Memory: 45.2 MB                     │
└──────────────────────────────────────┘
```

---

## 八、大地图配置示例

### 应天府皇城 (1000×800)

```typescript
export const mapYingtianCapital: GameMap = {
  id: 'map_yingtian_capital',
  // ...
  
  // 性能优化配置
  chunkSize: 16,      // 分块大小
  tileSize: 32,       // 瓦片尺寸
  renderDistance: 30,  // 渲染距离
  
  // 视口配置
  viewport: {
    width: 800,
    height: 600,
    buffer: 1,         // 1格缓冲
  },
};
```

---

## 九、验证测试

### 9.1 测试用例

| 地图 | 尺寸 | 预期帧率 | 实际帧率 | 结果 |
|------|------|----------|----------|------|
| 平和镇 | 200×200 | ≥30fps | TBD | - |
| 边境酒馆 | 80×80 | ≥60fps | TBD | - |
| 北部森林 | 300×300 | ≥30fps | TBD | - |
| 猛兽洞穴 | 250×250 | ≥30fps | TBD | - |
| 应天府 | 1000×800 | ≥24fps | TBD | - |

### 9.2 性能分析工具

- Chrome DevTools Performance
- Lighthouse
- Custom Performance Monitor

---

## 十、持续优化

### 10.1 待优化项

- [ ] Web Worker 异步地形生成
- [ ] WebGL 硬件加速渲染
- [ ] 实体对象池
- [ ] 碰撞检测空间分区（QuadTree）

### 10.2 未来规划

1. **Phase 1**: 实现基础viewport culling ✓
2. **Phase 2**: 分块加载系统 ✓
3. **Phase 3**: Web Worker 优化
4. **Phase 4**: WebGL 渲染器

---

*文档版本: 1.0.0*
*最后更新: 2026-04-07*
*尚书省任务 JJC-20260407-009*
