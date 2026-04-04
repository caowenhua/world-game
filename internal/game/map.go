package game

import "fmt"

// Region represents a game region
type Region struct {
	ID          string   `json:"id"`
	Name        string   `json:"name"`
	Type        string   `json:"type"`
	DangerLevel int      `json:"danger_level"`
	MinLevel    int      `json:"min_level"`
	MaxLevel    int      `json:"max_level"`
	Description string   `json:"description"`
	Connections []string `json:"connections"`
	NPCs        []NPC    `json:"npcs"`
	Monsters    []string `json:"monsters"`
	EnterText   string   `json:"enter_text"`
	Background  string   `json:"background"`
}

// NPC represents a non-player character
type NPC struct {
	ID           string     `json:"id"`
	Name         string     `json:"name"`
	Role         string     `json:"role"`
	Location     string     `json:"location"`
	Dialogue     []string   `json:"dialogue"`
	Greeting     string     `json:"greeting"`
	QuestOffer   string     `json:"quest_offer,omitempty"`
	ShopItems    []ShopItem `json:"shop_items,omitempty"`
	IsCardDealer bool       `json:"is_card_dealer"`
	CardTypes    []string   `json:"card_types,omitempty"`
}

// ShopItem is an item sold by a merchant NPC
type ShopItem struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Type   string `json:"type"`
	Rarity string `json:"rarity"`
	Price  int    `json:"price"`
	Effect string `json:"effect"`
}

