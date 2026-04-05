# 项目调研报告 - 羊蹄山之魂 RPG 游戏

**任务ID**: JJC-20260405-006
**调研时间**: 2026-04-05
**调研范围**: `/root/.openclaw/workspace-taizi/ai-world-game-full/`

---

## 一、项目结构

```
ai-world-game-full/
├── web/                      # Next.js 前端
│   ├── src/
│   │   ├── components/       # React 组件 (12个)
│   │   │   ├── Login.tsx            # 登录 (247行)
│   │   │   ├── CharacterSelect.tsx   # 角色选择 (188行)
│   │   │   ├── CreateCharacter.tsx   # 创建角色 (288行)
│   │   │   ├── GameUI.tsx            # 游戏主界面 (448行) ⚠️ UI问题
│   │   │   ├── RPGMap.tsx            # RPG地图 (325行) ⚠️ 地图问题
│   │   │   ├── RPGGameMap.tsx        # RPG游戏地图 (559行)
│   │   │   ├── DialogueBox.tsx       # 对话框 (323行)
│   │   │   ├── Game.tsx             # 游戏主组件 (383行)
│   │   │   ├── ImprovedRPG.tsx      # 改进版RPG (1520行)
│   │   │   ├── CharacterPortrait.tsx # 角色立绘 (178行)
│   │   │   ├── GameMap.tsx          # 游戏地图 (40行)
│   │   │   └── Login.tsx            # 登录
│   │   ├── pages/            # 页面
│   │   ├── lib/              # 工具库 (api.ts, store.ts)
│   │   └── types/            # TypeScript类型定义
│   └── package.json          # Next.js 14 + React 18
├── cmd/server/main.go        # Go 服务入口
├── internal/                 # Go 内部模块
│   ├── server/server.go      # HTTP/gRPC 服务
│   ├── game/                 # 游戏逻辑
│   │   ├── service.go        # 游戏服务 (1040行)
│   │   ├── combat.go          # 战斗系统 (364行)
│   │   ├── map.go            # 地图逻辑 (466行)
│   │   └── dialogue.go       # 对话系统 (905行)
│   ├── deck/engine.go        # 卡牌引擎 (核心)
│   ├── ai/generator.go       # AI内容生成
│   └── store/                # MongoDB存储
├── deerflow-team/            # DeerFlow 多智能体团队
│   ├── team_config.py        # 团队配置
│   ├── register_team.py      # 团队注册
│   └── results/              # 设计输出
└── PRD.md                    # 产品需求文档
```

---

## 二、核心问题分析

### 问题1: UI视觉差 ⚠️ P0优先级

**证据文件**: `web/src/components/GameUI.tsx`

**问题描述**:
- 使用 Lucide React 图标库，图标过于简单
- 缺乏视觉层次感，UI元素堆砌
- 卡牌展示使用简单的 div 堆叠，没有卡牌翻转/动画效果
- 缺乏氛围感，背景过于平淡

**当前实现** (GameUI.tsx 第1-100行):
```tsx
// 简单的侧边栏布局
<aside className="w-64 bg-slate-900/50 backdrop-blur-md border-r border-slate-700/30 p-4 space-y-4">
  // HP/SP/XP 条使用简单的 motion.div
  <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
    <motion.div className="h-full bg-gradient-to-r from-red-600 to-red-400" ... />
  </div>
```

**改进方向**:
1. 引入像素风 UI 组件库或自定义像素风格组件
2. 添加毛玻璃/玻璃态效果增强层次感
3. 卡牌添加 3D 翻转动画、光晕效果
4. 添加粒子效果、动态背景

---

### 问题2: 地图视觉差 ⚠️ P0优先级

**证据文件**: `web/src/components/RPGMap.tsx`

**问题描述**:
- 使用 Canvas 绑定 emoji 字符作为地图元素
- 没有真正的像素艺术资源
- 地形使用简单的 emoji: 🌿🧱🌊🌲 等
- 缺乏光照、阴影、动画效果
- 玩家用红色圆点表示，毫无游戏感

**当前实现** (RPGMap.tsx):
```tsx
const TERRAIN_EMOJI: Record<TerrainType, string> = {
  0: '🌿', // 草地
  1: '⬜', // 地板/路
  2: '🧱', // 墙壁
  3: '🌊', // 水
  4: '🌲', // 树木
  ...
};

// Canvas 渲染
ctx.font = '24px serif';
ctx.textAlign = 'center';
ctx.fillText(emoji, x * TILE_SIZE + TILE_SIZE / 2, ...);
```

**改进方向**:
1. 使用真正的像素艺术贴图（16x16 或 32x32 精灵图）
2. 添加地形动画（草地摇曳、水面波动）
3. 玩家角色使用像素精灵，支持多方向移动动画
4. 添加阴影、环境光遮蔽效果
5. 探索暗角效果

