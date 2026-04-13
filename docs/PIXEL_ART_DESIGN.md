# RPG游戏像素美术设计文档

> 版本：v1.0 | 日期：2026-04-06 | 作者：像素美术设计组
> 目标：基于GBA Pokemon (GBC)风格，重设计所有游戏精灵与地图瓦片

---

## 一、项目概述

### 1.1 当前美术状态
- **渲染技术**：HTML5 Canvas 2D API，禁用抗锯齿 (`imageSmoothingEnabled = false`)
- **图块尺寸**：16×16 像素（瓦片地图）
- **精灵尺寸**：玩家约 20×46 像素，怪物 20×40 像素
- **当前调色板**：使用命名颜色常量（如 `T.GD` `#2d5a27`）

### 1.2 存在的主要问题
1. **玩家精灵**：大量 `fillRect` 堆叠（50+次调用），轮廓线粗糙，颜色过渡不自然
2. **怪物精灵**：轮廓使用1px黑色矩形拼凑，不符合GBA精灵描边规范
3. **宝箱**：过于简单（仅5个矩形），缺乏质感
4. **发牌员/NPC**：使用 Emoji 文字（`📋💰`）而非像素绘图，风格严重不一致
5. **缺乏统一的精灵表（Spritesheet）系统**：每个精灵独立绘制，无法批量处理
6. **动画帧数不足**：大部分只有1-2帧，运动感差