// GetAllRegions returns all game regions
func GetAllRegions() []Region {
	return []Region{
		// 西境王国
		{
			ID: "border_outpost", Name: "边境哨站", Type: "town",
			DangerLevel: 0, MinLevel: 1, MaxLevel: 5,
			Description: "羊蹄山脚下的小哨站，冒险者们离开前的最后补给点。",
			Connections: []string{"misty_forest", "border_town"},
			NPCs: []NPC{
				{ID: "sentinel_captain", Name: "哨兵队长", Role: "card_dealer",
					Greeting: "「欢迎来到边境哨站，年轻的冒险者。」",
					Dialogue: []string{"「最近山区出现了异常动向，迷雾比往常更加浓密了。」", "「羊蹄山之魂的传说已经流传了数百年。」"},
					IsCardDealer: true, CardTypes: []string{"main_story", "discovery"}},
				{ID: "soldier_chen", Name: "老兵陈", Role: "info_broker",
					Greeting: "「嘿，新面孔。我是老兵陈，在这守了十几年了。」",
					Dialogue: []string{"「迷雾森林里有宝藏，但也有危险。」", "「想变强？先去猎人小屋找老猎人学两招。」"}},
			},
			Monsters: []string{"slime"},
			EnterText: "你来到边境哨站，石墙上刻满了岁月痕迹。",
		},
		{
			ID: "misty_forest", Name: "迷雾森林", Type: "wilderness",
			DangerLevel: 1, MinLevel: 1, MaxLevel: 6,
			Description: "常年笼罩在浓雾中的森林，能见度极低，是初级冒险者的试炼场。",
			Connections: []string{"border_outpost", "hunter_cabin", "abandoned_mine"},
			NPCs: []NPC{},
			Monsters: []string{"slime", "wolf"},
			EnterText: "你踏入迷雾森林，四周白茫茫一片。偶尔传来狼嚎和树叶沙沙声...",
		},
		{
			ID: "hunter_cabin", Name: "猎人小屋", Type: "town",
			DangerLevel: 1, MinLevel: 2, MaxLevel: 7,
			Description: "隐藏在森林深处的小木屋，神秘的老猎人居住于此。",
			Connections: []string{"misty_forest", "border_town"},
			NPCs: []NPC{
				{ID: "old_hunter", Name: "老猎人", Role: "info_broker",
					Greeting: "「哦？有客人来了。坐吧，喝杯热茶。」",
					Dialogue: []string{"「我在这个森林里住了三十年，没有我不知道的地方。」", "「迷雾森林东边有个废弃矿洞，里面据说有宝藏...但也有不干净的东西。」"}},
			},
			Monsters: []string{"wolf", "giant_spider"},
			EnterText: "穿过迷雾，你来到一间温暖的小木屋。",
		},
		{
			ID: "abandoned_mine", Name: "废弃矿洞", Type: "dungeon",
			DangerLevel: 2, MinLevel: 3, MaxLevel: 8,
			Description: "曾经开采稀有矿石的矿洞，因事故被废弃，传闻有矿工幽灵徘徊。",
			Connections: []string{"misty_forest"},
			NPCs: []NPC{
				{ID: "miner_ghost", Name: "矿工幽灵", Role: "quest_giver",
					Greeting: "「...救...救救我...我被困在这里...」",
					Dialogue: []string{"「我...我不记得自己叫什么了...只记得...有重要的事情...」", "「钥匙...找钥匙...就在矿洞深处...」"},
					QuestOffer: "找到矿工幽灵的遗物，帮助他安息。"},
			},
			Monsters: []string{"skeleton", "giant_spider"},
			EnterText: "矿洞口阴风阵阵，废弃的矿车散落一地。深处传来金属碰撞的声响...",
		},
		{
			ID: "border_town", Name: "边境小镇", Type: "town",
			DangerLevel: 1, MinLevel: 1, MaxLevel: 10,
			Description: "混乱与机遇并存的边境小镇，三教九流汇聚之地。",
			Connections: []string{"border_outpost", "hunter_cabin", "royal_capital"},
			NPCs: []NPC{
				{ID: "tavern_owner", Name: "酒馆老板娘", Role: "card_dealer",
					Greeting: "「欢迎光临！来杯招牌麦酒暖暖身子？」",
					Dialogue: []string{"「边境小镇虽小，但什么消息都能打听到。」", "「想找刺激？悬赏板上有不少好任务。」"},
					IsCardDealer: true, CardTypes: []string{"side_story", "mood", "growth"}},
				{ID: "bounty_hunter", Name: "赏金猎人", Role: "quest_giver",
					Greeting: "「你是新来的？先证明自己的实力再说。」",
					Dialogue: []string{"「赏金板上最高的是一只幼龙，悬赏500金币。」", "「和怪物不一样，赏金目标可不会傻站着等你。」"}},
				{ID: "mysterious_stranger", Name: "神秘旅人", Role: "info_broker",
					Greeting: "「...」",
					Dialogue: []string{"「羊蹄山的秘密...比你想象的更深...」", "「小心王城里的人，不是所有人都值得信任。」", "「灵魂试炼场...只有真正的强者才能进入。」"}},
				{ID: "border_merchant", Name: "边境商人", Role: "merchant",
					Greeting: "「来看看我的货物？都是好东西！」",
					Dialogue: []string{"「从各地收集来的宝贝，价格公道。」"},
					ShopItems: []ShopItem{
						{ID: "health_potion_s", Name: "初级生命药水", Type: "consumable", Rarity: "common", Price: 30, Effect: "恢复50 HP"},
						{ID: "mana_potion_s", Name: "初级魔力药水", Type: "consumable", Rarity: "common", Price: 30, Effect: "恢复30 MP"},
						{ID: "antidote", Name: "解毒剂", Type: "consumable", Rarity: "common", Price: 20, Effect: "解除中毒状态"},
					}},
			},
			Monsters: []string{"goblin"},
			EnterText: "边境小镇鱼龙混杂，酒馆里传出喧哗声。街道两旁摆满了各种摊位。",
		},
		// 中原王城
		{
			ID: "royal_capital", Name: "王城", Type: "town",
			DangerLevel: 0, MinLevel: 5, MaxLevel: 15,
			Description: "西境王国的首都，国家的心脏地带，主线剧情的核心舞台。",
			Connections: []string{"border_town", "royal_palace", "adventurer_guild", "market_district", "slums"},
			NPCs: []NPC{
				{ID: "city_guard", Name: "王城卫兵", Role: "info_broker",
					Greeting: "「请出示通行证。王城内禁止打斗。」",
					Dialogue: []string{"「最近王宫里气氛紧张，听说是关于羊蹄山的事。」", "「贫民窟那边不太平，晚上最好别去。」"}},
			},
			Monsters: []string{},
			EnterText: "王城雄伟壮观，高耸的城墙和雄伟的宫殿诉说着帝国的辉煌。",
		},
		{
			ID: "royal_palace", Name: "王宫", Type: "town",
			DangerLevel: 0, MinLevel: 8, MaxLevel: 20,
			Description: "国王的居所，权力的中心，与主线剧情密切相关。",
			Connections: []string{"royal_capital"},
			NPCs: []NPC{
				{ID: "king", Name: "国王", Role: "card_dealer",
					Greeting: "「冒险者，你的到来正是时候。我有要事相托。」",
					Dialogue: []string{"「羊蹄山之魂...那是拯救王国的唯一希望。」", "「北境雪山的古遗迹里，有你需要的线索。」"},
					IsCardDealer: true, CardTypes: []string{"main_story"}},
				{ID: "royal_advisor", Name: "王宫顾问", Role: "info_broker",
					Greeting: "「陛下正在寻找能够对抗即将到来的灾难的勇士。」",
					Dialogue: []string{"「关于羊蹄山之魂，记载很少...但我知道它与北境的古遗迹有关。」"}},
			},
			Monsters: []string{},
			EnterText: "王宫金碧辉煌，大臣们匆匆走过。",
		},
		{
			ID: "adventurer_guild", Name: "冒险者公会", Type: "town",
			DangerLevel: 0, MinLevel: 5, MaxLevel: 15,
			Description: "冒险者聚集的大本营，是接任务、组队、交流的核心场所。",
			Connections: []string{"royal_capital"},
			NPCs: []NPC{
				{ID: "guild_receptionist", Name: "公会接待员", Role: "card_dealer",
					Greeting: "「欢迎来到冒险者公会！今天想接什么任务？」",
					Dialogue: []string{"「公会任务分五个等级：E到S。你现在最适合C级。」", "「完成主线任务可以大幅提升公会声望，解锁高级任务。」"},
					IsCardDealer: true, CardTypes: []string{"main_story", "side_story", "challenge"}},
				{ID: "guild_master", Name: "公会会长", Role: "quest_giver",
					Greeting: "「年轻人，你的眼神不错。想接S级任务？」",
					Dialogue: []string{"「南境丛林最近出现了一只异变的魔兽，需要处理。」", "「公会声望达到一定程度后，可以解锁专属技能。」"}},
				{ID: "guild_merchant", Name: "公会商店", Role: "merchant",
					Greeting: "「公会成员购物享九折优惠！」",
					Dialogue: []string{"「这些都是公会认证的优质装备。」"},
					ShopItems: []ShopItem{
						{ID: "health_potion_m", Name: "中级生命药水", Type: "consumable", Rarity: "uncommon", Price: 80, Effect: "恢复150 HP"},
						{ID: "mana_potion_m", Name: "中级魔力药水", Type: "consumable", Rarity: "uncommon", Price: 80, Effect: "恢复80 MP"},
						{ID: "bomb", Name: "魔法炸弹", Type: "consumable", Rarity: "uncommon", Price: 100, Effect: "对敌人造成100伤害"},
					}},
			},
			Monsters: []string{"goblin", "skeleton"},
			EnterText: "公会大厅热闹非凡，到处都是冒险者讨论任务的声音。悬赏板上贴满了各种委托。",
		},
		{
			ID: "market_district", Name: "闹市街区", Type: "town",
			DangerLevel: 1, MinLevel: 5, MaxLevel: 12,
			Description: "王城最繁华的商业区，各类商店、赌场、情报贩子汇聚。",
			Connections: []string{"royal_capital"},
			NPCs: []NPC{
				{ID: "merchant_union", Name: "商会会长", Role: "merchant",
					Greeting: "「贵客临门！来看看我这里的好货？」",
					Dialogue: []string{"「商会的船只刚从南境丛林回来，带了些稀有药材。」"},
					ShopItems: []ShopItem{
						{ID: "iron_sword", Name: "铁剑", Type: "weapon", Rarity: "common", Price: 150, Effect: "+10 攻击"},
						{ID: "leather_armor", Name: "皮甲", Type: "armor", Rarity: "common", Price: 120, Effect: "+8 防御"},
					}},
				{ID: "info_broker_lady", Name: "情报夫人", Role: "info_broker",
					Greeting: "「想知道什么？只要价钱合适，什么消息都能告诉你。」",
					Dialogue: []string{"「南境丛林的失落神庙里，有关于羊蹄山之魂的重要线索。」"}},
			},
			Monsters: []string{},
			EnterText: "街道两旁商铺林立，讨价还价声此起彼伏。",
		},
		{
			ID: "slums", Name: "贫民窟", Type: "town",
			DangerLevel: 2, MinLevel: 8, MaxLevel: 15,
			Description: "王城阴暗的角落，「影子」组织的地盘，隐藏着不少秘密任务。",
			Connections: []string{"royal_capital"},
			NPCs: []NPC{
				{ID: "shadow_leader", Name: "影子首领", Role: "quest_giver",
					Greeting: "「你是自己找上门的...说吧，想要什么？」",
					Dialogue: []string{"「影子不关心正义，只关心报酬。」", "「有个任务...去王宫地下室拿一份文件。不该问的别问。」"}},
			},
			Monsters: []string{"skeleton", "dark_knight"},
			EnterText: "阴暗潮湿的巷道，破败的房屋。这里是王城的另一面。",
		},
		// 北境雪山
		{
			ID: "mountain_village", Name: "雪山村", Type: "town",
			DangerLevel: 2, MinLevel: 10, MaxLevel: 18,
			Description: "北境唯一的村落，村民世代守护着通往古遗迹的道路。",
			Connections: []string{"frost_cave", "ancient_ruins"},
			NPCs: []NPC{
				{ID: "village_elder", Name: "村中长者", Role: "info_broker",
					Greeting: "「外乡人，这里不欢迎弱者。你来这里做什么？」",
					Dialogue: []string{"「古遗迹里封印着古老的力量，不要轻易触碰。」", "「神殿废墟里有我们祖先留下的东西...但我们不敢进去。」"}},
				{ID: "ice_merchant", Name: "冰霜商人", Role: "merchant",
					Greeting: "「需要冰系材料吗？我这里都是北境特产的。」",
					Dialogue: []string{"「冰霜洞穴里的冰晶是制作武器的好材料。」"},
					ShopItems: []ShopItem{
						{ID: "ice_blade", Name: "冰霜之刃", Type: "weapon", Rarity: "rare", Price: 500, Effect: "+25 攻击，冰属性"},
						{ID: "fur_coat", Name: "皮毛大衣", Type: "armor", Rarity: "uncommon", Price: 300, Effect: "+20 防御，抗寒"},
					}},
			},
			Monsters: []string{"ice_wraith"},
			EnterText: "寒风呼啸，雪山村被白雪覆盖。村民们用警惕的目光打量着你。",
		},
		{
			ID: "frost_cave", Name: "冰霜洞穴", Type: "dungeon",
			DangerLevel: 3, MinLevel: 11, MaxLevel: 18,
			Description: "常年结冰的洞穴，栖息着各种冰系怪物，产出稀有冰属性材料。",
			Connections: []string{"mountain_village", "temple_ruins"},
			NPCs: []NPC{},
			Monsters: []string{"ice_wraith", "thunder_golem"},
			EnterText: "洞穴内寒气逼人，地面和墙壁都覆盖着厚厚的冰层。",
		},
		{
			ID: "ancient_ruins", Name: "古遗迹", Type: "dungeon",
			DangerLevel: 3, MinLevel: 12, MaxLevel: 20,
			Description: "千年前的文明遗迹，藏有强大的古代装备和关于羊蹄山的重要线索。",
			Connections: []string{"mountain_village"},
			NPCs: []NPC{
				{ID: "ancient_spirit", Name: "古代之魂", Role: "card_dealer",
					Greeting: "「...又一个凡人...你想知道什么...」",
					Dialogue: []string{"「我们的文明...毁于自己创造的力量...」", "「羊蹄山之魂...它不只是传说...它是真实存在的...」"},
					IsCardDealer: true, CardTypes: []string{"main_story", "discovery"}},
			},
			Monsters: []string{"thunder_golem", "ancient_lich"},
			EnterText: "巨大的石柱和破损的墙壁诉说着曾经的辉煌。",
		},
		{
			ID: "temple_ruins", Name: "神殿废墟", Type: "dungeon",
			DangerLevel: 4, MinLevel: 13, MaxLevel: 20,
			Description: "被遗忘的神殿废墟，据说封印着某种可怕的存在。",
			Connections: []string{"frost_cave"},
			NPCs: []NPC{},
			Monsters: []string{"ancient_lich", "dragon_spawn"},
			EnterText: "残破的神殿墙壁上刻满了奇怪的符文。",
		},
		// 东海沿岸
		{
			ID: "port_city", Name: "海港城", Type: "town",
			DangerLevel: 1, MinLevel: 8, MaxLevel: 15,
			Description: "东海沿岸最大的港口城市，商船云集，也是海贼问题的源头地。",
			Connections: []string{"coral_reef", "shipwreck"},
			NPCs: []NPC{
				{ID: "harbor_master", Name: "港口总管", Role: "info_broker",
					Greeting: "「欢迎来到海港城！有什么需要的？」",
					Dialogue: []string{"「海贼最近活动频繁，商船都不敢出海了。」", "「珊瑚礁海域风景很美，但也有危险。」"}},
				{ID: "navy_captain", Name: "海军舰长", Role: "quest_giver",
					Greeting: "「我是负责剿灭海贼的海军舰长。」",
					Dialogue: []string{"「海贼洞穴是他们的老巢，我一直想端掉。」"}},
				{ID: "port_merchant", Name: "海港商人", Role: "merchant",
					Greeting: "「从东方运来的好东西！来看看？」",
					Dialogue: []string{"「商船带来了各地的珍奇货物。」"},
					ShopItems: []ShopItem{
						{ID: "steel_cutlass", Name: "钢制弯刀", Type: "weapon", Rarity: "uncommon", Price: 400, Effect: "+18 攻击"},
						{ID: "sea_herb", Name: "海草药剂", Type: "consumable", Rarity: "uncommon", Price: 100, Effect: "恢复100 HP并解除一个负面状态"},
					}},
			},
			Monsters: []string{"goblin", "fire_sprite"},
			EnterText: "海港城充满了咸腥味和喧闹声。渔船和商船停满了港口。",
		},
		{
			ID: "coral_reef", Name: "珊瑚礁海域", Type: "wilderness",
			DangerLevel: 2, MinLevel: 9, MaxLevel: 15,
			Description: "美丽的珊瑚礁海域，栖息着各种海洋生物，但也有凶猛的海兽。",
			Connections: []string{"port_city", "shipwreck"},
			NPCs: []NPC{},
			Monsters: []string{"giant_spider", "fire_sprite"},
			EnterText: "蔚蓝的海水下是五彩斑斓的珊瑚礁。但平静的水面下，危险正在潜伏...",
		},
		{
			ID: "shipwreck", Name: "沉船遗迹", Type: "wilderness",
			DangerLevel: 3, MinLevel: 10, MaxLevel: 16,
			Description: "多艘商船在此搁浅沉没，据说有宝藏沉睡在海底。",
			Connections: []string{"port_city", "coral_reef", "pirate_cave"},
			NPCs: []NPC{},
			Monsters: []string{"fire_sprite", "dark_knight"},
			EnterText: "破碎的船体散落海底，阳光透过水面洒落。",
		},
		{
			ID: "pirate_cave", Name: "海贼洞穴", Type: "dungeon",
			DangerLevel: 4, MinLevel: 12, MaxLevel: 18,
			Description: "海贼在东海沿岸的秘密据点，藏有大量掠夺来的财物。",
			Connections: []string{"shipwreck"},
			NPCs: []NPC{
				{ID: "pirate_captain", Name: "海贼头目", Role: "quest_giver",
					Greeting: "「哈哈哈哈！又一个来送死的！」",
					Dialogue: []string{"「你不知道这里是谁的地盘吗？」", "「想活着离开？打败我再说！」"}},
			},
			Monsters: []string{"dark_knight", "orc"},
			EnterText: "洞穴内堆满了各种掠夺来的财物。",
		},
		// 南境丛林
		{
			ID: "jungle_tribe", Name: "丛林部落", Type: "town",
			DangerLevel: 2, MinLevel: 12, MaxLevel: 20,
			Description: "南境丛林深处的原始部落，与外界隔绝，有独特的巫医文化。",
			Connections: []string{"toxic_swamp", "lost_temple"},
			NPCs: []NPC{
				{ID: "tribal_chief", Name: "部落首领", Role: "quest_giver",
					Greeting: "「外来者...你来这里有何贵干？」",
					Dialogue: []string{"「失落神庙里封印着我们的先祖之魂...我们不敢靠近。」", "「丛林深处的毒沼泽有我们需要的草药。」"}},
				{ID: "witch_doctor", Name: "丛林巫医", Role: "merchant",
					Greeting: "「...我等你很久了...」",
					Dialogue: []string{"「毒沼泽的草药能解百毒。」", "「我有种特殊的药水...能暂时提升你的能力。」"},
					ShopItems: []ShopItem{
						{ID: "jungle_elixir", Name: "丛林精华", Type: "consumable", Rarity: "rare", Price: 200, Effect: "恢复200 HP并提升10%攻击力（战斗内有效）"},
						{ID: "antidote_rare", Name: "强效解毒剂", Type: "consumable", Rarity: "uncommon", Price: 80, Effect: "解除所有负面状态"},
						{ID: "poison_dagger", Name: "淬毒匕首", Type: "weapon", Rarity: "rare", Price: 600, Effect: "+20 攻击，攻击附带毒属性"},
					}},
			},
			Monsters: []string{"giant_spider", "skeleton"},
			EnterText: "部落村寨隐匿在茂密的丛林中。村民们用警惕的目光注视着这个外来者。",
		},
		{
			ID: "toxic_swamp", Name: "毒沼泽", Type: "wilderness",
			DangerLevel: 3, MinLevel: 13, MaxLevel: 20,
			Description: "充满毒气的沼泽地，毒蛇和毒虫遍布，每次探索都有中毒风险。",
			Connections: []string{"jungle_tribe", "vine_maze"},
			NPCs: []NPC{},
			Monsters: []string{"giant_spider", "ancient_lich"},
			EnterText: "腐臭的泥水和毒气让这里寸草不生。黑暗中，毒蛇吐着信子的声音此起彼伏...",
		},
		{
			ID: "lost_temple", Name: "失落神庙", Type: "dungeon",
			DangerLevel: 4, MinLevel: 14, MaxLevel: 20,
			Description: "被藤蔓覆盖的古老神庙，内部机关重重，藏有关于羊蹄山之魂的重要线索。",
			Connections: []string{"jungle_tribe"},
			NPCs: []NPC{
				{ID: "temple_guardian", Name: "神庙守护者", Role: "card_dealer",
					Greeting: "「...证明你的资格...」",
					Dialogue: []string{"「神庙考验每一个进入者的实力和智慧。」", "「羊蹄山之魂...它沉睡在山顶...等待着被唤醒...」"},
					IsCardDealer: true, CardTypes: []string{"main_story", "challenge", "growth"}},
			},
			Monsters: []string{"dragon_spawn", "ancient_lich"},
			EnterText: "巨大的石门后是昏暗的神庙大厅。墙壁上的壁画描述着远古的祭祀仪式...",
		},
		{
			ID: "vine_maze", Name: "藤蔓迷宫", Type: "wilderness",
			DangerLevel: 4, MinLevel: 15, MaxLevel: 20,
			Description: "被巨大藤蔓缠绕的迷宫，据说通向某个神秘的地方。",
			Connections: []string{"toxic_swamp"},
			NPCs: []NPC{},
			Monsters: []string{"dragon_spawn", "thunder_golem"},
			EnterText: "巨大的藤蔓像活物一样移动，随时可能改变道路。",
		},
		// 终局区域
		{
			ID: "mt_yotei_summit", Name: "羊蹄山山顶", Type: "wilderness",
			DangerLevel: 5, MinLevel: 18, MaxLevel: 20,
			Description: "羊蹄山的最高峰，传说中羊蹄山之魂沉睡之地。主线剧情的最终舞台。",
			Connections: []string{"soul_trial"},
			NPCs: []NPC{
				{ID: "spirit_guide", Name: "灵魂向导", Role: "card_dealer",
					Greeting: "「...你终于来了...我等了很久...」",
					Dialogue: []string{"「这里是羊蹄山之魂沉睡的地方。」", "「想要唤醒它，你必须通过灵魂试炼场的考验。」", "「所有的线索...所有的冒险...都是为了这一刻。」"},
					IsCardDealer: true, CardTypes: []string{"main_story"}},
			},
			Monsters: []string{"titan", "elder_dragon"},
			EnterText: "你终于站在了羊蹄山之巅。狂风呼啸，云海翻涌。远处，一个巨大的光球悬浮在空中——那就是传说中的羊蹄山之魂。",
		},
		{
			ID: "soul_trial", Name: "灵魂试炼场", Type: "dungeon",
			DangerLevel: 5, MinLevel: 20, MaxLevel: 20,
			Description: "羊蹄山之魂设置的最终试炼。只有通过所有考验的勇者，才能唤醒山魂。",
			Connections: []string{"mt_yotei_summit"},
			NPCs: []NPC{
				{ID: "soul_of_yotei", Name: "羊蹄山之魂", Role: "card_dealer",
					Greeting: "「...证明你配得上这份力量...」",
					Dialogue: []string{"「试炼不只是战斗，更是心灵的考验。」", "「你的选择...将决定这个世界的命运。」", "「勇敢的冒险者...接受最终的试炼吧...」"},
					IsCardDealer: true, CardTypes: []string{"main_story"}},
			},
			Monsters: []string{"elder_dragon", "titan"},
			EnterText: "试炼场是一片虚无的空间。你必须战胜自己的恐惧和弱点，才能获得山魂的认可。",
		},
	}
}

