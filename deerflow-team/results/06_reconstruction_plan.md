# 重构执行计划 - 羊蹄山之魂 RPG 游戏

**任务ID**: JJC-20260405-006
**计划版本**: v1.0
**日期**: 2026-04-05

---

## 一、DeerFlow Agent 协作计划

### 1.1 已注册的 Agent 清单

| Agent ID | 角色 | 职责 | 状态 |
|----------|------|------|------|
| game-pm | 产品经理 | 游戏产品需求、优先级、玩法设计 | 待调用 |
| game-designer | 设计师 | UI/UX设计、像素风美术规范 | 待调用 |
| game-engineer | 程序员 | 游戏功能实现、战斗系统、卡牌系统 | 待调用 |
| game-qa | 测试工程师 | 测试用例、Bug追踪、游戏可玩性验证 | 待调用 |
| game-manager | 项目经理 | 协调团队、进度管理、质量把控 | 待调用 |

### 1.2 各阶段 Agent 任务分配

#### 阶段1: 调研与规划 (已完成)
- **game-manager**: 制定详细重构计划 ✅ 调研报告已生成
- **game-pm**: 输出产品改进方案 → 输出到 `01_product_design.md`
- **game-designer**: 设计UI规范 → 输出到 `02_ui_design.md`

#### 阶段2: P0 - UI/地图视觉重构
**目标**: 解决皇上最痛恨的 UI丑、地图丑 问题

- **game-designer**: 设计像素风美术规范
  - 调色板定义 (16色/32色)
  - 精灵尺寸规范 (16x16, 32x32)
  - UI组件设计
  
- **game-engineer**: 执行代码重构
  - 重写 GameUI.tsx (448行 → 组件化)
  - 重写 RPGMap.tsx (Canvas → 像素精灵渲染)
  - 新增像素风格组件库

#### 阶段3: P1 - 反省轮次逻辑修复
**目标**: 修复 deck 轮次逻辑，添加回忆界面

- **game-engineer**: 
  - 修复 internal/deck/engine.go 轮次计数
  - 添加 MemoryPanel.tsx 回忆界面
  - 统一前后端轮次同步

#### 阶段4: P2 - 代码架构优化
**目标**: 提升代码可维护性

- **game-engineer**:
  - 拆分 service.go (1040行 → 微服务)
  - 抽象公共组件
  - 添加 TypeScript 类型强化

#### 阶段5: P3 - 测试完善
**目标**: 保障代码质量

- **game-qa**:
  - 编写 deck engine 单元测试
  - 编写 UI 组件测试
  - 编写集成测试

---

## 二、详细文件变更清单

### 2.1 新增文件

```
web/src/components/pixel/                    # 像素风格组件库 (新增)
web/src/components/pixel/PixelCard.tsx      # 像素风卡牌组件
web/src/components/pixel/PixelButton.tsx    # 像素风按钮
web/src/components/pixel/PixelProgressBar.tsx # 像素风进度条
web/src/components/pixel/PixelPanel.tsx     # 像素风面板
web/src/components/pixel/PixelDialog.tsx     # 像素风对话框

web/src/assets/sprites/                      # 像素精灵图 (新增)
web/src/assets/sprites/player/                # 玩家角色精灵
web/src/assets/sprites/tileset/              # 地形瓦片集
web/src/assets/sprites/npc/                  # NPC精灵
web/src/assets/sprites/items/                # 物品精灵
web/src/assets/sprites/effects/              # 特效精灵

web/src/components/MemoryPanel.tsx           # 反省/回忆界面 (新增)
web/src/components/ImprovedMap.tsx            # 改进的地图组件 (新增)

tests/                                       # 测试目录 (新增)
tests/game.test.ts                           # 游戏逻辑测试
tests/deck.test.ts                           # 卡牌引擎测试
tests/components.test.tsx                    # UI组件测试

internal/game/deck.go                       # 从 engine.go 拆分
internal/game/events.go                      # 事件系统
```

### 2.2 修改文件

