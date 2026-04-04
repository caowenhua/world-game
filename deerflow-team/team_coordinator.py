"""
Game Development Team Runner

This script creates a team of agents using DeerFlow and coordinates them
to develop the 羊蹄山之魂 RPG game.
"""

import os
import sys
import json
import asyncio
from pathlib import Path
from datetime import datetime

# Add the DeerFlow harness to the path
DEERFLOW_PATH = "/root/deer-flow/backend/packages/harness"
sys.path.insert(0, DEERFLOW_PATH)

from deerflow.client import DeerFlowClient
from deerflow.agents.lead_agent.prompt import apply_prompt_template

# Game development task
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


def create_team_member_agent(role: str, system_prompt: str, config: dict = None) -> DeerFlowClient:
    """Create a DeerFlow client for a team member with custom system prompt."""
    
    # Create a modified system prompt for the team member
    member_prompt = f"""{system_prompt}

## 当前任务
{GAME_TASK}

请专注于你的角色和职责，完成分配给你的任务。"""

    client = DeerFlowClient(
        config_path="/root/deer-flow/config.yaml" if os.path.exists("/root/deer-flow/config.yaml") else None,
        subagent_enabled=True,
        thinking_enabled=True,
    )
    
    return client


async def run_team_member(client: DeerFlowClient, name: str, role: str, prompt: str, thread_id: str):
    """Run a team member agent with the given task."""
    print(f"\n{'='*60}")
    print(f"🎮 {name} ({role}) 开始工作...")
    print(f"{'='*60}")
    
    try:
        response = await asyncio.to_thread(
            client.chat,
            prompt,
            thread_id=thread_id
        )
        print(f"\n✅ {name} 完成工作\n")
        return {"name": name, "role": role, "result": response}
    except Exception as e:
        print(f"\n❌ {name} 出错: {e}")
        return {"name": name, "role": role, "error": str(e)}


async def run_coordinator(workspace_path: Path):
    """Run the team coordinator to manage the game development."""
    print("\n" + "="*80)
    print("🎮 羊蹄山之魂游戏开发团队启动！")
    print("="*80)
    
    thread_id = f"game-dev-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    print(f"\n📋 工作线程: {thread_id}")
    
    # Import team configuration
    from team_config import TEAM_MEMBERS, TEAM_COORDINATOR_PROMPT
    
    # Create results directory
    results_dir = workspace_path / "results"
    results_dir.mkdir(exist_ok=True)
    
    # Team task assignment
    tasks = {
        "product_manager": f"""作为产品经理，请为《羊蹄山之魂》RPG游戏制定详细的产品设计。

{TASK_DETAILS}

请输出：
1. 游戏概述和核心玩法
2. 8种CardType详细定义（名称、效果、使用场景）
3. 发牌员机制设计
4. 剧情/故事线设计（《千年契约》等）
5. 优先级和开发计划

输出文件：results/01_product_design.md""",
        
        "designer": f"""作为UI/UX和像素风美术设计师，请为《羊蹄山之魂》设计视觉规范。

请基于以下产品设计（如果存在的话）进行设计：
- Pokemon像素风地图
- 卡牌驱动的UI
- RPG游戏界面

请输出：
1. 像素风美术规范（调色板、精灵尺寸）
2. UI设计方案
3. 地图布局设计
4. 角色和NPC设计方向

输出文件：results/02_ui_design.md""",
        
        "engineer": f"""作为游戏程序员，请为《羊蹄山之魂》设计技术架构。

请基于以下设计进行技术实现规划：
- React + TypeScript + Canvas
- 卡牌系统和发牌机制
- Pokemon像素风地图渲染

请输出：
1. 技术栈选择
2. 系统架构设计
3. 核心数据结构定义
4. 卡牌系统实现方案
5. 战斗系统算法

输出文件：results/03_technical_design.md""",
        
        "qa": f"""作为测试工程师，请为《羊蹄山之魂》设计测试方案。

请基于以下设计进行测试规划：
- 卡牌系统
- 发牌员机制
- 战斗系统
- 像素风地图

请输出：
1. 测试策略和计划
2. 功能测试用例
3. 游戏可玩性评估标准
4. Bug追踪模板

输出文件：results/04_test_plan.md""",
        
        "project_manager": f"""作为项目经理，请为《羊蹄山之魂》制定项目计划。

请基于以下团队设计进行项目规划：
- 产品经理负责设计
- 设计师负责UI
- 程序员负责实现
- QA负责测试

请输出：
1. 项目范围和目标
2. 工作分解结构（WBS）
3. 项目时间表
4. 团队分工（RACI矩阵）
5. 风险管理计划

输出文件：results/05_project_plan.md"""
    }
    
    # Run each team member in sequence for better coordination
    results = []
    for member_id, task in tasks.items():
        member_config = TEAM_MEMBERS[member_id]
        print(f"\n🎯 指派任务给 {member_config.name}...")
        
        # Create a new client for each team member
        client = DeerFlowClient(
            subagent_enabled=True,
            thinking_enabled=True,
        )
        
        result = await run_team_member(
            client,
            member_config.name,
            member_config.role,
            task,
            thread_id
        )
        results.append(result)
        
        # Save intermediate result
        if "result" in result:
            output_file = results_dir / f"{member_id}_result.md"
            output_file.write_text(result["result"])
    
    # Create final integrated document
    print("\n" + "="*80)
    print("📦 整合所有设计文档...")
    print("="*80)
    
    integrated_doc = f"""# 《羊蹄山之魂》游戏开发完整设计

> 生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
> 工作线程: {thread_id}

---

## 团队成员

| 角色 | 姓名 | 职责 |
|------|------|------|
| Product Manager | 产品经理 | 游戏设计、需求管理 |
| Designer | 设计师 | UI/UX、像素风美术 |
| Engineer | 程序员 | 技术实现、游戏开发 |
| QA | 测试工程师 | 质量保证、测试 |
| Project Manager | 项目经理 | 项目管理、进度控制 |

---

"""
    
    for member_id, member_config in TEAM_MEMBERS.items():
        result = next((r for r in results if r["name"] == member_config.name), None)
        status = "✅ 完成" if result and "result" in result else "❌ 失败"
        integrated_doc += f"## {member_config.name} ({member_config.role}) - {status}\n\n"
        if result and "result" in result:
            integrated_doc += result["result"][:500] + "...\n\n"
    
    integrated_file = results_dir / "00_integrated_design.md"
    integrated_file.write_text(integrated_doc)
    
    print(f"\n✅ 完整设计文档已保存到: {integrated_file}")
    
    return results


TASK_DETAILS = """
## 游戏核心设计方向

《羊蹄山之魂》是一款AI驱动的开放世界RPG，特点：
1. Pokemon像素风地图 - 精美的像素艺术风格地图
2. 卡牌驱动世界 - 基于8种CardType的卡牌系统
3. 发牌员是全场景机制 - 发牌员存在于游戏各处
4. 剧情基于《千年契约》等故事线
5. AI实时生成内容，永不枯竭的游戏体验
"""


def main():
    """Main entry point."""
    # Get workspace path
    workspace = Path(__file__).parent
    
    print("🎮 羊蹄山之魂游戏开发团队")
    print("="*60)
    print("使用 DeerFlow 多智能体系统进行协作开发")
    print()
    
    # Run the team
    asyncio.run(run_coordinator(workspace))
    
    print("\n🎉 游戏开发团队任务完成！")
    print("请查看 results/ 目录下的设计文档。")


if __name__ == "__main__":
    main()
