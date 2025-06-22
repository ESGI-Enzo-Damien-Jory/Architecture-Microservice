package handlers

import (
    "database/sql"
    "encoding/json"
    "log"
    "net/http"

    "auth/internal/models"
)

// SignupHandler handles user registration
func SignupHandler(db *sql.DB) http.HandlerFunc {
    type request struct {
        Email    string `json:"email"`
        FullName string `json:"full_name"`
        Password string `json:"password"`
        Role     string `json:"role"`
    }
    return func(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
            http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
            return
        }
        var req request
        if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
            log.Printf("signup decode error: %v", err)
            http.Error(w, "invalid JSON", http.StatusBadRequest)
            return
        }
        if req.Email == "" || req.Password == "" || req.FullName == "" {
            http.Error(w, "missing required fields", http.StatusBadRequest)
            return
        }
        if req.Role == "" {
            req.Role = "client"
        }
        if err := models.CreateUser(db, req.Email, req.FullName, req.Password, req.Role); err != nil {
            log.Printf("CreateUser error: %v", err)
            http.Error(w, "could not create user", http.StatusBadRequest)
            return
        }
        w.WriteHeader(http.StatusCreated)
        json.NewEncoder(w).Encode(map[string]string{"message": "user created"})
    }
}