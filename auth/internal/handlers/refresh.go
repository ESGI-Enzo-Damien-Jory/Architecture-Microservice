package handlers

import (
    "database/sql"
    "encoding/json"
    "log"
    "net/http"
    "time"

    "auth/internal/jwt"
    "auth/internal/models"
)

// RefreshHandler handles issuing a new access token given a valid refresh token.
func RefreshHandler(db *sql.DB) http.HandlerFunc {
    type request struct {
        RefreshToken string `json:"refresh_token"`
    }
    type response struct {
        AccessToken string `json:"access_token"`
    }

    return func(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
            http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
            return
        }

        var req request
        if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
            log.Printf("refresh: decode error: %v", err)
            http.Error(w, "invalid JSON", http.StatusBadRequest)
            return
        }

        userID, err := models.ValidateRefreshToken(db, req.RefreshToken)
        if err != nil {
            if err == sql.ErrNoRows {
                http.Error(w, "invalid refresh token", http.StatusUnauthorized)
                return
            }
            log.Printf("refresh: validate token error: %v", err)
            http.Error(w, "server error", http.StatusInternalServerError)
            return
        }

        // revoke old token asynchronously
        go func() {
            if err := models.RevokeRefreshToken(db, req.RefreshToken); err != nil {
                log.Printf("refresh: revoke token error: %v", err)
            }
        }()

        accessToken, err := jwt.GenerateToken(userID, "", 15*time.Minute)
        if err != nil {
            log.Printf("refresh: generate token error: %v", err)
            http.Error(w, "token error", http.StatusInternalServerError)
            return
        }

        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(response{AccessToken: accessToken})
    }
}
