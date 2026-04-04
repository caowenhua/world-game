package game

// CharacterProfile 角色完整资料
type CharacterProfile struct {
	ID          string   `json:"id"`
	Name        string   `json:"name"`          // 显示名
	Title       string   `json:"title"`         // 称号
	PortraitBG  string   `json:"portrait_bg"`   // 头像背景色
	PortraitFG  string   `json:"portrait_fg"`   // 头像边框色
	PortraitLtr string   `json:"portrait_ltr"`  // 头像字母
	Description string   `json:"description"`   // 一句话介绍
	Alignment   string   `json:"alignment"`     // 阵营：善良/中立/灰色/邪恶
	Role        string   `json:"role"`          // 角色定位
	FirstMeet   string   `json:"first_meet"`   // 初次登场地点
	Tags        []string `json:"tags"`          // 标签
}

// DialogueEntry 单条对话
type DialogueEntry struct {
	Speaker     string   `json:"speaker"`      // 说话者ID
	Content     string   `json:"content"`      // 对话内容
	Emotion     string   `json:"emotion"`      // 情绪：normal/eerie/happy/angry/sad/warning
	ShowChoice  bool     `json:"show_choice"`  // 是否显示选项
	Choices     []Choice `json:"choices,omitempty"`
}

// Choice 选项
type Choice struct {
	Text      string `json:"text"`       // 选项文本
	NextID    string `json:"next_id"`    // 下一段对话ID
	Condition string `json:"condition"`  // 触发条件
	GainItem  string `json:"gain_item"`  // 获得物品
	GainQuest string `json:"gain_quest"` // 接取任务
	Flag      string `json:"flag"`       // 设置标记
}

// DialogueSection 章节对话集
type DialogueSection struct {
	Chapter    int              `json:"chapter"`     // 章节号
	Title      string            `json:"title"`       // 章节标题
	Location   string            `json:"location"`    // 触发地点
	Trigger    string            `json:"trigger"`     // 触发条件
	Dialogues  []DialogueEntry   `json:"dialogues"`   // 对话列表
	Conditions []string          `json:"conditions"`  // 解锁条件
}

