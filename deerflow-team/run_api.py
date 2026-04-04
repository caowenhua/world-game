#!/usr/bin/env python3
"""
DeerFlow API 方式运行游戏开发团队

此脚本通过 DeerFlow REST API 创建团队任务。
"""

import httpx
import json
import sys
from pathlib import Path
from datetime import datetime
from typing import Optional

# API 配置
API_BASE = "http://localhost:2026"
THREADS_ENDPOINT = f"{API_BASE}/api/langgraph/threads"
RUNS_ENDPOINT = f"{API_BASE}/api/langgraph/threads/{{thread_id}}/runs"


def create_thread() -> Optional[str]:
    """创建新的线程。"""
    try:
        response = httpx.post(THREADS_ENDPOINT, timeout=30)
        response.raise_for_status()
        data = response.json()
        return data.get("thread_id")
    except Exception as e:
        print(f"❌ 创建线程失败: {e}")
        return None


def run_agent(thread_id: str, message: str, model_name: str = None) -> Optional[dict]:
    """在指定线程上运行代理。"""
    headers = {"Content-Type": "application/json"}
    
    payload = {
        "input": {
            "messages": [{"role": "user", "content": message}]
        },
        "config": {
            "configurable": {
                "thinking_enabled": True,
                "subagent_enabled": True,
            }
        },
        "stream_mode": ["values", "messages-tuple"]
    }
    
    if model_name:
        payload["config"]["configurable"]["model_name"] = model_name
    
    try:
        response = httpx.post(
            RUNS_ENDPOINT.format(thread_id=thread_id),
            json=payload,
            headers=headers,
            timeout=300,
            stream=True
        )
        response.raise_for_status()
        
        # 处理 SSE 流
        result = {"messages": [], "values": None}
        for line in response.iter_lines():
            if line.startswith("event: "):
                event_type = line[7:]
            elif line.startswith("data: "):
                data = json.loads(line[6:])
                if event_type == "values":
                    result["values"] = data
                elif event_type == "messages":
                    result["messages"].append(data)
        
        return result
    except Exception as e:
        print(f"❌ 运行代理失败: {e}")
        return None


def check_api_health() -> bool:
    """检查 DeerFlow API 是否可用。"""
    try:
        response = httpx.get(f"{API_BASE}/api/health", timeout=5)
        return response.status_code == 200
    except:
        # 尝试其他健康检查端点
        try:
            response = httpx.get(f"{API_BASE}/api/threads", timeout=5)
            return True
        except:
            return False


def main():
    """主入口。"""
    print("\n" + "="*60)
    print("🎮 羊蹄山之魂游戏开发团队 - API 模式")
    print("="*60 + "\n")
    
    # 检查 API 健康状态
    print("🔍 检查 DeerFlow API 状态...")
    if not check_api_health():
        print("❌ DeerFlow API 不可用")
        print("   请确保 DeerFlow 服务正在运行（默认端口 2026）")
        print("")
        print("💡 提示: 如果需要直接使用 Python API，请使用 run_team.py")
        sys.exit(1)
    
    print("✅ DeerFlow API 可用")
    print()
    
    # 创建线程
    print("📝 创建工作线程...")
    thread_id = create_thread()
    if not thread_id:
        print("❌ 创建线程失败")
        sys.exit(1)
    print(f"✅ 线程创建成功: {thread_id}")
    print()
    
    # 团队任务
    TASK = """请作为游戏开发团队的协调者，协调团队完成《羊蹄山之魂》RPG游戏的重新设计。

核心要求：
1. Pokemon像素风地图（精美！）
2. 卡牌驱动世界（基于8种CardType）
3. 发牌员是全场景机制
4. 剧情卡牌基于《千年契约》等故事线
5. 可玩性、丰富性、逻辑性、易懂性都要好

请使用 task 工具委托任务给以下团队成员：
- game-pm: 产品经理
- game-designer: 设计师
- game-engineer: 程序员
- game-qa: 测试工程师
- game-manager: 项目经理

每个成员负责自己领域的详细设计。

请将设计结果保存到以下文件：
- 产品设计: /root/.openclaw/workspace-taizi/ai-world-game-full/deerflow-team/results/01_product_design.md
- UI设计: /root/.openclaw/workspace-taizi/ai-world-game-full/deerflow-team/results/02_ui_design.md
- 技术设计: /root/.openclaw/workspace-taizi/ai-world-game-full/deerflow-team/results/03_technical_design.md
- 测试计划: /root/.openclaw/workspace-taizi/ai-world-game-full/deerflow-team/results/04_test_plan.md
- 项目计划: /root/.openclaw/workspace-taizi/ai-world-game-full/deerflow-team/results/05_project_plan.md"""
    
    print("🚀 启动团队协调器...")
    print()
    
    result = run_agent(thread_id, TASK)
    
    if result:
        print("\n✅ 团队任务完成！")
        print(f"📊 收到 {len(result.get('messages', []))} 条消息")
    else:
        print("\n⚠️  任务执行遇到问题")


if __name__ == "__main__":
    main()
