package config

import (
	"database/sql"
	"log"
	"os"

	_ "github.com/lib/pq"
)

var DB *sql.DB

func InitPostgres() {
	var err error
	DB, err = sql.Open("postgres", os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatalf("Failed to connect to PostgreSQL: %v", err)
	}

	err = DB.Ping()
	if err != nil {
		log.Fatalf("PostgreSQL unreachable: %v", err)
	}

	log.Println("✅ Connected to PostgreSQL")
}
