package deck

import (
	"fmt"
	"math/rand"
	"time"

	"github.com/aiworld/game-full/internal/store"
)

// Card types
const (
	CardTypeMainStory   = "main_story"
	CardTypeSideStory   = "side_story"
	CardTypeDiscovery   = "discovery"
	CardTypeChallenge  = "challenge"
	CardTypeGrowth     = "growth"
	CardTypeMood       = "mood"
	CardTypeEmpty      = "empty"
)

// Dealer types
const (
	DealerTypeNPC        = "npc"
	DealerTypeBoard      = "board"
	DealerTypeEnemy      = "enemy"
	DealerTypeCamp       = "camp"
	DealerTypeEncounter  = "encounter"
	DealerTypeMerchant   = "merchant"
	DealerTypeEnvironment = "environment"
)

// Card represents a single card in the deck
type Card struct {
	ID            string `json:"id"`
	Type         string `json:"type"`
	Name         string `json:"name"`
	Description  string `json:"description"`
	Priority     int    `json:"priority"`
	IsUrgent     bool   `json:"is_urgent"`
	OccurrenceNum int   `json:"occurrence_num"`
}

// Deck represents the event deck
type Deck struct {
	Cards         []Card `json:"cards"`
	CurrentIndex  int    `json:"current_index"`
	CycleCount    int    `json:"cycle_count"`
	IsShuffled    bool   `json:"is_shuffled"`
}

// BuildDeck creates a new deck based on character level and progress
func BuildDeck(level int, cycle int) *Deck {
	// Deck composition changes based on level and cycle
	cardCount := 10 + (cycle * 2) // More cards as game progresses
	if cardCount > 20 {
		cardCount = 20
	}

	cards := make([]Card, 0, cardCount)

	// Base cards (always present)
	addCards(&cards, CardTypeMainStory, 2)
	addCards(&cards, CardTypeSideStory, 3)
	addCards(&cards, CardTypeDiscovery, 2)
	addCards(&cards, CardTypeChallenge, 2)

	// Growth cards
	addCards(&cards, CardTypeGrowth, 1)

	// Mood cards
	addCards(&cards, CardTypeMood, 1)

	// Empty card
	if len(cards) < cardCount {
		addCards(&cards, CardTypeEmpty, 1)
	}

	// Fill remaining with more variety
	remaining := cardCount - len(cards)
	for i := 0; i < remaining; i++ {
		cardTypes := []string{CardTypeSideStory, CardTypeDiscovery, CardTypeChallenge}
		cardType := cardTypes[rand.Intn(len(cardTypes))]
		addCards(&cards, cardType, 1)
	}

	return &Deck{
		Cards:        cards,
		CurrentIndex: 0,
		CycleCount:   cycle,
		IsShuffled:   false,
	}
}

func addCards(cards *[]Card, cardType string, count int) {
	names := map[string]string{
		CardTypeMainStory:  "主线剧情",
		CardTypeSideStory:  "支线故事",
		CardTypeDiscovery:  "探索发现",
		CardTypeChallenge:  "挑战遭遇",
		CardTypeGrowth:     "成长奖励",
		CardTypeMood:       "氛围营造",
		CardTypeEmpty:      "空白",
	}

	descs := map[string]string{
		CardTypeMainStory:  "推动核心复仇剧情",
		CardTypeSideStory:  "当地人的故事",
		CardTypeDiscovery:  "发现新地点或秘密",
		CardTypeChallenge:  "战斗或抉择考验",
		CardTypeGrowth:     "能力提升或获得物品",
		CardTypeMood:       "营造特定氛围",
		CardTypeEmpty:      "静默，让玩家喘息",
	}

	for i := 0; i < count; i++ {
		*cards = append(*cards, Card{
			ID:            fmt.Sprintf("%s_%d", cardType, i+1),
			Type:         cardType,
			Name:         names[cardType],
			Description:  descs[cardType],
			Priority:     0,
			IsUrgent:     false,
			OccurrenceNum: i + 1,
		})
	}
}