---

### 问题3: 反省轮次逻辑问题 ⚠️ P1优先级

**证据文件**: `internal/deck/engine.go`

**问题描述**:
- `Deck.Draw()` 函数逻辑：CurrentIndex >= len(Cards) 时重置
- 当 CurrentIndex 达到卡片数量时，会重置为 0 并增加 CycleCount
- 但前端 UI 显示的轮次可能与后端不一致
- 缺乏"反省"机制 - 玩家回顾已发生事件的界面

**当前实现** (engine.go):
```go
func (d *Deck) Draw() (*Card, error) {
    if d.CurrentIndex >= len(d.Cards) {
        return nil, fmt.Errorf("deck exhausted")
    }
    card := d.Cards[d.CurrentIndex]
    d.CurrentIndex++
    
    if d.CurrentIndex >= len(d.Cards) {
        d.CycleCount++
        d.CurrentIndex = 0  // 线性循环，不洗牌
    }
    return &card, nil
}
```

**改进方向**:
1. 添加"回忆"界面，让玩家回顾之前的事件
2. 统一前后端的轮次计数逻辑
3. 在 GameUI 中添加"回看"按钮，展示历史事件
4. 优化 cycle_count 的显示和更新

---

## 三、代码质量评估

### 前端 (Next.js/React)
| 指标 | 评分 | 说明 |
|------|------|------|
| 结构 | ⭐⭐⭐ | 组件划分合理，但 GameUI.tsx 过大 (448行) |
| 类型安全 | ⭐⭐⭐⭐ | TypeScript 使用良好 |
| 状态管理 | ⭐⭐⭐ | Zustand 合适，但 store.ts 需审查 |
| UI代码 | ⭐⭐ | 大量内联样式，缺少组件抽象 |
| 可测试性 | ⭐⭐ | 缺少单元测试 |

### 后端 (Go)
| 指标 | 评分 | 说明 |
|------|------|------|
| 架构 | ⭐⭐⭐⭐ | 分层清晰 (server/game/deck/ai/store) |
| 代码质量 | ⭐⭐⭐ | service.go 过大 (1040行)，需拆分 |
| 错误处理 | ⭐⭐⭐ | 基本完善 |
| 可测试性 | ⭐⭐ | 缺少单元测试 |

---

## 四、重构优先级

| 优先级 | 任务 | 影响 | 工作量 |
|--------|------|------|--------|
| P0 | UI视觉重构 | 解决皇上最痛恨的问题 | 高 |
| P0 | 地图视觉重构 | 解决皇上最痛恨的问题 | 高 |
| P1 | 反省轮次逻辑修复 | 游戏体验 | 中 |
| P2 | 代码架构优化 | 可维护性 | 中 |
| P3 | 测试完善 | 质量保证 | 低 |

---

## 五、DeerFlow Agent 协作计划

### 已注册的 Agent (5个)
1. **game-pm** - 产品经理：制定游戏产品需求、优先级
2. **game-designer** - 设计师：UI/UX设计、像素风美术规范
3. **game-engineer** - 程序员：实现游戏功能
4. **game-qa** - 测试工程师：测试用例、质量验证
5. **game-manager** - 项目经理：进度管理、质量把控

### 任务分配
```
阶段1: 调研与规划
├── game-manager: 制定重构计划
├── game-pm: 输出产品改进方案
└── game-designer: 设计UI规范

阶段2: UI/地图重构 (P0)
└── game-engineer + game-designer: 联合执行

阶段3: 反省轮次修复 (P1)
└── game-engineer: 修复deck engine + UI

阶段4: 架构优化 (P2)
└── game-engineer: 拆分大文件、添加测试

阶段5: 测试验证 (P3)
└── game-qa: 编写测试用例、回归测试
```

---

## 六、文件变更清单 (预估)

### 新增文件
```
web/src/components/pixel/          # 像素风格组件库
web/src/components/pixel/PixelCard.tsx
web/src/components/pixel/PixelButton.tsx
web/src/components/pixel/PixelProgressBar.tsx
web/src/assets/sprites/            # 像素精灵图
web/src/assets/sprites/player/
web/src/assets/sprites/tileset/
web/src/assets/sprites/npc/
web/src/components/MemoryPanel.tsx # 反省/回忆界面
tests/                              # 测试文件
tests/game.test.ts
tests/deck.test.ts
```

### 修改文件
```
web/src/components/GameUI.tsx       # UI重构
web/src/components/RPGMap.tsx       # 地图重构
web/src/components/DialogueBox.tsx   # 对话框优化
internal/deck/engine.go            # 轮次逻辑
internal/game/service.go           # 架构拆分
web/src/lib/store.ts               # 状态管理优化
```

---

*调研完成，待皇上审批后执行*
