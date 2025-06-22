package main

import (
    "fmt"
    "log"
    "net/http"
    "os"

    "auth/internal/db"
    "auth/internal/handlers"
)

func main() {
    log.Println("Starting Auth service…")

    database, err := db.OpenDB()
    if err != nil {
        log.Fatalf("db connection failed: %v", err)
    }
    defer database.Close()

    http.HandleFunc("/health", handlers.HealthHandler)
    http.HandleFunc("/signup", handlers.SignupHandler(database))
    http.HandleFunc("/login", handlers.LoginHandler(database))
    http.HandleFunc("/refresh", handlers.RefreshHandler(database))

    port := os.Getenv("AUTH_PORT")
    if port == "" {
        port = "5000"
    }
    addr := fmt.Sprintf(":%s", port)
    log.Printf("Auth service listening on %s", addr)
    if err := http.ListenAndServe(addr, nil); err != nil {
        log.Fatalf("server failed: %v", err)
    }
}
