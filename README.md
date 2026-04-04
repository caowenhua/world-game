# AI World Game - 羊蹄山之魂

> 基于事件卡组 + LLM 的 AI 驱动开放世界 RPG

## 项目状态

⚠️ **开发中** - v0.1 Demo 已完成，包含：
- ✅ Go 服务端（gRPC + HTTP）
- ✅ MongoDB 持久化存储
- ✅ LLM 动态内容生成
- ✅ React 前端（Next.js）
- ✅ WebSocket 实时通信
- ✅ 完整状态机管理

## 快速开始

### 1. 启动后端

```bash
cd ai-world-game-full

# 启动 MongoDB（如果用 Docker）
docker run -d --name mongodb -p 27017:27017 mongo:7

# 设置环境变量
export MINIMAX_API_KEY="your-api-key"

# 编译并运行
go mod tidy
go build -o bin/server ./cmd/server
./bin/server --addr :8080
```

### 2. 启动前端

```bash
cd web
npm install
npm run dev
```

前端运行在 http://localhost:3000

## 架构

```
┌────────────────────┐
│   React 前端        │  Next.js + TailwindCSS
│   (web/)          │  Zustand 状态管理
└────────┬───────────┘
         │ HTTP / WebSocket
┌────────▼───────────┐
│   Go 服务端         │  Fiber + gRPC
│   (internal/)     │  MongoDB + Redis
└────────┬───────────┘
         │
┌────────▼───────────┐
│   LLM 生成引擎     │  MiniMax / DeepSeek
└───────────────────┘
```

## 技术栈

| 组件 | 技术 |
|------|------|
| 前端 | Next.js 14, React 18, TailwindCSS, Framer Motion |
| 后端 | Go 1.23, Fiber, gRPC |
| 数据库 | MongoDB 7 |
| LLM | MiniMax / DeepSeek API |
| 协议 | Protocol Buffers, JSON |

## 核心系统

### 1. 事件卡组

控制 AI 内容生成节奏的卡牌系统：
- 12 张卡牌循环
- 主线剧情、支线故事、探索、挑战、成长、氛围、空白
- 紧急卡牌动态提升

### 2. LLM 内容生成

动态生成：
- NPC 对话
- 场景描写
- 物品描述
- 任务设计

### 3. 状态机

MongoDB 持久化：
- 角色属性（生命、精神、等级）
- 背包物品
- NPC 关系
- 探索进度
- 事件历史

## API

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/auth/register` | POST | 注册 |
| `/api/auth/login` | POST | 登录 |
| `/api/characters` | GET | 角色列表 |
| `/api/characters` | POST | 创建角色 |
| `/api/characters/:id` | GET | 获取角色 |
| `/api/characters/:id/interact` | POST | 与 NPC 交互 |
| `/api/characters/:id/move` | POST | 移动 |
| `/ws/:characterId` | WebSocket | 实时通信 |

## 目录结构

```
ai-world-game-full/
├── cmd/server/          # 服务端入口
├── internal/
│   ├── server/         # HTTP 服务器
│   ├── game/          # 游戏逻辑
│   ├── deck/          # 卡组引擎
│   ├── ai/             # LLM 生成
│   └── store/          # MongoDB 存储
├── web/                # Next.js 前端
│   └── src/
│       ├── components/ # UI 组件
│       ├── lib/        # 工具库
│       └── types/       # TypeScript 类型
├── PRD.md              # 产品需求文档
└── README.md
```

## 配置

环境变量：

| 变量 | 默认值 | 描述 |
|------|--------|------|
| `MINIMAX_API_KEY` | - | MiniMax API Key（必需）|
| `JWT_SECRET` | `your-secret-key` | JWT 密钥 |

启动参数：

```bash
./bin/server \
  --addr :8080 \
  --mongo mongodb://localhost:27017 \
  --db aiworld \
  --ai-key $MINIMAX_API_KEY \
  --ai-model MiniMax-Text-01
```

## License

MIT