| 文件 | 变更说明 | 优先级 |
|------|----------|--------|
| `web/src/components/GameUI.tsx` | UI全面重构，像素风格 | P0 |
| `web/src/components/RPGMap.tsx` | 地图渲染重构，像素精灵 | P0 |
| `web/src/components/DialogueBox.tsx` | 添加像素风样式 | P1 |
| `internal/deck/engine.go` | 修复轮次逻辑 | P1 |
| `internal/game/service.go` | 架构拆分 | P2 |
| `web/src/lib/store.ts` | 状态管理优化 | P2 |
| `web/src/types/index.ts` | 补充类型定义 | P2 |
| `web/package.json` | 添加测试依赖 | P3 |
| `web/tailwind.config.js` | 添加像素色板 | P0 |

### 2.3 删除文件

```
web/src/components/ImprovedRPG.tsx  # 旧版综合组件，可删除
```

---

## 三、技术方案概要

### 3.1 像素风 UI 方案

**调色板** (16色经典像素风):
```javascript
const PALETTE = {
  // 主色
  black: '#1a1c2c',
  darkBlue: '#333c57',
  purple: '#693441',
  green: '#3e7949',
  brown: '#a06553',
  darkGray: '#566c86',
  lightGray: '#94b0c2',
  white: '#f4f4f4',
  // 强调色
  red: '#b13e53',
  orange: '#ef7d57',
  yellow: '#ffcd75',
  lime: '#a7f070',
  cyan: '#38b764',
  sky: '#257179',
  blue: '#3978a8',
  lavender: '#6abe30',
};
```

**组件规范**:
- 所有组件使用 `pixel:` 前缀的 Tailwind 变体
- 边框使用 1px 实线，模拟像素感
- 字体使用等宽字体 (如 `font-mono`)
- 添加 `image-rendering: pixelated` 保证像素清晰

### 3.2 地图渲染方案

**精灵规格**:
- 地形瓦片: 32x32 PNG
- 玩家角色: 32x32 4方向精灵表
- NPC: 32x32 静止/说话动画

**渲染管线**:
```
1. 加载瓦片集纹理
2. 计算可视区域 (camera culling)
3. 按层绘制: 地面 → 物体 → 玩家 → UI
4. 添加环境效果: 雾、粒子、光照
```

### 3.3 轮次逻辑修复

**当前问题**:
- `CycleCount` 在 Draw() 内部递增，但前端可能未同步

**修复方案**:
```go
// engine.go
type DeckState struct {
    Cards         []Card
    CurrentIndex  int    `json:"current_index"`
    CycleCount    int    `json:"cycle_count"`  // 已完成的轮次数
    TotalDraws    int    `json:"total_draws"` // 总抽牌数
}

func (d *Deck) Draw() (*Card, error) {
    if d.CurrentIndex >= len(d.Cards) {
        return nil, fmt.Errorf("deck exhausted")
    }
    card := d.Cards[d.CurrentIndex]
    d.CurrentIndex++
    d.TotalDraws++
    
    if d.CurrentIndex >= len(d.Cards) {
        d.CycleCount++
        d.CurrentIndex = 0
    }
    return &card, nil
}
```

---

## 四、重构里程碑

| 阶段 | 任务 | 负责Agent | 产出 |
|------|------|-----------|------|
| M1 | 像素风美术规范制定 | game-designer | 02_ui_design.md |
| M2 | GameUI 重构 | game-engineer | 新的 GameUI.tsx |
| M3 | RPGMap 重构 | game-engineer | 新的 RPGMap.tsx |
| M4 | 轮次逻辑修复 | game-engineer | engine.go 修复 + MemoryPanel.tsx |
| M5 | 架构拆分 | game-engineer | 拆分的 Go 服务 |
| M6 | 测试用例编写 | game-qa | 测试文件 |
| M7 | 集成验证 | game-qa | 测试报告 |

---

## 五、阻塞项

1. **Python 版本兼容**: DeerFlow harness 需要 Python 3.12+，当前环境为 3.11.6
2. **精灵资源缺失**: 需要制作或获取像素风美术资源
3. **测试环境**: 需要搭建 Jest/Vitest 测试环境

---

*计划完成，待执行*