// AllCharacterProfiles 所有角色资料
var AllCharacterProfiles = map[string]CharacterProfile{
	"chen_yue": {
		ID:          "chen_yue",
		Name:         "陈岳",
		Title:        "边境哨兵队长",
		PortraitBG:   "#1a365d",
		PortraitFG:   "#60a5fa",
		PortraitLtr:  "CY",
		Description:  "沉默寡言的老兵，守护边境二十年的守望者",
		Alignment:    "善良",
		Role:         "引路人",
		FirstMeet:    "border_outpost",
		Tags:         []string{"哨站", "任务", "情报", "主线"},
	},
	"su_waner": {
		ID:          "su_waner",
		Name:         "苏婉儿",
		Title:        "迷雾孤女",
		PortraitBG:   "#7c3aed",
		PortraitFG:   "#c4b5fd",
		PortraitLtr:  "SW",
		Description:  "被狼群养大的孤儿，能看见常人看不见的东西",
		Alignment:    "善良",
		Role:         "灵魂向导",
		FirstMeet:    "misty_forest",
		Tags:         []string{"森林", "灵魂", "隐藏剧情", "转世"},
	},
	"lao_lieren": {
		ID:          "lao_lieren",
		Name:         "顾渊",
		Title:        "老猎人",
		PortraitBG:   "#065f46",
		PortraitFG:   "#34d399",
		PortraitLtr:  "LL",
		Description:  "迷雾森林的隐士，千年前初代觉醒者的徒弟",
		Alignment:    "善良",
		Role:         "真相揭示者",
		FirstMeet:    "hunter_cabin",
		Tags:         []string{"森林", "遗书", "真相", "主线"},
	},
	"heiying": {
		ID:          "heiying",
		Name:         "黑影",
		Title:        "影子首领",
		PortraitBG:   "#1f2937",
		PortraitFG:   "#6b7280",
		PortraitLtr:  "HY",
		Description:  "神秘组织的首领，情报的王者，危险的盟友",
		Alignment:    "中立",
		Role:         "情报商",
		FirstMeet:    "border_town",
		Tags:         []string{"影子", "情报", "交易", "谜语"},
	},
	"tie_mian": {
		ID:          "tie_mian",
		Name:         "铁面",
		Title:        "赏金猎人",
		PortraitBG:   "#92400e",
		PortraitFG:   "#fbbf24",
		PortraitLtr:  "TM",
		Description:  "冷酷无情的赏金猎人，为复仇而活的男人",
		Alignment:    "灰色",
		Role:         "战斗同伴",
		FirstMeet:    "border_town",
		Tags:         []string{"赏金", "复仇", "战斗", "妹妹"},
	},
	"honghu": {
		ID:          "honghu",
		Name:         "红狐",
		Title:        "海贼首领",
		PortraitBG:   "#991b1b",
		PortraitFG:   "#f87171",
		PortraitLtr:  "HH",
		Description:  "亦正亦邪的海贼女王，真实身份是流亡公主",
		Alignment:    "灰色",
		Role:         "海上盟友",
		FirstMeet:    "port_city",
		Tags:         []string{"海贼", "公主", "海上", "复仇"},
	},
	"mo_qingshu": {
		ID:          "mo_qingshu",
		Name:         "莫青书",
		Title:        "国师",
		PortraitBG:   "#581c87",
		PortraitFG:   "#c084fc",
		PortraitLtr:  "MQ",
		Description:  "权倾朝野的国师，千年阴谋的幕后黑手",
		Alignment:    "邪恶",
		Role:         "主要反派",
		FirstMeet:    "royal_palace",
		Tags:         []string{"王城", "反派", "虚渊", "延寿"},
	},
	"yueying": {
		ID:          "yueying",
		Name:         "月影",
		Title:        "公会顾问",
		PortraitBG:   "#0f766e",
		PortraitFG:   "#2dd4bf",
		PortraitLtr:  "YY",
		Description:  "冒险者公会的神秘顾问，真实身份成谜",
		Alignment:    "善良",
		Role:         "隐藏盟友",
		FirstMeet:    "adventurer_guild",
		Tags:         []string{"公会", "隐藏", "情报", "真实身份"},
	},
	"alian_zu": {
		ID:          "alian_zu",
		Name:         "阿莲娜",
		Title:        "丛林巫医",
		PortraitBG:   "#15803d",
		PortraitFG:   "#86efac",
		PortraitLtr:  "AL",
		Description:  "丛林部落的巫医，能感应灵魂的存在",
		Alignment:    "善良",
		Role:         "灵魂向导",
		FirstMeet:    "jungle_tribe",
		Tags:         []string{"丛林", "巫医", "灵魂", "姐姐"},
	},
	"han_feng": {
		ID:          "han_feng",
		Name:         "韩风",
		Title:        "公会会长",
		PortraitBG:   "#1e3a5f",
		PortraitFG:   "#38bdf8",
		PortraitLtr:  "HF",
		Description:  "冒险者公会的会长，曾经的传奇猎人",
		Alignment:    "中立",
		Role:         "任务发布",
		FirstMeet:    "adventurer_guild",
		Tags:         []string{"公会", "任务", "情报", "北境"},
	},
	"ming_yue": {
		ID:          "ming_yue",
		Name:         "明月",
		Title:        "皇城顾问",
		PortraitBG:   "#312e81",
		PortraitFG:   "#818cf8",
		PortraitLtr:  "MY",
		Description:  "皇城中最神秘的存在，知道所有真相的人",
		Alignment:    "善良",
		Role:         "真相揭示者",
		FirstMeet:    "royal_capital",
		Tags:         []string{"皇城", "真相", "隐藏盟友", "先帝"},
	},
	"lin_yuan": {
		ID:          "lin_yuan",
		Name:         "林远",
		Title:        "初代觉醒者",
		PortraitBG:   "#0c4a6e",
		PortraitFG:   "#38bdf8",
		PortraitLtr:  "LY",
		Description:  "千年前的觉醒者，用灵魂封印虚渊古神的英雄",
		Alignment:    "善良",
		Role:         "祖先英灵",
		FirstMeet:    "ancient_ruins",
		Tags:         []string{"古遗迹", "祖先", "英灵", "记忆"},
	},
	"yang_ti": {
		ID:          "yang_ti",
		Name:         "羊蹄山之魂",
		Title:        "山魂",
		PortraitBG:   "#164e63",
		PortraitFG:   "#22d3ee",
		PortraitLtr:  "YT",
		Description:  "守护王国的古老意志，虚渊古神的封印者",
		Alignment:    "中立",
		Role:         "最终核心",
		FirstMeet:    "mt_yotei_summit",
		Tags:         []string{"山顶", "山魂", "最终", "选择"},
	},
	"xu_yuan": {
		ID:          "xu_yuan",
		Name:         "虚渊古神",
		Title:        "远古存在",
		PortraitBG:   "#450a0a",
		PortraitFG:   "#fca5a5",
		PortraitLtr:  "XY",
		Description:  "这个世界的意志碎片，既是威胁也是保护者",
		Alignment:    "邪恶",
		Role:         "最终Boss",
		FirstMeet:    "soul_trial",
		Tags:         []string{"终局", "古神", "最终Boss", "毁灭"},
	},
	"gui_wang": {
		ID:          "gui_wang",
		Name:         "傀儡国王",
		Title:        "假国王",
		PortraitBG:   "#292524",
		PortraitFG:   "#a8a29e",
		PortraitLtr:  "GW",
		Description:  "被莫青书操控的傀儡，真正的国王早已被害",
		Alignment:    "灰色",
		Role:         "政治背景",
		FirstMeet:    "royal_palace",
		Tags:         []string{"王城", "傀儡", "被操控", "可怜人"},
	},
	"zan_da": {
		ID:          "zan_da",
		Name:         "赞达",
		Title:        "部落首领",
		PortraitBG:   "#78350f",
		PortraitFG:   "#fcd34d",
		PortraitLtr:  "ZD",
		Description:  "丛林部落的威严首领，守护先祖之地的使命",
		Alignment:    "善良",
		Role:         "任务发布",
		FirstMeet:    "jungle_tribe",
		Tags:         []string{"丛林", "部落", "任务", "地图"},
	},
	"zhao_shen": {
		ID:          "zhao_shen",
		Name:         "赵婶",
		Title:        "酒馆老板娘",
		PortraitBG:   "#9a3412",
		PortraitFG:   "#fdba74",
		PortraitLtr:  "ZS",
		Description:  "边境酒馆的泼辣老板娘，影子组织的外围成员",
		Alignment:    "中立",
		Role:         "情报商",
		FirstMeet:    "border_town",
		Tags:         []string{"酒馆", "情报", "影子", "密道"},
	},
	"zhou_hai": {
		ID:          "zhou_hai",
		Name:         "周海",
		Title:        "海军舰长",
		PortraitBG:   "#1e40af",
		PortraitFG:   "#93c5fd",
		PortraitLtr:  "ZH",
		Description:  "王国海军的指挥官，正直果敢的老将",
		Alignment:    "善良",
		Role:         "任务发布",
		FirstMeet:    "port_city",
		Tags:         []string{"海军", "海贼", "任务", "魂晶"},
	},
}

