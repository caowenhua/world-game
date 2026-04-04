package main

import (
	"flag"
	"log"
	"os"

	"github.com/aiworld/game-full/internal/server"
)

func main() {
	addr := flag.String("addr", ":8080", "server address")
	mongoURI := flag.String("mongo", "mongodb://localhost:27017", "MongoDB URI")
	dbName := flag.String("db", "aiworld", "database name")
	jwtSecret := flag.String("jwt-secret", "your-secret-key-change-in-production", "JWT secret")
	aiKey := flag.String("ai-key", os.Getenv("MINIMAX_API_KEY"), "AI API key")
	aiURL := flag.String("ai-url", "https://api.minimax.chat", "AI API URL")
	aiModel := flag.String("ai-model", "MiniMax-Text-01", "AI model")

	flag.Parse()

	log.Printf("Starting AI World Game Server...")
	log.Printf("Address: %s", *addr)
	log.Printf("MongoDB: %s", *mongoURI)
	log.Printf("Database: %s", *dbName)

	srv, err := server.NewServer(*mongoURI, *dbName, *jwtSecret, *aiKey, *aiURL, *aiModel)
	if err != nil {
		log.Fatalf("Failed to create server: %v", err)
	}

	if err := srv.Start(*addr); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
