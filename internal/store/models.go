package store

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Player represents a player account
type Player struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Username     string             `bson:"username" json:"username"`
	PasswordHash string            `bson:"password_hash" json:"-"`
	Email        string             `bson:"email" json:"email"`
	CreatedAt    time.Time         `bson:"created_at" json:"created_at"`
	UpdatedAt    time.Time         `bson:"updated_at" json:"updated_at"`
	LastLoginAt  time.Time         `bson:"last_login_at" json:"last_login_at"`
	Settings     PlayerSettings     `bson:"settings" json:"settings"`
	Stats        PlayerStats        `bson:"stats" json:"stats"`
}

type PlayerSettings struct {
	SoundVolume    float32 `bson:"sound_volume" json:"sound_volume"`
	MusicVolume    float32 `bson:"music_volume" json:"music_volume"`
	TextSpeed      string  `bson:"text_speed" json:"text_speed"` // slow, normal, fast
	AutoSave       bool    `bson:"auto_save" json:"auto_save"`
}

type PlayerStats struct {
	TotalPlayTime  int64 `bson:"total_play_time" json:"total_play_time"`   // seconds
	TotalSessions  int   `bson:"total_sessions" json:"total_sessions"`
	TotalEvents    int   `bson:"total_events" json:"total_events"`
	EventsThisWeek int   `bson:"events_this_week" json:"events_this_week"`
}

