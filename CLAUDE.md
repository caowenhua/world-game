# Claude Code - 游戏改进任务

## 当前项目
RPG游戏，使用Next.js + Go后端，位于`/root/.openclaw/workspace-taizi/ai-world-game-full/`

## 主要文件
- `web/src/components/ImprovedRPG.tsx` - 游戏主组件（2000+行）
- `web/src/components/PorymapPixels.tsx` - 像素数据
- `web/src/components/STORY_CHAPTERS.ts` - 剧情章节

## 改进目标（按优先级）
1. **Pokemon像素地图** - 100%复刻Pokemon GBC风格的16x16像素地图瓦片
2. **角色精灵质量** - Pokemon质量的像素角色绘制
3. **游戏体验** - 修复bug，改善UI

## 当前状态
- 代码已push到GitHub
- 游戏运行在Cloudflare Tunnel
- Next.js开发服务器在port 3001

## 关键要求
- 修复所有TypeScript编译错误
- 确保游戏可在移动端正常运行
- 保持现有功能不变
