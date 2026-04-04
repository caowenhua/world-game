#!/usr/bin/env python3
"""
羊蹄山之魂游戏开发团队 - DeerFlow 执行脚本

此脚本使用 DeerFlow 多智能体系统协调团队完成游戏开发任务。
"""

import os
import sys
import asyncio
import json
from pathlib import Path
from datetime import datetime
from typing import Optional

# 配置路径
DEERFLOW_HARNESS = "/root/deer-flow/backend/packages/harness"
sys.path.insert(0, DEERFLOW_HARNESS)

# 游戏开发任务
GAME_TASK = """请各位在deerflow分支上重新设计开发《羊蹄山之魂》RPG游戏！

核心要求：
1. Pokemon像素风地图（精美！）
2. 卡牌驱动世界（基于8种CardType）
3. 发牌员是全场景机制
4. 剧情卡牌基于《千年契约》等故事线
5. 可玩性、丰富性、逻辑性、易懂性都要好

请各位按照DeerFlow的协作流程，分工完成各自的部分！

团队成员：
1. 产品经理 - 精通RPG游戏设计，有成功项目经验
2. 设计师 - 精通像素风RPG美术，有代表作
3. 程序员 - 精通React/TypeScript/Canvas，有RPG项目经验
4. 测试工程师 - 资深游戏测试，熟悉RPG游戏体验
5. 项目经理 - PMP认证，有游戏项目管理经验"""


# 团队成员任务定义
TEAM_TASKS = {
    "game-pm": {
        "name": "产品经理",
        "output": "results/01_product_design.md",
        "task": """作为产品经理，请为《羊蹄山之魂》制定详细的产品设计。

## 游戏概述
《羊蹄山之魂》是一款AI驱动的开放世界RPG，核心特点：
1. Pokemon像素风地图 - 精美像素艺术
2. 卡牌驱动世界 - 基于8种CardType
3. 发牌员全场景机制 - NPC发牌员遍布世界
4. 剧情基于《千年契约》等故事线
5. AI实时生成，永不枯竭

## 8种CardType定义
请设计8种卡牌类型，包括：
1. 主线剧情卡 - 推动核心叙事
2. 支线故事卡 - 本地故事、角色背景
3. 探索发现卡 - 隐藏地点、新NPC
4. 挑战遭遇卡 - 战斗、谜题、抉择
5. 成长奖励卡 - 装备、能力提升
6. 氛围营造卡 - 孤寂、温暖、紧张
7. 事件触发卡 - 随机事件、限时活动
8. 剧情碎片卡 - 千年契约等故事线

## 发牌员机制
发牌员是全场景机制，请设计：
- 发牌员的分布和类型
- 发牌规则和策略
- 与玩家的交互方式

## 剧情设计
基于《千年契约》等故事线，设计：
- 核心剧情框架
- 角色设定
- 剧情分支和选择

## 输出要求
请将完整的产品设计文档输出到指定文件。"""
    },
    
    "game-designer": {
        "name": "设计师",
        "output": "results/02_ui_design.md",
        "task": """作为UI/UX和像素风美术设计师，请为《羊蹄山之魂》设计视觉规范。

## 设计要求
1. Pokemon像素风地图 - 16x16 或 32x32 精灵
2. 卡牌UI设计 - 卡牌的大小、样式、动画
3. RPG界面 - 状态栏、背包、菜单等

## 像素风美术规范
请定义：
- 调色板设计（主色、辅色、强调色）
- 精灵尺寸规范（地面、角色、NPC、特效）
- 动画帧数标准
- 地图瓦片设计

## UI设计方案
- 主界面设计
- 战斗界面设计
- 卡牌展示界面
- 菜单和状态栏

## 地图布局
- 世界地图结构
- 区域划分
- 地标设计
- 路径规划

## 输出要求
请将完整的设计文档输出到指定文件。"""
    },
    
    "game-engineer": {
        "name": "程序员",
        "output": "results/03_technical_design.md",
        "task": """作为游戏程序员，请为《羊蹄山之魂》设计技术架构。

## 技术栈
- React + TypeScript
- Canvas 2D
- 状态管理（Zustand/Redux）
- AI集成

## 系统设计要求
1. 游戏引擎架构
2. 卡牌系统数据结构
3. 战斗系统算法
4. 发牌员机制实现
5. 状态管理系统
6. 地图渲染系统

## 卡牌数据结构
定义8种CardType的数据结构：
```typescript
interface Card {
  id: string;
  type: CardType;
  name: string;
  description: string;
  effect: Effect;
  rarity: Rarity;
}
```

## 战斗系统
设计回合制战斗系统：
- 玩家行动选择
- 敌人AI
- 伤害计算
- 状态效果

## 输出要求
请将完整的技术设计文档输出到指定文件。"""
    },
    
    "game-qa": {
        "name": "测试工程师",
        "output": "results/04_test_plan.md",
        "task": """作为测试工程师，请为《羊蹄山之魂》设计测试方案。

## 测试范围
1. 卡牌系统
2. 战斗系统
3. 发牌员机制
4. UI/UX
5. 地图系统

## 测试用例设计
为每个系统设计测试用例：
- 功能测试
- 边界测试
- 异常测试
- 性能测试

## 可玩性评估
- 游戏体验评估标准
- 难度平衡测试
- 进度曲线测试

## Bug追踪
- Bug分级标准
- Bug报告模板
- 回归测试计划

## 输出要求
请将完整的测试文档输出到指定文件。"""
    },
    
    "game-manager": {
        "name": "项目经理",
        "output": "results/05_project_plan.md",
        "task": """作为项目经理，请为《羊蹄山之魂》制定项目计划。

## 项目概述
- 项目目标
- 范围定义
- 关键里程碑

## 工作分解结构（WBS）
将项目分解为可管理的工作包：
1. 产品设计阶段
2. 美术设计阶段
3. 技术开发阶段
4. 测试阶段
5. 部署上线

## 项目时间表
- 阶段时间线
- 关键路径
- 资源分配

## 团队分工（RACI矩阵）
明确每个角色的职责：
- R: 执行
- A: 审批
- C: 咨询
- I: 知会

## 风险管理
识别项目风险并制定应对策略。

## 沟通计划
- 日常沟通机制
- 周报/月报
- 决策流程

## 输出要求
请将完整的项目管理文档输出到指定文件。"""
    }
}


