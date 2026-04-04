package server

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/aiworld/game-full/internal/ai"
	"github.com/aiworld/game-full/internal/game"
	"github.com/aiworld/game-full/internal/store"
	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/crypto/bcrypt"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for now
	},
}

// Server is the HTTP server
type Server struct {
	store      *store.MongoStore
	gameService *game.GameService
	aiGen      *ai.Generator
	jwtSecret  []byte
	router     *mux.Router
}

// NewServer creates a new server
func NewServer(mongoURI, dbName, jwtSecret, aiKey, aiURL, aiModel string) (*Server, error) {
	mongoStore, err := store.NewMongoStore(mongoURI, dbName)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to MongoDB: %w", err)
	}

	aiGen := ai.NewGenerator(aiKey, aiURL, aiModel)
	gameService := game.NewGameService(mongoStore, aiGen)

	return &Server{
		store:      mongoStore,
		gameService: gameService,
		aiGen:      aiGen,
		jwtSecret:  []byte(jwtSecret),
		router:     mux.NewRouter(),
	}, nil
}

// Start starts the HTTP server
func (s *Server) Start(addr string) error {
	s.setupRoutes()
	log.Printf("Server starting on %s", addr)
	return http.ListenAndServe(addr, s.router)
}

func (s *Server) setupRoutes() {
	// Health check
	s.router.HandleFunc("/health", s.handleHealth).Methods("GET")

	// Auth routes
	s.router.HandleFunc("/api/auth/register", s.handleRegister).Methods("POST")
	s.router.HandleFunc("/api/auth/login", s.handleLogin).Methods("POST")

	// Character routes (protected)
	s.router.Handle("/api/characters", s.authMiddleware(http.HandlerFunc(s.handleListCharacters))).Methods("GET")
	s.router.Handle("/api/characters", s.authMiddleware(http.HandlerFunc(s.handleCreateCharacter))).Methods("POST")
	s.router.Handle("/api/characters/{id}", s.authMiddleware(http.HandlerFunc(s.handleGetCharacter))).Methods("GET")
	s.router.Handle("/api/characters/{id}/move", s.authMiddleware(http.HandlerFunc(s.handleMoveCharacter))).Methods("POST")
	s.router.Handle("/api/characters/{id}/interact", s.authMiddleware(http.HandlerFunc(s.handleInteract))).Methods("POST")
	s.router.Handle("/api/characters/{id}/events", s.authMiddleware(http.HandlerFunc(s.handleGetEvents))).Methods("GET")
	s.router.Handle("/api/characters/{id}/chat", s.authMiddleware(http.HandlerFunc(s.handleGetChat))).Methods("GET")
	s.router.Handle("/api/characters/{id}/equip", s.authMiddleware(http.HandlerFunc(s.handleEquipItem))).Methods("POST")

	// Map/Region routes - character specific
	s.router.Handle("/api/characters/{id}/region", s.authMiddleware(http.HandlerFunc(s.handleGetRegionInfo))).Methods("GET")
	s.router.Handle("/api/regions/list", http.HandlerFunc(s.handleListRegions)).Methods("GET")

	// Combat routes
	s.router.Handle("/api/characters/{id}/combat/start", s.authMiddleware(http.HandlerFunc(s.handleStartCombat))).Methods("POST")
	s.router.Handle("/api/characters/{id}/combat/action", s.authMiddleware(http.HandlerFunc(s.handleCombatAction))).Methods("POST")

	// NPC routes
	s.router.Handle("/api/characters/{id}/npc/{npcId}", s.authMiddleware(http.HandlerFunc(s.handleNPCInteract))).Methods("POST")
	s.router.Handle("/api/characters/{id}/npc/{npcId}/buy/{itemId}", s.authMiddleware(http.HandlerFunc(s.handleBuyItem))).Methods("POST")

	// Dialogue API routes
	s.router.Handle("/api/dialogue/region", s.authMiddleware(http.HandlerFunc(s.handleGetRegionDialogue))).Methods("GET")
	s.router.Handle("/api/dialogue/chapter/{chapter}", s.authMiddleware(http.HandlerFunc(s.handleGetChapterDialogue))).Methods("GET")
	s.router.Handle("/api/dialogue/npc/{npcId}", s.authMiddleware(http.HandlerFunc(s.handleGetNPCDialogue))).Methods("GET")
	s.router.Handle("/api/dialogue/choice", s.authMiddleware(http.HandlerFunc(s.handleSubmitDialogueChoice))).Methods("POST")
	s.router.Handle("/api/characters/profiles", http.HandlerFunc(s.handleListCharacterProfiles)).Methods("GET")
	s.router.Handle("/api/characters/profiles/{id}", http.HandlerFunc(s.handleGetCharacterProfile)).Methods("GET")

	// WebSocket
	s.router.Handle("/ws/{characterId}", s.authMiddleware(http.HandlerFunc(s.handleWebSocket)))
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(map[string]string{"status": "healthy"})
}

