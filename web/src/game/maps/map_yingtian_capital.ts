/**
 * 应天府皇城 (map_yingtian_capital)
 * 尚书省任务 JJC-20260407-009
 * 
 * 尺寸: 1000×800 (超大地图)
 * 类型: outdoor
 * 战斗: disabled (主城)
 * 性能: 必须实现viewport culling优化
 */

import { GameMap, TerrainType, NPC, Monster, MonsterSpawnPoint, Entry, NPCPosition } from './map.types';

// ============================================================================
// 地形生成 (1000×800)
// 使用程序化生成以节省空间
// ============================================================================

/**
 * 生成应天府皇城地形
 * 采用区域划分：宫门区、宫殿区、广场区、市集区
 */
function generateYingtianCapitalTerrain(): TerrainType[][] {
  const width = 1000;
  const height = 800;
  const terrain: TerrainType[][] = [];

  // 初始化为草地
  for (let y = 0; y < height; y++) {
    terrain[y] = [];
    for (let x = 0; x < width; x++) {
      terrain[y][x] = 0; // 草地
    }
  }

  // 辅助函数：绘制矩形区域
  const fillRect = (x1: number, y1: number, x2: number, y2: number, tile: TerrainType) => {
    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) {
        if (y >= 0 && y < height && x >= 0 && x < width) {
          terrain[y][x] = tile;
        }
      }
    }
  };

  const drawRect = (x1: number, y1: number, x2: number, y2: number, tile: TerrainType, thickness: number = 1) => {
    for (let t = 0; t < thickness; t++) {
      fillRect(x1 + t, y1 + t, x2 - t, y2 - t, tile);
    }
    // 填充内部为地板
    fillRect(x1 + thickness, y1 + thickness, x2 - thickness, y2 - thickness, 1);
  };

  // ================== 外城墙 ==================
  // 外城墙
  fillRect(0, 0, width - 1, 10, 2); // 上墙
  fillRect(0, height - 10, width - 1, height - 1, 2); // 下墙
  fillRect(0, 0, 10, height - 1, 2); // 左墙
  fillRect(width - 10, 0, width - 1, height - 1, 2); // 右墙

  // ================== 宫城区 (中央北部) ==================
  // 宫城墙
  fillRect(250, 50, 750, 60, 2); // 宫墙上边界
  fillRect(250, 350, 750, 360, 2); // 宫墙下边界
  fillRect(250, 50, 260, 360, 2); // 宫墙左边界
  fillRect(740, 50, 750, 360, 2); // 宫墙右边界

  // 宫殿主体 (太和殿)
  fillRect(400, 80, 600, 280, 2); // 宫殿外墙
  fillRect(410, 90, 590, 270, 1); // 宫殿内部
  
  // 宫殿装饰
  terrain[180][500] = 12; // 宝座位置

  // ================== 广场区 (中央) ==================
  // 御道 (南北向主路)
  fillRect(490, 360, 510, 700, 1);
  
  // 东西向主路
  fillRect(100, 520, 900, 540, 1);
  
  // 中央广场
  fillRect(450, 480, 550, 580, 1);

  // ================== 宫门区 ==================
  // 午门 (南门)
  fillRect(480, 355, 520, 365, 5); // 门洞
  
  // 东华门
  fillRect(745, 180, 755, 230, 5);
  
  // 西华门
  fillRect(245, 180, 255, 230, 5);

  // 神武门 (北门)
  fillRect(480, 45, 520, 55, 5);

  // ================== 市集区 (南部) ==================
  // 东市
  fillRect(80, 600, 280, 750, 1);
  drawRect(85, 605, 275, 745, 2); // 东市外墙
  
  // 西市
  fillRect(720, 600, 920, 750, 1);
  drawRect(725, 605, 915, 745, 2); // 西市外墙

  // 南市集
  fillRect(350, 620, 650, 780, 1);

  // ================== 建筑内部 ==================
  // 武器店 (东市内)
  fillRect(100, 630, 160, 700, 2);
  fillRect(125, 650, 135, 660, 5); // 门

  // 防具店
  fillRect(180, 630, 240, 700, 2);
  fillRect(205, 650, 215, 660, 5); // 门

  // 药店
  fillRect(100, 710, 160, 740, 2);
  fillRect(125, 720, 135, 730, 5); // 门

  // 旅馆
  fillRect(180, 710, 240, 740, 2);
  fillRect(205, 720, 215, 730, 5); // 门

  // 钱庄 (西市内)
  fillRect(740, 630, 800, 700, 2);
  fillRect(765, 650, 775, 660, 5); // 门

  // 裁缝铺
  fillRect(820, 630, 880, 700, 2);
  fillRect(845, 650, 855, 660, 5); // 门

  // 茶楼
  fillRect(740, 710, 800, 740, 2);
  fillRect(765, 720, 775, 730, 5); // 门

  // 客栈
  fillRect(820, 710, 880, 740, 2);
  fillRect(845, 720, 855, 730, 5); // 门

  // ================== 特殊区域 ==================
  // 皇家花园 (东北角)
  fillRect(800, 80, 950, 200, 0); // 草地
  // 树木
  for (let y = 90; y < 190; y += 20) {
    for (let x = 820; x < 940; x += 20) {
      if (Math.random() > 0.3) {
        terrain[y][x] = 4; // 树木
      }
    }
  }

  // 护卫营 (西北角)
  fillRect(60, 80, 200, 200, 1);
  drawRect(65, 85, 195, 195, 2);

  // 藏书阁 (东南角)
  fillRect(800, 400, 920, 520, 1);
  drawRect(805, 405, 915, 515, 2);
  fillRect(850, 450, 870, 470, 12); // 书架

  // ================== 装饰和道路 ==================
  // 连接各区域的道路
  fillRect(260, 200, 400, 210, 1); // 护卫营到宫殿
  fillRect(600, 200, 740, 210, 1); // 宫殿到花园
  fillRect(760, 400, 770, 520, 1); // 藏书阁通道
  fillRect(500, 540, 510, 600, 1); // 广场到南门
  fillRect(400, 540, 410, 600, 1); // 广场到东市
  fillRect(590, 540, 600, 600, 1); // 广场到西市

  // 桥梁 (护城河)
  fillRect(470, 15, 530, 45, 1); // 南门桥
  fillRect(470, height - 50, 530, height - 20, 1); // 北门桥

  // 护城河 (城墙外的水渠)
  fillRect(15, 15, width - 15, 35, 3); // 上护城河
  fillRect(15, height - 35, width - 15, height - 15, 3); // 下护城河
  fillRect(15, 15, 35, height - 15, 3); // 左护城河
  fillRect(width - 35, 15, width - 15, height - 15, 3); // 右护城河

  // 井口/装饰
  terrain[500][500] = 12;

  return terrain;
}

