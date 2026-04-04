package game

import (
	"fmt"
	"math/rand"
)

// CombatResult represents the outcome of a combat action
type CombatResult struct {
	Action          string            `json:"action"`           // attack/defend/skill/flee/item
	Damage          int               `json:"damage"`           // damage dealt
	DamageTaken     int               `json:"damage_taken"`     // damage received
	Healed          int               `json:"healed"`           // HP restored
	MPUsed          int               `json:"mp_used"`          // MP consumed
	SkillUsed       string            `json:"skill_used"`       // skill name
	MonsterHP       int               `json:"monster_hp"`       // monster remaining HP
	MonsterMaxHP    int               `json:"monster_max_hp"`   // monster max HP
	PlayerHP        int               `json:"player_hp"`        // player remaining HP
	PlayerMaxHP     int               `json:"player_max_hp"`    // player max HP
	PlayerMP        int               `json:"player_mp"`       // player remaining MP
	MonsterMaxMP    int               `json:"monster_mp"`       // monster max MP
	MonsterMP       int               `json:"monster_mp"`       // monster remaining MP
	XPGained       int               `json:"xp_gained"`        // XP earned
	GoldGained      int               `json:"gold_gained"`      // Gold earned
	ItemDropped     *ItemDrop          `json:"item_dropped"`     // item if any
	Victory         bool               `json:"victory"`          // true if monster defeated
	Fled            bool               `json:"fled"`             // true if player fled
	LevelUp         bool               `json:"level_up"`         // true if player leveled up
	NewLevel        int                `json:"new_level"`        // new level if leveled up
	CombatLog       []string           `json:"combat_log"`       // narrative log
	IsCritical      bool               `json:"is_critical"`      // critical hit
	IsLevelLocked   bool               `json:"is_level_locked"`  // monster too high level
}

// Monster defines a monster template
type Monster struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Level       int    `json:"level"`
	HP          int    `json:"hp"`
	MP          int    `json:"mp"`
	Attack      int    `json:"attack"`
	Defense     int    `json:"defense"`
	Agility     int    `json:"agility"`
	XP          int    `json:"xp"`
	Gold        int    `json:"gold"`
	Element     string `json:"element"`      // fire, ice, thunder, neutral
	Skills      []string `json:"skills"`     // monster skills
	LootTable   []ItemDrop `json:"loot_table"` // possible drops
}

type ItemDrop struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Type        string  `json:"type"`   // weapon, armor, consumable
	Rarity      string  `json:"rarity"` // common, uncommon, rare, epic, legendary
	DropRate    float32 `json:"drop_rate"` // 0.0 to 1.0
}

// PlayerAction represents an action taken by the player in combat
type PlayerAction struct {
	Action     string `json:"action"`      // attack, defend, skill, item, flee
	SkillID    string `json:"skill_id,omitempty"`
	ItemSlot   int    `json:"item_slot,omitempty"`
	Target     string `json:"target,omitempty"` // "monster" or "self"
}

// Skill defines a player skill
type Skill struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	MPCost      int    `json:"mp_cost"`
	Damage      int    `json:"damage"`     // base damage multiplier (0 = healing/buff)
	Accuracy    float32 `json:"accuracy"` // 0.0 to 1.0
	Effect      string `json:"effect"`     // damage, heal, buff, debuff
	Element     string `json:"element"`    // fire, ice, thunder, neutral
	Cooldown    int    `json:"cooldown"`   // turns before can use again
	SelfOnly    bool   `json:"self_only"`  // only affects self
}

