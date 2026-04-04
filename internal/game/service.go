package game

import (
	"context"
	"encoding/json"
	"fmt"
	"math/rand"
	"time"

	"github.com/aiworld/game-full/internal/ai"
	"github.com/aiworld/game-full/internal/deck"
	"github.com/aiworld/game-full/internal/store"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// GameService handles all game logic
type GameService struct {
	store     *store.MongoStore
	aiGen    *ai.Generator
}

// NewGameService creates a new game service
func NewGameService(store *store.MongoStore, aiGen *ai.Generator) *GameService {
	return &GameService{
		store:  store,
		aiGen: aiGen,
	}
}

// CreateCharacter creates a new character for a player
func (s *GameService) CreateCharacter(ctx context.Context, playerID primitive.ObjectID, req *CreateCharacterRequest) (*store.Character, error) {
	char := &store.Character{
		PlayerID:   playerID,
		Name:       req.Name,
		Background: req.Background,
		Traits:     req.Traits,
		Alignment: req.Alignment,
		Level:      1,
		XP:         0,
		Title:      "新人冒险者",
		Health: store.StatValue{
			Current: 100,
			Max:     100,
		},
		Spirit: store.StatValue{
			Current: 100,
			Max:     100,
		},
		Strength:    10 + rand.Intn(5),
		Intelligence: 10 + rand.Intn(5),
		Charisma:    10 + rand.Intn(5),
		Agility:     10 + rand.Intn(5),
		CurrentRegion: "starting_village",
		Position: store.Position{
			X:      0,
			Y:      0,
			Z:      0,
			Region: "starting_village",
		},
		Abilities:       []string{},
		DiscoveredLocs: []string{"starting_village"},
		KnownFactions:  []string{"冒险者公会"},
		LoreUnlocked:  []string{},
		DeckState:      deckToDeckState(deck.BuildDeck(1, 0)),
		Relationships:  make(map[string]store.Relationship),
		Inventory:      []store.InventoryItem{},
		Gold:           50,
		ActiveQuests:   []store.QuestProgress{},
	}

	// Generate background if not provided
	if char.Background == "" {
		bg := s.generateBackground(char)
		char.Background = bg
	}

	// Generate starting inventory
	char.Inventory = []store.InventoryItem{
		{
			ID:          "basic_sword",
			Name:        "新手长剑",
			Description: "一把普通的长剑，适合新手冒险者。",
			Type:        "weapon",
			Rarity:      "common",
			Equipped:    true,
			Value:       10,
		},
		{
			ID:          "basic_armor",
			Name:        "布甲",
			Description: "简单的防护装备。",
			Type:        "armor",
			Rarity:      "common",
			Equipped:    true,
			Value:       5,
		},
	}

	// Set initial relationships
	char.Relationships = map[string]store.Relationship{
		"guild_guild": {
			Name:       "冒险者公会",
			Affection:  50,
			Trust:      50,
			Reputation: 0,
		},
	}

	if err := s.store.CreateCharacter(ctx, char); err != nil {
		return nil, err
	}

	// Record character creation event
	s.recordEvent(ctx, char.ID, "character_creation", "main_story", "starting_village",
		fmt.Sprintf("%s开始了冒险之旅", char.Name), nil)

	return char, nil
}

func (s *GameService) generateBackground(char *store.Character) string {
	backgrounds := []string{
		"曾经是一名普通村民，直到家园被毁，立志复仇",
		"流浪的武术家，寻找传说中的武学秘籍",
		"没落贵族的后裔，想要恢复家族荣光",
		"赏金猎人，为了金钱和荣誉而战",
		"学者，痴迷于古代遗迹的秘密",
	}
	return backgrounds[rand.Intn(len(backgrounds))]
}

// InteractWithDealer handles player interaction with a dealer
func (s *GameService) InteractWithDealer(ctx context.Context, charID primitive.ObjectID, dealerID, dealerType string) (*InteractResponse, error) {
	char, err := s.store.GetCharacterByID(ctx, charID)
	if err != nil {
		return nil, fmt.Errorf("character not found: %w", err)
	}

	// Check if deck needs regeneration
	if char.DeckState.CurrentIndex >= len(char.DeckState.Cards) {
		char.DeckState = deckToDeckState(deck.BuildDeck(char.Level, char.DeckState.CycleCount))
	}

	// Draw a card
	card, err := s.drawCard(&char.DeckState)
	if err != nil {
		return nil, err
	}

	// Check if this card type should trigger this dealer
	if !deck.ShouldTrigger(dealerType, card.Type) {
		// Skip to next valid card
		for i := 0; i < 5; i++ { // Max 5 skips
			nextCard, err := s.drawCard(&char.DeckState)
			if err != nil {
				break
			}
			card = nextCard
			if deck.ShouldTrigger(dealerType, card.Type) {
				break
			}
		}
	}

	// Generate content based on card type
	eventContent := s.generateEventContent(ctx, char, card, dealerType)

	// Apply state changes
	stateChanges := s.applyStateChanges(char, card)

	// Update character in database
	update := bson.M{
		"deck_state": char.DeckState,
	}
	for k, v := range stateChanges {
		update[k] = v
	}
	if err := s.store.UpdateCharacter(ctx, char.ID, update); err != nil {
		return nil, err
	}

	// Record event
	s.recordEvent(ctx, charID, "dealer_interaction", card.Type, char.CurrentRegion,
		eventContent.Summary, stateChanges)

	// Record chat message
	if eventContent.Dialogue != "" {
		s.store.CreateChatMessage(ctx, &store.ChatMessage{
			CharacterID: charID,
			NPCID:      dealerID,
			NPCName:    "NPC",
			Sender:     "npc",
			Content:    eventContent.Dialogue,
		})
	}

	return &InteractResponse{
		Card:          card,
		Content:       eventContent,
		StateChanges:  stateChanges,
		Character:     char,
	}, nil
}

func (s *GameService) drawCard(ds *store.DeckState) (*deck.Card, error) {
	// Convert store.DeckState to deck.Deck
	d := &deck.Deck{
		Cards:        make([]deck.Card, len(ds.Cards)),
		CurrentIndex: ds.CurrentIndex,
		CycleCount:   ds.CycleCount,
	}
	for i, c := range ds.Cards {
		d.Cards[i] = deck.Card{
			ID:             c.ID,
			Type:          c.Type,
			Name:          c.Name,
			Description:   c.Description,
			Priority:      c.Priority,
			IsUrgent:      c.IsUrgent,
			OccurrenceNum: c.OccurrenceNum,
		}
	}

	card, err := d.Draw()
	if err != nil {
		return nil, err
	}

	// Update DeckState
	ds.CurrentIndex = d.CurrentIndex
	ds.CycleCount = d.CycleCount

	return card, nil
}

// deckToDeckState converts a deck.Deck to store.DeckState
func deckToDeckState(d *deck.Deck) store.DeckState {
	cards := make([]store.DeckCard, len(d.Cards))
	for i, c := range d.Cards {
		cards[i] = store.DeckCard{
			ID:            c.ID,
			Type:          c.Type,
			Name:          c.Name,
			Description:   c.Description,
			Priority:      c.Priority,
			IsUrgent:      c.IsUrgent,
			OccurrenceNum: c.OccurrenceNum,
		}
	}
	return store.DeckState{
		Cards:        cards,
		CurrentIndex: d.CurrentIndex,
		CycleCount:   d.CycleCount,
		IsShuffled:   d.IsShuffled,
	}
}

type EventContent struct {
	Type      string   `json:"type"`
	Summary    string   `json:"summary"`
	Dialogue   string   `json:"dialogue"`
	Scene      string   `json:"scene"`
	Choices    []string `json:"choices,omitempty"`
	Item       *store.InventoryItem `json:"item,omitempty"`
}

func (s *GameService) generateEventContent(ctx context.Context, char *store.Character, card *deck.Card, dealerType string) *EventContent {
	charCtx := &ai.CharacterContext{
		Name:       char.Name,
		Level:      char.Level,
		Traits:     char.Traits,
		Background: char.Background,
	}

	switch card.Type {
	case deck.CardTypeMainStory:
		req := &ai.GenerationRequest{
			Type:      "main_story",
			Character: charCtx,
			Region:    char.CurrentRegion,
			Context: map[string]interface{}{
				"npc_name":  "神秘向导",
				"situation": "正在推进复仇主线",
			},
		}
		resp, _ := s.aiGen.GenerateDialogue(ctx, req)
		return &EventContent{
			Type:    "main_story",
			Summary: resp.Content,
			Dialogue: resp.Content,
		}

	case deck.CardTypeSideStory:
		req := &ai.GenerationRequest{
			Type:      "side_story",
			Character: charCtx,
			Region:    char.CurrentRegion,
			Context: map[string]interface{}{
				"npc_name":  "当地居民",
				"situation": "讲述当地的故事",
			},
		}
		resp, _ := s.aiGen.GenerateDialogue(ctx, req)
		return &EventContent{
			Type:     "side_story",
			Summary:  resp.Content,
			Dialogue: resp.Content,
		}

	case deck.CardTypeDiscovery:
		resp, _ := s.aiGen.GenerateSceneDescription(ctx, char.CurrentRegion, "神秘", "中午")
		return &EventContent{
			Type:   "discovery",
			Scene:  resp.Content,
		}

	case deck.CardTypeGrowth:
		item := &store.InventoryItem{
			ID:          fmt.Sprintf("item_%d", time.Now().UnixNano()),
			Name:        "神秘宝箱",
			Description: "一个散发着微光的宝箱",
			Type:        "treasure",
			Rarity:      "rare",
			Equipped:    false,
			Value:       100,
		}
		return &EventContent{
			Type:    "growth",
			Summary: "你发现了" + item.Name,
			Item:    item,
		}

	case deck.CardTypeMood:
		resp, _ := s.aiGen.GenerateSceneDescription(ctx, char.CurrentRegion, "孤寂", "黄昏")
		return &EventContent{
			Type:   "mood",
			Scene:  resp.Content,
		}

	default:
		return &EventContent{
			Type:    "empty",
			Summary: "平静无事，继续前进吧",
		}
	}
}

func (s *GameService) applyStateChanges(char *store.Character, card *deck.Card) map[string]interface{} {
	changes := make(map[string]interface{})

	switch card.Type {
	case deck.CardTypeGrowth:
		char.XP += 10 * char.Level
		char.Gold += 20
		changes["xp"] = char.XP
		changes["gold"] = char.Gold

	case deck.CardTypeChallenge:
		char.Health.Current -= 10
		if char.Health.Current < 0 {
			char.Health.Current = 0
		}
		changes["health"] = char.Health

	case deck.CardTypeMood:
		char.Spirit.Current = char.Spirit.Max // Restore spirit
		changes["spirit"] = char.Spirit
	}

	// Level up check
	if char.XP >= char.Level*100 {
		char.Level++
		char.XP = 0
		char.Health.Max += 10
		char.Health.Current = char.Health.Max
		char.Title = getTitle(char.Level)
		changes["level"] = char.Level
		changes["title"] = char.Title
	}

	return changes
}

func getTitle(level int) string {
	titles := []string{
		"新人冒险者", "初级冒险者", "中级冒险者",
		"资深冒险者", "精英冒险者", "大师冒险者",
		"传奇冒险者",
	}
	if level >= len(titles) {
		return titles[len(titles)-1]
	}
	return titles[level-1]
}

func (s *GameService) recordEvent(ctx context.Context, charID primitive.ObjectID, eventType, cardType, region, summary string, stateChanges map[string]interface{}) {
	event := &store.GameEvent{
		CharacterID: charID,
		EventType:   eventType,
		CardType:    cardType,
		Region:      region,
		Summary:     summary,
		StateChanges: stateChanges,
	}
	s.store.CreateEvent(ctx, event)
}

// Request/Response types
type CreateCharacterRequest struct {
	Name       string   `json:"name"`
	Background string   `json:"background"`
	Traits     []string `json:"traits"`
	Alignment  string   `json:"alignment"`
}

type InteractResponse struct {
	Card         *deck.Card          `json:"card"`
	Content      *EventContent       `json:"content"`
	StateChanges map[string]interface{} `json:"state_changes"`
	Character    *store.Character     `json:"character"`
}

// GetCharacter retrieves a character
func (s *GameService) GetCharacter(ctx context.Context, charID primitive.ObjectID) (*store.Character, error) {
	return s.store.GetCharacterByID(ctx, charID)
}

// GetCharacterEvents retrieves recent events for a character
func (s *GameService) GetCharacterEvents(ctx context.Context, charID primitive.ObjectID, limit int64) ([]*store.GameEvent, error) {
	return s.store.GetEventsByCharacterID(ctx, charID, limit)
}

// GetChatHistory retrieves chat messages for a character
func (s *GameService) GetChatHistory(ctx context.Context, charID primitive.ObjectID, limit int64) ([]*store.ChatMessage, error) {
	return s.store.GetChatMessages(ctx, charID, limit)
}

// MoveCharacter moves a character to a new location
func (s *GameService) MoveCharacter(ctx context.Context, charID primitive.ObjectID, newRegion string, x, y, z float64) (*MoveResponse, error) {
	char, err := s.store.GetCharacterByID(ctx, charID)
	if err != nil {
		return nil, fmt.Errorf("character not found: %w", err)
	}

	// Validate region exists and is connected
	region := GetRegionByID(newRegion)
	if region == nil {
		return nil, fmt.Errorf("region not found: %s", newRegion)
	}

	// Check if connected to current region (for future use)
	for _, conn := range region.Connections {
		if conn == char.CurrentRegion {
			break
		}
	}
	// Also allow if character already knows this region
	for _, known := range char.DiscoveredLocs {
		if known == newRegion {
			break
		}
	}

	update := bson.M{
		"current_region": newRegion,
		"position": store.Position{
			X:      x,
			Y:      y,
			Z:      z,
			Region: newRegion,
		},
	}

	discovered := false
	for _, loc := range char.DiscoveredLocs {
		if loc == newRegion {
			discovered = true
			break
		}
	}
	if !discovered {
		char.DiscoveredLocs = append(char.DiscoveredLocs, newRegion)
		update["discovered_locations"] = char.DiscoveredLocs
	}

	if err := s.store.UpdateCharacter(ctx, charID, update); err != nil {
		return nil, err
	}

	char, err = s.store.GetCharacterByID(ctx, charID)
	if err != nil {
		return nil, err
	}

	// Determine if entering combat zone
	combatZone := region.DangerLevel > 0 && (region.Type == "wilderness" || region.Type == "dungeon")
	
	return &MoveResponse{
		Character:    char,
		Region:      region,
		Discovered:  !discovered,
		CombatZone:  combatZone,
	}, nil
}

// StartCombatForRegion begins combat in the current region
func (s *GameService) StartCombatForRegion(ctx context.Context, charID primitive.ObjectID) (*CombatResponse, error) {
	char, err := s.store.GetCharacterByID(ctx, charID)
	if err != nil {
		return nil, fmt.Errorf("character not found: %w", err)
	}

	region := GetRegionByID(char.CurrentRegion)
	if region == nil || len(region.Monsters) == 0 {
		return nil, fmt.Errorf("no monsters in this region")
	}

	// Generate monster based on region
	monsters := GenerateMonstersForLevel(char.Level)
	if len(monsters) == 0 {
		monsters = GenerateMonstersForLevel(char.Level)
	}

	// Get available skills
	availableSkills := GetAllSkills()
	charSkills := []Skill{}
	for _, skill := range availableSkills {
		for _, charSkill := range char.Abilities {
			if skill.ID == charSkill || skill.ID == "attack" || skill.ID == "defend" {
				charSkills = append(charSkills, skill)
				break
			}
		}
	}
	// Always include basic skills
	hasAttack := false
	hasDefend := false
	for _, s := range charSkills {
		if s.ID == "attack" {
			hasAttack = true
		}
		if s.ID == "defend" {
			hasDefend = true
		}
	}
	if !hasAttack {
		charSkills = append([]Skill{availableSkills[0]}, charSkills...) // attack
	}
	if !hasDefend {
		charSkills = append(charSkills, availableSkills[2]) // defend
	}

	return &CombatResponse{
		Monster:        &monsters[0],
		MonsterHP:      monsters[0].HP,
		MonsterMaxHP:   monsters[0].HP,
		MonsterMP:      monsters[0].MP,
		MonsterMaxMP:   monsters[0].MP,
		PlayerHP:      char.Health.Current,
		PlayerMaxHP:   char.Health.Max,
		PlayerMP:      char.Spirit.Current,
		PlayerMaxMP:   char.Spirit.Max,
		AvailableSkills: charSkills,
		RegionInfo:    FormatRegionInfo(region),
	}, nil
}

// ExecuteCombatAction performs a combat action
func (s *GameService) ExecuteCombatAction(ctx context.Context, charID primitive.ObjectID, action *PlayerAction) (*CombatResult, error) {
	char, err := s.store.GetCharacterByID(ctx, charID)
	if err != nil {
		return nil, fmt.Errorf("character not found: %w", err)
	}

	// Get skill
	allSkills := GetAllSkills()
	var skillUsed *Skill
	for _, sk := range allSkills {
		if sk.ID == action.SkillID {
			skillUsed = &sk
			break
		}
	}

	// Default to attack if no skill or skill not found
	combatAction := action.Action
	if skillUsed != nil {
		// Validate MP
		if char.Spirit.Current < skillUsed.MPCost {
			combatAction = "attack"
			skillUsed = nil
		}
	}

	// Create a monster state (simplified - in real app would be stored)
	monsters := GenerateMonstersForLevel(char.Level)

	// Execute combat
	playerAction := &PlayerAction{
		Action:  combatAction,
		SkillID: action.SkillID,
	}

	result := ExecuteCombat(
		char.Health.Current, char.Health.Max, char.Spirit.Current,
		char.Level, char.Strength, char.Intelligence, char.Agility,
		char.Abilities, &monsters[0], playerAction,
	)

	// Apply results to character
	char.Health.Current = result.PlayerHP
	char.Spirit.Current = result.PlayerMP - result.MPUsed
	if char.Spirit.Current < 0 {
		char.Spirit.Current = 0
	}
	if char.Spirit.Current > char.Spirit.Max {
		char.Spirit.Current = char.Spirit.Max
	}

	// Victory rewards
	if result.Victory {
		char.XP += result.XPGained
		char.Gold += result.GoldGained
		if result.ItemDropped != nil {
			char.Inventory = append(char.Inventory, store.InventoryItem{
				ID:          result.ItemDropped.ID,
				Name:        result.ItemDropped.Name,
				Description: result.ItemDropped.Description,
				Type:        result.ItemDropped.Type,
				Rarity:      result.ItemDropped.Rarity,
				Equipped:    false,
				Value:       int(result.ItemDropped.DropRate * 1000),
			})
		}
	}

	// Level up check
	for char.XP >= char.Level*100 {
		char.XP -= char.Level * 100
		char.Level++
		char.Health.Max += 20
		char.Health.Current = char.Health.Max
		char.Spirit.Max += 10
		char.Spirit.Current = char.Spirit.Max
		char.Title = getTitle(char.Level)
		result.LevelUp = true
		result.NewLevel = char.Level
		result.XPGained = char.Level * 100 // total XP needed
	}

	// Update character
	update := bson.M{
		"health":     char.Health,
		"spirit":     char.Spirit,
		"xp":         char.XP,
		"gold":       char.Gold,
		"level":      char.Level,
		"title":      char.Title,
		"inventory":  char.Inventory,
	}
	s.store.UpdateCharacter(ctx, char.ID, update)

	// Update result with final character state
	result.PlayerHP = char.Health.Current
	result.PlayerMaxHP = char.Health.Max
	result.PlayerMP = char.Spirit.Current

	return result, nil
}

// GetRegionInfo returns full region info for a character
func (s *GameService) GetRegionInfo(ctx context.Context, charID primitive.ObjectID) (*RegionInfoResponse, error) {
	char, err := s.store.GetCharacterByID(ctx, charID)
	if err != nil {
		return nil, fmt.Errorf("character not found: %w", err)
	}

	region := GetRegionByID(char.CurrentRegion)
	if region == nil {
		return nil, fmt.Errorf("region not found")
	}

	return &RegionInfoResponse{
		Character:   char,
		Region:      region,
		AllRegions:  GetAllRegions(),
	}, nil
}

// InteractWithNPC handles NPC interaction
func (s *GameService) InteractWithNPC(ctx context.Context, charID primitive.ObjectID, npcID string, dialogueChoice int) (*NPCResponse, error) {
	char, err := s.store.GetCharacterByID(ctx, charID)
	if err != nil {
		return nil, fmt.Errorf("character not found: %w", err)
	}

	npc := GetNPCByID(npcID)
	if npc == nil {
		return nil, fmt.Errorf("NPC not found: %s", npcID)
	}

	// Build dialogue response
	dialogue := npc.Greeting
	if dialogueChoice > 0 && dialogueChoice <= len(npc.Dialogue) {
		dialogue = npc.Dialogue[dialogueChoice-1]
	}

	// Record chat
	s.store.CreateChatMessage(ctx, &store.ChatMessage{
		CharacterID: charID,
		NPCID:       npcID,
		NPCName:     npc.Name,
		Sender:      "npc",
		Content:     dialogue,
	})

	return &NPCResponse{
		NPC:       npc,
		Dialogue:  dialogue,
		Character: char,
	}, nil
}

// BuyItem handles purchasing from an NPC shop
func (s *GameService) BuyItem(ctx context.Context, charID primitive.ObjectID, npcID, itemID string) (*BuyResponse, error) {
	char, err := s.store.GetCharacterByID(ctx, charID)
	if err != nil {
		return nil, fmt.Errorf("character not found: %w", err)
	}

	// Find NPC and item
	var item *ShopItem
	for _, region := range GetAllRegions() {
		for _, npc := range region.NPCs {
			if npc.ID == npcID {
				for i := range npc.ShopItems {
					if npc.ShopItems[i].ID == itemID {
						item = &npc.ShopItems[i]
						break
					}
				}
				break
			}
		}
	}

	if item == nil {
		return nil, fmt.Errorf("item not found")
	}

	if char.Gold < item.Price {
		return &BuyResponse{
			Success: false,
			Message: fmt.Sprintf("金币不足！需要 %d 金币，你只有 %d 金币。", item.Price, char.Gold),
		}, nil
	}

	// Deduct gold and add item
	char.Gold -= item.Price
	char.Inventory = append(char.Inventory, store.InventoryItem{
		ID:          item.ID + fmt.Sprintf("_%d", time.Now().UnixNano()),
		Name:        item.Name,
		Description: item.Effect,
		Type:        item.Type,
		Rarity:      item.Rarity,
		Equipped:    false,
		Value:       item.Price / 2,
	})

	s.store.UpdateCharacter(ctx, charID, bson.M{
		"gold":      char.Gold,
		"inventory": char.Inventory,
	})

	return &BuyResponse{
		Success:    true,
		Message:    fmt.Sprintf("购买了「%s」！剩余金币：%d", item.Name, char.Gold),
		Item:       item,
		NewGold:    char.Gold,
	}, nil
}

// Response types
type MoveResponse struct {
	Character  *store.Character `json:"character"`
	Region    *Region           `json:"region"`
	Discovered bool              `json:"discovered"`
	CombatZone bool              `json:"combat_zone"`
}

type CombatResponse struct {
	Monster         *Monster `json:"monster"`
	MonsterHP      int      `json:"monster_hp"`
	MonsterMaxHP   int      `json:"monster_max_hp"`
	MonsterMP      int      `json:"monster_mp"`
	MonsterMaxMP   int      `json:"monster_max_mp"`
	PlayerHP       int      `json:"player_hp"`
	PlayerMaxHP    int      `json:"player_max_hp"`
	PlayerMP       int      `json:"player_mp"`
	PlayerMaxMP    int      `json:"player_max_mp"`
	AvailableSkills []Skill `json:"available_skills"`
	RegionInfo     string   `json:"region_info"`
}

type RegionInfoResponse struct {
	Character   *store.Character `json:"character"`
	Region      *Region          `json:"region"`
	AllRegions  []Region         `json:"all_regions"`
}

type NPCResponse struct {
	NPC       *NPC           `json:"npc"`
	Dialogue  string         `json:"dialogue"`
	Character *store.Character `json:"character"`
}

type BuyResponse struct {
	Success bool      `json:"success"`
	Message string    `json:"message"`
	Item    *ShopItem `json:"item,omitempty"`
	NewGold int       `json:"new_gold"`
}

// EquipItem equips or unequips an item
func (s *GameService) EquipItem(ctx context.Context, charID primitive.ObjectID, itemID string, equipped bool) error {
	char, err := s.store.GetCharacterByID(ctx, charID)
	if err != nil {
		return err
	}

	for i := range char.Inventory {
		if char.Inventory[i].ID == itemID {
			char.Inventory[i].Equipped = equipped
			break
		}
	}

	return s.store.UpdateCharacter(ctx, charID, bson.M{
		"inventory": char.Inventory,
	})
}

// CharacterStateJSON exports character state as JSON for frontend
func (s *GameService) CharacterStateJSON(char *store.Character) ([]byte, error) {
	return json.Marshal(char)
}

// ===== Dialogue Service Methods =====

// DialogueChoiceResult 对话选择结果
type DialogueChoiceResult struct {
	ChoiceText    string             `json:"choice_text"`
	FlagSet       string             `json:"flag_set,omitempty"`
	QuestGained   string             `json:"quest_gained,omitempty"`
	ItemGained    string             `json:"item_gained,omitempty"`
	NextDialogue  *DialogueResponse  `json:"next_dialogue,omitempty"`
}

// GetRegionDialogue 获取当前区域的对话
func (s *GameService) GetRegionDialogue(ctx context.Context, charID primitive.ObjectID) (*DialogueResponse, error) {
	char, err := s.store.GetCharacterByID(ctx, charID)
	if err != nil {
		return nil, err
	}

	regionID := char.CurrentRegion
	chapter := regionToChapter(regionID)

	d := GetDialogueByChapter(chapter)
	if d == nil {
		// 返回默认对话
		d = GetDialogueByChapter(1)
	}

	// 找到对应的NPC
	npcID := d.Dialogues[0].Speaker
	if profile, ok := AllCharacterProfiles[npcID]; ok {
		return &DialogueResponse{
			Character:   profile,
			Dialogue:    *d,
			CurrentIdx:  0,
			Flags:       char.DialogueFlags,
		}, nil
	}

	return nil, fmt.Errorf("dialogue not found")
}

// GetChapterDialogue 获取指定章节对话
func (s *GameService) GetChapterDialogue(ctx context.Context, charID primitive.ObjectID, chapter int) (*DialogueResponse, error) {
	char, err := s.store.GetCharacterByID(ctx, charID)
	if err != nil {
		return nil, err
	}

	d := GetDialogueByChapter(chapter)
	if d == nil {
		return nil, fmt.Errorf("chapter %d not found", chapter)
	}

	npcID := d.Dialogues[0].Speaker
	if profile, ok := AllCharacterProfiles[npcID]; ok {
		return &DialogueResponse{
			Character:   profile,
			Dialogue:    *d,
			CurrentIdx:  0,
			Flags:       char.DialogueFlags,
		}, nil
	}

	return nil, fmt.Errorf("character profile not found")
}

// GetNPCDialogue 获取指定NPC的对话
func (s *GameService) GetNPCDialogue(ctx context.Context, charID primitive.ObjectID, npcID string) (*DialogueResponse, error) {
	char, err := s.store.GetCharacterByID(ctx, charID)
	if err != nil {
		return nil, err
	}

	profile, ok := AllCharacterProfiles[npcID]
	if !ok {
		return nil, fmt.Errorf("NPC %s not found", npcID)
	}

	// 根据NPC找到对应的章节对话
	chapter := npcToChapter(npcID)
	d := GetDialogueByChapter(chapter)
	if d == nil {
		d = GetDialogueByChapter(1)
	}

	return &DialogueResponse{
		Character:   profile,
		Dialogue:    *d,
		CurrentIdx:  0,
		Flags:       char.DialogueFlags,
	}, nil
}

// SubmitDialogueChoice 提交对话选择
func (s *GameService) SubmitDialogueChoice(ctx context.Context, charID primitive.ObjectID, dialogueID string, choiceIdx int, flag, quest, item string) (*DialogueChoiceResult, error) {
	char, err := s.store.GetCharacterByID(ctx, charID)
	if err != nil {
		return nil, err
	}

	result := &DialogueChoiceResult{}

	// 设置标记
	if flag != "" {
		if char.DialogueFlags == nil {
			char.DialogueFlags = make(map[string]bool)
		}
		char.DialogueFlags[flag] = true
		result.FlagSet = flag
	}

	// 给予任务
	if quest != "" {
		// TODO: 添加任务系统
		result.QuestGained = quest
	}

	// 给予物品
	if item != "" {
		// TODO: 添加物品系统
		result.ItemGained = item
	}

	// 保存角色状态
	if err := s.store.UpdateCharacter(ctx, char.ID, bson.M{"$set": bson.M{"dialogue_flags": char.DialogueFlags}}); err != nil {
		return nil, err
	}

	return result, nil
}

// GetAllCharacterProfiles 获取所有角色资料
func (s *GameService) GetAllCharacterProfiles() map[string]CharacterProfile {
	return AllCharacterProfiles
}

// GetCharacterProfile 获取单个角色资料
func (s *GameService) GetCharacterProfile(npcID string) *CharacterProfile {
	if profile, ok := AllCharacterProfiles[npcID]; ok {
		return &profile
	}
	return nil
}

// regionToChapter 将区域ID转换为章节号
func regionToChapter(regionID string) int {
	chapterMap := map[string]int{
		"border_outpost":   1,
		"misty_forest":     2,
		"hunter_cabin":     3,
		"abandoned_mine":   4,
		"border_town":      5,
		"jungle_tribe":     6,
		"port_city":        7,
		"royal_capital":    9,
		"royal_palace":     9,
		"adventurer_guild": 10,
		"market_district":  11,
		"slums":           11,
		"ancient_ruins":    13,
		"lost_temple":      15,
	}
	if ch, ok := chapterMap[regionID]; ok {
		return ch
	}
	return 1
}

// npcToChapter 将NPC ID转换为章节号
func npcToChapter(npcID string) int {
	chapterMap := map[string]int{
		"chen_yue":     1,
		"su_waner":     2,
		"lao_lieren":   3,
		"heiying":      5,
		"tie_mian":     5,
		"honghu":       7,
		"mo_qingshu":   9,
		"gui_wang":     9,
		"yueying":     10,
		"han_feng":    10,
		"lin_yuan":    13,
		"zan_da":       6,
		"alian_zu":     6,
		"zhao_shen":    5,
		"zhou_hai":     7,
		"ming_yue":     9,
	}
	if ch, ok := chapterMap[npcID]; ok {
		return ch
	}
	return 1
}