// Auth handlers

type RegisterRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Email    string `json:"email"`
}

func (s *Server) handleRegister(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), 400)
		return
	}

	// Hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	player := &store.Player{
		Username:     req.Username,
		PasswordHash: string(hash),
		Email:       req.Email,
		Settings: store.PlayerSettings{
			SoundVolume: 0.8,
			MusicVolume: 0.6,
			TextSpeed:   "normal",
			AutoSave:    true,
		},
	}

	if err := s.store.CreatePlayer(context.Background(), player); err != nil {
		http.Error(w, "Username or email already exists", 400)
		return
	}

	w.WriteHeader(201)
	json.NewEncoder(w).Encode(map[string]string{"message": "Registration successful"})
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func (s *Server) handleLogin(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), 400)
		return
	}

	player, err := s.store.GetPlayerByUsername(context.Background(), req.Username)
	if err != nil {
		http.Error(w, "Invalid credentials", 401)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(player.PasswordHash), []byte(req.Password)); err != nil {
		http.Error(w, "Invalid credentials", 401)
		return
	}

	// Generate JWT
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"player_id": player.ID.Hex(),
		"username":  player.Username,
		"exp":      time.Now().Add(7 * 24 * time.Hour).Unix(),
	})

	tokenString, err := token.SignedString(s.jwtSecret)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	// Update last login
	s.store.UpdatePlayer(context.Background(), player.ID, map[string]interface{}{
		"last_login_at": time.Now(),
	})

	json.NewEncoder(w).Encode(map[string]interface{}{
		"token":     tokenString,
		"player_id": player.ID.Hex(),
		"username":  player.Username,
	})
}

func (s *Server) authMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Authorization required", 401)
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return s.jwtSecret, nil
		})

		if err != nil || !token.Valid {
			http.Error(w, "Invalid token", 401)
			return
		}

		claims := token.Claims.(jwt.MapClaims)
		ctx := context.WithValue(r.Context(), "player_id", claims["player_id"].(string))
		ctx = context.WithValue(ctx, "username", claims["username"].(string))

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (s *Server) handleListCharacters(w http.ResponseWriter, r *http.Request) {
	playerIDStr := r.Context().Value("player_id").(string)
	playerID, _ := primitive.ObjectIDFromHex(playerIDStr)

	characters, err := s.store.GetCharactersByPlayerID(context.Background(), playerID)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	json.NewEncoder(w).Encode(characters)
}

func (s *Server) handleCreateCharacter(w http.ResponseWriter, r *http.Request) {
	playerIDStr := r.Context().Value("player_id").(string)
	playerID, _ := primitive.ObjectIDFromHex(playerIDStr)

	var req game.CreateCharacterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), 400)
		return
	}

	char, err := s.gameService.CreateCharacter(context.Background(), playerID, &req)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	w.WriteHeader(201)
	json.NewEncoder(w).Encode(char)
}

func (s *Server) handleGetCharacter(w http.ResponseWriter, r *http.Request) {
	charID, _ := primitive.ObjectIDFromHex(mux.Vars(r)["id"])

	char, err := s.gameService.GetCharacter(context.Background(), charID)
	if err != nil {
		http.Error(w, "Character not found", 404)
		return
	}

	json.NewEncoder(w).Encode(char)
}

type MoveRequest struct {
	Region string  `json:"region"`
	X      float64 `json:"x"`
	Y      float64 `json:"y"`
	Z      float64 `json:"z"`
}

func (s *Server) handleMoveCharacter(w http.ResponseWriter, r *http.Request) {
	charID, _ := primitive.ObjectIDFromHex(mux.Vars(r)["id"])

	var req MoveRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), 400)
		return
	}

	resp, err := s.gameService.MoveCharacter(context.Background(), charID, req.Region, req.X, req.Y, req.Z)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	json.NewEncoder(w).Encode(resp)
}

type InteractRequest struct {
	DealerID   string `json:"dealer_id"`
	DealerType string `json:"dealer_type"`
}

func (s *Server) handleInteract(w http.ResponseWriter, r *http.Request) {
	charID, _ := primitive.ObjectIDFromHex(mux.Vars(r)["id"])

	var req InteractRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), 400)
		return
	}

	resp, err := s.gameService.InteractWithDealer(context.Background(), charID, req.DealerID, req.DealerType)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	json.NewEncoder(w).Encode(resp)
}

