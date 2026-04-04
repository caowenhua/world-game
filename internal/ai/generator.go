package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"strings"
	"time"
)

// Generator handles AI content generation
type Generator struct {
	apiKey    string
	apiURL    string
	model     string
	client    *http.Client
	templates map[string]string
}

// GenerationRequest represents a request to the LLM
type GenerationRequest struct {
	Type      string                 `json:"type"`
	Context   map[string]interface{} `json:"context"`
	Character *CharacterContext      `json:"character"`
	Region    string                 `json:"region"`
}

// CharacterContext provides character state to the LLM
type CharacterContext struct {
	Name       string   `json:"name"`
	Level     int      `json:"level"`
	Traits    []string `json:"traits"`
	Background string   `json:"background"`
}

// GenerationResponse represents the LLM response
type GenerationResponse struct {
	Content    string   `json:"content"`
	Choices    []string `json:"choices,omitempty"`
	Confidence float32  `json:"confidence"`
}

// Fallback content pools for when AI is unavailable
var (
	fallbackDialogues = []string{
		"「欢迎来到羊蹄山冒险者公会，年轻的旅人。我是这里的接待员，有什么需要帮忙的吗？」",
		"「哦？你身上的气质不一般……让我想起很久以前的一位老朋友。」NPC若有所思地打量着你。",
		"「这片土地隐藏着太多秘密，作为初来乍到的冒险者，你要小心行事。」老者压低声音说道。",
		"「主线剧情正在推进...羊蹄山之魂等待着被唤醒。」一个神秘的声音在你脑海中响起。",
		"「冒险者公会悬赏板上有很多任务，报酬丰厚。但要小心那些看似简单的委托。」",
		"「这个村庄虽然偏僻，但每个人都有一段自己的故事。你愿意听吗？」",
		"「前方迷雾森林是冒险者的禁地，据说进去的人很少能活着出来……但也有人说，那里藏着绝世秘籍。」",
		"「最近山区出现了奇怪的动静，村民们都很担心。你愿意去调查一下吗？」",
	}

	// Main storyline dialogues - full story content
	mainStoryDialogues = []string{
		// Chapter 1: Border Outpost
		"「最近山里有些不对劲。迷雾比以前更浓了，而且...有传闻说，羊蹄山的方向，夜里有奇怪的光芒闪过。」哨兵队长压低声音说道。",
		"「你是来寻找机遇的冒险者吧？拿着这个——这是我年轻时收集的一些情报。如果想变强，去猎人小屋找老猎人聊聊。」",
		"「北境的古遗迹里有关于山魂的重要线索。但是那里太危险了...先去废弃矿洞锻炼自己吧。」",

		// Chapter 2: Royal Capital
		"「三天前，我们的预言师做了一个可怕的梦——『永夜将至，山魂沉睡，黑暗从地底升起，吞噬一切光明』。」国王的目光深邃而忧虑。",
		"「传说中的『觉醒者』，受羊蹄山之魂选中的人。只有你才能唤醒山魂，阻止这场浩劫。」",
		"「据说羊蹄山之魂分裂成了三块碎片，散落在王国各地。只有集齐碎片，才能真正唤醒山魂。」",

		// Chapter 3: Ancient Ruins
		"「我在这里守了一千年...守着一个不应该被揭开的秘密。」古代之魂的声音仿佛从远古传来。",
		"「千年前，人类与虚渊古神做了交易——用气运换取力量。羊蹄山之魂...就是这个交易的代价。」",
		"「亡灵巫妖是上一次觉醒者。他选择了吞噬山魂，获得力量。但他失败了，被山魂的力量反噬，化为了不死之身。」",
		"「在你面前有两个选择——唤醒山魂让它继续沉睡，或者解放山魂让它获得自由...或者，吞噬它的力量。」",

		// Chapter 4: Final Choice
		"「你终于来了...我等了很久...觉醒者，你已经走过了漫长的道路。」灵魂向导的身影在光芒中浮现。",
		"「三块碎片的力量正在呼唤你。在灵魂试炼场，你将面临最终的选择——这个选择将决定王国的命运。」",
	}

	// Quest dialogues for side stories
	questDialogues = []string{
		"「这个任务...不简单。但如果你能完成，报酬会很丰厚。」公会会长点了点头。",
		"「先证明自己的实力。接几个C级任务练练手吧。」赏金猎人打量着你。",
		"「想知道什么？只要价钱合适，什么消息都能告诉你。」情报夫人神秘地笑了笑。",
		"「古遗迹里封印着古老的力量。但是那里的古代之魂不是好惹的...」村中长者警告道。",
		"「失落神庙里封印着我们的先祖之魂...我们不敢靠近。」部落首领的目光中闪过一丝恐惧。",
		"「那个黑袍人...我认识他。二十年前，他是王城的宫廷医师。他叫莫青书。」矿工幽灵惨然一笑。",
		"「我是莫青书。我和你一样，也被命运伤害过。但我选择了复仇。」国师的目光冰冷。",
		"「如果你想活下去，就别再查下去了。」铁面判官冷冷地说。",
	}
	fallbackScenes = []string{
		"初始村庄笼罩在淡淡的晨雾中，石板路两旁是错落有致的木屋。远处，羊蹄山的轮廓若隐若现，山顶的积雪在阳光下闪闪发光。空气中弥漫着松木和炊烟的气息，几只麻雀在屋檐下叽叽喳喳。",
		"迷雾森林的边缘，古老的树木遮天蔽日。树干上爬满了青苔，地面上落满了枯叶。一条模糊的小径蜿蜒伸向深处，两旁的灌木丛中似乎有什么东西在移动。",
		"边境小镇的集市热闹非凡，各地冒险者在此交易物资。摊位上摆满了从各地收集来的奇异物品，空气中混杂着香料和烤肉的味道。",
		"羊蹄山的山脚是一片开阔的草甸，野花遍地开放。远处传来羊群的铃声，让人感到一丝宁静。但山顶的阴影中，似乎隐藏着不为人知的危险。",
	}
	fallbackItems = []struct {
		Name        string
		Description string
	}{
		{"强化生命药水", "一瓶散发着红色光芒的药水，可以快速恢复体力。"},
		{"神秘古币", "一面刻有古老符文的钱币，似乎有某种魔力。"},
		{"冒险者手册", "记录了各种怪物弱点的实用指南。"},
		{"旅人地图", "标注了羊蹄山周边地区的详细地图。"},
	}
)