// GetDefaultSkills returns all available skills
func GetAllSkills() []Skill {
	return []Skill{
		{ID: "attack", Name: "普通攻击", Description: "基础攻击，无消耗", MPCost: 0, Damage: 100, Accuracy: 0.95, Effect: "damage", Element: "neutral", Cooldown: 0, SelfOnly: false},
		{ID: "heavy_strike", Name: "重击", Description: "造成150%伤害，但命中率较低", MPCost: 10, Damage: 150, Accuracy: 0.75, Effect: "damage", Element: "neutral", Cooldown: 0, SelfOnly: false},
		{ID: "defend", Name: "防御", Description: "本回合受到伤害减半，恢复少量HP", MPCost: 0, Damage: 0, Accuracy: 1.0, Effect: "defend", Element: "neutral", Cooldown: 0, SelfOnly: true},
		{ID: "fireball", Name: "火焰术", Description: "造成火属性伤害", MPCost: 15, Damage: 120, Accuracy: 0.90, Effect: "damage", Element: "fire", Cooldown: 0, SelfOnly: false},
		{ID: "ice_shard", Name: "冰刺术", Description: "造成冰属性伤害，有几率冻结", MPCost: 15, Damage: 110, Accuracy: 0.85, Effect: "damage", Element: "ice", Cooldown: 0, SelfOnly: false},
		{ID: "heal", Name: "治愈术", Description: "恢复30%最大HP", MPCost: 20, Damage: 0, Accuracy: 1.0, Effect: "heal", Element: "neutral", Cooldown: 0, SelfOnly: true},
		{ID: "lightning", Name: "雷电术", Description: "造成雷属性伤害，可能麻痹", MPCost: 20, Damage: 140, Accuracy: 0.80, Effect: "damage", Element: "thunder", Cooldown: 0, SelfOnly: false},
		{ID: "double_strike", Name: "二连击", Description: "连续攻击2次，每次50%伤害", MPCost: 5, Damage: 50, Accuracy: 0.90, Effect: "damage", Element: "neutral", Cooldown: 0, SelfOnly: false},
		{ID: "power_buff", Name: "力量强化", Description: "本场战斗攻击力+30%", MPCost: 10, Damage: 0, Accuracy: 1.0, Effect: "buff", Element: "neutral", Cooldown: 0, SelfOnly: true},
	}
}