func (s *Server) handleGetEvents(w http.ResponseWriter, r *http.Request) {
	charID, _ := primitive.ObjectIDFromHex(mux.Vars(r)["id"])

	events, err := s.gameService.GetCharacterEvents(context.Background(), charID, 50)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	json.NewEncoder(w).Encode(events)
}

func (s *Server) handleGetChat(w http.ResponseWriter, r *http.Request) {
	charID, _ := primitive.ObjectIDFromHex(mux.Vars(r)["id"])

	messages, err := s.gameService.GetChatHistory(context.Background(), charID, 100)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	json.NewEncoder(w).Encode(messages)
}

type EquipRequest struct {
	ItemID  string `json:"item_id"`
	Equipped bool   `json:"equipped"`
}

func (s *Server) handleEquipItem(w http.ResponseWriter, r *http.Request) {
	charID, _ := primitive.ObjectIDFromHex(mux.Vars(r)["id"])

	var req EquipRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), 400)
		return
	}

	if err := s.gameService.EquipItem(context.Background(), charID, req.ItemID, req.Equipped); err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	char, _ := s.gameService.GetCharacter(context.Background(), charID)
	json.NewEncoder(w).Encode(char)
}

// WebSocket handler
func (s *Server) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	charIDStr := mux.Vars(r)["characterId"]
	charID, _ := primitive.ObjectIDFromHex(charIDStr)

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v", err)
		return
	}
	defer conn.Close()

	char, err := s.gameService.GetCharacter(context.Background(), charID)
	if err != nil {
		log.Printf("Character not found: %v", err)
		return
	}

	// Send initial state
	conn.WriteJSON(map[string]interface{}{
		"type": "init",
		"data": char,
	})

	// Read loop
	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			log.Printf("WebSocket read error: %v", err)
			break
		}

		var msg map[string]interface{}
		if err := json.Unmarshal(message, &msg); err != nil {
			continue
		}

		// Handle different message types
		switch msg["type"] {
		case "ping":
			conn.WriteJSON(map[string]interface{}{"type": "pong"})

		case "interact":
			dealerID, _ := msg["dealer_id"].(string)
			dealerType, _ := msg["dealer_type"].(string)
			resp, err := s.gameService.InteractWithDealer(context.Background(), charID, dealerID, dealerType)
			if err == nil {
				conn.WriteJSON(map[string]interface{}{
					"type": "event",
					"data": resp,
				})
			}

		case "move":
			region, _ := msg["region"].(string)
			x, _ := msg["x"].(float64)
			y, _ := msg["y"].(float64)
			z, _ := msg["z"].(float64)
			moveResp, err := s.gameService.MoveCharacter(context.Background(), charID, region, x, y, z)
			if err == nil {
				char = moveResp.Character
				conn.WriteJSON(map[string]interface{}{
					"type": "moved",
					"data": moveResp,
				})
			}
		}
	}
}

// ===== Map/Region Handlers =====

func (s *Server) handleGetRegionInfo(w http.ResponseWriter, r *http.Request) {
	charID, _ := primitive.ObjectIDFromHex(mux.Vars(r)["id"])

	resp, err := s.gameService.GetRegionInfo(context.Background(), charID)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	json.NewEncoder(w).Encode(resp)
}

func (s *Server) handleListRegions(w http.ResponseWriter, r *http.Request) {
	regions := game.GetAllRegions()
	json.NewEncoder(w).Encode(regions)
}

// ===== Combat Handlers =====

type CombatActionRequest struct {
	Action  string `json:"action"` // attack, defend, skill, item, flee
	SkillID string `json:"skill_id,omitempty"`
	ItemID  string `json:"item_id,omitempty"`
}

func (s *Server) handleStartCombat(w http.ResponseWriter, r *http.Request) {
	charID, _ := primitive.ObjectIDFromHex(mux.Vars(r)["id"])

	resp, err := s.gameService.StartCombatForRegion(context.Background(), charID)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	json.NewEncoder(w).Encode(resp)
}

func (s *Server) handleCombatAction(w http.ResponseWriter, r *http.Request) {
	charID, _ := primitive.ObjectIDFromHex(mux.Vars(r)["id"])

	var req CombatActionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), 400)
		return
	}

	action := &game.PlayerAction{
		Action:  req.Action,
		SkillID: req.SkillID,
		ItemSlot: 0,
	}

	result, err := s.gameService.ExecuteCombatAction(context.Background(), charID, action)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	json.NewEncoder(w).Encode(result)
}

// ===== NPC Handlers =====

type NPCInteractRequest struct {
	Choice int `json:"choice"` // dialogue option index
}

func (s *Server) handleNPCInteract(w http.ResponseWriter, r *http.Request) {
	charID, _ := primitive.ObjectIDFromHex(mux.Vars(r)["id"])
	npcID := mux.Vars(r)["npcId"]

	var req NPCInteractRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		// Default to greeting
		req.Choice = 0
	}

	resp, err := s.gameService.InteractWithNPC(context.Background(), charID, npcID, req.Choice)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	json.NewEncoder(w).Encode(resp)
}

