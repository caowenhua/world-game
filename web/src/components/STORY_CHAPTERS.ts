// ============================================================
//  AI生成世界游戏 - 主线剧情章节
//  共40章，覆盖：新手引导、城镇探索、第一次外出、羊蹄山传说、BOSS挑战
// ============================================================

export interface StoryChoice {
  text: string;
  nextChapter: number;
  requirement?: string;
  effect?: {
    gold?: number;
    exp?: number;
    flag?: string;
  };
}

export interface StoryChapter {
  chapter: number;
  title: string;
  trigger: {
    type: 'location' | 'dialogue' | 'condition' | 'combat';
    value: string;
  };
  dialogue: {
    speaker: string;
    name?: string;
    content: string;
  }[];
  choices?: StoryChoice[];
  outcomes?: {
    choice: string;
    result: string;
    rewards?: { gold?: number; exp?: number; item?: string };
  }[];
}

export const STORY_CHAPTERS: StoryChapter[] = [
  // ============================================================
  // 第1章：新手引导结束，进入城镇
  // ============================================================
  {
    chapter: 1,
    title: '踏入边境',
    trigger: {
      type: 'location',
      value: '32-48, 28-44', // 城镇区域
    },
    dialogue: [
      { speaker: '旁白', content: '你踏过边境哨站的吊桥，终于来到了羊蹄山脚下的小镇。' },
      { speaker: '旁白', content: '这里是你冒险的起点——平和镇。街道两旁的木质建筑散发着温暖的气息。' },
      { speaker: '哨兵队长', name: '陈岳', content: '新来的冒险者？欢迎来到平和镇。' },
      { speaker: '哨兵队长', name: '陈岳', content: '在镇子里是安全的。出去打怪练级吧，但小心北边的森林。' },
    ],
    choices: [
      { text: '谢谢提醒，我这就去看看', nextChapter: 2, effect: { exp: 10 } },
      { text: '请问有什么任务吗？', nextChapter: 3 },
    ],
  },

  // ============================================================
  // 第2-5章：城镇探索，认识NPC
  // ============================================================
  {
    chapter: 2,
    title: '平和镇',
    trigger: {
      type: 'location',
      value: '32-48, 28-44',
    },
    dialogue: [
      { speaker: '旁白', content: '平和镇是一个宁静的小镇，居民们安居乐业。' },
      { speaker: '旁白', content: '镇子中央有一座古老的喷泉，据说已有千年历史。' },
      { speaker: '旁白', content: '你可以看到几个值得关注的地方：酒馆、悬赏公告板、还有神秘的石碑。' },
    ],
    choices: [
      { text: '去酒馆打听消息', nextChapter: 4 },
      { text: '看看悬赏公告板', nextChapter: 5 },
      { text: '去调查神秘石碑', nextChapter: 6 },
    ],
  },
  {
    chapter: 3,
    title: '陈岳的忠告',
    trigger: {
      type: 'dialogue',
      value: '陈岳',
    },
    dialogue: [
      { speaker: '哨兵队长', name: '陈岳', content: '任务？最近确实有些麻烦。' },
      { speaker: '哨兵队长', name: '陈岳', content: '北边的森林里出现了大量哥布林，它们骚扰我们的商队。' },
      { speaker: '哨兵队长', name: '陈岳', content: '如果你能解决它们，我可以给你一些奖励。' },
    ],
    choices: [
      { text: '接受任务：清剿哥布林', nextChapter: 7, effect: { flag: 'quest_goblin' } },
      { text: '婉拒，先四处看看', nextChapter: 2 },
    ],
  },
  {
    chapter: 4,
    title: '边境酒馆',
    trigger: {
      type: 'location',
      value: '酒馆',
    },
    dialogue: [
      { speaker: '酒馆老板', name: '老刘', content: '欢迎光临！来杯麦酒暖暖身子吧。' },
      { speaker: '酒馆老板', name: '老刘', content: '最近生意不太好，哥布林闹得凶，商人都少多了。' },
      { speaker: '神秘浪人', name: '???', content: '......' },
      { speaker: '旁白', content: '角落里坐着一个沉默的浪人，他的眼神深邃，似乎在思考着什么。' },
    ],
    choices: [
      { text: '上前搭话', nextChapter: 8 },
      { text: '向老板打听浪人的来历', nextChapter: 9 },
      { text: '离开酒馆', nextChapter: 2 },
    ],
  },
  {
    chapter: 5,
    title: '悬赏公告板',
    trigger: {
      type: 'location',
      value: '公告板',
    },
    dialogue: [
      { speaker: '旁白', content: '悬赏公告板上贴满了各种委托。' },
      { speaker: '旁白', content: '【紧急】哥布林骚扰商队，消灭10只，赏金500金币！' },
      { speaker: '旁白', content: '【精英】精英灰狼出现在北部森林，击败它可获得稀有物品！' },
      { speaker: '旁白', content: '【传说】羊蹄山深处有异变，查明原因者重赏！' },
    ],
    choices: [
      { text: '接取哥布林悬赏', nextChapter: 7, effect: { flag: 'quest_goblin' } },
      { text: '接取精英灰狼悬赏', nextChapter: 10, effect: { flag: 'quest_wolf' } },
      { text: '暂不接取，先探索', nextChapter: 2 },
    ],
  },

  // ============================================================
  // 第6-10章：第一次外出，遭遇战斗
  // ============================================================
  {
    chapter: 6,
    title: '古老石碑',
    trigger: {
      type: 'location',
      value: '古老石碑',
    },
    dialogue: [
      { speaker: '旁白', content: '一块刻满古老符文的石碑矗立在镇子边缘。' },
      { speaker: '旁白', content: '符文已经模糊，但你隐约能感受到一股神秘的力量。' },
      { speaker: '神秘声音', content: '觉醒者......羊蹄山之魂在呼唤你。' },
      { speaker: '旁白', content: '你感到一阵眩晕，似乎有什么东西在你体内苏醒。' },
    ],
    choices: [
      { text: '触碰石碑', nextChapter: 11, effect: { exp: 50, flag: 'awakening' } },
      { text: '后退一步，保持警惕', nextChapter: 2 },
    ],
  },
  {
    chapter: 7,
    title: '初战哥布林',
    trigger: {
      type: 'combat',
      value: 'goblin',
    },
    dialogue: [
      { speaker: '旁白', content: '你深入北部森林，发现了一群哥布林的营地。' },
      { speaker: '哥布林', name: '哥布林哨兵', content: '嘎嘎！入侵者！攻击！' },
      { speaker: '旁白', content: '第一场真正的战斗开始了！使用J键攻击，Space键闪避！' },
    ],
    outcomes: [
      { choice: '击败哥布林', result: '你干净利落地解决了哥布林哨兵，获得了经验值。' },
      { choice: '被哥布林击中', result: '哥布林的木棒打在你身上，虽然疼痛但你咬牙坚持。' },
    ],
  },
  {
    chapter: 8,
    title: '神秘浪人',
    trigger: {
      type: 'dialogue',
      value: '浪人',
    },
    dialogue: [
      { speaker: '你', content: '你好，我是新来的冒险者。' },
      { speaker: '神秘浪人', name: '林夜', content: '......' },
      { speaker: '神秘浪人', name: '林夜', content: '新来的？羊蹄山最近不太平静。' },
      { speaker: '神秘浪人', name: '林夜', content: '如果你听到古老石碑的呼唤......来找我。' },
      { speaker: '旁白', content: '说完，浪人便消失在夜色中。' },
    ],
    choices: [
      { text: '追上去问清楚', nextChapter: 12, effect: { flag: 'know_linye' } },
      { text: '算了，可能是疯子', nextChapter: 2 },
    ],
  },
  {
    chapter: 9,
    title: '酒馆老板的透露',
    trigger: {
      type: 'dialogue',
      value: '老刘',
    },
    dialogue: [
      { speaker: '酒馆老板', name: '老刘', content: '那个浪人啊？他叫林夜，已经在这住了三个月了。' },
      { speaker: '酒馆老板', name: '老刘', content: '没人知道他从哪来，只知道他每天晚上都会去镇外的石碑那里。' },
      { speaker: '酒馆老板', name: '老刘', content: '有人说他是初代觉醒者的后裔......但谁知道呢？' },
    ],
    choices: [
      { text: '去石碑看看', nextChapter: 6 },
      { text: '继续喝酒，打听其他消息', nextChapter: 2 },
    ],
  },
  {
    chapter: 10,
    title: '精英灰狼',
    trigger: {
      type: 'combat',
      value: 'wolf_elite',
    },
    dialogue: [
      { speaker: '旁白', content: '在森林深处，你遭遇了一只体型巨大的灰狼。' },
      { speaker: '旁白', content: '它的眼睛闪烁着红色的光芒——这是一只精英怪物！' },
      { speaker: '精英灰狼', content: '嗷呜——！' },
      { speaker: '旁白', content: '精英怪比普通怪物强得多，小心应对！' },
    ],
    outcomes: [
      { choice: '击败精英灰狼', result: '你费尽全力终于击败了精英灰狼，获得珍贵掉落！', rewards: { gold: 100, exp: 80 } },
      { choice: '苦战险胜', result: '这是一场艰难的战斗，你的技巧有所提升。', rewards: { exp: 50 } },
    ],
  },

  // ============================================================
  // 第11-20章：深入主线（羊蹄山的传说）
  // ============================================================
  {
    chapter: 11,
    title: '觉醒',
    trigger: {
      type: 'condition',
      value: 'awakening',
    },
    dialogue: [
      { speaker: '旁白', content: '你的手指触碰到石碑的瞬间，一道光芒将你包围。' },
      { speaker: '神秘声音', content: '觉醒者......你终于来了。' },
      { speaker: '神秘声音', content: '千年前的契约，等待你来终结。' },
      { speaker: '旁白', content: '你感到体内有什么东西被唤醒——那是觉醒者的血脉！' },
      { speaker: '林夜', content: '我就知道......你果然是觉醒者。' },
    ],
    choices: [
      { text: '你是什么人？', nextChapter: 13 },
      { text: '什么是觉醒者？', nextChapter: 14 },
    ],
  },
  {
    chapter: 12,
    title: '林夜的真相',
    trigger: {
      type: 'condition',
      value: 'know_linye',
    },
    dialogue: [
      { speaker: '林夜', content: '你追上来了......也好。' },
      { speaker: '林夜', content: '我是虚渊教的叛徒。当年我见证了太多牺牲......' },
      { speaker: '林夜', content: '羊蹄山封印正在崩溃，必须有人继承觉醒者的力量。' },
      { speaker: '林夜', content: '而你......被石碑选中的人。' },
    ],
    choices: [
      { text: '我会保护这个世界', nextChapter: 15, effect: { exp: 30, flag: 'ally_linye' } },
      { text: '我需要更多信息', nextChapter: 16 },
    ],
  },
  {
    chapter: 13,
    title: '林夜的身份',
    trigger: {
      type: 'dialogue',
      value: '林夜',
    },
    dialogue: [
      { speaker: '林夜', content: '我叫林夜，虚渊教的叛徒。' },
      { speaker: '林夜', content: '十年前，我亲眼看着师父被虚渊古神吞噬......' },
      { speaker: '林夜', content: '从那以后，我就在寻找新的觉醒者。' },
      { speaker: '林夜', content: '羊蹄山封印正在崩溃，只有觉醒者才能阻止。' },
    ],
    choices: [
      { text: '我愿意承担这个责任', nextChapter: 15, effect: { flag: 'ally_linye' } },
      { text: '虚渊教是什么组织？', nextChapter: 17 },
    ],
  },
  {
    chapter: 14,
    title: '觉醒者的传说',
    trigger: {
      type: 'condition',
      value: 'awakening',
    },
    dialogue: [
      { speaker: '林夜', content: '觉醒者......是唯一能对抗虚渊古神的人类。' },
      { speaker: '林夜', content: '千年前，初代觉醒者用生命封印了虚渊。' },
      { speaker: '林夜', content: '但封印不会永远持续......每一代觉醒者都要重新加固它。' },
      { speaker: '林夜', content: '而你，就是这一代的觉醒者。' },
    ],
    choices: [
      { text: '我明白了，告诉我该怎么做', nextChapter: 18 },
      { text: '在此之前，我需要变得更强', nextChapter: 2 },
    ],
  },
  {
    chapter: 15,
    title: '誓约',
    trigger: {
      type: 'condition',
      value: 'ally_linye',
    },
    dialogue: [
      { speaker: '林夜', content: '好......既然你愿意承担，我会指引你。' },
      { speaker: '林夜', content: '首先，你需要在羊蹄山收集「觉醒者碎片」。' },
      { speaker: '林夜', content: '击败虚渊教的怪物，它们会掉落碎片。' },
      { speaker: '林夜', content: '集齐五片后，来找我。我会告诉你下一步。' },
    ],
    choices: [
      { text: '我会尽快收集碎片', nextChapter: 19, effect: { flag: 'quest_shards' } },
    ],
  },
  {
    chapter: 16,
    title: '追猎开始',
    trigger: {
      type: 'condition',
      value: 'know_linye',
    },
    dialogue: [
      { speaker: '林夜', content: '你需要知道的一切，日后你会明白。' },
      { speaker: '林夜', content: '现在，去变得更强吧。虚渊的爪牙不会等你。' },
      { speaker: '旁白', content: '林夜的身影消失在月光中。' },
      { speaker: '旁白', content: '你感到肩上的责任沉甸甸的......但你不会退缩。' },
    ],
    choices: [
      { text: '继续在镇上准备', nextChapter: 2 },
      { text: '直接去羊蹄山探索', nextChapter: 20 },
    ],
  },
  {
    chapter: 17,
    title: '虚渊教',
    trigger: {
      type: 'dialogue',
      value: '林夜',
    },
    dialogue: [
      { speaker: '林夜', content: '虚渊教......是一群被虚渊古神控制的疯子。' },
      { speaker: '林夜', content: '他们相信献祭人类可以换取古神的力量。' },
      { speaker: '林夜', content: '十年前，他们袭击了我们的村庄......师父为了保护我而死。' },
      { speaker: '林夜', content: '我不会让历史重演。' },
    ],
    choices: [
      { text: '我会和你一起战斗', nextChapter: 15, effect: { flag: 'ally_linye' } },
      { text: '虚渊教的首领是谁？', nextChapter: 21 },
    ],
  },
  {
    chapter: 18,
    title: '觉醒者之路',
    trigger: {
      type: 'condition',
      value: 'awakening',
    },
    dialogue: [
      { speaker: '林夜', content: '第一步：收集觉醒者碎片。' },
      { speaker: '林夜', content: '它们藏在虚渊怪物体内。我会告诉你具体位置。' },
      { speaker: '林夜', content: '第二步：找到羊蹄山之巅的祭坛。' },
      { speaker: '林夜', content: '第三步：......完成师父未竟的事业。' },
    ],
    choices: [
      { text: '明白了，我这就出发', nextChapter: 19, effect: { flag: 'quest_shards' } },
    ],
  },
  {
    chapter: 19,
    title: '碎片狩猎',
    trigger: {
      type: 'condition',
      value: 'quest_shards',
    },
    dialogue: [
      { speaker: '旁白', content: '你开始四处征战，讨伐虚渊教的怪物。' },
      { speaker: '旁白', content: '哥布林、灰狼、亡灵......一个个倒在你剑下。' },
      { speaker: '旁白', content: '随着战斗，你的经验越来越丰富，力量也在增长。' },
      { speaker: '旁白', content: '终于，你收集齐了五片觉醒者碎片！' },
    ],
    choices: [
      { text: '去找林夜', nextChapter: 22, effect: { exp: 100, flag: 'shards_complete' } },
    ],
  },
  {
    chapter: 20,
    title: '羊蹄山入口',
    trigger: {
      type: 'location',
      value: '羊蹄山入口',
    },
    dialogue: [
      { speaker: '旁白', content: '羊蹄山巍峨耸立，云雾缭绕。' },
      { speaker: '旁白', content: '传说山中有古代遗迹，也有很多强大的怪物。' },
      { speaker: '旁白', content: '进山的小路被茂密的树林遮蔽，但隐约可见一条被踩出来的小径。' },
    ],
    choices: [
      { text: '直接进山', nextChapter: 23 },
      { text: '先在山脚收集情报', nextChapter: 24 },
    ],
  },

  // ============================================================
  // 第21-40章：冒险升级，挑战BOSS
  // ============================================================
  {
    chapter: 21,
    title: '亡灵巫妖',
    trigger: {
      type: 'combat',
      value: 'lich',
    },
    dialogue: [
      { speaker: '旁白', content: '在羊蹄山的深处，你遭遇了一个可怕的敌人。' },
      { speaker: '亡灵巫妖', content: '又一个来送死的......觉醒者的血，味道真好。' },
      { speaker: '旁白', content: '这是你遇到过最强的敌人！小心它的魔法攻击！' },
    ],
    outcomes: [
      { choice: '击败亡灵巫妖', result: '艰难的战斗之后，亡灵巫妖倒下了。', rewards: { exp: 200, gold: 300 } },
    ],
  },
  {
    chapter: 22,
    title: '碎片合一',
    trigger: {
      type: 'condition',
      value: 'shards_complete',
    },
    dialogue: [
      { speaker: '林夜', content: '你做到了......五片碎片都在这里。' },
      { speaker: '林夜', content: '现在，把它们放在石碑上。' },
      { speaker: '旁白', content: '五片碎片发出耀眼光芒，融合在一起。' },
      { speaker: '旁白', content: '你感到力量在体内涌动——这是觉醒者的完全形态！' },
    ],
    choices: [
      { text: '我准备好了', nextChapter: 25, effect: { exp: 150, flag: 'awakening_complete' } },
    ],
  },
  {
    chapter: 23,
    title: '山中遭遇',
    trigger: {
      type: 'location',
      value: '羊蹄山',
    },
    dialogue: [
      { speaker: '旁白', content: '你深入羊蹄山，四周越来越荒凉。' },
      { speaker: '旁白', content: '奇怪的符文浮现在岩石上，空气中弥漫着腐败的气息。' },
      { speaker: '黑暗骑士', content: '入侵者......死！' },
      { speaker: '旁白', content: '虚渊教的黑暗骑士拦住了你的去路！' },
    ],
    outcomes: [
      { choice: '击败黑暗骑士', result: '你击败了黑暗骑士，继续深入。' },
    ],
  },
  {
    chapter: 24,
    title: '山脚的老人',
    trigger: {
      type: 'dialogue',
      value: '老猎人',
    },
    dialogue: [
      { speaker: '老猎人', name: '老猎人', content: '年轻人，羊蹄山不是随便能进的。' },
      { speaker: '老猎人', name: '老猎人', content: '我在这山里住了六十年，见证了太多人进去没出来。' },
      { speaker: '老猎人', name: '老猎人', content: '如果你一定要去......小心山腰的迷雾，那里有陷阱。' },
      { speaker: '老猎人', name: '老猎人', content: '还有......山顶的祭坛，千万别破坏封印石。' },
    ],
    choices: [
      { text: '多谢老人家提醒', nextChapter: 23 },
      { text: '关于封印石，你知道多少？', nextChapter: 26 },
    ],
  },
  {
    chapter: 25,
    title: '觉醒者之力',
    trigger: {
      type: 'condition',
      value: 'awakening_complete',
    },
    dialogue: [
      { speaker: '旁白', content: '碎片的力量在你体内完美融合。' },
      { speaker: '旁白', content: '你的感知变得敏锐，能看到普通人看不到的东西。' },
      { speaker: '旁白', content: '你能感受到虚渊的气息——它们就在羊蹄山深处。' },
      { speaker: '林夜', content: '现在，你有了与虚渊对抗的力量。' },
      { speaker: '林夜', content: '是时候去终结这一切了......羊蹄山之巅见。' },
    ],
    choices: [
      { text: '出发去羊蹄山', nextChapter: 27 },
    ],
  },
  {
    chapter: 26,
    title: '封印的真相',
    trigger: {
      type: 'dialogue',
      value: '老猎人',
    },
    dialogue: [
      { speaker: '老猎人', name: '老猎人', content: '封印石......那是千年前初代觉醒者留下的。' },
      { speaker: '老猎人', name: '老猎人', content: '听说需要觉醒者的血才能激活......也需要觉醒者的血才能破坏。' },
      { speaker: '老猎人', name: '老猎人', content: '如果封印破了......虚渊就会完全释放出来。' },
      { speaker: '老猎人', name: '老猎人', content: '所以年轻人在山里要小心，别碰不该碰的东西。' },
    ],
    choices: [
      { text: '我会保护封印', nextChapter: 23 },
    ],
  },
  {
    chapter: 27,
    title: '迷雾森林',
    trigger: {
      type: 'location',
      value: '迷雾',
    },
    dialogue: [
      { speaker: '旁白', content: '你进入了山腰的迷雾区域。' },
      { speaker: '旁白', content: '白色的浓雾让你几乎看不见前方，方向感完全丧失。' },
      { speaker: '旁白', content: '你听到周围有奇怪的声音......是虚渊的爪牙！' },
    ],
    choices: [
      { text: '小心前进', nextChapter: 28 },
      { text: '用觉醒者的感知探路', nextChapter: 29, effect: { flag: 'sense_used' } },
    ],
  },
  {
    chapter: 28,
    title: '突围',
    trigger: {
      type: 'combat',
      value: 'shadow',
    },
    dialogue: [
      { speaker: '旁白', content: '黑影从迷雾中窜出——是虚渊的影子生物！' },
      { speaker: '影子生物', content: '嘶嘶嘶......' },
      { speaker: '旁白', content: '它们没有实体，普通攻击效果不佳！' },
    ],
    outcomes: [
      { choice: '用觉醒之力攻击', result: '你的觉醒之力灼烧了影子生物！', rewards: { exp: 100 } },
    ],
  },
  {
    chapter: 29,
    title: '觉醒者感知',
    trigger: {
      type: 'condition',
      value: 'sense_used',
    },
    dialogue: [
      { speaker: '旁白', content: '你闭上眼睛，激活觉醒者的感知。' },
      { speaker: '旁白', content: '迷雾在你的感知中变得透明，路径清晰可见。' },
      { speaker: '旁白', content: '你还发现了隐藏在暗处的敌人——虚渊教成员！' },
      { speaker: '虚渊信徒', content: '发现觉醒者了！包围他！' },
    ],
    choices: [
      { text: '正面突破', nextChapter: 30 },
      { text: '绕道避开', nextChapter: 31 },
    ],
  },
  {
    chapter: 30,
    title: '激战虚渊信徒',
    trigger: {
      type: 'combat',
      value: 'cultist',
    },
    dialogue: [
      { speaker: '旁白', content: '虚渊信徒们围了上来，他们眼中闪烁着疯狂的光芒。' },
      { speaker: '虚渊信徒', content: '觉醒者的血......主人会很高兴的！' },
    ],
    outcomes: [
      { choice: '击败所有信徒', result: '你击退了虚渊信徒，但有人逃走了。' },
    ],
  },
  {
    chapter: 31,
    title: '隐秘通道',
    trigger: {
      type: 'location',
      value: 'secret_path',
    },
    dialogue: [
      { speaker: '旁白', content: '你绕道而行，发现了一条隐秘的山间小道。' },
      { speaker: '旁白', content: '这条小路似乎很少有人走过，但能直通山顶。' },
      { speaker: '旁白', content: '沿着小路，你看到了古老的石阶——通往祭坛的路。' },
    ],
    choices: [
      { text: '沿着石阶前进', nextChapter: 32 },
    ],
  },
  {
    chapter: 32,
    title: '祭坛之前',
    trigger: {
      type: 'location',
      value: '祭坛',
    },
    dialogue: [
      { speaker: '旁白', content: '你终于到达了羊蹄山之巅。' },
      { speaker: '旁白', content: '古老的祭坛矗立在山顶中央，散发着神秘的光芒。' },
      { speaker: '旁白', content: '封印石就在祭坛之上，裂纹已经越来越多......' },
      { speaker: '黑影', content: '你终于来了，觉醒者。' },
    ],
    choices: [
      { text: '你是谁？', nextChapter: 33 },
    ],
  },
  {
    chapter: 33,
    title: '黑影现身',
    trigger: {
      type: 'dialogue',
      value: '黑影',
    },
    dialogue: [
      { speaker: '黑影', content: '我是虚渊的使者......或者说，虚渊本身的一部分。' },
      { speaker: '黑影', content: '千年前你封印了我，但封印正在崩溃。' },
      { speaker: '黑影', content: '再过不久，我就会完全苏醒......' },
      { speaker: '黑影', content: '届时，这个世界将被虚渊吞噬！' },
    ],
    choices: [
      { text: '我不会让你得逞', nextChapter: 34 },
    ],
  },
  {
    chapter: 34,
    title: '最终决战前',
    trigger: {
      type: 'condition',
      value: 'awakening_complete',
    },
    dialogue: [
      { speaker: '林夜', content: '你来了......我等了很久。' },
      { speaker: '林夜', content: '黑影就是虚渊古神的本体。击败它，封印就能修复。' },
      { speaker: '林夜', content: '但它非常强大......我们需要一起战斗。' },
      { speaker: '旁白', content: '林夜站在你身旁，与你并肩作战。' },
    ],
    choices: [
      { text: '我们一起上！', nextChapter: 35 },
    ],
  },
  {
    chapter: 35,
    title: '虚渊古神',
    trigger: {
      type: 'combat',
      value: 'final_boss',
    },
    dialogue: [
      { speaker: '旁白', content: '虚渊古神的本体从黑暗中显现......' },
      { speaker: '旁白', content: '那是一个由黑影和混沌构成的巨大存在。' },
      { speaker: '虚渊古神', content: '渺小的凡人......你们无法阻止命运！' },
      { speaker: '旁白', content: '这是最终决战！用你所有的力量！' },
    ],
    outcomes: [
      { choice: '全力攻击', result: '你和林夜并肩作战，与虚渊古神展开殊死搏斗！' },
    ],
  },
  {
    chapter: 36,
    title: '觉醒者的牺牲',
    trigger: {
      type: 'condition',
      value: 'boss_fight',
    },
    dialogue: [
      { speaker: '旁白', content: '战斗进入白热化阶段......' },
      { speaker: '旁白', content: '林夜被虚渊古神击中，身受重伤！' },
      { speaker: '林夜', content: '坚持住......把力量灌入封印石！' },
      { speaker: '林夜', content: '用我的血......完成最后的仪式！' },
    ],
    choices: [
      { text: '林夜！坚持住！', nextChapter: 37 },
    ],
  },
  {
    chapter: 37,
    title: '封印修复',
    trigger: {
      type: 'condition',
      value: 'awakening_complete',
    },
    dialogue: [
      { speaker: '旁白', content: '林夜将自己的血洒在封印石上。' },
      { speaker: '旁白', content: '你的觉醒之力与封印石共鸣......' },
      { speaker: '旁白', content: '光芒四射，虚渊古神发出痛苦的嘶吼！' },
      { speaker: '虚渊古神', content: '不......这不可能！千年之力......！' },
    ],
    choices: [
      { text: '一起封印它！', nextChapter: 38 },
    ],
  },
  {
    chapter: 38,
    title: '虚渊的败亡',
    trigger: {
      type: 'combat',
      value: 'final_boss',
    },
    dialogue: [
      { speaker: '旁白', content: '在觉醒之力和封印石的双重作用下......' },
      { speaker: '旁白', content: '虚渊古神的身体开始崩解！' },
      { speaker: '虚渊古神', content: '可恶的觉醒者......我们还会再见的......' },
      { speaker: '旁白', content: '虚渊古神被重新封印回深渊之中......' },
    ],
    outcomes: [
      { choice: '胜利！', result: '虚渊古神被封印，世界得救了！' },
    ],
  },
  {
    chapter: 39,
    title: '新的开始',
    trigger: {
      type: 'condition',
      value: 'victory',
    },
    dialogue: [
      { speaker: '林夜', content: '我们......做到了......' },
      { speaker: '旁白', content: '林夜微笑着倒下，他的生命正在消逝......' },
      { speaker: '林夜', content: '师父......我终于......完成您的遗愿了......' },
      { speaker: '林夜', content: '年轻人......这个世界......交给你了......' },
      { speaker: '旁白', content: '林夜安详地闭上了眼睛，嘴角带着微笑。' },
    ],
    choices: [
      { text: '......', nextChapter: 40 },
    ],
  },
  {
    chapter: 40,
    title: '尾声',
    trigger: {
      type: 'condition',
      value: 'ending',
    },
    dialogue: [
      { speaker: '旁白', content: '羊蹄山恢复了往日的宁静。' },
      { speaker: '旁白', content: '虚渊的威胁暂时解除，但你知道......这只是开始。' },
      { speaker: '旁白', content: '古神的预言回荡在你耳边：「我们还会再见的......」' },
      { speaker: '旁白', content: '你站在平和镇的广场上，望着远方。' },
      { speaker: '旁白', content: '新的冒险在等待着你。而你，已经准备好了。' },
      { speaker: '旁白', content: '—— 第一章 · 完 ——' },
    ],
    choices: [
      { text: '继续冒险', nextChapter: 1, effect: { exp: 500, gold: 1000 } },
    ],
  },
];

export default STORY_CHAPTERS;