### 1.3 参考标准
- **GBA Pokemon Ruby/Sapphire/Emerald** 精灵风格
- **GBC Pokemon Gold/Silver** 地图瓦片风格
- 核心工具：[porymap](https://github.com/huderlem/porymap) 图块编辑器规范

---

## 二、当前精灵问题分析（代码级）

### 2.1 地图瓦片问题

**函数**：`drawGrassTile`, `drawWaterTile`, `drawTreeTile`, `drawPathTile`, `drawWallTile`

| 瓦片类型 | 当前实现方式 | 主要问题 | 参考GBA风格 |
|---------|------------|---------|-----------|
| 草地 | 3色渐变草叶（深绿→中绿→亮绿）+ 随机花 | ✅ 已较接近GBC风格，但叶片布局固定3种变体 | 应有5+种变体，叶片更细（1-2px宽） |
| 水面 | 2帧波浪高光 + 深蓝底色 | ⚠️ 只有2帧动画，节奏感差 | 应有4帧动画，波浪更像素化 |
| 树木 | 3层绿色圆形树冠（深→中→浅）+ 棕色树干 | ⚠️ 树冠圆形是用矩形拼凑，边缘锯齿明显 | 树冠边缘应有深色轮廓像素，形成像素圆效果 |
| 道路 | 棕色底 + 随机深/浅色斑点 | ✅ 结构正确 | 可增加鹅卵石纹理细节 |
| 墙壁 | 砖墙纹理（水平线+垂直偏移线） | ⚠️ 只有2色（深灰BB + 黑色BD），层次不够 | 应有3色：暗缝、深砖、亮砖面 |

**当前草地瓦片调色板**（16×16 ASCII）：
```
草地块 #1 (变体A):
  Y:0 ................................
  Y:1 ................................
  Y:2 ....GGGG.......................
  Y:3 ...GGGGGG.....AAAA..............
  Y:4 ..GGGGGGGG..AAAAAAA............
  Y:5 .GGGGGGGGGGG.GGGGGG............
  Y:6 GGGGGGGGGGGGGGGGGGGGG...........
  Y:7 GGGGGGGGGGGGGGGGGGGGG..........
  Y:8 GGGGGGGGGGGGGGGGGGGGG..........
  Y:9 GGGGGGGGGGGGGGGGGGGGG..........
  Y:10................................
  Y:11................................
  Y:12................................
  Y:13................................
  Y:14................................
  Y:15................................

G=GB(中绿4a8a37) A=GA(亮绿8ada8a) .=GD(深绿2d5a27)
```

### 2.2 玩家角色问题

**函数**：`drawPlayerSprite()` (约1472-1650行)

```
精灵名称: drawPlayerSprite
当前使用颜色数: 约18种
当前实现方式: 50+个fillRect堆叠
主要问题:
  1. 黑色轮廓使用fillRect拼凑，线条粗细不均（最细1px，最粗处3px）
  2. 颜色过渡不自然：相邻色块色差过大（如#C62828直接跳#E53935）
  3. 眼睛尺寸比例失调（4×4像素过大，GBA标准约2×2）
  4. 身体比例不是GBA 16×32经典比例，而是20×46的瘦高型
  5. 只有2帧行走动画，GBA标准是4帧（下蹲/站立/迈步1/迈步2）
  6. 头发/帽子没有层次细节
参考GBA Pokemon风格应该是什么样:
  - 经典训练师比例：16×32像素，站立约28像素高
  - 黑色轮廓为2px环绕（外圈），轮廓色与精灵色之间有"轮廓深色"过渡
  - 4帧行走循环（站立→左步→站立→右步）
  - 头发有2-3px的高光纹理
  - 眼睛是2×3像素，眼白+虹膜+瞳孔+高光四点
```

**当前玩家精灵ASCII布局** (20×46像素，逐像素描述)：

```
      01234567890123456789012345
Y:-46 ....................
Y:-45 ....................
Y:-44 ...RRRRRRRRRRRR....
Y:-43 ..RRRRRRRRRRRRRR...
Y:-42 ..RRRRRRRRRRRRRR...
Y:-41 ..BBBBBBBBBBBBBB...
Y:-40 ..BBBBBBBBBBBBBB...
Y:-39 ..BBBBBBBBBBBBBB...
Y:-38 ..BBBBBBBBBBBBBB...
Y:-37 .yyyyYYYYYYYYYYYY..
Y:-36 .yyyyYYYYYYYYYYYYY.
Y:-35 .yyyyYYYYYYYYYYYYY.
Y:-34 .yyyyYYYYYYYYYYYYY.
Y:-33 .yyyyYYYYYYYYYYYYY.
Y:-32 .yyyyYYYYYYYYYYYYY.
Y:-31 .yyyyYYYYYYYYYYYYY.
Y:-30 ..BBBBBBBBBBBBBB...
Y:-29 ..BBBBBBBBBBBBBB...
Y:-28 ..BBBBBBBBBBBBBB...
Y:-27 .sssssssssssssss...
Y:-26 .ssssSSSSSSSSSSS...
Y:-25 .ssssSSSSSSSSSSS...
Y:-24 .ssssSSSSSSSSSSS...
Y:-23 .ssssSSSSSSSSSSS...
Y:-22 .ssssSSSSSSSSSSS...
Y:-21 ..WWWWWWWWWWWWW....
Y:-20 ..WWWWWWWWWWWWW....
Y:-19 ..WWWWWWWWWWWWW....
Y:-18 ..WWWWWWWWWWWWW....
Y:-17 ..BBBBBBBBBBBBBB...
Y:-16 ..BBBBBBBBBBBBBB...
Y:-15 ..BBBBBBBBBBBBBB...
Y:-14 ..BBBBBBBBBBBBBB...
Y:-13 ..BBBBBBBBBBBBBB...
Y:-12 .yyyyYYYYYYYYYYYY..
Y:-11 .yyyyYYYYYYYYYYYYY.
Y:-10 .yyyyYYYYYYYYYYYYY.
Y: -9 .YYYYYYYYYYYYYYYY..
Y: -8 .YYYYYYYYYYYYYYYY..
Y: -7 .YYYYYYYYYYYYYYYY..
Y: -6 .YYYYYYYYYYYYYYYY..
Y: -5 .YYYYYYYYYYYYYYYY..
Y: -4 .YYYYYYYYYYYYYYYY..
Y: -3 .YYYYYYYYYYYYYYYY..
Y: -2 .LLLLLLLLLLLLLLL...
Y: -1 .LLLLLLLLLLLLLLL...
Y:  0 .LLLLLLLLLLLLLLL...
Y:  1 .LLLLLLLLLLLLLLL...
Y:  2 ..LLLLLLLLLLLLL....
Y:  3 ..LLLLLLLLLLLLL....
Y:  4 ..LLLLLLLLLLLLL....
Y:  5 ..LLLLLLLLLLLLL....
Y:  6 ..LLLLLLLLLLLLL....
Y:  7 ..LLLLLLLLLLLLL....
Y:  8 ..LLLLLLLLLLLLL....
Y:  9 ..BBBBBBBBBBBBBB....
Y: 10 ..BBBBBBBBBBBBBB....
Y: 11 ..BBBBBBBBBBBBBB....
Y: 12 ..BBBBBBBBBBBBBB....
Y: 13 ..BBBBBBBBBBBBBB....
Y: 14 ..BBBBBBBBBBBBBB....

R=帽子(红)C62828  B=头发(黄)F9A825  s=皮肤FFCC80
W=眼白#FFFFFF    Y=衣服(蓝)1565C0  L=腿(棕)4E342E
```

**调色板**：
```
轮廓黑:   #000000
帽子深红:  #C62828  帽子亮红:  #E53935  帽子高光:  #EF5350
发丝深黄:  #F9A825  发丝亮黄:  #FDD835  发丝高光:  #FFEE58
皮肤深色:  #FFB74D  皮肤基础:  #FFCC80  皮肤高光:  #FFE0B2
眼白:      #FFFFFF  虹膜蓝:    #1565C0  瞳孔深蓝:  #0D47A1
衣服深蓝:  #1565C0  衣服中蓝:  #1976D2  衣服亮蓝:  #2196F3
衣服高光:  #64B5F6  腰带深金:  #F57F17  腰带金:    #FFD600
裤子深棕:  #4E342E  裤子棕:    #5D4037  裤子亮棕:  #795548
靴子深褐:  #3E2723  靴子棕:    #5D4037  靴子高光:  #8D6E63
```

### 2.3 野怪问题

**函数**：`drawSlime()` (史莱姆), `drawWolf()` (狼), `drawGoblin()` (哥布林)

#### 2.3.1 史莱姆精灵

```
精灵名称: drawSlime
当前使用颜色数: 约14种（普通）/ 14种（精英）
当前实现方式: 30+个fillRect
主要问题:
  1. 轮廓线用矩形拼凑，不是GBA精灵的2px描边风格
  2. 身体只有3层颜色过渡，缺少"高光点"像素（GBA精灵特有）
  3. 弹跳动画幅度过大（±3px），GBA风格约±1px
  4. 精英史莱姆的星标（3×2像素方块）太简陋
  5. 眼睛比例偏大（6×6像素），GBA标准约4×4
参考GBA Pokemon风格应该是什么样:
  - 身体应有5层颜色：轮廓→深色→中色→浅色→高光点
  - 眼睛周围应有"眼眶"色（轮廓色）
  - 弹跳幅度±1px，更细腻
  - 精英应有金色王冠或星星符号（像素绘制，非emoji）
```

**当前史莱姆ASCII布局** (26×18像素)：

```
      01234567890123456789012345
Y:-18 ............................
Y:-17 ............................
Y:-16 ....**......................
Y:-15 ...****...KK................
Y:-14 ..KKKKKK.KKKK..............
Y:-13 ..KKKKKKKKKKKK.............
Y:-12 ..KKKKKKKKKKKK.............
Y:-11 ..KKKKKKKKKKKK.............
Y:-10 ..KKKKKKKKKKKK..HHHHH......
Y: -9 ..KKKKKKKKKKKK.HHHHHHH......
Y: -8 .KKKKKKKKKKKKKHHHHHHHH......
Y: -7 .KKKKKKKKKKKKKHHHHHHH......
Y: -6 .KKKKKKKKKKKKKHHHHH.........
Y: -5 .KKKKKKKKKKKKK..............
Y: -4 .KKKKKKKKKKKKK..............
Y: -3 ..WWWWWW.WWWWWW.............
Y: -2 ..WWBBWW.WWBBWW.............
Y: -1 ..WWWWWW.WWWWWW.............
Y:  0 ............................
Y:  1 ............................
Y:  2 ............................
Y:  3 ............................
Y:  4 ............................
Y:  5 ............................
Y:  6 ............................
Y:  7 ............................
Y:  8 .kkkkkkkkkkkkkk............
Y:  9 .kkkkkkkkkkkkkk............
Y: 10 ..kkkkkkkkkkkkk............
Y: 11 ............................
Y: 12 ............................

K=身体深绿2E7D32  H=高光浅绿A5D6A7  W=眼白#FFFFFF
B=虹膜蓝1565C0   k=身体轮廓1B5E20
```

#### 2.3.2 狼精灵

```
精灵名称: drawWolf
当前使用颜色数: 约16种
当前实现方式: 40+个fillRect
主要问题:
  1. 身体轮廓使用fillRect拼凑，不是GBA像素精灵的描边方式
  2. 耳朵只有3层三角形，细节不够
  3. 毛皮纹理缺失（GBA狼应有毛发细节线条）
  4. 腿部只有6×6像素，太小，缺少爪子细节
  5. 尾巴没有独立动画帧
参考GBA Pokemon风格应该是什么样:
  - 轮廓外围应有1px深色描边
  - 身体应有2-3种毛色层次
  - 耳朵应有内部粉色轮廓
  - 腿部至少8像素高，带爪子
  - 尾巴应有轻微摆动帧
```

#### 2.3.3 哥布林精灵

```
精灵名称: drawGoblin
当前使用颜色数: 约14种
当前实现方式: 50+个fillRect
主要问题:
  1. 木棒武器比例失调（太长太粗）
  2. 大耳朵只有3层尖角，缺少内部轮廓
  3. 身体比例偏卡通（头大身小），不协调
  4. 跳跃动画过于夸张（abs(sin)*3），不自然
  5. 整体风格偏向西方奇幻而非日系RPG
参考GBA Pokemon风格应该是什么样:
  - 身体比例应接近人类：头/身 1:1.2
  - 耳朵应有内部浅色轮廓，形成3层结构
  - 木棒应为6×16像素，带木纹细节
  - 跳跃幅度约±2px，节奏更慢（GBA 60fps）
```

### 2.4 宝箱/物品问题

**函数**：`drawTreasure()` (约2108行)

```
精灵名称: drawTreasure
当前使用颜色数: 仅4种
当前实现方式: 5个fillRect + 1个arc
主要问题:
  1. 极度简陋：28×20像素的箱体只用5个矩形
  2. 没有打开状态（opened状态直接return不绘制）
  3. 没有箱体细节：铰链、锁扣、纹理、木板接缝
  4. 金色装饰（#FFD700）太单调，缺少光感
  5. 没有光效粒子或打开动画
  6. 弹跳动画幅度过大
参考GBA Pokemon风格应该是什么样:
  - 应有3种状态：关闭/打开中/已开启
  - 箱体应有木板线条、铰链（银色）、锁扣（金色）
  - 箱盖应有2px边框描边
  - 打开状态应有金色光柱效果（经典RPG宝箱）
```

**当前宝箱ASCII布局** (32×24像素，关闭状态)：

```
      01234567890123456789012345678901
Y:-14 ................................
Y:-13 ................................
Y:-12 ..JJJJJJJJJJJJJJJJJJJJJJJJJJ....
Y:-11 ..JJJJJJJJJJJJJJJJJJJJJJJJJJ....
Y:-10 ..JJJJJJJJJJJJJJJJJJJJJJJJJJ....
Y: -9 ..JJJJJJJJJJJJJJJJJJJJJJJJJJ....
Y: -8 ..JJJJJJJJJJJJJJJJJJJJJJJJJJ....
Y: -7 ..JJJJJJJJJJJJJJJJJJJJJJJJJJ....
Y: -6 ................................
Y: -5 ................................
Y: -4 ..SSSSSSSSSSSSSSSSSSSSSSSSSS....
Y: -3 ..SSSSSSSSSSSSSSSSSSSSSSSSSS....
Y: -2 ..SSSSSSSSSSSSSSSSSSSSSSSSSS....
Y: -1 ..SSSSSSSSSSSSSSSSSSSSSSSSSS....
Y:  0 ..SSSSSSSSSSSSSSSSSSSSSSSSSS....
Y:  1 ..SSSSSSSSSSSSSSSSSSSSSSSSSS....
Y:  2 ..SSSSSSSSSSSSSSSSSSSSSSSSSS....
Y:  3 ..SSSSSSSSSSSSSSSSSSSSSSSSSS....
Y:  4 ..SSSSSSSSSSSSSSSSSSSSSSSSSS....
Y:  5 ..SSSSSSSSSSSSSSSSSSSSSSSSSS....
Y:  6 ..SSSSSSSSSSSSSSSSSSSSSSSSSS....
Y:  7 ................................
Y:  8 ................................

J=金色盖子FFD700  S=棕色箱体8B4513
```

### 2.5 发牌员/NPC问题

**函数**：`drawDealer()` (约2045-2100行)

```
精灵名称: drawDealer
当前使用颜色数: 5-8种
当前实现方式: fillRect + ctx.fillText（emoji渲染）
主要问题:
  1. ❌❌❌ 使用 Emoji 文字（📋💰🔥🌙）而非像素绘图 —— 这是最严重的问题！
     - Emoji 渲染依赖系统字体，在不同平台显示不一致
     - Emoji 无法配合禁用抗锯齿的像素风格
     - 严重破坏整体像素美术风格统一性
  2. 身体只用简单的矩形（20×24像素），无细节
  3. 没有面部表情（眼睛、嘴巴）
  4. 不同type的dealer区分度低
  5. 发光效果使用 ctx.arc 圆形，不是像素风格
参考GBA Pokemon风格应该是什么样:
  - 所有图标必须用 fillRect 像素绘制替代Emoji
  - 应有16×32或16×40像素的标准NPC精灵比例
  - 面部应有简单表情（眼睛+嘴巴，2-3帧）
  - 发光效果应用像素化粒子替代圆形
```

**当前发牌员问题代码示例**：
```typescript
// ❌ 当前实现（严重问题）
ctx.fillStyle = '#7C3AED';
ctx.fillRect(sx - 10, sy - 30, 20, 20);
ctx.fillStyle = '#fff';
ctx.font = '10px sans-serif';
ctx.fillText('📋', sx - 5, sy - 16);  // <-- Emoji渲染！

// ✅ 应该改为像素绘制
ctx.fillStyle = '#000';
ctx.fillRect(sx - 8, sy - 30, 16, 16); // 黑色描边
ctx.fillStyle = '#7C3AED';
ctx.fillRect(sx - 7, sy - 29, 14, 14); // 紫色帽子
ctx.fillStyle = '#1a1a1a';
ctx.fillRect(sx - 6, sy - 27, 2, 2);  // 眼睛
ctx.fillRect(sx - 2, sy - 27, 2, 2);
ctx.fillStyle = '#fff';
ctx.fillRect(sx - 6, sy - 27, 1, 1);  // 眼神高光
```

---

## 三、GBA Pokemon像素美术规范

### 3.1 分辨率和瓦片

| 参数 | GBC值 | GBA值 | 当前游戏值 |
|------|-------|-------|-----------|
| 屏幕分辨率 | 160×144 | 240×160 | 800×480 |
| 瓦片尺寸 | 8×8 | 8×8 / 16×16 | **16×16** ✅ |
| 角色精灵高度 | 16-32px | 16-64px | 20-46px ⚠️ |
| 每行瓦片数 | 20 | 30 | 50 |
| 颜色数量 | 4色/瓦片（调色板） | 16色/调色板 | 无限制（直接hex） |

**当前游戏瓦片规格** ✅ 正确：
- 16×16像素瓦片 = 良好平衡
- 800÷16 = 50列，480÷16 = 30行
- 对应缩放2x后：每瓦片在屏幕上占32×32像素

### 3.2 调色板系统

GBA Pokemon使用**调色板索引**系统：

```
GBA精灵调色板（每精灵16色槽位）：
┌────────────────────────────────────────────────────┐
│ 槽位0:  #000000 (轮廓/透明)                          │
│ 槽位1:  #ffffff (高光/眼白)                          │
│ 槽位2:  #xxxxxx (主色)                              │
│ 槽位3:  #xxxxxx (阴影色)                            │
│ 槽位4:  #xxxxxx (中间色)                            │
│ ...                                                  │
│ 槽位15: #xxxxxx (特殊色)                             │
└────────────────────────────────────────────────────┘

GBC每瓦片4色调色板（示例草地）：
调色板0: [透明, 深绿, 中绿, 亮绿]
调色板1: [透明, 深水, 中水, 亮水]
```

**当前游戏调色板使用方式**：
```typescript
// ✅ 当前方式（直接hex，可接受但不规范）
const T = {
  GD: '#2d5a27', GB: '#4a8a37', GL: '#6ab86a', GA: '#8ada8a',
  PD: '#8a6a4a', PB: '#c9a86c', PL: '#d4bc8a',
  WD: '#1a4a7a', WB: '#2a6aaa', WL: '#4a9aca', WSh: '#9adaee',
};
// 问题：没有分组到调色板，不利于批量修改
```

**改进方案**：
```typescript
// 建议的调色板结构
const PALETTES = {
  grass: {
    outline: '#1a3a1a',
    dark: '#2d5a27',
    mid: '#4a8a37', 
    light: '#6ab86a',
    highlight: '#8ada8a',
  },
  water: {
    outline: '#0a2a4a',
    dark: '#1a4a7a',
    mid: '#2a6aaa',
    light: '#4a9aca',
    shimmer: '#9adaee',
  },
  // ... 其他调色板
};
```

### 3.3 精灵设计原则（轮廓/阴影/高光）

#### 3.3.1 GBA Pokemon精灵三层结构

```
┌─────────────────────────────────────────┐
│            GBA精灵标准层次               │
├─────────────────────────────────────────┤
│                                         │
│  第1层：轮廓（Outline）                  │
│  - 颜色：纯黑 #000000 或深色（比主色深）   │
│  - 宽度：1-2px，沿精灵边缘包裹            │
│  - 作用：定义形状，分离精灵与背景          │
│                                         │
│  第2层：主体（Body/Main）                 │
│  - 包含2-4种主色调（深→浅渐变）           │
│  - 每个身体部位独立着色                   │
│  - 注意：GBA限制16色/精灵，但分层绘制无限制│
│                                         │
│  第3层：高光（Highlight/Shading）        │
│  - 位置：左上角（光源假设在左上方）         │
│  - 颜色：主色的亮化版本 + 纯白点（眼白）   │
│  - 大小：1-3px的小块或线条                │
│                                         │
└─────────────────────────────────────────┘
```

#### 3.3.2 像素精灵描边规范

```
❌ 当前描边方式（错误）：
   ctx.fillStyle = '#000';
   ctx.fillRect(sx - 9, sy - 32 + bounce, 18, 1);  // 顶部描边
   ctx.fillRect(sx - 10, sy - 31 + bounce, 1, 11);  // 左侧描边
   // 问题：只能画矩形，无法画斜边和曲线

✅ GBA正确描边方式：
   轮廓像素应逐个放置在精灵外边缘的每个像素位置
   对于16×32角色，每个边缘像素都应有轮廓色
   
   标准做法：
   1. 先画完整精灵主体（忽略轮廓）
   2. 再画轮廓时，只填充"露在外面的边缘像素"
   3. 斜边和曲线处用单像素勾勒
```

#### 3.3.3 阴影与高光方向

```
光源位置：左上方（GBA游戏通用约定）

┌──────────────────────────────────────────┐
│         精灵阴影/高光分布示意              │
│                                          │
│          ↖ 光源方向                       │
│         ①②③                              │
│        ④精灵⑤                            │
│         ⑥⑦⑧                              │
│          ⑨⑩                              │
│                                          │
│  高光（Highlight）分布：                  │
│  - ① 头顶高光（若有帽子/头发）             │
│  - ② 左耳/左角高光                        │
│  - ③ 左肩上沿                             │
│  - ④ 左臂外侧                             │
│                                          │
│  阴影（Shadow）分布：                     │
│  - ⑤ 右肩/右臂内侧                        │
│  - ⑥ 腰部以下                             │
│  - ⑦ 右腿外侧                             │
│  - ⑧ 脚下投影（椭圆阴影）                 │
│                                          │
│  GBA精灵特有：                            │
│  - ⑨ 高光点（1-2px纯白，放在眼睛/球体上）  │
│  - ⑩ 反光边缘（右侧细线，增强立体感）       │
└──────────────────────────────────────────┘
```

### 3.4 动画帧设计

#### 3.4.1 行走帧（Walk Animation）

GBA Pokemon角色行走动画**标准4帧**：

```
帧0（站立）      帧1（左步）       帧2（站立）      帧3（右步）

  ████            ████            ████            ████
  ████            ████            ████            ████
  ████            ████            ████            ████
  ████            ██              ████            ██
  ████            ████            ████            ████
 ██████          ██████          ██████          ██████
 ██  ██          ██  ██          ██  ██          ██  ██
 ██  ██          ██  ██          ██  ██          ██  ██

腿部间距:       腿部间距:       腿部间距:       腿部间距:
  左-8 右+8      左-6 右+10     左-8 右+8      左-10 右+6
```

**帧切换节奏**：每6-8帧切换（GBA 60fps下约0.1-0.13秒/帧）

**当前游戏只有2帧** ❌，应扩展为4帧。

#### 3.4.2 待机帧（Idle Animation）

```
GBA Pokemon待机动画（呼吸感）：

帧0（正常）      帧1（轻微上浮）    帧2（正常）      帧3（轻微下沉）

身体Y偏移: +0    Y偏移: -1         Y偏移: +0        Y偏移: +1
帧间隔: 30帧    帧间隔: 30帧      帧间隔: 30帧     帧间隔: 30帧
```

#### 3.4.3 攻击帧（Attack Animation）

```
攻击帧序列（3帧）：

帧0（准备）      帧1（挥动）       帧2（命中）
  ████            ████              ████
  ████            ████              ████
  ██→             →██                ████
  ████            ████              ████
 ██████          ██████            ██████

武器位置:       武器位置:        武器位置:
  收回/后        最大摆动/前       继续/收
```

#### 3.4.4 怪物动画帧数

| 怪物类型 | 站立帧 | 移动帧 | 攻击帧 | 当前帧数 |
|---------|-------|-------|-------|---------|
| 史莱姆 | 呼吸(2帧) | 弹跳(4帧) | 挤压(3帧) | 1帧 ❌ |
| 狼 | 待机(2帧) | 奔跑(4帧) | 撕咬(3帧) | 1帧 ❌ |
| 哥布林 | 待机(2帧) | 跳跃(4帧) | 挥棒(3帧) | 1帧 ❌ |

### 3.5 地形设计规范

#### 3.5.1 GBC草地瓦片设计原则

```
GBC草地瓦片必须满足：
1. 任意相邻瓦片拼接无接缝（边缘必须能互相匹配）
2. 每瓦片至少3种草叶变体（保证视觉多样性）
3. 草叶方向应有变化（向左/向右/直立）
4. 约1/8概率出现花朵（红/黄/蓝三色）
5. 边缘像素应与相邻瓦片"融合"

16×16草地瓦片标准模板：
┌────────────────┐
│GGGG....GGGG....│  G=深绿/中绿/浅绿草叶
│GGGGGGGGGGGGGG..│  .=透明/底色
│GGGGGGGGGGGG....│
│GGGGGGGGGGGGGG..│
│GGGG....GGGGGG..│
│GGGGGGGGGGGGGG..│
│GGGGGGGGGGGGGG..│
│....GGGGGGGGGG..│
│GGGGGGGGGGGGGG..│
│GGGGGGGGGGGG....│
│GGGGGGGGGGGGGG..│
│GGGG....GGGGGG..│
│GGGGGGGGGGGGGG..│
│GGGGGGGGGGGGGG..│
│....GGGGGGGGGG..│
│GGGGGGGGGGGG....│
└────────────────┘
```

#### 3.5.2 水面瓦片设计原则

```
GBC水面瓦片必须满足：
1. 至少4帧波浪动画（循环无缝）
2. 波浪高光有明确方向性（斜向或横向）
3. 深水色和浅水色对比明显
4. 相邻水瓦片拼接时波浪连续

16×16水面4帧动画：
帧0:  ╱╱    ══    ╱╱    ══     (波浪向右)
帧1:   ╱╱   ══   ╱╱   ══
帧2:    ╱╱  ══  ╱╱  ══
帧3:  ╱╱   ══╱╱   ══
帧0:  ╱╱    ══    ╱╱    ══     (回到帧0)
```

#### 3.5.3 墙壁瓦片设计原则

```
砖墙瓦片应支持：
1. 水平方向无缝拼接（砖缝对齐）
2. 垂直方向有3种变体（上中下）
3. 每块砖有3色：暗缝、深面、亮面

16×16墙壁标准（左上角4×4区块示意）：
┌────┬────┬────┬────┐
│ddbb│bbdd│ddbb│bbdd│  d=暗缝 dd=深砖面 bb=亮砖面
│ddbb│bbdd│ddbb│bbdd│
│────┼────┼────┼────│
│ddbb│bbdd│ddbb│bbdd│  砖缝偏移：奇数行左移8px
│ddbb│bbdd│ddbb│bbdd│
│────┼────┼────┼────│
│bbdd│ddbb│bbdd│ddbb│
│bbdd│ddbb│bbdd│ddbb│
└────┴────┴────┴────┘
```

---

## 四、设计方案

### 4.1 地图瓦片重设计

#### 4.1.1 草地瓦片（5种变体 + 花朵变种）

**调色板**：
```
草地调色板（5色）：
- GD: #1a4010  (轮廓/最深绿)
- GDD: #2d5a27 (深绿)
- GB: #4a8a37  (中绿)
- GL: #6ab86a  (浅绿)
- GA: #8ada8a  (高光/最浅绿)

花朵调色板（额外3色）：
- FL: #ff6a6a  (红花)
- FY: #ffca6a  (黄花)
- FB: #6a9aff  (蓝花)
- FW: #fff     (花心白)
```

**变体A - 草地A（16×16 ASCII）**：
```
Y:0  ................................
Y:1  ................................
Y:2  ..GG............................
Y:3  .GGLG...........................
Y:4  .GGLGGG.........................
Y:5  GGGGGGGG.........................
Y:6  GGGGGGGGG........................
Y:7  GGGGGGGGGG.......................
Y:8  GGGGGGGGGGG......................
Y:9  GGGGGGGGGG.......................
Y:10 GGGGGGGG.........................
Y:11 GGGGGGG.........................
Y:12 .GGGGG...........................
Y:13 .GGGG............................
Y:14 ................................
Y:15 ................................
```
> G=GB中绿 L=GL浅绿 . = GB中绿(底)

**变体B - 草地B（草叶稍短，向右倾斜）**：
```
Y:0  ................................
Y:1  ................................
Y:2  ................................
Y:3  ................................
Y:4  ...GG...........................
Y:5  ..GGLG...........................
Y:6  .GGGGGG.........................
Y:7  GGGGGGGG.........................
Y:8  GGGGGGGGG........................
Y:9  GGGGGGGG.........................
Y:10 GGGGGGGG........................
Y:11 .GGGGGGG.........................
Y:12 ..GGGGG..........................
Y:13 ................................
Y:14 ................................
Y:15 ................................
```

**花朵变体（在变体A-C基础上加花朵）**：
```
Y:0  ................................
Y:1  ................................
Y:2  ..GG............................
Y:3  .GGLG...........................
Y:4  .GGLGGG.........................
Y:5  GGGGGGGG..........FF.............
Y:6  GGGGGGGGG.........FWWF............
Y:7  GGGGGGGGGG.........FF.............
Y:8  GGGGGGGGGGG......................
Y:9
帧2（空中最高点）:      帧3（下落）
      0123456789012345        0123456789012345
Y:-32 ...............        ................
Y:-31 ...............        ............k...
Y:-30 ........k......        ........kkkkk...
Y:-29 ......kkkkkkk..        ......kkkkkkkkk.
Y:-28 .....kkkkkkkkkk.        .....kkkkkkkkkkkk
Y:-27 ....kkkkkkkkkkkk      ....kkkkkkkkkkkkk
Y:-26 ....kGGGGGGGGGkk      ....kGGGGGGGGGkkk
Y:-25 ...kGGGGGGGGGGkk      ...kGGGGGGGGGGkkk
Y:-24 ...kGGGGGGGGGGkk      ...kGGGGGGGGGGkkk
Y:-23 ..kGGGSSEESSGGkk      ..kGGGSSEESSGGkkk
Y:-22 ..kGGSSSSSSGGkkk      ..kGGSSSSSSGGkkkk
Y:-21 ..kGGSSSSSSGGkkk      ..kGGSSSSSSGGkkkk
Y:-20 ..kGGGGGGGGGGkkk      ..kGGGGGGGGGGkkkk
Y:-19 ...kkkkkkkkkkkkk..      ...kkkkkkkkkkkkk.
Y:-18 ...kkkkkkkkkkkkk..      ...kkkkkkkkkkkkk.
Y:-17 ..kkkkkkkkkkkkkk..      ..kkkkkkkkkkkkkk.
Y:-16 ..kkkkkkkkkkkkkk..      ..kkkkkkkkkkkkkk.
Y:-15 ..kkkkkkkkkkkkkk..      ..kkkkkkkkkkkkkk.
Y:-14 ................      ......kkkkkkkkk.
Y:-13 ................      ....kkkkkkkkkkkk.
Y:-12 ................      ...kkkkkkkkkkkkk.
Y:-11 ................      ..kkkkkkkkkkkkkkk
Y:-10 ................      .kkkkkkkkkkkkkkkk
Y: -9 ................      kkkkkkkkkkkkkkkkk
Y: -8 ................      kkkkkkkkkkkkkkkkk
Y: -7 ................      ..kkkkkkkkkkkkkk.
Y: -6 ................      ...kkkkkkkkkkkk...
Y: -5 ................      ....kkkkkkkkkkk...

G=皮肤深绿2E7D32 g=皮肤亮4CAF50 S=眼睛黄FDC835
k=轮廓深0a2a0a
```

### 4.4 宝箱设计（3种状态）

#### 4.4.1 宝箱精灵规格

**尺寸**：24×20像素（关闭/打开中） / 24×28像素（含光柱）

**调色板（8色）**：
```
轮廓深:   #3a2010   木板深:   #5D4037
木板中:   #795548   木板亮:   #A1887F
铁质深:   #546E7A   铁质亮:   #90A4AE
金色:     #FFD600   金色高光: #FFEA00
```

#### 4.4.2 三种状态ASCII

```
【关闭状态】 (24×20像素)
      012345678901234567890123
Y:-20 ........................
Y:-19 ........................
Y:-18 ..jjJJJJJJJJJJJJjj......
Y:-17 ..jJJJJJJJJJJJJJJj......
Y:-16 ..jJJJJJJJJJJJJJJj......
Y:-15 ..jJJJJJJJJJJJJJJj......
Y:-14 ..jJJJJJJJJJJJJJJj......
Y:-13 ..jJJJJJJJJJJJJJJj......
Y:-12 ..jJJJJJJJJJJJJJJj......
Y:-11 ..ssssssssssssssss......
Y:-10 ..SSSSSSSSSSSSSSSS......
Y: -9 ..SSSSSSSSSSSSSSSS......
Y: -8 ..SSSSSSSSSSSSSSSS......
Y: -7 ..SSSSSSSSSSSSSSSS......
Y: -6 ..SSSSSSSSSSSSSSSS......
Y: -5 ..SSSSSSSSSSSSSSSS......
Y: -4 ..SSSSSSSSSSSSSSSS......
Y: -3 ..SSSSSSSSSSSSSSSS......
Y: -2 ..SSSSSSSSSSSSSSSS......
Y: -1 ..SSSSSSSSSSSSSSSS......
Y:  0 ..SSSSSSSSSSSSSSSS......
Y:  1 ..SSSSSSSSSSSSSSSS......
Y:  2 ..SSSSSSSSSSSSSSSS......
Y:  3 .........................
Y:  4 ........................

j=金色轮廓 FFD600  J=金色高光 FFEA00
s=铁质轮廓 546E7A  S=木板深 5D4037
（另有木板中795548、木板亮A1887F、铁质亮90A4AE未在ASCII中区分）

【打开状态】 (24×28像素，含光柱)
      012345678901234567890123
Y:-28 ........................
Y:-27 .........GG..............
Y:-26 .......GGGGGG............
Y:-25 .......GGGGGG............
Y:-24 ......GGGGGGGG...........
Y:-23 ......GGGGGGGG...........
Y:-22 ......GGGGGGGG...........
Y:-21 ......GGGGGGGG...........
Y:-20 ........................
Y:-19 ..jjJJJJJJJJJJJJjj......
Y:-18 ..jJJJJJJJJJJJJJJj......
Y:-17 ..SSSSSSSSSSSSSSSS......
Y:-16 ..SSSSSSSSSSSSSSSS......
Y:-15 ..SSSSSSSSSSSSSSSS......
Y:-14 ..SSSSSSSSSSSSSSSS......
Y:-13 ..SSSSSSSSSSSSSSSS......
Y:-12 ..SSSSSSSSSSSSSSSS......
Y:-11 ..SSSSSSSSSSSSSSSS......
Y:-10 ..SSSSSSSSSSSSSSSS......
Y: -9 ..SSSSSSSSSSSSSSSS......
Y: -8 ..SSSSSSSSSSSSSSSS......
Y: -7 ..SSSSSSSSSSSSSSSS......
Y: -6 ..SSSSSSSSSSSSSSSS......
Y: -5 ..SSSSSSSSSSSSSSSS......
Y: -4 ..SSSSSSSSSSSSSSSS......
Y: -3 ..SSSSSSSSSSSSSSSS......
Y: -2 ..SSSSSSSSSSSSSSSS......
Y: -1 ..SSSSSSSSSSSSSSSS......
Y:  0 ..SSSSSSSSSSSSSSSS......
Y:  1 ..SSSSSSSSSSSSSSSS......
Y:  2 ..SSSSSSSSSSSSSSSS......
Y:  3 .........................
Y:  4 ........................

G=金色光柱（渐变透明度）
（箱盖已打开向上，此处省略已打开的箱盖像素）

【已开启状态】 (24×12像素，箱底+空的内部)
      012345678901234567890123
Y:-12 ........................
Y:-11 ........................
Y:-10 ..SSSSSSSSSSSSSSSS......
Y: -9 ..SSSSSSSSSSSSSSSS......
Y: -8 ..SiiiiiiiiiiiiiiiS......
Y: -7 ..SiiiiiiiiiiiiiiiS......
Y: -6 ..SiiiiiiiiiiiiiiiS......
Y: -5 ..SiiiiiiiiiiiiiiiS......
Y: -4 ..SiiiiiiiiiiiiiiiS......
Y: -3 ..SSSSSSSSSSSSSSSS......
Y: -2 ..SSSSSSSSSSSSSSSS......
Y: -1 ..SSSSSSSSSSSSSSSS......
Y:  0 ..SSSSSSSSSSSSSSSS......
Y:  1 ..SSSSSSSSSSSSSSSS......
Y:  2 ..SSSSSSSSSSSSSSSS......
Y:  3 .........................
Y:  4 ........................

i=箱子内部深色（空无一物）
```

**宝箱改进draw函数**：
```typescript
// 改进版drawTreasure
function drawTreasure(ctx, sx, sy, opened, frame) {
  const bounce = Math.sin(frame * 0.08) * 1.5; // 轻微弹跳
  
  if (opened === false) {
    // 关闭状态
    drawClosedChest(ctx, sx, sy + bounce);
  } else if (opened === 'opening') {
    // 打开动画（箱盖向上旋转）
    drawOpeningChest(ctx, sx, sy, frame);
  } else {
    // 已开启（空箱）
    drawOpenedChest(ctx, sx, sy);
  }
}

function drawClosedChest(ctx, sx, sy) {
  // 木板主体（深色底）
  ctx.fillStyle = '#5D4037';
  ctx.fillRect(sx - 12, sy - 8, 24, 16);
  
  // 木板纹理（亮色）
  ctx.fillStyle = '#795548';
  ctx.fillRect(sx - 11, sy - 7, 22, 14);
  ctx.fillStyle = '#A1887F';
  ctx.fillRect(sx - 10, sy - 6, 20, 3);
  ctx.fillRect(sx - 10, sy - 1, 20, 3);
  ctx.fillRect(sx - 10, sy + 4, 20, 3);
  
  // 金属边框
  ctx.fillStyle = '#546E7A';
  ctx.fillRect(sx - 14, sy - 10, 28, 4); // 顶框
  ctx.fillRect(sx - 4, sy - 12, 8, 6);   // 锁扣
  
  // 锁扣高光
  ctx.fillStyle = '#90A4AE';
  ctx.fillRect(sx - 3, sy - 11, 6, 4);
  ctx.fillStyle = '#FFD600';
  ctx.fillRect(sx - 2, sy - 10, 4, 2); // 金色装饰
  
  // 木板垂直线（接缝）
  ctx.fillStyle = '#3E2723';
  ctx.fillRect(sx - 8, sy - 8, 1, 16);
  ctx.fillRect(sx + 7, sy - 8, 1, 16);
}
```

### 4.5 建筑入口/出口光效设计

#### 4.5.1 当前问题分析

```
当前实现（问题）：
- 使用 ctx.arc() 绘制圆形光晕
- 使用 ctx.createRadialGradient() 创建渐变
- 非像素化风格，与整体美术不一致
- 圆弧边缘在像素风格下模糊不清
```

#### 4.5.2 像素化光效方案

**方案A：像素粒子光效**

```
入口光圈（像素化8方向粒子）:
      0123456789012345
Y:-8  ......GGGG..........
Y:-7  ....GGGGGGGG........
Y:-6  ..GGGGWWWWGGGG......
Y:-5  .GGGGWWWWWWWWGGGG....
Y:-4  .GGWWWWWWWWWWWGGG....
Y:-3  GGGWWWWWWWWWWWGGGG...
Y:-2  GGGWWWWWWWWWWWGGGG...
Y:-1  GGGWWWWWWWWWWWGGGG...
Y: 0  .GGWWWWWWWWWWWGGG....
Y: 1  .GGGGWWWWWWWWGGGG....
Y: 2  ..GGGGWWWWGGGG.......
Y: 3  ....GGGGGGGG........
Y: 4  ......GGGG..........

G=金色FFD600（透明度递减） W=白色FFFFD0（核心亮度）
```

**方案B：像素化脉冲环**

```
脉冲环（每帧偏移1px，产生前进感）:

帧0:  .....GGG.......         帧1:  ....GGGG..........
帧2:  ...GGGGGG......         帧3:  ..GGGGGGGG........
帧4:  .GGGGGGGGGG.....         帧5:  GGGGGGGGGGGG......

G=金色粒子（随帧增加逐渐外扩，透明度递减）
```

**像素化光效实现代码**：

```typescript
// 像素化入口光效
function drawEntranceGlowPixel(ctx, tileX, tileY, frame) {
  const cx = tileX * 16 + 8;
  const cy = tileY * 16 + 8;
  const pulse = Math.sin(frame * 0.06) * 0.3 + 0.7;
  const expansion = Math.floor(frame / 10) % 3; // 0,1,2循环
  
  // 像素化光环（3层向外扩散）
  const rings = [
    { r: 6 + expansion, color: 'rgba(255,215,0,0.9)' },
    { r: 9 + expansion, color: 'rgba(255,215,0,0.6)' },
    { r: 12 + expansion, color: 'rgba(255,215,0,0.3)' },
  ];
  
  for (const ring of rings) {
    // 使用Bresenham圆算法绘制像素圆
    drawPixelCircle(ctx, cx, cy, ring.r, ring.color);
  }
  
  // 中心白色像素点
  ctx.fillStyle = `rgba(255,255,255,${0.8 * pulse})`;
  ctx.fillRect(cx - 1, cy - 1, 2, 2);
  
  // 4个方向的光线（像素化）
  const rayDirs = [[0,-1],[0,1],[1,0],[-1,0]];
  for (const [dx, dy] of rayDirs) {
    for (let i = 1; i <= 3; i++) {
      ctx.fillStyle = `rgba(255,215,0,${0.5 * pulse / i})`;
      ctx.fillRect(cx + dx * (4 + i*2), cy + dy * (4 + i*2), 1, 1);
    }
  }
}

// Bresenham像素圆绘制
function drawPixelCircle(ctx, cx, cy, radius, color) {
  ctx.fillStyle = color;
  let x = radius, y = 0;
  let err = 0;
  
  while (x >= y) {
    // 8个对称点
    ctx.fillRect(cx + x, cy + y, 1, 1);
    ctx.fillRect(cx + y, cy + x, 1, 1);
    ctx.fillRect(cx - y, cy + x, 1, 1);
    ctx.fillRect(cx - x, cy + y, 1, 1);
    ctx.fillRect(cx - x, cy - y, 1, 1);
    ctx.fillRect(cx - y, cy - x, 1, 1);
    ctx.fillRect(cx + y, cy - x, 1, 1);
    ctx.fillRect(cx + x, cy - y, 1, 1);
    
    y++;
    err += 1 - x;
    if (err < 0) {
      x--;
      err += x;
    }
  }
}
```

### 4.6 动态元素（草、水、火把等）

#### 4.6.1 动态草地（风吹动画）

```
4帧风吹动画（16×16）:
帧0: 草叶居中       帧1: 草叶左倾       帧2: 草叶居中       帧3: 草叶右倾
Y:12 GGG           Y:12 .GGG           Y:12 GGG           Y:12 ..G
Y:13 GGG           Y:13 .GGG           Y:13 GGG           Y:13 ..G
```

**实现**：在现有 `drawGrassTile` 中添加 frame 参数，每8帧切换风向。

#### 4.6.2 动态火把（3帧闪烁）

```
16×16火把瓦片（3帧）:
帧0:        帧1:        帧2:
Y:5  ..FFF..   Y:5  ...FF..   Y:5  .FFFF..
Y:6  .FFFFF.   Y:6  ..FFFF.   Y:6  FFFFFF
Y:7  .FFFFFo   Y:7  .FFFFFo   Y:7  .FFFFFo
Y:8  ..FFFo    Y:8  ...FFo   Y:8  ..FFFo
Y:9  ...FFo    Y:9  ....FF   Y:9  ...FFo
F=火红FF6B00 f=火黄FFCA00 o=火心#FFCC00

支架:
Y:10  .SSS.   .SSS.   .SSS.
Y:11  .SSS.   .SSS.   .SSS.
S=木棒深5D4037
```

#### 4.6.3 动态水面（4帧 + 涟漪）

```typescript
// 增强版水面（加入涟漪粒子）
function drawWaterTileEnhanced(ctx, sx, sy, tileX, tileY, frame) {
  // 基础深水
  ctx.fillStyle = '#1a4a7a';
  ctx.fillRect(sx, sy, 16, 16);
  
  // 4帧波浪
  const wf = Math.floor(frame / 8) % 4;
  const wavePattern = [
    [[2,2,4,2],[11,3,3,2],[6,7,4,2],[1,11,3,2],[13,12,2,2]],
    [[4,2,4,2],[13,3,3,2],[8,7,4,2],[3,11,3,2],[0,12,2,2]],
    [[6,2,4,2],[0,3,3,2],[10,7,4,2],[5,11,3,2],[2,12,2,2]],
    [[8,2,4,2],[2,3,3,2],[12,7,4,2],[7,11,3,2],[4,12,2,2]],
  ];
  
  for (const [px, py, pw, ph] of wavePattern[wf]) {
    ctx.fillStyle = py < 7 ? '#4a9aca' : '#9adaee';
    ctx.fillRect(sx + px, sy + py, pw, ph);
  }
  
  // 每32帧随机生成涟漪
  if (frame % 32 === 0) {
    const rx = Math.floor(Math.random() * 14) + 1;
    const ry = Math.floor(Math.random() * 14) + 1;
    ctx.fillStyle = '#9adaee';
    ctx.fillRect(sx + rx, sy + ry, 2, 1);
  }
}
```

---

## 五、实施计划

### 5.1 优先级排序

| 优先级 | 任务 | 工作量 | 影响度 | 理由 |
|-------|------|-------|-------|------|
| P0 | **修复发牌员Emoji问题** | 1天 | 🔴 严重 | Emoji严重破坏像素风格一致性 |
| P0 | **扩展玩家精灵为4帧动画** | 2天 | 🔴 高 | 行走动画是核心体验 |
| P1 | **重设计宝箱（3状态+像素光效）** | 2天 | 🟡 中 | 宝箱是核心收集元素 |
| P1 | **怪物精灵扩展为4帧** | 3天 | 🟡 中 | 怪物战斗体验 |
| P2 | **水面4帧动画增强** | 1天 | 🟢 低 | 装饰性元素 |
| P2 | **树木像素圆改进** | 1天 | 🟢 低 | 装饰性元素 |
| P3 | **墙壁3色调色板** | 1天 | 🟢 低 | 装饰性元素 |
| P3 | **动态草/火把** | 2天 | 🟢 低 | 装饰性元素 |

### 5.2 技术实现步骤

#### 步骤1：精灵渲染系统重构

```typescript
// 1.1 创建精灵数据定义结构
interface SpriteDef {
  name: string;
  width: number;
  height: number;
  frames: string[][]; // 每个帧的ASCII像素定义
  palette: { [char: string]: string }; // 字符到颜色的映射
}

// 1.2 创建精灵渲染器
class SpriteRenderer {
  render(ctx: CanvasRenderingContext2D, def: SpriteDef, sx: number, sy: number, frame: number) {
    const frameData = def.frames[frame % def.frames.length];
    for (let py = 0; py < def.height; py++) {
      for (let px = 0; px < def.width; px++) {
        const char = frameData[py]?.[px];
        if (char && char !== ' ') {
          ctx.fillStyle = def.palette[char];
          ctx.fillRect(sx + px, sy + py, 1, 1);
        }
      }
    }
  }
}

// 1.3 替换现有drawXxxSprite函数
```

#### 步骤2：发牌员像素化改造

```typescript
// 替换前（使用Emoji）
ctx.fillText('📋', sx - 5, sy - 16);

// 替换后（像素绘制）
function drawBoardIcon(ctx, sx, sy) {
  // 16×16像素公告板图标
  const icon = [
    "......GGGG......",
    "....GGGGGGGG....",
    "...GGGGGGGGGG...",
    "..GGWWWWWWWWGG..",
    "..GWWWWWWWWWWG..",
    "..GWWWWWWWWWWG..",
    "..GWWWWWWWWWWG..",
    "..GWWWWWWWWWWG..",
    "..GWWWWWWWWWWG..",
    "..GWWWWWWWWWWG..",
    "..GGWWWWWWWWGG..",
    "...GGGGGGGGGG...",
    "....GGGGGGGG....",
    "......GGGG......",
  ];
  // 渲染icon...
}
```

#### 步骤3：动画帧扩展

```typescript
// 玩家精灵帧数据（4帧行走）
const PLAYER_WALK_FRAMES = [
  // 帧0: 站立
  [...],
  // 帧1: 左步
  [...],
  // 帧2: 站立
  [...],
  // 帧3: 右步
  [...],
];

// 帧切换逻辑
const FRAME_DURATION = 6; // 每6帧切换（约100ms @ 60fps）
const walkFrame = Math.floor(frame / FRAME_DURATION) % 4;
```

### 5.3 质量验收标准

```
验收检查清单：
□ 所有精灵禁用抗锯齿（imageSmoothingEnabled = false）
□ 所有精灵使用纯像素绘制（无Emoji、无图标字体）
□ 玩家行走动画达到4帧
□ 怪物动画达到2帧以上
□ 宝箱具备3种可见状态
□ 水面动画达到4帧
□ 所有瓦片支持无缝拼接
□ 精灵轮廓使用单像素描边（非矩形拼凑）
□ 动画帧切换平滑无跳帧
□ 精灵高度不超过32像素（玩家）
□ 怪物高度不超过24像素
```

### 5.4 后续优化方向

1. **精灵表合并**：将所有精灵合并为一张Spritesheet，减少draw call
2. **GPU加速**：使用OffscreenCanvas预渲染静态精灵
3. **LOD系统**：根据缩放级别加载不同精度精灵
4. **调色板动画**：实现精灵颜色随游戏状态变化（如中毒变绿）
5. **粒子系统**：用Canvas像素粒子实现尘土/水花特效

---

## 附录A：完整调色板参考

```typescript
// 当前游戏调色板（完整版）
const PALETTE = {
  // 地形类
  grass: {
    outline: '#1a4010',
    dark: '#2d5a27',
    mid: '#4a8a37',
    light: '#6ab86a',
    highlight: '#8ada8a',
  },
  water: {
    outline: '#0a2a4a',
    dark: '#1a4a7a',
    mid: '#2a6aaa',
    light: '#4a9aca',
    shimmer: '#9adaee',
  },
  path: {
    dark: '#8a6a4a',
    mid: '#c9a86c',
    light: '#d4bc8a',
  },
  wall: {
    outline: '#3a3a4a',
    dark: '#5a5a6a',
    mid: '#8a8a9a',
    light: '#c0c0d0',
  },
  tree: {
    canopy: { dark: '#1a3a10', mid: '#2a5a20', light: '#3a7a2a', highlight: '#5a9a4a' },
    trunk: { dark: '#3a2010', mid: '#5a3020', light: '#7a4030' },
  },
  flower: {
    red: '#ff6a6a',
    yellow: '#ffca6a',
    blue: '#6a9aff',
    center: '#ffffff',
  },
  
  // 角色类
  player: {
    outline: '#000000',
    hatDark: '#C62828',
    hatLight: '#E53935',
    hatHighlight: '#EF5350',
    hairDark: '#F9A825',
    hairLight: '#FDD835',
    hairHighlight: '#FFEE58',
    skinBase: '#FFCC80',
    skinShadow: '#FFB74D',
    skinHighlight: '#FFE0B2',
    eyeWhite: '#FFFFFF',
    eyeIris: '#1565C0',
    eyePupil: '#0D47A1',
    clothDark: '#1565C0',
    clothMid: '#1976D2',
    clothLight: '#2196F3',
    clothHighlight: '#64B5F6',
    beltDark: '#F57F17',
    beltGold: '#FFD600',
    pantsDark: '#4E342E',
    pantsMid: '#5D4037',
    pantsLight: '#795548',
    bootDark: '#3E2723',
    bootMid: '#5D4037',
    bootLight: '#8D6E63',
  },
  
  // 怪物类
  slime: {
    outline: '#1B5E20',
    bodyDark: '#2E7D32',
    bodyMid: '#43A047',
    bodyLight: '#66BB6A',
    bodyHighlight: '#A5D6A7',
    eyeWhite: '#FFFFFF',
    eyeIris: '#1565C0',
    eyePupil: '#0D47A1',
    eliteGold: '#FFD700',
  },
  
  // 宝箱类
  chest: {
    outlineDark: '#3a2010',
    woodDark: '#5D4037',
    woodMid: '#795548',
    woodLight: '#A1887F',
    metalDark: '#546E7A',
    metalLight: '#90A4AE',
    gold: '#FFD600',
    goldHighlight: '#FFEA00',
  },
  
  // 特效类
  effect: {
    gold: '#FFD700',
    goldLight: '#FFEA00',
    white: '#FFFFFF',
    red: '#ff6b6b',
    blue: '#6a9aff',
    purple: '#9b59b6',
    green: '#2ecc71',
  },
};
```

---

*文档结束 | 如有疑问请联系像素美术设计组*
