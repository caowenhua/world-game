#!/bin/bash
# 羊蹄山之魂游戏开发团队启动脚本

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "============================================"
echo "🎮 羊蹄山之魂游戏开发团队"
echo "============================================"
echo ""

# 检查Python环境
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: 未找到 python3"
    exit 1
fi

# 检查DeerFlow配置
if [ ! -f "/root/deer-flow/config.yaml" ]; then
    echo "⚠️  警告: 未找到 DeerFlow 配置文件"
    echo "   路径: /root/deer-flow/config.yaml"
    echo "   尝试继续..."
fi

# 创建结果目录
mkdir -p results

# 运行团队
echo ""
echo "🚀 启动团队执行..."
echo ""

python3 run_team.py

echo ""
echo "============================================"
echo "✅ 团队任务完成！"
echo "============================================"
echo ""
echo "📄 输出文件:"
ls -la results/