// NewGenerator creates a new AI generator
func NewGenerator(apiKey, apiURL, model string) *Generator {
	return &Generator{
		apiKey: apiKey,
		apiURL: apiURL,
		model:  model,
		client: &http.Client{Timeout: 30 * time.Second},
		templates: map[string]string{
			"main_story":  "作为主线剧情的一部分，生成一段{{role}}与主角的对话，推动复仇主线发展。角色名:{{name}}，背景:{{background}}，当前区域:{{region}}。",
			"side_story":  "生成一段当地普通人的故事对话，展现民间生活。地点:{{region}}。",
			"discovery":   "描述玩家发现的新地点，包括环境、可能的遭遇。",
			"combat":      "描述一场战斗的开始，包括敌人信息和战场描述。",
			"dialogue":    "生成NPC的对话台词。角色:{{name}}，性格:{{traits}}，当前情境:{{situation}}。",
			"item":        "为一个物品生成名称和描述。物品类型:{{type}}，稀有度:{{rarity}}。",
			"scene":       "生成场景描写文字。地点:{{location}}，氛围:{{mood}}，时间段:{{time}}。",
			"quest":       "生成一个支线任务描述。任务类型:{{type}}，难度:{{difficulty}}。",
			"npc_intro":   "为NPC生成开场白。NPC名字:{{name}}，性格:{{personality}}。",
			"choice_prompt": "给出一个两难选择。背景:{{background}}。输出两个选项及其后果。",
		},
	}
}