// ExecuteCombat performs a single combat round
func ExecuteCombat(playerHP, playerMaxHP, playerMP, playerLevel, playerStr, playerInt, playerAgi int, playerSkills []string, monster *Monster, action *PlayerAction) *CombatResult {
	result := &CombatResult{
		PlayerHP:     playerHP,
		PlayerMaxHP:  playerMaxHP,
		PlayerMP:     playerMP,
		MonsterHP:    monster.HP,
		MonsterMaxHP: monster.HP,
		MonsterMP:    monster.MP,
		MonsterMaxMP: monster.MP,
		CombatLog:    []string{},
	}

	// Check if monster is too high level
	if monster.Level > playerLevel+5 {
		result.IsLevelLocked = true
		result.CombatLog = append(result.CombatLog, fmt.Sprintf("%s的等级太高了！你无法战胜它！", monster.Name))
		return result
	}

	// Get skill info
	allSkills := GetAllSkills()
	skillMap := make(map[string]Skill)
	for _, s := range allSkills {
		skillMap[s.ID] = s
	}

	// Execute player action
	switch action.Action {
	case "attack":
		damage := calculateDamage(float64(playerStr), float64(monster.Defense), 1.0, 1.0)
		result.Damage = damage
		result.Action = "普通攻击"
		result.CombatLog = append(result.CombatLog, fmt.Sprintf("你挥剑攻击，造成 %d 点伤害！", damage))
		result.IsCritical = rand.Float32() < 0.1
		if result.IsCritical {
			result.Damage = int(float64(damage) * 1.5)
			result.CombatLog = append(result.CombatLog, "暴击！")
		}

	case "defend":
		result.Action = "防御"
		result.Healed = playerMaxHP / 20
		if result.Healed < 5 {
			result.Healed = 5
		}
		result.PlayerHP = min(playerHP+result.Healed, playerMaxHP)
		result.CombatLog = append(result.CombatLog, fmt.Sprintf("你采取防御姿态，恢复 %d HP！", result.Healed))

	case "skill":
		skill, ok := skillMap[action.SkillID]
		if !ok {
			result.Action = "普通攻击"
			damage := calculateDamage(float64(playerStr), float64(monster.Defense), 1.0, 1.0)
			result.Damage = damage
			result.CombatLog = append(result.CombatLog, fmt.Sprintf("你挥剑攻击，造成 %d 点伤害！", damage))
			break
		}

		// Check MP
		if playerMP < skill.MPCost {
			result.Action = "普通攻击"
			damage := calculateDamage(float64(playerStr), float64(monster.Defense), 1.0, 1.0)
			result.Damage = damage
			result.MPUsed = 0
			result.SkillUsed = "（MP不足，使用普通攻击）"
			result.CombatLog = append(result.CombatLog, fmt.Sprintf("MP不足！你挥剑攻击，造成 %d 点伤害！", damage))
			break
		}

		result.MPUsed = skill.MPCost
		result.SkillUsed = skill.Name

		switch skill.Effect {
		case "damage":
			elemBonus := getElementBonus(skill.Element, monster.Element)
			damage := calculateDamage(float64(playerStr), float64(monster.Defense), float64(skill.Damage)/100.0, elemBonus)
			hit := rand.Float32() < skill.Accuracy
			if !hit {
				damage = 0
				result.CombatLog = append(result.CombatLog, fmt.Sprintf("你施展「%s」，但被闪避了！", skill.Name))
			} else {
				result.Damage = damage
				result.IsCritical = rand.Float32() < 0.1
				if result.IsCritical {
					result.Damage = int(float64(damage) * 1.5)
					result.CombatLog = append(result.CombatLog, fmt.Sprintf("你施展「%s」，暴击！造成 %d 点%s伤害！", skill.Name, damage, skill.Element))
				} else {
					result.CombatLog = append(result.CombatLog, fmt.Sprintf("你施展「%s」，造成 %d 点%s伤害！", skill.Name, damage, skill.Element))
				}
			}

		case "heal":
			result.Healed = int(float64(playerMaxHP) * 0.3)
			result.PlayerHP = min(playerHP+result.Healed, playerMaxHP)
			result.CombatLog = append(result.CombatLog, fmt.Sprintf("你施展「%s」，恢复了 %d HP！", skill.Name, result.Healed))

		case "buff":
			result.Damage = int(float64(playerStr) * 0.3)
			result.CombatLog = append(result.CombatLog, fmt.Sprintf("你施展「%s」，攻击力提升！"))
		}

	case "item":
		result.Action = "使用道具"
		result.CombatLog = append(result.CombatLog, "你使用了背包中的道具...")

	case "flee":
		fleeChance := float64(playerAgi) / float64(playerAgi+monster.Agility)
		if rand.Float64() < fleeChance {
			result.Fled = true
			result.CombatLog = append(result.CombatLog, "你成功逃脱了！")
			return result
		} else {
			result.Fled = false
			result.CombatLog = append(result.CombatLog, "逃跑失败！")
		}
	}

	// Apply damage to monster
	monsterCurrentHP := monster.HP - result.Damage
	if monsterCurrentHP < 0 {
		monsterCurrentHP = 0
	}
	result.MonsterHP = monsterCurrentHP

	// Check victory
	if result.MonsterHP <= 0 {
		result.Victory = true
		result.XPGained = monster.XP
		result.GoldGained = monster.Gold + rand.Intn(20)

		// Roll for item drop
		for _, loot := range monster.LootTable {
			if rand.Float32() < loot.DropRate {
				result.ItemDropped = &loot
				break
			}
		}

		// Calculate level up
		if result.XPGained > 0 {
			// Level up check deferred to caller
		}
		return result
	}

	// Monster counterattack
	if action.Action != "flee" || !result.Fled {
		counterDamage := calculateMonsterDamage(monster, playerStr/2)
		if action.Action == "defend" {
			counterDamage = counterDamage / 2
		}
		result.DamageTaken = counterDamage
		result.PlayerHP = playerHP - counterDamage
		if result.PlayerHP < 0 {
			result.PlayerHP = 0
		}
		elementName := map[string]string{"fire": "火", "ice": "冰", "thunder": "雷", "neutral": ""}[monster.Element]
		if elementName != "" {
			elementName = elementName + "属性"
		}
		result.CombatLog = append(result.CombatLog, fmt.Sprintf("%s反击！造成 %d 点%s伤害！", monster.Name, counterDamage, elementName))
	}

	return result
}

// StartCombat begins a new combat encounter
func StartCombat(playerLevel, playerHP, playerMaxHP, playerMP int) *Monster {
	monsters := GenerateMonstersForLevel(playerLevel)
	monster := monsters[rand.Intn(len(monsters))]
	return &monster
}

