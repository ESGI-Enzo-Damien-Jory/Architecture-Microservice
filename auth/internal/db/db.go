package db

import (
    "database/sql"
    "fmt"
    "os"

    _ "github.com/lib/pq"
)

func OpenDB() (*sql.DB, error) {
    dsn := os.Getenv("DATABASE_URL")
    if dsn == "" {
        return nil, fmt.Errorf("environment variable DATABASE_URL is not set")
    }
    db, err := sql.Open("postgres", dsn)
    if err != nil {
        return nil, fmt.Errorf("sql.Open error: %w", err)
    }
    if err := db.Ping(); err != nil {
        db.Close()
        return nil, fmt.Errorf("db.Ping error: %w", err)
    }
    return db, nil
}