// Character represents a player's game character (state machine)
type Character struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	PlayerID  primitive.ObjectID `bson:"player_id" json:"player_id"`
	Name      string             `bson:"name" json:"name"`
	Background string            `bson:"background" json:"background"`
	Traits    []string          `bson:"traits" json:"traits"`
	Alignment string             `bson:"alignment" json:"alignment"`

	// Progression
	Level     int `bson:"level" json:"level"`
	XP        int `bson:"xp" json:"xp"`
	Title     string `bson:"title" json:"title"`

	// Attributes
	Health    StatValue `bson:"health" json:"health"`
	Spirit    StatValue `bson:"spirit" json:"spirit"`
	Strength  int      `bson:"strength" json:"strength"`
	Intelligence int   `bson:"intelligence" json:"intelligence"`
	Charisma  int      `bson:"charisma" json:"charisma"`
	Agility   int      `bson:"agility" json:"agility"`

	// Game state
	CurrentRegion  string   `bson:"current_region" json:"current_region"`
	Position       Position `bson:"position" json:"position"`

	// Progression
	Abilities      []string   `bson:"abilities" json:"abilities"`
	DiscoveredLocs []string   `bson:"discovered_locations" json:"discovered_locations"`
	KnownFactions  []string   `bson:"known_factions" json:"known_factions"`
	LoreUnlocked   []string   `bson:"lore_unlocked" json:"lore_unlocked"`

	// Deck state
	DeckState DeckState `bson:"deck_state" json:"deck_state"`

	// Relationships with NPCs
	Relationships map[string]Relationship `bson:"relationships" json:"relationships"`

	// Dialogue flags - tracks story progress
	DialogueFlags map[string]bool `bson:"dialogue_flags" json:"dialogue_flags"`

	// Inventory
	Inventory []InventoryItem `bson:"inventory" json:"inventory"`
	Gold      int            `bson:"gold" json:"gold"`

	// Active quests
	ActiveQuests   []QuestProgress `bson:"active_quests" json:"active_quests"`
	CompletedQuests []string       `bson:"completed_quests" json:"completed_quests"`

	// Timestamps
	CreatedAt time.Time `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time `bson:"updated_at" json:"updated_at"`
}

type StatValue struct {
	Current int `bson:"current" json:"current"`
	Max     int `bson:"max" json:"max"`
}

type Position struct {
	X float64 `bson:"x" json:"x"`
	Y float64 `bson:"y" json:"y"`
	Z float64 `bson:"z" json:"z"`
	Region   string `bson:"region" json:"region"`
}

type Relationship struct {
	Name       string `bson:"name" json:"name"`
	Affection  int    `bson:"affection" json:"affection"`  // 0-100
	Trust      int    `bson:"trust" json:"trust"`          // 0-100
	Reputation int   `bson:"reputation" json:"reputation"`  // -100 to 100
}

type InventoryItem struct {
	ID          string `bson:"id" json:"id"`
	Name        string `bson:"name" json:"name"`
	Description string `bson:"description" json:"description"`
	Type        string `bson:"type" json:"type"` // weapon, armor, consumable, quest_item
	Rarity      string `bson:"rarity" json:"rarity"` // common, uncommon, rare, epic, legendary
	Equipped    bool   `bson:"equipped" json:"equipped"`
	Value       int    `bson:"value" json:"value"` // gold value
}

type QuestProgress struct {
	QuestID   string  `bson:"quest_id" json:"quest_id"`
	Name      string  `bson:"name" json:"name"`
	Progress  float32 `bson:"progress" json:"progress"` // 0.0 to 1.0
	Stage     int     `bson:"stage" json:"stage"`
	Objectives []QuestObjective `bson:"objectives" json:"objectives"`
}

type QuestObjective struct {
	Description string `bson:"description" json:"description"`
	Completed   bool   `bson:"completed" json:"completed"`
	Progress    int    `bson:"progress" json:"progress"`
	Required    int    `bson:"required" json:"required"`
}

// DeckState represents the event deck state for this character
type DeckState struct {
	Cards        []DeckCard `bson:"cards" json:"cards"`
	CurrentIndex int       `bson:"current_index" json:"current_index"`
	CycleCount   int       `bson:"cycle_count" json:"cycle_count"`
	IsShuffled   bool      `bson:"is_shuffled" json:"is_shuffled"`
}

type DeckCard struct {
	ID             string `bson:"id" json:"id"`
	Type           string `bson:"type" json:"type"` // main_story, side_story, etc.
	Name           string `bson:"name" json:"name"`
	Description    string `bson:"description" json:"description"`
	Priority       int    `bson:"priority" json:"priority"`
	IsUrgent       bool   `bson:"is_urgent" json:"is_urgent"`
	OccurrenceNum  int    `bson:"occurrence_num" json:"occurrence_num"`
}

// GameEvent represents a recorded event in history
type GameEvent struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	CharacterID primitive.ObjectID `bson:"character_id" json:"character_id"`
	EventType   string            `bson:"event_type" json:"event_type"`
	CardType    string            `bson:"card_type" json:"card_type"`
	Region      string            `bson:"region" json:"region"`
	Summary     string            `bson:"summary" json:"summary"` // AI-generated summary
	Dialogue    string            `bson:"dialogue" json:"dialogue"` // Key dialogue
	Choices     []EventChoice     `bson:"choices" json:"choices"`
	Outcome     string            `bson:"outcome" json:"outcome"`
	StateChanges map[string]any  `bson:"state_changes" json:"state_changes"`
	Timestamp   time.Time        `bson:"timestamp" json:"timestamp"`
}

type EventChoice struct {
	Text       string `bson:"text" json:"text"`
	Selected   bool   `bson:"selected" json:"selected"`
	Outcome    string `bson:"outcome" json:"outcome"`
}

// ChatMessage represents a chat message with an NPC
type ChatMessage struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	CharacterID primitive.ObjectID `bson:"character_id" json:"character_id"`
	NPCID       string            `bson:"npc_id" json:"npc_id"`
	NPCName     string            `bson:"npc_name" json:"npc_name"`
	Sender      string            `bson:"sender" json:"sender"` // player or npc
	Content     string            `bson:"content" json:"content"`
	Timestamp   time.Time         `bson:"timestamp" json:"timestamp"`
}

// World represents the game world state
type World struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Seed        string            `bson:"seed" json:"seed"`
	Name        string            `bson:"name" json:"name"`
	Regions     []Region          `bson:"regions" json:"regions"`
	ActiveQuests []WorldQuest    `bson:"active_quests" json:"active_quests"`
	Calendar    Calendar          `bson:"calendar" json:"calendar"`
	UpdatedAt   time.Time        `bson:"updated_at" json:"updated_at"`
}

type Region struct {
	ID           string  `bson:"id" json:"id"`
	Name         string  `bson:"name" json:"name"`
	Description  string  `bson:"description" json:"description"`
	DangerLevel string  `bson:"danger_level" json:"danger_level"` // safe, low, medium, high, extreme
	DiscoveredBy []primitive.ObjectID `bson:"discovered_by" json:"discovered_by"`
	PointsOfInterest []POI `bson:"points_of_interest" json:"points_of_interest"`
}

type POI struct {
	ID          string    `bson:"id" json:"id"`
	Name        string    `bson:"name" json:"name"`
	Description string    `bson:"description" json:"description"`
	Position    Position  `bson:"position" json:"position"`
	Type        string    `bson:"type" json:"type"` // npc, dungeon, treasure, landmark
}

type Calendar struct {
	Day     int    `bson:"day" json:"day"`
	Season  string `bson:"season" json:"season"` // spring, summer, autumn, winter
	Weather string `bson:"weather" json:"weather"` // clear, cloudy, rainy, storm
}

type WorldQuest struct {
	QuestID    string `bson:"quest_id" json:"quest_id"`
	Name       string `bson:"name" json:"name"`
	RegionID   string `bson:"region_id" json:"region_id"`
	RewardXP   int    `bson:"reward_xp" json:"reward_xp"`
	RewardGold int    `bson:"reward_gold" json:"reward_gold"`
}

// Session represents an active game session
type Session struct {
	ID          string             `bson:"_id,omitempty" json:"id"`
	CharacterID primitive.ObjectID `bson:"character_id" json:"character_id"`
	PlayerID    primitive.ObjectID `bson:"player_id" json:"player_id"`
	StartedAt   time.Time         `bson:"started_at" json:"started_at"`
	LastActive  time.Time         `bson:"last_active" json:"last_active"`
	Status      string             `bson:"status" json:"status"` // active, idle, closed
	EndedAt     *time.Time        `bson:"ended_at,omitempty" json:"ended_at,omitempty"`
}