// GenerateDialogue generates NPC dialogue
func (g *Generator) GenerateDialogue(ctx context.Context, req *GenerationRequest) (*GenerationResponse, error) {
	npcName := fmt.Sprintf("%v", req.Context["npc_name"])
	situation := fmt.Sprintf("%v", req.Context["situation"])
	cardType := fmt.Sprintf("%v", req.Context["card_type"])

	// Use storyline content for main quest cards
	if cardType == "main_story" && len(mainStoryDialogues) > 0 {
		idx := rand.Intn(len(mainStoryDialogues))
		return &GenerationResponse{
			Content:    mainStoryDialogues[idx],
			Confidence: 0.9,
		}, nil
	}

	// Use quest dialogues for side/quest cards
	if cardType == "side_story" || cardType == "quest" {
		idx := rand.Intn(len(questDialogues))
		return &GenerationResponse{
			Content:    questDialogues[idx],
			Confidence: 0.85,
		}, nil
	}

	prompt := fmt.Sprintf(`
你是一个经验丰富的游戏叙事设计师。请为以下情境生成NPC对话：

NPC信息：
- 名字: %s
- 玩家名字: %s
- 玩家等级: %d
- 玩家背景: %s
- 性格特点: %s

当前情境: %s

请生成一段自然的对话，50-100字，符合角色性格和当前情境。
要求：
1. 对话要有角色个性
2. 可以推动剧情或提供线索
3. 适当留有互动空间
4. 不包含任何不当内容

直接输出对话内容，不要解释。`, npcName, req.Character.Name, req.Character.Level, req.Character.Background, strings.Join(req.Character.Traits, ","), situation)

	resp, err := g.callLLM(ctx, prompt)
	if err != nil || resp.Content == "" {
		// Return fallback content
		idx := rand.Intn(len(fallbackDialogues))
		return &GenerationResponse{
			Content:    fallbackDialogues[idx],
			Confidence: 0.5,
		}, nil
	}
	return resp, nil
}

// GenerateSceneDescription generates scene/environment description
func (g *Generator) GenerateSceneDescription(ctx context.Context, region, mood, timeOfDay string) (*GenerationResponse, error) {
	prompt := fmt.Sprintf(`
你是一个沉浸式游戏叙事设计师。请为以下场景生成环境描写：

地区: %s
氛围: %s
时间段: %s

请生成一段身临其境的场景描写，80-150字。
要求：
1. 运用五感（视觉、听觉、嗅觉、触觉）
2. 营造指定的氛围
3. 可以暗示潜在的危险或机遇
4. 为玩家创造探索欲望

直接输出描写内容，不要解释。`, region, mood, timeOfDay)

	resp, err := g.callLLM(ctx, prompt)
	if err != nil || resp.Content == "" {
		idx := rand.Intn(len(fallbackScenes))
		return &GenerationResponse{
			Content:    fallbackScenes[idx],
			Confidence: 0.5,
		}, nil
	}
	return resp, nil
}

// GenerateItemDescription generates item name and description
func (g *Generator) GenerateItemDescription(ctx context.Context, itemType, rarity string) (*GenerationResponse, error) {
	prompt := fmt.Sprintf(`
你是一个游戏物品设计师。请为以下物品生成名称和描述：

物品类型: %s
稀有度: %s

请生成：
1. 一个有吸引力的物品名称
2. 一段描述物品外观和用途的文字，30-50字

稀有度对应：
- common: 普通，灰色
- uncommon: 优秀，绿色
- rare: 稀有，蓝色
- epic: 史诗，紫色
- legendary: 传说，橙色

直接输出名称和描述，用换行分隔。`, itemType, rarity)

	resp, err := g.callLLM(ctx, prompt)
	if err != nil || resp.Content == "" {
		idx := rand.Intn(len(fallbackItems))
		return &GenerationResponse{
			Content:    fmt.Sprintf("%s\n%s", fallbackItems[idx].Name, fallbackItems[idx].Description),
			Confidence: 0.5,
		}, nil
	}
	return resp, nil
}