// GetDialogueByChapter 获取指定章节的对话
func GetDialogueByChapter(chapter int) *DialogueSection {
	dialogues := map[int]DialogueSection{
		1: {
			Chapter:  1,
			Title:    "边境哨站的陌生人",
			Location:  "border_outpost",
			Trigger:   "first_enter",
			Conditions: []string{},
			Dialogues: []DialogueEntry{
				{
					Speaker:  "chen_yue",
					Content:  "（打量着你）又一个冒险者。最近来边境的人越来越多了。你是冲着羊蹄山来的？",
					Emotion:  "normal",
					ShowChoice: false,
				},
				{
					Speaker:  "chen_yue",
					Content:  "我叫陈岳，在这里守了二十年。这片土地藏着太多秘密，外人最好小心行事。",
					Emotion:  "normal",
					ShowChoice: false,
				},
				{
					Speaker:  "chen_yue",
					Content:  "最近山里不太平。有人在羊蹄山附近看到了不该看到的东西——亡眼印记。二十年前我见过一次那个符号，那次之后王城死了很多人。",
					Emotion:  "eerie",
					ShowChoice: false,
				},
				{
					Speaker:  "chen_yue",
					Content:  "你是冒险者，但你身上有种不一样的气息。我见过很多人，但这样的气息……我只见过一次。",
					Emotion:  "normal",
					ShowChoice: true,
					Choices: []Choice{
						{
							Text:      "什么气息？",
							NextID:    "chen_yue_trace",
							Condition: "",
							GainItem:  "",
							GainQuest: "",
							Flag:      "ask_about_trace",
						},
						{
							Text:      "我接受调查任务",
							NextID:    "chen_yue_quest",
							Condition: "",
							GainItem:  "",
							GainQuest: "quest_missing_caravan",
							Flag:      "",
						},
						{
							Text:      "羊蹄山有什么传说？",
							NextID:    "chen_yue_mountain",
							Condition: "",
							GainItem:  "",
							GainQuest: "",
							Flag:      "learn_mountain",
						},
					},
				},
			},
		},
		2: {
			Chapter:  2,
			Title:    "迷雾森林的试炼",
			Location:  "misty_forest",
			Trigger:   "enter",
			Conditions: []string{},
			Dialogues: []DialogueEntry{
				{
					Speaker:  "system",
					Content:  "迷雾森林终年被乳白色的浓雾笼罩。阳光只能透过树冠投下零星光斑。四周静得可怕，只有自己的脚步声和远处偶尔传来的低沉咆哮。",
					Emotion:  "eerie",
					ShowChoice: false,
				},
				{
					Speaker:  "su_waner",
					Content:  "（从树后走出，淡紫色的眼眸警惕地眯起）谁？这里是森林深处，不欢迎陌生人。",
					Emotion:  "normal",
					ShowChoice: false,
				},
				{
					Speaker:  "su_waner",
					Content:  "……你身上的气息好奇怪。不像那些贪婪的冒险者。你来这里做什么？",
					Emotion:  "normal",
					ShowChoice: true,
					Choices: []Choice{
						{
							Text:      "我在找失踪的商队",
							NextID:    "suwaner_caravan",
							Condition: "",
							GainItem:  "",
							GainQuest: "",
							Flag:      "",
						},
						{
							Text:      "你是谁？为什么独自在森林里？",
							NextID:    "suwaner_identity",
							Condition: "",
							GainItem:  "",
							GainQuest: "",
							Flag:      "know_suwaner",
						},
						{
							Text:      "你的眼睛……好特别",
							NextID:    "suwaner_eyes",
							Condition: "",
							GainItem:  "",
							GainQuest: "",
							Flag:      "",
						},
					},
				},
			},
		},
		3: {
			Chapter:  3,
			Title:    "老猎人的秘密",
			Location:  "hunter_cabin",
			Trigger:   "enter",
			Conditions: []string{},
			Dialogues: []DialogueEntry{
				{
					Speaker:  "lao_lieren",
					Content:  "（头也不抬）来了啊。我就知道你会来。",
					Emotion:  "normal",
					ShowChoice: false,
				},
				{
					Speaker:  "lao_lieren",
					Content:  "那个姓陈的小子放出话说'有缘人会出现'——我就知道他在等我。",
					Emotion:  "normal",
					ShowChoice: false,
				},
				{
					Speaker:  "lao_lieren",
					Content:  "（放下斧头，转身看着你，浑浊的老眼里闪过精光）你知道为什么我能活这么久吗？因为我从来不追着命运跑。我只等。等命运自己找上门。",
					Emotion:  "happy",
					ShowChoice: false,
				},
				{
					Speaker:  "lao_lieren",
					Content:  "我叫顾渊。曾经是'初代觉醒者'林远的徒弟。",
					Emotion:  "normal",
					ShowChoice: false,
				},
				{
					Speaker:  "lao_lieren",
					Content:  "千年前的那场神魔大战，官方的说法是英雄们团结一致击退了魔族。但真相是——那场战争从一开始就是个骗局。",
					Emotion:  "warning",
					ShowChoice: false,
				},
				{
					Speaker:  "lao_lieren",
					Content:  "（从暗格里取出一个油布包裹）这是林远留给我的遗书和一块蓝色晶体。你的眼神告诉我——你就是他一直在等的那个后裔。",
					Emotion:  "normal",
					ShowChoice: true,
					Choices: []Choice{
						{
							Text:      "林远是我祖先？",
							NextID:    "laolieren_ancestor",
							Condition: "",
							GainItem:  "",
							GainQuest: "",
							Flag:      "know_truth",
						},
						{
							Text:      "让我看看遗书",
							NextID:    "laolieren_letter",
							Condition: "",
							GainItem:  "初代觉醒者遗书",
							GainQuest: "",
							Flag:      "",
						},
						{
							Text:      "这个蓝色晶体是什么？",
							NextID:    "laolieren_crystal",
							Condition: "",
							GainItem:  "",
							GainQuest: "",
							Flag:      "",
						},
					},
				},
			},
		},
		5: {
			Chapter:  5,
			Title:    "边境小镇的暗流",
			Location:  "border_town",
			Trigger:   "enter",
			Conditions: []string{},
			Dialogues: []DialogueEntry{
				{
					Speaker:  "zhao_shen",
					Content:  "（泼辣地擦着酒杯）哟，来客人了！想喝点什么？这里的麦酒可是方圆百里最烈的！",
					Emotion:  "happy",
					ShowChoice: false,
				},
				{
					Speaker:  "zhao_shen",
					Content:  "看你的样子，是从哨站来的吧？最近那边有什么新闻吗？",
					Emotion:  "normal",
					ShowChoice: false,
				},
				{
					Speaker:  "heiying",
					Content:  "（角落里传来低沉沙哑的声音）盯着人看可不是好习惯，陌生人。",
					Emotion:  "eerie",
					ShowChoice: false,
				},
				{
					Speaker:  "heiying",
					Content:  "我叫黑影。最近来边境的人，十个里有九个是冲着羊蹄山来的。但他们不知道，那座山不是在等英雄。是在等……祭品。",
					Emotion:  "eerie",
					ShowChoice: true,
					Choices: []Choice{
						{
							Text:      "祭品？什么意思？",
							NextID:    "heiying_sacrifice",
							Condition: "",
							GainItem:  "",
							GainQuest: "",
							Flag:      "",
						},
						{
							Text:      "你是什么人？",
							NextID:    "heiying_identity",
							Condition: "",
							GainItem:  "影子硬币",
							GainQuest: "",
							Flag:      "know_heiying",
						},
						{
							Text:      "我对交易感兴趣",
							NextID:    "heiying_deal",
							Condition: "",
							GainItem:  "",
							GainQuest: "",
							Flag:      "",
						},
					},
				},
				{
					Speaker:  "tie_mian",
					Content:  "（戴着全覆盖铁面具的男人独自喝着闷酒，突然门被推开，三个黑袍人闯入）",
					Emotion:  "angry",
					ShowChoice: false,
				},
				{
					Speaker:  "tie_mian",
					Content:  "（摘下面具，露出一张布满伤疤的年轻脸庞）三千金币？就这点钱，你们也想买我的命？我告诉你们——我查到的那些东西，比我的命值钱多了。",
					Emotion:  "angry",
					ShowChoice: true,
					Choices: []Choice{
						{
							Text:      "出手帮助铁面",
							NextID:    "tiemian_help",
							Condition: "",
							GainItem:  "",
							GainQuest: "quest_ironface",
							Flag:      "help_ironface",
						},
						{
							Text:      "旁观战局发展",
							NextID:    "tiemian_observe",
							Condition: "",
							GainItem:  "",
							GainQuest: "",
							Flag:      "",
						},
					},
				},
			},
		},
		7: {
			Chapter:  7,
			Title:    "海港城的秘密交易",
			Location:  "port_city",
			Trigger:   "enter",
			Conditions: []string{},
			Dialogues: []DialogueEntry{
				{
					Speaker:  "honghu",
					Content:  "（身穿红色披风从船上走下，海风扬起她的黑发）你就是林夜？'影子'的人给我传了消息。说有个'觉醒者'会来找我。",
					Emotion:  "normal",
					ShowChoice: false,
				},
				{
					Speaker:  "honghu",
					Content:  "（上下打量着你，嘴角微微上扬）'影子'说你有用。我看不出你哪里有用。但既然他们开了口，就给你一个机会。",
					Emotion:  "normal",
					ShowChoice: false,
				},
				{
					Speaker:  "honghu",
					Content:  "我正在准备一票大生意——打劫一艘王城的船。那船上有一批'魂晶'，目的地是羊蹄山，买家是……国师莫青书。",
					Emotion:  "normal",
					ShowChoice: true,
					Choices: []Choice{
						{
							Text:      "为什么要告诉我这些？",
							NextID:    "honghu_why",
							Condition: "",
							GainItem:  "",
							GainQuest: "quest_honghu_heist",
							Flag:      "",
						},
						{
							Text:      "你到底是什么人？",
							NextID:    "honghu_identity",
							Condition: "",
							GainItem:  "",
							GainQuest: "",
							Flag:      "know_honghu",
						},
						{
							Text:      "我对魂晶很感兴趣",
							NextID:    "honghu_soul_crystal",
							Condition: "",
							GainItem:  "",
							GainQuest: "",
							Flag:      "",
						},
					},
				},
			},
		},
		9: {
			Chapter:  9,
			Title:    "王宫的面具",
			Location:  "royal_palace",
			Trigger:   "enter",
			Conditions: []string{},
			Dialogues: []DialogueEntry{
				{
					Speaker:  "mo_qingshu",
					Content:  "（站在年轻的国王身旁，一袭青衫，面容清癯，看起来像个和蔼的老儒）哦？边境来的冒险者？有意思……",
					Emotion:  "normal",
					ShowChoice: false,
				},
				{
					Speaker:  "mo_qingshu",
					Content:  "（目光在你身上停留了一瞬，你感觉全身被冰水浇透——他在用某种方式扫描你）你的眼神不错。有几分……故人的影子。",
					Emotion:  "eerie",
					ShowChoice: false,
				},
				{
					Speaker:  "mo_qingshu",
					Content:  "陛下正在寻找有能力的冒险者来执行一个特殊任务。报酬是五百金币，外加王城的永久居住权。任务内容是——去失落神庙，取回一样东西。",
					Emotion:  "normal",
					ShowChoice: true,
					Choices: []Choice{
						{
							Text:      "接受任务",
							NextID:    "mo_accept_quest",
							Condition: "",
							GainItem:  "",
							GainQuest: "quest_lost_temple",
							Flag:      "mo_tracking",
						},
						{
							Text:      "什么东西？",
							NextID:    "mo_what_thing",
							Condition: "",
							GainItem:  "",
							GainQuest: "",
							Flag:      "",
						},
						{
							Text:      "我拒绝",
							NextID:    "mo_refuse",
							Condition: "",
							GainItem:  "",
							GainQuest: "",
							Flag:      "refuse_mo",
						},
					},
				},
				{
					Speaker:  "gui_wang",
					Content:  "（一个老态龙钟但眼神锐利的老太监向你微微点头。在御花园里，他低声说道）杂家等这一天，等了二十年。",
					Emotion:  "normal",
					ShowChoice: false,
				},
				{
					Speaker:  "gui_wang",
					Content:  "这里的陛下，不是真正的陛下。真正的陛下，在五年前就被莫青书毒成了植物人。现在坐在王座上的，是他的傀儡替身。",
					Emotion:  "warning",
					ShowChoice: true,
					Choices: []Choice{
						{
							Text:      "真正的国王在哪里？",
							NextID:    "guiwang_real_king",
							Condition: "",
							GainItem:  "",
							GainQuest: "",
							Flag:      "know_puppet",
						},
						{
							Text:      "你为什么告诉我这些？",
							NextID:    "guiwang_why",
							Condition: "",
							GainItem:  "",
							GainQuest: "",
							Flag:      "",
						},
					},
				},
			},
		},
		13: {
			Chapter:  13,
			Title:    "古遗迹的召唤",
			Location:  "ancient_ruins",
			Trigger:   "enter",
			Conditions: []string{"know_truth"},
			Dialogues: []DialogueEntry{
				{
					Speaker:  "system",
					Content:  "在遗迹最深处，巨大的石柱和破损的墙壁诉说着曾经的辉煌。空气中弥漫着古老而神秘的气息。一个半透明的身影缓缓浮现——",
					Emotion:  "eerie",
					ShowChoice: false,
				},
				{
					Speaker:  "lin_yuan",
					Content:  "你终于来了……我的后裔……",
					Emotion:  "normal",
					ShowChoice: false,
				},
				{
					Speaker:  "lin_yuan",
					Content:  "（他看起来和你几乎一模一样，只是更加苍老，眼神里有着无尽的疲惫）千年来，我一直在这里等待。等一个能理解真相的后裔。",
					Emotion:  "sad",
					ShowChoice: false,
				},
				{
					Speaker:  "lin_yuan",
					Content:  "这个世界面临毁灭时，它会觉醒，试图用一切手段保护自己——包括毁灭文明。魔族入侵不是外患，是我召唤来的。",
					Emotion:  "warning",
					ShowChoice: false,
				},
				{
					Speaker:  "lin_yuan",
					Content:  "我和虚渊古神做了交易，用'气运'换取力量击退魔族。但我犯了一个错误——我低估了古神的胃口。它想要的不是气运。是灵魂。",
					Emotion:  "warning",
					ShowChoice: true,
					Choices: []Choice{
						{
							Text:      "那你为什么要封印它？",
							NextID:    "linyuan_why_seal",
							Condition: "",
							GainItem:  "",
							GainQuest: "",
							Flag:      "",
						},
						{
							Text:      "山魂是什么？",
							NextID:    "linyuan_shanhun",
							Condition: "",
							GainItem:  "",
							GainQuest: "",
							Flag:      "",
						},
						{
							Text:      "我能做什么？",
							NextID:    "linyuan_what_i_do",
							Condition: "",
							GainItem:  "",
							GainQuest: "",
							Flag:      "awakened",
						},
					},
				},
				{
					Speaker:  "lin_yuan",
					Content:  "（伸出手按在你额头上，一股力量涌入身体）这是我全部的力量和记忆。从今以后，你就是真正的'觉醒者'。",
					Emotion:  "happy",
					ShowChoice: false,
				},
			},
		},
		15: {
			Chapter:  15,
			Title:    "红曜碎片",
			Location:  "lost_temple",
			Trigger:   "enter",
			Conditions: []string{"awakened"},
			Dialogues: []DialogueEntry{
				{
					Speaker:  "system",
					Content:  "神庙深处，祭坛中央悬浮着一块拳头大小的红色晶体——红曜碎片。但碎片周围有一道强大的结界。",
					Emotion:  "eerie",
					ShowChoice: false,
				},
				{
					Speaker:  "mo_qingshu",
					Content:  "（不知用了什么方法出现在你身后）我就知道你会来。",
					Emotion:  "normal",
					ShowChoice: false,
				},
				{
					Speaker:  "mo_qingshu",
					Content:  "把碎片给我。我可以让你活得久一点。",
					Emotion:  "normal",
					ShowChoice: false,
				},
				{
					Speaker:  "mo_qingshu",
					Content:  "你应该已经知道了很多事。但你不知道的是——我和你，是同一种人。我也和命运抗争过。只是我选择了复仇，而你还在犹豫。",
					Emotion:  "normal",
					ShowChoice: true,
					Choices: []Choice{
						{
							Text:      "你曾经也是受害者？",
							NextID:    "mo_victim",
							Condition: "",
							GainItem:  "",
							GainQuest: "",
							Flag:      "know_mo_past",
						},
						{
							Text:      "我拒绝！战斗！",
							NextID:    "mo_fight",
							Condition: "",
							GainItem:  "",
							GainQuest: "",
							Flag:      "fight_mo",
						},
						{
							Text:      "我可以假意答应",
							NextID:    "mo_fake_join",
							Condition: "",
							GainItem:  "",
							GainQuest: "",
							Flag:      "fake_mo",
						},
					},
				},
			},
		},
	}
	
	if d, ok := dialogues[chapter]; ok {
		return &d
	}
	return nil
}