// GenerateMonstersForLevel generates monsters appropriate for player level
func GenerateMonstersForLevel(level int) []Monster {
	monsters := []Monster{
		// Level 1-5
		{ID: "slime", Name: "史莱姆", Level: 1, HP: 20, MP: 0, Attack: 5, Defense: 2, Agility: 8, XP: 15, Gold: 5, Element: "neutral", Skills: []string{}, LootTable: []ItemDrop{{ID: "slime_gel", Name: "史莱姆凝胶", Description: "黏糊糊的凝胶，可用于炼金", Type: "consumable", Rarity: "common", DropRate: 0.3}}},
		{ID: "wolf", Name: "灰狼", Level: 2, HP: 35, MP: 0, Attack: 10, Defense: 5, Agility: 12, XP: 25, Gold: 10, Element: "neutral", Skills: []string{}, LootTable: []ItemDrop{{ID: "wolf_pelt", Name: "狼皮", Description: "灰色的狼皮，可卖钱", Type: "misc", Rarity: "common", DropRate: 0.4}}},
		{ID: "goblin", Name: "哥布林", Level: 3, HP: 40, MP: 10, Attack: 12, Defense: 6, Agility: 10, XP: 30, Gold: 15, Element: "neutral", Skills: []string{"scratch"}, LootTable: []ItemDrop{{ID: "goblin_dagger", Name: "哥布林匕首", Description: "哥布林常用的短武器", Type: "weapon", Rarity: "common", DropRate: 0.2}}},
		{ID: "giant_spider", Name: "巨蜘蛛", Level: 4, HP: 50, MP: 20, Attack: 15, Defense: 8, Agility: 14, XP: 40, Gold: 20, Element: "neutral", Skills: []string{"web_shot"}, LootTable: []ItemDrop{{ID: "spider_silk", Name: "蜘蛛丝", Description: "坚韧的蛛丝，用途广泛", Type: "consumable", Rarity: "uncommon", DropRate: 0.25}}},
		{ID: "skeleton", Name: "骷髅兵", Level: 5, HP: 60, MP: 0, Attack: 18, Defense: 10, Agility: 8, XP: 50, Gold: 25, Element: "neutral", Skills: []string{"bone_throw"}, LootTable: []ItemDrop{{ID: "bone_shard", Name: "骨头碎片", Description: "蕴含着亡者之力", Type: "misc", Rarity: "common", DropRate: 0.5}}},
		// Level 6-10
		{ID: "orc", Name: "兽人战士", Level: 7, HP: 100, MP: 0, Attack: 25, Defense: 15, Agility: 8, XP: 80, Gold: 40, Element: "neutral", Skills: []string{"orc_chop"}, LootTable: []ItemDrop{{ID: "orc_trophy", Name: "兽人战旗", Description: "兽人的战利品", Type: "misc", Rarity: "uncommon", DropRate: 0.2}}},
		{ID: "fire_sprite", Name: "火焰精灵", Level: 8, HP: 70, MP: 50, Attack: 22, Defense: 8, Agility: 18, XP: 90, Gold: 35, Element: "fire", Skills: []string{"fireball"}, LootTable: []ItemDrop{{ID: "fire_essence", Name: "火焰精华", Description: "纯化的火焰元素", Type: "consumable", Rarity: "rare", DropRate: 0.15}}},
		{ID: "ice_wraith", Name: "冰霜幽灵", Level: 9, HP: 85, MP: 60, Attack: 26, Defense: 10, Agility: 20, XP: 100, Gold: 45, Element: "ice", Skills: []string{"ice_shard"}, LootTable: []ItemDrop{{ID: "ice_crystal", Name: "冰霜水晶", Description: "冰冷的结晶体", Type: "misc", Rarity: "rare", DropRate: 0.15}}},
		{ID: "dark_knight", Name: "黑暗骑士", Level: 10, HP: 150, MP: 30, Attack: 32, Defense: 22, Agility: 10, XP: 150, Gold: 80, Element: "neutral", Skills: []string{"dark_slash"}, LootTable: []ItemDrop{{ID: "dark_blade", Name: "暗黑之刃", Description: "被黑暗侵蚀的剑", Type: "weapon", Rarity: "epic", DropRate: 0.05}}},
		// Level 11-15
		{ID: "thunder_golem", Name: "雷电傀儡", Level: 12, HP: 200, MP: 80, Attack: 38, Defense: 30, Agility: 6, XP: 200, Gold: 100, Element: "thunder", Skills: []string{"lightning_bolt"}, LootTable: []ItemDrop{{ID: "thunder_core", Name: "雷电核心", Description: "蕴含雷电力量的宝石", Type: "misc", Rarity: "epic", DropRate: 0.08}}},
		{ID: "dragon_spawn", Name: "幼龙", Level: 14, HP: 250, MP: 100, Attack: 45, Defense: 35, Agility: 14, XP: 300, Gold: 150, Element: "fire", Skills: []string{"dragon_fire", "claw"}, LootTable: []ItemDrop{{ID: "dragon_scale", Name: "龙鳞", Description: "幼龙的鳞片，坚硬无比", Type: "armor", Rarity: "epic", DropRate: 0.1}}},
		{ID: "ancient_lich", Name: "远古巫妖", Level: 15, HP: 180, MP: 200, Attack: 40, Defense: 20, Agility: 15, XP: 350, Gold: 200, Element: "ice", Skills: []string{"soul_drain", "frost_nova"}, LootTable: []ItemDrop{{ID: "soul_gem", Name: "灵魂宝石", Description: "封印着强大灵魂的宝石", Type: "consumable", Rarity: "legendary", DropRate: 0.05}}},
		// Level 16-20
		{ID: "titan", Name: "泰坦巨人", Level: 18, HP: 500, MP: 50, Attack: 60, Defense: 50, Agility: 4, XP: 600, Gold: 300, Element: "neutral", Skills: []string{"earthquake", "rock_throw"}, LootTable: []ItemDrop{{ID: "titan_heart", Name: "泰坦心脏", Description: "蕴含着远古力量的器官", Type: "consumable", Rarity: "legendary", DropRate: 0.03}}},
		{ID: "elder_dragon", Name: "古龙", Level: 20, HP: 800, MP: 200, Attack: 80, Defense: 60, Agility: 20, XP: 1000, Gold: 500, Element: "fire", Skills: []string{"dragon_fire", "meteor", "tail_sweep"}, LootTable: []ItemDrop{{ID: "dragon_heart", Name: "龙心", Description: "传说中蕴含无尽力量的心脏", Type: "consumable", Rarity: "legendary", DropRate: 0.02}, {ID: "dragon_crown", Name: "龙冠", Description: "龙的至宝，传说级的头盔", Type: "armor", Rarity: "legendary", DropRate: 0.01}}},
	}

	// Filter monsters appropriate for player level
	result := []Monster{}
	for _, m := range monsters {
		if m.Level >= level && m.Level <= level+3 {
			result = append(result, m)
		}
	}
	if len(result) == 0 {
		// Fallback: find closest monsters
		for _, m := range monsters {
			if abs(m.Level - level) <= 5 {
				result = append(result, m)
			}
		}
	}
	if len(result) == 0 {
		result = monsters[:3]
	}
	return result
}