// GenerateQuest generates a quest description
func (g *Generator) GenerateQuest(ctx context.Context, questType, difficulty string, region string) (*GenerationResponse, error) {
	prompt := fmt.Sprintf(`
你是一个游戏任务设计师。请设计一个支线任务：

任务类型: %s
难度: %s
区域: %s

请生成：
1. 任务名称（简短有力）
2. 任务描述，50-80字，说明背景和目标
3. 任务奖励说明

直接输出任务内容，用空行分隔各部分。`, questType, difficulty, region)

	resp, err := g.callLLM(ctx, prompt)
	if err != nil || resp.Content == "" {
		questTemplates := []string{
			"失踪的旅人\n村民李大爷的儿子三天前进山采药，至今未归。家人在村口焦急等待。\n奖励：50金币 + 村民的感谢",
			"迷雾调查\n冒险者公会悬赏：调查迷雾森林近期出现的异常现象。\n奖励：100金币 + 冒险者声望",
			"野兽侵袭\n边境农场遭到不明野兽袭击，农作物损失惨重。农场主请求帮助。\n奖励：30金币 + 农场主自制干粮",
		}
		idx := rand.Intn(len(questTemplates))
		return &GenerationResponse{
			Content:    questTemplates[idx],
			Confidence: 0.5,
		}, nil
	}
	return resp, nil
}

// GenerateEventSummary generates a summary of an event
func (g *Generator) GenerateEventSummary(ctx context.Context, eventType string, events []string) (*GenerationResponse, error) {
	prompt := fmt.Sprintf(`
你是一个游戏叙事设计师。请用一段话总结以下事件，50字以内：

事件类型: %s
事件列表: %s

用第三人称叙述，简洁有力。`, eventType, strings.Join(events, " -> "))

	resp, err := g.callLLM(ctx, prompt)
	if err != nil || resp.Content == "" {
		summaries := []string{
			"冒险者完成了一次成功的探索，获得了宝贵的经验。",
			"与NPC的对话揭示了羊蹄山深处的秘密。",
			"在迷雾森林边缘发现了可疑的足迹。",
		}
		idx := rand.Intn(len(summaries))
		return &GenerationResponse{
			Content:    summaries[idx],
			Confidence: 0.5,
		}, nil
	}
	return resp, nil
}

// GenerateChoices generates player choices for a dilemma
func (g *Generator) GenerateChoices(ctx context.Context, background string) (*GenerationResponse, error) {
	prompt := fmt.Sprintf(`
你是一个游戏设计师。请为以下背景设计一个两难选择：

玩家背景: %s

请设计两个选择（各20字以内），并简要说明每个选择的后果（各15字以内）。

格式：
选项A: [选择内容]
后果A: [后果]
选项B: [选择内容]
后果B: [后果]`, background)

	resp, err := g.callLLM(ctx, prompt)
	if err != nil || resp.Content == "" {
		choices := []string{
			"选项A: 接受神秘老人的任务\n后果A: 获得稀有道具，但卷入更大的阴谋\n选项B: 拒绝并继续探索\n后果B: 安全但错失机会",
			"选项A: 救助受伤的陌生人\n后果A: 获得新同伴，但消耗了珍贵药品\n选项B: 保持警惕继续前进\n后果B: 保存实力，但可能树敌",
		}
		idx := rand.Intn(len(choices))
		return &GenerationResponse{
			Content:    choices[idx],
			Confidence: 0.5,
		}, nil
	}
	return resp, nil
}

