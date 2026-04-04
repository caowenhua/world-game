package store

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// MongoStore is the MongoDB store
type MongoStore struct {
	client   *mongo.Client
	database *mongo.Database
}

// NewMongoStore creates a new MongoDB store
func NewMongoStore(uri, dbName string) (*MongoStore, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		return nil, fmt.Errorf("failed to connect to MongoDB: %w", err)
	}

	// Ping to verify connection
	if err := client.Ping(ctx, nil); err != nil {
		return nil, fmt.Errorf("failed to ping MongoDB: %w", err)
	}

	db := client.Database(dbName)
	store := &MongoStore{
		client:   client,
		database: db,
	}

	// Create indexes
	if err := store.createIndexes(ctx); err != nil {
		return nil, fmt.Errorf("failed to create indexes: %w", err)
	}

	return store, nil
}

func (s *MongoStore) createIndexes(ctx context.Context) error {
	// Players indexes
	_, err := s.database.Collection("players").Indexes().CreateMany(ctx, []mongo.IndexModel{
		{Keys: bson.D{{Key: "username", Value: 1}}, Options: options.Index().SetUnique(true)},
		{Keys: bson.D{{Key: "email", Value: 1}}, Options: options.Index().SetUnique(true)},
	})
	if err != nil {
		return err
	}

	// Characters indexes
	_, err = s.database.Collection("characters").Indexes().CreateMany(ctx, []mongo.IndexModel{
		{Keys: bson.D{{Key: "player_id", Value: 1}}},
		{Keys: bson.D{{Key: "name", Value: 1}}},
	})
	if err != nil {
		return err
	}

	// Events indexes
	_, err = s.database.Collection("events").Indexes().CreateMany(ctx, []mongo.IndexModel{
		{Keys: bson.D{{Key: "character_id", Value: 1}, {Key: "timestamp", Value: -1}}},
	})
	if err != nil {
		return err
	}

	// Chat messages indexes
	_, err = s.database.Collection("chat_messages").Indexes().CreateMany(ctx, []mongo.IndexModel{
		{Keys: bson.D{{Key: "character_id", Value: 1}, {Key: "timestamp", Value: -1}}},
	})
	if err != nil {
		return err
	}

	// Sessions indexes
	_, err = s.database.Collection("sessions").Indexes().CreateMany(ctx, []mongo.IndexModel{
		{Keys: bson.D{{Key: "character_id", Value: 1}}},
		{Keys: bson.D{{Key: "status", Value: 1}}},
	})
	if err != nil {
		return err
	}

	return nil
}

// Close closes the MongoDB connection
func (s *MongoStore) Close(ctx context.Context) error {
	return s.client.Disconnect(ctx)
}

// Collections
func (s *MongoStore) Players() *mongo.Collection {
	return s.database.Collection("players")
}

func (s *MongoStore) Characters() *mongo.Collection {
	return s.database.Collection("characters")
}

func (s *MongoStore) Events() *mongo.Collection {
	return s.database.Collection("events")
}

func (s *MongoStore) ChatMessages() *mongo.Collection {
	return s.database.Collection("chat_messages")
}

func (s *MongoStore) Worlds() *mongo.Collection {
	return s.database.Collection("worlds")
}

func (s *MongoStore) Sessions() *mongo.Collection {
	return s.database.Collection("sessions")
}

// Player operations
func (s *MongoStore) CreatePlayer(ctx context.Context, player *Player) error {
	player.ID = primitive.NewObjectID()
	player.CreatedAt = time.Now()
	player.UpdatedAt = time.Now()
	player.LastLoginAt = time.Now()
	_, err := s.Players().InsertOne(ctx, player)
	return err
}

func (s *MongoStore) GetPlayerByUsername(ctx context.Context, username string) (*Player, error) {
	var player Player
	err := s.Players().FindOne(ctx, bson.M{"username": username}).Decode(&player)
	if err != nil {
		return nil, err
	}
	return &player, nil
}

func (s *MongoStore) GetPlayerByID(ctx context.Context, id primitive.ObjectID) (*Player, error) {
	var player Player
	err := s.Players().FindOne(ctx, bson.M{"_id": id}).Decode(&player)
	if err != nil {
		return nil, err
	}
	return &player, nil
}

