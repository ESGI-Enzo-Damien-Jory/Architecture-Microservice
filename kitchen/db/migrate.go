package db

import (
	"database/sql"
	"log"

	_ "github.com/lib/pq"
)

var DB *sql.DB

func Connect() {
	var err error
	connStr := "postgres://user:password@localhost:5432/kitchen_db?sslmode=disable"
	DB, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal("Error connecting to DB:", err)
	}

	err = DB.Ping()
	if err != nil {
		log.Fatal("Can't ping DB:", err)
	}
}