// GenerateNPCBackground generates NPC backstory
func (g *Generator) GenerateNPCBackground(ctx context.Context, npcName, region, personality string) (*GenerationResponse, error) {
	prompt := fmt.Sprintf(`
你是一个RPG游戏叙事设计师。请为一个NPC生成背景故事：

NPC名字: %s
所在地区: %s
性格: %s

请生成一段50-80字的背景故事，包括：
1. NPC的过去
2. 为什么在这个地方
3. 与当地的关系

直接输出背景故事，不要解释。`, npcName, region, personality)

	resp, err := g.callLLM(ctx, prompt)
	if err != nil || resp.Content == "" {
		stories := []string{
			"老村长年轻时是羊蹄山地区著名的猎人，在一次狩猎中失去了右眼。此后他留在村中，保护着这片土地的安宁。",
			"年轻的旅店老板娘来自遥远的南方，为了追寻传说中的宝藏来到这里，却最终在此落地生根。",
			"神秘的草药商人在每个月的满月之夜出现，据说他们掌握着通往秘境的道路。",
		}
		idx := rand.Intn(len(stories))
		return &GenerationResponse{
			Content:    stories[idx],
			Confidence: 0.5,
		}, nil
	}
	return resp, nil
}

// GenerateEnemyDescription generates enemy introduction
func (g *Generator) GenerateEnemyDescription(ctx context.Context, enemyType, region string) (*GenerationResponse, error) {
	prompt := fmt.Sprintf(`
你是一个RPG游戏叙事设计师。请描述一个敌人遭遇：

敌人类型: %s
出现地区: %s

请生成：
1. 敌人的简短描述（20字以内）
2. 敌人的威胁性发言或行为描述（30字以内）
3. 战斗开始时的环境描写（30字以内）

直接输出，用空行分隔。`, enemyType, region)

	resp, err := g.callLLM(ctx, prompt)
	if err != nil || resp.Content == "" {
		enemies := []string{
			"迷雾狼群\n「这些狼的眼睛在黑暗中发出幽幽绿光，令人不寒而栗。」\n周围弥漫着浓重的雾气，可视距离极低。",
			"山地强盗\n「此路是我开，此树是我栽！要从此路过，留下买路财！」\n狭窄的山道两旁是陡峭的岩壁，无处可逃。",
			"迷失亡魂\n「无辜的灵魂在山中游荡，它们会攻击任何靠近的生者。」\n刺骨的寒风伴随着低沉的哀嚎。",
		}
		idx := rand.Intn(len(enemies))
		return &GenerationResponse{
			Content:    enemies[idx],
			Confidence: 0.5,
		}, nil
	}
	return resp, nil
}

// callLLM makes the actual API call to the LLM
func (g *Generator) callLLM(ctx context.Context, prompt string) (*GenerationResponse, error) {
	if g.apiKey == "" {
		return &GenerationResponse{Content: "", Confidence: 0}, fmt.Errorf("no API key configured")
	}

	apiURL := g.apiURL + "/v1/text/chatcompletion_v2"

	reqBody := map[string]interface{}{
		"model": g.model,
		"messages": []map[string]string{
			{"role": "user", "content": prompt},
		},
		"stream": false,
	}

	reqJSON, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", apiURL, bytes.NewBuffer(reqJSON))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", g.apiKey))

	resp, err := g.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to call LLM: %w", err)
	}
	defer resp.Body.Close()

	var llmResp map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&llmResp); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	// Check for API-level errors
	if baseResp, ok := llmResp["base_resp"].(map[string]interface{}); ok {
		if statusCode, ok := baseResp["status_code"].(float64); ok && statusCode != 0 {
			statusMsg, _ := baseResp["status_msg"].(string)
			return nil, fmt.Errorf("API error %d: %s", int(statusCode), statusMsg)
		}
	}

	// Parse MiniMax response format
	content := ""
	if choices, ok := llmResp["choices"].([]interface{}); ok && len(choices) > 0 {
		if choice, ok := choices[0].(map[string]interface{}); ok {
			if msg, ok := choice["message"].(map[string]interface{}); ok {
				if c, ok := msg["content"].(string); ok {
					content = c
				}
			}
		}
	}

	return &GenerationResponse{
		Content:    content,
		Confidence: 0.9,
	}, nil
}