// GetRegionByID returns a region by its ID
func GetRegionByID(id string) *Region {
	for i := range GetAllRegions() {
		if GetAllRegions()[i].ID == id {
			return &GetAllRegions()[i]
		}
	}
	return nil
}

// GetNPCByID returns an NPC from any region
func GetNPCByID(npcID string) *NPC {
	for _, region := range GetAllRegions() {
		for i := range region.NPCs {
			if region.NPCs[i].ID == npcID {
				return &region.NPCs[i]
			}
		}
	}
	return nil
}

// GetStartingRegion returns the starting region for new characters
func GetStartingRegion() *Region {
	return GetRegionByID("border_outpost")
}

// FormatRegionInfo returns a formatted string with region info
func FormatRegionInfo(region *Region) string {
	if region == nil {
		return "未知区域"
	}
	typeStr := map[string]string{"town": "城镇", "wilderness": "野外", "dungeon": "副本"}[region.Type]
	if typeStr == "" {
		typeStr = region.Type
	}
	
	connections := ""
	for i, c := range region.Connections {
		if r := GetRegionByID(c); r != nil {
			if i > 0 {
				connections += "、"
			}
			connections += r.Name
		}
	}
	if connections == "" {
		connections = "无"
	}
	
	return fmt.Sprintf("%s（%s，等级%d-%d）\n%s\n连接区域：%s",
		region.Name, typeStr, region.MinLevel, region.MaxLevel,
		region.Description, connections)
}
