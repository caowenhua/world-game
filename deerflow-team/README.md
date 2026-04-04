# 羊蹄山之魂 - DeerFlow 游戏开发团队

## 概述

本目录包含使用 DeerFlow 多智能体系统创建的游戏开发团队。

## 团队成员

| 角色 | ID | 职责 |
|------|-----|------|
| 产品经理 | game-pm | 制定游戏产品需求、优先级、玩法设计 |
| 设计师 | game-designer | UI/UX设计、像素风美术规范、地图布局 |
| 程序员 | game-engineer | 实现游戏功能、战斗系统、卡牌系统 |
| 测试工程师 | game-qa | 测试游戏可玩性、找出bug、验证体验 |
| 项目经理 | game-manager | 协调团队、进度管理、质量把控 |

## 文件结构

```
deerflow-team/
├── README.md           # 本文件
├── team_config.py      # 团队配置（角色定义、系统提示词）
├── register_team.py    # 子代理注册脚本
├── run_team.py         # 团队运行脚本
└── results/            # 设计输出目录
    ├── 01_product_design.md
    ├── 02_ui_design.md
    ├── 03_technical_design.md
    ├── 04_test_plan.md
    ├── 05_project_plan.md
    └── 00_integrated_design.md
```

## 使用方法

### 方法1: 使用 DeerFlow 子代理系统

```python
# 注册团队成员
from register_team import register_team, GAME_TEAM_SUBAGENTS
register_team()

# 使用 task 工具委托任务
# 在 DeerFlow 中使用 task 工具:
# task(
#     description="产品设计",
#     prompt="请设计《羊蹄山之魂》的产品需求...",
#     subagent_type="game-pm"
# )
```

### 方法2: 使用团队协调器

```bash
cd /root/.openclaw/workspace-taizi/ai-world-game-full/deerflow-team
python run_team.py
```

## 游戏核心要求

1. **Pokemon像素风地图** - 精美的像素艺术风格
2. **卡牌驱动世界** - 基于8种CardType
3. **发牌员全场景机制** - 发牌员存在于游戏各处
4. **剧情基于《千年契约》** - 丰富的故事线
5. **可玩性、丰富性、逻辑性、易懂性** - 优秀的游戏体验

## 8种CardType设计方向

1. **主线剧情卡** - 推动核心叙事
2. **支线故事卡** - 本地故事、角色背景
3. **探索发现卡** - 隐藏地点、新NPC
4. **挑战遭遇卡** - 战斗、谜题、抉择
5. **成长奖励卡** - 装备、能力提升
6. **氛围营造卡** - 孤寂、温暖、紧张
7. **事件触发卡** - 随机事件、限时活动
8. **剧情碎片卡** - 千年契约等故事线

## DeerFlow 子代理类型

注册后可在 DeerFlow 中使用以下子代理类型：

- `game-pm` - 产品经理
- `game-designer` - 设计师
- `game-engineer` - 程序员
- `game-qa` - 测试工程师
- `game-manager` - 项目经理
- `general-purpose` - 通用代理（内置）
- `bash` - Bash命令代理（内置）