def setup_results_dir():
    """设置结果目录。"""
    results_dir = Path(__file__).parent / "results"
    results_dir.mkdir(exist_ok=True)
    return results_dir


def check_deerflow_config():
    """检查 DeerFlow 配置。"""
    config_path = Path("/root/deer-flow/config.yaml")
    if not config_path.exists():
        print("⚠️  警告: DeerFlow 配置文件不存在")
        print(f"   期望路径: {config_path}")
        return False
    return True


async def run_single_task(subagent_type: str, task_info: dict) -> dict:
    """运行单个团队成员的任务。"""
    from deerflow.client import DeerFlowClient
    
    print(f"\n{'='*60}")
    print(f"🎮 {task_info['name']} ({subagent_type}) 开始工作...")
    print(f"{'='*60}")
    
    client = DeerFlowClient(
        subagent_enabled=True,
        thinking_enabled=True,
    )
    
    try:
        # 使用 task 工具委托给子代理
        response = client.chat(
            f"请完成以下任务并输出到 {task_info['output']}：\n\n{task_info['task']}\n\n{GAME_TASK}",
            thread_id=f"game-dev-{datetime.now().strftime('%Y%m%d')}"
        )
        
        # 保存结果
        results_dir = setup_results_dir()
        output_path = results_dir / task_info['output'].split('/')[-1]
        output_path.write_text(response)
        
        print(f"\n✅ {task_info['name']} 完成！")
        print(f"📄 结果已保存到: {output_path}")
        
        return {
            "name": task_info['name'],
            "subagent_type": subagent_type,
            "status": "success",
            "output": str(output_path),
            "result": response[:200] + "..." if len(response) > 200 else response
        }
    except Exception as e:
        print(f"\n❌ {task_info['name']} 出错: {e}")
        return {
            "name": task_info['name'],
            "subagent_type": subagent_type,
            "status": "error",
            "error": str(e)
        }


async def run_team_coordinator():
    """运行团队协调器。"""
    print("\n" + "="*80)
    print("🎮 羊蹄山之魂游戏开发团队启动！")
    print("="*80)
    print(f"📅 时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"📁 工作目录: {Path(__file__).parent}")
    
    # 检查 DeerFlow 配置
    if not check_deerflow_config():
        print("\n⚠️  DeerFlow 配置检查失败，尝试继续...")
    
    # 设置结果目录
    results_dir = setup_results_dir()
    print(f"📂 结果目录: {results_dir}")
    
    # 运行团队成员任务
    results = []
    for subagent_type, task_info in TEAM_TASKS.items():
        result = await run_single_task(subagent_type, task_info)
        results.append(result)
    
    # 生成整合报告
    print("\n" + "="*80)
    print("📦 生成整合报告...")
    print("="*80)
    
    integrated = f"""# 羊蹄山之魂游戏开发 - 团队工作整合报告

> 生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## 团队成员工作状态

| 角色 | 状态 | 输出文件 |
|------|------|----------|
"""
    
    for result in results:
        status_emoji = "✅" if result["status"] == "success" else "❌"
        output = result.get("output", result.get("error", "N/A"))
        integrated += f"| {result['name']} | {status_emoji} {result['status']} | {output} |\n"
    
    integrated += """
## 核心游戏设计要求

1. Pokemon像素风地图（精美！）
2. 卡牌驱动世界（基于8种CardType）
3. 发牌员是全场景机制
4. 剧情卡牌基于《千年契约》等故事线
5. 可玩性、丰富性、逻辑性、易懂性都要好

## 各成员输出摘要

"""
    
    for result in results:
        if result["status"] == "success":
            integrated += f"### {result['name']}\n{result.get('result', '')}\n\n"
    
    integrated_file = results_dir / "00_integrated_report.md"
    integrated_file.write_text(integrated)
    print(f"\n✅ 整合报告已保存到: {integrated_file}")
    
    return results


def main():
    """主入口。"""
    try:
        results = asyncio.run(run_team_coordinator())
        
        print("\n" + "="*80)
        print("🎉 团队任务执行完成！")
        print("="*80)
        
        # 打印摘要
        success_count = sum(1 for r in results if r["status"] == "success")
        print(f"\n📊 执行摘要:")
        print(f"   ✅ 成功: {success_count}/{len(results)}")
        print(f"   ❌ 失败: {len(results) - success_count}/{len(results)}")
        
        print("\n📄 输出文件:")
        for r in results:
            if r["status"] == "success":
                print(f"   - {r['output']}")
        
    except KeyboardInterrupt:
        print("\n\n⚠️  用户中断执行")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 执行出错: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