// Draw draws the next card from the deck
// IMPORTANT: Each draw = 1 reflection round (太子旨意：皇上做10次=10轮)
func (d *Deck) Draw() (*Card, error) {
	if d.CurrentIndex >= len(d.Cards) {
		return nil, fmt.Errorf("deck exhausted")
	}

	card := d.Cards[d.CurrentIndex]
	d.CurrentIndex++

	// 反省轮次：每次抽牌 = 1轮（不是抽完整副牌才算1轮）
	d.CycleCount++

	// 如果抽完了，重置索引进入下一轮
	if d.CurrentIndex >= len(d.Cards) {
		d.CurrentIndex = 0
	}

	return &card, nil
}

// Peek returns the next card without drawing
func (d *Deck) Peek() *Card {
	if d.CurrentIndex >= len(d.Cards) {
		return nil
	}
	return &d.Cards[d.CurrentIndex]
}

// CardsRemaining returns the number of cards remaining
func (d *Deck) CardsRemaining() int {
	return len(d.Cards) - d.CurrentIndex
}

// PromoteUrgent moves a card type to the front
func (d *Deck) PromoteUrgent(cardType string) {
	for i := 0; i < len(d.Cards); i++ {
		if d.Cards[i].Type == cardType && !d.Cards[i].IsUrgent {
			// Mark as urgent and move to front
			d.Cards[i].IsUrgent = true
			d.Cards[i].Priority = 1000

			if i > 0 {
				// Move to front
				card := d.Cards[i]
				d.Cards = append([]Card{card}, d.Cards[:i]...)
				d.Cards = append(d.Cards[:i], d.Cards[i+1:]...)
			}
			break
		}
	}
}

// EventTrigger determines what happens when a dealer draws a card
type EventTrigger struct {
	DealerID   string `json:"dealer_id"`
	DealerType string `json:"dealer_type"`
	Card       *Card  `json:"card"`
	Region     string `json:"region"`
}

// ShouldTrigger determines if the dealer should trigger based on card type
func ShouldTrigger(dealerType, cardType string) bool {
	supportedCards := map[string][]string{
		DealerTypeNPC:        {CardTypeMainStory, CardTypeSideStory, CardTypeDiscovery, CardTypeGrowth},
		DealerTypeBoard:      {CardTypeChallenge, CardTypeGrowth},
		DealerTypeEnemy:      {CardTypeMainStory, CardTypeSideStory, CardTypeChallenge},
		DealerTypeCamp:      {CardTypeMainStory, CardTypeSideStory, CardTypeDiscovery, CardTypeGrowth, CardTypeMood, CardTypeEmpty},
		DealerTypeEncounter:  {CardTypeChallenge, CardTypeMood, CardTypeDiscovery},
		DealerTypeMerchant:   {CardTypeGrowth},
		DealerTypeEnvironment: {CardTypeDiscovery, CardTypeMood},
	}

	supported, ok := supportedCards[dealerType]
	if !ok {
		return false
	}

	for _, ct := range supported {
		if ct == cardType {
			return true
		}
	}
	return false
}

// CharacterStateChecker checks character state for deck adjustments
type CharacterStateChecker struct{}

func (c *CharacterStateChecker) ShouldPromoteHealth(state *store.Character) bool {
	// If health below 70%, promote growth card
	healthPercent := float64(state.Health.Current) / float64(state.Health.Max)
	return healthPercent < 0.7
}

func (c *CharacterStateChecker) ShouldPromoteSpirit(state *store.Character) bool {
	spiritPercent := float64(state.Spirit.Current) / float64(state.Spirit.Max)
	return spiritPercent < 0.5
}

func (c *CharacterStateChecker) GetRecommendedCardType(state *store.Character) string {
	if c.ShouldPromoteHealth(state) {
		return CardTypeGrowth
	}
	if c.ShouldPromoteSpirit(state) {
		return CardTypeMood
	}
	return ""
}

// Random delay for natural feel
func init() {
	rand.Seed(time.Now().UnixNano())
}