func (s *MongoStore) UpdatePlayer(ctx context.Context, id primitive.ObjectID, update bson.M) error {
	update["updated_at"] = time.Now()
	_, err := s.Players().UpdateOne(ctx, bson.M{"_id": id}, bson.M{"$set": update})
	return err
}

// Character operations
func (s *MongoStore) CreateCharacter(ctx context.Context, char *Character) error {
	char.ID = primitive.NewObjectID()
	char.CreatedAt = time.Now()
	char.UpdatedAt = time.Now()
	_, err := s.Characters().InsertOne(ctx, char)
	return err
}

func (s *MongoStore) GetCharacterByID(ctx context.Context, id primitive.ObjectID) (*Character, error) {
	var char Character
	err := s.Characters().FindOne(ctx, bson.M{"_id": id}).Decode(&char)
	if err != nil {
		return nil, err
	}
	return &char, nil
}

func (s *MongoStore) GetCharactersByPlayerID(ctx context.Context, playerID primitive.ObjectID) ([]*Character, error) {
	cursor, err := s.Characters().Find(ctx, bson.M{"player_id": playerID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var chars []*Character
	if err := cursor.All(ctx, &chars); err != nil {
		return nil, err
	}
	return chars, nil
}

func (s *MongoStore) UpdateCharacter(ctx context.Context, id primitive.ObjectID, update bson.M) error {
	update["updated_at"] = time.Now()
	_, err := s.Characters().UpdateOne(ctx, bson.M{"_id": id}, bson.M{"$set": update})
	return err
}

// GameEvent operations
func (s *MongoStore) CreateEvent(ctx context.Context, event *GameEvent) error {
	event.ID = primitive.NewObjectID()
	event.Timestamp = time.Now()
	_, err := s.Events().InsertOne(ctx, event)
	return err
}

func (s *MongoStore) GetEventsByCharacterID(ctx context.Context, charID primitive.ObjectID, limit int64) ([]*GameEvent, error) {
	opts := options.Find().SetSort(bson.D{{Key: "timestamp", Value: -1}}).SetLimit(limit)
	cursor, err := s.Events().Find(ctx, bson.M{"character_id": charID}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var events []*GameEvent
	if err := cursor.All(ctx, &events); err != nil {
		return nil, err
	}
	return events, nil
}

// ChatMessage operations
func (s *MongoStore) CreateChatMessage(ctx context.Context, msg *ChatMessage) error {
	msg.ID = primitive.NewObjectID()
	msg.Timestamp = time.Now()
	_, err := s.ChatMessages().InsertOne(ctx, msg)
	return err
}

func (s *MongoStore) GetChatMessages(ctx context.Context, charID primitive.ObjectID, limit int64) ([]*ChatMessage, error) {
	opts := options.Find().SetSort(bson.D{{Key: "timestamp", Value: -1}}).SetLimit(limit)
	cursor, err := s.ChatMessages().Find(ctx, bson.M{"character_id": charID}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var msgs []*ChatMessage
	if err := cursor.All(ctx, &msgs); err != nil {
		return nil, err
	}
	return msgs, nil
}

// Session operations
func (s *MongoStore) CreateSession(ctx context.Context, session *Session) error {
	session.ID = primitive.NewObjectID().Hex()
	session.StartedAt = time.Now()
	session.LastActive = time.Now()
	session.Status = "active"
	_, err := s.Sessions().InsertOne(ctx, session)
	return err
}

func (s *MongoStore) UpdateSessionActive(ctx context.Context, id primitive.ObjectID) error {
	_, err := s.Sessions().UpdateOne(ctx, bson.M{"_id": id}, bson.M{
		"$set": bson.M{
			"last_active": time.Now(),
		},
	})
	return err
}

func (s *MongoStore) CloseSession(ctx context.Context, id primitive.ObjectID) error {
	now := time.Now()
	_, err := s.Sessions().UpdateOne(ctx, bson.M{"_id": id}, bson.M{
		"$set": bson.M{
			"status":    "closed",
			"ended_at": now,
		},
	})
	return err
}

func (s *MongoStore) GetActiveSession(ctx context.Context, charID primitive.ObjectID) (*Session, error) {
	var session Session
	err := s.Sessions().FindOne(ctx, bson.M{
		"character_id": charID,
		"status":       "active",
	}).Decode(&session)
	if err != nil {
		return nil, err
	}
	return &session, nil
}