// GetAllDialogueChapters 获取所有章节ID
func GetAllDialogueChapters() []int {
	chapters := make([]int, 0)
	for k := range map[int]DialogueSection{
		1: {}, 2: {}, 3: {}, 5: {}, 7: {}, 9: {}, 13: {}, 15: {},
	} {
		chapters = append(chapters, k)
	}
	return chapters
}

// DialogueResponse 对话响应
type DialogueResponse struct {
	Character   CharacterProfile `json:"character"`
	Dialogue    DialogueSection  `json:"dialogue"`
	CurrentIdx  int             `json:"current_idx"`
	Flags       map[string]bool `json:"flags"`
}

// GetNPCDialogueForRegion 获取某区域的NPC对话
func GetNPCDialogueForRegion(regionID string, characterFlags map[string]bool) *DialogueResponse {
	// 根据区域映射到章节
	regionChapterMap := map[string]int{
		"border_outpost":   1,
		"misty_forest":     2,
		"hunter_cabin":     3,
		"abandoned_mine":   4,
		"border_town":      5,
		"jungle_tribe":     6,
		"port_city":        7,
		"royal_capital":     9,
		"royal_palace":     9,
		"adventurer_guild": 10,
		"ancient_ruins":    13,
		"lost_temple":      15,
	}
	
	chapter := regionChapterMap[regionID]
	if chapter == 0 {
		chapter = 1 // 默认第一章
	}
	
	d := GetDialogueByChapter(chapter)
	if d == nil {
		return nil
	}
	
	// 默认返回第一个NPC的对话
	npcID := d.Dialogues[0].Speaker
	if profile, ok := AllCharacterProfiles[npcID]; ok {
		return &DialogueResponse{
			Character:  profile,
			Dialogue:   *d,
			CurrentIdx: 0,
			Flags:      characterFlags,
		}
	}
	
	return nil
}

// GetCharacterProfile 获取角色资料
func GetCharacterProfile(npcID string) *CharacterProfile {
	if profile, ok := AllCharacterProfiles[npcID]; ok {
		return &profile
	}
	return nil
}

// GetAllCharacterProfiles 返回所有角色资料
func GetAllCharacterProfilesMap() map[string]CharacterProfile {
	return AllCharacterProfiles
}