func (s *Server) handleBuyItem(w http.ResponseWriter, r *http.Request) {
	charID, _ := primitive.ObjectIDFromHex(mux.Vars(r)["id"])
	npcID := mux.Vars(r)["npcId"]
	itemID := mux.Vars(r)["itemId"]

	resp, err := s.gameService.BuyItem(context.Background(), charID, npcID, itemID)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	json.NewEncoder(w).Encode(resp)
}

// ===== Dialogue Handlers =====

func (s *Server) handleGetRegionDialogue(w http.ResponseWriter, r *http.Request) {
	charIDStr := r.URL.Query().Get("character_id")
	if charIDStr != "" {
		charID, err := primitive.ObjectIDFromHex(charIDStr)
		if err == nil {
			resp, err := s.gameService.GetRegionDialogue(context.Background(), charID)
			if err != nil {
				http.Error(w, err.Error(), 500)
				return
			}
			json.NewEncoder(w).Encode(resp)
			return
		}
	}

	// Get first character from player context
	playerIDStr := r.Context().Value("player_id").(string)
	playerID, _ := primitive.ObjectIDFromHex(playerIDStr)
	chars, err := s.store.GetCharactersByPlayerID(context.Background(), playerID)
	if err != nil || len(chars) == 0 {
		http.Error(w, "character not found", 404)
		return
	}

	resp, err := s.gameService.GetRegionDialogue(context.Background(), chars[0].ID)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	json.NewEncoder(w).Encode(resp)
}

func (s *Server) handleGetChapterDialogue(w http.ResponseWriter, r *http.Request) {
	charIDStr := r.URL.Query().Get("character_id")
	if charIDStr == "" {
		playerIDStr := r.Context().Value("player_id").(string)
		playerID, _ := primitive.ObjectIDFromHex(playerIDStr)
		chars, err := s.store.GetCharactersByPlayerID(context.Background(), playerID)
		if err != nil || len(chars) == 0 {
			http.Error(w, "character not found", 404)
			return
		}
		charIDStr = chars[0].ID.Hex()
	}

	charID, _ := primitive.ObjectIDFromHex(charIDStr)
	chapterStr := mux.Vars(r)["chapter"]
	var chapter int
	fmt.Sscanf(chapterStr, "%d", &chapter)

	resp, err := s.gameService.GetChapterDialogue(context.Background(), charID, chapter)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	json.NewEncoder(w).Encode(resp)
}

func (s *Server) handleGetNPCDialogue(w http.ResponseWriter, r *http.Request) {
	charIDStr := r.URL.Query().Get("character_id")
	if charIDStr == "" {
		playerIDStr := r.Context().Value("player_id").(string)
		playerID, _ := primitive.ObjectIDFromHex(playerIDStr)
		chars, err := s.store.GetCharactersByPlayerID(context.Background(), playerID)
		if err != nil || len(chars) == 0 {
			http.Error(w, "character not found", 404)
			return
		}
		charIDStr = chars[0].ID.Hex()
	}

	charID, _ := primitive.ObjectIDFromHex(charIDStr)
	npcID := mux.Vars(r)["npcId"]
	resp, err := s.gameService.GetNPCDialogue(context.Background(), charID, npcID)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	json.NewEncoder(w).Encode(resp)
}

func (s *Server) handleSubmitDialogueChoice(w http.ResponseWriter, r *http.Request) {
	var req struct {
		CharacterID string `json:"characterId"`
		DialogueID  string `json:"dialogueId"`
		ChoiceIdx   int    `json:"choiceIdx"`
		Flag        string `json:"flag"`
		Quest       string `json:"quest"`
		Item        string `json:"item"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), 400)
		return
	}

	charID, _ := primitive.ObjectIDFromHex(req.CharacterID)
	resp, err := s.gameService.SubmitDialogueChoice(context.Background(), charID, req.DialogueID, req.ChoiceIdx, req.Flag, req.Quest, req.Item)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	json.NewEncoder(w).Encode(resp)
}

func (s *Server) handleListCharacterProfiles(w http.ResponseWriter, r *http.Request) {
	profiles := s.gameService.GetAllCharacterProfiles()
	json.NewEncoder(w).Encode(profiles)
}

func (s *Server) handleGetCharacterProfile(w http.ResponseWriter, r *http.Request) {
	npcID := mux.Vars(r)["id"]
	profile := s.gameService.GetCharacterProfile(npcID)
	if profile == nil {
		http.Error(w, "character not found", 404)
		return
	}
	json.NewEncoder(w).Encode(profile)
}