// ============================================================================
// NPC定义
// ============================================================================

export const yingtianCapitalNPCs: NPC[] = [
  // 城门守卫
  {
    id: 'npc_gate_guard_south',
    name: '守门侍卫',
    sprite: '🛡️',
    position: { x: 500, y: 370, z: 0, region: 'map_yingtian_capital' },
    level: 15,
    faction: '皇城守卫',
    dialogueEnabled: true,
    dialogue: [
      {
        id: 'gg1',
        speaker: '守门侍卫',
        content: '站住！皇城禁地，闲人免进。',
        nextNodeId: 'gg2',
      },
      {
        id: 'gg2',
        speaker: '守门侍卫',
        content: '...但若是来觐见皇上，请出示令牌。',
        choices: [
          { text: '我有令牌', nextNodeId: 'gg3' },
          { text: '我只是观光', nextNodeId: 'gg4' },
        ],
      },
      {
        id: 'gg3',
        speaker: '守门侍卫',
        content: '请进，愿陛下龙体安康。',
      },
      {
        id: 'gg4',
        speaker: '守门侍卫',
        content: '皇城广大，市集区可以自由游览。请勿擅闯宫殿区域。',
      },
    ],
    interactionType: 'dialogue',
    isHostile: false,
  },
  // 宫廷太监
  {
    id: 'npc_court_eunuch',
    name: '宫廷太监',
    sprite: '👤',
    position: { x: 500, y: 180, z: 0, region: 'map_yingtian_capital' },
    level: 10,
    faction: '皇宫内务',
    dialogueEnabled: true,
    dialogue: [
      {
        id: 'ce1',
        speaker: '宫廷太监',
        content: '哎呦，这位客官，太和殿可不是随便能进的。',
        nextNodeId: 'ce2',
      },
      {
        id: 'ce2',
        speaker: '宫廷太监',
        content: '有什么事可以先去市集区办，那边热闹。',
      },
    ],
    interactionType: 'dialogue',
    isHostile: false,
  },
  // 市集商人
  {
    id: 'npc_market_merchant',
    name: '皇城商人',
    sprite: '🧔',
    position: { x: 130, y: 670, z: 0, region: 'map_yingtian_capital' },
    level: 5,
    faction: '皇城商会',
    dialogueEnabled: true,
    dialogue: [
      {
        id: 'mm1',
        speaker: '皇城商人',
        content: '欢迎光临皇城东市！这里的货物可是全城最好的！',
        choices: [
          { text: '看看商品', nextNodeId: 'mm2' },
          { text: '有什么新鲜事？', nextNodeId: 'mm3' },
        ],
      },
      {
        id: 'mm2',
        speaker: '皇城商人',
        content: '请随便看，保证货真价实！',
      },
      {
        id: 'mm3',
        speaker: '皇城商人',
        content: '听说皇上最近在寻找稀有药材，悬赏可不低呢！',
      },
    ],
    interactionType: 'shop',
    shopItems: ['item_premium_sword', 'item_royal_armor', 'item_elixir'],
    isHostile: false,
  },
  // 卫兵队长
  {
    id: 'npc_guard_captain',
    name: '禁卫军统领',
    sprite: '⚔️',
    position: { x: 130, y: 140, z: 0, region: 'map_yingtian_capital' },
    level: 25,
    faction: '禁卫军',
    dialogueEnabled: true,
    dialogue: [
      {
        id: 'gc1',
        speaker: '禁卫军统领',
        content: '本统领负责皇城安全，非请勿入内！',
        nextNodeId: 'gc2',
      },
      {
        id: 'gc2',
        speaker: '禁卫军统领',
        content: '最近边境不太平，你们冒险者也要小心行事。',
      },
    ],
    interactionType: 'dialogue',
    isHostile: false,
  },
  // 图书馆管理员
  {
    id: 'npc_librarian',
    name: '皇家图书馆管理员',
    sprite: '📚',
    position: { x: 860, y: 460, z: 0, region: 'map_yingtian_capital' },
    level: 12,
    faction: '翰林院',
    dialogueEnabled: true,
    dialogue: [
      {
        id: 'lib1',
        speaker: '皇家图书馆管理员',
        content: '这里是皇家图书馆，收藏着天下典籍。',
        nextNodeId: 'lib2',
      },
      {
        id: 'lib2',
        speaker: '皇家图书馆管理员',
        content: '有借阅需求可以登记，但珍贵的孤本不可带出。',
      },
    ],
    interactionType: 'dialogue',
    isHostile: false,
  },
];

