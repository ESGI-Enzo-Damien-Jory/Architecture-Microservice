package handlers

import (
    "database/sql"
    "encoding/json"
    "net/http"
    "time"

    "auth/internal/models"
    "auth/internal/jwt"
)

func LoginHandler(db *sql.DB) http.HandlerFunc {
    type reqBody struct {
        Email    string `json:"email"`
        Password string `json:"password"`
    }
    type respBody struct {
        AccessToken  string `json:"access_token"`
        RefreshToken string `json:"refresh_token"`
    }
    return func(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
            http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
            return
        }
        var req reqBody
        if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
            http.Error(w, "invalid JSON", http.StatusBadRequest)
            return
        }
        user, hash, err := models.GetUserByEmail(db, req.Email)
        if err != nil || !models.CheckPassword(hash, req.Password) {
            http.Error(w, "invalid credentials", http.StatusUnauthorized)
            return
        }
        accessToken, err := jwt.GenerateToken(user.ID, user.Role, 15*time.Minute)
        if err != nil {
            http.Error(w, "token error", http.StatusInternalServerError)
            return
        }
        refreshToken, err := jwt.GenerateToken(user.ID, user.Role, 7*24*time.Hour)
        if err != nil {
            http.Error(w, "token error", http.StatusInternalServerError)
            return
        }
        expiresAt := time.Now().Add(7 * 24 * time.Hour)
        if err := models.StoreRefreshToken(db, user.ID, refreshToken, expiresAt); err != nil {
            http.Error(w, "token store error", http.StatusInternalServerError)
            return
        }
        json.NewEncoder(w).Encode(respBody{AccessToken: accessToken, RefreshToken: refreshToken})
    }
}