func calculateDamage(attack, defense, multiplier, elementBonus float64) int {
	base := (attack - defense/2) * multiplier * elementBonus
	variance := 0.8 + rand.Float64()*0.4
	damage := int(base * variance)
	if damage < 1 {
		damage = 1
	}
	return damage
}

func calculateMonsterDamage(monster *Monster, playerDefense int) int {
	base := float64(monster.Attack - playerDefense/2)
	variance := 0.8 + rand.Float64()*0.4
	damage := int(base * variance)
	if damage < 1 {
		damage = 1
	}
	return damage
}

func getElementBonus(attackElem, defenseElem string) float64 {
	// Simple rock-paper-scissors: fire>ice>thunder>fire, neutral beats nothing
	bonuses := map[string]map[string]float64{
		"fire":    {"ice": 1.5, "thunder": 0.8, "neutral": 1.0, "fire": 1.0},
		"ice":     {"thunder": 1.5, "fire": 0.8, "neutral": 1.0, "ice": 1.0},
		"thunder": {"fire": 1.5, "ice": 0.8, "neutral": 1.0, "thunder": 1.0},
		"neutral": {"neutral": 1.0, "fire": 1.0, "ice": 1.0, "thunder": 1.0},
	}
	if m, ok := bonuses[attackElem]; ok {
		if bonus, ok := m[defenseElem]; ok {
			return bonus
		}
	}
	return 1.0
}

func abs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