// ============================================================================
// NPC位置
// ============================================================================

export const yingtianCapitalNPCPositions: NPCPosition[] = yingtianCapitalNPCs.map(npc => ({
  npcId: npc.id,
  position: npc.position,
}));

// ============================================================================
// 入口定义
// ============================================================================

export const yingtianCapitalEntries: Entry[] = [
  {
    id: 'entry_capital_main',
    name: '应天府正门',
    position: { x: 500, y: 25, z: 0, region: 'map_yingtian_capital' },
    targetMapId: 'map_north_forest', // 暂时连接到北部森林
    targetPosition: { x: 150, y: 290, z: 0, region: 'map_north_forest' },
    entryType: 'gate',
    requiredLevel: 10,
    isLocked: false,
    isHidden: false,
  },
];

// ============================================================================
// 应天府皇城完整地图对象
// ============================================================================

export const mapYingtianCapital: GameMap = {
  id: 'map_yingtian_capital',
  name: '应天府皇城',
  description: '大宋皇城，天下的中心。城墙环绕，宫殿巍峨，市集繁华。皇城分为宫城区、广场区和市集区，气势恢宏，蔚为壮观。作为主城，此地为安全区，禁止战斗。',
  type: 'outdoor',
  width: 1000,
  height: 800,
  combatEnabled: false, // 主城，无战斗
  safeZone: true,
  terrain: generateYingtianCapitalTerrain(),
  npcs: yingtianCapitalNPCs,
  monsters: [], // 主城无怪物
  monsterSpawns: [],
  entries: yingtianCapitalEntries,
  portals: [],
  npcPositions: yingtianCapitalNPCPositions,
  region: {
    id: 'region_yingtian',
    name: '应天府区域',
    description: '大宋皇城，天下中心',
    dangerLevel: 'safe',
    pointsOfInterest: [
      { id: 'poi_taihe_palace', name: '太和殿', description: '皇上朝会的宫殿', position: { x: 500, y: 180, z: 0, region: 'map_yingtian_capital' }, type: 'landmark' },
      { id: 'poi_royal_square', name: '御前广场', description: '皇上接见群臣的地方', position: { x: 500, y: 530, z: 0, region: 'map_yingtian_capital' }, type: 'landmark' },
      { id: 'poi_wu_gate', name: '午门', description: '皇宫正门', position: { x: 500, y: 360, z: 0, region: 'map_yingtian_capital' }, type: 'landmark' },
      { id: 'poi_east_market', name: '东市', description: '繁华的商业区', position: { x: 180, y: 675, z: 0, region: 'map_yingtian_capital' }, type: 'shop' },
      { id: 'poi_west_market', name: '西市', description: '繁华的商业区', position: { x: 820, y: 675, z: 0, region: 'map_yingtian_capital' }, type: 'shop' },
      { id: 'poi_royal_garden', name: '皇家花园', description: '御花园，景色优美', position: { x: 875, y: 140, z: 0, region: 'map_yingtian_capital' }, type: 'landmark' },
      { id: 'poi_imperial_library', name: '皇家图书馆', description: '藏书阁', position: { x: 860, y: 460, z: 0, region: 'map_yingtian_capital' }, type: 'landmark' },
      { id: 'poi_guards_camp', name: '护卫营', description: '禁卫军驻地', position: { x: 130, y: 140, z: 0, region: 'map_yingtian_capital' }, type: 'landmark' },
    ],
  },
  dangerLevel: 'safe',
  recommendedLevel: 1,
  backgroundMusic: 'imperial_ambient.ogg',
  ambientSound: 'crowd_chatter.ogg',
  // 性能优化配置 - 大地图必须启用
  chunkSize: 16, // 分块大小
  tileSize: 32, // 瓦片尺寸
  renderDistance: 30, // 渲染距离（瓦片数）
  isPvPEnabled: false,
  isRestAllowed: true,
  tileset: 'imperial_tileset',
  minimapStyle: 'manual', // 手动控制小地图
  version: '1.0.0',
  lastUpdated: '2026-04-07',
};

export default mapYingtianCapital;
