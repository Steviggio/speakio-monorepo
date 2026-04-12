package main

import (
	"fmt"
	"log"
	"os"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env file if present (non-fatal if missing).
	_ = godotenv.Load()

	if len(os.Args) < 2 {
		fmt.Println("Usage: migrate <up|down|version>")
		os.Exit(1)
	}

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL is required")
	}

	m, err := migrate.New("file://migrations", databaseURL)
	if err != nil {
		log.Fatalf("failed to create migrate instance: %v", err)
	}
	defer m.Close()

	switch os.Args[1] {
	case "up":
		if err := m.Up(); err != nil && err != migrate.ErrNoChange {
			log.Fatalf("migration up failed: %v", err)
		}
		fmt.Println("migrations applied successfully")

	case "down":
		if err := m.Down(); err != nil && err != migrate.ErrNoChange {
			log.Fatalf("migration down failed: %v", err)
		}
		fmt.Println("migrations rolled back successfully")

	case "version":
		version, dirty, err := m.Version()
		if err != nil {
			log.Fatalf("failed to get version: %v", err)
		}
		fmt.Printf("version: %d, dirty: %v\n", version, dirty)

	default:
		fmt.Printf("unknown command: %s\n", os.Args[1])
		os.Exit(1)
	}
}
